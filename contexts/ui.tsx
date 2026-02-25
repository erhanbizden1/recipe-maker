import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import type { PaywallBottomSheetRef } from '@/components/paywall-bottom-sheet';

const RATING_DONE_KEY = 'rating_done';
const RATING_SNOOZED_KEY = 'rating_snoozed';
const RATING_LEGACY_KEY = 'rating_prompted';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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
  ratingVisible: boolean;
  showRatingPrompt: () => Promise<void>;
  dismissRatingPrompt: (accepted: boolean) => void;
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
  ratingVisible: false,
  showRatingPrompt: async () => {},
  dismissRatingPrompt: () => {},
});

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isPremiumLoaded, setIsPremiumLoaded] = useState(false);
  const paywallRef = useRef<PaywallBottomSheetRef>(null);
  const [ratingVisible, setRatingVisible] = useState(false);

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

  const showRatingPrompt = useCallback(async () => {
    // Permanently done (rated or migrated from old key)
    const done = await AsyncStorage.getItem(RATING_DONE_KEY);
    if (done) return;
    const legacy = await AsyncStorage.getItem(RATING_LEGACY_KEY);
    if (legacy) {
      await AsyncStorage.setItem(RATING_DONE_KEY, 'true');
      return;
    }
    // Snoozed — check if 7 days have passed
    const snoozed = await AsyncStorage.getItem(RATING_SNOOZED_KEY);
    if (snoozed) {
      if (Date.now() - new Date(snoozed).getTime() < SEVEN_DAYS_MS) return;
    }
    setRatingVisible(true);
  }, []);

  const dismissRatingPrompt = useCallback((accepted: boolean) => {
    setRatingVisible(false);
    if (accepted) {
      AsyncStorage.setItem(RATING_DONE_KEY, 'true');
    } else {
      AsyncStorage.setItem(RATING_SNOOZED_KEY, new Date().toISOString());
    }
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
        ratingVisible,
        showRatingPrompt,
        dismissRatingPrompt,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
