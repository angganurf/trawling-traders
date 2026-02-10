import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BotEvent, BotEventType } from '@trawling-traders/types';
import { lightTheme, colors, spacing, shadows } from '../../theme';

interface AlertsPanelProps {
  events: BotEvent[];
}

const ACTIONABLE_TYPES: BotEventType[] = [
  'error',
  'stop_triggered',
  'config_failed',
];

const EVENT_ICONS: Partial<Record<BotEventType, string>> = {
  error: '!',
  stop_triggered: '!!',
  config_failed: '!!',
};

function relativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AlertsPanel({ events }: AlertsPanelProps) {
  const alerts = useMemo(() => {
    return events
      .filter((e) => ACTIONABLE_TYPES.includes(e.type))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 2);
  }, [events]);

  if (alerts.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Recent Alerts</Text>
      {alerts.map((alert) => (
        <View key={alert.id} style={styles.alertRow}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>
              {EVENT_ICONS[alert.type] ?? '?'}
            </Text>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertMessage} numberOfLines={2}>
              {alert.message}
            </Text>
            <Text style={styles.alertTime}>
              {relativeTime(alert.timestamp)}
            </Text>
          </View>
        </View>
      ))}
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
    marginBottom: 10,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.lobster[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  iconText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.lobster[600],
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 13,
    color: lightTheme.colors.text,
    fontWeight: '500',
  },
  alertTime: {
    fontSize: 11,
    color: colors.wave[400],
    marginTop: 2,
  },
});
