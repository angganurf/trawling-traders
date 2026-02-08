import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { CedrosLoginProvider } from '@cedros/login-react-native';
import { CedrosProvider } from '@cedros/pay-react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { CEDROS_CONFIG, fetchCedrosPayConfig, type CedrosPayConfig } from './src/config/api';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { NetworkProvider } from './src/context/NetworkContext';
import { ApiProvider } from './src/api';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    BNRumble: require('./assets/fonts/BNRumble.otf'),
  });
  const [payConfig, setPayConfig] = useState<CedrosPayConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const loadPayConfig = React.useCallback(() => {
    let cancelled = false;
    setConfigError(null);
    fetchCedrosPayConfig()
      .then((config) => {
        if (!cancelled) setPayConfig(config);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        if (!cancelled) setConfigError(message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return loadPayConfig();
  }, [loadPayConfig]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const content = (
    <ApiProvider>
      <SafeAreaProvider>
        <NetworkProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </NetworkProvider>
      </SafeAreaProvider>
    </ApiProvider>
  );

  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <CedrosLoginProvider config={CEDROS_CONFIG}>
        {payConfig ? (
          <CedrosProvider config={payConfig}>{content}</CedrosProvider>
        ) : (
          <SafeAreaProvider>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <ActivityIndicator size="large" />
              {configError ? (
                <>
                  <Text style={{ marginTop: 16, textAlign: 'center' }}>
                    Failed to load payment configuration.
                  </Text>
                  <Text style={{ marginTop: 8, textAlign: 'center', opacity: 0.7 }}>{configError}</Text>
                  <TouchableOpacity
                    style={{ marginTop: 16, backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
                    onPress={loadPayConfig}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={{ marginTop: 16, textAlign: 'center' }}>Loading payment configuration…</Text>
              )}
            </View>
          </SafeAreaProvider>
        )}
      </CedrosLoginProvider>
      </View>
    </ErrorBoundary>
  );
}
