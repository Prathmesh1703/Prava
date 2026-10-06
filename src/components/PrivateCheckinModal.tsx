import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { PinInput } from './PinInput';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { Card } from './Card';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface PrivateCheckinModalProps {
  visible: boolean;
  onSuccess: () => void | Promise<void>;
  onCancel: () => void;
  reason?: 'workout_prerequisite' | 'standalone';
  targetDate?: string;
  forcePinAuth?: boolean;
}

export const PrivateCheckinModal: React.FC<PrivateCheckinModalProps> = ({
  visible,
  onSuccess,
  onCancel,
  reason = 'workout_prerequisite',
  targetDate,
  forcePinAuth = true,
}) => {
  const { colors, isDark } = useTheme();
  const {
    isPrivateUnlocked,
    unlockPrivate,
    isPinSetup,
    setupPin,
    activePrivateQuestions,
    savePrivateCheckin,
  } = useApp();

  const [modalAuthenticated, setModalAuthenticated] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [setupPinVal, setSetupPinVal] = useState('');
  const [setupConfirmVal, setSetupConfirmVal] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Reset authentication and inputs when modal opens
  React.useEffect(() => {
    if (visible) {
      setPinError(null);
      setSetupError(null);
      setSetupPinVal('');
      setSetupConfirmVal('');
      // In workout prerequisite flow, strictly require PIN
      if (forcePinAuth || reason === 'workout_prerequisite') {
        setModalAuthenticated(false);
      } else {
        setModalAuthenticated(isPrivateUnlocked);
      }
    }
  }, [visible, forcePinAuth, reason, isPrivateUnlocked]);

  const handlePinSubmit = async (pin: string) => {
    setPinError(null);
    const success = await unlockPrivate(pin);
    if (!success) {
      setPinError('Incorrect PIN. Please try again.');
    } else {
      setModalAuthenticated(true);
    }
  };

  const handleCreatePin = async () => {
    setSetupError(null);
    if (setupPinVal.length !== 4) {
      setSetupError('PIN must be 4 digits.');
      return;
    }
    if (setupPinVal !== setupConfirmVal) {
      setSetupError('PINs do not match.');
      return;
    }
    const ok = await setupPin(setupPinVal);
    if (!ok) {
      setSetupError('Failed to save PIN.');
    } else {
      setModalAuthenticated(true);
    }
  };

  const handleAnswerToggle = (questionId: string, answer: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Questions to display (fallback to default question if none active)
  const displayQuestions = activePrivateQuestions.length > 0
    ? activePrivateQuestions
    : [{ id: 'default_habit', text: 'Did you stay on track with your nutrition & habits today?', enabled: true, order: 1, createdAt: '' }];

  const allAnswered = displayQuestions.every((q) => answers[q.id] !== undefined);

  const handleSaveAnswers = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      await savePrivateCheckin(answers, targetDate);
      await onSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const isUnlocked = isPinSetup ? modalAuthenticated : false;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[typography.captionBold, { color: colors.accent, textTransform: 'uppercase' }]}>
              🔒 Private Check-in
            </Text>
            <Text style={[typography.title2, { color: colors.text, marginTop: 2 }]}>
              {!isUnlocked ? (!isPinSetup ? 'Set Up Your PIN' : 'Authentication Required') : (targetDate ? `Check-in • ${targetDate}` : "Today's Check-in")}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.cardMuted }]}
            onPress={onCancel}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* PIN Entry View */}
        {!isUnlocked ? (
          !isPinSetup ? (
            <View style={styles.pinStepContainer}>
              <View style={styles.lockIconCircle}>
                <Ionicons name="key" size={32} color={colors.accent} />
              </View>

              <Text style={[typography.title3, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]}>
                Create a 4-Digit Security PIN
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 4, maxWidth: 280 }]}>
                Set a PIN to secure your private habits and daily check-ins.
              </Text>

              <View style={{ width: '100%', maxWidth: 280, marginTop: spacing.lg }}>
                <Text style={[typography.captionBold, { color: colors.textSecondary, marginBottom: 4, textTransform: 'uppercase', fontSize: 10 }]}>
                  Enter 4-Digit PIN
                </Text>
                <TextInput
                  value={setupPinVal}
                  onChangeText={(t: string) => setSetupPinVal(t.replace(/[^0-9]/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  secureTextEntry
                  placeholder="••••"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={4}
                  style={[
                    typography.title2,
                    {
                      backgroundColor: colors.cardMuted,
                      color: colors.text,
                      borderRadius: radius.md,
                      paddingVertical: spacing.sm,
                      textAlign: 'center',
                      letterSpacing: 8,
                      borderWidth: 1,
                      borderColor: isDark ? colors.border : colors.borderSubtle,
                    },
                  ]}
                />

                <Text style={[typography.captionBold, { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: 4, textTransform: 'uppercase', fontSize: 10 }]}>
                  Confirm 4-Digit PIN
                </Text>
                <TextInput
                  value={setupConfirmVal}
                  onChangeText={(t: string) => setSetupConfirmVal(t.replace(/[^0-9]/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  secureTextEntry
                  placeholder="••••"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={4}
                  style={[
                    typography.title2,
                    {
                      backgroundColor: colors.cardMuted,
                      color: colors.text,
                      borderRadius: radius.md,
                      paddingVertical: spacing.sm,
                      textAlign: 'center',
                      letterSpacing: 8,
                      borderWidth: 1,
                      borderColor: isDark ? colors.border : colors.borderSubtle,
                    },
                  ]}
                />

                {setupError && (
                  <Text style={[typography.captionBold, { color: colors.danger, textAlign: 'center', marginTop: spacing.xs }]}>
                    {setupError}
                  </Text>
                )}

                <PrimaryButton
                  title="Save PIN & Continue"
                  onPress={handleCreatePin}
                  disabled={setupPinVal.length !== 4 || setupConfirmVal.length !== 4}
                  style={{ marginTop: spacing.md }}
                />
              </View>
            </View>
          ) : (
            <View style={styles.pinStepContainer}>
              <View style={styles.lockIconCircle}>
                <Ionicons name="lock-closed" size={32} color={colors.accent} />
              </View>

              <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md }]}>
                {reason === 'workout_prerequisite'
                  ? 'Enter your PIN to complete the required private check-in before saving today’s workout.'
                  : 'Enter your 4-digit PIN to access private check-ins.'}
              </Text>

              <PinInput onComplete={handlePinSubmit} error={pinError} />
            </View>
          )
        ) : (
          /* Questions View */
          <ScrollView
            style={styles.questionsScroll}
            contentContainerStyle={styles.questionsContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[typography.subhead, { color: colors.textSecondary, marginBottom: spacing.md }]}>
              Please answer the following private questions for today:
            </Text>

            {displayQuestions.map((q) => {
              const currentVal = answers[q.id];

              return (
                <Card key={q.id} elevated style={styles.questionCard}>
                    <Text style={[typography.headline, { color: colors.text, marginBottom: spacing.md }]}>
                      {q.text}
                    </Text>

                    <View style={styles.yesNoRow}>
                      <TouchableOpacity
                        style={[
                          styles.yesNoButton,
                          {
                            backgroundColor:
                              currentVal === true
                                ? colors.accentLight
                                : colors.cardMuted,
                            borderColor:
                              currentVal === true
                                ? colors.accent
                                : 'transparent',
                          },
                        ]}
                        onPress={() => handleAnswerToggle(q.id, true)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            typography.headline,
                            {
                              color:
                                currentVal === true
                                  ? (isDark ? colors.accentDark : colors.accent)
                                  : colors.text,
                              fontWeight: currentVal === true ? '700' : '500',
                            },
                          ]}
                        >
                          Yes
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.yesNoButton,
                          {
                            backgroundColor:
                              currentVal === false
                                ? colors.accentLight
                                : colors.cardMuted,
                            borderColor:
                              currentVal === false
                                ? colors.accent
                                : 'transparent',
                          },
                        ]}
                        onPress={() => handleAnswerToggle(q.id, false)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            typography.headline,
                            {
                              color:
                                currentVal === false
                                  ? (isDark ? colors.accentDark : colors.accent)
                                  : colors.text,
                              fontWeight: currentVal === false ? '700' : '500',
                            },
                          ]}
                        >
                          No
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })}

            <View style={styles.buttonContainer}>
              <PrimaryButton
                title={reason === 'workout_prerequisite' ? 'Save & Complete Workout' : 'Save Check-in'}
                onPress={handleSaveAnswers}
                disabled={!allAnswered}
                loading={submitting}
                size="lg"
              />
              <SecondaryButton
                title="Cancel"
                onPress={onCancel}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinStepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  lockIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionsScroll: {
    flex: 1,
  },
  questionsContent: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  questionCard: {
    marginVertical: spacing.xs,
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: spacing.xl,
  },
});
