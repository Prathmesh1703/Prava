import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Avatar,
  AVATAR_PRESETS,
  Card,
  FeedbackModal,
  Header,
  PrimaryButton,
  QuickWeightModal,
  ScreenContainer,
  SecondaryButton,
  SectionHeader,
  SettingRow
} from '../../src/components';
import { useApp } from '../../src/context/AppContext';
import { useTheme } from '../../src/context/ThemeContext';
import { radius, spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
import { ThemePreference, UserProfile } from '../../src/types';

// ── Unit Conversion Helpers ──────────────────────────────────────────────────
export const cmToFtIn = (cm: number) => {
  const safeCm = Math.max(0, cm || 0);
  const totalInches = Math.round(safeCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet, inches, label: `${feet}' ${inches}"` };
};

export const ftInToCm = (feet: number, inches: number) => {
  const safeFeet = Math.max(0, feet || 0);
  const safeInches = Math.max(0, Math.min(11, inches || 0));
  return Math.round((safeFeet * 12 + safeInches) * 2.54);
};

export default function ProfileScreen() {
  const { theme, setTheme, colors, isDark } = useTheme();
  const router = useRouter();
  const {
    profile,
    updateProfile,
    isPinSetup,
    privatePhotosEnabled,
    setPrivatePhotosEnabled,
  } = useApp();

  // Modals state
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [heightModalVisible, setHeightModalVisible] = useState(false);
  const [targetWeightModalVisible, setTargetWeightModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [frequencyModalVisible, setFrequencyModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [restDaysModalVisible, setRestDaysModalVisible] = useState(false);
  const [restModalMode, setRestModalMode] = useState<'weekly' | 'monthly'>('weekly');
  const [customRestValue, setCustomRestValue] = useState<number>(profile.restDaysValue ?? (profile.restDaysPerWeek ?? 1));

  const handleOpenRestDaysModal = () => {
    triggerHaptic();
    const mode = profile.restDaysMode || 'weekly';
    const val = profile.restDaysValue ?? (profile.restDaysPerWeek ?? 1);
    setRestModalMode(mode);
    setCustomRestValue(val);
    setRestDaysModalVisible(true);
  };

  const handleSelectRestDays = async (mode: 'weekly' | 'monthly', val: number) => {
    triggerHaptic();
    const weeklyEquivalent = mode === 'weekly' ? val : Math.max(0, Math.min(6, Math.round(val / 4)));
    await updateProfile({
      restDaysMode: mode,
      restDaysValue: val,
      restDaysPerWeek: weeklyEquivalent,
    });
    setRestDaysModalVisible(false);
  };
  const [selectedAvatarId, setSelectedAvatarId] = useState(profile.avatarId || 'lifter');

  // Height state (supports both CM and FT & IN)
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft_in'>('cm');
  const initialFtIn = cmToFtIn(profile.heightCm || 170);
  const [tempHeightCm, setTempHeightCm] = useState(String(profile.heightCm || 170));
  const [tempFeet, setTempFeet] = useState(String(initialFtIn.feet));
  const [tempInches, setTempInches] = useState(String(initialFtIn.inches));

  // Frequency custom state
  const [frequencyMode, setFrequencyMode] = useState<'preset' | 'custom'>('preset');
  const [customDays, setCustomDays] = useState(String(profile.photoFrequencyDays || 30));

  // Quick edit single-field states
  const [tempTargetWeight, setTempTargetWeight] = useState(
    profile.targetWeightKg ? String(profile.targetWeightKg) : '75.0'
  );
  const [tempGoal, setTempGoal] = useState(profile.workoutGoal || 'Hypertrophy');

  // Form state for full profile editor (pencil icon)
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: profile.name,
    email: profile.email,
    gymName: profile.gymName,
    workoutGoal: profile.workoutGoal,
    heightCm: profile.heightCm,
    targetWeightKg: profile.targetWeightKg,
    avatarId: profile.avatarId || 'lifter',
  });

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) { }
    }
  };

  // Full Profile Editor
  const handleOpenEditProfile = () => {
    setFormData({
      name: profile.name,
      email: profile.email,
      gymName: profile.gymName,
      workoutGoal: profile.workoutGoal,
      heightCm: profile.heightCm,
      targetWeightKg: profile.targetWeightKg,
      avatarId: profile.avatarId || 'lifter',
    });
    setEditProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    await updateProfile({
      name: formData.name?.trim() || profile.name,
      email: formData.email?.trim() || profile.email,
      gymName: formData.gymName?.trim() || profile.gymName,
      workoutGoal: formData.workoutGoal?.trim() || profile.workoutGoal,
      heightCm: Number(formData.heightCm) || profile.heightCm,
      targetWeightKg: Number(formData.targetWeightKg) || profile.targetWeightKg,
      avatarId: formData.avatarId || profile.avatarId || 'lifter',
    });
    setEditProfileModalVisible(false);
  };

  // Avatar Modal Handlers
  const handleOpenAvatarModal = () => {
    triggerHaptic();
    setSelectedAvatarId(profile.avatarId || 'lifter');
    setAvatarModalVisible(true);
  };

  const handleSaveAvatar = async (avatarId: string) => {
    triggerHaptic();
    setSelectedAvatarId(avatarId);
    await updateProfile({ avatarId });
    setAvatarModalVisible(false);
  };

  // Quick Height Modal Handlers
  const handleOpenHeight = () => {
    const currentCm = profile.heightCm || 170;
    const ftIn = cmToFtIn(currentCm);
    setTempHeightCm(String(currentCm));
    setTempFeet(String(ftIn.feet));
    setTempInches(String(ftIn.inches));
    setHeightModalVisible(true);
  };

  const adjustHeightCm = (delta: number) => {
    triggerHaptic();
    const current = parseInt(tempHeightCm, 10) || 170;
    const next = Math.max(100, Math.min(250, current + delta));
    setTempHeightCm(String(next));
    const ftIn = cmToFtIn(next);
    setTempFeet(String(ftIn.feet));
    setTempInches(String(ftIn.inches));
  };

  const adjustHeightFtIn = (feetDelta: number, inchesDelta: number) => {
    triggerHaptic();
    let f = parseInt(tempFeet, 10) || 5;
    let i = parseInt(tempInches, 10) || 0;

    let totalInches = f * 12 + i + feetDelta * 12 + inchesDelta;
    totalInches = Math.max(36, Math.min(96, totalInches)); // 3ft to 8ft

    const nextFeet = Math.floor(totalInches / 12);
    const nextInches = totalInches % 12;
    const nextCm = ftInToCm(nextFeet, nextInches);

    setTempFeet(String(nextFeet));
    setTempInches(String(nextInches));
    setTempHeightCm(String(nextCm));
  };

  const handleSaveHeight = async () => {
    let finalCm: number;
    if (heightUnit === 'cm') {
      finalCm = parseInt(tempHeightCm, 10);
    } else {
      const f = parseInt(tempFeet, 10) || 5;
      const i = parseInt(tempInches, 10) || 0;
      finalCm = ftInToCm(f, i);
    }

    if (!isNaN(finalCm) && finalCm >= 50 && finalCm <= 260) {
      await updateProfile({ heightCm: finalCm });
      setHeightModalVisible(false);
    }
  };

  // Quick Target Weight Modal Handlers
  const handleOpenTargetWeight = () => {
    setTempTargetWeight(
      profile.targetWeightKg ? String(profile.targetWeightKg) : '75.0'
    );
    setTargetWeightModalVisible(true);
  };

  const adjustTargetWeight = (delta: number) => {
    triggerHaptic();
    const current = parseFloat(tempTargetWeight) || 75.0;
    const next = Math.max(30, Math.min(300, current + delta));
    setTempTargetWeight(next.toFixed(1));
  };

  const handleSaveTargetWeight = async () => {
    const val = parseFloat(tempTargetWeight);
    if (!isNaN(val) && val > 0 && val < 400) {
      await updateProfile({ targetWeightKg: val });
      setTargetWeightModalVisible(false);
    }
  };

  // Quick Goal Modal Handlers
  const handleOpenGoal = () => {
    setTempGoal(profile.workoutGoal || 'Hypertrophy');
    setGoalModalVisible(true);
  };

  const handleSaveGoal = async () => {
    if (tempGoal.trim()) {
      await updateProfile({ workoutGoal: tempGoal.trim() });
      setGoalModalVisible(false);
    }
  };

  // Frequency Modal Handlers
  const handleOpenFrequencyModal = () => {
    const curr = profile.photoFrequencyDays || 30;
    setCustomDays(String(curr));
    const presets = [7, 14, 15, 30, 45, 60];
    setFrequencyMode(presets.includes(curr) ? 'preset' : 'custom');
    setFrequencyModalVisible(true);
  };

  const adjustFrequency = (delta: number) => {
    triggerHaptic();
    const curr = parseInt(customDays, 10) || 30;
    const next = Math.max(1, Math.min(365, curr + delta));
    setCustomDays(String(next));
    setFrequencyMode('custom');
  };

  const handleSelectFrequencyPreset = (days: number) => {
    triggerHaptic();
    setCustomDays(String(days));
    setFrequencyMode('preset');
  };

  const handleSaveFrequency = async () => {
    const days = parseInt(customDays, 10);
    if (!isNaN(days) && days > 0 && days <= 365) {
      await updateProfile({ photoFrequencyDays: days });
      setFrequencyModalVisible(false);
    }
  };

  const getThemeLabel = (t: ThemePreference) => {
    switch (t) {
      case 'system':
        return 'System';
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
    }
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'AR';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return nameStr.slice(0, 2).toUpperCase();
  };

  const frequencyPresets = [7, 14, 15, 30, 45, 60];
  const goalPresets = [
    'Hypertrophy',
    'Strength',
    'Fat Loss',
    'Endurance',
    'General Fitness',
    'Athletic Conditioning',
  ];

  return (
    <ScreenContainer>
      <Header
        title="My Profile"
        subtitle="Account & Settings"
      />

      {/* USER IDENTITY GLASS CARD WITH LIGHTWEIGHT AVATAR */}
      <Card glass style={styles.identityCard}>
        <View style={styles.identityRow}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handleOpenAvatarModal}
            activeOpacity={0.8}
          >
            <Avatar avatarId={profile.avatarId || 'lifter'} size={60} />
            <View style={[styles.avatarEditBadge, { backgroundColor: colors.accent }]}>
              <Ionicons name="pencil" size={10} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.identityInfo}>
            <Text style={[typography.title2, { color: colors.text }]}>
              {profile.name}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 1 }]}>
              {profile.email}
            </Text>
            <View style={[styles.gymBadge, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="barbell" size={12} color={isDark ? colors.accentDark : colors.accent} />
              <Text style={[typography.captionBold, { color: isDark ? colors.accentDark : colors.accent, marginLeft: 4, fontSize: 11 }]}>
                {profile.gymName}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: colors.cardMuted }]}
            onPress={handleOpenEditProfile}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={16} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </Card>

      {/* BODY METRICS */}
      <SectionHeader title="Body Metrics" />
      <View style={[styles.groupedList, { borderColor: isDark ? colors.border : colors.borderSubtle }]}>
        <SettingRow
          icon="body-outline"
          iconColor="#FF6A00"
          label="Height"
          value={`${profile.heightCm} cm (${cmToFtIn(profile.heightCm).label})`}
          onPress={handleOpenHeight}
          isFirst
        />
        <SettingRow
          icon="scale-outline"
          iconColor="#10B981"
          label="Current Weight"
          value={`${profile.currentWeightKg.toFixed(1)} kg`}
          onPress={() => setWeightModalVisible(true)}
        />
        <SettingRow
          icon="trending-up-outline"
          iconColor="#EC4899"
          label="Target Goal Weight"
          value={profile.targetWeightKg ? `${profile.targetWeightKg} kg` : 'Not set'}
          onPress={handleOpenTargetWeight}
        />
        <SettingRow
          icon="flag-outline"
          iconColor="#8B5CF6"
          label="Training Goal"
          value={profile.workoutGoal || 'Hypertrophy'}
          onPress={handleOpenGoal}
          isLast
        />
      </View>

      {/* PREFERENCES */}
      <SectionHeader title="Preferences" />
      <View style={[styles.groupedList, { borderColor: isDark ? colors.border : colors.borderSubtle }]}>
        <SettingRow
          icon="contrast-outline"
          iconColor="#8B5CF6"
          label="Appearance"
          value={getThemeLabel(theme)}
          onPress={() => setThemeModalVisible(true)}
          isFirst
        />
        <SettingRow
          icon="notifications-outline"
          iconColor="#F59E0B"
          label="Notifications"
          onPress={() => router.push('/settings/notifications')}
        />
        <SettingRow
          icon="camera-outline"
          iconColor="#EC4899"
          label="Progress Photo Frequency"
          value={`Every ${profile.photoFrequencyDays} days`}
          onPress={handleOpenFrequencyModal}
        />
        <SettingRow
          icon="bed-outline"
          iconColor="#3B82F6"
          label="Rest Days"
          value={
            (profile.restDaysValue ?? profile.restDaysPerWeek ?? 1) === 0
              ? '0 days (Strict daily)'
              : (profile.restDaysMode || 'weekly') === 'weekly'
                ? `${profile.restDaysValue ?? profile.restDaysPerWeek ?? 1} ${(profile.restDaysValue ?? profile.restDaysPerWeek ?? 1) === 1 ? 'day' : 'days'} / wk ${(profile.restDaysValue ?? profile.restDaysPerWeek ?? 1) === 1 ? '(Sunday)' : ''}`
                : `${profile.restDaysValue ?? 4} ${(profile.restDaysValue ?? 4) === 1 ? 'day' : 'days'} / mo`
          }
          onPress={handleOpenRestDaysModal}
          isLast
        />
      </View>

      {/* PRIVACY SECTION */}
      <SectionHeader title="Privacy & Security" />
      <View style={[styles.groupedList, { borderColor: isDark ? colors.border : colors.borderSubtle }]}>
        <SettingRow
          icon="lock-closed"
          iconColor="#6366F1"
          label="Private Check-ins"
          value={isPinSetup ? 'Configured' : 'Set PIN'}
          onPress={() => router.push('/private')}
          isFirst
          isLast
        />
      </View>

      {/* DATA & BACKUP */}
      <SectionHeader title="Data Management" />
      <View style={[styles.groupedList, { borderColor: isDark ? colors.border : colors.borderSubtle }]}>
        <SettingRow
          icon="cloud-download-outline"
          iconColor="#06B6D4"
          label="Backup & Restore"
          onPress={() => router.push('/settings/backup')}
          isFirst
          isLast
        />
      </View>

      {/* ABOUT */}
      <SectionHeader title="About" />
      <View style={[styles.groupedList, { borderColor: isDark ? colors.border : colors.borderSubtle }]}>
        <SettingRow
          icon="information-circle-outline"
          label="Application"
          value="v1.1.0"
          showChevron={false}
          isFirst
        />
        <SettingRow
          icon="star-outline"
          iconColor="#F59E0B"
          label="Feedback & Rating"
          value="Rate Prava"
          onPress={() => setFeedbackModalVisible(true)}
        />
        <SettingRow
          icon="shield-outline"
          iconColor="#10B981"
          label="Privacy Policy"
          onPress={() => router.push('/legal/privacy')}
        />
        <SettingRow
          icon="document-text-outline"
          iconColor="#FF6A00"
          label="Terms & Conditions"
          onPress={() => router.push('/legal/terms')}
        />
        <SettingRow
          icon="lock-closed-outline"
          iconColor="#8B5CF6"
          label="Google Play Data Safety"
          onPress={() => router.push('/legal/datasafety')}
          isLast
        />
      </View>

      {/* FEEDBACK POPUP MODAL */}
      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
      />

      {/* AVATAR SELECTOR MODAL */}
      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
          <View style={[styles.avatarModalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.title2, { color: colors.text, textAlign: 'center' }]}>
              Choose Your Avatar
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 2, marginBottom: spacing.lg }]}>
              Lightweight vector avatars for your profile
            </Text>

            <View style={styles.avatarGrid}>
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedAvatarId === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.avatarGridItem,
                      isSelected && [styles.avatarGridItemSelected, { borderColor: colors.accent }],
                    ]}
                    onPress={() => handleSaveAvatar(preset.id)}
                    activeOpacity={0.7}
                  >
                    <Avatar avatarId={preset.id} size={48} />
                    <Text
                      style={[
                        typography.captionBold,
                        {
                          color: isSelected ? colors.accent : colors.text,
                          marginTop: 6,
                          fontSize: 11,
                        },
                      ]}
                    >
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ marginTop: spacing.lg, width: '100%' }}>
              <SecondaryButton
                title="Close"
                onPress={() => setAvatarModalVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* QUICK HEIGHT MODAL (CM & FT/IN TOGGLE) */}
      <Modal
        visible={heightModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHeightModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
          <View style={[styles.compactModalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.title2, { color: colors.text, textAlign: 'center' }]}>
              Update Height
            </Text>

            {/* Unit Selector Toggle */}
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
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    typography.captionBold,
                    { color: heightUnit === 'cm' ? colors.text : colors.textSecondary },
                  ]}
                >
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
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    typography.captionBold,
                    { color: heightUnit === 'ft_in' ? colors.text : colors.textSecondary },
                  ]}
                >
                  Feet & Inches (ft/in)
                </Text>
              </TouchableOpacity>
            </View>

            {heightUnit === 'cm' ? (
              <>
                <View style={[styles.metricDisplayBox, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
                  <TextInput
                    value={tempHeightCm}
                    onChangeText={(text) => {
                      setTempHeightCm(text);
                      const num = parseInt(text, 10);
                      if (!isNaN(num)) {
                        const ftIn = cmToFtIn(num);
                        setTempFeet(String(ftIn.feet));
                        setTempInches(String(ftIn.inches));
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
                <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'center', marginTop: 4, marginBottom: spacing.md }]}>
                  ≈ {cmToFtIn(parseInt(tempHeightCm, 10) || 170).label}
                </Text>

                <View style={styles.steppersRow}>
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
              </>
            ) : (
              <>
                <View style={styles.ftInRow}>
                  {/* Feet Box */}
                  <View style={[styles.ftInBox, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
                    <TextInput
                      value={tempFeet}
                      onChangeText={(text) => {
                        setTempFeet(text);
                        const f = parseInt(text, 10) || 0;
                        const i = parseInt(tempInches, 10) || 0;
                        setTempHeightCm(String(ftInToCm(f, i)));
                      }}
                      keyboardType="number-pad"
                      maxLength={1}
                      style={[typography.metricLarge, styles.metricInput, { color: colors.text }]}
                    />
                    <Text style={[typography.title3, { color: colors.textSecondary, marginLeft: 2 }]}>
                      ft
                    </Text>
                  </View>

                  {/* Inches Box */}
                  <View style={[styles.ftInBox, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
                    <TextInput
                      value={tempInches}
                      onChangeText={(text) => {
                        setTempInches(text);
                        const f = parseInt(tempFeet, 10) || 0;
                        const i = parseInt(text, 10) || 0;
                        setTempHeightCm(String(ftInToCm(f, i)));
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                      style={[typography.metricLarge, styles.metricInput, { color: colors.text }]}
                    />
                    <Text style={[typography.title3, { color: colors.textSecondary, marginLeft: 2 }]}>
                      in
                    </Text>
                  </View>
                </View>
                <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'center', marginTop: 4, marginBottom: spacing.md }]}>
                  ≈ {ftInToCm(parseInt(tempFeet, 10) || 5, parseInt(tempInches, 10) || 0)} cm
                </Text>

                <View style={styles.steppersRow}>
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                    onPress={() => adjustHeightFtIn(0, -1)}
                  >
                    <Text style={[typography.captionBold, { color: colors.text }]}>-1 in</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                    onPress={() => adjustHeightFtIn(0, 1)}
                  >
                    <Text style={[typography.captionBold, { color: colors.text }]}>+1 in</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                    onPress={() => adjustHeightFtIn(-1, 0)}
                  >
                    <Text style={[typography.captionBold, { color: colors.text }]}>-1 ft</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                    onPress={() => adjustHeightFtIn(1, 0)}
                  >
                    <Text style={[typography.captionBold, { color: colors.text }]}>+1 ft</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.modalBtnRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setHeightModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <PrimaryButton
                title="Save"
                onPress={handleSaveHeight}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* QUICK TARGET WEIGHT MODAL */}
      <Modal
        visible={targetWeightModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTargetWeightModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
          <View style={[styles.compactModalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.title2, { color: colors.text, textAlign: 'center' }]}>
              Target Goal Weight
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 2, marginBottom: spacing.md }]}>
              Set your target body weight goal
            </Text>

            <View style={[styles.metricDisplayBox, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
              <TextInput
                value={tempTargetWeight}
                onChangeText={setTempTargetWeight}
                keyboardType="decimal-pad"
                maxLength={5}
                style={[typography.metricLarge, styles.metricInput, { color: colors.text }]}
              />
              <Text style={[typography.title2, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
                kg
              </Text>
            </View>

            <View style={styles.steppersRow}>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                onPress={() => adjustTargetWeight(-1.0)}
              >
                <Text style={[typography.headline, { color: colors.text }]}>-1.0</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                onPress={() => adjustTargetWeight(-0.5)}
              >
                <Text style={[typography.headline, { color: colors.text }]}>-0.5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                onPress={() => adjustTargetWeight(0.5)}
              >
                <Text style={[typography.headline, { color: colors.text }]}>+0.5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                onPress={() => adjustTargetWeight(1.0)}
              >
                <Text style={[typography.headline, { color: colors.text }]}>+1.0</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBtnRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setTargetWeightModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <PrimaryButton
                title="Save"
                onPress={handleSaveTargetWeight}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* QUICK TRAINING GOAL MODAL */}
      <Modal
        visible={goalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
          <View style={[styles.compactModalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.title2, { color: colors.text, textAlign: 'center' }]}>
              Training Goal
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 2, marginBottom: spacing.md }]}>
              Choose or type your main fitness target
            </Text>

            <TextInput
              value={tempGoal}
              onChangeText={setTempGoal}
              placeholder="e.g. Hypertrophy, Strength"
              placeholderTextColor={colors.textTertiary}
              style={[typography.headline, styles.inputField, { backgroundColor: colors.cardMuted, color: colors.text, borderColor: colors.border, marginBottom: spacing.md }]}
            />

            <View style={styles.goalPresetsGrid}>
              {goalPresets.map((goal) => {
                const isSelected = tempGoal.toLowerCase() === goal.toLowerCase();
                return (
                  <TouchableOpacity
                    key={goal}
                    style={[
                      styles.goalChip,
                      {
                        backgroundColor: isSelected ? colors.accentLight : colors.cardMuted,
                        borderColor: isSelected ? colors.accent : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setTempGoal(goal);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        typography.captionBold,
                        { color: isSelected ? (isDark ? colors.accentDark : colors.accent) : colors.text },
                      ]}
                    >
                      {goal}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalBtnRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setGoalModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <PrimaryButton
                title="Save"
                onPress={handleSaveGoal}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* POLISHED DYNAMIC PROGRESS PHOTO FREQUENCY MODAL */}
      <Modal
        visible={frequencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFrequencyModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
          <View style={[styles.compactModalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.title2, { color: colors.text, textAlign: 'center' }]}>
              Photo Frequency
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 2, marginBottom: spacing.md }]}>
              How often Prava prompts you for a progress photo
            </Text>

            {/* Presets & Custom Pill Selector */}
            <View style={styles.presetsGrid}>
              {frequencyPresets.map((preset) => {
                const isSelected = frequencyMode === 'preset' && parseInt(customDays, 10) === preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isSelected ? colors.accentLight : colors.cardMuted,
                        borderColor: isSelected ? colors.accent : 'transparent',
                      },
                    ]}
                    onPress={() => handleSelectFrequencyPreset(preset)}
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
                      {preset}d
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Explicit Custom Option */}
              <TouchableOpacity
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: frequencyMode === 'custom' ? colors.accentLight : colors.cardMuted,
                    borderColor: frequencyMode === 'custom' ? colors.accent : 'transparent',
                  },
                ]}
                onPress={() => {
                  triggerHaptic();
                  setFrequencyMode('custom');
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    typography.captionBold,
                    {
                      color: frequencyMode === 'custom' ? (isDark ? colors.accentDark : colors.accent) : colors.text,
                    },
                  ]}
                >
                  Custom
                </Text>
              </TouchableOpacity>
            </View>

            {/* Centered Large Days Input */}
            <View style={[styles.metricDisplayBox, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
              <TextInput
                value={customDays}
                onChangeText={(text) => {
                  setCustomDays(text);
                  setFrequencyMode('custom');
                }}
                keyboardType="number-pad"
                maxLength={3}
                style={[typography.metricLarge, styles.metricInput, { color: colors.text }]}
              />
              <Text style={[typography.title2, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
                days
              </Text>
            </View>

            {/* Steppers */}
            <View style={styles.steppersRow}>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                onPress={() => adjustFrequency(-5)}
              >
                <Text style={[typography.headline, { color: colors.text }]}>-5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                onPress={() => adjustFrequency(-1)}
              >
                <Text style={[typography.headline, { color: colors.text }]}>-1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                onPress={() => adjustFrequency(1)}
              >
                <Text style={[typography.headline, { color: colors.text }]}>+1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
                onPress={() => adjustFrequency(5)}
              >
                <Text style={[typography.headline, { color: colors.text }]}>+5</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBtnRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setFrequencyModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <PrimaryButton
                title="Save"
                onPress={handleSaveFrequency}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* THEME / APPEARANCE MODAL */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
          <View style={[styles.compactModalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.title2, { color: colors.text, textAlign: 'center' }]}>
              Appearance
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 2, marginBottom: spacing.md }]}>
              Choose your preferred visual theme
            </Text>

            <View style={{ marginVertical: spacing.xs }}>
              {[
                { key: 'dark', label: 'Dark Mode', desc: 'Prava focus & balance aesthetic' },
                { key: 'light', label: 'Light Mode', desc: 'High-contrast clean view' },
                { key: 'system', label: 'System Default', desc: 'Follows device setting' },
              ].map((item) => {
                const isSelected = theme === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.themeOptionRow,
                      {
                        backgroundColor: isSelected ? colors.accentLight : colors.cardMuted,
                        borderColor: isSelected ? colors.accent : (isDark ? colors.border : colors.borderSubtle),
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setTheme(item.key as ThemePreference);
                      setThemeModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.headline, { color: isSelected ? (isDark ? colors.accentDark : colors.accent) : colors.text }]}>
                        {item.label}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 1 }]}>
                        {item.desc}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={isDark ? colors.accentDark : colors.accent} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <SecondaryButton
              title="Close"
              onPress={() => setThemeModalVisible(false)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>

      {/* REST DAYS CUSTOMIZATION MODAL (WEEKLY / MONTHLY / CUSTOM) */}
      <Modal
        visible={restDaysModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRestDaysModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
          <View style={[styles.compactModalBox, { backgroundColor: colors.card, borderColor: colors.border, maxWidth: 360, maxHeight: '88%' }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.sm }}>
              <Text style={[typography.title2, { color: colors.text, textAlign: 'center' }]}>
                Rest Days Settings
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 3, marginBottom: spacing.md }]}>
                Rest days preserve your streak without resetting it to 0. Sunday is default rest day for weekly mode.
              </Text>

              {/* Mode Toggle: Weekly vs Monthly */}
              <View style={[styles.modeTabsContainer, { backgroundColor: colors.cardMuted, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.modeTabBtn,
                    restModalMode === 'weekly' && {
                      backgroundColor: colors.accent,
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    setRestModalMode('weekly');
                    if (customRestValue > 6) setCustomRestValue(1);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      typography.captionBold,
                      { color: restModalMode === 'weekly' ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    Weekly
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeTabBtn,
                    restModalMode === 'monthly' && {
                      backgroundColor: colors.accent,
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    setRestModalMode('monthly');
                    if (customRestValue < 4) setCustomRestValue(4);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      typography.captionBold,
                      { color: restModalMode === 'monthly' ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    Monthly
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Presets List */}
              <View style={{ marginVertical: spacing.xs }}>
                {(restModalMode === 'weekly'
                  ? [
                    { val: 1, label: '1 Day / Week (Sunday)', desc: 'Recommended • Sunday default rest day' },
                    { val: 2, label: '2 Days / Week', desc: 'Preserves streak with up to 2 rest days/wk' },
                    { val: 3, label: '3 Days / Week', desc: 'Flexible 4-day workout schedule' },
                    { val: 0, label: '0 Days (Strict)', desc: 'Must log every single day to keep streak' },
                  ]
                  : [
                    { val: 4, label: '4 Days / Month', desc: 'Standard monthly recovery (~1 day/week)' },
                    { val: 6, label: '6 Days / Month', desc: 'Moderate rest schedule across the month' },
                    { val: 8, label: '8 Days / Month', desc: 'High recovery (~2 rest days/week)' },
                    { val: 0, label: '0 Days (Strict)', desc: 'Must log every day to keep streak' },
                  ]
                ).map((item) => {
                  const isSelected =
                    (profile.restDaysMode || 'weekly') === restModalMode &&
                    (profile.restDaysValue ?? profile.restDaysPerWeek ?? 1) === item.val;

                  return (
                    <TouchableOpacity
                      key={item.val}
                      style={[
                        styles.themeOptionRow,
                        {
                          backgroundColor: isSelected ? colors.accentLight : colors.cardMuted,
                          borderColor: isSelected ? colors.accent : (isDark ? colors.border : colors.borderSubtle),
                        },
                      ]}
                      onPress={() => handleSelectRestDays(restModalMode, item.val)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.headline, { color: isSelected ? (isDark ? colors.accentDark : colors.accent) : colors.text }]}>
                          {item.label}
                        </Text>
                        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 1 }]}>
                          {item.desc}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={isDark ? colors.accentDark : colors.accent} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Rest Days Stepper Card */}
              <View style={[styles.customRestCard, { backgroundColor: colors.cardMuted, borderColor: colors.border }]}>
                <Text style={[typography.captionBold, { color: colors.text, textAlign: 'center', marginBottom: spacing.xs }]}>
                  Custom {restModalMode === 'weekly' ? 'Weekly' : 'Monthly'} Rest Days
                </Text>
                <View style={styles.customStepperRow}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      triggerHaptic();
                      setCustomRestValue((prev) => Math.max(0, prev - 1));
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={18} color={colors.text} />
                  </TouchableOpacity>

                  <View style={styles.customValBox}>
                    <Text style={[typography.title1, { color: colors.text, fontWeight: '700' }]}>
                      {customRestValue}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {customRestValue === 1 ? 'day' : 'days'} / {restModalMode === 'weekly' ? 'week' : 'month'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      triggerHaptic();
                      const maxVal = restModalMode === 'weekly' ? 6 : 25;
                      setCustomRestValue((prev) => Math.min(maxVal, prev + 1));
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.applyCustomBtn, { backgroundColor: colors.accent }]}
                  onPress={() => handleSelectRestDays(restModalMode, customRestValue)}
                  activeOpacity={0.8}
                >
                  <Text style={[typography.captionBold, { color: '#FFFFFF' }]}>
                    Apply {customRestValue} {customRestValue === 1 ? 'Day' : 'Days'} ({restModalMode === 'weekly' ? 'Weekly' : 'Monthly'})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Educational Rule Box */}
              <View style={[styles.restInfoBox, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)', borderColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.15)' }]}>
                <Ionicons name="information-circle-outline" size={16} color={isDark ? '#A5B4FC' : '#6366F1'} style={{ marginTop: 1 }} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[typography.caption, { color: isDark ? '#C7D2FE' : '#4338CA', lineHeight: 17 }]}>
                    • Only logged workout sessions increase streak.{'\n'}
                    • Rest days preserve your streak without inflating the count.{'\n'}
                    • Training on a rest day DOES boost your streak.{'\n'}
                    • Missing more than your allowed rest days resets streak to 0.
                  </Text>
                </View>
              </View>

              <SecondaryButton
                title="Close"
                onPress={() => setRestDaysModalVisible(false)}
                style={{ marginTop: spacing.md }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* COMPLETE PROFILE MODAL (PENCIL BUTTON) */}
      <Modal
        visible={editProfileModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.title2, { color: colors.text }]}>
                Edit Profile Details
              </Text>
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.cardMuted }]}
                onPress={() => setEditProfileModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingVertical: spacing.md, paddingBottom: spacing.xxl }}
              showsVerticalScrollIndicator={false}
            >
              {/* Avatar Selector in Edit Profile */}
              <Text style={[typography.captionBold, { color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' }]}>
                Choose Avatar
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: spacing.sm }}>
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = (formData.avatarId || 'lifter') === preset.id;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      style={{
                        alignItems: 'center',
                        padding: 6,
                        borderRadius: radius.md,
                        backgroundColor: isSelected ? colors.accentLight : colors.cardMuted,
                        borderWidth: 1.5,
                        borderColor: isSelected ? colors.accent : 'transparent',
                      }}
                      onPress={() => {
                        triggerHaptic();
                        setFormData((p) => ({ ...p, avatarId: preset.id }));
                      }}
                      activeOpacity={0.7}
                    >
                      <Avatar avatarId={preset.id} size={44} />
                      <Text
                        style={[
                          typography.captionBold,
                          {
                            fontSize: 10,
                            marginTop: 4,
                            color: isSelected ? (isDark ? colors.accentDark : colors.accent) : colors.textSecondary,
                          },
                        ]}
                      >
                        {preset.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[typography.captionBold, { color: colors.textSecondary, marginTop: spacing.sm, marginBottom: 4, textTransform: 'uppercase' }]}>
                Full Name
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData((p) => ({ ...p, name: text }))}
                placeholder="Your full name"
                placeholderTextColor={colors.textTertiary}
                style={[typography.body, styles.inputField, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              />

              <Text style={[typography.captionBold, { color: colors.textSecondary, marginTop: spacing.md, marginBottom: 4, textTransform: 'uppercase' }]}>
                Email Address
              </Text>
              <TextInput
                value={formData.email}
                onChangeText={(text) => setFormData((p) => ({ ...p, email: text }))}
                placeholder="athlete@prava.fit"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[typography.body, styles.inputField, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              />

              <Text style={[typography.captionBold, { color: colors.textSecondary, marginTop: spacing.md, marginBottom: 4, textTransform: 'uppercase' }]}>
                Home Gym / Location
              </Text>
              <TextInput
                value={formData.gymName}
                onChangeText={(text) => setFormData((p) => ({ ...p, gymName: text }))}
                placeholder="e.g. Iron Forge Club, Gold's Gym"
                placeholderTextColor={colors.textTertiary}
                style={[typography.body, styles.inputField, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              />

              <Text style={[typography.captionBold, { color: colors.textSecondary, marginTop: spacing.md, marginBottom: 4, textTransform: 'uppercase' }]}>
                Training Goal
              </Text>
              <TextInput
                value={formData.workoutGoal}
                onChangeText={(text) => setFormData((p) => ({ ...p, workoutGoal: text }))}
                placeholder="e.g. Hypertrophy, Strength, General Fitness"
                placeholderTextColor={colors.textTertiary}
                style={[typography.body, styles.inputField, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <Text style={[typography.captionBold, { color: colors.textSecondary, marginTop: spacing.md, marginBottom: 4, textTransform: 'uppercase' }]}>
                    Height (cm)
                  </Text>
                  <TextInput
                    value={formData.heightCm ? String(formData.heightCm) : ''}
                    onChangeText={(text) => setFormData((p) => ({ ...p, heightCm: Number(text) || 0 }))}
                    placeholder="170"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                    maxLength={3}
                    style={[typography.body, styles.inputField, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  />
                  <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                    ≈ {cmToFtIn(Number(formData.heightCm) || 170).label}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={[typography.captionBold, { color: colors.textSecondary, marginTop: spacing.md, marginBottom: 4, textTransform: 'uppercase' }]}>
                    Target Weight (kg)
                  </Text>
                  <TextInput
                    value={formData.targetWeightKg ? String(formData.targetWeightKg) : ''}
                    onChangeText={(text) => setFormData((p) => ({ ...p, targetWeightKg: Number(text) || 0 }))}
                    placeholder="75.0"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                    maxLength={5}
                    style={[typography.body, styles.inputField, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Save Changes"
                  onPress={handleSaveProfile}
                  size="lg"
                />
                <SecondaryButton
                  title="Cancel"
                  onPress={() => setEditProfileModalVisible(false)}
                  style={{ marginTop: spacing.sm }}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* APPEARANCE MODAL */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
          <View style={[styles.compactModalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.title2, { color: colors.text, marginBottom: spacing.md, textAlign: 'center' }]}>
              Appearance
            </Text>

            {(['system', 'light', 'dark'] as ThemePreference[]).map((t) => {
              const selected = theme === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.themeOptionRow,
                    {
                      backgroundColor: selected ? colors.accentLight : colors.cardMuted,
                      borderColor: selected ? colors.accent : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    setTheme(t);
                    setThemeModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      typography.headline,
                      {
                        color: selected
                          ? (isDark ? colors.accentDark : colors.accent)
                          : colors.text,
                        fontWeight: selected ? '600' : '400',
                      },
                    ]}
                  >
                    {getThemeLabel(t)}
                  </Text>
                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={isDark ? colors.accentDark : colors.accent}
                    />
                  )}
                </TouchableOpacity>
              );
            })}

            <SecondaryButton
              title="Close"
              onPress={() => setThemeModalVisible(false)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>

      {/* Quick Weight Modal */}
      <QuickWeightModal
        visible={weightModalVisible}
        onClose={() => setWeightModalVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  identityCard: {
    marginVertical: spacing.xs,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  identityInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  gymBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: spacing.xs + 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  groupedList: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: spacing.xxs,
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  modalHeader: {
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
  inputField: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  formRow: {
    flexDirection: 'row',
  },
  modalActions: {
    marginTop: spacing.xl,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  compactModalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
  },
  themeOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    marginVertical: 4,
  },
  metricDisplayBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginVertical: spacing.sm,
  },
  metricInput: {
    textAlign: 'center',
    minWidth: 80,
  },
  steppersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  stepBtn: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    minWidth: 52,
    alignItems: 'center',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalPresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  goalChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  modalBtnRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    width: '100%',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarModalBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  avatarGridItem: {
    alignItems: 'center',
    padding: spacing.xs + 2,
    borderRadius: radius.lg,
    borderWidth: 2,
    minWidth: 68,
  },
  avatarGridItemSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  unitToggleRow: {
    flexDirection: 'row',
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  unitToggleBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: radius.full,
  },
  unitToggleBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  ftInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  ftInBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    minWidth: 100,
  },
  modeTabsContainer: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 3,
    marginBottom: spacing.sm,
  },
  modeTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  customRestCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  customStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customValBox: {
    alignItems: 'center',
    minWidth: 90,
  },
  applyCustomBtn: {
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  restInfoBox: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
});
