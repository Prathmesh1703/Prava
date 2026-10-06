import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Card } from './Card';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface ProgressPhotoStatusCardProps {
  lastPhotoDaysAgo: number | null;
  nextPhotoDueDays: number;
  lastPhotoDate?: string;
  onPress: () => void;
  onAddPhotoPress: () => void;
}

export const ProgressPhotoStatusCard: React.FC<ProgressPhotoStatusCardProps> = ({
  lastPhotoDaysAgo,
  nextPhotoDueDays,
  lastPhotoDate,
  onPress,
  onAddPhotoPress,
}) => {
  const { colors, isDark } = useTheme();

  const isDue = nextPhotoDueDays === 0;

  return (
    <Card elevated style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text
          style={[
            typography.captionBold,
            { color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
          ]}
        >
          Progress Photo
        </Text>
        {isDue && (
          <View style={[styles.dueBadge, { backgroundColor: colors.warningLight }]}>
            <Text style={[typography.captionBold, { color: colors.warning }]}>
              Due today
            </Text>
          </View>
        )}
      </View>

      <View style={styles.contentRow}>
        <View style={styles.textContainer}>
          <Text style={[typography.headline, { color: colors.text }]}>
            {lastPhotoDaysAgo !== null
              ? `Last photo ${lastPhotoDaysAgo === 0 ? 'today' : `${lastPhotoDaysAgo} days ago`}`
              : 'No photos logged yet'}
          </Text>
          <Text style={[typography.callout, { color: colors.textSecondary, marginTop: 2 }]}>
            {isDue
              ? 'Your next check-in is due now'
              : `Next photo in ${nextPhotoDueDays} days`}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.cameraIconBtn,
            {
              backgroundColor: isDue ? colors.accent : colors.cardMuted,
            },
          ]}
          onPress={onAddPhotoPress}
          activeOpacity={0.8}
        >
          <Ionicons
            name="camera"
            size={20}
            color={isDue ? '#FFFFFF' : colors.accent}
          />
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dueBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    paddingRight: spacing.md,
  },
  cameraIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
