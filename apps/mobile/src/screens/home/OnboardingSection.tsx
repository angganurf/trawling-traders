import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { lightTheme, colors, spacing, shadows } from '../../theme';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { ctaButton } from './HomeOverview.styles';

interface OnboardingSectionProps {
  /** Whether the user has at least one bot (step 2 complete) */
  hasBots: boolean;
  /** Whether any bot has a funded wallet (step 3 complete) */
  hasFundedBot: boolean;
}

interface Step {
  label: string;
  emoji: string;
  done: boolean;
}

export function OnboardingSection({ hasBots, hasFundedBot }: OnboardingSectionProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const steps: Step[] = [
    { label: 'Create your account', emoji: '🚢', done: true },
    { label: 'Create your first bot', emoji: '🎣', done: hasBots },
    { label: 'Fund your bot', emoji: '🐟', done: hasFundedBot },
  ];

  const done = steps.filter((s) => s.done).length;
  const progress = done / steps.length;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome aboard, trader!</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { flex: progress }]} />
          <View style={{ flex: 1 - progress }} />
        </View>
        <Text style={styles.progressLabel}>
          {done}/{steps.length} complete
        </Text>

        {steps.map((step) => (
          <View key={step.label} style={styles.stepRow}>
            <Text style={styles.stepEmoji}>{step.emoji}</Text>
            <Text
              style={[styles.stepLabel, step.done && styles.stepLabelDone]}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.ctaSection}>
        <Text style={styles.ctaMessage}>Ready to create your first bot?</Text>
        <TouchableOpacity
          style={ctaButton.container}
          onPress={() => navigation.navigate('CreateBot')}
          activeOpacity={0.85}
        >
          <Text style={ctaButton.text}>Create Bot</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
    padding: 16,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: lightTheme.colors.text,
    fontFamily: lightTheme.typography.families.display,
    marginBottom: 12,
  },
  progressBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.wave[200],
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    backgroundColor: colors.bullish[500],
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.wave[500],
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stepEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  stepLabel: {
    fontSize: 14,
    color: lightTheme.colors.text,
    fontWeight: '500',
  },
  stepLabelDone: {
    textDecorationLine: 'line-through',
    color: colors.wave[400],
  },
  ctaSection: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  ctaMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: lightTheme.colors.text,
    marginBottom: 12,
  },
});
