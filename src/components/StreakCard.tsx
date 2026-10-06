import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { Card } from './Card';
import { Workout } from '../types';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface StreakCardProps {
  workouts: Workout[];
  todayWorkout: Workout | null;
  restDaysPerWeek?: number;
  restDaysMode?: 'weekly' | 'monthly';
  restDaysValue?: number;
}

export const StreakCard: React.FC<StreakCardProps> = ({
  workouts,
  todayWorkout,
  restDaysPerWeek: propRestDays,
  restDaysMode: propRestDaysMode,
  restDaysValue: propRestDaysValue,
}) => {
  const { colors, isDark } = useTheme();
  const { profile } = useApp();

  const effectiveMode = propRestDaysMode ?? profile?.restDaysMode ?? 'weekly';
  const effectiveValue =
    propRestDaysValue ??
    profile?.restDaysValue ??
    (propRestDays ?? profile?.restDaysPerWeek ?? 1);

  const maxAllowedConsecutiveRest =
    effectiveMode === 'weekly'
      ? effectiveValue
      : Math.max(1, Math.min(effectiveValue, Math.ceil(effectiveValue / 4)));

  const [isExpanded, setIsExpanded] = useState(false);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const toggleExpand = () => {
    triggerHaptic();
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsExpanded((prev) => !prev);
  };

  // Helper to format Date to YYYY-MM-DD in local time
  const formatLocalIso = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Set of workout dates
  const workoutDatesSet = React.useMemo(() => {
    const set = new Set<string>();
    workouts.forEach((w) => set.add(w.date));
    return set;
  }, [workouts]);

  // Calculate current & best streak factoring in user-configured rest days
  // RULES:
  // 1. Only logged workout sessions increase the streak (+1).
  // 2. Rest days (Sunday by default) preserve the streak without increasing it.
  // 3. Logging a workout on a rest day DOES increase the streak.
  // 4. If user does not log a workout for more than their allowed rest days, streak resets to 0.
  const { currentStreak, bestStreak } = React.useMemo(() => {
    if (workoutDatesSet.size === 0) {
      return { currentStreak: 0, bestStreak: 0 };
    }

    const today = new Date();
    const todayStr = formatLocalIso(today);
    const workedOutToday = workoutDatesSet.has(todayStr);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let checkDate = new Date(today);
    let currentRun = 0;
    let consecutiveRest = 0;
    const rollingDays: boolean[] = [];

    // Determine start point for backward traversal
    if (workedOutToday) {
      checkDate = today;
      consecutiveRest = 0;
    } else {
      if (maxAllowedConsecutiveRest === 0) {
        // Strict mode (0 rest days): no workout today means streak is 0
        currentRun = 0;
      } else {
        checkDate = yesterday;
        consecutiveRest = 1; // Today is currently unlogged (1 rest/pending day)
      }
    }

    let hasWorkoutInRun = false;

    if (workedOutToday || (maxAllowedConsecutiveRest > 0)) {
      // Step backwards day by day
      while (true) {
        const dStr = formatLocalIso(checkDate);
        const isWorkout = workoutDatesSet.has(dStr);

        if (isWorkout) {
          // ONLY a logged workout session increases the streak!
          currentRun++;
          consecutiveRest = 0;
          rollingDays.push(true);
          hasWorkoutInRun = true;
        } else {
          if (maxAllowedConsecutiveRest === 0) break;
          consecutiveRest++;
          // Streak goes to 0 if they do not log workout for MORE than allowed rest days
          if (consecutiveRest > maxAllowedConsecutiveRest) break;

          // Check rolling window allowance (7 days for weekly, 30 days for monthly)
          const windowSize = effectiveMode === 'weekly' ? 7 : 30;
          const windowRests = rollingDays.slice(-(windowSize - 1)).filter((w) => !w).length + 1;
          if (windowRests > effectiveValue) break;

          // Note: Rest day preserves streak, does NOT increment currentRun!
          rollingDays.push(false);
        }

        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    const streak = hasWorkoutInRun ? currentRun : 0;

    // Calculate all-time best streak (only actual workouts counted, gaps <= allowedRest bridge)
    const sortedDates = Array.from(workoutDatesSet).sort();
    let maxStreak = streak;

    if (sortedDates.length > 0) {
      let run = 1;
      let prevD = new Date(sortedDates[0] + 'T00:00:00');

      for (let i = 1; i < sortedDates.length; i++) {
        const currD = new Date(sortedDates[i] + 'T00:00:00');
        const diffDays = Math.round((currD.getTime() - prevD.getTime()) / (1000 * 60 * 60 * 24));
        const restDaysInBetween = diffDays - 1;

        if (restDaysInBetween <= maxAllowedConsecutiveRest) {
          // Gap is within allowed rest days: streak continues, workout adds 1
          run += 1;
        } else {
          // Gap exceeded allowed rest days: resets to 1
          run = 1;
        }

        if (run > maxStreak) {
          maxStreak = run;
        }
        prevD = currD;
      }
    }

    return {
      currentStreak: streak,
      bestStreak: Math.max(maxStreak, streak),
    };
  }, [workoutDatesSet, effectiveMode, effectiveValue, maxAllowedConsecutiveRest]);

  // Calculate 7-day week view: Starts on Monday (0) -> ends on Sunday (6)
  const weekDays = React.useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + distanceToMonday);

    const days = [];
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = formatLocalIso(d);
      const isCompleted = workoutDatesSet.has(iso);
      const isToday = iso === formatLocalIso(now);
      const isFuture = d.getTime() > now.getTime() && !isToday;
      const isSunday = i === 6; // Sunday is the default rest day
      const isRestDay = !isCompleted && (isSunday || (effectiveValue > 0 && !isFuture && !isToday));

      days.push({
        label: dayNames[i],
        date: d.getDate(),
        isCompleted,
        isToday,
        isFuture,
        isRestDay,
        isSunday,
      });
    }

    return days;
  }, [workoutDatesSet, effectiveValue]);

  const hasTodayWorkout = !!todayWorkout;

  return (
    <Card style={styles.card}>
      <TouchableOpacity activeOpacity={0.7} onPress={toggleExpand} style={styles.touchArea}>
        <View style={styles.mainRow}>
          {/* Flame Badge with Prava subtle gradient */}
          {currentStreak > 0 ? (
            <LinearGradient
              colors={['#FF6A1F', '#7A1E2D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.flameCircle}
            >
              <Ionicons name="flame" size={24} color="#FFF7F2" />
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.flameCircle,
                {
                  backgroundColor: isDark ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9',
                  borderColor: 'transparent',
                },
              ]}
            >
              <Ionicons
                name="flame"
                size={24}
                color={colors.textTertiary}
              />
            </View>
          )}

          {/* Info Column */}
          <View style={styles.infoCol}>
            <View style={styles.titleLine}>
              <Text style={[typography.headline, { color: colors.text, fontWeight: '700' }]}>
                {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'} Streak
              </Text>
              {bestStreak > 0 && (
                <View style={[styles.bestPill, { backgroundColor: isDark ? colors.cardMuted : '#F8FAFC', borderColor: isDark ? colors.border : '#E2E8F0' }]}>
                  <Ionicons name="trophy" size={11} color="#F59E0B" />
                  <Text style={[typography.captionBold, { color: colors.textSecondary, marginLeft: 3, fontSize: 11 }]}>
                    Best: {bestStreak}d
                  </Text>
                </View>
              )}
            </View>

            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
              {hasTodayWorkout
                ? 'Great job! Today’s session logged.'
                : currentStreak > 0
                ? (effectiveMode === 'weekly'
                    ? (effectiveValue === 1
                        ? 'Streak active • Sunday is default rest day'
                        : `Streak active • ${effectiveValue} rest days/wk allowed`)
                    : `Streak active • ${effectiveValue} monthly rest days allowed`)
                : 'Start your winning streak today!'}
            </Text>
          </View>

          {/* Dropdown Toggle */}
          <View style={[styles.arrowButton, { backgroundColor: isDark ? colors.cardMuted : '#F8FAFC', borderColor: isDark ? colors.border : '#E2E8F0' }]}>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textSecondary}
            />
          </View>
        </View>

        {/* Collapsible 7-Day Tracker */}
        {isExpanded && (
          <View style={[styles.weekSection, { borderTopColor: isDark ? colors.border : '#F1F5F9' }]}>
            <View style={styles.weekGrid}>
              {weekDays.map((day, idx) => {
                let circleBg = isDark ? colors.cardMuted : '#F8FAFC';
                let circleBorder = isDark ? colors.border : '#E2E8F0';
                let textColor = colors.textTertiary;

                if (day.isCompleted) {
                  circleBg = isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5';
                  circleBorder = '#10B981';
                } else if (day.isToday) {
                  circleBg = colors.accentLight;
                  circleBorder = colors.accent;
                  textColor = colors.accent;
                } else if (day.isRestDay) {
                  circleBg = isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)';
                  circleBorder = isDark ? 'rgba(99, 102, 241, 0.4)' : '#818CF8';
                  textColor = isDark ? '#A5B4FC' : '#4F46E5';
                }

                return (
                  <View key={idx} style={styles.dayCol}>
                    <Text
                      style={[
                        typography.captionBold,
                        {
                          fontSize: 11,
                          color: day.isToday ? colors.accent : colors.textSecondary,
                          marginBottom: 6,
                        },
                      ]}
                    >
                      {day.label}
                    </Text>
                    <View
                      style={[
                        styles.dayBadge,
                        {
                          backgroundColor: circleBg,
                          borderColor: circleBorder,
                          borderWidth: day.isCompleted || day.isToday || day.isRestDay ? 1.5 : 1,
                        },
                      ]}
                    >
                      {day.isCompleted ? (
                        <Ionicons name="checkmark" size={13} color="#10B981" />
                      ) : day.isRestDay ? (
                        <Text
                          style={[
                            typography.captionBold,
                            {
                              fontSize: 10,
                              color: textColor,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          REST
                        </Text>
                      ) : (
                        <Text
                          style={[
                            typography.captionBold,
                            {
                              fontSize: 11,
                              color: textColor,
                            },
                          ]}
                        >
                          {day.date}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
    padding: 0,
    overflow: 'hidden',
  },
  touchArea: {
    padding: spacing.md,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flameCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  infoCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    marginLeft: spacing.xs + 2,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  weekSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
  },
  dayBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
