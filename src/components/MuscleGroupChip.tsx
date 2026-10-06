import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { MuscleGroup } from '../types';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface MuscleGroupChipProps {
  muscleGroup: MuscleGroup;
  selected: boolean;
  onToggle: (muscle: MuscleGroup) => void;
}

export const MuscleGroupChip: React.FC<MuscleGroupChipProps> = ({
  muscleGroup,
  selected,
  onToggle,
}) => {
  const { colors, isDark } = useTheme();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch (e) {}
    }
    onToggle(muscleGroup);
  };

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? colors.accentLight
            : colors.card,
          borderColor: selected
            ? colors.accent
            : isDark
            ? colors.border
            : colors.borderSubtle,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.contentRow}>
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: selected ? colors.accent : 'transparent',
              borderColor: selected ? colors.accent : colors.textTertiary,
            },
          ]}
        >
          {selected && (
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          )}
        </View>
        <Text
          style={[
            typography.headline,
            {
              color: selected ? (isDark ? colors.accentDark : colors.accent) : colors.text,
              fontWeight: selected ? '600' : '500',
            },
          ]}
        >
          {muscleGroup}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xxs + 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
});
