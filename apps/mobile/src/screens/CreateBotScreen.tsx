import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type {
  NameAvailability,
  AlgorithmFactor,
  AlgorithmMode,
  AssetFocus,
  LlmModel,
  LlmProvider,
  Persona,
  Strictness,
  TradeableAsset,
  TradingMode,
} from '@trawling-traders/types';
import { api } from '@trawling-traders/api-client';
import { OceanBackground } from '../components/OceanBackground';
import { CreateBotWizardSteps } from './create-bot/CreateBotWizardSteps';
import { createBotWizardStyles as styles } from './create-bot/CreateBotWizard.styles';

type CreateBotScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateBot'>;
type WizardStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const STEP_META = [
  { title: 'Basics', description: 'Name your bot, choose your style, and decide if you want paper-only testing.' },
  { title: 'Strategy', description: 'Pick a market category, then select the exact assets this bot is allowed to trade.' },
  { title: 'Risk', description: 'Set caps and strictness for how cautiously signals are executed.' },
  { title: 'Algorithm', description: 'Build a weighted factor formula for this bot.' },
  { title: 'AI', description: 'Connect the LLM provider and model your bot will use.' },
  { title: 'Telegram', description: 'Optional chat channel for commands, alerts, and pairing.' },
  { title: 'Review', description: 'Double-check configuration and deploy.' },
] as const;

const FACTOR_CATALOG = [
  { key: 'price_momentum', label: 'Price Momentum' },
  { key: 'volume_confirmation', label: 'Volume Confirmation' },
  { key: 'volatility_regime', label: 'Volatility Regime' },
  { key: 'rsi_reversion', label: 'RSI Reversion' },
  { key: 'market_breadth', label: 'Market Breadth' },
  { key: 'news_sentiment', label: 'News Sentiment' },
] as const;

const NAME_ADJECTIVES = [
  'fast',
  'steady',
  'deep',
  'lucky',
  'silent',
  'rugged',
  'swift',
  'keen',
  'mighty',
  'bright',
  'bold',
  'northbound',
  'brisk',
  'stormproof',
  'tireless',
  'fearless',
  'nimble',
  'iron',
  'coastal',
  'offshore',
  'salty',
  'hardy',
  'tidal',
  'driven',
  'resolute',
  'calm',
  'fleet',
  'mariner',
  'farsight',
  'anchored',
  'legendary',
  'starlit',
];

const NAME_WATERS = [
  'atlantic',
  'pacific',
  'river',
  'harbor',
  'delta',
  'inlet',
  'bay',
  'sound',
  'estuary',
  'strait',
  'lagoon',
  'channel',
  'gulf',
  'ocean',
  'sea',
  'fjord',
  'reef',
  'shoal',
  'current',
  'tideway',
  'cove',
  'passage',
  'waterway',
  'basin',
  'bayou',
  'marsh',
  'headwater',
  'wake',
  'undertow',
  'breakwater',
  'narrows',
  'backwater',
];

const NAME_BOATS = [
  'trawler',
  'skiff',
  'schooner',
  'drifter',
  'paddleboat',
  'longliner',
  'cutter',
  'seiner',
  'clipper',
  'raft',
  'dinghy',
  'ferry',
  'catamaran',
  'yawl',
  'ketch',
  'tender',
  'launch',
  'whaler',
  'sloop',
  'brig',
  'barque',
  'canoe',
  'kayak',
  'rowboat',
  'towboat',
  'luggers',
  'dredger',
  'gunwale',
  'coaster',
  'workboat',
  'pilotboat',
  'lifeboat',
];

const PERSONAS: { value: Persona; label: string; description: string; recommended?: boolean }[] = [
  { value: 'beginner', label: 'Set & Forget', description: 'Balanced defaults for most traders.', recommended: true },
  { value: 'tweaker', label: 'Hands-on', description: 'More tuning and intervention options.' },
  { value: 'quant-lite', label: 'Power User', description: 'Advanced style with tighter control.' },
];

