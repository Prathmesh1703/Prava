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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useApp } from '../../src/context/AppContext';
import {
  ScreenContainer,
  Header,
  SectionHeader,
  Card,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  ConfirmationModal,
} from '../../src/components';
import { PrivateQuestion } from '../../src/types';
import { typography } from '../../src/theme/typography';
import { radius, spacing } from '../../src/theme/spacing';

export default function PrivateQuestionsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const {
    privateQuestions,
    addPrivateQuestion,
    updatePrivateQuestion,
    togglePrivateQuestion,
    deletePrivateQuestion,
  } = useApp();

  // Modals
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<PrivateQuestion | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setQuestionText('');
    setAddModalVisible(true);
  };

  const handleOpenEdit = (q: PrivateQuestion) => {
    setEditingQuestion(q);
    setQuestionText(q.text);
  };

  const handleSaveNew = async () => {
    if (questionText.trim().length > 0) {
      await addPrivateQuestion(questionText.trim());
      setAddModalVisible(false);
      setQuestionText('');
    }
  };

  const handleSaveEdit = async () => {
    if (editingQuestion && questionText.trim().length > 0) {
      await updatePrivateQuestion(editingQuestion.id, questionText.trim());
      setEditingQuestion(null);
      setQuestionText('');
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetId) {
      await deletePrivateQuestion(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  return (
    <ScreenContainer withPillPadding={false}>
      <Header
        title="Private Questions"
        subtitle="Manage Check-ins"
        backAction={() => router.back()}
        rightAction={{
          icon: 'add',
          onPress: handleOpenAdd,
        }}
      />

      <SectionHeader
        title="Active Questions"
        actionText="+ Add Question"
        onActionPress={handleOpenAdd}
      />

      {privateQuestions.length === 0 ? (
        <EmptyState
          icon="help-circle-outline"
          title="No private questions"
          description="Create custom Yes/No private questions that you want to check in on daily."
          actionTitle="Add First Question"
          onAction={handleOpenAdd}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {privateQuestions.map((q) => (
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
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: colors.cardMuted },
                      ]}
                    >
                      <Text style={[typography.captionBold, { color: colors.textSecondary }]}>
                        Yes / No
                      </Text>
                    </View>
                    <Text style={[typography.caption, { color: q.enabled ? colors.success : colors.textTertiary, marginLeft: 8 }]}>
                      {q.enabled ? 'Active in check-in' : 'Disabled'}
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
                  onPress={() => handleOpenEdit(q)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil-outline" size={16} color={colors.accent} />
                  <Text style={[typography.captionBold, { color: colors.accent, marginLeft: 4 }]}>
                    Edit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setDeleteTargetId(q.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  <Text style={[typography.captionBold, { color: colors.danger, marginLeft: 4 }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Add Question Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
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
              placeholder="e.g. Did I sleep at least 7 hours?"
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
                },
              ]}
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <SecondaryButton
                title="Cancel"
                onPress={() => setAddModalVisible(false)}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <PrimaryButton
                title="Add Question"
                onPress={handleSaveNew}
                disabled={questionText.trim().length === 0}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Question Modal */}
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
                onPress={handleSaveEdit}
                disabled={questionText.trim().length === 0}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationModal
        visible={deleteTargetId !== null}
        title="Delete Question"
        message="Are you sure you want to remove this private question?"
        confirmTitle="Delete"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  modalBtnRow: {
    flexDirection: 'row',
  },
});
