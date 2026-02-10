import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OceanBackground } from '../components/OceanBackground';
import { lightTheme } from '../theme';

export function CommunityScreen() {
  return (
    <OceanBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Coming soon.</Text>
      </View>
    </OceanBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: lightTheme.colors.wave[900],
    fontFamily: lightTheme.typography.families.display,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    color: lightTheme.colors.wave[600],
  },
});
