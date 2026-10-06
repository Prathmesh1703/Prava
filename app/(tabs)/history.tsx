import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useApp } from '../../src/context/AppContext';
import {
  ScreenContainer,
  Header,
  SectionHeader,
  Calendar,
  WorkoutCard,
  Card,
  EmptyState,
  ConfirmationModal,
  PrimaryButton,
} from '../../src/components';
import { Workout } from '../../src/types';
import { typography } from '../../src/theme/typography';
import { radius, spacing } from '../../src/theme/spacing';
import { localDateString } from '../../src/db/dateUtils';

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { workouts, deleteWorkout } = useApp();

  const todayStr = localDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Multi-selection state
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<string[]>([]);
  const [batchDeleteModalVisible, setBatchDeleteModalVisible] = useState<boolean>(false);

  // Extract all workout dates for calendar dots
  const workoutDates = workouts.map((w) => w.date);

  // Find workout for currently selected date
  const selectedWorkout = workouts.find((w) => w.date === selectedDate);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const formatSelectedDateTitle = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleToggleSelectWorkout = (workoutId: string) => {
    triggerHaptic();
    setSelectedWorkoutIds((prev) =>
      prev.includes(workoutId)
        ? prev.filter((id) => id !== workoutId)
        : [...prev, workoutId]
    );
  };

  const handleLongPressWorkout = (workoutId: string) => {
    if (!isSelectMode) {
      setIsSelectMode(true);
      setSelectedWorkoutIds([workoutId]);
    }
  };

  const handleSelectAll = () => {
    triggerHaptic();
    if (selectedWorkoutIds.length === workouts.length) {
      setSelectedWorkoutIds([]);
    } else {
      setSelectedWorkoutIds(workouts.map((w) => w.id));
    }
  };

  const handleCancelSelection = () => {
    triggerHaptic();
    setIsSelectMode(false);
    setSelectedWorkoutIds([]);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetId) {
      await deleteWorkout(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const handleBatchDeleteConfirm = async () => {
    for (const id of selectedWorkoutIds) {
      await deleteWorkout(id);
    }
    setSelectedWorkoutIds([]);
    setIsSelectMode(false);
    setBatchDeleteModalVisible(false);
  };

  return (
    <ScreenContainer>
      <Header
        title="History"
        subtitle="Workout Journal"
      />

      {/* Monthly Calendar View */}
      <Calendar
        workoutDates={workoutDates}
        selectedDate={selectedDate}
        onSelectDate={(d) => {
          if (d <= todayStr) {
            setSelectedDate(d);
          }
        }}
        disableFutureDates={true}
      />

      {/* Selected Date Detail Section */}
      <SectionHeader title={`Log for ${formatSelectedDateTitle(selectedDate)}`} />

      {selectedWorkout ? (
        <Card elevated style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={[styles.trainedBadge, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="barbell" size={14} color={isDark ? colors.accentDark : colors.accent} />
              <Text style={[typography.captionBold, { color: isDark ? colors.accentDark : colors.accent, marginLeft: 4 }]}>
                Workout Completed
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={[styles.trashBtn, { backgroundColor: colors.cardMuted }]}
                onPress={() => router.push({ pathname: '/workout/new', params: { date: selectedDate } })}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil" size={15} color={isDark ? colors.accentDark : colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.trashBtn, { backgroundColor: colors.cardMuted }]}
                onPress={() => setDeleteTargetId(selectedWorkout.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[typography.title1, { color: colors.text, marginTop: spacing.sm }]}>
            {selectedWorkout.muscleGroups.join(' · ')}
          </Text>

          {selectedWorkout.notes ? (
            <View style={[styles.notesContainer, { backgroundColor: colors.cardMuted }]}>
              <Text style={[typography.captionBold, { color: colors.textSecondary, marginBottom: 2 }]}>
                Notes:
              </Text>
              <Text style={[typography.body, { color: colors.text }]}>
                {selectedWorkout.notes}
              </Text>
            </View>
          ) : null}
        </Card>
      ) : selectedDate > todayStr ? (
        <Card elevated style={styles.restDayCard}>
          <View style={styles.restIconCircle}>
            <Ionicons name="calendar-outline" size={24} color={colors.textSecondary} />
          </View>
          <Text style={[typography.headline, { color: colors.text, marginTop: spacing.xs }]}>
            Future Date
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2, textAlign: 'center' }]}>
            Workouts cannot be logged for future dates.
          </Text>
        </Card>
      ) : (
        <Card elevated style={styles.restDayCard}>
          <View style={styles.restIconCircle}>
            <Ionicons name="moon-outline" size={24} color={colors.textSecondary} />
          </View>
          <Text style={[typography.headline, { color: colors.text, marginTop: spacing.xs }]}>
            No workout recorded
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2, textAlign: 'center' }]}>
            Rest day or unlogged session for this date.
          </Text>
          <PrimaryButton
            title={selectedDate === todayStr ? "Log Today's Workout" : `Log Workout for ${formatSelectedDateTitle(selectedDate)}`}
            size="sm"
            onPress={() => router.push({ pathname: '/workout/new', params: { date: selectedDate } })}
            style={{ marginTop: spacing.md }}
            icon={<Ionicons name="add" size={16} color="#FFFFFF" />}
          />
        </Card>
      )}

      {/* Recent Workouts List Section Header */}
      <View style={styles.sectionTitleRow}>
        <Text style={[typography.title2, { color: colors.text }]}>
          Recent Workouts
        </Text>

        {workouts.length > 0 && (
          <TouchableOpacity
            style={[styles.modeToggleBtn, { backgroundColor: colors.cardMuted }]}
            onPress={() => {
              if (isSelectMode) {
                handleCancelSelection();
              } else {
                setIsSelectMode(true);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[typography.captionBold, { color: isSelectMode ? colors.accent : colors.textSecondary }]}>
              {isSelectMode ? 'Done' : 'Select'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Multi-selection Action Bar */}
      {isSelectMode && (
        <View style={[styles.selectionBar, { backgroundColor: colors.cardMuted, borderColor: colors.border }]}>
          <TouchableOpacity onPress={handleSelectAll} activeOpacity={0.7}>
            <Text style={[typography.captionBold, { color: colors.accent }]}>
              {selectedWorkoutIds.length === workouts.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>

          <Text style={[typography.captionBold, { color: colors.text }]}>
            {selectedWorkoutIds.length} Selected
          </Text>

          {selectedWorkoutIds.length > 0 ? (
            <TouchableOpacity
              style={[styles.deleteSelectedBtn, { backgroundColor: colors.danger }]}
              onPress={() => setBatchDeleteModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={13} color="#FFFFFF" />
              <Text style={[typography.captionBold, { color: '#FFFFFF', marginLeft: 4 }]}>
                Delete ({selectedWorkoutIds.length})
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleCancelSelection} activeOpacity={0.7}>
              <Text style={[typography.captionBold, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {workouts.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No workouts yet"
          description="Start logging your workouts to see your complete training history here."
          actionTitle="Start Workout"
          onAction={() => router.push('/workout/new')}
        />
      ) : (
        workouts.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            isSelectMode={isSelectMode}
            isSelected={selectedWorkoutIds.includes(w.id)}
            onLongPress={() => handleLongPressWorkout(w.id)}
            onToggleSelect={() => handleToggleSelectWorkout(w.id)}
            onPress={() => {
              if (isSelectMode) {
                handleToggleSelectWorkout(w.id);
              } else {
                setSelectedDate(w.date);
              }
            }}
            onDelete={() => setDeleteTargetId(w.id)}
          />
        ))
      )}

      {/* Single Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteTargetId !== null}
        title="Delete Workout"
        message="Are you sure you want to remove this workout entry from your history?"
        confirmTitle="Delete"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Batch Delete Confirmation Modal */}
      <ConfirmationModal
        visible={batchDeleteModalVisible}
        title={`Delete ${selectedWorkoutIds.length} Workouts`}
        message={`Are you sure you want to permanently delete these ${selectedWorkoutIds.length} workout logs? This action cannot be undone.`}
        confirmTitle={`Delete (${selectedWorkoutIds.length})`}
        isDestructive
        onConfirm={handleBatchDeleteConfirm}
        onCancel={() => setBatchDeleteModalVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  detailCard: {
    marginVertical: spacing.xs,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trainedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  trashBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesContainer: {
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  restDayCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
  },
  restIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  modeToggleBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  deleteSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
  },
});
