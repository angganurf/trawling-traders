import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Bot, MetricPoint } from '@trawling-traders/types';
import { api } from '@trawling-traders/api-client';
import { OceanBackground } from '../components/OceanBackground';
import { PnlHistoryChart } from '../components/PnlHistoryChart';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { lightTheme } from '../theme';

const LOB_AVATAR = require('../../assets/lob-avatar.png');

type HomeOverviewNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface OverviewStats {
  totalBots: number;
  totalTrades: number;
  openTrades: number;
  netPnl: number;
}

export function HomeOverviewScreen() {
  const navigation = useNavigation<HomeOverviewNavigationProp>();
  const [bots, setBots] = useState<Bot[]>([]);
  const [botMetrics, setBotMetrics] = useState<Record<string, MetricPoint[]>>({});
  const [stats, setStats] = useState<OverviewStats>({
    totalBots: 0,
    totalTrades: 0,
    openTrades: 0,
    netPnl: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const botsResponse = await api.bot.listBots();
      setBots(botsResponse.bots);

      const [metricsByBot, eventsByBot] = await Promise.all([
        Promise.all(
          botsResponse.bots.map(async (bot) => {
            try {
              const response = await api.bot.getMetrics(bot.id);
              return [bot.id, response.metrics.slice(-30)] as const;
            } catch {
              return [bot.id, []] as const;
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

      setBotMetrics(Object.fromEntries(metricsByBot));

      const totalTrades = eventsByBot
        .flat()
        .filter((event) => event.type === 'trade_opened' || event.type === 'trade_closed').length;

      const openedTrades = eventsByBot.flat().filter((event) => event.type === 'trade_opened').length;
      const closedTrades = eventsByBot.flat().filter((event) => event.type === 'trade_closed').length;
      const openTrades = Math.max(openedTrades - closedTrades, 0);

      const netPnl = botsResponse.bots.reduce((sum, bot) => sum + (bot.totalPnl || 0), 0);

      setStats({
        totalBots: botsResponse.total,
        totalTrades,
        openTrades,
        netPnl,
      });
    } catch (loadErr) {
      setError(loadErr instanceof Error ? loadErr.message : 'Failed to load overview');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const statTiles = useMemo(
    () => [
      { label: 'Total Bots', value: `${stats.totalBots}` },
      { label: 'Total Trades', value: `${stats.totalTrades}` },
      { label: 'Open Trades', value: `${stats.openTrades}` },
      {
        label: 'Net P&L',
        value: `${stats.netPnl >= 0 ? '+' : ''}$${stats.netPnl.toFixed(2)}`,
      },
    ],
    [stats]
  );

  if (isLoading) {
    return (
      <OceanBackground>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={lightTheme.colors.primary[700]} />
        </View>
      </OceanBackground>
    );
  }

  return (
    <OceanBackground>
      <FlatList
        data={bots}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={lightTheme.colors.primary[700]}
          />
        }
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Image source={LOB_AVATAR} style={styles.headerAvatar} />
              <View>
                <Text style={styles.title}>Overview</Text>
                <Text style={styles.subtitle}>Live bot performance snapshot</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              {statTiles.map((tile) => (
                <View key={tile.label} style={styles.statTile}>
                  <Text style={styles.statLabel}>{tile.label}</Text>
                  <Text style={styles.statValue}>{tile.value}</Text>
                </View>
              ))}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
          </>
        }
        renderItem={({ item }) => {
          const pnl = item.totalPnl || 0;
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('BotDetail', { botId: item.id })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.profileRow}>
                  <Image source={LOB_AVATAR} style={styles.botAvatar} />
                  <View>
                    <Text style={styles.botName}>{item.name}</Text>
                    <Text style={styles.botPersona}>{item.persona}</Text>
                  </View>
                </View>
                <Text style={[styles.botPnl, { color: pnl >= 0 ? lightTheme.colors.bullish[600] : lightTheme.colors.lobster[600] }]}>
                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                </Text>
              </View>

              <PnlHistoryChart metrics={botMetrics[item.id] || []} height={145} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No bots yet</Text>
            <Text style={styles.emptyText}>Create your first bot to populate overview stats.</Text>
            <TouchableOpacity
              style={styles.emptyCtaButton}
              onPress={() => navigation.navigate('CreateBot')}
            >
              <Text style={styles.emptyCtaButtonText}>Create Your First Bot</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </OceanBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    borderWidth: 2,
    borderColor: lightTheme.colors.cardBorder,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: lightTheme.colors.wave[900],
    fontFamily: lightTheme.typography.families.display,
  },
  subtitle: {
    color: lightTheme.colors.wave[600],
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 10,
  },
  statTile: {
    width: '48%',
    backgroundColor: lightTheme.colors.surface,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
    borderRadius: 14,
    padding: 12,
  },
  statLabel: {
    fontSize: 12,
    color: lightTheme.colors.wave[500],
  },
  statValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '700',
    color: lightTheme.colors.wave[900],
  },
  errorText: {
    color: lightTheme.colors.lobster[600],
    marginBottom: 8,
  },
  card: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  botName: {
    fontSize: 16,
    fontWeight: '700',
    color: lightTheme.colors.wave[900],
  },
  botPersona: {
    fontSize: 12,
    color: lightTheme.colors.wave[500],
    textTransform: 'capitalize',
  },
  botPnl: {
    fontSize: 20,
    fontWeight: '700',
  },
  empty: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: lightTheme.colors.wave[700],
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: lightTheme.colors.wave[500],
  },
  emptyCtaButton: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: lightTheme.colors.primary[700],
  },
  emptyCtaButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
