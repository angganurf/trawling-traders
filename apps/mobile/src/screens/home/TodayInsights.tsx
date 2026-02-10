import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Bot, MetricPoint } from '@trawling-traders/types';
import { PnlHistoryChart } from '../../components/PnlHistoryChart';
import { lightTheme, colors, spacing, shadows } from '../../theme';

interface TodayInsightsProps {
  bots: Bot[];
  /** Flat array of all bot metrics (most recent 30 per bot, pre-merged) */
  allMetrics: MetricPoint[];
}

function buildInsight(bots: Bot[]): string {
  const withPnl = bots.filter((b) => b.todayPnl !== undefined);
  if (withPnl.length === 0) return 'Awaiting trading data';

  const profitable = withPnl.filter((b) => (b.todayPnl ?? 0) > 0).length;
  const flat = withPnl.filter((b) => (b.todayPnl ?? 0) === 0).length;
  const losing = withPnl.length - profitable - flat;

  const totalToday = withPnl.reduce((s, b) => s + (b.todayPnl ?? 0), 0);

  const parts: string[] = [];
  if (profitable > 0) parts.push(`${profitable} profitable`);
  if (flat > 0) parts.push(`${flat} flat`);
  if (losing > 0) parts.push(`${losing} down`);

  const summary = parts.join(', ');
  const pnlStr = `${totalToday >= 0 ? '+' : ''}$${totalToday.toFixed(2)}`;

  return `${summary} \u00B7 ${pnlStr} today`;
}

export function TodayInsights({ bots, allMetrics }: TodayInsightsProps) {
  const insight = useMemo(() => buildInsight(bots), [bots]);

  if (bots.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Today's Overview</Text>
      <PnlHistoryChart metrics={allMetrics} height={100} />
      <Text style={styles.insight}>{insight}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
    padding: 14,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: lightTheme.colors.text,
    fontFamily: lightTheme.typography.families.display,
    marginBottom: 8,
  },
  insight: {
    fontSize: 13,
    color: colors.wave[600],
    marginTop: 8,
  },
});
