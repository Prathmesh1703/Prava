import {
  Workout,
  WeightEntry,
  ProgressPhoto,
  PrivateQuestion,
  UserProfile,
  NotificationSettings,
  AppSettings,
} from '../types';

export const initialWorkouts: Workout[] = [];

export const initialWeights: WeightEntry[] = [];

export const initialProfile: UserProfile = {
  name: 'User',
  email: '',
  gymName: '',
  workoutGoal: 'Hypertrophy',
  targetWeightKg: 75.0,
  memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  heightCm: 170,
  currentWeightKg: 0,
  photoFrequencyDays: 30,
  restDaysPerWeek: 1,
  avatarId: 'lifter',
};

export const initialPhotos: ProgressPhoto[] = [];

export const initialPrivateQuestions: PrivateQuestion[] = [];

export const initialNotifications: NotificationSettings = {
  workoutReminder: true,
  workoutReminderTime: '07:00 PM',
  weightReminder: false,
  weightReminderTime: '09:00 AM',
  progressPhotoReminder: true,
  progressPhotoTime: '08:00 AM',
};

export const initialSettings: AppSettings = {
  theme: 'system',
  privateCheckinsEnabled: true,
  pin: '1234',
};
