import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Button,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { User, Subscription } from '@trawling-traders/types';
import { api } from '@trawling-traders/api-client';
import { lightTheme } from '../theme';

// LOB Avatar - our lobster mascot
const LOB_AVATAR = require('../../assets/lob-avatar.png');

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [botsUsed, setBotsUsed] = useState(0);

  const fetchUserData = useCallback(async () => {
    try {
      const [userData, botsData] = await Promise.all([
        api.user.getCurrentUser(),
        api.bot.listBots(),
      ]);

      setUser(userData);
      setSubscription(userData.subscription || null);
      setBotsUsed(botsData.total);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUserData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear Cedros SDK auth state
              const { logout } = await import('@cedros/login-react-native');
              await logout();
            } catch (e) {
              // Cedros logout may fail if not initialized, continue anyway
              console.warn('Cedros logout error:', e);
            }

            // Clear all stored tokens and user data from AsyncStorage
            try {
              await AsyncStorage.multiRemove([
                '@auth_token',
                '@refresh_token',
                '@user_data',
                '@session_data',
              ]);
            } catch (e) {
              console.warn('AsyncStorage clear error:', e);
            }

            // Reset navigation stack to Auth screen
            // This prevents back button from returning to authenticated screens
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              })
            );
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Image source={LOB_AVATAR} style={styles.loadingAvatar} />
        <ActivityIndicator style={styles.loadingIndicator} />
      </View>
    );
  }

  const botsLimit = subscription?.maxBots || 4;
  const usagePercent = Math.min((botsUsed / botsLimit) * 100, 100);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header with LOB Avatar */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image source={LOB_AVATAR} style={styles.avatar} />
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>#4821</Text>
          </View>
        </View>

        <Text style={styles.email}>{user?.email || 'trader@trawlingtraders.com'}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: subscription?.status === 'active' ? lightTheme.colors.bullish[500] : lightTheme.colors.lobster[500] }
        ]}>
          <Text style={styles.statusText}>{(subscription?.status || 'active').toUpperCase()}</Text>
        </View>

        <Text style={styles.tagline}>Trawling the markets 24/7</Text>
      </View>

      {/* Subscription */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Plan</Text>
          <Text style={styles.infoValue}>Pro ({botsLimit} Bots)</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Bots Used</Text>
          <Text style={styles.infoValue}>{botsUsed} / {botsLimit}</Text>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${usagePercent}%`,
                backgroundColor: usagePercent > 80 ? lightTheme.colors.lobster[500] : lightTheme.colors.bullish[500]
              }
            ]}
          />
        </View>

        {subscription?.currentPeriodEnd && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Renews</Text>
            <Text style={styles.infoValue}>
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.upgradeBox}>
          <Text style={styles.upgradeTitle}>Need more trawlers?</Text>
          <Text style={styles.upgradeText}>Upgrade to Enterprise for up to 20 bots</Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade (via Cedros Pay)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* API Keys */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Keys</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Default LLM Key</Text>
          <Text style={[styles.menuItemValue, { color: lightTheme.colors.bullish[600] }]}>Configured</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Webhook URL</Text>
          <Text style={styles.menuItemValue}>Not set</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Trading API Keys</Text>
          <Text style={[styles.menuItemValue, { color: lightTheme.colors.accent }]}>Manage</Text>
        </TouchableOpacity>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Notifications</Text>
          <Text style={styles.menuItemValue}>On</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Currency Display</Text>
          <Text style={styles.menuItemValue}>USD</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Dark Mode</Text>
          <Text style={styles.menuItemValue}>Auto</Text>
        </TouchableOpacity>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Documentation</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Discord Community</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Report a Bug</Text>
        </TouchableOpacity>
      </View>

      {/* Danger Zone */}
      <View style={[styles.section, styles.dangerSection]}>
        <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>

        <Button
          title="Sign Out"
          onPress={handleLogout}
          color={lightTheme.colors.lobster[600]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>Trawling Traders v1.0.0</Text>
        <Text style={styles.credits}>Built with OpenClaw</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightTheme.colors.background,
  },
  loadingAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  loadingIndicator: {
    marginTop: 10,
  },
  header: {
    backgroundColor: lightTheme.colors.surface,
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: lightTheme.colors.cardBorder,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: lightTheme.colors.cardBorder,
  },
  idBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: lightTheme.colors.bullish[500],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: lightTheme.colors.surface,
  },
  idBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: lightTheme.colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 14,
    color: lightTheme.colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: lightTheme.colors.surface,
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: lightTheme.colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: lightTheme.colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: lightTheme.colors.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: lightTheme.colors.wave[200],
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  upgradeBox: {
    backgroundColor: lightTheme.colors.background,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: lightTheme.colors.text,
    marginBottom: 4,
  },
  upgradeText: {
    fontSize: 14,
    color: lightTheme.colors.textSecondary,
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: lightTheme.colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.wave[100],
  },
  menuItemText: {
    fontSize: 16,
    color: lightTheme.colors.text,
  },
  menuItemValue: {
    fontSize: 14,
    color: lightTheme.colors.textSecondary,
  },
  dangerSection: {
    borderColor: lightTheme.colors.lobster[400],
    borderWidth: 1,
  },
  dangerTitle: {
    color: lightTheme.colors.lobster[600],
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    color: lightTheme.colors.textMuted,
    marginBottom: 4,
  },
  credits: {
    fontSize: 12,
    color: lightTheme.colors.textMuted,
  },
});
