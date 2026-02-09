import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { UserSettings } from '@trawling-traders/types';
import { api } from '@trawling-traders/api-client';
import { API_URL } from '../config/api';
import { OceanBackground } from '../components/OceanBackground';
import { lightTheme } from '../theme';

async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(`${API_URL}/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => '');
    throw new Error(payload || `Reset request failed (${response.status})`);
  }
}

function AuthMethodPill({ label, connected }: { label: string; connected: boolean }) {
  return (
    <View style={[styles.methodPill, connected ? styles.methodPillOn : styles.methodPillOff]}>
      <Text style={[styles.methodPillText, connected ? styles.methodPillTextOn : styles.methodPillTextOff]}>
        {label}: {connected ? 'Connected' : 'Not Connected'}
      </Text>
    </View>
  );
}

export function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasUnsavedDisplayName = useMemo(() => {
    const saved = settings?.displayName?.trim() ?? '';
    return displayNameDraft.trim() !== saved;
  }, [displayNameDraft, settings?.displayName]);

  const loadSettings = useCallback(async () => {
    setError(null);
    try {
      const response = await api.user.getSettings();
      setSettings(response);
      setDisplayNameDraft(response.displayName ?? '');
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

  const saveDisplayName = async () => {
    if (!hasUnsavedDisplayName || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.user.updateSettings({
        displayName: displayNameDraft.trim() || undefined,
      });
      setSettings(response);
      setDisplayNameDraft(response.displayName ?? '');
      Alert.alert('Saved', 'Display name updated.');
    } catch (err) {
      Alert.alert('Update Failed', err instanceof Error ? err.message : 'Could not update display name');
    } finally {
      setIsSaving(false);
    }
  };

  const sendResetPasswordEmail = async () => {
    const email = settings?.email;
    if (!email || isResettingPassword) {
      return;
    }

    setIsResettingPassword(true);
    try {
      await requestPasswordReset(email);
      Alert.alert('Password Reset Sent', `We sent reset instructions to ${email}.`);
    } catch (err) {
      Alert.alert('Reset Failed', err instanceof Error ? err.message : 'Could not send reset email');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const connectGoogle = async () => {
    if (isConnectingGoogle) {
      return;
    }

    setIsConnectingGoogle(true);
    try {
      const response = await fetch(`${API_URL}/v1/auth/discovery`);
      if (!response.ok) {
        throw new Error(`Auth discovery failed (${response.status})`);
      }

      Alert.alert(
        'Connect Google',
        'Google sign-in is available. To link it to this account, sign out and continue with Google using the same email.'
      );
    } catch (err) {
      Alert.alert('Google Connect Unavailable', err instanceof Error ? err.message : 'Could not verify Google auth.');
    } finally {
      setIsConnectingGoogle(false);
    }
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
            onRefresh={refresh}
            tintColor={lightTheme.colors.primary[700]}
          />
        }
      >
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage account details, security, and sign-in methods.</Text>

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not load settings</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Text style={styles.inputLabel}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayNameDraft}
            onChangeText={setDisplayNameDraft}
            placeholder="Your display name"
            placeholderTextColor={lightTheme.colors.wave[400]}
            maxLength={80}
          />

          <Text style={[styles.inputLabel, { marginTop: 14 }]}>Email</Text>
          <View style={styles.readonlyBox}>
            <Text style={styles.readonlyText}>{settings?.email || 'No email on account'}</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, (!hasUnsavedDisplayName || isSaving) && styles.primaryButtonDisabled]}
            onPress={saveDisplayName}
            disabled={!hasUnsavedDisplayName || isSaving}
          >
            <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Security</Text>
          <TouchableOpacity
            style={[styles.secondaryButton, isResettingPassword && styles.secondaryButtonDisabled]}
            onPress={sendResetPasswordEmail}
            disabled={isResettingPassword || !settings?.email}
          >
            <Text style={styles.secondaryButtonText}>
              {isResettingPassword ? 'Sending...' : 'Reset Password (Email Link)'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.helper}>
            Sends a password reset link to your account email.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Login Methods</Text>
          <View style={styles.methodsRow}>
            <AuthMethodPill label="Email" connected={Boolean(settings?.authMethods.emailPassword)} />
            <AuthMethodPill label="Google" connected={Boolean(settings?.authMethods.google)} />
            <AuthMethodPill label="Apple" connected={Boolean(settings?.authMethods.apple)} />
          </View>

          {!settings?.authMethods.google && (
            <View style={styles.connectBox}>
              <Text style={styles.connectTitle}>Connect Google Sign-In</Text>
              <Text style={styles.connectText}>
                Link Google so you can log in with either password or Google.
              </Text>
              <TouchableOpacity
                style={[styles.secondaryButton, isConnectingGoogle && styles.secondaryButtonDisabled, styles.googleButton]}
                onPress={connectGoogle}
                disabled={isConnectingGoogle}
              >
                <Text style={styles.secondaryButtonText}>
                  {isConnectingGoogle ? 'Checking...' : 'Start Google Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
  inputLabel: {
    fontSize: 13,
    color: lightTheme.colors.wave[600],
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: lightTheme.colors.wave[300],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 14,
    color: lightTheme.colors.wave[900],
  },
  readonlyBox: {
    borderWidth: 1,
    borderColor: lightTheme.colors.wave[200],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: lightTheme.colors.wave[100],
  },
  readonlyText: {
    fontSize: 14,
    color: lightTheme.colors.wave[700],
  },
  primaryButton: {
    marginTop: 14,
    borderRadius: 10,
    backgroundColor: lightTheme.colors.primary[700],
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: lightTheme.colors.wave[300],
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: lightTheme.colors.primary[700],
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    color: lightTheme.colors.primary[700],
    fontSize: 14,
    fontWeight: '700',
  },
  helper: {
    marginTop: 8,
    fontSize: 12,
    color: lightTheme.colors.wave[500],
  },
  methodsRow: {
    gap: 8,
  },
  methodPill: {
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  methodPillOn: {
    borderColor: lightTheme.colors.bullish[400],
    backgroundColor: lightTheme.colors.bullish[50],
  },
  methodPillOff: {
    borderColor: lightTheme.colors.wave[200],
    backgroundColor: lightTheme.colors.wave[50],
  },
  methodPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  methodPillTextOn: {
    color: lightTheme.colors.bullish[700],
  },
  methodPillTextOff: {
    color: lightTheme.colors.wave[600],
  },
  connectBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: lightTheme.colors.wave[200],
    backgroundColor: '#fff',
    padding: 12,
  },
  connectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: lightTheme.colors.wave[900],
  },
  connectText: {
    marginTop: 6,
    fontSize: 12,
    color: lightTheme.colors.wave[600],
  },
  googleButton: {
    marginTop: 10,
  },
});
