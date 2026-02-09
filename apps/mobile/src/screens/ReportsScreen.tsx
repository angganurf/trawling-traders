import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { EmailCsvReportRequest } from '@trawling-traders/types';
import { api } from '@trawling-traders/api-client';
import { OceanBackground } from '../components/OceanBackground';
import { lightTheme } from '../theme';

const REPORT_KINDS: Array<{ label: string; value: EmailCsvReportRequest['reportKind']; description: string }> = [
  { label: 'Tax Report', value: 'tax', description: 'Trade opens/closes formatted for tax workflows.' },
  { label: 'Trade History', value: 'trade-history', description: 'Detailed trading event history CSV.' },
  { label: 'Full Activity', value: 'full', description: 'All bot events over selected timeframe.' },
];

const TIMEFRAMES: Array<{ label: string; value: EmailCsvReportRequest['timeframe'] }> = [
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last 1 year', value: '1y' },
  { label: 'All time', value: 'all' },
];

export function ReportsScreen() {
  const [reportKind, setReportKind] = useState<EmailCsvReportRequest['reportKind']>('tax');
  const [timeframe, setTimeframe] = useState<EmailCsvReportRequest['timeframe']>('90d');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [picker, setPicker] = useState<'reportKind' | 'timeframe' | null>(null);

  const selectedReport = useMemo(
    () => REPORT_KINDS.find((item) => item.value === reportKind) || REPORT_KINDS[0],
    [reportKind]
  );

  const selectedTimeframe = useMemo(
    () => TIMEFRAMES.find((item) => item.value === timeframe) || TIMEFRAMES[1],
    [timeframe]
  );

  const requestReport = async () => {
    setIsSubmitting(true);
    setLastStatus(null);

    try {
      const response = await api.reports.requestEmailCsv({ reportKind, timeframe });
      setLastStatus(response.message);
      Alert.alert('Report Requested', response.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to request report';
      setLastStatus(message);
      Alert.alert('Request Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPicker = (type: 'reportKind' | 'timeframe') => setPicker(type);
  const closePicker = () => setPicker(null);

  return (
    <OceanBackground>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Request a CSV report by email for taxes or record-keeping.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Report Type</Text>
          <TouchableOpacity style={styles.selectButton} onPress={() => openPicker('reportKind')}>
            <Text style={styles.selectText}>{selectedReport.label}</Text>
            <Text style={styles.selectChevron}>▾</Text>
          </TouchableOpacity>
          <Text style={styles.helper}>{selectedReport.description}</Text>

          <Text style={[styles.label, { marginTop: 16 }]}>Timeframe</Text>
          <TouchableOpacity style={styles.selectButton} onPress={() => openPicker('timeframe')}>
            <Text style={styles.selectText}>{selectedTimeframe.label}</Text>
            <Text style={styles.selectChevron}>▾</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.requestButton} onPress={requestReport} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.requestButtonText}>Email CSV Report</Text>
            )}
          </TouchableOpacity>

          {lastStatus && <Text style={styles.statusText}>{lastStatus}</Text>}
        </View>

        <Modal visible={picker !== null} transparent animationType="fade" onRequestClose={closePicker}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closePicker}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{picker === 'reportKind' ? 'Select report type' : 'Select timeframe'}</Text>
              {(picker === 'reportKind' ? REPORT_KINDS : TIMEFRAMES).map((item) => {
                const isSelected =
                  picker === 'reportKind' ? reportKind === item.value : timeframe === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      if (picker === 'reportKind') {
                        setReportKind(item.value as EmailCsvReportRequest['reportKind']);
                      } else {
                        setTimeframe(item.value as EmailCsvReportRequest['timeframe']);
                      }
                      closePicker();
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </OceanBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 28,
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: lightTheme.colors.wave[700],
    marginBottom: 6,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: lightTheme.colors.wave[300],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 15,
    color: lightTheme.colors.wave[800],
    fontWeight: '600',
  },
  selectChevron: {
    color: lightTheme.colors.wave[500],
  },
  helper: {
    marginTop: 6,
    fontSize: 12,
    color: lightTheme.colors.wave[500],
  },
  requestButton: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: lightTheme.colors.primary[700],
    paddingVertical: 12,
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  statusText: {
    marginTop: 10,
    fontSize: 12,
    color: lightTheme.colors.wave[600],
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
    backgroundColor: lightTheme.colors.surface,
    padding: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: lightTheme.colors.wave[800],
    marginBottom: 8,
  },
  modalItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: lightTheme.colors.wave[200],
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
  },
  modalItemSelected: {
    borderColor: lightTheme.colors.primary[600],
    backgroundColor: lightTheme.colors.primary[50],
  },
  modalItemText: {
    fontSize: 14,
    color: lightTheme.colors.wave[800],
    fontWeight: '600',
  },
  modalItemTextSelected: {
    color: lightTheme.colors.primary[700],
  },
});
