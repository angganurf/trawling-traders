// API Configuration for Trawling Traders Mobile App
import AsyncStorage from '@react-native-async-storage/async-storage';

// Development: Use localhost when running backend locally
// Production: Use api.trawlingtraders.com

const DEV_API_URL = 'http://localhost:3000';
const PROD_API_URL = 'https://api.trawlingtraders.com';

// EXPO_PUBLIC_API_URL overrides the default dev/prod selection.
// Usage: `make mobile-liveapi` or `EXPO_PUBLIC_API_URL=https://api.trawlingtraders.com npx expo start`
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;
const ENV_STRIPE_PUBLIC_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export const API_URL = ENV_API_URL || (__DEV__ ? DEV_API_URL : PROD_API_URL);

// Cedros Login configuration
// SDK appends /auth/* paths, so base must include /v1 to reach /v1/auth/*
export const CEDROS_CONFIG = {
  serverUrl: `${API_URL}/v1`,
  timeout: 30000,
  retries: 3,
};

const CEDROS_PAY_SERVER_URL = API_URL;
const CEDROS_PAY_CACHE_KEY = '@trawling-traders/cedros-pay-config/v1';

export interface CedrosPayConfig {
  stripePublicKey: string;
  serverUrl: string;
  solanaCluster: 'mainnet-beta';
}

function buildCedrosPayConfig(serverUrl: string, stripePublicKey: string): CedrosPayConfig {
  return {
    stripePublicKey,
    serverUrl,
    solanaCluster: 'mainnet-beta',
  };
}

function extractStripePublishableKey(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as Record<string, unknown>;

  const directCandidates = [
    obj.publishableKey,
    obj.publishable_key,
    obj.stripePublicKey,
    obj.stripe_public_key,
    obj.stripePublishableKey,
    obj.publicKey,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  const nestedCandidates = [obj.config, obj.stripe, obj.data];
  for (const nested of nestedCandidates) {
    const extracted = extractStripePublishableKey(nested);
    if (extracted) return extracted;
  }

  return null;
}

// Fallback config used when dynamic fetch fails (e.g. server unreachable)
export const CEDROS_PAY_FALLBACK_CONFIG: CedrosPayConfig = {
  stripePublicKey: '', // Stripe buttons will be disabled until config is fetched
  serverUrl: CEDROS_PAY_SERVER_URL,
  solanaCluster: 'mainnet-beta',
};

async function readCachedCedrosPayConfig(): Promise<CedrosPayConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(CEDROS_PAY_CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as Record<string, unknown>;
    const stripePublicKey =
      typeof obj.stripePublicKey === 'string' ? obj.stripePublicKey.trim() : '';
    const serverUrl = typeof obj.serverUrl === 'string' ? obj.serverUrl.trim() : '';
    if (!stripePublicKey || !serverUrl) return null;
    return buildCedrosPayConfig(serverUrl, stripePublicKey);
  } catch {
    return null;
  }
}

async function persistCedrosPayConfig(config: CedrosPayConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(CEDROS_PAY_CACHE_KEY, JSON.stringify(config));
  } catch {
    // Best-effort cache write only.
  }
}

export async function fetchCedrosPayConfig(): Promise<CedrosPayConfig> {
  // Primary endpoint from cedros-pay route layout.
  // Legacy endpoint is included as fallback for older deployments.
  // When running mobile in dev against localhost, also probe production for resilience.
  const shouldProbeProductionFallback =
    CEDROS_PAY_SERVER_URL.includes('localhost') || CEDROS_PAY_SERVER_URL.includes('127.0.0.1');
  const serverCandidates = Array.from(
    new Set(
      [CEDROS_PAY_SERVER_URL, shouldProbeProductionFallback ? PROD_API_URL : null]
        .filter((url): url is string => typeof url === 'string')
        .map((url) => url.trim())
        .filter((url) => url.length > 0)
    )
  );

  const endpoints = serverCandidates.flatMap((serverUrl) => [
    { serverUrl, endpoint: `${serverUrl}/paywall/v1/shop` },
    { serverUrl, endpoint: `${serverUrl}/v1/pay/paywall/v1/shop` },
  ]);

  let lastError: string | null = null;
  for (const { serverUrl, endpoint } of endpoints) {
    try {
      const response = await fetch(endpoint);
      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      const stripePublicKey = extractStripePublishableKey(payload);
      if (stripePublicKey) {
        const config = buildCedrosPayConfig(serverUrl, stripePublicKey);
        await persistCedrosPayConfig(config);
        return config;
      }
      if (!response.ok) {
        lastError = `HTTP ${response.status} at ${endpoint}`;
        continue;
      }
      lastError = `Missing stripe key in paywall payload at ${endpoint}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  if (typeof ENV_STRIPE_PUBLIC_KEY === 'string' && ENV_STRIPE_PUBLIC_KEY.trim().length > 0) {
    const config = buildCedrosPayConfig(CEDROS_PAY_SERVER_URL, ENV_STRIPE_PUBLIC_KEY.trim());
    await persistCedrosPayConfig(config);
    return config;
  }

  const cachedConfig = await readCachedCedrosPayConfig();
  if (cachedConfig) return cachedConfig;

  throw new Error(
    `Stripe publishable key unavailable from paywall config${lastError ? ` (${lastError})` : ''}`
  );
}
