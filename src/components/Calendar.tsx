import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Card } from './Card';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { localDateString } from '../db/dateUtils';

interface CalendarProps {
  workoutDates: string[]; // YYYY-MM-DD list
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  disableFutureDates?: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({
  workoutDates,
  selectedDate,
  onSelectDate,
  disableFutureDates = false,
}) => {
  const { colors, isDark } = useTheme();

  // Selected view month & year
  const initialDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());

  // Week starts on Monday, Sunday is column index 6
  const daysOfWeek = [
    { label: 'M', isRestDay: false },
    { label: 'T', isRestDay: false },
    { label: 'W', isRestDay: false },
    { label: 'T', isRestDay: false },
    { label: 'F', isRestDay: false },
    { label: 'S', isRestDay: false },
    { label: 'S', isRestDay: true }, // Default Sunday rest day
  ];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
  });

  // Calculate calendar grid cells: Monday is index 0
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;

  const getFormattedDateString = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  const todayStr = localDateString();

  return (
    <Card elevated style={styles.container}>
      {/* Month Navigator */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[typography.title2, { color: colors.text }]}>
            {monthName} {currentYear}
          </Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <Ionicons name="barbell" size={13} color="#10B981" />
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                Workout
              </Text>
            </View>
            <View style={[styles.legendItem, { marginLeft: spacing.sm }]}>
              <View style={[styles.restDayDot, { backgroundColor: isDark ? '#A5B4FC' : '#6366F1' }]} />
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                Sunday Rest
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.cardMuted }]}
            onPress={prevMonth}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.cardMuted, marginLeft: spacing.xs }]}
            onPress={nextMonth}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Days of Week Header: Mon -> Sun */}
      <View style={styles.daysRow}>
        {daysOfWeek.map((dayItem, idx) => (
          <View key={idx} style={styles.dayHeaderCell}>
            <Text
              style={[
                typography.captionBold,
                {
                  color: dayItem.isRestDay
                    ? (isDark ? '#A5B4FC' : '#6366F1')
                    : colors.textTertiary,
                },
              ]}
            >
              {dayItem.label}
            </Text>
            {dayItem.isRestDay && (
              <View style={[styles.headerRestDot, { backgroundColor: isDark ? '#818CF8' : '#6366F1' }]} />
            )}
          </View>
        ))}
      </View>

      {/* Dates Grid */}
      <View style={styles.grid}>
        {Array.from({ length: totalCells }).map((_, idx) => {
          const dayNumber = idx - firstDayIndex + 1;
          const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;

          if (!isCurrentMonth) {
            return <View key={idx} style={styles.dayCell} />;
          }

          const dateStr = getFormattedDateString(dayNumber);
          const isSelected = selectedDate === dateStr;
          const isToday = todayStr === dateStr;
          const hasWorkout = workoutDates.includes(dateStr);
          const isFuture = dateStr > todayStr;
          const isDisabled = disableFutureDates && isFuture;

          return (
            <View key={idx} style={styles.dayCell}>
              {/*
                CRITICAL FIX: TouchableOpacity is strictly the circular element with
                borderRadius: 19 and overflow: 'hidden'. The outer dayCell is an unstyled
                layout View. This guarantees NO square ripple, NO square borders, and NO
                square background highlights appear on click or state change.
              */}
              <TouchableOpacity
                style={[
                  styles.dateCircle,
                  isSelected && {
                    backgroundColor: colors.accent,
                  },
                  !isSelected && isToday && {
                    backgroundColor: isDark ? 'rgba(244, 63, 94, 0.16)' : colors.accentLight,
                    borderWidth: 1.5,
                    borderColor: isDark ? '#F43F5E' : colors.accent,
                  },
                  !isSelected && !isToday && hasWorkout && {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.10)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.38)' : 'rgba(16, 185, 129, 0.25)',
                  },
                  isDisabled && {
                    opacity: 0.35,
                  },
                ]}
                onPress={() => {
                  if (!isDisabled) {
                    onSelectDate(dateStr);
                  }
                }}
                disabled={isDisabled}
                activeOpacity={0.7}
              >
                {/* Green dumbbell icon centered behind/over the date number for workouts */}
                {hasWorkout && (
                  <View style={styles.dumbbellWatermark} pointerEvents="none">
                    <Ionicons
                      name="barbell"
                      size={24}
                      color={isSelected ? 'rgba(255, 255, 255, 0.60)' : '#10B981'}
                      style={{ opacity: isSelected ? 0.6 : (isDark ? 0.75 : 0.55) }}
                    />
                  </View>
                )}

                <Text
                  style={[
                    typography.subhead,
                    styles.dateText,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : isToday
                        ? (isDark ? '#F43F5E' : colors.accent)
                        : hasWorkout
                        ? (isDark ? '#34D399' : '#059669')
                        : isDisabled
                        ? colors.textTertiary
                        : colors.text,
                      fontWeight: isSelected || isToday || hasWorkout ? '700' : '500',
                    },
                  ]}
                >
                  {dayNumber}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restDayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerRestDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  navButtons: {
    flexDirection: 'row',
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xxs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  dateCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dumbbellWatermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 19,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
  },
});
