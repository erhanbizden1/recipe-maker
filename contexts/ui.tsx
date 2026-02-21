import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import type { PaywallBottomSheetRef } from '@/components/paywall-bottom-sheet';

const PREMIUM_KEYS = ['premium', 'pro', 'unlimited', 'full_access'];

interface UIContextType {
  paywallOpen: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  paywallRef: React.RefObject<PaywallBottomSheetRef | null>;
  isPremium: boolean;
  isPremiumLoaded: boolean;
  setPremium: (val: boolean) => void;
  refreshPremium: () => Promise<void>;
}

const UIContext = createContext<UIContextType>({
  paywallOpen: false,
  openPaywall: () => {},
  closePaywall: () => {},
  paywallRef: { current: null },
  isPremium: false,
  isPremiumLoaded: false,
  setPremium: () => {},
  refreshPremium: async () => {},
});

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isPremiumLoaded, setIsPremiumLoaded] = useState(false);
  const paywallRef = useRef<PaywallBottomSheetRef>(null);

  const openPaywall = useCallback(() => {
    paywallRef.current?.snapToIndex(0);
    setPaywallOpen(true);
  }, []);

  const closePaywall = useCallback(() => {
    setPaywallOpen(false);
  }, []);

  const setPremium = useCallback((val: boolean) => {
    setIsPremium(val);
  }, []);

  const refreshPremium = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      setIsPremiumLoaded(true);
      return;
    }
    try {
      const info = await Purchases.getCustomerInfo();
      const hasPremium =
        PREMIUM_KEYS.some((k) => info.entitlements.active[k]) ||
        Object.keys(info.entitlements.active).length > 0;
      setIsPremium(hasPremium);
    } catch {
      // Expo Go / simulator — treat as not premium
    } finally {
      setIsPremiumLoaded(true);
    }
  }, []);

  return (
    <UIContext.Provider
      value={{
        paywallOpen,
        openPaywall,
        closePaywall,
        paywallRef,
        isPremium,
        isPremiumLoaded,
        setPremium,
        refreshPremium,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
