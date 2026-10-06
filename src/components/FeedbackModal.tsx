import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';
import { saveFeedback } from '../services/feedbackSyncService';
import { FeedbackCategory } from '../types';

// ─────────────────────────────────────────────────────────────────────────────

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

type FeedbackType = FeedbackCategory;

const FEEDBACK_OPTIONS: { id: FeedbackType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'feature',     label: 'Feature Idea',  icon: 'bulb-outline'                },
  { id: 'improvement', label: 'Improvement',   icon: 'rocket-outline'              },
  { id: 'bug',         label: 'Bug Report',    icon: 'bug-outline'                 },
  { id: 'general',     label: 'General',       icon: 'chatbubble-ellipses-outline' },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();

  const [rating,      setRating]      = useState<number>(0);
  const [category,    setCategory]    = useState<FeedbackType>('feature');
  const [message,     setMessage]     = useState<string>('');
  const [submitting,  setSubmitting]  = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Animated scale for each star
  const starScales = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }
  };

  const handleSelectRating = (star: number) => {
    triggerHaptic();
    setRating(star);
    const anim = starScales[star - 1];
    if (anim) {
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.35, duration: 120, useNativeDriver: true }),
        Animated.spring(anim,  { toValue: 1,    friction: 4, tension: 80, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      if (Platform.OS === 'web') {
        alert('Please tap a star to give a rating before submitting.');
      } else {
        Alert.alert('Rating Required', 'Please tap a star to give a rating before submitting.');
      }
      return;
    }
    if (!message.trim()) {
      if (Platform.OS === 'web') {
        alert('Please share your thoughts before submitting.');
      } else {
        Alert.alert('Feedback Required', 'Please share your thoughts or feature suggestions before submitting.');
      }
      return;
    }

    triggerHaptic();
    setSubmitting(true);
    try {
      // Save locally + attempt background sync to Google Form
      await saveFeedback(rating, category, message);
      setIsSubmitted(true);
      if (Platform.OS !== 'web') {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
    } catch (err) {
      // Should not normally reach here — saveFeedback only fails on SQLite error
      if (Platform.OS === 'web') {
        alert('Something went wrong. Please try again.');
      } else {
        Alert.alert('Error', 'Something went wrong saving your feedback. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setMessage('');
    setIsSubmitted(false);
    setRating(0);
    setCategory('feature');
    onClose();
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1: return 'Needs improvement';
      case 2: return 'Okay';
      case 3: return 'Good';
      case 4: return 'Great!';
      case 5: return 'Loving it! ⭐';
      default: return 'Tap a star to rate';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCloseModal}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.modalBackdrop }]}>
        <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>

          {isSubmitted ? (
            /* ── SUCCESS STATE ── */
            <View style={styles.successContent}>
              <View style={[styles.successIconCircle, { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.12)' }]}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              </View>
              <Text style={[typography.title2, { color: colors.text, marginTop: spacing.sm, textAlign: 'center' }]}>
                Thank You!
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: spacing.lg }]}>
                Feedback submitted successfully.
              </Text>
              <PrimaryButton
                title="Done"
                onPress={handleCloseModal}
                style={{ width: '100%' }}
              />
            </View>
          ) : (
            /* ── FEEDBACK FORM ── */
            <View>
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={[styles.headerIconCircle, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="star" size={20} color={colors.accent} />
                </View>
                <View style={styles.headerTextCol}>
                  <Text style={[typography.title3, { color: colors.text }]}>Feedback & Rating</Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    Rate Prava & suggest improvements
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={[styles.closeBtn, { backgroundColor: colors.cardMuted }]}
                >
                  <Ionicons name="close" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Star Rating */}
              <View style={[styles.starsBox, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Animated.View key={star} style={{ transform: [{ scale: starScales[star - 1] || 1 }] }}>
                      <TouchableOpacity
                        onPress={() => handleSelectRating(star)}
                        style={styles.starTouch}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={star <= rating ? 'star' : 'star-outline'}
                          size={32}
                          color={star <= rating ? '#F59E0B' : colors.textTertiary}
                        />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
                <Text style={[typography.captionBold, { color: colors.text, marginTop: 4, fontSize: 12 }]}>
                  {getRatingLabel(rating)}
                </Text>
              </View>

              {/* Category chips */}
              <Text style={[typography.captionBold, { color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs, textTransform: 'uppercase', fontSize: 10 }]}>
                Category
              </Text>
              <View style={styles.chipsRow}>
                {FEEDBACK_OPTIONS.map((opt) => {
                  const selected = category === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => { triggerHaptic(); setCategory(opt.id); }}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? colors.accentLight  : colors.cardMuted,
                          borderColor:     selected ? colors.accent        : 'transparent',
                        },
                      ]}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={13}
                        color={selected ? (isDark ? colors.accentDark : colors.accent) : colors.textSecondary}
                      />
                      <Text style={[
                        typography.captionBold,
                        {
                          color:      selected ? (isDark ? colors.accentDark : colors.accent) : colors.text,
                          marginLeft: 4,
                          fontSize:   11,
                        },
                      ]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Message textarea */}
              <Text style={[typography.captionBold, { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: 4, textTransform: 'uppercase', fontSize: 10 }]}>
                Your Feedback or Suggestions
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Tell us what new features or changes you'd like to see..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
                style={[
                  typography.body,
                  styles.textArea,
                  {
                    backgroundColor: colors.cardMuted,
                    color:           colors.text,
                    borderColor:     isDark ? colors.border : colors.borderSubtle,
                  },
                ]}
              />

              {/* Action buttons */}
              <View style={styles.btnRow}>
                <SecondaryButton
                  title="Cancel"
                  onPress={handleCloseModal}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <PrimaryButton
                  title="Submit"
                  onPress={handleSubmit}
                  loading={submitting}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerIconCircle: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTextCol: { flex: 1 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  starsBox: {
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  starTouch: { padding: 4 },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  textArea: {
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    width: '100%',
  },
  successContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  successIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.xs,
  },
  offlineNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 8,
  },
});
