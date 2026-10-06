import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface QuickWeightModalProps {
  visible: boolean;
  onClose: () => void;
}

export const QuickWeightModal: React.FC<QuickWeightModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { currentWeight, addWeight } = useApp();

  const [weightValue, setWeightValue] = useState<string>('72.4');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      setWeightValue(currentWeight > 0 ? currentWeight.toFixed(1) : '72.0');
    }
  }, [visible, currentWeight]);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const adjustWeight = (delta: number) => {
    triggerHaptic();
    const curr = parseFloat(weightValue) || 70.0;
    const updated = Math.max(30, Math.min(250, curr + delta));
    setWeightValue(updated.toFixed(1));
  };

  const handleSave = async () => {
    const parsed = parseFloat(weightValue);
    if (isNaN(parsed) || parsed < 30 || parsed > 250) {
      return;
    }
    setSaving(true);
    try {
      await addWeight(parsed);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
        <View style={[styles.compactModalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[typography.title2, { color: colors.text, textAlign: 'center' }]}>
            Current Weight
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 2, marginBottom: spacing.md }]}>
            Log your body weight for today
          </Text>

          {/* Metric Display Box */}
          <View style={[styles.metricDisplayBox, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}>
            <TextInput
              value={weightValue}
              onChangeText={setWeightValue}
              keyboardType="decimal-pad"
              maxLength={5}
              selectTextOnFocus
              style={[typography.metricLarge, styles.metricInput, { color: colors.text }]}
            />
            <Text style={[typography.title2, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
              kg
            </Text>
          </View>

          {/* Steppers Row */}
          <View style={styles.steppersRow}>
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
              onPress={() => adjustWeight(-1.0)}
            >
              <Text style={[typography.headline, { color: colors.text }]}>-1.0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
              onPress={() => adjustWeight(-0.5)}
            >
              <Text style={[typography.headline, { color: colors.text }]}>-0.5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
              onPress={() => adjustWeight(0.5)}
            >
              <Text style={[typography.headline, { color: colors.text }]}>+0.5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: colors.cardMuted }]}
              onPress={() => adjustWeight(1.0)}
            >
              <Text style={[typography.headline, { color: colors.text }]}>+1.0</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.modalBtnRow}>
            <SecondaryButton
              title="Cancel"
              onPress={onClose}
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            <PrimaryButton
              title="Save"
              onPress={handleSave}
              loading={saving}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  compactModalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
  },
  metricDisplayBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginVertical: spacing.sm,
  },
  metricInput: {
    textAlign: 'center',
    minWidth: 90,
  },
  steppersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  stepBtn: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    minWidth: 52,
    alignItems: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    width: '100%',
  },
});
