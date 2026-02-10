import { StyleSheet } from 'react-native';
import { lightTheme, colors, spacing, shadows } from '../../theme';

/** Shared styles for Home dashboard sub-components */
export const homeStyles = StyleSheet.create({
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: lightTheme.colors.text,
    fontFamily: lightTheme.typography.families.display,
  },
  card: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
    padding: 14,
    ...shadows.md,
  },
  cardSmall: {
    backgroundColor: lightTheme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
    padding: 12,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
    paddingBottom: 36,
  },
  errorText: {
    color: colors.lobster[600],
    fontSize: 13,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
});

/** Primary CTA button style (reusable) */
export const ctaButton = StyleSheet.create({
  container: {
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.primary[700],
    borderWidth: 1,
    borderColor: colors.primary[800],
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
