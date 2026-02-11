import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightTheme } from '../theme';

const WITHDRAW_BG = require('../../../../assets/branding/tt-withdraw.png');
const HEADER_HEIGHT = 56;

export function WithdrawScreen() {
  const insets = useSafeAreaInsets();
  const contentTopPadding = insets.top + HEADER_HEIGHT + 10;

  return (
    <ImageBackground source={WITHDRAW_BG} style={styles.bgFill} resizeMode="cover">
      <View style={[styles.content, { paddingTop: contentTopPadding }]}>
        <View style={styles.card}>
          <Text style={styles.title}>Withdraw</Text>
          <Text style={styles.subtitle}>
            Withdrawal controls are coming soon. Reach out to support if you need immediate assistance.
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgFill: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
    backgroundColor: lightTheme.colors.surface,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: lightTheme.colors.wave[900],
    fontFamily: lightTheme.typography.families.display,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: lightTheme.colors.wave[600],
    lineHeight: 20,
  },
});
