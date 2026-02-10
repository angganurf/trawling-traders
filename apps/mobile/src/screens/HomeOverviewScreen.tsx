import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { Bot, BotEvent, MetricPoint } from '@trawling-traders/types';
import { api } from '@trawling-traders/api-client';
import { AuthExpiredError, NetworkError, ServerError } from '@trawling-traders/api-client';
import { OceanBackground } from '../components/OceanBackground';
import { useUser, useBotAction } from '../hooks/useBots';
import { lightTheme, colors, spacing } from '../theme';
import { DashboardHeader } from './home/DashboardHeader';
import { KpiStrip } from './home/KpiStrip';
import { BotFleetCard } from './home/BotFleetCard';
import { OnboardingSection } from './home/OnboardingSection';
import { TodayInsights } from './home/TodayInsights';
import { AlertsPanel } from './home/AlertsPanel';

interface OverviewStats {
  totalTrades: number;
  openTrades: number;
}

export function HomeOverviewScreen() {
  const { user } = useUser();
  const { performAction } = useBotAction();

  const [bots, setBots] = useState<Bot[]>([]);
  const [allMetrics, setAllMetrics] = useState<MetricPoint[]>([]);
  const [allEvents, setAllEvents] = useState<BotEvent[]>([]);
  const [stats, setStats] = useState<OverviewStats>({
    totalTrades: 0,
    openTrades: 0,
  });
  const [botsLoaded, setBotsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const botsResponse = await api.bot.listBots();
      setBots(botsResponse.bots);
      setBotsLoaded(true);

      // No bots → nothing else to fetch
      if (botsResponse.bots.length === 0) return;

      // Fetch metrics + events in background (UI already visible)
      const [metricsByBot, eventsByBot] = await Promise.all([
        Promise.all(
          botsResponse.bots.map(async (bot) => {
            try {
              const response = await api.bot.getMetrics(bot.id);
              return response.metrics.slice(-30);
            } catch {
              return [];
            }
          })
        ),
        Promise.all(
          botsResponse.bots.map(async (bot) => {
            try {
              const response = await api.bot.getEvents(bot.id);
              return response.events;
            } catch {
              return [];
            }
          })
        ),
      ]);

      setAllMetrics(metricsByBot.flat());
      setAllEvents(eventsByBot.flat());

      const flatEvents = eventsByBot.flat();
      const openedTrades = flatEvents.filter((e) => e.type === 'trade_opened').length;
      const closedTrades = flatEvents.filter((e) => e.type === 'trade_closed').length;

      setStats({
        totalTrades: flatEvents.filter(
          (e) => e.type === 'trade_opened' || e.type === 'trade_closed'
        ).length,
        openTrades: Math.max(openedTrades - closedTrades, 0),
      });
    } catch (loadErr) {
      if (__DEV__) {
        console.error('Overview load failed:', loadErr);
      }
      setBotsLoaded(true);
      if (loadErr instanceof AuthExpiredError) {
        setError('Session expired. Please log in again.');
      } else if (loadErr instanceof NetworkError) {
        setError('You appear offline. Pull to refresh.');
      } else if (loadErr instanceof ServerError) {
        setError(null);
      } else {
        setError('Unable to refresh overview right now.');
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handlePauseResume = useCallback(
    async (botId: string, action: 'pause' | 'resume') => {
      try {
        await performAction(botId, action);
        loadData();
      } catch {
        /* useBotAction sets its own error */
      }
    },
    [performAction, loadData]
  );

  const hasActiveBots = bots.length > 0;

  if (!botsLoaded) {
    return (
      <OceanBackground>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[700]} />
        </View>
      </OceanBackground>
    );
  }

  return (
    <OceanBackground>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[700]}
          />
        }
      >
        <DashboardHeader user={user} bots={bots} />

        {error && <Text style={styles.errorText}>{error}</Text>}

        {hasActiveBots && (
          <>
            <KpiStrip
              bots={bots}
              openTrades={stats.openTrades}
              totalTrades={stats.totalTrades}
            />

            <TodayInsights bots={bots} allMetrics={allMetrics} />

            <Text style={styles.sectionTitle}>Your Fleet</Text>
            {bots.map((bot, index) => (
              <BotFleetCard
                key={bot.id}
                bot={bot}
                index={index}
                onPauseResume={handlePauseResume}
              />
            ))}

            <AlertsPanel events={allEvents} />
          </>
        )}

        {!hasActiveBots && (
          <OnboardingSection hasBots={false} hasFundedBot={false} />
        )}
      </ScrollView>
    </OceanBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: 36,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.lobster[600],
    fontSize: 13,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: lightTheme.colors.text,
    fontFamily: lightTheme.typography.families.display,
    marginBottom: spacing.sm,
  },
});
