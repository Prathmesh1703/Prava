import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../src/context/ThemeContext';
import { useApp } from '../src/context/AppContext';
import { PrimaryButton, SecondaryButton } from '../src/components/Buttons';
import { Avatar, AVATAR_PRESETS } from '../src/components/Avatar';
import { AppLogo } from '../src/components/AppLogo';
import { Card } from '../src/components/Card';
import { typography } from '../src/theme/typography';
import { radius, spacing } from '../src/theme/spacing';

// ── Unit Conversion Helpers ──────────────────────────────────────────────────
const cmToFtIn = (cm: number) => {
  const safeCm = Math.max(0, cm || 0);
  const totalInches = Math.round(safeCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet, inches, label: `${feet}' ${inches}"` };
};

const ftInToCm = (feet: number, inches: number) => {
  const safeFeet = Math.max(0, feet || 0);
  const safeInches = Math.max(0, Math.min(11, inches || 0));
  return Math.round((safeFeet * 12 + safeInches) * 2.54);
};

const GOAL_PRESETS = [
  'Hypertrophy',
  'Strength',
  'Fat Loss',
  'Endurance',
  'General Fitness',
  'Conditioning',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { hasOnboarded, isLoading, completeOnboarding } = useApp();

  // If already completed onboarding, redirect straight to tabs
  if (!isLoading && hasOnboarded) {
    return <Redirect href="/(tabs)" />;
  }

  // Two-step onboarding: 'welcome' (Get Started screen) -> 'profile' (Profile setup)
  const [step, setStep] = useState<'welcome' | 'profile'>('welcome');
  const [saving, setSaving] = useState(false);

  // Form states
  const [selectedAvatarId, setSelectedAvatarId] = useState('lifter');
  const [name, setName] = useState('');
  const [gymName, setGymName] = useState('');
  const [workoutGoal, setWorkoutGoal] = useState('Hypertrophy');

  // Height state
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft_in'>('cm');
  const [heightCm, setHeightCm] = useState('175');
  const [heightFeet, setHeightFeet] = useState('5');
  const [heightInches, setHeightInches] = useState('9');

  // Weight state
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const adjustHeightCm = (delta: number) => {
    triggerHaptic();
    const current = parseInt(heightCm, 10) || 175;
    const next = Math.max(100, Math.min(250, current + delta));
    setHeightCm(String(next));
    const ftIn = cmToFtIn(next);
    setHeightFeet(String(ftIn.feet));
    setHeightInches(String(ftIn.inches));
  };

  const adjustHeightFtIn = (feetDelta: number, inchesDelta: number) => {
    triggerHaptic();
    const f = parseInt(heightFeet, 10) || 5;
    const i = parseInt(heightInches, 10) || 0;
    let totalInches = f * 12 + i + feetDelta * 12 + inchesDelta;
    totalInches = Math.max(36, Math.min(96, totalInches));
    const nextFeet = Math.floor(totalInches / 12);
    const nextInches = totalInches % 12;
    setHeightFeet(String(nextFeet));
    setHeightInches(String(nextInches));
    setHeightCm(String(ftInToCm(nextFeet, nextInches)));
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      if (Platform.OS === 'web') {
        alert('Please enter your name to continue.');
      } else {
        Alert.alert('Name Required', 'Please enter your name to personalize your Prava profile.');
      }
      return;
    }

    triggerHaptic();
    setSaving(true);

    try {
      let finalHeightCm: number;
      if (heightUnit === 'cm') {
        finalHeightCm = parseInt(heightCm, 10) || 175;
      } else {
        finalHeightCm = ftInToCm(
          parseInt(heightFeet, 10) || 5,
          parseInt(heightInches, 10) || 9
        );
      }

      const initialWeightNum = parseFloat(currentWeight);
      const targetWeightNum = parseFloat(targetWeight);

      await completeOnboarding({
        name: trimmedName,
        gymName: gymName.trim() || 'Iron Forge Club',
        workoutGoal: workoutGoal.trim() || 'Hypertrophy',
        heightCm: finalHeightCm,
        targetWeightKg: !isNaN(targetWeightNum) && targetWeightNum > 0 ? targetWeightNum : undefined,
        currentWeightKg: !isNaN(initialWeightNum) && initialWeightNum > 0 ? initialWeightNum : undefined,
        avatarId: selectedAvatarId,
      });

      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
      }

      router.replace('/(tabs)');
    } catch (e: any) {
      console.error('Onboarding save error:', e);
      if (Platform.OS === 'web') {
        alert(e?.message || 'Error saving profile. Please try again.');
      } else {
        Alert.alert('Error', e?.message || 'Error saving profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── STEP 1: GET STARTED SCREEN ─────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.welcomeScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Brand Identity */}
          <View style={styles.welcomeHero}>
            <AppLogo size={88} showWordmark variant="stacked" showTagline />

            <View style={[styles.mottoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[typography.headline, styles.mottoTitle, { color: isDark ? colors.accentDark : colors.accent }]}>
                DISCIPLINE BUILDS FREEDOM
              </Text>
              <Text style={[typography.body, styles.mottoSubtitle, { color: colors.textSecondary }]}>
                Track your workouts. See your progress. Be a stronger you.
              </Text>
            </View>
          </View>

          {/* Key Value Highlights */}
          <View style={styles.featureList}>
            <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
              <View style={[styles.featureIcon, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="barbell-outline" size={22} color={isDark ? colors.accentDark : colors.accent} />
              </View>
              <View style={styles.featureText}>
                <Text style={[typography.headline, { color: colors.text }]}>Daily Workout Logging</Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>
                  Log targeted muscle groups, track today's sessions, or record previous workouts with flexible notes.
                </Text>
              </View>
            </View>

            <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
                <Ionicons name="trending-up" size={22} color="#10B981" />
              </View>
              <View style={styles.featureText}>
                <Text style={[typography.headline, { color: colors.text }]}>Progress & Body Metrics</Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>
                  Monitor body weight history, delta trends, monthly activity calendar, and photo progress comparisons.
                </Text>
              </View>
            </View>

            <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(99, 102, 241, 0.14)' }]}>
                <Ionicons name="shield-checkmark" size={22} color="#6366F1" />
              </View>
              <View style={styles.featureText}>
                <Text style={[typography.headline, { color: colors.text }]}>100% Private & Offline</Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>
                  No cloud tracking or remote servers. All your health data stays safely isolated on your personal device.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <View style={styles.welcomeActionWrap}>
            <PrimaryButton
              title="Get Started"
              size="lg"
              onPress={() => {
                triggerHaptic();
                setStep('profile');
              }}
              icon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── STEP 2: PROFILE SETUP FORM ─────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with back navigation */}
          <View style={styles.formHeaderRow}>
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                setStep('welcome');
              }}
              style={[styles.backBtn, { backgroundColor: colors.cardMuted }]}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center', marginRight: 36 }}>
              <AppLogo size={36} />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={[typography.title1, styles.welcomeTitle, { color: colors.text }]}>
              Create Your Profile
            </Text>
            <Text style={[typography.body, styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Personalize your athlete stats to track workouts and progress accurately.
            </Text>
          </View>

          {/* Card: Avatar Picker */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="sparkles" size={18} color={isDark ? colors.accentDark : colors.accent} />
              </View>
              <View>
                <Text style={[typography.title3, { color: colors.text }]}>Choose Your Avatar</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Pick an icon that matches your vibe</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarScroll}
            >
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedAvatarId === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.avatarOption,
                      isSelected && {
                        borderColor: isDark ? colors.accentDark : colors.accent,
                        backgroundColor: colors.accentLight,
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedAvatarId(preset.id);
                    }}
                    activeOpacity={0.75}
                  >
                    <Avatar avatarId={preset.id} size={48} />
                    <Text
                      style={[
                        typography.caption,
                        styles.avatarLabel,
                        {
                          color: isSelected ? (isDark ? colors.accentDark : colors.accent) : colors.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Card: Identity (Name & Gym) */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="person" size={18} color={isDark ? colors.accentDark : colors.accent} />
              </View>
              <View>
                <Text style={[typography.title3, { color: colors.text }]}>Athlete Identity</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>What should we call you?</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[typography.captionBold, styles.fieldLabel, { color: colors.textSecondary }]}>
                Full Name <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
                <Ionicons name="person-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Alex Hunter"
                  placeholderTextColor={colors.textTertiary}
                  style={[typography.body, styles.textInput, { color: colors.text }]}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[typography.captionBold, styles.fieldLabel, { color: colors.textSecondary }]}>
                Home Gym / Club
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
                <Ionicons name="barbell-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  value={gymName}
                  onChangeText={setGymName}
                  placeholder="e.g. Iron Forge Club"
                  placeholderTextColor={colors.textTertiary}
                  style={[typography.body, styles.textInput, { color: colors.text }]}
                />
              </View>
            </View>
          </View>

          {/* Card: Primary Training Goal */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="flag" size={18} color={isDark ? colors.accentDark : colors.accent} />
              </View>
              <View>
                <Text style={[typography.title3, { color: colors.text }]}>Primary Training Goal</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>What are you working toward?</Text>
              </View>
            </View>

            <View style={styles.goalChipsWrap}>
              {GOAL_PRESETS.map((preset) => {
                const isSelected = workoutGoal === preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.goalChip,
                      {
                        backgroundColor: isSelected ? colors.accentLight : colors.cardMuted,
                        borderColor: isSelected ? (isDark ? colors.accentDark : colors.accent) : (isDark ? colors.border : colors.borderSubtle),
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setWorkoutGoal(preset);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        typography.captionBold,
                        {
                          color: isSelected ? (isDark ? colors.accentDark : colors.accent) : colors.text,
                        },
                      ]}
                    >
                      {preset}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              value={workoutGoal}
              onChangeText={setWorkoutGoal}
              placeholder="Or enter custom goal..."
              placeholderTextColor={colors.textTertiary}
              style={[
                typography.body,
                styles.customGoalInput,
                {
                  backgroundColor: colors.cardMuted,
                  color: colors.text,
                  borderColor: isDark ? colors.border : colors.borderSubtle,
                },
              ]}
            />
          </View>

          {/* Card: Height Selector */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="body" size={18} color={isDark ? colors.accentDark : colors.accent} />
              </View>
              <View>
                <Text style={[typography.title3, { color: colors.text }]}>Your Height</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Used to calculate metrics accurately</Text>
              </View>
            </View>

            {/* Metric / Imperial Segmented Toggle */}
            <View style={[styles.unitToggleRow, { backgroundColor: colors.cardMuted }]}>
              <TouchableOpacity
                style={[
                  styles.unitToggleBtn,
                  heightUnit === 'cm' && [styles.unitToggleBtnActive, { backgroundColor: colors.card }],
                ]}
                onPress={() => {
                  triggerHaptic();
                  setHeightUnit('cm');
                }}
              >
                <Text style={[typography.captionBold, { color: heightUnit === 'cm' ? (isDark ? colors.accentDark : colors.accent) : colors.textSecondary }]}>
                  Centimeters (cm)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitToggleBtn,
                  heightUnit === 'ft_in' && [styles.unitToggleBtnActive, { backgroundColor: colors.card }],
                ]}
                onPress={() => {
                  triggerHaptic();
                  setHeightUnit('ft_in');
                }}
              >
                <Text style={[typography.captionBold, { color: heightUnit === 'ft_in' ? (isDark ? colors.accentDark : colors.accent) : colors.textSecondary }]}>
                  Feet & Inches (ft/in)
                </Text>
              </TouchableOpacity>
            </View>

            {heightUnit === 'cm' ? (
              <View style={styles.heightContainer}>
                <View style={[styles.metricBox, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
                  <TextInput
                    value={heightCm}
                    onChangeText={(val) => {
                      const num = val.replace(/[^0-9]/g, '');
                      setHeightCm(num);
                      const parsed = parseInt(num, 10);
                      if (!isNaN(parsed)) {
                        const ftIn = cmToFtIn(parsed);
                        setHeightFeet(String(ftIn.feet));
                        setHeightInches(String(ftIn.inches));
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={3}
                    style={[typography.metricLarge, styles.metricInput, { color: colors.text }]}
                  />
                  <Text style={[typography.title2, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
                    cm
                  </Text>
                </View>

                {/* Steppers */}
                <View style={[styles.steppersRow, { marginTop: spacing.md }]}>
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                    onPress={() => adjustHeightCm(-5)}
                  >
                    <Text style={[typography.headline, { color: colors.text }]}>-5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                    onPress={() => adjustHeightCm(-1)}
                  >
                    <Text style={[typography.headline, { color: colors.text }]}>-1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                    onPress={() => adjustHeightCm(1)}
                  >
                    <Text style={[typography.headline, { color: colors.text }]}>+1</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                    onPress={() => adjustHeightCm(5)}
                  >
                    <Text style={[typography.headline, { color: colors.text }]}>+5</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.heightContainer}>
                <View style={styles.ftInRow}>
                  <View style={[styles.ftInBox, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
                    <TextInput
                      value={heightFeet}
                      onChangeText={(val) => {
                        const num = val.replace(/[^0-9]/g, '');
                        setHeightFeet(num);
                        const f = parseInt(num, 10) || 0;
                        const i = parseInt(heightInches, 10) || 0;
                        setHeightCm(String(ftInToCm(f, i)));
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      style={[typography.metricLarge, styles.metricInput, { color: colors.text }]}
                    />
                    <Text style={[typography.title2, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
                      ft
                    </Text>
                  </View>

                  <View style={[styles.ftInBox, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
                    <TextInput
                      value={heightInches}
                      onChangeText={(val) => {
                        const num = val.replace(/[^0-9]/g, '');
                        setHeightInches(num);
                        const f = parseInt(heightFeet, 10) || 0;
                        const i = parseInt(num, 10) || 0;
                        setHeightCm(String(ftInToCm(f, i)));
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={[typography.metricLarge, styles.metricInput, { color: colors.text }]}
                    />
                    <Text style={[typography.title2, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
                      in
                    </Text>
                  </View>
                </View>

                {/* Steppers */}
                <View style={[styles.steppersRow, { marginTop: spacing.md }]}>
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                    onPress={() => adjustHeightFtIn(0, -1)}
                  >
                    <Text style={[typography.headline, { color: colors.text }]}>-1"</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                    onPress={() => adjustHeightFtIn(0, 1)}
                  >
                    <Text style={[typography.headline, { color: colors.text }]}>+1"</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                    onPress={() => adjustHeightFtIn(-1, 0)}
                  >
                    <Text style={[typography.headline, { color: colors.text }]}>-1'</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                    onPress={() => adjustHeightFtIn(1, 0)}
                  >
                    <Text style={[typography.headline, { color: colors.text }]}>+1'</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Card: Weight Goals (Optional initial stats) */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="scale" size={18} color={isDark ? colors.accentDark : colors.accent} />
              </View>
              <View>
                <Text style={[typography.title3, { color: colors.text }]}>Weight Targets</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>Optional — can be updated anytime</Text>
              </View>
            </View>

            <View style={styles.weightRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                <Text style={[typography.captionBold, styles.fieldLabel, { color: colors.textSecondary }]}>
                  Current Weight (kg)
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
                  <TextInput
                    value={currentWeight}
                    onChangeText={setCurrentWeight}
                    placeholder="e.g. 78.5"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                    style={[typography.body, styles.textInput, { color: colors.text }]}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[typography.captionBold, styles.fieldLabel, { color: colors.textSecondary }]}>
                  Goal Weight (kg)
                </Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
                  <TextInput
                    value={targetWeight}
                    onChangeText={setTargetWeight}
                    placeholder="e.g. 75.0"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                    style={[typography.body, styles.textInput, { color: colors.text }]}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Submit Action */}
          <View style={styles.submitWrap}>
            <PrimaryButton
              title="Complete Profile & Begin"
              onPress={handleSubmit}
              loading={saving}
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  welcomeHero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  mottoBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  mottoTitle: {
    letterSpacing: 2,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  mottoSubtitle: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  featureList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    flex: 1,
  },
  welcomeActionWrap: {
    marginTop: spacing.sm,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  welcomeTitle: {
    marginTop: spacing.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 300,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarScroll: {
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  avatarOption: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  avatarLabel: {
    marginTop: spacing.xs,
    fontSize: 11,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.xs,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  goalChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  goalChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  customGoalInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm + 2,
    height: 44,
    fontSize: 13,
  },
  unitToggleRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  unitToggleBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  unitToggleBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  heightContainer: {
    alignItems: 'center',
    width: '100%',
  },
  metricBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  metricInput: {
    textAlign: 'center',
    minWidth: 70,
    fontSize: 32,
    fontWeight: '700',
  },
  ftInRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  ftInBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.sm,
  },
  steppersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  stepBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  weightRow: {
    flexDirection: 'row',
  },
  submitWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
