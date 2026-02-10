import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCedrosLogin } from '@cedros/login-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  DepositConfigResponse,
  CreditBalanceResponse,
  CreditTransactionResponse,
  CreditHistoryResponse,
  DepositTier,
} from '@cedros/login-react-native';
import { DepositForm, CreditBalance, CreditHistory } from '@cedros/login-react-native';
import { lightTheme } from '../theme';
const FILL_UP_BG = require('../../../../assets/branding/tt-fill-up.png');
const HEADER_HEIGHT = 56;

/**
 * Fetches JSON from a cedros-login endpoint with bearer auth.
 * Throws on non-OK responses with the server error message.
 */
async function cedrosFetch<T>(serverUrl: string, path: string, token: string | null): Promise<T> {
  const res = await fetch(`${serverUrl}/auth${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function DepositScreen() {
  const { config: cedrosConfig, getAccessToken } = useCedrosLogin();
  const insets = useSafeAreaInsets();
  const contentTopPadding = insets.top + HEADER_HEIGHT + 10;

  const [depositConfig, setDepositConfig] = useState<DepositConfigResponse | null>(null);
  const [balance, setBalance] = useState<CreditBalanceResponse | null>(null);
  const [transactions, setTransactions] = useState<CreditTransactionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    const token = getAccessToken();
    const url = cedrosConfig.serverUrl;
    try {
      const [configRes, balanceRes, historyRes] = await Promise.all([
        cedrosFetch<DepositConfigResponse>(url, '/deposit/config', token),
        cedrosFetch<CreditBalanceResponse>(url, '/credits/balance', token),
        cedrosFetch<CreditHistoryResponse>(url, '/credits/history?limit=20', token),
      ]);
      setDepositConfig(configRes);
      setBalance(balanceRes);
      setTransactions(historyRes.transactions);
    } catch (err) {
      if (__DEV__) console.warn('Deposit load failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load deposit info');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [cedrosConfig.serverUrl, getAccessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  const handleDeposit = useCallback(
    async (amountLamports: number, tier: DepositTier) => {
      const token = getAccessToken();
      const url = cedrosConfig.serverUrl;
      const endpoint =
        tier === 'private' ? '/deposit' : tier === 'public' ? '/deposit/public' : '/deposit/micro';

      const res = await fetch(`${url}/auth${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amountLamports }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(body || `HTTP ${res.status}`);
      }
    },
    [cedrosConfig.serverUrl, getAccessToken],
  );

  if (isLoading) {
    return (
      <ImageBackground source={FILL_UP_BG} style={styles.bgFill} resizeMode="cover">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={lightTheme.colors.primary[700]} />
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={FILL_UP_BG} style={styles.bgFill} resizeMode="cover">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: contentTopPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={lightTheme.colors.primary[700]}
          />
        }
      >
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load deposit info</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {balance && (
          <CreditBalance
            balanceLamports={balance.balanceLamports}
            currency={balance.currency}
            containerStyle={styles.balanceCard}
          />
        )}

        {depositConfig && (
          <View style={styles.card}>
            <DepositForm
              config={depositConfig}
              onDeposit={handleDeposit}
              onSuccess={loadData}
            />
          </View>
        )}

        {transactions.length > 0 && (
          <View style={styles.card}>
            <CreditHistory transactions={transactions} />
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgFill: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    marginBottom: 14,
    borderRadius: 16,
  },
  card: {
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
    backgroundColor: lightTheme.colors.surface,
    overflow: 'hidden',
  },
  errorCard: {
    marginBottom: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: lightTheme.colors.lobster[300],
    backgroundColor: lightTheme.colors.lobster[50],
    padding: 12,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: lightTheme.colors.lobster[700],
  },
  errorText: {
    marginTop: 4,
    color: lightTheme.colors.lobster[700],
    fontSize: 12,
  },
});
