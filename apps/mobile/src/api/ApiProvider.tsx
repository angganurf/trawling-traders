import React from 'react';
import { useCedrosLogin } from '@cedros/login-react-native';
import { configureApi, setAuthProvider } from '@trawling-traders/api-client';
import { API_URL } from '../config/api';

interface ApiProviderProps {
  children: React.ReactNode;
}

export function ApiProvider({ children }: ApiProviderProps) {
  const { getAccessToken, logout } = useCedrosLogin();

  React.useEffect(() => {
    configureApi({
      baseUrl: API_URL,
      dataApiUrl: API_URL.replace(':3000', ':8080'),
      timeoutMs: 30000,
      maxRetries: 3,
    });

    setAuthProvider({
      getToken: async () => getAccessToken(),
      clearAuth: async () => {
        logout();
      },
    });
  }, [getAccessToken, logout]);

  return <>{children}</>;
}
