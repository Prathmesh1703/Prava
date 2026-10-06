import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
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
  SettingRow,
  ConfirmationModal,
} from '../../src/components';
import { typography } from '../../src/theme/typography';
import { radius, spacing } from '../../src/theme/spacing';

export default function BackupSettingsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const {
    exportBackup,
    importBackup,
    exportCsv,
    resetAllData,
  } = useApp();

  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExportBackup = async () => {
    setLoading(true);
    try {
      const res = await exportBackup();
      setLastBackup(new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }));
      setActionSuccessMsg(`Local backup created: ${res.filename} (${res.sizeKb} KB)`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async () => {
    setLoading(true);
    try {
      const msg = await importBackup();
      setActionSuccessMsg(msg);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setLoading(true);
    try {
      const filename = await exportCsv();
      setActionSuccessMsg(`CSV exported: ${filename}`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer withPillPadding={false}>
      <Header
        title="Backup & Restore"
        subtitle="Local Data Management"
        backAction={() => router.back()}
      />

      {actionSuccessMsg && (
        <View style={[styles.successBanner, { backgroundColor: colors.successLight }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={[typography.captionBold, { color: colors.success, marginLeft: 6, flex: 1 }]}>
            {actionSuccessMsg}
          </Text>
        </View>
      )}

      {/* Backup Card */}
      <SectionHeader title="Offline Backup" />
      <Card elevated style={styles.card}>
        <View style={styles.backupStatusRow}>
          <Text style={[typography.captionBold, { color: colors.textSecondary, textTransform: 'uppercase' }]}>
            Last Backup
          </Text>
          <Text style={[typography.headline, { color: colors.text }]}>
            {lastBackup || 'Never'}
          </Text>
        </View>

        <Text style={[typography.caption, { color: colors.textSecondary, marginVertical: spacing.md }]}>
          Create a standalone encrypted archive of your workout history, body weights, and progress records saved locally to your device storage.
        </Text>

        <View style={styles.btnRow}>
          <PrimaryButton
            title="Export Backup"
            onPress={handleExportBackup}
            loading={loading}
            style={{ flex: 1, marginRight: spacing.xs }}
          />
          <SecondaryButton
            title="Import Backup"
            onPress={handleImportBackup}
            disabled={loading}
            style={{ flex: 1, marginLeft: spacing.xs }}
          />
        </View>
      </Card>

      {/* Export CSV Card */}
      <SectionHeader title="Data Export" />
      <Card elevated style={styles.card}>
        <View style={styles.csvRow}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={[typography.headline, { color: colors.text }]}>Export CSV Spreadsheet</Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              Export plain-text workouts and weights for spreadsheet analysis.
            </Text>
          </View>
          <PrimaryButton
            title="Export"
            size="sm"
            onPress={handleExportCsv}
          />
        </View>
      </Card>

      {/* Danger Zone */}
      <SectionHeader title="Danger Zone" />
      <View style={[styles.groupedList, { borderColor: isDark ? colors.border : colors.borderSubtle }]}>
        <SettingRow
          icon="trash-outline"
          iconColor="#EF4444"
          label="Delete All Data"
          destructive
          onPress={() => setDeleteModalVisible(true)}
          showChevron={false}
          isFirst
          isLast
        />
      </View>

      {/* Delete All Data Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete All Data?"
        message="This will permanently delete all workouts, body weight history, progress photos, and private check-ins stored on this device."
        confirmTitle="Delete All"
        isDestructive
        onConfirm={async () => {
          setDeleteModalVisible(false);
          await resetAllData();
          setActionSuccessMsg('All local data cleared.');
          setTimeout(() => setActionSuccessMsg(null), 3000);
        }}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  backupStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
  },
  csvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupedList: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: spacing.xxs,
    marginBottom: spacing.xxl,
  },
});
