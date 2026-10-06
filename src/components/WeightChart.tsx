import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { WeightEntry } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { Card } from './Card';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

type TimeRange = '30D' | '3M' | '6M' | '1Y';

interface WeightChartProps {
  entries: WeightEntry[];
  targetWeightKg?: number;
}

export const WeightChart: React.FC<WeightChartProps> = ({ entries, targetWeightKg }) => {
  const { colors, isDark } = useTheme();
  const { profile } = useApp();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('3M');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const targetWeight = targetWeightKg || profile.targetWeightKg || 75.0;
  const ranges: TimeRange[] = ['30D', '3M', '6M', '1Y'];

  // Filter entries based on range
  const filteredEntries = React.useMemo(() => {
    if (entries.length === 0) return [];
    const now = new Date();
    let days = 90;
    if (selectedRange === '30D') days = 30;
    if (selectedRange === '3M') days = 90;
    if (selectedRange === '6M') days = 180;
    if (selectedRange === '1Y') days = 365;

    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const result = entries.filter((e) => new Date(e.date) >= cutoff);
    return result.length > 0 ? result : entries;
  }, [entries, selectedRange]);

  const weights = filteredEntries.map((e) => e.weightKg);
  const minWeight = weights.length > 0 ? Math.floor(Math.min(...weights) - 0.5) : 60;
  const maxWeight = weights.length > 0 ? Math.ceil(Math.max(...weights) + 0.5) : 80;
  const range = maxWeight - minWeight || 1;

  const chartHeight = 160;
  const maxBarHeight = 110;

  // Currently active/inspected entry (default to latest entry if none explicitly selected)
  const latestEntry = filteredEntries[filteredEntries.length - 1];
  const activeEntryId = selectedEntryId || latestEntry?.id;
  const inspectedEntry = filteredEntries.find((e) => e.id === activeEntryId) || latestEntry;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const handleSelectBar = (entry: WeightEntry) => {
    triggerHaptic();
    setSelectedEntryId(entry.id);
  };

  return (
    <Card elevated style={styles.container}>
      {/* Header Row: Title & Range Filter Buttons */}
      <View style={styles.headerRow}>
        <Text style={[typography.headline, { color: colors.text }]}>
          Weight Trend
        </Text>

        <View style={[styles.rangeContainer, { backgroundColor: colors.cardMuted }]}>
          {ranges.map((r) => {
            const active = selectedRange === r;
            return (
              <TouchableOpacity
                key={r}
                style={[
                  styles.rangeButton,
                  active && {
                    backgroundColor: colors.card,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 1,
                  },
                ]}
                onPress={() => {
                  setSelectedRange(r);
                  setSelectedEntryId(null);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    typography.captionBold,
                    {
                      fontSize: 11,
                      color: active ? colors.text : colors.textSecondary,
                    },
                  ]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Inspected Sub-header Row */}
      <View style={styles.subHeaderRow}>
        {inspectedEntry ? (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {new Date(inspectedEntry.date + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            : <Text style={{ color: colors.accent, fontWeight: '700' }}>{inspectedEntry.weightKg.toFixed(1)} kg</Text>
            <Text style={{ color: colors.textTertiary }}> (Target: {targetWeight} kg)</Text>
          </Text>
        ) : (
          <Text style={[typography.caption, { color: colors.textTertiary }]}>
            Target: {targetWeight} kg
          </Text>
        )}
      </View>

      {/* Chart visualization */}
      {filteredEntries.length === 0 ? (
        <View style={[styles.emptyChart, { height: chartHeight }]}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            No weight entries yet
          </Text>
        </View>
      ) : (
        <View style={styles.chartWrapper}>
          {/* Y Axis Guide Lines */}
          <View style={styles.gridContainer}>
            <View style={[styles.gridLine, { borderColor: isDark ? colors.border : colors.borderSubtle }]}>
              <Text style={[typography.caption, { color: colors.textTertiary, width: 45 }]}>
                {maxWeight} kg
              </Text>
            </View>
            <View style={[styles.gridLine, { borderColor: isDark ? colors.border : colors.borderSubtle }]}>
              <Text style={[typography.caption, { color: colors.textTertiary, width: 45 }]}>
                {((maxWeight + minWeight) / 2).toFixed(1)} kg
              </Text>
            </View>
            <View style={[styles.gridLine, { borderColor: isDark ? colors.border : colors.borderSubtle }]}>
              <Text style={[typography.caption, { color: colors.textTertiary, width: 45 }]}>
                {minWeight} kg
              </Text>
            </View>
          </View>

          {/* Plot Area */}
          <View style={[styles.plotArea, { height: chartHeight }]}>
            {/* Interactive Bars: Grey by default, Blue for active/latest/clicked */}
            <View style={styles.pointsRow}>
              {filteredEntries.map((entry, index) => {
                const normalized = Math.max(0.1, Math.min(1.0, (entry.weightKg - minWeight) / range));
                const barHeight = Math.max(16, normalized * maxBarHeight);
                const isSelected = activeEntryId === entry.id;
                const isLast = index === filteredEntries.length - 1;

                // Color: Accent orange only if selected (or latest by default), subtle grey for all others
                const barColor = isSelected
                  ? colors.accent
                  : (isDark ? colors.border : '#E2E8F0');

                return (
                  <TouchableOpacity
                    key={entry.id || index}
                    style={styles.pointCol}
                    onPress={() => handleSelectBar(entry)}
                    activeOpacity={0.8}
                  >
                    {/* Selected Inspection Bubble */}
                    {isSelected && (
                      <View
                        style={[
                          styles.inspectBubble,
                          {
                            bottom: barHeight + 6,
                            backgroundColor: colors.accent,
                          },
                        ]}
                      >
                        <Text style={[typography.captionBold, { color: '#FFFFFF', fontSize: 10 }]}>
                          {entry.weightKg.toFixed(1)} kg
                        </Text>
                      </View>
                    )}

                    {/* Solid Clean Bar */}
                    <View
                      style={[
                        styles.solidBar,
                        {
                          height: barHeight,
                          backgroundColor: barColor,
                        },
                      ]}
                    />

                    {/* X-axis date label */}
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: isSelected ? colors.accent : isLast ? colors.text : colors.textTertiary,
                          fontWeight: isSelected || isLast ? '700' : '400',
                          fontSize: 10,
                          marginTop: 6,
                          height: 16,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  subHeaderRow: {
    marginTop: 4,
    marginBottom: spacing.md,
  },
  rangeContainer: {
    flexDirection: 'row',
    borderRadius: radius.sm,
    padding: 2,
  },
  rangeButton: {
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  emptyChart: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartWrapper: {
    marginTop: spacing.xs,
  },
  gridContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 24,
    justifyContent: 'space-between',
  },
  gridLine: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    height: 1,
    width: '100%',
  },
  plotArea: {
    paddingLeft: 46,
    paddingRight: spacing.sm,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingBottom: 24,
  },
  pointCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    position: 'relative',
  },
  solidBar: {
    width: 22,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  inspectBubble: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    zIndex: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
