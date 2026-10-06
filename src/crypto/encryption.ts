/**
 * Encryption utilities for Arova — Phase 2 Security Foundation.
 *
 * Algorithm: AES-256-CBC + HMAC-SHA256 (Encrypt-then-MAC)
 *   - AES-CBC provides confidentiality with a fresh 128-bit IV per operation.
 *   - HMAC-SHA256 over (IV + ciphertext) provides integrity and authenticity,
 *     equivalent in security goal to AES-GCM for this local-storage use case.
 *   - crypto-es v3 is used because it is a pure-JS library requiring no native
 *     modules, fully compatible with Expo SDK 57 Managed Workflow.
 *
 * Key management:
 *   - A 256-bit (32-byte) random encryption key is generated on first run.
 *   - A 256-bit (32-byte) random HMAC key is generated on first run.
 *   - Both keys are stored only in expo-secure-store (OS Keychain / Keystore).
 *   - Keys NEVER appear in SQLite, AsyncStorage, logs, or backups.
 *
 * Usage:
 *   await initEncryptionKeys();        // called once at app startup
 *   const payload = await encryptJson(answers);
 *   const answers = await decryptJson<Record<string,boolean>>(payload);
 */

import { AES, CBC, Pkcs7, Hex, Base64, WordArray, HmacSHA256, Utf8 } from 'crypto-es';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// ─────────────────────────────────────────────────────────────────────────────
// SecureStore keys — these are the keys under which crypto material is stored.
// They must never be logged.
// ─────────────────────────────────────────────────────────────────────────────

const ENC_KEY_STORE  = 'arova_enc_key';   // AES key (hex, 64 chars = 32 bytes)
const HMAC_KEY_STORE = 'arova_hmac_key';  // HMAC key (hex, 64 chars = 32 bytes)

// ─────────────────────────────────────────────────────────────────────────────
// Initialisation
// ─────────────────────────────────────────────────────────────────────────────

let _encKeyHex: string | null = null;
let _hmacKeyHex: string | null = null;

/**
 * Generates and persists the AES + HMAC keys in SecureStore if they don't
 * already exist. Call once during app bootstrap (before any encrypt/decrypt).
 * Subsequent calls are no-ops.
 */
export async function initEncryptionKeys(): Promise<void> {
  // AES key
  let encKey = await SecureStore.getItemAsync(ENC_KEY_STORE);
  if (!encKey) {
    encKey = bytesToHex(Crypto.getRandomValues(new Uint8Array(32)));
    await SecureStore.setItemAsync(ENC_KEY_STORE, encKey);
  }
  _encKeyHex = encKey;

  // HMAC key
  let hmacKey = await SecureStore.getItemAsync(HMAC_KEY_STORE);
  if (!hmacKey) {
    hmacKey = bytesToHex(Crypto.getRandomValues(new Uint8Array(32)));
    await SecureStore.setItemAsync(HMAC_KEY_STORE, hmacKey);
  }
  _hmacKeyHex = hmacKey;
}

async function getEncKey(): Promise<WordArray> {
  if (!_encKeyHex) {
    _encKeyHex = await SecureStore.getItemAsync(ENC_KEY_STORE);
  }
  if (!_encKeyHex) throw new Error('Encryption not initialised. Call initEncryptionKeys() first.');
  return Hex.parse(_encKeyHex);
}

async function getHmacKey(): Promise<WordArray> {
  if (!_hmacKeyHex) {
    _hmacKeyHex = await SecureStore.getItemAsync(HMAC_KEY_STORE);
  }
  if (!_hmacKeyHex) throw new Error('Encryption not initialised. Call initEncryptionKeys() first.');
  return Hex.parse(_hmacKeyHex);
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload type stored in DB columns
// ─────────────────────────────────────────────────────────────────────────────

export interface EncryptedPayload {
  /** AES-CBC ciphertext, base64 */
  ciphertext: string;
  /** 128-bit IV, base64 */
  iv: string;
  /** HMAC-SHA256 over (iv + ciphertext), base64 — integrity check */
  mac: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Encrypt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Serialises `plainObject` to JSON and encrypts it with AES-256-CBC.
 * A fresh random IV is used for every call.
 * The returned payload's three fields map directly to DB columns:
 *   answers_enc → ciphertext
 *   iv          → iv
 *   auth_tag    → mac
 */
export async function encryptJson(plainObject: object): Promise<EncryptedPayload> {
  const encKey  = await getEncKey();
  const hmacKey = await getHmacKey();

  // Fresh 128-bit IV every time
  const ivBytes = Crypto.getRandomValues(new Uint8Array(16));
  const iv      = WordArray.create(ivBytes as unknown as number[]);

  const plaintext  = JSON.stringify(plainObject);
  const encrypted  = AES.encrypt(Utf8.parse(plaintext), encKey, {
    iv,
    mode: CBC,
    padding: Pkcs7,
  });

  const cipherWA = encrypted.ciphertext;
  if (!cipherWA) throw new Error('Encryption produced no ciphertext.');

  const cipherB64 = cipherWA.toString(Base64);
  const ivB64     = iv.toString(Base64);

  // Compute HMAC over iv || ciphertext (Encrypt-then-MAC)
  const macInput = ivB64 + cipherB64;
  const mac      = HmacSHA256(macInput, hmacKey).toString(Base64);

  return { ciphertext: cipherB64, iv: ivB64, mac };
}

// ─────────────────────────────────────────────────────────────────────────────
// Decrypt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifies HMAC integrity, then decrypts and deserialises the payload.
 * Throws a generic error if integrity check fails (never leaks key material).
 */
export async function decryptJson<T>(payload: EncryptedPayload): Promise<T> {
  const encKey  = await getEncKey();
  const hmacKey = await getHmacKey();

  // Verify MAC first — reject tampered / corrupted data before decrypting
  const macInput   = payload.iv + payload.ciphertext;
  const expectedMac = HmacSHA256(macInput, hmacKey).toString(Base64);
  if (!timingSafeEqual(expectedMac, payload.mac)) {
    throw new Error('Decryption failed: integrity check did not pass.');
  }

  const iv        = Base64.parse(payload.iv);
  const cipherWA  = Base64.parse(payload.ciphertext);

  const decrypted = AES.decrypt(
    { ciphertext: cipherWA } as any,
    encKey,
    { iv, mode: CBC, padding: Pkcs7 }
  );

  const plaintext = decrypted.toString(Utf8);
  if (!plaintext) throw new Error('Decryption failed: empty result.');

  return JSON.parse(plaintext) as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time string comparison to prevent timing attacks on the MAC check.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Clears the in-memory key cache.
 * Called when the app goes to background or during tests between runs.
 */
export function clearEncryptionKeyCache(): void {
  _encKeyHex  = null;
  _hmacKeyHex = null;
}
