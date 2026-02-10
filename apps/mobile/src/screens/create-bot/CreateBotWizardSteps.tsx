import React, { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import type {
  AlgorithmFactor,
  AlgorithmMode,
  AIAssistantOption,
  AssetFocus,
  LlmModel,
  LlmProvider,
  NameAvailability,
  Persona,
  Strictness,
  TradeableAsset,
  TradingMode,
} from '@trawling-traders/types';
import { useSettingsStore } from '../../store';
import { lightTheme } from '../../theme';
import { createBotWizardStyles as styles } from './CreateBotWizard.styles';

export type WizardStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type StrategyType = 'macro' | 'event-driven' | 'smart-money' | 'range';

type Option<T extends string> = {
  value: T;
  label: string;
  description?: string;
  recommended?: boolean;
};

type CreateBotWizardStepsProps = {
  step: WizardStep;
  name: string;
  setName: (value: string) => void;
  nameAvailability: NameAvailability | null;
  nameCheckLoading: boolean;
  assistantStyle: Persona;
  setAssistantStyle: (value: Persona) => void;
  assistantOptions: AIAssistantOption[];
  assistantOptionsLoading: boolean;
  assetFocus: AssetFocus;
  setAssetFocus: (value: AssetFocus) => void;
  tradeableAssets: TradeableAsset[];
  selectedAssets: string[];
  setSelectedAssets: (value: string[]) => void;
  assetsLoading: boolean;
  strategyOptions: Option<StrategyType>[];
  strategyType: StrategyType;
  setStrategyType: (value: StrategyType) => void;
  algorithmMode: AlgorithmMode;
  strictness: Strictness;
  setStrictness: (value: Strictness) => void;
  factorCatalog: Option<string>[];
  algorithmFactors: AlgorithmFactor[];
  setAlgorithmFactors: (value: AlgorithmFactor[]) => void;
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
  assetChoices: Option<AssetFocus>[];
  strictnessOptions: Option<Strictness>[];
};

const SUBSCRIPT_DIGITS: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
};

