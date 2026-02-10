import React, { createContext, useContext, type ReactNode } from 'react';

interface PaymentsContextValue {
  isPaymentsEnabled: boolean;
  paymentConfigError: string | null;
}

const PaymentsContext = createContext<PaymentsContextValue>({
  isPaymentsEnabled: false,
  paymentConfigError: null,
});

export function PaymentsProvider({
  value,
  children,
}: {
  value: PaymentsContextValue;
  children: ReactNode;
}) {
  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
}

export function usePayments(): PaymentsContextValue {
  return useContext(PaymentsContext);
}
