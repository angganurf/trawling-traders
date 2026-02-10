import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Bot, User } from '@trawling-traders/types';
import { lightTheme, colors, spacing } from '../../theme';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { ctaButton } from './HomeOverview.styles';

interface DashboardHeaderProps {
  user: User | null;
  bots: Bot[];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

function getFirstName(user: User | null): string {
  if (!user?.email) return 'Trader';
  const local = user.email.split('@')[0];
  // Capitalize first letter of first segment
  const name = local.split(/[._-]/)[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getStatusLine(bots: Bot[]): string {
  const running = bots.filter((b) => b.status === 'online').length;
  if (bots.length === 0) return 'Ready to launch your fleet';
  if (running === 0) return 'No bots currently running';
  return `${running} bot${running === 1 ? '' : 's'} running`;
}

export function DashboardHeader({ user, bots }: DashboardHeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <View style={styles.textColumn}>
        <Text style={styles.greeting}>
          {getGreeting()}, {getFirstName(user)}
        </Text>
        <Text style={styles.statusLine}>{getStatusLine(bots)}</Text>
      </View>
      <TouchableOpacity
        style={ctaButton.container}
        onPress={() => navigation.navigate('CreateBot')}
        activeOpacity={0.85}
      >
        <Text style={ctaButton.text}>+ New Bot</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  textColumn: {
    flex: 1,
    marginRight: spacing.sm,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: lightTheme.colors.text,
    fontFamily: lightTheme.typography.families.display,
  },
  statusLine: {
    fontSize: 13,
    color: colors.wave[500],
    marginTop: 2,
  },
});