function toSubscript(value: number): string {
  return String(value)
    .split('')
    .map((char) => SUBSCRIPT_DIGITS[char] || char)
    .join('');
}

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
          <Text style={[styles.chipText, selected === item.value && styles.chipTextActive]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const CAPTAIN_IMAGES = {
  trader: require('../../../../../assets/branding/tt-trader-captain.png'),
  sea: require('../../../../../assets/branding/tt-sea-captain.png'),
  rocky: require('../../../../../assets/branding/tt-rocky-captain.png'),
} as const;

function imageForCaptainKey(imageKey: string) {
  return CAPTAIN_IMAGES[imageKey as keyof typeof CAPTAIN_IMAGES] ?? CAPTAIN_IMAGES.trader;
}

export function CreateBotWizardSteps(props: CreateBotWizardStepsProps) {
  const {
    step,
    name,
    setName,
    nameAvailability,
    nameCheckLoading,
    assistantStyle,
    setAssistantStyle,
    assistantOptions,
    assistantOptionsLoading,
    assetChoices,
    assetFocus,
    setAssetFocus,
    tradeableAssets,
    selectedAssets,
    setSelectedAssets,
    assetsLoading,
    strategyOptions,
    strategyType,
    setStrategyType,
    algorithmMode,
    strictnessOptions,
    strictness,
    setStrictness,
    factorCatalog,
    algorithmFactors,
    setAlgorithmFactors,
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
  const disabledCustodians = useSettingsStore((s) => s.disabledCustodians);
  const [activeDropdownRow, setActiveDropdownRow] = useState<number | null>(null);
  const [captainCardWidth, setCaptainCardWidth] = useState(280);

  const usedFactorSet = useMemo(
    () => new Set(algorithmFactors.map((factor) => factor.factor)),
    [algorithmFactors]
  );

  if (step === 0) {
    return (
      <View>
        <Text style={styles.sectionLabel}>Boat Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. bright-atlantic-trawler"
          placeholderTextColor={lightTheme.colors.wave[400]}
        />
        {nameCheckLoading ? (
          <Text style={styles.helperText}>Checking availability...</Text>
        ) : nameAvailability ? (
          nameAvailability.available ? (
            <Text style={styles.availableText}>Name available</Text>
          ) : (
            <View style={styles.nameUnavailableRow}>
              <Text style={styles.inlineError}>Name already used.</Text>
              {nameAvailability.suggestedName ? (
                <TouchableOpacity onPress={() => setName(nameAvailability.suggestedName || name)}>
                  <Text style={styles.useSuggestionText}>
                    Use "{nameAvailability.suggestedName}"
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )
        ) : null}
        <Text style={styles.sectionLabel}>Trading Mode</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>
              {tradingMode === 'paper' ? 'Paper Trading (Test Only)' : 'Live Trading'}
            </Text>
            <Text style={styles.switchSubtitle}>
              {tradingMode === 'paper'
                ? 'Recommended to start. Use this mode to validate behavior with no real funds at risk.'
                : 'Live mode uses real funds. Keep paper mode on until you trust your setup.'}
            </Text>
          </View>
          <Switch
            value={tradingMode === 'live'}
            onValueChange={(live) => setTradingMode(live ? 'live' : 'paper')}
            trackColor={{
              false: lightTheme.colors.wave[300],
              true: lightTheme.colors.lobster[400],
            }}
          />
        </View>
      </View>
    );
  }

  if (step === 1) {
    if (assistantOptionsLoading) {
      return (
        <View>
          <Text style={styles.helperText}>Loading captains...</Text>
        </View>
      );
    }

    if (assistantOptions.length === 0) {
      return (
        <View>
          <Text style={styles.helperText}>
            Captain options are temporarily unavailable. You can continue with the default captain.
          </Text>
        </View>
      );
    }

    const handleCaptainSwipeEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (captainCardWidth <= 0) {
        return;
      }
      const index = Math.round(event.nativeEvent.contentOffset.x / captainCardWidth);
      const selectedOption = assistantOptions[Math.max(0, Math.min(index, assistantOptions.length - 1))];
      if (selectedOption) {
        setAssistantStyle(selectedOption.assistantStyle);
      }
    };

    return (
      <View>
        <Text style={styles.helperText}>Swipe to browse captains, then tap to confirm your choice.</Text>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleCaptainSwipeEnd}
          snapToInterval={captainCardWidth}
          decelerationRate="fast"
          contentContainerStyle={styles.captainCarousel}
        >
          {assistantOptions.map((option) => {
            const selected = option.assistantStyle === assistantStyle;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.captainCard, selected ? styles.captainCardActive : undefined]}
                onPress={() => setAssistantStyle(option.assistantStyle)}
                onLayout={(event) => {
                  const width = Math.floor(event.nativeEvent.layout.width);
                  if (width > 0 && width !== captainCardWidth) {
                    setCaptainCardWidth(width);
                  }
                }}
                activeOpacity={0.9}
              >
                <Image source={imageForCaptainKey(option.imageKey)} style={styles.captainImage} resizeMode="cover" />
                <Text style={styles.captainName}>{option.captainName}</Text>
                <Text style={styles.captainDescription}>{option.personalityDescription}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  if (step === 2) {
    const assetsForFocus = tradeableAssets.filter(
      (asset) => asset.assetFocus === assetFocus && !disabledCustodians.includes(asset.custodian)
    );
    const toggleAsset = (tokenAddress: string) => {
      if (selectedAssets.includes(tokenAddress)) {
        setSelectedAssets(selectedAssets.filter((token) => token !== tokenAddress));
        return;
      }
      setSelectedAssets([...selectedAssets, tokenAddress]);
    };

    return (
      <View>
        <Text style={styles.sectionLabel}>Categories</Text>
        {renderChip(assetChoices, assetFocus, setAssetFocus)}
        <Text style={styles.sectionLabel}>Target Assets</Text>
        {assetsLoading ? (
          <Text style={styles.helperText}>Loading curated assets...</Text>
        ) : assetsForFocus.length === 0 ? (
          <Text style={styles.helperText}>No assets available for this category yet.</Text>
        ) : (
          <>
            <Text style={styles.helperText}>
              Select the exact assets this boat can trade. It will only trade from this list.
            </Text>
            {assetsForFocus.map((asset) => {
              const selected = selectedAssets.includes(asset.tokenAddress);
              return (
                <TouchableOpacity
                  key={asset.tokenAddress}
                  style={[
                    styles.assetCard,
                    selected ? styles.assetCardActive : undefined,
                  ]}
                  onPress={() => toggleAsset(asset.tokenAddress)}
                >
                  <View style={styles.assetCardHeader}>
                    <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                    <Text style={styles.assetCustodian}>{asset.custodian}</Text>
                  </View>
                  <Text style={styles.assetName}>{asset.name}</Text>
                  <Text style={styles.assetAddress}>{asset.tokenAddress}</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </View>
    );
  }

  if (step === 3) {
    return (
      <View>
        <Text style={styles.sectionLabel}>Strategy Type</Text>
        {renderChip(strategyOptions, strategyType, setStrategyType)}
        <Text style={styles.helperText}>
          This chooses the style of trading logic for your selected assets.
        </Text>
      </View>
    );
  }

  if (step === 4) {
    if (strategyType !== 'macro') {
      return (
        <View>
          <View style={styles.instructionBox}>
            <Text style={styles.instructionTitle}>Coming Soon</Text>
            <Text style={styles.instructionStep}>
              Algorithm customization for {strategyType} is coming soon.
            </Text>
            <Text style={styles.instructionStep}>
              We are shipping Macro end-to-end first, then enabling full controls for other strategies.
            </Text>
          </View>
        </View>
      );
    }

    const coefficientSum = algorithmFactors.reduce((sum, factor) => sum + factor.weight, 0);
    const canAddAnother = algorithmFactors.length < factorCatalog.length;

    const updateWeight = (factorKey: string, weightInput: string) => {
      const parsed = Number.parseFloat(weightInput);
      const safeWeight = Number.isFinite(parsed)
        ? Math.max(-1, Math.min(1, parsed))
        : 0;
      setAlgorithmFactors(
        algorithmFactors.map((item) =>
          item.factor === factorKey ? { ...item, weight: safeWeight } : item
        )
      );
    };

    const addAnotherFactor = () => {
      const nextFactor = factorCatalog.find((entry) => !usedFactorSet.has(entry.value));
      if (!nextFactor) {
        return;
      }
      setAlgorithmFactors([...algorithmFactors, { factor: nextFactor.value, weight: 0.2 }]);
    };

    const updateRowFactor = (rowIndex: number, factorKey: string) => {
      const existing = algorithmFactors.find((factor) => factor.factor === factorKey);
      if (existing && algorithmFactors[rowIndex]?.factor !== factorKey) {
        return;
      }
      setAlgorithmFactors(
        algorithmFactors.map((item, index) =>
          index === rowIndex ? { ...item, factor: factorKey } : item
        )
      );
      setActiveDropdownRow(null);
    };

    const removeFactor = (rowIndex: number) => {
      setAlgorithmFactors(algorithmFactors.filter((_, index) => index !== rowIndex));
      setActiveDropdownRow(null);
    };

    return (
      <View>
        <Text style={styles.sectionLabel}>Formula</Text>
        <Text style={styles.formulaPreview}>
          y ={' '}
          {algorithmFactors.length === 0
            ? '0'
            : algorithmFactors
                .map(
                  (item, index) =>
                    `${item.weight.toFixed(2)}x${toSubscript(index + 1)}`
                )
                .join(' + ')}
        </Text>
        {coefficientSum > 1 ? (
          <Text style={styles.coefficientWarning}>
            Coefficient sum is {coefficientSum.toFixed(2)} ({'>'} 1.00). Consider lowering weights.
          </Text>
        ) : (
          <Text style={styles.helperText}>
            Coefficient sum: {coefficientSum.toFixed(2)}
          </Text>
        )}

        <Text style={styles.sectionLabel}>Factors</Text>
        {algorithmFactors.map((factor, rowIndex) => {
          const currentFactorMeta = factorCatalog.find(
            (entry) => entry.value === factor.factor
          );
          return (
            <View key={`${factor.factor}-${rowIndex}`} style={styles.factorBlock}>
              <View style={styles.factorRow}>
                <TouchableOpacity
                  style={styles.factorSelectButton}
                  onPress={() =>
                    setActiveDropdownRow((prev) => (prev === rowIndex ? null : rowIndex))
                  }
                >
                  <Text style={styles.factorSelectText}>
                    {currentFactorMeta?.label || factor.factor}
                  </Text>
                  <Text style={styles.factorSelectChevron}>▼</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.factorWeightInput}
                  value={String(factor.weight)}
                  onChangeText={(value) => updateWeight(factor.factor, value)}
                  keyboardType="decimal-pad"
                  placeholder="0.20"
                />
                <TouchableOpacity
                  style={styles.factorRemoveButton}
                  onPress={() => removeFactor(rowIndex)}
                >
                  <Text style={styles.factorRemoveText}>Remove</Text>
                </TouchableOpacity>
              </View>

              {activeDropdownRow === rowIndex ? (
                <View style={styles.factorDropdownMenu}>
                  {factorCatalog.map((entry) => {
                    const disabled =
                      usedFactorSet.has(entry.value) && entry.value !== factor.factor;
                    return (
                      <TouchableOpacity
                        key={entry.value}
                        style={[
                          styles.factorDropdownItem,
                          disabled ? styles.factorDropdownItemDisabled : undefined,
                        ]}
                        disabled={disabled}
                        onPress={() => updateRowFactor(rowIndex, entry.value)}
                      >
                        <Text
                          style={[
                            styles.factorDropdownText,
                            disabled ? styles.factorDropdownTextDisabled : undefined,
                          ]}
                        >
                          {entry.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}

        <TouchableOpacity
          style={[
            styles.addFactorButton,
            !canAddAnother ? styles.addFactorButtonDisabled : undefined,
          ]}
          disabled={!canAddAnother}
          onPress={addAnotherFactor}
        >
          <Text style={styles.addFactorButtonText}>
            {canAddAnother ? 'Add Another Factor' : 'All Factors Added'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 5) {
    return (
      <View>
        <Text style={styles.sectionLabel}>Risk Caps</Text>
        <View style={styles.row}>
          <View style={styles.half}>
            <TextInput
              style={styles.input}
              value={maxPositionSize}
              onChangeText={setMaxPositionSize}
              keyboardType="numeric"
              placeholder="Max Position %"
            />
            <Text style={styles.helperText}>Default: 5%</Text>
          </View>
          <View style={styles.half}>
            <TextInput
              style={styles.input}
              value={maxTradesPerDay}
              onChangeText={setMaxTradesPerDay}
              keyboardType="numeric"
              placeholder="Max Trades/Day"
            />
            <Text style={styles.helperText}>Default: 5</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}>
            <TextInput
              style={styles.input}
              value={maxDailyLoss}
              onChangeText={setMaxDailyLoss}
              keyboardType="numeric"
              placeholder="Daily Loss USD"
            />
            <Text style={styles.helperText}>Default: $50</Text>
          </View>
          <View style={styles.half}>
            <TextInput
              style={styles.input}
              value={maxDrawdown}
              onChangeText={setMaxDrawdown}
              keyboardType="numeric"
              placeholder="Max Drawdown %"
            />
            <Text style={styles.helperText}>Default: 10%</Text>
          </View>
        </View>
        <Text style={styles.sectionLabel}>Strictness</Text>
        {renderChip(strictnessOptions, strictness, setStrictness)}
        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>How Strictness Works</Text>
          <Text style={styles.instructionStep}>
            Strictness works with your risk caps and other execution thresholds to control how much confirmation is required before a trade.
          </Text>
          <Text style={styles.instructionStep}>
            Example: a conservative setup can wait for signal stability over a longer look-back window (such as ~15 minutes) instead of trading the first second RSI flips.
          </Text>
          <Text style={styles.instructionStep}>
            Your parameters are always respected. Strictness changes confidence requirements and stability checks, not whether your bot ignores your settings.
          </Text>
        </View>
      </View>
    );
  }

  if (step === 6) {
    return (
      <View>
        <Text style={styles.sectionLabel}>LLM Provider</Text>
        {renderChip(
          (['openai', 'anthropic', 'venice', 'openrouter'] as LlmProvider[]).map(
            (value) => ({ value, label: value })
          ),
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
        <Text style={styles.helperText}>
          Stored securely and only used for this boat.
        </Text>
      </View>
    );
  }

  if (step === 7) {
    return (
      <View>
        <View style={styles.instructionBox}>
          <Text style={styles.instructionTitle}>Setup Guide</Text>
          <Text style={styles.instructionStep}>
            1. In Telegram, open <Text style={styles.inlineCode}>@BotFather</Text> and run{' '}
            <Text style={styles.inlineCode}>/newbot</Text>.
          </Text>
          <Text style={styles.instructionStep}>
            2. Copy the bot token BotFather returns and paste it below.
          </Text>
          <Text style={styles.instructionStep}>
            3. Send your bot a first message (for example:{' '}
            <Text style={styles.inlineCode}>/start</Text>).
          </Text>
          <Text style={styles.instructionStep}>
            4. The bot will reply with your Telegram user ID and a pairing code.
          </Text>
          <Text style={styles.instructionStep}>
            5. Reply with that pairing code in bot chat after deployment to finish linking.
          </Text>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>Enable Telegram</Text>
            <Text style={styles.switchSubtitle}>
              Turn this on only if you want Telegram commands/alerts.
            </Text>
          </View>
          <Switch
            value={telegramEnabled}
            onValueChange={setTelegramEnabled}
            trackColor={{
              false: lightTheme.colors.wave[300],
              true: lightTheme.colors.primary[400],
            }}
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
            <Text style={styles.helperText}>
              Keep this private. We encrypt it at rest and only use it for your bot session.
            </Text>

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
            <Text style={styles.helperText}>
              We currently keep these values in setup flow for guided pairing.
            </Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Boat</Text>
        <Text style={styles.summaryValue}>{name || 'Unnamed'}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Captain</Text>
        <Text style={styles.summaryValue}>
          {assistantOptions.find((option) => option.assistantStyle === assistantStyle)?.captainName ?? assistantStyle}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Persona / Strategy</Text>
        <Text style={styles.summaryValue}>
          {strategyType} • {strictness}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Market / Mode</Text>
        <Text style={styles.summaryValue}>
          {assetFocus} • {selectedAssets.length} assets • {tradingMode}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Risk Caps</Text>
        <Text style={styles.summaryValue}>
          {maxPositionSize}% pos • ${maxDailyLoss} daily • {maxDrawdown}% drawdown •{' '}
          {maxTradesPerDay}/day
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Algorithm Formula</Text>
        <Text style={styles.summaryValue}>
          {algorithmFactors.length === 0
            ? 'None'
            : algorithmFactors
                .map((item, index) => `${item.weight.toFixed(2)}x${toSubscript(index + 1)}`)
                .join(' + ')}
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
          {telegramEnabled
            ? `Enabled • ID ${telegramUserId || 'pending'} • Code ${telegramPairingCode || 'pending'}`
            : 'Disabled'}
        </Text>
      </View>
    </View>
  );
}
