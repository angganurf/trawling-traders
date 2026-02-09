import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCedrosLogin } from '@cedros/login-react-native';
import type { BillingSummary, UserSettings } from '@trawling-traders/types';
import { api } from '@trawling-traders/api-client';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { OceanBackground } from '../components/OceanBackground';
import { lightTheme } from '../theme';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

function formatPlanName(planCode: string): string {
  const normalized = planCode.toLowerCase();
  if (normalized.includes('enterprise')) return 'Enterprise';
  if (normalized.includes('pro')) return 'Trader Pro';
  return 'Free';
}

export function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { logout } = useCedrosLogin();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setError(null);
    try {
      const [settingsResponse, billingResponse] = await Promise.all([
        api.user.getSettings(),
        api.user.getBillingSummary(),
      ]);
      setSettings(settingsResponse);
      setBilling(billingResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setSettings(null);
      setBilling(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadProfile();
  };

  const displayName = useMemo(() => {
    const name = settings?.displayName?.trim();
    if (name) return name;
    return settings?.email ?? 'Trader';
  }, [settings?.displayName, settings?.email]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
          } catch {
            // fallback navigation still applies below
          } finally {
            setIsLoggingOut(false);
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              })
            );
          }
        },
      },
    ]);
  };

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
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={lightTheme.colors.primary[700]}
          />
        }
      >
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Read-only account overview. Edit details in Settings.</Text>

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load profile</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Display Name</Text>
            <Text style={styles.value}>{displayName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{settings?.email || 'No email set'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Google Sign-In</Text>
            <Text style={styles.value}>{settings?.authMethods.google ? 'Connected' : 'Not connected'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Apple Sign-In</Text>
            <Text style={styles.value}>{settings?.authMethods.apple ? 'Connected' : 'Not connected'}</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.primaryButtonText}>Edit Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Subscription Snapshot</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Plan</Text>
            <Text style={styles.value}>{formatPlanName(billing?.planCode || 'free')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{(billing?.status || 'inactive').toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Bots Used</Text>
            <Text style={styles.value}>{billing?.botCount ?? 0} / {billing?.maxBots ?? 1}</Text>
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Billing')}>
            <Text style={styles.secondaryButtonText}>Open Billing</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Session</Text>
          <TouchableOpacity
            style={[styles.dangerButton, isLoggingOut && styles.dangerButtonDisabled]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Text style={styles.dangerButtonText}>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </OceanBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: lightTheme.colors.wave[900],
    fontFamily: lightTheme.typography.families.display,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: lightTheme.colors.wave[600],
  },
  card: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
    backgroundColor: lightTheme.colors.surface,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: lightTheme.colors.wave[900],
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: lightTheme.colors.wave[600],
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: lightTheme.colors.wave[900],
  },
  primaryButton: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: lightTheme.colors.primary[700],
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary[700],
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: lightTheme.colors.primary[700],
    fontSize: 14,
    fontWeight: '700',
  },
  dangerButton: {
    borderRadius: 10,
    backgroundColor: lightTheme.colors.lobster[600],
    paddingVertical: 11,
    alignItems: 'center',
  },
  dangerButtonDisabled: {
    opacity: 0.6,
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 14,
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