const ASSET_CHOICES: { value: AssetFocus; label: string; recommended?: boolean }[] = [
  { value: 'tokenized-equities', label: 'Stocks' },
  { value: 'tokenized-metals', label: 'Metals' },
  { value: 'majors', label: 'Crypto Majors' },
  { value: 'finance-2', label: 'Finance 2.0' },
  { value: 'memes', label: 'Meme Coins' },
];

const STRICTNESS_OPTIONS: { value: Strictness; label: string }[] = [
  { value: 'high', label: 'High (Recommended)' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const LLM_MODELS: Record<LlmProvider, { value: LlmModel; label: string }[]> = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet (Recommended)' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
  ],
  venice: [{ value: 'llama-3.1-405b', label: 'Llama 3.1 405B' }],
  openrouter: [{ value: 'auto', label: 'Auto (Best Available)' }],
};

function parseNumberField(value: string, label: string, min: number, max: number): { value: number; error?: string } {
  const trimmed = value.trim();
  const parsed = Number.parseInt(trimmed, 10);
  if (!trimmed) return { value: 0, error: `${label} is required.` };
  if (Number.isNaN(parsed)) return { value: 0, error: `${label} must be a number.` };
  if (parsed < min || parsed > max) return { value: parsed, error: `${label} must be ${min}-${max}.` };
  return { value: parsed };
}

