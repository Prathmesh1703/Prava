import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const triggerHaptic = () => {
  if (Platform.OS !== 'web') {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // ignore
    }
  }
};

export const PrimaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  size = 'md',
}) => {
  const { colors } = useTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    triggerHaptic();
    onPress();
  };

  const getPadding = () => {
    if (size === 'sm') return { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md };
    if (size === 'lg') return { paddingVertical: spacing.md + 2, paddingHorizontal: spacing.xl };
    return { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.lg };
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[{ borderRadius: radius.md, overflow: 'hidden' }, style]}
    >
      {disabled ? (
        <View
          style={[
            styles.baseButton,
            getPadding(),
            {
              backgroundColor: colors.border,
              opacity: 0.6,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              {icon}
              <Text
                style={[
                  typography.headline,
                  { color: '#FFFFFF', fontWeight: '600', marginLeft: icon ? spacing.xs : 0 },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </>
          )}
        </View>
      ) : (
        <LinearGradient
          colors={['#FF6A1F', '#EB570E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.baseButton, getPadding()]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              {icon}
              <Text
                style={[
                  typography.headline,
                  { color: '#FFFFFF', fontWeight: '700', marginLeft: icon ? spacing.xs : 0 },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  size = 'md',
}) => {
  const { colors, isDark } = useTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    triggerHaptic();
    onPress();
  };

  const getPadding = () => {
    if (size === 'sm') return { paddingVertical: spacing.xs, paddingHorizontal: spacing.md };
    if (size === 'lg') return { paddingVertical: spacing.md + 2, paddingHorizontal: spacing.xl };
    return { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg };
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        getPadding(),
        {
          backgroundColor: colors.cardMuted,
          borderWidth: 1,
          borderColor: isDark ? colors.border : colors.borderSubtle,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              typography.headline,
              { color: colors.text, fontWeight: '600', marginLeft: icon ? spacing.xs : 0 },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export const GhostButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const { colors } = useTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    triggerHaptic();
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.ghostButton, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.6}
    >
      {loading ? (
        <ActivityIndicator color={colors.accent} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              typography.callout,
              { color: colors.accent, fontWeight: '600', marginLeft: icon ? spacing.xs : 0 },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ghostButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
