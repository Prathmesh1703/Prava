import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/context/ThemeContext';
import { useApp } from '../../src/context/AppContext';
import {
  ScreenContainer,
  Header,
  SectionHeader,
  PinInput,
  Card,
  SettingRow,
  ToggleRow,
  PrimaryButton,
  SecondaryButton,
  PrivateCheckinModal,
  ConfirmationModal,
} from '../../src/components';
import { PrivateQuestion } from '../../src/types';
import { typography } from '../../src/theme/typography';
import { radius, spacing } from '../../src/theme/spacing';

export default function PrivateIndexScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const {
    isPrivateUnlocked,
    unlockPrivate,
    lockPrivate,
    isPinSetup,
    setupPin,
    changePin,
    privateEnabled,
    setPrivateEnabled,
    privatePhotosEnabled,
    setPrivatePhotosEnabled,
    isTodayCheckinCompleted,
    privateQuestions,
    addPrivateQuestion,
    updatePrivateQuestion,
    togglePrivateQuestion,
    deletePrivateQuestion,
  } = useApp();

  const [pinError, setPinError] = useState<string | null>(null);

  // Initial PIN Setup states (when no PIN exists yet)
  const [setupPinVal, setSetupPinVal] = useState('');
  const [setupConfirmVal, setSetupConfirmVal] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Change PIN Modal states
  const [changePinModalVisible, setChangePinModalVisible] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState('');
  const [changePinError, setChangePinError] = useState<string | null>(null);
  const [pinSuccessMsg, setPinSuccessMsg] = useState<string | null>(null);

  // Questions management states
  const [addQuestionModalVisible, setAddQuestionModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<PrivateQuestion | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Check-in modal
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  // Unlock with PIN
  const handlePinComplete = async (pin: string) => {
    setPinError(null);
    const valid = await unlockPrivate(pin);
    if (!valid) {
      triggerHaptic();
      setPinError('Incorrect PIN. Please try again.');
    }
  };

  // Initial PIN Setup handler
  const handleCreatePin = async () => {
    setSetupError(null);
    if (setupPinVal.length !== 4) {
      setSetupError('PIN must be 4 digits.');
      return;
    }
    if (setupPinVal !== setupConfirmVal) {
      setSetupError('PINs do not match. Please re-enter.');
      return;
    }

    setIsSettingUp(true);
    triggerHaptic();
    const ok = await setupPin(setupPinVal);
    setIsSettingUp(false);

    if (ok) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
      }
      setPinSuccessMsg('4-digit PIN created successfully!');
      setTimeout(() => setPinSuccessMsg(null), 3000);
    } else {
      setSetupError('Failed to save PIN. Please try again.');
    }
  };

  // Change PIN handler
  const handleChangePinSave = async () => {
    setChangePinError(null);
    if (newPinInput.length !== 4) {
      setChangePinError('New PIN must be exactly 4 digits.');
      return;
    }
    if (newPinInput !== confirmNewPinInput) {
      setChangePinError('New PINs do not match.');
      return;
    }

    const res = await changePin(currentPinInput, newPinInput);
    if (res.success) {
      triggerHaptic();
      setPinSuccessMsg('PIN changed successfully.');
      setChangePinModalVisible(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmNewPinInput('');
      setTimeout(() => setPinSuccessMsg(null), 3000);
    } else {
      setChangePinError(res.reason || 'Incorrect current PIN.');
    }
  };

  // Add Question handler
  const handleSaveNewQuestion = async () => {
    if (questionText.trim()) {
      triggerHaptic();
      await addPrivateQuestion(questionText.trim());
      setAddQuestionModalVisible(false);
      setQuestionText('');
    }
  };

  // Edit Question handler
  const handleSaveEditQuestion = async () => {
    if (editingQuestion && questionText.trim()) {
      triggerHaptic();
      await updatePrivateQuestion(editingQuestion.id, questionText.trim());
      setEditingQuestion(null);
      setQuestionText('');
    }
  };

  // Delete Question handler
  const handleDeleteConfirm = async () => {
    if (deleteTargetId) {
      triggerHaptic();
      await deletePrivateQuestion(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <ScreenContainer withPillPadding={false}>
      <Header
        title="Private Check-ins"
        subtitle="Confidential"
        backAction={() => {
          lockPrivate();
          router.back();
        }}
        rightAction={
          isPrivateUnlocked
            ? {
                label: 'Lock',
                onPress: lockPrivate,
              }
            : undefined
        }
      />

      {!isPrivateUnlocked ? (
        /* LOCKED VIEW */
        !isPinSetup ? (
          /* STEP 1: SET PIN FLOW (for users who haven't set a PIN yet) */
          <ScrollView
            contentContainerStyle={styles.lockedContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.lockIconCircle, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="key" size={36} color={colors.accent} />
            </View>

            <Text style={[typography.title1, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]}>
              Set Up Your PIN
            </Text>

            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, maxWidth: 300, lineHeight: 20 },
              ]}
            >
              Create a confidential 4-digit PIN to secure your daily private journal, questions, and progress photos.
            </Text>

            <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
              <Text style={[typography.captionBold, styles.inputLabel, { color: colors.textSecondary }]}>
                Enter 4-Digit PIN
              </Text>
              <TextInput
                value={setupPinVal}
                onChangeText={(t) => setSetupPinVal(t.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="number-pad"
                secureTextEntry
                placeholder="••••"
                placeholderTextColor={colors.textTertiary}
                maxLength={4}
                style={[typography.title1, styles.pinBoxInput, { color: colors.text, borderColor: isDark ? colors.border : colors.borderSubtle, backgroundColor: colors.cardMuted }]}
              />

              <Text style={[typography.captionBold, styles.inputLabel, { color: colors.textSecondary, marginTop: spacing.md }]}>
                Confirm 4-Digit PIN
              </Text>
              <TextInput
                value={setupConfirmVal}
                onChangeText={(t) => setSetupConfirmVal(t.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="number-pad"
                secureTextEntry
                placeholder="••••"
                placeholderTextColor={colors.textTertiary}
                maxLength={4}
                style={[typography.title1, styles.pinBoxInput, { color: colors.text, borderColor: isDark ? colors.border : colors.borderSubtle, backgroundColor: colors.cardMuted }]}
              />

              {setupError && (
                <Text style={[typography.captionBold, { color: colors.danger, textAlign: 'center', marginTop: spacing.sm }]}>
                  {setupError}
                </Text>
              )}

              <PrimaryButton
                title="Save PIN & Unlock"
                onPress={handleCreatePin}
                disabled={setupPinVal.length !== 4 || setupConfirmVal.length !== 4}
                loading={isSettingUp}
                style={{ marginTop: spacing.lg }}
              />
            </View>
          </ScrollView>
        ) : (
          /* STEP 2: ENTER PIN TO UNLOCK (when PIN is configured) */
          <View style={styles.lockedContainer}>
            <View style={[styles.lockIconCircle, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="lock-closed" size={36} color={colors.accent} />
            </View>

            <Text style={[typography.title2, { color: colors.text, marginTop: spacing.lg, textAlign: 'center' }]}>
              Protected Section
            </Text>

            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, maxWidth: 280 },
              ]}
            >
              Enter your 4-digit PIN to access private journal questions and confidential check-ins.
            </Text>

            <PinInput onComplete={handlePinComplete} error={pinError} />
          </View>
        )
      ) : (
        /* UNLOCKED DASHBOARD */
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {pinSuccessMsg && (
            <View style={[styles.successBanner, { backgroundColor: colors.successLight }]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={[typography.captionBold, { color: colors.success, marginLeft: 6 }]}>
                {pinSuccessMsg}
              </Text>
            </View>
          )}

          {/* Today's Check-in Status Card */}
          <SectionHeader title="Today's Status" />
          <Card elevated style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusInfoCol}>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isTodayCheckinCompleted
                        ? colors.successLight
                        : colors.warningLight,
                    },
                  ]}
                >
                  <Ionicons
                    name={isTodayCheckinCompleted ? 'checkmark-circle' : 'time-outline'}
                    size={14}
                    color={isTodayCheckinCompleted ? colors.success : colors.warning}
                  />
                  <Text
                    style={[
                      typography.captionBold,
                      {
                        color: isTodayCheckinCompleted ? colors.success : colors.warning,
                        marginLeft: 4,
                      },
                    ]}
                  >
                    {isTodayCheckinCompleted ? 'Completed for Today' : 'Pending Check-in'}
                  </Text>
                </View>

                <Text style={[typography.title2, { color: colors.text, marginTop: spacing.sm }]}>
                  {isTodayCheckinCompleted
                    ? 'Private check-in logged'
                    : 'Check-in required'}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {isTodayCheckinCompleted
                    ? 'Your private answers have been recorded on-device for today.'
                    : 'Log your private questions before submitting workouts.'}
                </Text>
              </View>
            </View>

            <PrimaryButton
              title={isTodayCheckinCompleted ? 'Edit Answers' : 'Answer Today’s Check-in'}
              onPress={() => setCheckinModalVisible(true)}
              size="md"
              style={{ marginTop: spacing.md }}
              icon={<Ionicons name="checkbox-outline" size={18} color="#FFFFFF" />}
            />
          </Card>

          {/* PRIVATE QUESTIONS MANAGEMENT */}
          <SectionHeader
            title={`Private Questions (${privateQuestions.length})`}
            actionText="+ Add Question"
            onActionPress={() => {
              setQuestionText('');
              setAddQuestionModalVisible(true);
            }}
          />

          {privateQuestions.length === 0 ? (
            <Card elevated style={{ marginVertical: spacing.xs, alignItems: 'center', paddingVertical: spacing.xl }}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="help-circle-outline" size={32} color={colors.accent} />
              </View>
              <Text style={[typography.headline, { color: colors.text, marginTop: spacing.sm }]}>
                No Private Questions Yet
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 4, maxWidth: 260 }]}>
                Add confidential Yes/No habits or accountability questions to track every day.
              </Text>
              <PrimaryButton
                title="+ Add First Question"
                onPress={() => {
                  setQuestionText('');
                  setAddQuestionModalVisible(true);
                }}
                size="sm"
                style={{ marginTop: spacing.md }}
              />
            </Card>
          ) : (
            privateQuestions.map((q) => (
              <Card key={q.id} elevated style={styles.questionCard} padding="md">
                <TouchableOpacity
                  style={styles.cardTopRow}
                  activeOpacity={0.7}
                  onPress={() => togglePrivateQuestion(q.id, !q.enabled)}
                >
                  <View style={styles.textCol}>
                    <Text style={[typography.headline, { color: colors.text }]}>
                      {q.text}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.typeBadge, { backgroundColor: colors.cardMuted }]}>
                        <Text style={[typography.captionBold, { color: colors.textSecondary, fontSize: 11 }]}>
                          Yes / No
                        </Text>
                      </View>
                      <Text style={[typography.caption, { color: q.enabled ? colors.success : colors.textTertiary, marginLeft: 8 }]}>
                        {q.enabled ? 'Active daily' : 'Disabled'}
                      </Text>
                    </View>
                  </View>

                  <Switch
                    value={q.enabled}
                    onValueChange={(val) => togglePrivateQuestion(q.id, val)}
                    trackColor={{ false: colors.cardMuted, true: colors.accent }}
                    thumbColor="#FFFFFF"
                    pointerEvents="none"
                  />
                </TouchableOpacity>

                <View style={[styles.cardBottomRow, { borderTopColor: isDark ? colors.border : colors.borderSubtle }]}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      setEditingQuestion(q);
                      setQuestionText(q.text);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil-outline" size={15} color={colors.accent} />
                    <Text style={[typography.captionBold, { color: colors.accent, marginLeft: 4, fontSize: 12 }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setDeleteTargetId(q.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={15} color={colors.danger} />
                    <Text style={[typography.captionBold, { color: colors.danger, marginLeft: 4, fontSize: 12 }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}

          {/* Privacy Settings & Toggles */}
          <SectionHeader title="Privacy Options & Security" />
          <View style={[styles.groupedList, { borderColor: isDark ? colors.border : colors.borderSubtle }]}>
            <ToggleRow
              icon="shield-checkmark-outline"
              iconColor="#3B82F6"
              label="Require Check-in for Workouts"
              value={privateEnabled}
              onValueChange={setPrivateEnabled}
              isFirst
            />
            <ToggleRow
              icon="eye-off-outline"
              iconColor="#EC4899"
              label="Private Progress Photos"
              value={privatePhotosEnabled}
              onValueChange={setPrivatePhotosEnabled}
            />
            <SettingRow
              icon="key-outline"
              iconColor="#F59E0B"
              label="Change 4-digit PIN"
              onPress={() => {
                setChangePinError(null);
                setCurrentPinInput('');
                setNewPinInput('');
                setConfirmNewPinInput('');
                setChangePinModalVisible(true);
              }}
              isLast
            />
          </View>

          {/* Security Guarantee Note */}
          <View style={[styles.privacyNoticeBox, { backgroundColor: colors.cardMuted }]}>
            <Ionicons name="shield-checkmark" size={18} color={colors.accent} />
            <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: spacing.sm, flex: 1, lineHeight: 17 }]}>
              All private check-in records are AES-256 encrypted on-device. Your PIN is stored in device SecureStore and never in the database.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* ADD QUESTION MODAL */}
      <Modal
        visible={addQuestionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddQuestionModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.title2, { color: colors.text }]}>
              New Private Question
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md }]}>
              Enter a custom confidential Yes/No question for your daily check-in.
            </Text>

            <TextInput
              placeholder="e.g. Did I sleep at least 7.5 hours?"
              placeholderTextColor={colors.textTertiary}
              value={questionText}
              onChangeText={setQuestionText}
              multiline
              numberOfLines={3}
              style={[
                typography.body,
                styles.modalTextInput,
                {
                  backgroundColor: colors.cardMuted,
                  color: colors.text,
                  borderColor: isDark ? colors.border : colors.borderSubtle,
                },
              ]}
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setAddQuestionModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <PrimaryButton
                title="Add Question"
                onPress={handleSaveNewQuestion}
                disabled={questionText.trim().length === 0}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT QUESTION MODAL */}
      <Modal
        visible={editingQuestion !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingQuestion(null)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.title2, { color: colors.text }]}>
              Edit Question
            </Text>

            <TextInput
              value={questionText}
              onChangeText={setQuestionText}
              multiline
              numberOfLines={3}
              style={[
                typography.body,
                styles.modalTextInput,
                {
                  backgroundColor: colors.cardMuted,
                  color: colors.text,
                  borderColor: isDark ? colors.border : colors.borderSubtle,
                  marginTop: spacing.md,
                },
              ]}
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setEditingQuestion(null)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <PrimaryButton
                title="Save"
                onPress={handleSaveEditQuestion}
                disabled={questionText.trim().length === 0}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* CHANGE PIN MODAL */}
      <Modal
        visible={changePinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setChangePinModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[typography.title2, { color: colors.text }]}>Change PIN</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md }]}>
              Update your 4-digit security PIN
            </Text>

            <Text style={[typography.captionBold, styles.inputLabel, { color: colors.textSecondary }]}>
              Current PIN
            </Text>
            <TextInput
              value={currentPinInput}
              onChangeText={(t) => setCurrentPinInput(t.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              placeholder="••••"
              placeholderTextColor={colors.textTertiary}
              style={[typography.title1, styles.pinBoxInput, { color: colors.text, borderColor: isDark ? colors.border : colors.borderSubtle, backgroundColor: colors.cardMuted }]}
              maxLength={4}
              autoFocus
            />

            <Text style={[typography.captionBold, styles.inputLabel, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              New 4-Digit PIN
            </Text>
            <TextInput
              value={newPinInput}
              onChangeText={(t) => setNewPinInput(t.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              placeholder="••••"
              placeholderTextColor={colors.textTertiary}
              style={[typography.title1, styles.pinBoxInput, { color: colors.text, borderColor: isDark ? colors.border : colors.borderSubtle, backgroundColor: colors.cardMuted }]}
              maxLength={4}
            />

            <Text style={[typography.captionBold, styles.inputLabel, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              Confirm New PIN
            </Text>
            <TextInput
              value={confirmNewPinInput}
              onChangeText={(t) => setConfirmNewPinInput(t.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              placeholder="••••"
              placeholderTextColor={colors.textTertiary}
              style={[typography.title1, styles.pinBoxInput, { color: colors.text, borderColor: isDark ? colors.border : colors.borderSubtle, backgroundColor: colors.cardMuted }]}
              maxLength={4}
            />

            {changePinError && (
              <Text style={[typography.captionBold, { color: colors.danger, textAlign: 'center', marginTop: spacing.xs }]}>
                {changePinError}
              </Text>
            )}

            <View style={[styles.modalBtnRow, { marginTop: spacing.md }]}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setChangePinModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <PrimaryButton
                title="Save PIN"
                onPress={handleChangePinSave}
                disabled={currentPinInput.length !== 4 || newPinInput.length !== 4 || confirmNewPinInput.length !== 4}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmationModal
        visible={deleteTargetId !== null}
        title="Delete Question"
        message="Are you sure you want to remove this private question?"
        confirmTitle="Delete"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* STANDALONE CHECK-IN MODAL */}
      <PrivateCheckinModal
        visible={checkinModalVisible}
        onSuccess={() => setCheckinModalVisible(false)}
        onCancel={() => setCheckinModalVisible(false)}
        reason="standalone"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  lockedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  lockIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setupCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    marginTop: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    marginBottom: 6,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  pinBoxInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    letterSpacing: 8,
    textAlign: 'center',
    fontSize: 22,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  statusCard: {
    marginVertical: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusInfoCol: {
    flex: 1,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionCard: {
    marginVertical: spacing.xs,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textCol: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
  },
  groupedList: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: spacing.xxs,
  },
  privacyNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
  },
  modalTextInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  modalBtnRow: {
    flexDirection: 'row',
  },
});
