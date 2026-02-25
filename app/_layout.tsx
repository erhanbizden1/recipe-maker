import PaywallBottomSheet from "@/components/paywall-bottom-sheet";
import RatingPrompt from "@/components/rating-prompt";
import { LanguageProvider } from "@/contexts/language";
import { ThemeProvider, useTheme } from "@/contexts/theme";
import { UIProvider, useUI } from "@/contexts/ui";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Purchases from "react-native-purchases";
import "react-native-reanimated";

const RC_IOS_API_KEY = process.env.EXPO_PUBLIC_RC_IOS_API_KEY ?? "";

// Configure RevenueCat at module level so it's ready before any component mounts
if (Platform.OS === "ios" && RC_IOS_API_KEY) {
  try {
    Purchases.configure({ apiKey: RC_IOS_API_KEY });
  } catch (e) {
    console.warn("RevenueCat init skipped (Expo Go / simulator):", e);
  }
}

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

const ONBOARDING_KEY = "onboarding_complete";

function RootStack() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { paywallRef, closePaywall, refreshPremium, isPremium, isPremiumLoaded, openPaywall, ratingVisible, dismissRatingPrompt } = useUI();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const paywallAutoShown = useRef(false);

  // Fetch premium status on mount
  useEffect(() => {
    refreshPremium();
  }, [refreshPremium]);

  // Check onboarding completion
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingComplete(val === "true");
    });
  }, []);

  // Navigate to onboarding if not complete; hide splash
  useEffect(() => {
    if (onboardingComplete === null) return;
    SplashScreen.hideAsync();
    if (!onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [onboardingComplete]);

  // Auto-show paywall on every app open (if not premium & onboarding done)
  useEffect(() => {
    if (!isPremiumLoaded || onboardingComplete !== true || isPremium) return;
    if (paywallAutoShown.current) return;
    paywallAutoShown.current = true;
    const timer = setTimeout(() => openPaywall(), 1500);
    return () => clearTimeout(timer);
  }, [isPremiumLoaded, onboardingComplete, isPremium, openPaywall]);

  return (
    <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen
          name="camera"
          options={{ headerShown: false, presentation: "fullScreenModal" }}
        />
        <Stack.Screen
          name="ingredients"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="recipe-result"
          options={{ headerShown: false, presentation: "card" }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <PaywallBottomSheet ref={paywallRef} onClosed={closePaywall} />
      <RatingPrompt visible={ratingVisible} onDismiss={dismissRatingPrompt} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <LanguageProvider>
          <UIProvider>
            <RootStack />
          </UIProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
