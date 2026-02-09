import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OceanBackground } from '../components/OceanBackground';
import { lightTheme } from '../theme';

type DocsCategoryId = 'setup' | 'optimization' | 'support';

interface DocArticle {
  id: string;
  title: string;
  summary: string;
  content: string[];
}

interface DocCategory {
  id: DocsCategoryId;
  title: string;
  description: string;
  articles: DocArticle[];
}

const DOCS_CATEGORIES: DocCategory[] = [
  {
    id: 'setup',
    title: 'Set Up',
    description: 'Everything needed to launch your first bot safely.',
    articles: [
      {
        id: 'get-started',
        title: 'Get Started',
        summary: 'Create your account, fund your wallet, and launch your first bot.',
        content: [
          'Create your account and complete onboarding so your workspace is initialized.',
          'Create your first bot from the Home screen and choose a starter strategy.',
          'Before enabling live trading, review behavior settings for limits and stop conditions.',
        ],
      },
      {
        id: 'choose-ai-provider',
        title: 'Choose Your AI Provider',
        summary: 'Compare providers and select the one that matches your latency and cost goals.',
        content: [
          'Pick a provider based on your priorities: speed, cost, or reasoning depth.',
          'For active intraday strategies, lower latency typically matters more than long-form output.',
          'Use strategy and behavior settings together so model decisions remain bounded by your risk rules.',
        ],
      },
      {
        id: 'connect-telegram',
        title: 'Connect to Telegram',
        summary: 'Send bot notifications and reports directly to your Telegram channel.',
        content: [
          'Generate a Telegram bot token and add your bot to the destination channel.',
          'Paste the token and channel ID into your bot behavior configuration.',
          'Run a test alert first to verify delivery before relying on production notifications.',
        ],
      },
    ],
  },
  {
    id: 'optimization',
    title: 'Optimization',
    description: 'Tune strategy quality, execution behavior, and monitoring loops.',
    articles: [
      {
        id: 'improve-signal-quality',
        title: 'Improve Signal Quality',
        summary: 'Reduce noisy entries with better filters and event validation.',
        content: [
          'Start with fewer markets and stricter entry criteria to reduce false positives.',
          'Adjust event filters and confidence thresholds before increasing trade volume.',
          'Review historical trades weekly and remove rules that create repeated low-quality entries.',
        ],
      },
      {
        id: 'risk-controls',
        title: 'Risk Controls',
        summary: 'Set hard constraints so AI decisions stay inside your risk envelope.',
        content: [
          'Define max position size, daily loss limits, and stop conditions in behavior settings.',
          'Treat limits as hard controls, not suggestions, and keep them active in all market conditions.',
          'When testing changes, alter one major setting at a time so impact is measurable.',
        ],
      },
      {
        id: 'read-pnl-history',
        title: 'Read P&L History',
        summary: 'Use chart trends and event timing to evaluate strategy health.',
        content: [
          'Check whether gains come from a consistent pattern or a small number of outlier trades.',
          'Compare drawdown periods against behavior or strategy changes to find regressions.',
          'Use reports exports to keep an external audit trail for deeper analysis.',
        ],
      },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    description: 'Troubleshooting, billing, and account-level operational help.',
    articles: [
      {
        id: 'troubleshoot-execution',
        title: 'Troubleshoot Trade Execution',
        summary: 'Diagnose common causes of missed, delayed, or failed orders.',
        content: [
          'Check bot event history for rejected signals or guardrail-triggered blocks.',
          'Confirm API credentials and provider status before changing strategy parameters.',
          'If failures repeat, lower complexity and validate with one market and tighter controls.',
        ],
      },
      {
        id: 'billing-and-subscriptions',
        title: 'Billing and Subscriptions',
        summary: 'Understand plan limits, invoice exports, and renewal timing.',
        content: [
          'Use the profile menu to view billing settings and update subscription preferences.',
          'Track usage against your plan to avoid interruption during high-volume periods.',
          'Export invoices regularly if your finance workflow requires monthly reconciliation.',
        ],
      },
      {
        id: 'contact-support',
        title: 'Contact Support',
        summary: 'What to include so support can resolve issues quickly.',
        content: [
          'Include bot name, timestamp, and a short timeline of what happened.',
          'Attach relevant report exports or event snippets that show the failure clearly.',
          'For urgent issues, pause affected bots first, then share details with support.',
        ],
      },
    ],
  },
];

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

function CategoryCard({ category, onPress }: { category: DocCategory; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{category.title}</Text>
      <Text style={styles.cardDescription}>{category.description}</Text>
      <Text style={styles.linkText}>View Articles</Text>
    </TouchableOpacity>
  );
}

function ArticleCard({ article, onPress }: { article: DocArticle; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{article.title}</Text>
      <Text style={styles.cardDescription}>{article.summary}</Text>
      <Text style={styles.linkText}>Read Article</Text>
    </TouchableOpacity>
  );
}

function BackButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.backButton} onPress={onPress}>
      <Text style={styles.backButtonText}>← {label}</Text>
    </TouchableOpacity>
  );
}

