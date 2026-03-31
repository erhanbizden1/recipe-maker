import { TAB_BAR_BASE_HEIGHT } from "@/components/custom-tab-bar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ColorScheme } from "@/constants/colors";
import { InterFont } from "@/constants/theme";
import { useLanguage } from "@/contexts/language";
import { useTheme } from "@/contexts/theme";
import { CONTENT_MAX_W, IS_TABLET } from "@/lib/responsive";
import { useFocusEffect, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import React, { useCallback, useMemo } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const APP_STORE_URL =
  "https://apps.apple.com/app/idYOUR_APP_ID?action=write-review";
const PLAY_STORE_URL = "market://details?id=YOUR_PACKAGE_NAME";
const PRIVACY_POLICY_URL =
  "https://www.freeprivacypolicy.com/live/bff0afed-700a-4ff1-90b9-db06bc78b3ac";
const TERMS_URL =
  "https://www.termsfeed.com/live/ab19bd75-a435-45c7-a651-806570a0c99b";

function openURL(url: string) {
  Linking.openURL(url).catch(() => {});
}

export default function SettingsScreen() {
  const { colors: C, isDark } = useTheme();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("dark");
    }, [isDark]),
  );

  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const bottomPad = TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, 12);

  async function handleShare() {
    try {
      await Share.share({ message: t.settings.shareMessage });
    } catch {}
  }

  function handleRate() {
    openURL(Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL);
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.headerWrap}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.settings.title}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 24 },
        ]}
      >
        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t.settings.preferences}</Text>
          <View style={styles.card}>
            <Row
              icon="fork.knife"
              iconBg={C.accentLight}
              iconColor={C.accent}
              label={t.settings.dietAndEquipment}
              onPress={() => router.push("/preferences")}
              C={C}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t.settings.support}</Text>
          <View style={styles.card}>
            <Row
              icon="star.fill"
              iconBg="rgba(255,214,0,0.15)"
              iconColor={C.yellow}
              label={t.settings.rateApp}
              onPress={handleRate}
              C={C}
            />
            <View style={styles.divider} />
            <Row
              icon="square.and.arrow.up"
              iconBg="rgba(48,209,88,0.15)"
              iconColor={C.green}
              label={t.settings.shareApp}
              onPress={handleShare}
              C={C}
            />
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t.settings.legal}</Text>
          <View style={styles.card}>
            <Row
              icon="lock.fill"
              iconBg="rgba(10,132,255,0.15)"
              iconColor="#0A84FF"
              label={t.settings.privacyPolicy}
              onPress={() => openURL(PRIVACY_POLICY_URL)}
              C={C}
            />
            <View style={styles.divider} />
            <Row
              icon="doc.text.fill"
              iconBg={C.accentLight}
              iconColor={C.accent}
              label={t.settings.termsOfUse}
              onPress={() => openURL(TERMS_URL)}
              C={C}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  iconBg,
  iconColor,
  label,
  onPress,
  C,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  onPress: () => void;
  C: ColorScheme;
}) {
  return (
    <TouchableOpacity
      style={rowStyles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[rowStyles.iconWrap, { backgroundColor: iconBg }]}>
        <IconSymbol
          name={icon as any}
          size={IS_TABLET ? 18 : 16}
          color={iconColor}
        />
      </View>
      <Text style={[rowStyles.label, { color: C.text }]}>{label}</Text>
      <IconSymbol name="chevron.right" size={14} color={C.text3} />
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: IS_TABLET ? 16 : 13,
  },
  iconWrap: {
    width: IS_TABLET ? 42 : 34,
    height: IS_TABLET ? 42 : 34,
    borderRadius: IS_TABLET ? 13 : 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: IS_TABLET ? 18 : 16,
    fontFamily: InterFont.semiBold,
  },
});

function createStyles(C: ColorScheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    headerWrap: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
      maxWidth: CONTENT_MAX_W,
      alignSelf: "center",
      width: "100%",
    },
    header: {
      paddingHorizontal: IS_TABLET ? 24 : 20,
      paddingVertical: 16,
    },
    title: {
      fontSize: IS_TABLET ? 32 : 28,
      fontFamily: InterFont.bold,
      color: C.text,
      letterSpacing: -0.5,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      maxWidth: CONTENT_MAX_W,
      alignSelf: "center",
      width: "100%",
      paddingTop: 8,
    },
    section: {
      marginTop: 24,
      paddingHorizontal: IS_TABLET ? 24 : 16,
    },
    sectionLabel: {
      fontSize: IS_TABLET ? 12 : 11,
      fontFamily: InterFont.bold,
      color: C.text3,
      letterSpacing: 1.1,
      textTransform: "uppercase",
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: C.surface,
      borderRadius: 18,
      paddingHorizontal: IS_TABLET ? 20 : 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: C.border,
      marginLeft: IS_TABLET ? 56 : 48,
    },
  });
}
