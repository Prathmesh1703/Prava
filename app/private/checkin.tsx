import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useApp } from '../../src/context/AppContext';
import {
  ScreenContainer,
  Header,
  Card,
  PrimaryButton,
  SecondaryButton,
} from '../../src/components';
import { typography } from '../../src/theme/typography';
import { radius, spacing } from '../../src/theme/spacing';

export default function PrivateCheckinScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const {
    activePrivateQuestions,
    savePrivateCheckin,
    todayCheckin,
  } = useApp();

  const [answers, setAnswers] = useState<Record<string, boolean>>(
    todayCheckin ? { ...todayCheckin.answers } : {}
  );
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleAnswerToggle = (questionId: string, answer: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const allAnswered =
    activePrivateQuestions.length === 0 ||
    activePrivateQuestions.every((q) => answers[q.id] !== undefined);

  const handleSave = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      await savePrivateCheckin(answers);
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer withPillPadding={false}>
      <Header
        title="Daily Check-in"
        subtitle="Private Record"
        backAction={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      >
        <Text style={[typography.subhead, { color: colors.textSecondary, marginBottom: spacing.md }]}>
          Please answer the following confidential Yes/No questions:
        </Text>

        {activePrivateQuestions.length === 0 ? (
          <Card style={{ marginVertical: spacing.md }}>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
              No active private questions found.
            </Text>
          </Card>
        ) : (
          activePrivateQuestions.map((q) => {
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
          })
        )}

        <View style={styles.btnContainer}>
          <PrimaryButton
            title="Save Check-in"
            onPress={handleSave}
            disabled={!allAnswered}
            loading={submitting}
            size="lg"
          />
          <SecondaryButton
            title="Cancel"
            onPress={() => router.back()}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  btnContainer: {
    marginTop: spacing.xl,
  },
});
