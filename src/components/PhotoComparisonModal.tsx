import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ProgressPhoto } from '../types';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

type ViewMode = 'side-by-side' | 'stacked';

interface PhotoComparisonModalProps {
  visible: boolean;
  photoBefore: ProgressPhoto | null;
  photoAfter: ProgressPhoto | null;
  onClose: () => void;
}

export const PhotoComparisonModal: React.FC<PhotoComparisonModalProps> = ({
  visible,
  photoBefore,
  photoAfter,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateDaysDiff = () => {
    if (!photoBefore?.date || !photoAfter?.date) return null;
    const d1 = new Date(photoBefore.date + 'T00:00:00').getTime();
    const d2 = new Date(photoAfter.date + 'T00:00:00').getTime();
    const diff = Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysDiff = calculateDaysDiff();

  const toggleViewMode = (mode: ViewMode) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    setViewMode(mode);
  };

  const renderPhotoCard = (photo: ProgressPhoto | null, label: 'BEFORE' | 'AFTER') => {
    const isAfter = label === 'AFTER';
    const isSplit = viewMode === 'side-by-side';

    return (
      <View
        style={[
          isSplit ? styles.sideCol : styles.stackedCol,
          { backgroundColor: colors.card, borderColor: isDark ? colors.border : colors.borderSubtle },
        ]}
      >
        {isSplit ? (
          <View
            style={[
              styles.labelBadge,
              { backgroundColor: isAfter ? colors.accentLight : colors.cardMuted },
            ]}
          >
            <Text
              style={[
                typography.captionBold,
                {
                  color: isAfter ? (isDark ? colors.accentDark : colors.accent) : colors.textSecondary,
                  fontSize: 11,
                  letterSpacing: 1,
                },
              ]}
            >
              {label}
            </Text>
            <Text
              style={[
                typography.caption,
                { color: colors.text, fontSize: 10, marginTop: 2 },
              ]}
              numberOfLines={1}
            >
              {photo?.date ? formatDate(photo.date) : 'No Date'}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.stackedHeaderRow,
              { backgroundColor: isAfter ? colors.accentLight : colors.cardMuted },
            ]}
          >
            <View style={styles.stackedTagRow}>
              <Text
                style={[
                  typography.captionBold,
                  {
                    color: isAfter ? (isDark ? colors.accentDark : colors.accent) : colors.textSecondary,
                    fontSize: 12,
                    letterSpacing: 1,
                  },
                ]}
              >
                {label}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text, marginLeft: 8, fontSize: 12 },
                ]}
              >
                {photo?.date ? formatDate(photo.date) : 'No Date'}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.imageContainer, isSplit ? styles.sideImageContainer : styles.stackedImageContainer]}>
          {photo ? (
            <Image
              source={{ uri: photo.uri }}
              style={styles.photoImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderBox}>
              <Ionicons name="image-outline" size={32} color={colors.textTertiary} />
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                No photo selected
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header with View Mode Switcher */}
        <View style={styles.header}>
          <Text style={[typography.title2, { color: colors.text }]}>
            Comparison
          </Text>

          {/* View Mode Toggle Switcher */}
          <View style={[styles.modeToggle, { backgroundColor: colors.cardMuted, borderColor: colors.borderSubtle }]}>
            <TouchableOpacity
              style={[
                styles.modeBtn,
                viewMode === 'side-by-side' && [styles.modeBtnActive, { backgroundColor: colors.card }],
              ]}
              onPress={() => toggleViewMode('side-by-side')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="grid-outline"
                size={14}
                color={viewMode === 'side-by-side' ? colors.accent : colors.textSecondary}
              />
              <Text
                style={[
                  typography.captionBold,
                  {
                    color: viewMode === 'side-by-side' ? colors.text : colors.textSecondary,
                    fontSize: 11,
                    marginLeft: 4,
                  },
                ]}
              >
                Split
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeBtn,
                viewMode === 'stacked' && [styles.modeBtnActive, { backgroundColor: colors.card }],
              ]}
              onPress={() => toggleViewMode('stacked')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="reorder-two-outline"
                size={16}
                color={viewMode === 'stacked' ? colors.accent : colors.textSecondary}
              />
              <Text
                style={[
                  typography.captionBold,
                  {
                    color: viewMode === 'stacked' ? colors.text : colors.textSecondary,
                    fontSize: 11,
                    marginLeft: 4,
                  },
                ]}
              >
                Stacked
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.cardMuted }]}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Sub-header banner (Days Apart info) */}
        {daysDiff !== null && (
          <View style={styles.subBannerRow}>
            <View style={[styles.diffBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)' }]}>
              <Ionicons name="time-outline" size={13} color={colors.accent} />
              <Text style={[typography.captionBold, { color: colors.accent, marginLeft: 4, fontSize: 11 }]}>
                {daysDiff === 0 ? 'Same day' : `${daysDiff} days apart`}
              </Text>
            </View>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {viewMode === 'side-by-side' ? (
            <View style={styles.sideBySideRow}>
              {renderPhotoCard(photoBefore, 'BEFORE')}
              {renderPhotoCard(photoAfter, 'AFTER')}
            </View>
          ) : (
            <View style={styles.stackedContainer}>
              {renderPhotoCard(photoBefore, 'BEFORE')}
              {renderPhotoCard(photoAfter, 'AFTER')}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modeToggle: {
    flexDirection: 'row',
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  modeBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  scrollContent: {
    paddingVertical: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  sideBySideRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  sideCol: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  stackedContainer: {
    flexDirection: 'column',
    width: '100%',
    gap: spacing.md,
  },
  stackedCol: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  labelBadge: {
    paddingVertical: 8,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  stackedHeaderRow: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  stackedTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#0D0F11',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sideImageContainer: {
    aspectRatio: 3 / 4,
    minHeight: 220,
  },
  stackedImageContainer: {
    aspectRatio: 4 / 3,
    maxHeight: 340,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    width: '100%',
    height: '100%',
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
});
