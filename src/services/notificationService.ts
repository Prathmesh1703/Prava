import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { NotificationSettings } from '../types';

// In Expo Go on Android (SDK 53+), expo-notifications throws an uncaught error on module load.
// We safely require it only in standalone/development builds or on iOS/Web where supported.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: any = null;
if (!isExpoGo || Platform.OS !== 'android') {
  try {
    Notifications = require('expo-notifications');
  } catch (err) {
    console.warn('[Prava Notifications] expo-notifications unavailable in current runtime:', err);
  }
}

// Configure how notifications are handled when the app is in the foreground
if (Notifications?.setNotificationHandler) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.warn('[Prava Notifications] Could not set notification handler:', err);
  }
}

export function parseTimeString(timeStr: string): { hour: number; minute: number } {
  try {
    const clean = timeStr.trim();
    const match = clean.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return { hour: 19, minute: 0 };
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return { hour, minute };
  } catch {
    return { hour: 19, minute: 0 };
  }
}

export async function initNotifications(): Promise<boolean> {
  if (!Notifications) {
    return false;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('prava-reminders', {
        name: 'Prava Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6A1F',
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('[Prava Notifications] Failed to init notifications:', err);
    return false;
  }
}

export async function syncScheduledNotifications(settings: NotificationSettings): Promise<void> {
  if (!Notifications) {
    return;
  }

  try {
    const hasPermission = await initNotifications();
    if (!hasPermission) {
      console.log('[Prava Notifications] Permission not granted, skipping schedule.');
      return;
    }

    // Cancel all previously scheduled notifications to re-align
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 1. Workout Reminder
    if (settings.workoutReminder && settings.workoutReminderTime) {
      const { hour, minute } = parseTimeString(settings.workoutReminderTime);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to Train! 🏋️',
          body: 'Discipline builds freedom. Stay consistent with your Prava routine and log today!',
          sound: 'default',
          color: '#FF6A1F',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'prava-reminders',
        },
      });
    }

    // 2. Weight Reminder
    if (settings.weightReminder && settings.weightReminderTime) {
      const { hour, minute } = parseTimeString(settings.weightReminderTime);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Morning Weigh-in ⚖️',
          body: 'Step on the scale and track your progress in Prava.',
          sound: 'default',
          color: '#FFA647',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'prava-reminders',
        },
      });
    }

    // 3. Progress Photo Reminder
    if (settings.progressPhotoReminder && settings.progressPhotoTime) {
      const { hour, minute } = parseTimeString(settings.progressPhotoTime);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Progress Photo Check-in 📸',
          body: 'Time for your physique check-in! Snap your photo and update your timeline.',
          sound: 'default',
          color: '#7A1E2D',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'prava-reminders',
        },
      });
    }
  } catch (err) {
    console.warn('[Prava Notifications] Error syncing scheduled notifications:', err);
  }
}
