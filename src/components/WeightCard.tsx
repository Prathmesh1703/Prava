import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Card } from './Card';
import { GhostButton, PrimaryButton } from './Buttons';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface WeightCardProps {
  currentWeight: number;
  delta: number;
  previousDate?: string;
  onUpdatePress: () => void;
}

export const WeightCard: React.FC<WeightCardProps> = ({
  currentWeight,
  delta,
  previousDate,
  onUpdatePress,
}) => {
  const { colors, isDark } = useTheme();

  const formattedDelta = () => {
    if (delta === 0) return 'No change';
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta} kg since previous entry`;
  };

  const getDeltaBadgeStyle = () => {
    if (delta > 0) {
      return {
        bg: colors.accentLight,
        text: isDark ? colors.accentDark : colors.accent,
        icon: 'trending-up-outline' as const,
      };
    }
    if (delta < 0) {
      return {
        bg: colors.successLight,
        text: colors.success,
        icon: 'trending-down-outline' as const,
      };
    }
    return {
      bg: colors.cardMuted,
      text: colors.textSecondary,
      icon: 'remove-outline' as const,
    };
  };

  const badge = getDeltaBadgeStyle();

  return (
    <Card elevated style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text
            style={[
              typography.captionBold,
              { color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
            ]}
          >
            Body Weight
          </Text>
          <View style={styles.valueRow}>
            <Text style={[typography.metricLarge, { color: colors.text }]}>
              {currentWeight > 0 ? currentWeight.toFixed(1) : '--'}
            </Text>
            <Text
              style={[
                typography.headline,
                { color: colors.textSecondary, marginLeft: 4, marginBottom: 4, alignSelf: 'flex-end' },
              ]}
            >
              kg
            </Text>
          </View>
        </View>

        <PrimaryButton
          title="Update"
          size="sm"
          onPress={onUpdatePress}
          style={styles.updateBtn}
        />
      </View>

      <View style={[styles.deltaPill, { backgroundColor: badge.bg }]}>
        <Ionicons name={badge.icon} size={14} color={badge.text} style={{ marginRight: 4 }} />
        <Text style={[typography.captionBold, { color: badge.text }]}>
          {formattedDelta()}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },
  updateBtn: {
    minWidth: 80,
  },
  deltaPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
});
