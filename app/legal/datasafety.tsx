import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenContainer, Header, Card } from '../../src/components';
import { typography } from '../../src/theme/typography';
import { radius, spacing } from '../../src/theme/spacing';

export default function DataSafetyScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const safetyItems = [
    {
      icon: 'shield-checkmark',
      color: '#10B981',
      title: 'No Data Shared with Third Parties',
      desc: 'Prava does not transmit, share, or sell any user information, metrics, or logs to third-party companies or advertising platforms.',
    },
    {
      icon: 'server-outline',
      color: '#FF6A1F',
      title: 'No Remote Server Collection',
      desc: 'All training logs, weight readings, and photos are stored strictly in local device sandbox storage.',
    },
    {
      icon: 'lock-closed-outline',
      color: '#8B5CF6',
      title: 'Confidential Local PIN Gate',
      desc: 'Sensitive check-in responses are locked behind a local PIN authentication shield.',
    },
    {
      icon: 'trash-bin-outline',
      color: '#EF4444',
      title: 'Complete User Data Control',
      desc: 'You can export backups or permanently wipe all recorded logs instantly with a single tap.',
    },
  ];

  return (
    <ScreenContainer withPillPadding={false}>
      <Header
        title="Data Safety"
        subtitle="Google Play Declaration"
        backAction={() => router.back()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card elevated style={styles.card}>
          <Text style={[typography.headline, { color: colors.text, marginBottom: spacing.sm }]}>
            Play Store Data Safety Overview
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 22 }]}>
            Here is the official declaration of data handling practices for Prava in compliance with Google Play Store developer policies.
          </Text>

          {safetyItems.map((item, idx) => (
            <View key={idx} style={[styles.itemRow, { borderBottomColor: isDark ? colors.border : colors.borderSubtle, borderBottomWidth: idx < safetyItems.length - 1 ? 1 : 0 }]}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={styles.itemTextCol}>
                <Text style={[typography.headline, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}
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
  itemRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemTextCol: {
    flex: 1,
  },
});
