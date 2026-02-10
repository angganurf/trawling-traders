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
  done: boolean;
}

export function OnboardingSection({ hasBots, hasFundedBot }: OnboardingSectionProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const steps: Step[] = [
    { label: 'Create your account', done: true },
    { label: 'Create your first bot', done: hasBots },
    { label: 'Fund your bot', done: hasFundedBot },
  ];

  const done = steps.filter((s) => s.done).length;
  const progress = done / steps.length;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Get Started</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { flex: progress }]} />
          <View style={{ flex: 1 - progress }} />
        </View>
        <Text style={styles.progressLabel}>
          {done}/{steps.length} complete
        </Text>

        {steps.map((step) => (
          <View key={step.label} style={styles.stepRow}>
            <View style={[styles.checkbox, step.done && styles.checkboxDone]}>
              {step.done && <Text style={styles.checkmark}>✓</Text>}
            </View>
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
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.wave[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxDone: {
    backgroundColor: colors.bullish[500],
    borderColor: colors.bullish[500],
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
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
