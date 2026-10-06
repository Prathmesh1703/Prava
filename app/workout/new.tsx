import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useApp } from '../../src/context/AppContext';
import {
  ScreenContainer,
  Header,
  SectionHeader,
  MuscleGroupChip,
  PrimaryButton,
  SecondaryButton,
  PrivateCheckinModal,
  Card,
  Calendar,
} from '../../src/components';
import { MuscleGroup, ALL_MUSCLE_GROUPS } from '../../src/types';
import { typography } from '../../src/theme/typography';
import { radius, spacing } from '../../src/theme/spacing';
import { localDateString } from '../../src/db/dateUtils';

export default function NewWorkoutScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const {
    workouts,
    todayWorkout,
    saveWorkout,
    privateEnabled,
    activePrivateQuestions,
  } = useApp();

  const todayStr = localDateString();

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const yesterdayStr = getYesterdayStr();

  const initialDate =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? (params.date > todayStr ? todayStr : params.date)
      : todayStr;

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [checkinModalVisible, setCheckinModalVisible] = useState<boolean>(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Check if there is an existing workout on selectedDate
  const existingWorkout = workouts.find((w) => w.date === selectedDate);

  // Sync form when selected date changes or workouts update
  useEffect(() => {
    if (existingWorkout) {
      setSelectedMuscles(existingWorkout.muscleGroups);
      setNotes(existingWorkout.notes || '');
    } else {
      setSelectedMuscles([]);
      setNotes('');
    }
  }, [selectedDate, existingWorkout]);

  const handleToggleMuscle = (muscle: MuscleGroup) => {
    setValidationError(null);
    setSelectedMuscles((prev) =>
      prev.includes(muscle)
        ? prev.filter((m) => m !== muscle)
        : [...prev, muscle]
    );
  };

  const handleSelectAllOrClear = () => {
    if (selectedMuscles.length === ALL_MUSCLE_GROUPS.length) {
      setSelectedMuscles([]);
    } else {
      setSelectedMuscles([...ALL_MUSCLE_GROUPS]);
    }
  };

  const executeSave = async () => {
    setIsSaving(true);
    try {
      await saveWorkout({
        date: selectedDate,
        muscleGroups: selectedMuscles,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch (e: any) {
      setValidationError(e?.message || 'Failed to save workout. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePress = () => {
    if (selectedDate > todayStr) {
      setValidationError('Workouts cannot be logged for future dates.');
      return;
    }

    if (selectedMuscles.length === 0) {
      setValidationError('Please select at least one muscle group.');
      return;
    }

    // Rule: flow: log workout --> private check in --> pin --> answer the question --> save workout and private question
    if (privateEnabled) {
      setCheckinModalVisible(true);
      return;
    }

    // Otherwise save directly
    executeSave();
  };

  const handlePrivateCheckinSuccess = async () => {
    setCheckinModalVisible(false);
    await executeSave();
  };

  const formatDisplayDate = (dStr: string) => {
    if (dStr === todayStr) return 'Today';
    if (dStr === yesterdayStr) return 'Yesterday';
    const d = new Date(dStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <ScreenContainer withPillPadding={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Header
          title={existingWorkout ? 'Edit Workout' : 'Log Workout'}
          subtitle={formatDisplayDate(selectedDate)}
          backAction={() => router.back()}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* DATE SELECTOR ROW */}
          <SectionHeader title="Workout Date" />
          <View style={styles.dateSelectorRow}>
            <TouchableOpacity
              style={[
                styles.dateChip,
                {
                  backgroundColor: selectedDate === todayStr ? colors.accentLight : colors.cardMuted,
                  borderColor: selectedDate === todayStr ? colors.accent : (isDark ? colors.border : colors.borderSubtle),
                },
              ]}
              onPress={() => setSelectedDate(todayStr)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="today-outline"
                size={14}
                color={selectedDate === todayStr ? (isDark ? colors.accentDark : colors.accent) : colors.textSecondary}
              />
              <Text
                style={[
                  typography.captionBold,
                  {
                    color: selectedDate === todayStr ? (isDark ? colors.accentDark : colors.accent) : colors.textSecondary,
                    marginLeft: 5,
                  },
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dateChip,
                {
                  backgroundColor: selectedDate === yesterdayStr ? colors.accentLight : colors.cardMuted,
                  borderColor: selectedDate === yesterdayStr ? colors.accent : (isDark ? colors.border : colors.borderSubtle),
                },
              ]}
              onPress={() => setSelectedDate(yesterdayStr)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={selectedDate === yesterdayStr ? (isDark ? colors.accentDark : colors.accent) : colors.textSecondary}
              />
              <Text
                style={[
                  typography.captionBold,
                  {
                    color: selectedDate === yesterdayStr ? (isDark ? colors.accentDark : colors.accent) : colors.textSecondary,
                    marginLeft: 5,
                  },
                ]}
              >
                Yesterday
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dateChip,
                {
                  backgroundColor:
                    selectedDate !== todayStr && selectedDate !== yesterdayStr
                      ? colors.accentLight
                      : colors.cardMuted,
                  borderColor:
                    selectedDate !== todayStr && selectedDate !== yesterdayStr
                      ? colors.accent
                      : (isDark ? colors.border : colors.borderSubtle),
                },
              ]}
              onPress={() => setCalendarModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="calendar-outline"
                size={14}
                color={
                  selectedDate !== todayStr && selectedDate !== yesterdayStr
                    ? (isDark ? colors.accentDark : colors.accent)
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  typography.captionBold,
                  {
                    color:
                      selectedDate !== todayStr && selectedDate !== yesterdayStr
                        ? (isDark ? colors.accentDark : colors.accent)
                        : colors.textSecondary,
                    marginLeft: 5,
                  },
                ]}
                numberOfLines={1}
              >
                {selectedDate !== todayStr && selectedDate !== yesterdayStr
                  ? selectedDate
                  : 'Previous Date...'}
              </Text>
            </TouchableOpacity>
          </View>

          {existingWorkout && (
            <View style={[styles.existingBanner, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
              <Ionicons name="information-circle-outline" size={16} color={isDark ? colors.accentDark : colors.accent} />
              <Text style={[typography.caption, { color: isDark ? colors.accentDark : colors.accent, marginLeft: 6, flex: 1 }]}>
                Editing existing workout logged for {formatDisplayDate(selectedDate)}.
              </Text>
            </View>
          )}

          {/* MUSCLE GROUPS HEADER */}
          <View style={styles.subHeaderRow}>
            <Text style={[typography.subhead, { color: colors.textSecondary }]}>
              Targeted muscle groups:
            </Text>
            <TouchableOpacity onPress={handleSelectAllOrClear} activeOpacity={0.7}>
              <Text style={[typography.captionBold, { color: colors.accent }]}>
                {selectedMuscles.length === ALL_MUSCLE_GROUPS.length ? 'Clear All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>

          {validationError && (
            <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={[typography.caption, { color: colors.danger, marginLeft: 6 }]}>
                {validationError}
              </Text>
            </View>
          )}

          {/* Muscle Groups Selection Grid */}
          <View style={styles.musclesGrid}>
            {ALL_MUSCLE_GROUPS.map((muscle) => {
              const isSelected = selectedMuscles.includes(muscle);
              return (
                <View key={muscle} style={styles.chipWrapper}>
                  <MuscleGroupChip
                    muscleGroup={muscle}
                    selected={isSelected}
                    onToggle={handleToggleMuscle}
                  />
                </View>
              );
            })}
          </View>

          {/* Optional Notes (Safe from keyboard obstruction) */}
          <SectionHeader title="Workout Notes (Optional)" />
          <Card elevated style={styles.notesCard} padding="md">
            <TextInput
              placeholder="e.g. Felt strong on sets, high energy, increased bench press..."
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              style={[
                typography.body,
                styles.notesInput,
                { color: colors.text },
              ]}
            />
          </Card>

          {/* Private Prerequisite Indicator Badge */}
          {privateEnabled && (
            <View style={[styles.privateNoticeBadge, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
              <Ionicons name="lock-closed" size={15} color={colors.accent} />
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 8, flex: 1, lineHeight: 18 }]}>
                Confidential check-in with PIN authentication will open upon saving.
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <PrimaryButton
              title={existingWorkout ? 'Update Workout' : 'Save Workout'}
              onPress={handleSavePress}
              loading={isSaving}
              size="lg"
              icon={<Ionicons name="checkmark-sharp" size={20} color="#FFFFFF" />}
            />
            <SecondaryButton
              title="Cancel"
              onPress={() => router.back()}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* CALENDAR PICKER MODAL FOR PREVIOUS WORKOUTS */}
      <Modal
        visible={calendarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
          <View style={[styles.calendarModalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.calendarModalHeader}>
              <Text style={[typography.title2, { color: colors.text }]}>
                Select Workout Date
              </Text>
              <TouchableOpacity
                onPress={() => setCalendarModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: colors.cardMuted }]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Calendar
              workoutDates={workouts.map((w) => w.date)}
              selectedDate={selectedDate}
              onSelectDate={(d) => {
                if (d <= todayStr) {
                  setSelectedDate(d);
                  setCalendarModalVisible(false);
                }
              }}
              disableFutureDates={true}
            />

            <SecondaryButton
              title="Cancel"
              onPress={() => setCalendarModalVisible(false)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>

      {/* Private Check-in Interception Modal */}
      <PrivateCheckinModal
        visible={checkinModalVisible}
        targetDate={selectedDate}
        reason="workout_prerequisite"
        forcePinAuth={true}
        onSuccess={handlePrivateCheckinSuccess}
        onCancel={() => setCheckinModalVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 80,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  existingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  musclesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  chipWrapper: {
    width: '48%',
  },
  notesCard: {
    marginVertical: spacing.xs,
  },
  notesInput: {
    minHeight: 85,
    textAlignVertical: 'top',
  },
  privateNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  actionsContainer: {
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  calendarModalBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
