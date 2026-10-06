import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: {
    icon?: keyof typeof Ionicons.glyphMap;
    label?: string;
    onPress: () => void;
  };
  rightElement?: React.ReactNode;
  backAction?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  rightAction,
  rightElement,
  backAction,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {backAction && (
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.cardMuted }]}
            onPress={backAction}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
        )}

        <View style={styles.titlesContainer}>
          {subtitle && (
            <Text style={[typography.subhead, { color: colors.textSecondary, marginBottom: 2 }]}>
              {subtitle}
            </Text>
          )}
          <Text style={[typography.largeTitle, { color: colors.text }]}>{title}</Text>
        </View>

        {rightElement ? (
          <View style={styles.rightElementContainer}>
            {rightElement}
          </View>
        ) : rightAction ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.cardMuted }]}
            onPress={rightAction.onPress}
            activeOpacity={0.7}
          >
            {rightAction.icon ? (
              <Ionicons name={rightAction.icon} size={20} color={colors.accent} />
            ) : (
              <Text style={[typography.callout, { color: colors.accent, fontWeight: '600' }]}>
                {rightAction.label}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titlesContainer: {
    flex: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  actionButton: {
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  rightElementContainer: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
