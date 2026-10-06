import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import {
  Workout,
  MuscleGroup,
  WeightEntry,
  ProgressPhoto,
  PrivateQuestion,
  PrivateCheckinEntry,
  UserProfile,
  NotificationSettings,
} from '../types';
import { workoutService } from '../services/workoutService';
import { weightService } from '../services/weightService';
import { photoService } from '../services/photoService';
import { privateService } from '../services/privateService';
import { settingsService } from '../services/settingsService';
import { backupService } from '../services/backupService';
import { pinStore } from '../crypto/pinStore';
import { syncScheduledNotifications } from '../services/notificationService';
import { syncPending as syncFeedbackPending } from '../services/feedbackSyncService';

interface AppContextType {
  // Loading
  isLoading: boolean;

  // Workouts
  workouts: Workout[];
  todayWorkout: Workout | null;
  saveWorkout: (data: { date: string; muscleGroups: MuscleGroup[]; notes?: string }) => Promise<Workout>;
  deleteWorkout: (id: string) => Promise<void>;
  refreshWorkouts: () => Promise<void>;

  // Weight
  weights: WeightEntry[];
  currentWeight: number;
  weightDelta: number;
  previousWeightDate?: string;
  addWeight: (weightKg: number, date?: string) => Promise<WeightEntry>;
  refreshWeights: () => Promise<void>;

  // Photos
  photos: ProgressPhoto[];
  lastPhotoDaysAgo: number | null;
  nextPhotoDueDays: number;
  addPhoto: (data: { uri: string; date?: string; notes?: string }) => Promise<ProgressPhoto>;
  deletePhoto: (id: string) => Promise<void>;
  refreshPhotos: () => Promise<void>;

  // Private
  privateEnabled: boolean;
  setPrivateEnabled: (enabled: boolean) => Promise<void>;
  privatePhotosEnabled: boolean;
  setPrivatePhotosEnabled: (enabled: boolean) => Promise<void>;
  isPrivateUnlocked: boolean;
  isPinSetup: boolean;
  setupPin: (pin: string) => Promise<boolean>;
  changePin: (currentPin: string, newPin: string) => Promise<{ success: boolean; reason?: string }>;
  unlockPrivate: (pin: string) => Promise<boolean>;
  lockPrivate: () => void;
  privateQuestions: PrivateQuestion[];
  activePrivateQuestions: PrivateQuestion[];
  addPrivateQuestion: (text: string) => Promise<PrivateQuestion>;
  updatePrivateQuestion: (id: string, text: string) => Promise<void>;
  togglePrivateQuestion: (id: string, enabled: boolean) => Promise<void>;
  deletePrivateQuestion: (id: string) => Promise<void>;
  isTodayCheckinCompleted: boolean;
  todayCheckin: PrivateCheckinEntry | null;
  savePrivateCheckin: (answers: Record<string, boolean>, date?: string) => Promise<PrivateCheckinEntry>;
  updatePin: (newPin: string) => Promise<boolean>;

