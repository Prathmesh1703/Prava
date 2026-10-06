import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenContainer, Header, Card } from '../../src/components';
import { typography } from '../../src/theme/typography';
import { radius, spacing } from '../../src/theme/spacing';

export default function TermsOfServiceScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <ScreenContainer withPillPadding={false}>
      <Header
        title="Terms & Conditions"
        subtitle="User Agreement & Disclaimer"
        backAction={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card elevated style={styles.card}>
          <Text style={[typography.captionBold, { color: colors.accent, marginBottom: spacing.xs, textTransform: 'uppercase' }]}>
            Effective Date: October 2026
          </Text>

          <Text style={[typography.title2, { color: colors.text, marginBottom: spacing.sm }]}>
            1. Acceptance of Terms
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 22 }]}>
            By downloading, installing, or using the Prava application, you agree to be bound by these Terms and Conditions. If you disagree with any portion of these terms, please do not use the application.
          </Text>

          <Text style={[typography.title2, { color: colors.text, marginBottom: spacing.sm }]}>
            2. Medical & Fitness Disclaimer
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 22 }]}>
            Prava is designed as a personal logging and activity tracking tool for informational and self-tracking purposes only. Prava is NOT a medical device, and does not provide medical diagnosis, treatment, or professional advice. Always consult a certified healthcare professional before beginning any intense physical exercise program.
          </Text>

          <Text style={[typography.title2, { color: colors.text, marginBottom: spacing.sm }]}>
            3. Local Backup & Data Responsibility
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 22 }]}>
            Because Prava operates 100% offline without remote cloud synchronization, you are responsible for managing your device backups. You may export and import archive backups via the Backup & Restore menu.
          </Text>

          <Text style={[typography.title2, { color: colors.text, marginBottom: spacing.sm }]}>
            4. License & Permitted Use
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 22 }]}>
            You are granted a personal, non-exclusive, non-transferable license to use Prava on your supported mobile devices in accordance with Google Play Store Terms of Service.
          </Text>

          <Text style={[typography.title2, { color: colors.text, marginBottom: spacing.sm }]}>
            5. Limitation of Liability
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 22 }]}>
            Under no circumstances shall Prava or its developers be liable for any direct, indirect, incidental, or consequential injuries or damages arising from physical exercise or application usage.
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
