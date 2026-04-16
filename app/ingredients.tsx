import { ColorScheme } from "@/constants/colors";
import { InterFont } from "@/constants/theme";
import { useLanguage } from "@/contexts/language";
import { useTheme } from "@/contexts/theme";
import { useUI } from "@/contexts/ui";
import { CONTENT_MAX_W, IS_TABLET } from "@/lib/responsive";
import { useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function IngredientsScreen() {
  const [input, setInput] = useState("");
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();
  const { t } = useLanguage();
  const { isPremium, usageCount, freeLimit, openPaywall } = useUI();
  const styles = useMemo(() => createStyles(C), [C]);

  useEffect(() => {
    setStatusBarStyle("dark");
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const canSubmit = input.trim().length > 0;

  function addQuick(item: string) {
    const word = item.replace(/^\S+\s/, "");
    setInput((prev) => (prev.trim() ? `${prev.trim()}, ${word}` : word));
  }

  function handleSubmit() {
    if (submitting) return;
    inputRef.current?.blur();
    if (!isPremium && usageCount >= freeLimit) {
      openPaywall();
      return;
    }
    setSubmitting(true);
    router.push({
      pathname: "/recipe-result",
      params: { photos: JSON.stringify([]), text: input.trim(), thumbnail: "" },
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header row */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>{t.ingredients.title}</Text>
            <Text style={styles.sub}>{t.ingredients.subtitle}</Text>
          </View>
        </View>

        {/* Input */}
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            multiline
            autoFocus
            placeholder={t.ingredients.placeholder}
            placeholderTextColor={C.text3}
            value={input}
            onChangeText={setInput}
            textAlignVertical="top"
            selectionColor={C.accent}
          />
          {input.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => setInput("")}
            >
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {input.length > 0 && (
          <Text style={styles.charCount}>
            {t.ingredients.characters(input.length)}
          </Text>
        )}

        {/* Quick add */}
        <Text style={styles.sectionLabel}>{t.ingredients.quickAdd}</Text>
        <View style={styles.quickRow}>
          {t.ingredients.quickAddItems.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.quickChip}
              onPress={() => addQuick(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tip */}
        <View style={styles.tip}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>{t.ingredients.tip}</Text>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.bottomBarInner}>
          <TouchableOpacity
            style={[styles.cta, (!canSubmit || submitting) && styles.ctaDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>{t.ingredients.findRecipes}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(C: ColorScheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: IS_TABLET ? 28 : 20,
      paddingBottom: 48,
      maxWidth: CONTENT_MAX_W,
      alignSelf: "center",
      width: "100%",
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 28,
    },
    backBtn: {
      width: IS_TABLET ? 48 : 38,
      height: IS_TABLET ? 48 : 38,
      borderRadius: IS_TABLET ? 24 : 19,
      backgroundColor: C.surface2,
      alignItems: "center",
      justifyContent: "center",
    },
    backIcon: {
      fontSize: IS_TABLET ? 30 : 24,
      color: C.text,
      fontFamily: InterFont.regular,
      lineHeight: IS_TABLET ? 36 : 28,
      marginTop: -1,
    },
    heading: {
      fontSize: IS_TABLET ? 34 : 22,
      fontFamily: InterFont.extraBold,
      color: C.text,
      letterSpacing: -0.4,
    },
    sub: {
      fontSize: IS_TABLET ? 16 : 13,
      fontFamily: InterFont.regular,
      color: C.text2,
      marginTop: 1,
    },
    inputWrap: {
      position: "relative",
      marginBottom: 6,
    },
    input: {
      backgroundColor: C.surface2,
      borderRadius: 18,
      padding: IS_TABLET ? 22 : 18,
      paddingRight: 44,
      fontSize: IS_TABLET ? 19 : 16,
      fontFamily: InterFont.regular,
      color: C.text,
      minHeight: IS_TABLET ? 220 : 160,
      lineHeight: IS_TABLET ? 30 : 24,
    },
    clearBtn: {
      position: "absolute",
      top: 14,
      right: 14,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: C.white,
      alignItems: "center",
      justifyContent: "center",
    },
    clearText: {
      color: C.text2,
      fontSize: 11,
      fontFamily: InterFont.extraBold,
    },
    charCount: {
      fontSize: 11,
      fontFamily: InterFont.regular,
      color: C.text3,
      textAlign: "right",
      marginBottom: 20,
      marginRight: 4,
    },
    sectionLabel: {
      fontSize: 11,
      fontFamily: InterFont.bold,
      color: C.text3,
      letterSpacing: 1.2,
      marginBottom: 10,
    },
    quickRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 24,
    },
    quickChip: {
      backgroundColor: C.surface2,
      paddingHorizontal: IS_TABLET ? 18 : 14,
      paddingVertical: IS_TABLET ? 11 : 8,
      borderRadius: 20,
    },
    quickText: {
      color: C.text2,
      fontSize: IS_TABLET ? 16 : 13,
      fontFamily: InterFont.medium,
    },
    tip: {
      flexDirection: "row",
      gap: 10,
      backgroundColor: C.surface2,
      borderRadius: 14,
      padding: 14,
      marginBottom: 24,
      alignItems: "flex-start",
    },
    tipIcon: { fontSize: 16, lineHeight: 22 },
    tipText: {
      flex: 1,
      fontSize: 13,
      fontFamily: InterFont.regular,
      color: C.text2,
      lineHeight: 20,
    },
    bottomBar: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: C.border,
      backgroundColor: C.bg,
    },
    bottomBarInner: {
      paddingHorizontal: IS_TABLET ? 28 : 20,
      maxWidth: CONTENT_MAX_W,
      alignSelf: "center",
      width: "100%",
    },
    cta: {
      backgroundColor: C.accent,
      borderRadius: 18,
      paddingVertical: IS_TABLET ? 22 : 18,
      alignItems: "center",
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
    },
    ctaDisabled: {
      opacity: 0.4,
      shadowOpacity: 0,
    },
    ctaText: {
      color: "#fff",
      fontSize: IS_TABLET ? 20 : 17,
      fontFamily: InterFont.bold,
      letterSpacing: 0.3,
    },
  });
}