export function CreateBotScreen() {
  const navigation = useNavigation<CreateBotScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<WizardStep>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [nameAvailability, setNameAvailability] = useState<NameAvailability | null>(null);
  const [nameCheckLoading, setNameCheckLoading] = useState(false);

  const [name, setName] = useState('');
  const [persona, setPersona] = useState<Persona>('beginner');
  const [assetFocus, setAssetFocus] = useState<AssetFocus>('tokenized-equities');
  const [algorithmMode] = useState<AlgorithmMode>('trend');
  const [algorithmFactors, setAlgorithmFactors] = useState<AlgorithmFactor[]>([
    { factor: 'price_momentum', weight: 0.4 },
    { factor: 'volume_confirmation', weight: 0.25 },
    { factor: 'volatility_regime', weight: 0.35 },
  ]);
  const [strictness, setStrictness] = useState<Strictness>('high');
  const [tradingMode, setTradingMode] = useState<TradingMode>('paper');
  const [tradeableAssets, setTradeableAssets] = useState<TradeableAsset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [maxPositionSize, setMaxPositionSize] = useState('5');
  const [maxDailyLoss, setMaxDailyLoss] = useState('50');
  const [maxDrawdown, setMaxDrawdown] = useState('10');
  const [maxTradesPerDay, setMaxTradesPerDay] = useState('5');
  const [llmProvider, setLlmProvider] = useState<LlmProvider>('openai');
  const [llmModel, setLlmModel] = useState<LlmModel>('gpt-4o');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramUserId, setTelegramUserId] = useState('');
  const [telegramPairingCode, setTelegramPairingCode] = useState('');

  const modelsForProvider = useMemo(() => LLM_MODELS[llmProvider], [llmProvider]);

  const generateFishingName = () => {
    const adjective = NAME_ADJECTIVES[Math.floor(Math.random() * NAME_ADJECTIVES.length)];
    const water = NAME_WATERS[Math.floor(Math.random() * NAME_WATERS.length)];
    const boat = NAME_BOATS[Math.floor(Math.random() * NAME_BOATS.length)];
    return `${adjective}-${water}-${boat}`;
  };

  useEffect(() => {
    let cancelled = false;
    if (name.trim().length > 0) {
      return;
    }
    const generateDefault = async () => {
      try {
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const candidate = generateFishingName();
          const response = await api.bot.checkNameAvailability(candidate);
          if (cancelled) return;

          if (response.available) {
            setName(response.normalizedName);
            setNameAvailability(response);
            return;
          }

          if (response.suggestedName) {
            setName(response.suggestedName);
            setNameAvailability(response);
            return;
          }
        }
        const fallback = generateFishingName();
        setName(fallback);
      } catch {
        if (!cancelled) {
          setName(generateFishingName());
        }
      }
    };
    generateDefault();
    return () => {
      cancelled = true;
    };
  }, [name]);

  useEffect(() => {
    let cancelled = false;
    const loadTradeableAssets = async () => {
      setAssetsLoading(true);
      try {
        const assets = await api.bot.listTradeableAssets();
        if (!cancelled) {
          setTradeableAssets(assets);
        }
      } catch {
        if (!cancelled) {
          setTradeableAssets([]);
        }
      } finally {
        if (!cancelled) {
          setAssetsLoading(false);
        }
      }
    };

    loadTradeableAssets();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const currentFocusAssets = new Set(
      tradeableAssets
        .filter((asset) => asset.assetFocus === assetFocus)
        .map((asset) => asset.tokenAddress)
    );
    setSelectedAssets((prev) => prev.filter((token) => currentFocusAssets.has(token)));
  }, [assetFocus, tradeableAssets]);

  useEffect(() => {
    let cancelled = false;
    if (name.trim().length === 0) {
      setNameAvailability(null);
      return;
    }
    setNameCheckLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await api.bot.checkNameAvailability(name.trim());
        if (!cancelled) {
          setNameAvailability(response);
        }
      } catch {
        if (!cancelled) {
          setNameAvailability(null);
        }
      } finally {
        if (!cancelled) {
          setNameCheckLoading(false);
        }
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [name]);

  const validateCurrentStep = () => {
    if (step === 0 && !name.trim()) {
      return 'Please give this bot a name.';
    }
    if (step === 1) {
      if (assetsLoading) return 'Loading assets for this category. Please wait a moment.';
      if (selectedAssets.length === 0) return 'Select at least one asset to trade.';
    }
    if (step === 2) {
      const checks = [
        parseNumberField(maxPositionSize, 'Max position %', 1, 50),
        parseNumberField(maxDailyLoss, 'Max daily loss', 1, 100000),
        parseNumberField(maxDrawdown, 'Max drawdown %', 1, 50),
        parseNumberField(maxTradesPerDay, 'Max trades/day', 1, 100),
      ];
      const failed = checks.find((check) => check.error);
      if (failed?.error) return failed.error;
    }
    if (step === 3 && algorithmFactors.length === 0) {
      return 'Add at least one algorithm factor.';
    }
    if (step === 4) {
      if (!llmApiKey.trim()) return 'Enter your LLM API key to continue.';
    }
    if (step === 5) {
      if (telegramEnabled && !telegramBotToken.trim()) return 'Enter a Telegram token or disable Telegram.';
      if (telegramEnabled && !telegramUserId.trim()) return 'Enter your Telegram user ID.';
      if (telegramEnabled && !telegramPairingCode.trim()) return 'Enter your Telegram pairing code.';
    }
    return null;
  };

  const onNext = () => {
    setInlineError(null);
    const error = validateCurrentStep();
    if (error) {
      setInlineError(error);
      return;
    }
    if (step < 6) {
      setStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const onBack = () => {
    setInlineError(null);
    if (step > 0) {
      setStep((prev) => (prev - 1) as WizardStep);
    } else {
      navigation.goBack();
    }
  };

  const deployBot = async () => {
    setInlineError(null);
    const error = validateCurrentStep();
    if (error) {
      setInlineError(error);
      return;
    }

    const position = parseNumberField(maxPositionSize, 'Max position %', 1, 50);
    const dailyLoss = parseNumberField(maxDailyLoss, 'Max daily loss', 1, 100000);
    const drawdown = parseNumberField(maxDrawdown, 'Max drawdown %', 1, 50);
    const trades = parseNumberField(maxTradesPerDay, 'Max trades/day', 1, 100);

    if (position.error || dailyLoss.error || drawdown.error || trades.error) {
      setInlineError(position.error || dailyLoss.error || drawdown.error || trades.error || null);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.bot.createBot({
        name: name.trim(),
        persona,
        assetFocus,
        customAssets: selectedAssets,
        algorithmMode,
        algorithmFactors,
        strictness,
        tradingMode,
        llmProvider,
        llmModel,
        llmApiKey: llmApiKey.trim(),
        telegramEnabled,
        telegramBotToken: telegramEnabled ? telegramBotToken.trim() : undefined,
        riskCaps: {
          maxPositionSizePercent: position.value,
          maxDailyLossUsd: dailyLoss.value,
          maxDrawdownPercent: drawdown.value,
          maxTradesPerDay: trades.value,
        },
      });
      setLlmApiKey('');
      setTelegramBotToken('');
      setTelegramUserId('');
      setTelegramPairingCode('');
      Alert.alert('Bot deployed', 'Your trawler is being provisioned now.');
      navigation.goBack();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to deploy bot.';
      setInlineError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OceanBackground>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Bot</Text>
          <Text style={styles.headerSubtitle}>Guided setup for a safer, clearer launch.</Text>
          <View style={styles.progressRow}>
            {STEP_META.map((_, index) => (
              <View key={index} style={[styles.progressDot, index <= step && styles.progressDotActive]} />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.stepLabel}>
            Step {step + 1} of {STEP_META.length}
          </Text>
          <Text style={styles.stepTitle}>{STEP_META[step].title}</Text>
          <Text style={styles.stepDescription}>{STEP_META[step].description}</Text>
          {inlineError ? <Text style={styles.inlineError}>{inlineError}</Text> : null}
          <CreateBotWizardSteps
            step={step}
            personas={PERSONAS}
            persona={persona}
            setPersona={setPersona}
            name={name}
            setName={setName}
            nameAvailability={nameAvailability}
            nameCheckLoading={nameCheckLoading}
            assetChoices={ASSET_CHOICES}
            assetFocus={assetFocus}
            setAssetFocus={setAssetFocus}
            tradeableAssets={tradeableAssets}
            selectedAssets={selectedAssets}
            setSelectedAssets={setSelectedAssets}
            assetsLoading={assetsLoading}
            algorithmMode={algorithmMode}
            strictnessOptions={STRICTNESS_OPTIONS}
            strictness={strictness}
            setStrictness={setStrictness}
            factorCatalog={FACTOR_CATALOG.map((item) => ({ value: item.key, label: item.label }))}
            algorithmFactors={algorithmFactors}
            setAlgorithmFactors={setAlgorithmFactors}
            tradingMode={tradingMode}
            setTradingMode={setTradingMode}
            maxPositionSize={maxPositionSize}
            setMaxPositionSize={setMaxPositionSize}
            maxTradesPerDay={maxTradesPerDay}
            setMaxTradesPerDay={setMaxTradesPerDay}
            maxDailyLoss={maxDailyLoss}
            setMaxDailyLoss={setMaxDailyLoss}
            maxDrawdown={maxDrawdown}
            setMaxDrawdown={setMaxDrawdown}
            llmProvider={llmProvider}
            setLlmProvider={setLlmProvider}
            llmModel={llmModel}
            setLlmModel={setLlmModel}
            llmApiKey={llmApiKey}
            setLlmApiKey={setLlmApiKey}
            modelsForProvider={modelsForProvider}
            llmModels={LLM_MODELS}
            telegramEnabled={telegramEnabled}
            setTelegramEnabled={setTelegramEnabled}
            telegramBotToken={telegramBotToken}
            setTelegramBotToken={setTelegramBotToken}
            telegramUserId={telegramUserId}
            setTelegramUserId={setTelegramUserId}
            telegramPairingCode={telegramPairingCode}
            setTelegramPairingCode={setTelegramPairingCode}
          />
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={isSubmitting}>
              <Text style={styles.backButtonText}>{step === 0 ? 'Cancel' : 'Back'}</Text>
            </TouchableOpacity>
            {step < 6 ? (
              <TouchableOpacity style={styles.nextButton} onPress={onNext} disabled={isSubmitting}>
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.nextButton, isSubmitting && styles.nextButtonDisabled]}
                onPress={deployBot}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.nextButtonText}>Deploy Bot</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </OceanBackground>
  );
}
