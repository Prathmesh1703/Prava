import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useApp } from '../../src/context/AppContext';
import {
  ScreenContainer,
  Header,
  SectionHeader,
  SettingRow,
  ToggleRow,
  AnalogClockPicker,
} from '../../src/components';
import { typography } from '../../src/theme/typography';
import { radius, spacing } from '../../src/theme/spacing';

export default function NotificationSettingsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { notifications, updateNotifications } = useApp();

  const [activeTimeKey, setActiveTimeKey] = useState<
    'workout' | 'weight' | 'photo' | null
  >(null);

  const handleSaveClockTime = async (time: string) => {
    if (activeTimeKey === 'workout') {
      await updateNotifications({ workoutReminderTime: time });
    } else if (activeTimeKey === 'weight') {
      await updateNotifications({ weightReminderTime: time });
    } else if (activeTimeKey === 'photo') {
      await updateNotifications({ progressPhotoTime: time });
    }
    setActiveTimeKey(null);
  };

  const getModalTitle = () => {
    if (activeTimeKey === 'workout') return 'Workout Reminder';
    if (activeTimeKey === 'weight') return 'Weight Reminder';
    if (activeTimeKey === 'photo') return 'Progress Photo Reminder';
    return 'Set Reminder Time';
  };

  const getCurrentTime = () => {
    if (activeTimeKey === 'workout') return notifications.workoutReminderTime;
    if (activeTimeKey === 'weight') return notifications.weightReminderTime;
    if (activeTimeKey === 'photo') return notifications.progressPhotoTime;
    return '07:00 PM';
  };

  return (
    <ScreenContainer withPillPadding={false}>
      <Header
        title="Notifications"
        subtitle="Local Reminders"
        backAction={() => router.back()}
      />

      <SectionHeader title="Workout Reminders" />
      <View style={[styles.groupedList, { borderColor: isDark ? colors.border : colors.borderSubtle }]}>
        <ToggleRow
          icon="barbell-outline"
          iconColor="#3B82F6"
          label="Workout Reminder"
          value={notifications.workoutReminder}
          onValueChange={(val) => updateNotifications({ workoutReminder: val })}
          isFirst
          isLast={!notifications.workoutReminder}
        />
        {notifications.workoutReminder && (
          <SettingRow
            icon="time-outline"
            label="Reminder Time"
            value={notifications.workoutReminderTime}
            onPress={() => setActiveTimeKey('workout')}
            isLast
          />
        )}
      </View>

      <SectionHeader title="Body Weight Reminders" />
      <View style={[styles.groupedList, { borderColor: isDark ? colors.border : colors.borderSubtle }]}>
        <ToggleRow
          icon="scale-outline"
          iconColor="#10B981"
          label="Weight Reminder"
          value={notifications.weightReminder}
          onValueChange={(val) => updateNotifications({ weightReminder: val })}
          isFirst
          isLast={!notifications.weightReminder}
        />
        {notifications.weightReminder && (
          <SettingRow
            icon="time-outline"
            label="Reminder Time"
            value={notifications.weightReminderTime}
            onPress={() => setActiveTimeKey('weight')}
            isLast
          />
        )}
      </View>

      <SectionHeader title="Progress Photo Reminders" />
      <View style={[styles.groupedList, { borderColor: isDark ? colors.border : colors.borderSubtle }]}>
        <ToggleRow
          icon="camera-outline"
          iconColor="#EC4899"
          label="Progress Photo Reminder"
          value={notifications.progressPhotoReminder}
          onValueChange={(val) => updateNotifications({ progressPhotoReminder: val })}
          isFirst
          isLast={!notifications.progressPhotoReminder}
        />
        {notifications.progressPhotoReminder && (
          <SettingRow
            icon="time-outline"
            label="Reminder Time"
            value={notifications.progressPhotoTime}
            onPress={() => setActiveTimeKey('photo')}
            isLast
          />
        )}
      </View>

      {/* Interactive Circular Analog Clock Picker Modal */}
      <Modal
        visible={activeTimeKey !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveTimeKey(null)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AnalogClockPicker
              title={getModalTitle()}
              initialTime={getCurrentTime()}
              onSave={handleSaveClockTime}
              onCancel={() => setActiveTimeKey(null)}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  groupedList: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: spacing.xxs,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
  },
});
