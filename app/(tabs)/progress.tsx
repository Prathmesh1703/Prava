import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useApp } from '../../src/context/AppContext';
import {
  ScreenContainer,
  Header,
  SectionHeader,
  Card,
  WeightChart,
  PhotoCard,
  PhotoComparisonModal,
  QuickWeightModal,
  PhotoCaptureModal,
  PinInput,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
} from '../../src/components';
import { ProgressPhoto } from '../../src/types';
import { typography } from '../../src/theme/typography';
import { radius, spacing } from '../../src/theme/spacing';

export default function ProgressScreen() {
  const { colors, isDark } = useTheme();
  const {
    weights,
    currentWeight,
    weightDelta,
    profile,
    photos,
    privatePhotosEnabled,
    setPrivatePhotosEnabled,
    isPrivateUnlocked,
    unlockPrivate,
    lockPrivate,
    isPinSetup,
    setupPin,
  } = useApp();

  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  // Photo comparison state
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);

  // Private Photos Unlock / Setup Modal
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [unlockPinError, setUnlockPinError] = useState<string | null>(null);
  const [setupPinVal, setSetupPinVal] = useState('');
  const [setupConfirmVal, setSetupConfirmVal] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const handleUnlockPin = async (pin: string) => {
    setUnlockPinError(null);
    const ok = await unlockPrivate(pin);
    if (ok) {
      triggerHaptic();
      setUnlockModalVisible(false);
    } else {
      triggerHaptic();
      setUnlockPinError('Incorrect PIN. Please try again.');
    }
  };

  const handleSetupPinInModal = async () => {
    setSetupError(null);
    if (setupPinVal.length !== 4) {
      setSetupError('PIN must be 4 digits.');
      return;
    }
    if (setupPinVal !== setupConfirmVal) {
      setSetupError('PINs do not match.');
      return;
    }
    const ok = await setupPin(setupPinVal);
    if (ok) {
      triggerHaptic();
      await setPrivatePhotosEnabled(true);
      setUnlockModalVisible(false);
      setSetupPinVal('');
      setSetupConfirmVal('');
    } else {
      setSetupError('Failed to save PIN.');
    }
  };

  const handleToggleCompareSelection = (photoId: string) => {
    triggerHaptic();
    setSelectedPhotoIds((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId);
      }
      if (prev.length >= 2) {
        return [prev[1], photoId];
      }
      return [...prev, photoId];
    });
  };

  const handleStartCompare = () => {
    if (selectedPhotoIds.length === 2) {
      setComparisonModalVisible(true);
    }
  };

  const selectedPhotos = selectedPhotoIds
    .map((id) => photos.find((p) => p.id === id))
    .filter(Boolean) as ProgressPhoto[];

  const sortedSelected = [...selectedPhotos].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const isPhotosLocked = privatePhotosEnabled && !isPrivateUnlocked;

  return (
    <ScreenContainer>
      <Header
        title="Progress"
        subtitle="Metrics & Photos"
      />

      {/* METRICS SUMMARY CARD */}
      <Card elevated style={styles.metricsCard}>
        <View style={styles.metricsRow}>
          {/* Weight */}
          <View style={styles.metricCol}>
            <Text style={[typography.captionBold, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
              Current Weight
            </Text>
            <View style={styles.metricValRow}>
              <Text style={[typography.metricLarge, { color: colors.text }]}>
                {currentWeight > 0 ? currentWeight.toFixed(1) : '--'}
              </Text>
              <Text style={[typography.headline, { color: colors.textSecondary, marginLeft: 2, marginBottom: 4, alignSelf: 'flex-end' }]}>
                kg
              </Text>
            </View>
            <Text
              style={[
                typography.captionBold,
                {
                  color:
                    weightDelta > 0
                      ? colors.accent
                      : weightDelta < 0
                      ? colors.success
                      : colors.textSecondary,
                  marginTop: 2,
                },
              ]}
            >
              {weightDelta === 0
                ? 'No change'
                : `${weightDelta > 0 ? '+' : ''}${weightDelta} kg`}
            </Text>
          </View>

          <View style={[styles.metricDivider, { backgroundColor: isDark ? colors.border : colors.borderSubtle }]} />

          {/* Height */}
          <View style={styles.metricCol}>
            <Text style={[typography.captionBold, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
              Height
            </Text>
            <View style={styles.metricValRow}>
              <Text style={[typography.metricLarge, { color: colors.text }]}>
                {profile.heightCm}
              </Text>
              <Text style={[typography.headline, { color: colors.textSecondary, marginLeft: 2, marginBottom: 4, alignSelf: 'flex-end' }]}>
                cm
              </Text>
            </View>
            <Text style={[typography.captionBold, { color: colors.textTertiary, marginTop: 2 }]}>
              {(() => {
                const totalInches = profile.heightCm / 2.54;
                const feet = Math.floor(totalInches / 12);
                const inches = Math.round(totalInches % 12);
                return `${feet}' ${inches}"`;
              })()}
            </Text>
          </View>
        </View>
      </Card>

      {/* WEIGHT CHART WITH INTERACTIVE BARS */}
      <WeightChart entries={weights} />

      {/* PROGRESS PHOTOS HEADER & CONTROLS */}
      <View style={styles.photosSectionHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[typography.title2, { color: colors.text }]}>
            Progress Photos
          </Text>
          {privatePhotosEnabled && (
            <View style={[styles.privateIndicatorBadge, { backgroundColor: isPrivateUnlocked ? colors.successLight : colors.accentLight }]}>
              <Ionicons
                name={isPrivateUnlocked ? 'lock-open' : 'lock-closed'}
                size={11}
                color={isPrivateUnlocked ? colors.success : colors.accent}
              />
              <Text
                style={[
                  typography.captionBold,
                  {
                    color: isPrivateUnlocked ? colors.success : colors.accent,
                    marginLeft: 3,
                    fontSize: 10,
                  },
                ]}
              >
                {isPrivateUnlocked ? 'Unlocked' : 'Private'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.photoActionsGroup}>
          {/* Privacy Toggle / Lock Actions */}
          {privatePhotosEnabled ? (
            isPrivateUnlocked ? (
              <TouchableOpacity
                style={[styles.actionChipBtn, { backgroundColor: colors.cardMuted }]}
                onPress={() => {
                  triggerHaptic();
                  lockPrivate();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="lock-closed" size={13} color={colors.accent} />
                <Text style={[typography.captionBold, { color: colors.accent, marginLeft: 3 }]}>
                  Lock
                </Text>
              </TouchableOpacity>
            ) : null
          ) : (
            <TouchableOpacity
              style={[styles.actionChipBtn, { backgroundColor: colors.cardMuted }]}
              onPress={async () => {
                triggerHaptic();
                if (!isPinSetup) {
                  setUnlockModalVisible(true);
                } else {
                  await setPrivatePhotosEnabled(true);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="eye-off-outline" size={13} color={colors.textSecondary} />
              <Text style={[typography.captionBold, { color: colors.textSecondary, marginLeft: 3 }]}>
                Hide
              </Text>
            </TouchableOpacity>
          )}

          {/* Compare Button (when photos are visible and >= 2 exist) */}
          {!isPhotosLocked && photos.length >= 2 && (
            <TouchableOpacity
              style={[
                styles.actionChipBtn,
                {
                  backgroundColor: isCompareMode ? colors.accentLight : colors.cardMuted,
                  borderColor: isCompareMode ? colors.accent : 'transparent',
                },
              ]}
              onPress={() => {
                triggerHaptic();
                setIsCompareMode(!isCompareMode);
                if (isCompareMode) {
                  setSelectedPhotoIds([]);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="git-compare-outline"
                size={13}
                color={isCompareMode ? colors.accent : colors.text}
              />
              <Text
                style={[
                  typography.captionBold,
                  {
                    color: isCompareMode ? colors.accent : colors.text,
                    marginLeft: 3,
                  },
                ]}
              >
                {isCompareMode ? 'Done' : 'Compare'}
              </Text>
            </TouchableOpacity>
          )}

          {/* + Add Photo Camera Button (always enabled if unlocked or not private) */}
          {!isPhotosLocked && (
            <TouchableOpacity
              style={[styles.addPhotoBtn, { backgroundColor: colors.accent }]}
              onPress={() => {
                triggerHaptic();
                setPhotoModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={14} color="#FFFFFF" />
              <Text style={[typography.captionBold, { color: '#FFFFFF', marginLeft: 4 }]}>
                + Photo
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* PROTECTED PHOTOS LOCKED CARD (shown when private mode is ON and locked) */}
      {isPhotosLocked ? (
        <Card elevated style={styles.protectedPhotosCard}>
          <View style={[styles.lockCircle, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="lock-closed" size={32} color={colors.accent} />
          </View>
          <Text style={[typography.title2, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]}>
            Progress Photos Protected
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 4, maxWidth: 290, fontSize: 13, lineHeight: 18 }]}>
            Your physique progress photos are protected in your private section. Enter your PIN to view or compare.
          </Text>

          <PrimaryButton
            title="Unlock with PIN"
            onPress={() => {
              triggerHaptic();
              setUnlockModalVisible(true);
            }}
            icon={<Ionicons name="key-outline" size={16} color="#FFFFFF" />}
            style={{ marginTop: spacing.lg, minWidth: 170 }}
          />

          <TouchableOpacity
            style={{ marginTop: spacing.md }}
            onPress={async () => {
              triggerHaptic();
              await setPrivatePhotosEnabled(false);
            }}
          >
            <Text style={[typography.captionBold, { color: colors.textTertiary, fontSize: 11 }]}>
              Disable Private Photos
            </Text>
          </TouchableOpacity>
        </Card>
      ) : (
        /* UNLOCKED / PUBLIC PHOTOS CONTENT */
        <>
          {isCompareMode && (
            <View style={[styles.compareInstructionBanner, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="information-circle" size={18} color={colors.accent} />
              <Text style={[typography.captionBold, { color: isDark ? colors.accentDark : colors.accent, marginLeft: 6, flex: 1 }]}>
                Select 2 photos to compare Before & After ({selectedPhotoIds.length}/2 selected)
              </Text>
              {selectedPhotoIds.length === 2 && (
                <TouchableOpacity
                  style={[styles.compareActionBtn, { backgroundColor: colors.accent }]}
                  onPress={handleStartCompare}
                >
                  <Text style={[typography.captionBold, { color: '#FFFFFF' }]}>
                    View Comparison
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {photos.length === 0 ? (
            <EmptyState
              icon="images-outline"
              title="No progress photos yet"
              description="Capture your first progress photo to start tracking your physique transformations."
              actionTitle="Take Progress Photo"
              onAction={() => setPhotoModalVisible(true)}
            />
          ) : (
            photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isCompareMode={isCompareMode}
                isSelectedForCompare={selectedPhotoIds.includes(photo.id)}
                onPress={() => {
                  if (isCompareMode) {
                    handleToggleCompareSelection(photo.id);
                  } else {
                    setIsCompareMode(true);
                    setSelectedPhotoIds([photo.id]);
                  }
                }}
                onToggleCompare={() => handleToggleCompareSelection(photo.id)}
              />
            ))
          )}
        </>
      )}

      {/* UNLOCK / SETUP PIN MODAL */}
      <Modal
        visible={unlockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUnlockModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.lockCircle, { backgroundColor: colors.accentLight }]}>
                <Ionicons name={isPinSetup ? 'lock-closed' : 'key'} size={28} color={colors.accent} />
              </View>
              <Text style={[typography.title2, { color: colors.text, marginTop: spacing.sm, textAlign: 'center' }]}>
                {isPinSetup ? 'Unlock Photos' : 'Set PIN for Photos'}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 2, marginBottom: spacing.md }]}>
                {isPinSetup
                  ? 'Enter your 4-digit PIN to access progress photos'
                  : 'Create a 4-digit PIN to secure your progress photos'}
              </Text>

              {isPinSetup ? (
                <PinInput onComplete={handleUnlockPin} error={unlockPinError} />
              ) : (
                <View style={{ width: '100%' }}>
                  <Text style={[typography.captionBold, { color: colors.textSecondary, marginBottom: 4, textTransform: 'uppercase', fontSize: 10 }]}>
                    New 4-Digit PIN
                  </Text>
                  <TextInput
                    value={setupPinVal}
                    onChangeText={(t) => setSetupPinVal(t.replace(/[^0-9]/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    secureTextEntry
                    placeholder="••••"
                    placeholderTextColor={colors.textTertiary}
                    maxLength={4}
                    style={[typography.title2, styles.modalPinInput, { backgroundColor: colors.cardMuted, color: colors.text, borderColor: isDark ? colors.border : colors.borderSubtle }]}
                  />

                  <Text style={[typography.captionBold, { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: 4, textTransform: 'uppercase', fontSize: 10 }]}>
                    Confirm PIN
                  </Text>
                  <TextInput
                    value={setupConfirmVal}
                    onChangeText={(t) => setSetupConfirmVal(t.replace(/[^0-9]/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    secureTextEntry
                    placeholder="••••"
                    placeholderTextColor={colors.textTertiary}
                    maxLength={4}
                    style={[typography.title2, styles.modalPinInput, { backgroundColor: colors.cardMuted, color: colors.text, borderColor: isDark ? colors.border : colors.borderSubtle }]}
                  />

                  {setupError && (
                    <Text style={[typography.captionBold, { color: colors.danger, textAlign: 'center', marginTop: spacing.xs }]}>
                      {setupError}
                    </Text>
                  )}

                  <PrimaryButton
                    title="Save PIN & Enable"
                    onPress={handleSetupPinInModal}
                    disabled={setupPinVal.length !== 4 || setupConfirmVal.length !== 4}
                    style={{ marginTop: spacing.md }}
                  />
                </View>
              )}

              <SecondaryButton
                title="Cancel"
                onPress={() => {
                  setUnlockPinError(null);
                  setSetupError(null);
                  setUnlockModalVisible(false);
                }}
                style={{ width: '100%', marginTop: spacing.sm }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modals */}
      <QuickWeightModal
        visible={weightModalVisible}
        onClose={() => setWeightModalVisible(false)}
      />

      <PhotoCaptureModal
        visible={photoModalVisible}
        onClose={() => setPhotoModalVisible(false)}
      />

      <PhotoComparisonModal
        visible={comparisonModalVisible}
        photoBefore={sortedSelected[0] || null}
        photoAfter={sortedSelected[1] || null}
        onClose={() => setComparisonModalVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  metricsCard: {
    marginVertical: spacing.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  metricDivider: {
    width: 1,
    height: '75%',
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xxs,
  },
  photosSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  privateIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginLeft: spacing.xs,
  },
  photoActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.2,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  protectedPhotosCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  lockCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compareInstructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  compareActionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginLeft: spacing.xs,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
  },
  modalPinInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 20,
  },
});
