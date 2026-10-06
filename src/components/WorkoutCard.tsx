import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Workout } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Card } from './Card';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface WorkoutCardProps {
  workout: Workout;
  onPress?: () => void;
  onDelete?: () => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onLongPress?: () => void;
  onToggleSelect?: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  onPress,
  onDelete,
  isSelectMode = false,
  isSelected = false,
  onLongPress,
  onToggleSelect,
}) => {
  const { colors, isDark } = useTheme();

  const formatDate = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr === todayStr) return 'Today';

    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
    });
  };

  const handlePress = () => {
    if (isSelectMode && onToggleSelect) {
      onToggleSelect();
    } else if (onPress) {
      onPress();
    }
  };

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }
    if (onLongPress) {
      onLongPress();
    }
  };

  return (
    <Card
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={[
        styles.cardContainer,
        isSelected && {
          borderColor: colors.accent,
          borderWidth: 1.5,
          backgroundColor: colors.accentLight,
        },
      ]}
      padding="md"
    >
      <View style={styles.row}>
        {/* Multi-selection Checkbox Indicator */}
        {isSelectMode && (
          <TouchableOpacity
            style={[
              styles.checkCircle,
              {
                borderColor: isSelected ? colors.accent : colors.textTertiary,
                backgroundColor: isSelected ? colors.accent : 'transparent',
              },
            ]}
            onPress={onToggleSelect}
          >
            {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </TouchableOpacity>
        )}

        <View style={styles.dateBox}>
          <Text style={[typography.subhead, { color: colors.textSecondary, fontWeight: '600' }]}>
            {formatDate(workout.date)}
          </Text>
        </View>

        <View style={styles.infoCol}>
          <View style={styles.musclesWrap}>
            <Text style={[typography.headline, { color: colors.text, fontWeight: '600' }]}>
              {workout.muscleGroups.join(' · ')}
            </Text>
          </View>

          {workout.notes && (
            <Text
              style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}
              numberOfLines={2}
            >
              {workout.notes}
            </Text>
          )}
        </View>

        {!isSelectMode && onDelete && (
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: colors.cardMuted }]}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  dateBox: {
    minWidth: 54,
    marginRight: spacing.sm,
  },
  infoCol: {
    flex: 1,
  },
  musclesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
});
