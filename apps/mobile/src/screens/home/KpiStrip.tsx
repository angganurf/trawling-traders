import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Bot } from '@trawling-traders/types';
import { lightTheme, colors, spacing, shadows } from '../../theme';

interface KpiStripProps {
  bots: Bot[];
  openTrades: number;
  totalTrades: number;
}

interface KpiItem {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'flat';
  color: string;
  hero?: boolean;
}

function trendArrow(trend: 'up' | 'down' | 'flat'): string {
  if (trend === 'up') return '\u25B2';
  if (trend === 'down') return '\u25BC';
  return '\u2500';
}

function computeWinRate(bots: Bot[]): number {
  const withPnl = bots.filter((b) => b.todayPnl !== undefined);
  if (withPnl.length === 0) return 0;
  const winning = withPnl.filter((b) => (b.todayPnl ?? 0) > 0).length;
  return Math.round((winning / withPnl.length) * 100);
}

export function KpiStrip({ bots, openTrades, totalTrades }: KpiStripProps) {
  const items = useMemo((): KpiItem[] => {
    const todayPnl = bots.reduce((sum, b) => sum + (b.todayPnl ?? 0), 0);
    const netPnl = bots.reduce((sum, b) => sum + (b.totalPnl ?? 0), 0);
    const activeBots = bots.filter((b) => b.status === 'online').length;
    const winRate = computeWinRate(bots);

    return [
      {
        label: "Today's P&L",
        value: `${todayPnl >= 0 ? '+' : ''}$${todayPnl.toFixed(2)}`,
        trend: todayPnl > 0 ? 'up' : todayPnl < 0 ? 'down' : 'flat',
        color: todayPnl >= 0 ? colors.bullish[600] : colors.lobster[600],
        hero: true,
      },
      {
        label: 'Active Bots',
        value: `${activeBots}`,
        trend: activeBots > 0 ? 'up' : 'flat',
        color: lightTheme.colors.text,
      },
      {
        label: 'Open Trades',
        value: `${openTrades}`,
        trend: openTrades > 0 ? 'up' : 'flat',
        color: lightTheme.colors.text,
      },
      {
        label: 'Net P&L',
        value: `${netPnl >= 0 ? '+' : ''}$${netPnl.toFixed(2)}`,
        trend: netPnl > 0 ? 'up' : netPnl < 0 ? 'down' : 'flat',
        color: netPnl >= 0 ? colors.bullish[600] : colors.lobster[600],
      },
      {
        label: 'Win Rate (7D)',
        value: `${winRate}%`,
        trend: winRate >= 50 ? 'up' : winRate > 0 ? 'down' : 'flat',
        color: winRate >= 50 ? colors.bullish[600] : colors.lobster[600],
      },
    ];
  }, [bots, openTrades, totalTrades]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
      style={styles.container}
    >
      {items.map((item) => (
        <View
          key={item.label}
          style={[styles.card, item.hero && styles.heroCard]}
        >
          <Text style={styles.label}>{item.label}</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.value, { color: item.color }]}>
              {item.value}
            </Text>
            <Text
              style={[
                styles.trend,
                {
                  color:
                    item.trend === 'up'
                      ? colors.bullish[500]
                      : item.trend === 'down'
                        ? colors.lobster[500]
                        : colors.wave[400],
                },
              ]}
            >
              {trendArrow(item.trend)}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const CARD_WIDTH = 140;
const HERO_WIDTH = 180;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    marginHorizontal: -spacing.md, // bleed to edges
  },
  strip: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: lightTheme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
    padding: 12,
    ...shadows.sm,
  },
  heroCard: {
    width: HERO_WIDTH,
  },
  label: {
    fontSize: 11,
    color: colors.wave[500],
    fontWeight: '500',
    marginBottom: 6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  trend: {
    fontSize: 10,
    fontWeight: '700',
  },
});
