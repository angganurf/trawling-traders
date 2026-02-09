import { StyleSheet } from 'react-native';
import { lightTheme } from '../theme';

export const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    borderWidth: 2,
    borderColor: lightTheme.colors.cardBorder,
  },
  botName: {
    fontSize: 24,
    fontWeight: '700',
    color: lightTheme.colors.wave[900],
    fontFamily: lightTheme.typography.families.display,
  },
  metaText: {
    fontSize: 12,
    color: lightTheme.colors.wave[500],
  },
  settingsButton: {
    borderWidth: 1,
    borderColor: lightTheme.colors.wave[300],
    borderRadius: 10,
    padding: 8,
    backgroundColor: lightTheme.colors.surface,
  },
  settingsText: {
    fontSize: 18,
  },
  card: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
    padding: 14,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: lightTheme.colors.wave[900],
  },
  pnlValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  linkLabel: {
    fontSize: 13,
    color: lightTheme.colors.primary[700],
    fontWeight: '600',
  },
  sectionText: {
    fontSize: 13,
    color: lightTheme.colors.wave[600],
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  walletAddress: {
    fontSize: 12,
    color: lightTheme.colors.wave[700],
    fontFamily: 'monospace',
  },
  secondaryButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: lightTheme.colors.wave[300],
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: lightTheme.colors.wave[700],
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButtonWarn: {
    backgroundColor: lightTheme.colors.caution[500],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionButtonOk: {
    backgroundColor: lightTheme.colors.bullish[500],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionButtonNeutral: {
    backgroundColor: lightTheme.colors.primary[700],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionButtonDanger: {
    backgroundColor: lightTheme.colors.lobster[600],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  historyItem: {
    borderTopWidth: 1,
    borderColor: lightTheme.colors.wave[200],
    paddingTop: 8,
    marginTop: 8,
  },
  historyType: {
    fontSize: 10,
    letterSpacing: 0.4,
    color: lightTheme.colors.wave[500],
  },
  historyMessage: {
    fontSize: 13,
    color: lightTheme.colors.wave[800],
    marginTop: 2,
  },
  historyTime: {
    fontSize: 11,
    color: lightTheme.colors.wave[500],
    marginTop: 2,
  },
  chatBubble: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  userBubble: {
    backgroundColor: lightTheme.colors.primary[100],
  },
  assistantBubble: {
    backgroundColor: lightTheme.colors.wave[100],
  },
  chatRole: {
    fontSize: 10,
    fontWeight: '700',
    color: lightTheme.colors.wave[500],
    marginBottom: 3,
  },
  chatText: {
    fontSize: 13,
    color: lightTheme.colors.wave[900],
  },
  chatTime: {
    marginTop: 4,
    fontSize: 10,
    color: lightTheme.colors.wave[500],
  },
  chatComposer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: lightTheme.colors.wave[200],
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: lightTheme.colors.wave[300],
    borderRadius: 10,
    backgroundColor: '#fff',
    color: lightTheme.colors.wave[900],
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  sendButton: {
    borderRadius: 10,
    backgroundColor: lightTheme.colors.primary[700],
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
