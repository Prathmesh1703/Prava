import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface PhotoCaptureModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { addPhoto } = useApp();

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const resetState = () => {
    setPreviewUri(null);
    setSaving(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const takePhoto = async () => {
    triggerHaptic();
    setErrorMessage(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage('Camera permission is required.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPreviewUri(result.assets[0].uri);
      }
    } catch (e) {
      setErrorMessage('Could not open camera. Try choosing from gallery.');
    }
  };

  const pickFromGallery = async () => {
    triggerHaptic();
    setErrorMessage(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage('Gallery permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPreviewUri(result.assets[0].uri);
      }
    } catch (e) {
      setErrorMessage('Could not open gallery.');
    }
  };

  const handleUsePhoto = async () => {
    if (!previewUri) return;
    setSaving(true);
    try {
      await addPhoto({
        uri: previewUri,
        date: new Date().toISOString().split('T')[0],
      });
      handleClose();
    } catch (e) {
      setErrorMessage('Failed to save progress photo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.backdrop, { backgroundColor: colors.modalBackdrop }]}>
        <View style={[styles.compactModalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {previewUri ? (
            /* PREVIEW STATE */
            <View style={styles.previewContent}>
              <Text style={[typography.title3, { color: colors.text, textAlign: 'center', marginBottom: spacing.xs }]}>
                Photo Preview
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md }]}>
                Check your progress photo before saving
              </Text>

              <View style={[styles.previewFrame, { backgroundColor: '#000000', borderColor: colors.border }]}>
                <Image
                  source={{ uri: previewUri }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              </View>

              {errorMessage && (
                <Text style={[typography.caption, { color: colors.danger, textAlign: 'center', marginTop: spacing.xs }]}>
                  {errorMessage}
                </Text>
              )}

              <View style={styles.btnRow}>
                <SecondaryButton
                  title="Retake"
                  onPress={() => setPreviewUri(null)}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <PrimaryButton
                  title="Save Photo"
                  onPress={handleUsePhoto}
                  loading={saving}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            /* QUICK POPUP PICKER (2 ACTION BUTTONS) */
            <View style={styles.pickerContent}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="camera" size={26} color={colors.accent} />
              </View>

              <Text style={[typography.title2, { color: colors.text, textAlign: 'center', marginTop: spacing.xs }]}>
                Log Progress Photo
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 2, marginBottom: spacing.lg }]}>
                Capture or select today's physique check-in
              </Text>

              {errorMessage && (
                <View style={[styles.errorBox, { backgroundColor: colors.dangerLight, marginBottom: spacing.sm }]}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={[typography.caption, { color: colors.danger, marginLeft: 6, flex: 1 }]}>
                    {errorMessage}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle }]}
                onPress={takePhoto}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.12)' }]}>
                  <Ionicons name="camera" size={20} color={colors.accent} />
                </View>
                <View style={styles.actionTextCol}>
                  <Text style={[typography.headline, { color: colors.text }]}>
                    Take Photo
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    Use camera to capture now
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.cardMuted, borderColor: isDark ? colors.border : colors.borderSubtle, marginTop: spacing.xs + 2 }]}
                onPress={pickFromGallery}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)' }]}>
                  <Ionicons name="images" size={20} color="#10B981" />
                </View>
                <View style={styles.actionTextCol}>
                  <Text style={[typography.headline, { color: colors.text }]}>
                    Choose from Gallery
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    Select an existing photo
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>

              <SecondaryButton
                title="Cancel"
                onPress={handleClose}
                style={{ marginTop: spacing.md, width: '100%' }}
              />
            </View>
          )}
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
    padding: spacing.lg,
  },
  compactModalBox: {
    width: '100%',
    maxWidth: 350,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  pickerContent: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  actionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionTextCol: {
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    width: '100%',
  },
  previewContent: {
    alignItems: 'center',
  },
  previewFrame: {
    width: '100%',
    height: 280,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: spacing.xs,
  },
});