function ArticleView({ category, article, onBack }: { category: DocCategory; article: DocArticle; onBack: () => void }) {
  return (
    <View>
      <BackButton label={category.title} onPress={onBack} />
      <Text style={styles.articleTitle}>{article.title}</Text>
      <Text style={styles.articleSummary}>{article.summary}</Text>
      {article.content.map((paragraph) => (
        <Text key={paragraph} style={styles.articleParagraph}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

function CategoryView({
  category,
  onBack,
  onOpenArticle,
}: {
  category: DocCategory;
  onBack: () => void;
  onOpenArticle: (articleId: string) => void;
}) {
  return (
    <View>
      <BackButton label="Docs Overview" onPress={onBack} />
      <Header title={category.title} subtitle={category.description} />
      <View style={styles.stack}>
        {category.articles.map((article) => (
          <ArticleCard key={article.id} article={article} onPress={() => onOpenArticle(article.id)} />
        ))}
      </View>
    </View>
  );
}

function OverviewView({ onOpenCategory }: { onOpenCategory: (categoryId: DocsCategoryId) => void }) {
  return (
    <View>
      <Header
        title="Docs"
        subtitle="Browse setup guides, optimization playbooks, and support references."
      />
      <View style={styles.stack}>
        {DOCS_CATEGORIES.map((category) => (
          <CategoryCard key={category.id} category={category} onPress={() => onOpenCategory(category.id)} />
        ))}
      </View>
    </View>
  );
}

export function DocsScreen() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<DocsCategoryId | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => DOCS_CATEGORIES.find((category) => category.id === selectedCategoryId) ?? null,
    [selectedCategoryId]
  );

  const selectedArticle = useMemo(
    () => selectedCategory?.articles.find((article) => article.id === selectedArticleId) ?? null,
    [selectedArticleId, selectedCategory]
  );

  const resetToOverview = () => {
    setSelectedArticleId(null);
    setSelectedCategoryId(null);
  };

  const openCategory = (categoryId: DocsCategoryId) => {
    setSelectedArticleId(null);
    setSelectedCategoryId(categoryId);
  };

  const openArticle = (articleId: string) => {
    setSelectedArticleId(articleId);
  };

  const closeArticle = () => {
    setSelectedArticleId(null);
  };

  return (
    <OceanBackground>
      <ScrollView contentContainerStyle={styles.content}>
        {!selectedCategory && <OverviewView onOpenCategory={openCategory} />}
        {selectedCategory && !selectedArticle && (
          <CategoryView category={selectedCategory} onBack={resetToOverview} onOpenArticle={openArticle} />
        )}
        {selectedCategory && selectedArticle && (
          <ArticleView category={selectedCategory} article={selectedArticle} onBack={closeArticle} />
        )}
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
  stack: {
    marginTop: 14,
    gap: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: lightTheme.colors.cardBorder,
    backgroundColor: lightTheme.colors.surface,
    padding: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: lightTheme.colors.wave[900],
  },
  cardDescription: {
    marginTop: 6,
    fontSize: 13,
    color: lightTheme.colors.wave[600],
    lineHeight: 19,
  },
  linkText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: lightTheme.colors.primary[700],
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: lightTheme.colors.wave[300],
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: lightTheme.colors.wave[700],
  },
  articleTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: lightTheme.colors.wave[900],
    fontFamily: lightTheme.typography.families.display,
  },
  articleSummary: {
    marginTop: 8,
    fontSize: 14,
    color: lightTheme.colors.wave[600],
    lineHeight: 20,
  },
  articleParagraph: {
    marginTop: 12,
    fontSize: 15,
    color: lightTheme.colors.wave[800],
    lineHeight: 22,
  },
});
