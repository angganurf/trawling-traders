import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import type { TradeableAsset } from '@trawling-traders/types';
import { api } from '@trawling-traders/api-client';
import { useSettingsStore } from '../../store';
import { lightTheme } from '../../theme';

export function CustodianSettings() {
  const disabledCustodians = useSettingsStore((s) => s.disabledCustodians);
  const toggleCustodian = useSettingsStore((s) => s.toggleCustodian);

  const [assets, setAssets] = useState<TradeableAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await api.bot.listTradeableAssets();
        if (!cancelled) setAssets(result);
      } catch {
        if (!cancelled) setAssets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const custodianList = useMemo(() => {
    const map = new Map<string, number>();
    for (const asset of assets) {
      map.set(asset.custodian, (map.get(asset.custodian) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }));
  }, [assets]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={lightTheme.colors.primary[700]} />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.helper}>Disabled custodians won't appear when selecting assets.</Text>

      {custodianList.length === 0 ? (
        <Text style={styles.emptyText}>No custodians found.</Text>
      ) : (
        custodianList.map((c) => {
          const enabled = !disabledCustodians.includes(c.name);
          return (
            <View key={c.name} style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <Text style={styles.switchTitle}>{c.name}</Text>
                <Text style={styles.switchSubtitle}>
                  {c.count} asset{c.count !== 1 ? 's' : ''}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={() => toggleCustodian(c.name)}
                trackColor={{
                  false: lightTheme.colors.wave[300],
                  true: lightTheme.colors.primary[400],
                }}
              />
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  helper: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 12,
    color: lightTheme.colors.wave[500],
  },
  emptyText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
    color: lightTheme.colors.wave[500],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: lightTheme.colors.wave[300],
    backgroundColor: '#fff',
  },
  switchCopy: {
    flex: 1,
    paddingRight: 12,
  },
  switchTitle: {
    color: lightTheme.colors.wave[900],
    fontWeight: '700',
    fontSize: 14,
  },
  switchSubtitle: {
    color: lightTheme.colors.wave[500],
    marginTop: 2,
    fontSize: 12,
  },
});
