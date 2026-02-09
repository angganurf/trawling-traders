declare module '@cedros/pay-react-native' {
  import * as React from 'react';

  export interface CedrosProviderProps {
    config: {
      stripePublicKey: string;
      serverUrl: string;
      solanaCluster: 'mainnet-beta';
    };
    children?: React.ReactNode;
  }

  export const CedrosProvider: React.ComponentType<CedrosProviderProps>;

  export interface SubscribeButtonProps {
    resource: string;
    interval: 'monthly' | 'yearly';
    label?: string;
    onSuccess?: (sessionId: string) => void;
    onError?: (error: string) => void;
    style?: any;
    textStyle?: any;
  }

  export const SubscribeButton: React.ComponentType<SubscribeButtonProps>;
}
