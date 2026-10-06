import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface SettingRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  iconColor,
  label,
  value,
  onPress,
  showChevron = true,
  destructive = false,
  isFirst = false,
  isLast = false,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderTopLeftRadius: isFirst ? radius.lg : 0,
          borderTopRightRadius: isFirst ? radius.lg : 0,
          borderBottomLeftRadius: isLast ? radius.lg : 0,
          borderBottomRightRadius: isLast ? radius.lg : 0,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: isDark ? colors.border : colors.borderSubtle,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.leftContent}>
        {icon && (
          <View
            style={[
              styles.iconBox,
              { backgroundColor: iconColor ? `${iconColor}15` : colors.cardMuted },
            ]}
          >
            <Ionicons name={icon} size={18} color={iconColor || colors.text} />
          </View>
        )}
        <Text
          style={[
            typography.body,
            {
              color: destructive ? colors.danger : colors.text,
              fontWeight: '500',
            },
          ]}
        >
          {label}
        </Text>
      </View>

      <View style={styles.rightContent}>
        {value && (
          <Text style={[typography.body, { color: colors.textSecondary, marginRight: 6 }]}>
            {value}
          </Text>
        )}
        {showChevron && (
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        )}
      </View>
    </TouchableOpacity>
  );
};

interface ToggleRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const ToggleRow: React.FC<ToggleRowProps> = ({
  icon,
  iconColor,
  label,
  value,
  onValueChange,
  isFirst = false,
  isLast = false,
}) => {
  const { colors, isDark } = useTheme();

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch (e) {}
    }
    onValueChange(!value);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handleToggle}
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderTopLeftRadius: isFirst ? radius.lg : 0,
          borderTopRightRadius: isFirst ? radius.lg : 0,
          borderBottomLeftRadius: isLast ? radius.lg : 0,
          borderBottomRightRadius: isLast ? radius.lg : 0,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: isDark ? colors.border : colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.leftContent}>
        {icon && (
          <View
            style={[
              styles.iconBox,
              { backgroundColor: iconColor ? `${iconColor}15` : colors.cardMuted },
            ]}
          >
            <Ionicons name={icon} size={18} color={iconColor || colors.text} />
          </View>
        )}
        <Text style={[typography.body, { color: colors.text, fontWeight: '500' }]}>
          {label}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={handleToggle}
        trackColor={{ false: colors.cardMuted, true: colors.accent }}
        thumbColor="#FFFFFF"
        pointerEvents="none"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
