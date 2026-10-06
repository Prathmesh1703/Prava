import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radius, shadows, spacing } from '../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  elevated?: boolean;
  glass?: boolean;
  padding?: keyof typeof spacing | number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  onLongPress,
  elevated = false,
  glass = false,
  padding = 'lg',
}) => {
  const { colors, isDark } = useTheme();

  const paddingValue = typeof padding === 'number' ? padding : spacing[padding];

  const glassStyle: ViewStyle = glass
    ? {
        backgroundColor: isDark
          ? 'rgba(22, 21, 25, 0.78)'
          : '#FFFFFF',
        borderColor: isDark
          ? 'rgba(255, 255, 255, 0.10)'
          : colors.borderSubtle,
        borderWidth: 1,
      }
    : {
        backgroundColor: elevated ? colors.cardElevated : colors.card,
        borderColor: isDark ? colors.border : colors.borderSubtle,
        borderWidth: 1,
      };

  const cardStyle: ViewStyle = {
    borderRadius: radius.lg,
    padding: paddingValue,
    ...glassStyle,
    ...(isDark ? shadows.none : elevated ? shadows.card : shadows.subtle),
  };

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.75}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};