  // Profile & Settings
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  notifications: NotificationSettings;
  updateNotifications: (updates: Partial<NotificationSettings>) => Promise<void>;
  hasOnboarded: boolean;
  completeOnboarding: (data: {
    name: string;
    gymName?: string;
    workoutGoal?: string;
    heightCm?: number;
    targetWeightKg?: number;
    currentWeightKg?: number;
    avatarId?: string;
  }) => Promise<void>;
  resetAllData: () => Promise<void>;
  exportBackup: () => Promise<{ filename: string; sizeKb: number }>;
  importBackup: () => Promise<string>;
  exportCsv: () => Promise<string>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Workouts
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);

  // Weight
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [weightDelta, setWeightDelta] = useState<number>(0);
  const [previousWeightDate, setPreviousWeightDate] = useState<string | undefined>(undefined);

  // Photos
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [lastPhotoDaysAgo, setLastPhotoDaysAgo] = useState<number | null>(null);
  const [nextPhotoDueDays, setNextPhotoDueDays] = useState<number>(30);

  // Private
  const [privateEnabled, setPrivateEnabledState] = useState<boolean>(true);
  const [privatePhotosEnabled, setPrivatePhotosEnabledState] = useState<boolean>(false);
  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState<boolean>(false);
  const [isPinSetup, setIsPinSetup] = useState<boolean>(false);
  const [privateQuestions, setPrivateQuestions] = useState<PrivateQuestion[]>([]);
  const [isTodayCheckinCompleted, setIsTodayCheckinCompleted] = useState<boolean>(false);
  const [todayCheckin, setTodayCheckin] = useState<PrivateCheckinEntry | null>(null);

  // Profile & Settings
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfile>({
    name: '', email: '', gymName: '', workoutGoal: '',
    heightCm: 0, currentWeightKg: 0, photoFrequencyDays: 30,
    restDaysPerWeek: 1,
    restDaysMode: 'weekly',
    restDaysValue: 1,
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    workoutReminder: false, workoutReminderTime: '19:00',
    weightReminder: false,  weightReminderTime: '21:00',
    progressPhotoReminder: false, progressPhotoTime: '08:00',
  });

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Workouts
      const wList = await workoutService.getWorkouts();
      const todayW = await workoutService.getTodayWorkout();
      setWorkouts(wList);
      setTodayWorkout(todayW);

      // Weight
      const wtList   = await weightService.getWeights();
      const wtStatus = await weightService.getCurrentWeight();
      setWeights(wtList);
      setCurrentWeight(wtStatus.current);
      setWeightDelta(wtStatus.delta);
      setPreviousWeightDate(wtStatus.previousDate);

      // Profile & Settings
      const userProfile = await settingsService.getProfile();
      // Inject derived current weight from weight_entries (not stored in profile)
      setProfile({ ...userProfile, currentWeightKg: wtStatus.current });
      const notifs = await settingsService.getNotifications();
      setNotifications(notifs);
      syncScheduledNotifications(notifs).catch(() => {});
      const onboarded = await settingsService.hasOnboarded();
      setHasOnboarded(onboarded);

      // Photos
      const pList = await photoService.getPhotos();
      const pStatus = await photoService.getPhotoStatus(userProfile.photoFrequencyDays);
      setPhotos(pList);
      setLastPhotoDaysAgo(pStatus.lastPhotoDaysAgo);
      setNextPhotoDueDays(pStatus.nextPhotoDueDays);

      // Private
      const privEnabled = await privateService.isPrivateEnabled();
      setPrivateEnabledState(privEnabled);
      const privPhotos = await settingsService.isPrivatePhotosEnabled();
      setPrivatePhotosEnabledState(privPhotos);
      const pinConfigured = await privateService.isPinSetup();
      setIsPinSetup(pinConfigured);
      const qList = await privateService.getQuestions();
      setPrivateQuestions(qList);
      const todayDone = await privateService.isTodayCompleted();
      setIsTodayCheckinCompleted(todayDone);
      const todayChk = await privateService.getTodayCheckin();
      setTodayCheckin(todayChk);
    } catch (e) {
      console.error('AppContext loadAllData error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ── Feedback offline sync — drain queue on mount and each app foreground ──
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    // Initial sync attempt when the context first mounts
    syncFeedbackPending().catch(() => {});

    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current !== 'active' && nextState === 'active') {
        // App came back to foreground — attempt to drain pending queue
        syncFeedbackPending().catch(() => {});
      }
      appStateRef.current = nextState;
    });

    return () => sub.remove();
  }, []);

  // Workout Actions
  const refreshWorkouts = async () => {
    const list = await workoutService.getWorkouts();
    const today = await workoutService.getTodayWorkout();
    setWorkouts(list);
    setTodayWorkout(today);
  };

  const saveWorkout = async (data: {
    date: string;
    muscleGroups: MuscleGroup[];
    notes?: string;
  }): Promise<Workout> => {
    const result = await workoutService.saveWorkout(data);
    if (!result.success) {
      // Throw with the service-layer reason so screens can display it
      throw new Error(result.reason);
    }
    await refreshWorkouts();
    return result.workout;
  };

  const deleteWorkout = async (id: string) => {
    await workoutService.deleteWorkout(id);
    await refreshWorkouts();
  };

  // Weight Actions
  const refreshWeights = async () => {
    const list   = await weightService.getWeights();
    const status = await weightService.getCurrentWeight();
    setWeights(list);
    setCurrentWeight(status.current);
    setWeightDelta(status.delta);
    setPreviousWeightDate(status.previousDate);
    // Reflect derived current weight in profile state (not written to DB)
    setProfile(prev => ({ ...prev, currentWeightKg: status.current }));
  };

  const addWeight = async (weightKg: number, date?: string) => {
    const entry = await weightService.addWeightEntry(weightKg, date);
    await refreshWeights();
    return entry;
  };

  // Photo Actions
  const refreshPhotos = async () => {
    const list = await photoService.getPhotos();
    const status = await photoService.getPhotoStatus(profile.photoFrequencyDays);
    setPhotos(list);
    setLastPhotoDaysAgo(status.lastPhotoDaysAgo);
    setNextPhotoDueDays(status.nextPhotoDueDays);
  };

  const addPhoto = async (data: { uri: string; date?: string; notes?: string }) => {
    const entry = await photoService.addPhoto(data);
    await refreshPhotos();
    return entry;
  };

  const deletePhoto = async (id: string) => {
    await photoService.deletePhoto(id);
    await refreshPhotos();
  };

  // Private Actions
  const setPrivateEnabled = async (enabled: boolean) => {
    setPrivateEnabledState(enabled);
    await privateService.setPrivateEnabled(enabled);
  };

  const setPrivatePhotosEnabled = async (enabled: boolean) => {
    setPrivatePhotosEnabledState(enabled);
    await settingsService.setPrivatePhotosEnabled(enabled);
  };

  const setupPin = async (newPin: string): Promise<boolean> => {
    const success = await privateService.updatePin(newPin);
    if (success) {
      setIsPinSetup(true);
      setIsPrivateUnlocked(true);
      pinStore.refreshSession();
    }
    return success;
  };

  const changePin = async (currentPin: string, newPin: string): Promise<{ success: boolean; reason?: string }> => {
    const result = await privateService.changePin(currentPin, newPin);
    if (result.success) {
      setIsPinSetup(true);
      setIsPrivateUnlocked(true);
      pinStore.refreshSession();
    }
    return result;
  };

  const unlockPrivate = async (pin: string): Promise<boolean> => {
    const valid = await privateService.verifyPin(pin);
    if (valid) {
      setIsPrivateUnlocked(true);
      pinStore.refreshSession();
      return true;
    }
    return false;
  };

  const lockPrivate = () => {
    setIsPrivateUnlocked(false);
    pinStore.lockSession();
  };

  const refreshPrivate = async () => {
    const qList = await privateService.getQuestions();
    setPrivateQuestions(qList);
    const todayDone = await privateService.isTodayCompleted();
    setIsTodayCheckinCompleted(todayDone);
    const todayChk = await privateService.getTodayCheckin();
    setTodayCheckin(todayChk);
  };

  const addPrivateQuestion = async (text: string) => {
    const newQ = await privateService.addQuestion(text);
    await refreshPrivate();
    return newQ;
  };

  const updatePrivateQuestion = async (id: string, text: string) => {
    await privateService.updateQuestion(id, text);
    await refreshPrivate();
  };

  const togglePrivateQuestion = async (id: string, enabled: boolean) => {
    setPrivateQuestions(prev => prev.map(q => q.id === id ? { ...q, enabled } : q));
    await privateService.toggleQuestion(id, enabled);
    await refreshPrivate();
  };

  const deletePrivateQuestion = async (id: string) => {
    await privateService.deleteQuestion(id);
    await refreshPrivate();
  };

  const savePrivateCheckin = async (answers: Record<string, boolean>, date?: string) => {
    const entry = await privateService.saveCheckin(answers, date);
    await refreshPrivate();
    return entry;
  };

  const updatePin = async (newPin: string) => {
    const ok = await privateService.updatePin(newPin);
    if (ok) {
      setIsPinSetup(true);
      setIsPrivateUnlocked(true);
    }
    return ok;
  };

  // Profile & Settings Actions
  const updateProfile = async (updates: Partial<UserProfile>) => {
    const updated = await settingsService.updateProfile(updates);
    setProfile(updated);
    if (updates.photoFrequencyDays !== undefined) {
      const status = await photoService.getPhotoStatus(updates.photoFrequencyDays);
      setLastPhotoDaysAgo(status.lastPhotoDaysAgo);
      setNextPhotoDueDays(status.nextPhotoDueDays);
    }
  };

  const updateNotifications = async (updates: Partial<NotificationSettings>) => {
    setNotifications(prev => ({ ...prev, ...updates }));
    const updated = await settingsService.updateNotifications(updates);
    setNotifications(updated);
    await syncScheduledNotifications(updated);
  };

  const completeOnboarding = async (data: {
    name: string;
    gymName?: string;
    workoutGoal?: string;
    heightCm?: number;
    targetWeightKg?: number;
    currentWeightKg?: number;
    avatarId?: string;
  }) => {
    await settingsService.updateProfile({
      name: data.name.trim(),
      gymName: data.gymName?.trim() || '',
      workoutGoal: data.workoutGoal?.trim() || 'General Fitness',
      heightCm: data.heightCm || 170,
      targetWeightKg: data.targetWeightKg,
      avatarId: data.avatarId || 'lifter',
      memberSince: new Date().toISOString(),
    });

    if (data.currentWeightKg && data.currentWeightKg > 0) {
      await weightService.addWeightEntry(data.currentWeightKg);
    }

    await settingsService.setOnboarded(true);
    setHasOnboarded(true);
    await loadAllData();
  };

  const resetAllData = async () => {
    await backupService.deleteAllData();
    await loadAllData();
  };

  const exportBackup = async () => {
    return backupService.exportBackup();
  };

  const importBackup = async () => {
    const res = await backupService.importBackup();
    await loadAllData();
    return res.message;
  };

  const exportCsv = async () => {
    const res = await backupService.exportCsv();
    return res.filename;
  };

  const activePrivateQuestions = privateQuestions.filter((q) => q.enabled);

  return (
    <AppContext.Provider
      value={{
        isLoading,
        workouts,
        todayWorkout,
        saveWorkout,
        deleteWorkout,
        refreshWorkouts,
        weights,
        currentWeight,
        weightDelta,
        previousWeightDate,
        addWeight,
        refreshWeights,
        photos,
        lastPhotoDaysAgo,
        nextPhotoDueDays,
        addPhoto,
        deletePhoto,
        refreshPhotos,
        privateEnabled,
        setPrivateEnabled,
        privatePhotosEnabled,
        setPrivatePhotosEnabled,
        isPrivateUnlocked,
        isPinSetup,
        setupPin,
        changePin,
        unlockPrivate,
        lockPrivate,
        privateQuestions,
        activePrivateQuestions,
        addPrivateQuestion,
        updatePrivateQuestion,
        togglePrivateQuestion,
        deletePrivateQuestion,
        isTodayCheckinCompleted,
        todayCheckin,
        savePrivateCheckin,
        updatePin,
        profile,
        updateProfile,
        notifications,
        updateNotifications,
        hasOnboarded,
        completeOnboarding,
        resetAllData,
        exportBackup,
        importBackup,
        exportCsv,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
