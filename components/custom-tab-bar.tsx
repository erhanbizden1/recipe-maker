import { IconSymbol } from "@/components/ui/icon-symbol";
import { ColorScheme } from "@/constants/colors";
import { InterFont } from "@/constants/theme";
import { useLanguage } from "@/contexts/language";
import { useTheme } from "@/contexts/theme";
import { useUI } from "@/contexts/ui";
import { IS_TABLET } from "@/lib/responsive";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ICONS = {
  recipes: "fork.knife" as const,
  index: "house.fill" as const,
  settings: "gearshape.fill" as const,
};

export const TAB_BAR_BASE_HEIGHT = 82;

const HOME_BTN_SIZE = IS_TABLET ? 64 : 40;
const BUMP_SIZE = HOME_BTN_SIZE + 20;
const HOME_OVERHANG = 30;

// home button top (relative to bar top):  -(SIZE - OVERHANG)
const HOME_TOP = -(HOME_BTN_SIZE - HOME_OVERHANG); // -36
// bump top: align bump center with home button center
const HOME_BTN_CENTER = HOME_TOP + HOME_BTN_SIZE / 2; // -36 + 29 = -7
const BUMP_TOP = HOME_BTN_CENTER - BUMP_SIZE / 2; // -7  - 37 = -44

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);
  const { paywallOpen } = useUI();
  const { t } = useLanguage();

  if (paywallOpen) return null;
  const activeRouteName = state.routes[state.index]?.name ?? "";
  const bottomPad = Math.max(insets.bottom, 8);
  const homeActive = activeRouteName === "index";

  function navigate(name: string) {
    if (activeRouteName === name) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(name);
  }

  return (
    <View style={styles.wrapper}>
      {/* 1) Bar — rendered first (bottom layer) */}
      <View style={[styles.bar, { paddingBottom: bottomPad + 4 }]}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => navigate("recipes")}
          activeOpacity={0.7}
        >
          <IconSymbol
            name={TAB_ICONS.recipes}
            size={IS_TABLET ? 26 : 22}
            color={activeRouteName === "recipes" ? C.accent : C.text3}
          />
          <Text
            style={[
              styles.label,
              activeRouteName === "recipes" && styles.labelActive,
            ]}
          >
            {t.tabs.recipes}
          </Text>
        </TouchableOpacity>

        <View style={styles.homeSpace} />

        <TouchableOpacity
          style={styles.tab}
          onPress={() => navigate("settings")}
          activeOpacity={0.7}
        >
          <IconSymbol
            name={TAB_ICONS.settings}
            size={IS_TABLET ? 26 : 22}
            color={activeRouteName === "settings" ? C.accent : C.text3}
          />
          <Text
            style={[
              styles.label,
              activeRouteName === "settings" && styles.labelActive,
            ]}
          >
            {t.tabs.settings}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2) White dome — same bg as bar, covers the border line under the button (middle layer) */}
      <View style={styles.bump} />

      {/* 3) Home button — top layer */}
      <TouchableOpacity
        style={styles.homeContainer}
        onPress={() => navigate("index")}
        activeOpacity={0.8}
      >
        <View style={[styles.homeBtn, homeActive && styles.homeBtnActive]}>
          <IconSymbol
            name={TAB_ICONS.index}
            size={IS_TABLET ? 30 : 24}
            color={homeActive ? "#fff" : C.text3}
          />
        </View>
        <Text style={[styles.label, homeActive && styles.labelActive]}>
          {t.tabs.home}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(C: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    wrapper: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      overflow: "visible",
    },
    bar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: C.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: 8,
      elevation: 12,
      paddingTop: 15,
      zIndex: 1,
      borderRadius: 24,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: IS_TABLET ? 6 : 5,
      height: IS_TABLET ? 58 : 40,
    },
    homeSpace: {
      flex: 1,
    },
    // White dome: same bg as bar, centered, covers the top-border under the button
    bump: {
      position: "absolute",
      top: BUMP_TOP,
      alignSelf: "center",
      width: BUMP_SIZE,
      height: BUMP_SIZE,
      borderRadius: BUMP_SIZE / 2,
      backgroundColor: C.surface,
      zIndex: 2,
    },
    // Home button floats above bar, on top of the dome
    homeContainer: {
      position: "absolute",
      top: HOME_TOP,
      alignSelf: "center",
      alignItems: "center",
      gap: IS_TABLET ? 6 : 5,
      zIndex: 3,
    },
    homeBtn: {
      width: HOME_BTN_SIZE,
      height: HOME_BTN_SIZE,
      borderRadius: HOME_BTN_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: C.surface2,
    },
    homeBtnActive: {
      backgroundColor: C.accent,
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 10,
    },
    label: {
      fontSize: IS_TABLET ? 13 : 11,
      fontFamily: InterFont.medium,
      color: C.text3,
    },
    labelActive: {
      color: C.accent,
      fontFamily: InterFont.semiBold,
    },
  });
}
