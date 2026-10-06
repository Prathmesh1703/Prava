import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmTitle?: string;
  cancelTitle?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmTitle = 'Confirm',
  cancelTitle = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: colors.modalBackdrop }]}>
        <View style={[styles.dialogBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {isDestructive && (
            <View style={[styles.iconBox, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name="alert-circle" size={28} color={colors.danger} />
            </View>
          )}

          <Text style={[typography.title2, { color: colors.text, textAlign: 'center', marginTop: isDestructive ? spacing.sm : 0 }]}>
            {title}
          </Text>

          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg },
            ]}
          >
            {message}
          </Text>

          <View style={styles.buttonRow}>
            <SecondaryButton
              title={cancelTitle}
              onPress={onCancel}
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            <PrimaryButton
              title={confirmTitle}
              onPress={onConfirm}
              style={{
                flex: 1,
                backgroundColor: isDestructive ? colors.danger : colors.accent,
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
  },
});
