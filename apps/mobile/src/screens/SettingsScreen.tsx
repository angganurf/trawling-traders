import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { UserSettings } from '@trawling-traders/types';
import { api } from '@trawling-traders/api-client';
import { lightTheme } from '../theme';
import { AccountSettings } from './settings/AccountSettings';
import { AiProviderSettings } from './settings/AiProviderSettings';
import { CustodianSettings } from './settings/CustodianSettings';
const HELM_BG = require('../../../../assets/branding/tt-helm.png');
const HEADER_HEIGHT = 56;

type SettingsTab = 'account' | 'ai-providers' | 'custodians';

const TABS: { key: SettingsTab; label: string }[] = [
  { key: 'account', label: 'Account' },
  { key: 'ai-providers', label: 'AI Providers' },
  { key: 'custodians', label: 'Custodians' },
];

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const contentTopPadding = insets.top + HEADER_HEIGHT + 10;
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setError(null);
    try {
      const response = await api.user.getSettings();
      setSettings(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      setSettings(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const refresh = async () => {
    setIsRefreshing(true);
    await loadSettings();
  };

  const handleSave = async (updates: { displayName?: string }) => {
    const response = await api.user.updateSettings(updates);
    setSettings(response);
  };

  if (isLoading) {
    return (
      <ImageBackground source={HELM_BG} style={styles.bgFill} resizeMode="cover">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={lightTheme.colors.primary[700]} />
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={HELM_BG} style={styles.bgFill} resizeMode="cover">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: contentTopPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={lightTheme.colors.primary[700]}
          />
        }
      >
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not load settings</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {activeTab === 'account' && <AccountSettings settings={settings} onSave={handleSave} />}
        {activeTab === 'ai-providers' && <AiProviderSettings />}
        {activeTab === 'custodians' && <CustodianSettings />}
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  tab: {
    borderWidth: 1,
    borderColor: lightTheme.colors.wave[300],
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  tabActive: {
    borderColor: '#0b5ea8',
    backgroundColor: '#0b5ea8',
  },
  tabText: {
    color: lightTheme.colors.wave[800],
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  errorCard: {
    marginTop: 14,
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
