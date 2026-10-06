import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { Card } from './Card';
import { PrimaryButton } from './Buttons';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';
import { saveFeedback } from '../services/feedbackSyncService';
import { FeedbackCategory } from '../types';

type FeedbackType = FeedbackCategory;

interface FeedbackTypeOption {
  id: FeedbackType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const FEEDBACK_OPTIONS: FeedbackTypeOption[] = [
  { id: 'feature', label: 'Feature Idea', icon: 'bulb-outline' },
  { id: 'improvement', label: 'Improvement', icon: 'rocket-outline' },
  { id: 'bug', label: 'Bug Report', icon: 'bug-outline' },
  { id: 'general', label: 'General', icon: 'chatbubble-ellipses-outline' },
];

export const FeedbackCard: React.FC = () => {
  const { colors, isDark } = useTheme();

  const [rating, setRating] = useState<number>(5);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('feature');
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const handleSelectRating = (r: number) => {
    triggerHaptic();
    setRating(r);
  };

  const handleSelectType = (type: FeedbackType) => {
    triggerHaptic();
    setFeedbackType(type);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      if (Platform.OS === 'web') {
        alert('Please enter your feedback or suggestions.');
      } else {
        Alert.alert('Feedback required', 'Please share your thoughts or feature suggestions before submitting.');
      }
      return;
    }

    triggerHaptic();
    setSubmitting(true);
    try {
      // Save locally first, then sync to Google Form in background
      await saveFeedback(rating, feedbackType, message);
      setIsSubmitted(true);
      if (Platform.OS !== 'web') {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
    } catch {
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Could not save your feedback. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setMessage('');
    setIsSubmitted(false);
    setRating(5);
    setFeedbackType('feature');
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1:
        return 'Needs improvement';
      case 2:
        return 'Okay';
      case 3:
        return 'Good';
      case 4:
        return 'Great!';
      case 5:
        return 'Loving it!';
      default:
        return '';
    }
  };

  return (
    <Card glass style={styles.container}>
      {isSubmitted ? (
        /* SUCCESS CONFIRMATION STATE */
        <View style={styles.successBox}>
          <View style={[styles.successIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)' }]}>
            <Ionicons name="checkmark-circle" size={40} color="#10B981" />
          </View>
          <Text style={[typography.title3, { color: colors.text, marginTop: spacing.sm }]}>
            Thank You!
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: spacing.md }]}>
            Feedback submitted successfully.
          </Text>
          <TouchableOpacity
            style={[styles.sendAnotherBtn, { backgroundColor: colors.cardMuted }]}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Text style={[typography.captionBold, { color: colors.accent }]}>
              Submit Another
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* INTERACTIVE FEEDBACK & RATING FORM */
        <View>
          <View style={styles.headerRow}>
            <View style={[styles.headerIcon, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="sparkles" size={18} color={colors.accent} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={[typography.headline, { color: colors.text }]}>
                Feedback & Feature Requests
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Rate Prava and suggest features you'd like to see!
              </Text>
            </View>
          </View>

          {/* Interactive Star Rating */}
          <View style={[styles.ratingContainer, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
            <Text style={[typography.captionBold, { color: colors.textSecondary, textTransform: 'uppercase', fontSize: 10, marginBottom: 4 }]}>
              Rate Your Experience
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleSelectRating(star)}
                  style={styles.starBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={28}
                    color={star <= rating ? '#F59E0B' : colors.textTertiary}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[typography.captionBold, { color: colors.text, marginTop: 2, fontSize: 11 }]}>
              {getRatingLabel(rating)}
            </Text>
          </View>

          {/* Category Chips */}
          <Text style={[typography.captionBold, { color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs, textTransform: 'uppercase', fontSize: 10 }]}>
            Category
          </Text>
          <View style={styles.chipsRow}>
            {FEEDBACK_OPTIONS.map((opt) => {
              const isSelected = feedbackType === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.accentLight : colors.cardMuted,
                      borderColor: isSelected ? colors.accent : 'transparent',
                    },
                  ]}
                  onPress={() => handleSelectType(opt.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt.icon}
                    size={14}
                    color={isSelected ? (isDark ? colors.accentDark : colors.accent) : colors.textSecondary}
                  />
                  <Text
                    style={[
                      typography.captionBold,
                      {
                        color: isSelected ? (isDark ? colors.accentDark : colors.accent) : colors.text,
                        marginLeft: 4,
                        fontSize: 11,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Textarea */}
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Tell us what new features or changes you'd love in the app..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            style={[
              typography.body,
              styles.textArea,
              {
                backgroundColor: colors.cardMuted,
                color: colors.text,
                borderColor: isDark ? colors.border : colors.borderSubtle,
              },
            ]}
          />

          {/* Submit Button */}
          <PrimaryButton
            title="Submit Feedback"
            onPress={handleSubmit}
            loading={submitting}
            size="md"
            icon={<Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />}
            style={{ width: '100%', marginTop: spacing.sm }}
          />
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTextCol: {
    flex: 1,
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginVertical: spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: 2,
  },
  starBtn: {
    padding: 3,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
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
    minHeight: 76,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sendAnotherBtn: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
});
