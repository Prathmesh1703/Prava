import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface PinInputProps {
  pinLength?: number;
  onComplete: (pin: string) => void;
  error?: string | null;
  clearOnError?: boolean;
}

export const PinInput: React.FC<PinInputProps> = ({
  pinLength = 4,
  onComplete,
  error,
  clearOnError = true,
}) => {
  const { colors, isDark } = useTheme();
  const [pin, setPin] = useState<string>('');
  const [showVirtualKeypad, setShowVirtualKeypad] = useState<boolean>(false);
  const inputRef = useRef<TextInput>(null);

  // Auto focus with slight delay for modal animations
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!showVirtualKeypad) {
        inputRef.current?.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [showVirtualKeypad]);

  useEffect(() => {
    if (error && clearOnError) {
      setPin('');
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) {}
      }
    }
  }, [error, clearOnError]);

  const handleInputDigit = (digit: string) => {
    if (pin.length < pinLength) {
      const next = pin + digit;
      setPin(next);
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {}
      }
      if (next.length === pinLength) {
        onComplete(next);
      }
    }
  };

  const handleDeleteDigit = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {}
      }
    }
  };

  const handleChangeText = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, pinLength);
    setPin(cleaned);

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }

    if (cleaned.length === pinLength) {
      onComplete(cleaned);
    }
  };

  const handleFocus = () => {
    if (!showVirtualKeypad) {
      inputRef.current?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {/* Tappable PIN Bubbles */}
      <TouchableOpacity
        style={styles.bubblesContainer}
        onPress={handleFocus}
        activeOpacity={0.9}
      >
        {/* Invisible native input for default keyboard */}
        <TextInput
          ref={inputRef}
          value={pin}
          onChangeText={handleChangeText}
          maxLength={pinLength}
          keyboardType="number-pad"
          caretHidden
          secureTextEntry
          autoFocus={!showVirtualKeypad}
          style={styles.invisibleInput}
        />

        {Array.from({ length: pinLength }).map((_, index) => {
          const isFilled = index < pin.length;
          const isCurrent = index === pin.length;

          return (
            <View
              key={index}
              style={[
                styles.bubble,
                {
                  backgroundColor: isFilled
                    ? colors.accent
                    : isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                  borderColor: error
                    ? colors.danger
                    : isCurrent
                    ? colors.accent
                    : isDark
                    ? colors.border
                    : colors.borderSubtle,
                },
              ]}
            >
              {isFilled && <View style={styles.innerDot} />}
            </View>
          );
        })}
      </TouchableOpacity>

      {error ? (
        <Text style={[typography.captionBold, { color: colors.danger, marginTop: spacing.sm, textAlign: 'center' }]}>
          {error}
        </Text>
      ) : null}

      {/* Subtle button to toggle on-screen keypad on demand */}
      <TouchableOpacity
        style={[styles.keypadToggleBtn, { backgroundColor: colors.cardMuted }]}
        onPress={() => {
          if (!showVirtualKeypad) {
            inputRef.current?.blur();
          } else {
            inputRef.current?.focus();
          }
          setShowVirtualKeypad(!showVirtualKeypad);
        }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={showVirtualKeypad ? 'keypad' : 'keypad-outline'}
          size={14}
          color={colors.textSecondary}
        />
        <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 6 }]}>
          {showVirtualKeypad ? 'Hide On-Screen Keys' : 'Use On-Screen Keypad'}
        </Text>
      </TouchableOpacity>

      {/* Optional Minimal On-Screen Keypad */}
      {showVirtualKeypad && (
        <View style={styles.keypadContainer}>
          <View style={styles.keypadRow}>
            {[1, 2, 3].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.keypadKey,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
                onPress={() => handleInputDigit(String(num))}
                activeOpacity={0.6}
              >
                <Text style={[typography.title1, { color: colors.text }]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            {[4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.keypadKey,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
                onPress={() => handleInputDigit(String(num))}
                activeOpacity={0.6}
              >
                <Text style={[typography.title1, { color: colors.text }]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            {[7, 8, 9].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.keypadKey,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
                onPress={() => handleInputDigit(String(num))}
                activeOpacity={0.6}
              >
                <Text style={[typography.title1, { color: colors.text }]}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            <View style={styles.keypadEmptyKey} />
            <TouchableOpacity
              style={[
                styles.keypadKey,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                },
              ]}
              onPress={() => handleInputDigit('0')}
              activeOpacity={0.6}
            >
              <Text style={[typography.title1, { color: colors.text }]}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.keypadKey,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  borderColor: 'transparent',
                },
              ]}
              onPress={handleDeleteDigit}
              activeOpacity={0.6}
            >
              <Ionicons name="backspace-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.md,
    width: '100%',
  },
  bubblesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    position: 'relative',
    paddingVertical: spacing.sm,
    width: '100%',
  },
  invisibleInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    zIndex: 10,
  },
  bubble: {
    width: 48,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  keypadToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 270,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keypadKey: {
    width: 68,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadEmptyKey: {
    width: 68,
    height: 52,
  },
});
