import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useApp } from '../../src/context/AppContext';
import { useTabNavigation, TAB_ROUTES } from '../../src/context/TabContext';
import {
  ScreenContainer,
  Header,
  SectionHeader,
  Card,
  PrimaryButton,
  SecondaryButton,
  WorkoutCard,
  WeightCard,
  ProgressPhotoStatusCard,
  QuickWeightModal,
  PhotoCaptureModal,
  AppLogo,
  StreakCard,
} from '../../src/components';
import { typography } from '../../src/theme/typography';
import { radius, spacing } from '../../src/theme/spacing';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { navigateToTab } = useTabNavigation();
  const {
    workouts,
    todayWorkout,
    currentWeight,
    weightDelta,
    previousWeightDate,
    lastPhotoDaysAgo,
    nextPhotoDueDays,
    profile,
  } = useApp();

  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  // Dynamic personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = profile.name ? profile.name.split(' ')[0] : 'there';
    if (hour < 12) return `Good morning, ${firstName}`;
    if (hour < 17) return `Good afternoon, ${firstName}`;
    return `Good evening, ${firstName}`;
  };

  // Formatted date (e.g., "Sunday, 4 October")
  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <ScreenContainer>
      {/* Header with App Logo */}
      <Header
        subtitle={getGreeting()}
        title={getFormattedDate()}
        rightElement={<AppLogo size="lg" />}
      />

      {/* STREAK FEATURE */}
      <SectionHeader title="Streak" />
      <StreakCard
        workouts={workouts}
        todayWorkout={todayWorkout}
      />

      {/* TODAY'S WORKOUT SECTION */}
      <SectionHeader
        title="Today's Workout"
        actionText="Log Past"
        onActionPress={() => router.push('/workout/new')}
      />

      {todayWorkout ? (
        <View style={styles.todayWorkoutContainer}>
          <Card glass style={styles.loggedWorkoutCard}>
            <View style={styles.loggedHeaderRow}>
              <View style={[styles.loggedBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)' }]}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={[typography.captionBold, { color: isDark ? '#34D399' : '#059669', marginLeft: 4 }]}>
                  Logged for Today
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/workout/new')}
                activeOpacity={0.7}
              >
                <Text style={[typography.subhead, { color: isDark ? colors.accentDark : colors.accent, fontWeight: '600' }]}>
                  Edit
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.muscleGroupsRow}>
              <Text style={[typography.title1, { color: colors.text, marginTop: spacing.xs }]}>
                {todayWorkout.muscleGroups.join(' · ')}
              </Text>
            </View>

            {todayWorkout.notes ? (
              <View style={[styles.notesBox, { backgroundColor: colors.cardMuted }]}>
                <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} style={{ marginTop: 2, marginRight: 6 }} />
                <Text style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}>
                  {todayWorkout.notes}
                </Text>
              </View>
            ) : null}
          </Card>
        </View>
      ) : (
        <Card glass style={styles.emptyWorkoutCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="barbell-outline" size={28} color={colors.accent} />
          </View>
          <Text style={[typography.headline, { color: colors.text, marginTop: spacing.sm }]}>
            No workout logged yet
          </Text>
          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary, marginTop: 2, textAlign: 'center', marginBottom: spacing.md },
            ]}
          >
            Record which muscle groups you trained today in just a few taps.
          </Text>
          <PrimaryButton
            title="Start Workout"
            onPress={() => router.push('/workout/new')}
            size="md"
            style={{ width: '100%' }}
            icon={<Ionicons name="add" size={20} color="#FFFFFF" />}
          />
        </Card>
      )}

      {/* BODY WEIGHT SECTION */}
      <SectionHeader title="Body Weight" />
      <WeightCard
        currentWeight={currentWeight}
        delta={weightDelta}
        previousDate={previousWeightDate}
        onUpdatePress={() => setWeightModalVisible(true)}
      />

      {/* PROGRESS PHOTO SECTION */}
      <SectionHeader title="Progress Photo" />
      <ProgressPhotoStatusCard
        lastPhotoDaysAgo={lastPhotoDaysAgo}
        nextPhotoDueDays={nextPhotoDueDays}
        onPress={() => navigateToTab(TAB_ROUTES.PROGRESS)}
        onAddPhotoPress={() => setPhotoModalVisible(true)}
      />

      {/* Modals */}
      <QuickWeightModal
        visible={weightModalVisible}
        onClose={() => setWeightModalVisible(false)}
      />

      <PhotoCaptureModal
        visible={photoModalVisible}
        onClose={() => setPhotoModalVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  todayWorkoutContainer: {
    marginVertical: spacing.xs,
  },
  loggedWorkoutCard: {
    padding: spacing.lg,
  },
  loggedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  loggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  muscleGroupsRow: {
    marginVertical: spacing.xs,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  emptyWorkoutCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginVertical: spacing.xs,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
});
