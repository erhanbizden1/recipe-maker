import { InterFont } from "@/constants/theme";
import { useLanguage } from "@/contexts/language";
import { useUI } from "@/contexts/ui";
import { CONTENT_MAX_W, IS_TABLET } from "@/lib/responsive";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import React, { useCallback, useEffect, useRef } from "react";
import {
  AppState,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BG = require("@/assets/images/bg.png");
const ACCENT = "#FF6B2B";

const { width: SCREEN_W } = Dimensions.get("screen");

export default function HomeScreen() {
  const router = useRouter();
  const {
    openPaywall,
    isPremium,
    isPremiumLoaded,
    usageCount,
    freeLimit,
    refreshUsage,
  } = useUI();
  const { t } = useLanguage();

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    setStatusBarStyle("dark");
    const sub = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        setStatusBarStyle("dark");
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("dark");
      refreshUsage();
    }, [refreshUsage]),
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {/* Full-screen bg image — extends below content area into tab bar region */}
      <Image source={BG} style={styles.bgImage} resizeMode="cover" />

      {/* Top light overlay */}
      <LinearGradient
        colors={["rgba(255,255,255,1)", "rgba(255,255,255,0)"]}
        style={styles.topOverlay}
      />

      <SafeAreaView style={styles.content} edges={["top"]}>
        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <View style={styles.topBarCenter}>
            <Text style={styles.appName}>DishMind</Text>
          </View>
          <TouchableOpacity
            style={styles.proBtn}
            activeOpacity={0.8}
            onPress={openPaywall}
          >
            <View style={styles.proBtnInner}>
              {!isPremium && isPremiumLoaded && (
                <View style={styles.proBtnUsageSide}>
                  <Text style={styles.proBtnUsage}>
                    {usageCount}/{freeLimit}
                  </Text>
                </View>
              )}
              <LinearGradient
                colors={
                  isPremium ? ["#F5A623", "#E8920F"] : [ACCENT, "#FF8C42"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.proBtnCrownSide}
              >
                <MaterialCommunityIcons name="crown" size={16} color="#fff" />
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>{t.home.homeTitle}</Text>
        <Text style={styles.description}>{t.home.homeDesc}</Text>

        {/* ── Center Content ── */}
        <View style={styles.centerContent}>
          {/* ── Action Cards ── */}
          <View style={styles.cards}>
            {/* Primary: Scan */}
            <TouchableOpacity
              style={styles.primaryCard}
              onPress={() => router.push("/camera")}
              activeOpacity={0.88}
            >
              <View style={styles.primaryCardInner}>
                <View style={styles.cardIconWrap}>
                  <Ionicons
                    name="camera"
                    size={IS_TABLET ? 36 : 28}
                    color="#fff"
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{t.home.scanTitle}</Text>
                  <Text style={styles.cardSub}>{t.home.scanSub}</Text>
                </View>
                <View style={styles.cardArrow}>
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </View>
              </View>
              <View style={[styles.deco, styles.decoTR]} />
              <View style={[styles.deco, styles.decoBL]} />
            </TouchableOpacity>

            {/* Secondary: Type */}
            <TouchableOpacity
              style={styles.secondaryCard}
              onPress={() => router.push("/ingredients")}
              activeOpacity={0.88}
            >
              <View style={styles.secondaryCardInner}>
                <View style={styles.cardIconWrapSecondary}>
                  <Ionicons
                    name="create"
                    size={IS_TABLET ? 30 : 24}
                    color={ACCENT}
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitleSecondary}>
                    {t.home.typeTitle}
                  </Text>
                  <Text style={styles.cardSubSecondary}>{t.home.typeSub}</Text>
                </View>
                <View style={styles.cardArrowSecondary}>
                  <Ionicons name="chevron-forward" size={18} color={ACCENT} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topOverlay: {
    position: "absolute",
    width: SCREEN_W,
    height: 400,
    top: 0,
    left: 0,
  },
  bgImage: {
    position: "absolute",
    width: SCREEN_W,
    height: "100%",
    top: -60,
    left: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: IS_TABLET ? 0 : 20,
    paddingBottom: 40,
    maxWidth: CONTENT_MAX_W,
    alignSelf: "center",
    width: "100%",
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingHorizontal: IS_TABLET ? 32 : 0,
  },
  topBarCenter: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  appName: {
    fontSize: IS_TABLET ? 34 : 28,
    fontFamily: InterFont.bold,
    color: "#413F40",
    letterSpacing: -1,
  },
  description: {
    fontSize: IS_TABLET ? 16 : 14,
    fontFamily: InterFont.semiBold,
    color: "#2C2C2E",
  },
  subtitle: {
    fontSize: IS_TABLET ? 32 : 24,
    fontFamily: InterFont.bold,
    color: "#2C2C2E",
    lineHeight: IS_TABLET ? 42 : 32,
    marginTop: 28,
    marginBottom: 8,
  },
  taglinePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 28,
  },
  taglineIcon: {
    fontSize: 14,
  },
  tagline: {
    fontSize: IS_TABLET ? 15 : 13,
    color: "rgba(255,255,255,0.88)",
    fontFamily: InterFont.semiBold,
    letterSpacing: 0.1,
  },
  proBtn: {
    borderRadius: 999,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  proBtnInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  proBtnUsageSide: {
    backgroundColor: "#fff",
    paddingLeft: 10,
    paddingRight: 36,
    paddingVertical: 9,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  proBtnUsage: {
    fontSize: 12,
    fontFamily: InterFont.extraBold,
    color: ACCENT,
    letterSpacing: 0.2,
  },
  proBtnCrownSide: {
    paddingHorizontal: 9,
    paddingVertical: 9,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -32,
    zIndex: 2,
    overflow: "hidden",
  },

  // ── Center Content ──
  centerContent: {
    flex: 1,
    justifyContent: "center",
    marginBottom: 150,
  },

  // ── Cards ──
  cards: {
    gap: 12,
    paddingHorizontal: IS_TABLET ? 32 : 0,
  },
  primaryCard: {
    backgroundColor: ACCENT,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  primaryCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: IS_TABLET ? 28 : 22,
    gap: IS_TABLET ? 20 : 16,
  },
  cardIconWrap: {
    width: IS_TABLET ? 64 : 52,
    height: IS_TABLET ? 64 : 52,
    borderRadius: IS_TABLET ? 20 : 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: IS_TABLET ? 22 : 18,
    fontFamily: InterFont.bold,
    color: "#fff",
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: IS_TABLET ? 16 : 13,
    fontFamily: InterFont.regular,
    color: "rgba(255,255,255,0.82)",
    lineHeight: IS_TABLET ? 22 : 18,
  },
  cardArrow: {
    width: IS_TABLET ? 40 : 32,
    height: IS_TABLET ? 40 : 32,
    borderRadius: IS_TABLET ? 20 : 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  deco: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  decoTR: { width: 100, height: 100, top: -30, right: -20 },
  decoBL: { width: 70, height: 70, bottom: -20, left: 60 },

  secondaryCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  secondaryCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: IS_TABLET ? 28 : 22,
    gap: IS_TABLET ? 20 : 16,
  },
  cardIconWrapSecondary: {
    width: IS_TABLET ? 64 : 52,
    height: IS_TABLET ? 64 : 52,
    borderRadius: IS_TABLET ? 20 : 16,
    backgroundColor: "rgba(255,107,43,0.25)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardTitleSecondary: {
    fontSize: IS_TABLET ? 22 : 18,
    fontFamily: InterFont.bold,
    color: "#1C1C1E",
    letterSpacing: -0.2,
  },
  cardSubSecondary: {
    fontSize: IS_TABLET ? 16 : 13,
    fontFamily: InterFont.regular,
    color: "#636366",
    lineHeight: IS_TABLET ? 22 : 18,
    marginTop: 4,
  },
  cardArrowSecondary: {
    width: IS_TABLET ? 40 : 32,
    height: IS_TABLET ? 40 : 32,
    borderRadius: IS_TABLET ? 20 : 16,
    backgroundColor: "rgba(255,107,43,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,107,43,0.45)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  statsIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(255,107,43,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsText: {
    flex: 1,
    fontSize: 14,
    fontFamily: InterFont.semiBold,
    color: "#fff",
  },
  emptyStats: {
    alignItems: "center",
  },
  emptyStatsText: {
    fontSize: 13,
    fontFamily: InterFont.regular,
    color: "rgba(255,255,255,0.62)",
  },
});
