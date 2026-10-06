import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressPhoto } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Card } from './Card';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface PhotoCardProps {
  photo: ProgressPhoto;
  isSelectedForCompare?: boolean;
  isCompareMode?: boolean;
  onPress: () => void;
  onToggleCompare?: () => void;
  onDelete?: () => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  isSelectedForCompare = false,
  isCompareMode = false,
  onPress,
  onToggleCompare,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card elevated style={styles.container} padding="sm">
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: photo.uri }}
            style={styles.image}
            resizeMode="cover"
          />

          {isCompareMode && (
            <TouchableOpacity
              style={[
                styles.compareCheckBubble,
                {
                  backgroundColor: isSelectedForCompare ? colors.accent : 'rgba(0,0,0,0.5)',
                  borderColor: '#FFFFFF',
                },
              ]}
              onPress={onToggleCompare}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isSelectedForCompare ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <View style={styles.unselectedCheck} />
              )}
            </TouchableOpacity>
          )}

          <View style={styles.dateOverlay}>
            <Text style={[typography.captionBold, { color: '#FFFFFF' }]}>
              {formatDate(photo.date)}
            </Text>
          </View>
        </View>

        {photo.notes && (
          <Text
            style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}
            numberOfLines={2}
          >
            {photo.notes}
          </Text>
        )}
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dateOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  compareCheckBubble: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  unselectedCheck: {
    width: 10,
    height: 10,
  },
});
