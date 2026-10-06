import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenContainer, Header, Card } from '../../src/components';
import { typography } from '../../src/theme/typography';
import { radius, spacing } from '../../src/theme/spacing';

export default function PrivacyPolicyScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <ScreenContainer withPillPadding={false}>
      <Header
        title="Privacy Policy"
        subtitle="Google Play Compliant"
        backAction={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card elevated style={styles.card}>
          <Text style={[typography.captionBold, { color: colors.accent, marginBottom: spacing.xs, textTransform: 'uppercase' }]}>
            Last Updated: October 2026
          </Text>

          <Text style={[typography.title2, { color: colors.text, marginBottom: spacing.sm }]}>
            1. Zero Data Collection Architecture
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 22 }]}>
            Prava is built strictly as an offline-first personal fitness journal. We do NOT collect, transmit, monetize, or store your personal health, workout, weight, progress photos, or check-in data on any external servers or third-party cloud services.
          </Text>

          <Text style={[typography.title2, { color: colors.text, marginBottom: spacing.sm }]}>
            2. On-Device Local Storage
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 22 }]}>
            All entries (workouts, weight trends, PIN-protected check-ins, and user profile information) remain exclusively isolated within your device's sandboxed local application storage. You retain 100% ownership and full authority over your data.
          </Text>

          <Text style={[typography.title2, { color: colors.text, marginBottom: spacing.sm }]}>
            3. Camera & Photo Permissions
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 22 }]}>
            Prava requests Camera and Media Library permissions solely to enable you to capture and store personal progress photos locally on your device. Photos are never uploaded or analyzed by external machine learning or tracking servers.
          </Text>

          <Text style={[typography.title2, { color: colors.text, marginBottom: spacing.sm }]}>
            4. Private Check-ins & Security
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 22 }]}>
            Private check-in logs and responses are guarded by a 4-digit PIN gate. Data is never shared with third parties or advertising networks.
          </Text>

          <Text style={[typography.title2, { color: colors.text, marginBottom: spacing.sm }]}>
            5. User Rights & Data Deletion
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 22 }]}>
            You can delete individual workouts, clear history, or wipe all app data at any time via Profile &gt; Data Management. Uninstalling the application completely erases all local data from your device.
          </Text>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  card: {
    padding: spacing.lg,
    marginVertical: spacing.xs,
  },
});
