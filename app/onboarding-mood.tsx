import * as Haptics from "expo-haptics";
import { useLanguage } from "@/contexts/language";

import { useOnboarding } from "@/hooks/use-onboarding";
import { CONTENT_MAX_W, IS_TABLET } from "@/lib/responsive";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = useRef(new Animated.Value((current + 1) / total)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: (current + 1) / total,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [current, progress, total]);

  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.track}>
        <Animated.View
          style={[
            progressStyles.fill,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: {
    paddingHorizontal: IS_TABLET ? 48 : 24,
    maxWidth: CONTENT_MAX_W,
    alignSelf: "center",
    width: "100%",
    marginBottom: 32,
  },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E5E5EA",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#FF6B2B",
  },
});

// ─── Option Card ──────────────────────────────────────────────────────────────
function OptionCard({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Text
          style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OnboardingMoodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboarding();

  const { t } = useLanguage();
  const o = t.onboarding;

  const STEPS = [
    {
      question: o.moodQ1,
      description: o.moodQ1Desc,
      multiSelect: false,
      options: [
        { id: "1", label: o.moodQ1O1 },
        { id: "2", label: o.moodQ1O2 },
        { id: "3", label: o.moodQ1O3 },
        { id: "4", label: o.moodQ1O4 },
      ],
    },
    {
      question: o.moodQ2,
      description: o.moodQ2Desc,
      multiSelect: false,
      options: [
        { id: "1", label: o.moodQ2O1 },
        { id: "2", label: o.moodQ2O2 },
        { id: "3", label: o.moodQ2O3 },
        { id: "4", label: o.moodQ2O4 },
        { id: "5", label: o.moodQ2O5 },
      ],
    },
    {
      question: o.moodQ3,
      description: o.moodQ3Desc,
      multiSelect: true,
      options: [
        { id: "1", label: o.moodQ3O1 },
        { id: "2", label: o.moodQ3O2 },
        { id: "3", label: o.moodQ3O3 },
        { id: "4", label: o.moodQ3O4 },
      ],
    },
    {
      question: o.moodQ4,
      description: o.moodQ4Desc,
      multiSelect: false,
      options: [
        { id: "1", label: o.moodQ4O1 },
        { id: "2", label: o.moodQ4O2 },
        { id: "3", label: o.moodQ4O3 },
        { id: "4", label: o.moodQ4O4 },
      ],
    },
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const [selections, setSelections] = useState<
    Record<number, string | string[]>
  >({});
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  function animateStep(toIndex: number) {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: toIndex > stepIndex ? -20 : 20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStepIndex(toIndex);
      slideAnim.setValue(toIndex > stepIndex ? 20 : -20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const currentSelection = selections[stepIndex];
  const hasSelection = step.multiSelect
    ? Array.isArray(currentSelection) && currentSelection.length > 0
    : !!currentSelection;

  function handleSelect(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step.multiSelect) {
      const prev = (selections[stepIndex] as string[]) ?? [];
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      setSelections({ ...selections, [stepIndex]: next });
    } else {
      setSelections({ ...selections, [stepIndex]: id });
    }
  }

  function isOptionSelected(id: string) {
    if (step.multiSelect) {
      return ((selections[stepIndex] as string[]) ?? []).includes(id);
    }
    return selections[stepIndex] === id;
  }

  function handleBack() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (stepIndex === 0) {
      router.back();
    } else {
      animateStep(stepIndex - 1);
    }
  }

  async function handleContinue() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isLast) {
      animateStep(stepIndex + 1);
      return;
    }
    await completeOnboarding({
      mood: selections[0],
      diet: selections[1],
      equipment: selections[2],
      source: selections[3],
    });
    router.replace({
      pathname: "/onboarding-loading",
      params: {
        mood: String(selections[0] ?? "0"),
        diet: String(selections[1] ?? "0"),
      },
    });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <StatusBar style="dark" />

      {/* Progress */}
      <ProgressBar current={stepIndex} total={STEPS.length} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <TouchableOpacity
                style={[
                  styles.backBtn,
                  stepIndex === 0 && styles.backBtnDisabled,
                ]}
                onPress={handleBack}
                disabled={stepIndex === 0}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.backText,
                    stepIndex === 0 && styles.backTextDisabled,
                  ]}
                >
                  ‹
                </Text>
              </TouchableOpacity>
              <Text style={styles.title}>{step.question}</Text>
            </View>
            <Text style={styles.description}>{step.description}</Text>
          </View>

          {/* Options */}
          <View style={styles.options}>
            {step.options.map((opt) => (
              <OptionCard
                key={opt.id}
                label={opt.label}
                isSelected={isOptionSelected(opt.id)}
                onPress={() => handleSelect(opt.id)}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={[
            styles.continueBtn,
            !hasSelection && styles.continueBtnDisabled,
          ]}
          onPress={handleContinue}
          disabled={!hasSelection}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.continueBtnText,
              !hasSelection && styles.continueBtnTextDisabled,
            ]}
          >
            {isLast ? o.moodFinish : o.continue}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: IS_TABLET ? 48 : 24,
    paddingBottom: 24,
    maxWidth: CONTENT_MAX_W,
    alignSelf: "center",
    width: "100%",
  },

  // Header
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: IS_TABLET ? 34 : 30,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: -0.8,
    lineHeight: IS_TABLET ? 50 : 40,
    marginBottom: 0,
    maxWidth: IS_TABLET ? 480 : 280,
    fontFamily: "Inter_700Bold",
  },
  description: {
    fontSize: IS_TABLET ? 17 : 15,
    color: "#8E8E93",
    lineHeight: IS_TABLET ? 26 : 22,
    marginLeft: 52,
    fontFamily: "Inter_400Regular",
  },

  // Options
  options: {
    gap: 14,
  },
  optionCard: {
    borderRadius: 14,
    paddingVertical: IS_TABLET ? 24 : 22,
    paddingHorizontal: 24,
    backgroundColor: "#F2F2F7",
  },
  optionCardSelected: {
    backgroundColor: "#FF6B2B",
    shadowColor: "#FF6B2B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  optionLabel: {
    fontSize: IS_TABLET ? 17 : 16,
    fontWeight: "600",
    color: "#1C1C1E",
    letterSpacing: -0.2,
    fontFamily: "Inter_600SemiBold",
  },
  optionLabelSelected: {
    color: "#FFFFFF",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: 26,
    color: "#1C1C1E",
    lineHeight: 26,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  backBtnDisabled: {
    opacity: 0.7,
  },
  backTextDisabled: {
    color: "#C7C7CC",
  },

  // Bottom
  bottom: {
    paddingHorizontal: IS_TABLET ? 48 : 24,
    maxWidth: CONTENT_MAX_W,
    alignSelf: "center",
    width: "100%",
  },
  continueBtn: {
    backgroundColor: "#FF6B2B",
    borderRadius: 14,
    paddingVertical: IS_TABLET ? 20 : 18,
    alignItems: "center",
    shadowColor: "#FF6B2B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  continueBtnDisabled: {
    backgroundColor: "#F2F2F7",
    shadowOpacity: 0,
  },
  continueBtnText: {
    fontSize: IS_TABLET ? 22 : 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.1,
    fontFamily: "Inter_700Bold",
  },
  continueBtnTextDisabled: {
    color: "#AEAEB2",
  },
});
