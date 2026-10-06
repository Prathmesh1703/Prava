import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme/spacing';

export interface AvatarPreset {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgLight: string;
  bgDark: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'lifter', name: 'Lifter', icon: 'barbell', color: '#FF6A00', bgLight: '#FFF0E6', bgDark: 'rgba(255, 106, 0, 0.25)' },
  { id: 'beast', name: 'Beast', icon: 'flame', color: '#F97316', bgLight: '#FFEDD5', bgDark: 'rgba(249, 115, 22, 0.25)' },
  { id: 'athlete', name: 'Athlete', icon: 'fitness', color: '#06B6D4', bgLight: '#CFFAFE', bgDark: 'rgba(6, 182, 212, 0.25)' },
  { id: 'champion', name: 'Champion', icon: 'trophy', color: '#10B981', bgLight: '#D1FAE5', bgDark: 'rgba(16, 185, 129, 0.25)' },
  { id: 'power', name: 'Power', icon: 'flash', color: '#EAB308', bgLight: '#FEF9C3', bgDark: 'rgba(234, 179, 8, 0.25)' },
  { id: 'guardian', name: 'Guardian', icon: 'shield-checkmark', color: '#8B5CF6', bgLight: '#EDE9FE', bgDark: 'rgba(139, 92, 246, 0.25)' },
  { id: 'cardio', name: 'Cardio', icon: 'heart', color: '#EC4899', bgLight: '#FCE7F3', bgDark: 'rgba(236, 72, 153, 0.25)' },
  { id: 'classic', name: 'Classic', icon: 'person', color: '#6366F1', bgLight: '#E0E7FF', bgDark: 'rgba(99, 102, 241, 0.25)' },
];

export const getAvatarPreset = (avatarId?: string): AvatarPreset => {
  const found = AVATAR_PRESETS.find((a) => a.id === avatarId);
  return found || AVATAR_PRESETS[0];
};

interface AvatarProps {
  avatarId?: string;
  size?: number;
  onPress?: () => void;
  showBadge?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  avatarId,
  size = 60,
  onPress,
  showBadge = false,
}) => {
  const { isDark } = useTheme();
  const preset = getAvatarPreset(avatarId);
  const iconSize = Math.round(size * 0.52);

  const content = (
    <View
      style={[
        styles.avatarCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isDark ? preset.bgDark : preset.bgLight,
          borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.85)',
          borderWidth: 1.5,
        },
      ]}
    >
      <Ionicons name={preset.icon} size={iconSize} color={preset.color} />
      {showBadge && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: preset.color,
              borderColor: isDark ? '#121826' : '#FFFFFF',
            },
          ]}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  avatarCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
});
