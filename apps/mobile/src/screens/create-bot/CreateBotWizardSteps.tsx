import React from 'react';
import { Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { AlgorithmMode, AssetFocus, LlmModel, LlmProvider, Persona, Strictness, TradingMode } from '@trawling-traders/types';
import { lightTheme } from '../../theme';
import { createBotWizardStyles as styles } from './CreateBotWizard.styles';

export type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;

type Option<T extends string> = { value: T; label: string; description?: string; recommended?: boolean };

type CreateBotWizardStepsProps = {
  step: WizardStep;
  persona: Persona;
  setPersona: (value: Persona) => void;
  name: string;
  setName: (value: string) => void;
  assetFocus: AssetFocus;
  setAssetFocus: (value: AssetFocus) => void;
  algorithmMode: AlgorithmMode;
  setAlgorithmMode: (value: AlgorithmMode) => void;
  strictness: Strictness;
  setStrictness: (value: Strictness) => void;
  tradingMode: TradingMode;
  setTradingMode: (value: TradingMode) => void;
  maxPositionSize: string;
  setMaxPositionSize: (value: string) => void;
  maxTradesPerDay: string;
  setMaxTradesPerDay: (value: string) => void;
  maxDailyLoss: string;
  setMaxDailyLoss: (value: string) => void;
  maxDrawdown: string;
  setMaxDrawdown: (value: string) => void;
  llmProvider: LlmProvider;
  setLlmProvider: (value: LlmProvider) => void;
  llmModel: LlmModel;
  setLlmModel: (value: LlmModel) => void;
  llmApiKey: string;
  setLlmApiKey: (value: string) => void;
  telegramEnabled: boolean;
  setTelegramEnabled: (value: boolean) => void;
  telegramBotToken: string;
  setTelegramBotToken: (value: string) => void;
  telegramUserId: string;
  setTelegramUserId: (value: string) => void;
  telegramPairingCode: string;
  setTelegramPairingCode: (value: string) => void;
  modelsForProvider: { value: LlmModel; label: string }[];
  llmModels: Record<LlmProvider, { value: LlmModel; label: string }[]>;
  personas: Option<Persona>[];
  assetChoices: Option<AssetFocus>[];
  algorithms: Option<AlgorithmMode>[];
  strictnessOptions: Option<Strictness>[];
};

function renderChip<T extends string>(
  options: Option<T>[],
  selected: T,
  onSelect: (value: T) => void
) {
  return (
    <View style={styles.chipRow}>
      {options.map((item) => (
        <TouchableOpacity
          key={item.value}
          style={[styles.chip, selected === item.value && styles.chipActive]}
          onPress={() => onSelect(item.value)}
        >
          <Text style={[styles.chipText, selected === item.value && styles.chipTextActive]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function CreateBotWizardSteps(props: CreateBotWizardStepsProps) {
  const {
    step,
    personas,
    persona,
    setPersona,
    name,
    setName,
    assetChoices,
    assetFocus,
    setAssetFocus,
    algorithms,
    algorithmMode,
    setAlgorithmMode,
    strictnessOptions,
    strictness,
    setStrictness,
    tradingMode,
    setTradingMode,
    maxPositionSize,
    setMaxPositionSize,
    maxTradesPerDay,
    setMaxTradesPerDay,
    maxDailyLoss,
    setMaxDailyLoss,
    maxDrawdown,
    setMaxDrawdown,
    llmProvider,
    setLlmProvider,
    llmModel,
    setLlmModel,
    llmApiKey,
    setLlmApiKey,
    modelsForProvider,
    llmModels,
    telegramEnabled,
    setTelegramEnabled,
    telegramBotToken,
    setTelegramBotToken,
    telegramUserId,
    setTelegramUserId,
    telegramPairingCode,
    setTelegramPairingCode,
  } = props;

  if (step === 0) {
    return (
      <View>
        <Text style={styles.sectionLabel}>Bot Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Equity Trawler #1"
          placeholderTextColor={lightTheme.colors.wave[400]}
        />
        <Text style={styles.sectionLabel}>Persona</Text>
        {personas.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.optionCard, persona === item.value && styles.optionCardActive]}
            onPress={() => setPersona(item.value)}
          >
            <Text style={styles.optionTitle}>{item.label}</Text>
            <Text style={styles.optionDescription}>{item.description}</Text>
            {item.recommended ? (
              <View style={styles.recommendedTag}>
                <Text style={styles.recommendedTagText}>Recommended Start</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  if (step === 1) {
    return (
      <View>
        <Text style={styles.sectionLabel}>Asset Focus</Text>
        {renderChip(assetChoices, assetFocus, setAssetFocus)}

        <Text style={styles.sectionLabel}>Algorithm</Text>
        {algorithms.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.optionCard, algorithmMode === item.value && styles.optionCardActive]}
            onPress={() => setAlgorithmMode(item.value)}
          >
            <Text style={styles.optionTitle}>{item.label}</Text>
            <Text style={styles.optionDescription}>{item.description}</Text>
            {item.recommended ? (
              <View style={styles.recommendedTag}>
                <Text style={styles.recommendedTagText}>Recommended Start</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionLabel}>Strictness</Text>
        {renderChip(strictnessOptions, strictness, setStrictness)}
        <Text style={styles.sectionLabel}>Trading Mode</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>{tradingMode === 'paper' ? 'Paper Trading' : 'Live Trading'}</Text>
            <Text style={styles.switchSubtitle}>
              {tradingMode === 'paper' ? 'Recommended until strategy is stable.' : 'Real funds are at risk.'}
            </Text>
          </View>
          <Switch
            value={tradingMode === 'live'}
            onValueChange={(live) => setTradingMode(live ? 'live' : 'paper')}
            trackColor={{ false: lightTheme.colors.wave[300], true: lightTheme.colors.lobster[400] }}
          />
        </View>
      </View>
    );
  }

  if (step === 2) {
    return (
      <View>
        <Text style={styles.sectionLabel}>Risk Caps</Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <TextInput style={styles.input} value={maxPositionSize} onChangeText={setMaxPositionSize} keyboardType="numeric" placeholder="Max Position %" />
            <Text style={styles.helperText}>Default: 5%</Text>
          </View>
          <View style={styles.half}>
            <TextInput style={styles.input} value={maxTradesPerDay} onChangeText={setMaxTradesPerDay} keyboardType="numeric" placeholder="Max Trades/Day" />
            <Text style={styles.helperText}>Default: 5</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}>
            <TextInput style={styles.input} value={maxDailyLoss} onChangeText={setMaxDailyLoss} keyboardType="numeric" placeholder="Daily Loss USD" />
            <Text style={styles.helperText}>Default: $50</Text>
          </View>
          <View style={styles.half}>
            <TextInput style={styles.input} value={maxDrawdown} onChangeText={setMaxDrawdown} keyboardType="numeric" placeholder="Max Drawdown %" />
            <Text style={styles.helperText}>Default: 10%</Text>
          </View>
        </View>
      </View>
    );
  }

  if (step === 3) {
    return (
      <View>
        <Text style={styles.sectionLabel}>LLM Provider</Text>
        {renderChip(
          (['openai', 'anthropic', 'venice', 'openrouter'] as LlmProvider[]).map((value) => ({ value, label: value })),
          llmProvider,
          (provider) => {
            setLlmProvider(provider);
            setLlmModel(llmModels[provider][0].value);
          }
        )}

        <Text style={styles.sectionLabel}>Model</Text>
        {renderChip(modelsForProvider, llmModel, setLlmModel)}

        <Text style={styles.sectionLabel}>API Key</Text>
        <TextInput
          style={styles.input}
          value={llmApiKey}
          onChangeText={setLlmApiKey}
          placeholder="sk-..."
          placeholderTextColor={lightTheme.colors.wave[400]}
          secureTextEntry
        />
        <Text style={styles.helperText}>Stored securely and only used for this bot.</Text>
      </View>
    );
  }

  if (step === 4) {
    return (
      <View>
        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>Setup Guide</Text>
          <Text style={styles.instructionStep}>1. In Telegram, open <Text style={styles.inlineCode}>@BotFather</Text> and run <Text style={styles.inlineCode}>/newbot</Text>.</Text>
          <Text style={styles.instructionStep}>2. Copy the bot token BotFather returns and paste it below.</Text>
          <Text style={styles.instructionStep}>3. Send your bot a first message (for example: <Text style={styles.inlineCode}>/start</Text>).</Text>
          <Text style={styles.instructionStep}>4. The bot will reply with your Telegram user ID and a pairing code.</Text>
          <Text style={styles.instructionStep}>5. Reply with that pairing code in bot chat after deployment to finish linking.</Text>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>Enable Telegram</Text>
            <Text style={styles.switchSubtitle}>Turn this on only if you want Telegram commands/alerts.</Text>
          </View>
          <Switch
            value={telegramEnabled}
            onValueChange={setTelegramEnabled}
            trackColor={{ false: lightTheme.colors.wave[300], true: lightTheme.colors.primary[400] }}
          />
        </View>

        {telegramEnabled && (
          <>
            <Text style={styles.sectionLabel}>Telegram Bot Token</Text>
            <TextInput
              style={styles.input}
              value={telegramBotToken}
              onChangeText={setTelegramBotToken}
              placeholder="123456789:ABCdefGHI..."
              placeholderTextColor={lightTheme.colors.wave[400]}
              secureTextEntry
            />
            <Text style={styles.helperText}>Keep this private. We encrypt it at rest and only use it for your bot session.</Text>

            <Text style={styles.sectionLabel}>Telegram User ID</Text>
            <TextInput
              style={styles.input}
              value={telegramUserId}
              onChangeText={setTelegramUserId}
              placeholder="e.g. 123456789"
              placeholderTextColor={lightTheme.colors.wave[400]}
              keyboardType="number-pad"
            />

            <Text style={styles.sectionLabel}>Pairing Code</Text>
            <TextInput
              style={styles.input}
              value={telegramPairingCode}
              onChangeText={setTelegramPairingCode}
              placeholder="e.g. TRAWL-4821"
              placeholderTextColor={lightTheme.colors.wave[400]}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Text style={styles.helperText}>We currently keep these values in setup flow for guided pairing.</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Bot</Text>
        <Text style={styles.summaryValue}>{name || 'Unnamed'}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Persona / Strategy</Text>
        <Text style={styles.summaryValue}>
          {persona} • {algorithmMode} • {strictness}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Market / Mode</Text>
        <Text style={styles.summaryValue}>
          {assetFocus} • {tradingMode}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Risk Caps</Text>
        <Text style={styles.summaryValue}>
          {maxPositionSize}% pos • ${maxDailyLoss} daily • {maxDrawdown}% drawdown • {maxTradesPerDay}/day
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>AI</Text>
        <Text style={styles.summaryValue}>
          {llmProvider} • {llmModel}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Telegram</Text>
        <Text style={styles.summaryValue}>
          {telegramEnabled ? `Enabled • ID ${telegramUserId || 'pending'} • Code ${telegramPairingCode || 'pending'}` : 'Disabled'}
        </Text>
      </View>
    </View>
  );
}
