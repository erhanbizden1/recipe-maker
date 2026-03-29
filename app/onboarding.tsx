import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ColorScheme } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useTheme } from '@/contexts/theme';
import { CONTENT_MAX_W, IS_TABLET, ONBOARDING_IMG_SIZE, SCREEN_W } from '@/lib/responsive';

interface OnboardingStep {
  id: string;
  emoji?: string;
  image?: ReturnType<typeof require>;
  title: string;
  description: string;
}

type Styles = ReturnType<typeof createStyles>;

// ─── Regular slide ────────────────────────────────────────────────────────────
function StepSlide({ step, styles }: { step: OnboardingStep; styles: Styles }) {
  return (
    <View style={styles.slide}>
      <View style={styles.visualArea}>
        {step.image ? (
          <Image source={step.image} style={styles.onboardingImage} resizeMode="contain" />
        ) : (
          <>
            <View style={styles.glowRing} />
            <Text style={styles.emoji}>{step.emoji}</Text>
          </>
        )}
      </View>
      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.description}>{step.description}</Text>
    </View>
  );
}

// ─── Dot indicator ────────────────────────────────────────────────────────────
function Dot({
  index,
  scrollX,
  styles,
}: {
  index: number;
  scrollX: SharedValue<number>;
  styles: Styles;
}) {
  const animStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_W,
      index * SCREEN_W,
      (index + 1) * SCREEN_W,
    ];
    const width = interpolate(scrollX.value, inputRange, [8, 24, 8], 'clamp');
    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], 'clamp');
    return { width, opacity };
  });

  return <Animated.View style={[styles.dot, animStyle]} />;
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(C), [C]);
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const STEPS: OnboardingStep[] = [
    { id: '1', image: require('@/assets/images/onboarding-1.png'), title: t.onboarding.step1Title, description: t.onboarding.step1Desc },
    { id: '2', image: require('@/assets/images/onboardin-2.png'), title: t.onboarding.step2Title, description: t.onboarding.step2Desc },
    { id: '3', image: require('@/assets/images/onboading-3.png'), title: t.onboarding.step3Title, description: t.onboarding.step3Desc },
  ];

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 });
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  );

  function handleFinish() {
    router.replace('/onboarding-mood');
  }

  function handleNext() {
    flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  }

  const isLast = activeIndex === STEPS.length - 1;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <FlatList
        ref={flatListRef}
        data={STEPS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StepSlide step={item} styles={styles} />}
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
      />

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} styles={styles} />
          ))}
        </View>

        {isLast ? (
          <TouchableOpacity style={styles.getStartedBtn} onPress={handleFinish} activeOpacity={0.85}>
            <Text style={styles.getStartedText}>{t.onboarding.moodFinish}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.getStartedBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.getStartedText}>{t.onboarding.continue}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function createStyles(C: ColorScheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },

    // Regular slide
    slide: {
      width: SCREEN_W,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: IS_TABLET ? 60 : 36,
    },
    visualArea: {
      width: ONBOARDING_IMG_SIZE,
      height: ONBOARDING_IMG_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    onboardingImage: {
      width: ONBOARDING_IMG_SIZE,
      height: ONBOARDING_IMG_SIZE,
    },
    glowRing: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 1.5,
      borderColor: C.accentGlow,
      backgroundColor: C.accentLight,
    },
    emoji: {
      fontSize: 80,
    },
    title: {
      fontSize: IS_TABLET ? 48 : 28,
      fontWeight: '800',
      color: C.text,
      textAlign: 'center',
      letterSpacing: -0.5,
      marginBottom: 16,
      maxWidth: CONTENT_MAX_W,
    },
    description: {
      fontSize: IS_TABLET ? 26 : 16,
      color: C.text2,
      textAlign: 'center',
      lineHeight: IS_TABLET ? 40 : 24,
      maxWidth: CONTENT_MAX_W,
    },

    // Bottom
    bottom: {
      paddingHorizontal: IS_TABLET ? 0 : 24,
      gap: 24,
      maxWidth: CONTENT_MAX_W,
      alignSelf: 'center',
      width: '100%',
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
    },
    dot: {
      height: 8,
      borderRadius: 4,
      backgroundColor: C.accent,
    },
    getStartedBtn: {
      backgroundColor: C.accent,
      borderRadius: 18,
      paddingVertical: IS_TABLET ? 20 : 18,
      alignItems: 'center',
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 16,
    },
    getStartedText: {
      fontSize: IS_TABLET ? 22 : 20,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.1,
    },
  });
}
