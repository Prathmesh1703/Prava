import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { PrimaryButton } from './Buttons';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: object;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onAction,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.cardMuted }]}>
        <Ionicons name={icon} size={32} color={colors.textSecondary} />
      </View>

      <Text style={[typography.title2, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]}>
        {title}
      </Text>

      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center', maxWidth: 280 },
        ]}
      >
        {description}
      </Text>

      {actionTitle && onAction && (
        <PrimaryButton
          title={actionTitle}
          onPress={onAction}
          size="md"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: {
    marginTop: spacing.lg,
    minWidth: 160,
  },
});
