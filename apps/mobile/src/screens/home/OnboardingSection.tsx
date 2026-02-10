import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { lightTheme, colors, spacing, shadows } from '../../theme';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { ctaButton } from './HomeOverview.styles';

const STORAGE_KEY = '@tt:onboarding-progress';

interface ChecklistItem {
  id: string;
  label: string;
}

const CHECKLIST: ChecklistItem[] = [
  { id: 'explore', label: 'Explore strategy templates' },
  { id: 'risk', label: 'Set risk limits' },
  { id: 'model', label: 'Choose an AI model' },
  { id: 'create', label: 'Create your first bot' },
];

interface StrategyTemplate {
  name: string;
  description: string;
  riskLevel: 1 | 2 | 3;
}

const TEMPLATES: StrategyTemplate[] = [
  {
    name: 'Conservative',
    description: 'Low risk, steady returns',
    riskLevel: 1,
  },
  {
    name: 'Trend Rider',
    description: 'Follow momentum signals',
    riskLevel: 2,
  },
  {
    name: 'Mean Reversion',
    description: 'Buy dips, sell rips',
    riskLevel: 3,
  },
];

function RiskDots({ level }: { level: number }) {
  return (
    <View style={styles.riskRow}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.riskDot,
            {
              backgroundColor:
                i <= level ? colors.lobster[400 + (level - 1) * 100] : colors.wave[200],
            },
          ]}
        />
      ))}
    </View>
  );
}

export function OnboardingSection() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // Load persisted progress
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setChecked(new Set(JSON.parse(raw)));
        } catch {
          /* ignore corrupt data */
        }
      }
    });
  }, []);

  const toggleItem = useCallback(
    (id: string) => {
      setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
        return next;
      });
    },
    []
  );

  const done = checked.size;
  const total = CHECKLIST.length;
  const progress = total > 0 ? done / total : 0;

  return (
    <View style={styles.container}>
      {/* Checklist card */}
      <View style={styles.card}>
        <Text style={styles.title}>Launch your first bot in 3 minutes</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { flex: progress }]} />
          <View style={{ flex: 1 - progress }} />
        </View>
        <Text style={styles.progressLabel}>
          {done}/{total} complete
        </Text>

        {CHECKLIST.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.checkRow}
              onPress={() => toggleItem(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, isChecked && styles.checkboxDone]}>
                {isChecked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text
                style={[
                  styles.checkLabel,
                  isChecked && styles.checkLabelDone,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Strategy templates */}
      <Text style={styles.sectionTitle}>Strategy Templates</Text>
      {TEMPLATES.map((tmpl) => (
        <View key={tmpl.name} style={styles.templateCard}>
          <View style={styles.templateHeader}>
            <Text style={styles.templateName}>{tmpl.name}</Text>
            <RiskDots level={tmpl.riskLevel} />
          </View>
          <Text style={styles.templateDesc}>{tmpl.description}</Text>
          <TouchableOpacity
            style={ctaButton.container}
            onPress={() => navigation.navigate('CreateBot')}
            activeOpacity={0.85}
          >
            <Text style={ctaButton.text}>Create from Template</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Blurred sample fleet */}
      <Text style={styles.sectionTitle}>What your fleet could look like</Text>
      {['Sample Bot Alpha', 'Sample Bot Bravo'].map((name) => (
        <View key={name} style={styles.sampleCard}>
          <View style={styles.sampleRow}>
            <Text style={styles.sampleName}>{name}</Text>
            <View style={styles.sampleBadge}>
              <Text style={styles.sampleBadgeText}>ONLINE</Text>
            </View>
          </View>
          <Text style={styles.samplePnl}>+$142.88</Text>
        </View>
      ))}
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
  checkRow: {
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
  checkLabel: {
    fontSize: 14,
    color: lightTheme.colors.text,
    fontWeight: '500',
  },
  checkLabelDone: {
    textDecorationLine: 'line-through',
    color: colors.wave[400],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: lightTheme.colors.text,
    fontFamily: lightTheme.typography.families.display,
    marginBottom: 10,
    marginTop: 4,
  },
  templateCard: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
    padding: 14,
    marginBottom: 10,
    ...shadows.sm,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '700',
    color: lightTheme.colors.text,
  },
  templateDesc: {
    fontSize: 13,
    color: colors.wave[500],
    marginBottom: 10,
  },
  riskRow: {
    flexDirection: 'row',
    gap: 4,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sampleCard: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
    padding: 14,
    marginBottom: 10,
    opacity: 0.3,
    ...shadows.sm,
  },
  sampleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sampleName: {
    fontSize: 15,
    fontWeight: '700',
    color: lightTheme.colors.text,
  },
  sampleBadge: {
    backgroundColor: colors.bullish[500],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sampleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  samplePnl: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.bullish[600],
  },
});
