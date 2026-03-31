import { useLanguage } from "@/contexts/language";
import { useUI } from "@/contexts/ui";
import { IS_TABLET } from "@/lib/responsive";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MESSAGE_DURATION = 2000; // ms per message
const READY_LINGER = 2000; // ms to stay on "ready" message before navigating

export default function OnboardingLoadingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openPaywall } = useUI();
  const { t } = useLanguage();
  const o = t.onboardingLoading;

  const { mood, diet } = useLocalSearchParams<{ mood: string; diet: string }>();

  const moodIndex = Math.min(
    parseInt(mood ?? "0") || 0,
    o.moodMessages.length - 1,
  );
  const dietIndex = Math.min(
    parseInt(diet ?? "0") || 0,
    o.dietMessages.length - 1,
  );

  const messages = [
    o.moodMessages[moodIndex],
    o.dietMessages[dietIndex],
    o.readyMsg,
  ];

  const [messageIndex, setMessageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const lottieRef = useRef<LottieView>(null);

  // Cycle through messages
  useEffect(() => {
    if (messageIndex >= messages.length - 1) return;

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setMessageIndex((prev) => prev + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, MESSAGE_DURATION);

    return () => clearTimeout(timer);
  }, [messageIndex]);

  // Navigate 2s after the last ("ready") message appears
  useEffect(() => {
    const navigateAt = MESSAGE_DURATION * (messages.length - 1) + READY_LINGER;
    const timer = setTimeout(() => {
      router.replace("/(tabs)");
      setTimeout(() => openPaywall(), 800);
    }, navigateAt);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Lottie Animation */}
      <View style={styles.animationContainer}>
        <LottieView
          ref={lottieRef}
          // Place your Lottie JSON at assets/animations/cooking.json
          source={require("../assets/animations/chef.json")}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>

      {/* Personalized message */}
      <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
        <Text style={styles.message}>{messages[messageIndex]}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: IS_TABLET ? 64 : 32,
  },
  animationContainer: {
    width: IS_TABLET ? 280 : 220,
    height: IS_TABLET ? 280 : 140,
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  messageContainer: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  message: {
    fontSize: IS_TABLET ? 17 : 15,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: IS_TABLET ? 26 : 22,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#E5E5EA",
  },
  dotActive: {
    backgroundColor: "#FF6B2B",
    width: 20,
  },
});
