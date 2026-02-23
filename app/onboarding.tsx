import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useOnboarding } from '@/hooks/use-onboarding';
import { useUI } from '@/contexts/ui';
import { CONTENT_MAX_W, IS_TABLET, ONBOARDING_IMG_SIZE, SCREEN_W, SCREEN_H } from '@/lib/responsive';

interface OnboardingStep {
  id: string;
  emoji?: string;
  image?: ReturnType<typeof require>;
  video?: ReturnType<typeof require>;
  title: string;
  description: string;
}


type Styles = ReturnType<typeof createStyles>;

// ─── Welcome (video) slide ────────────────────────────────────────────────────
function WelcomeSlide({ onVideoEnd }: { onVideoEnd: () => void }) {
  const { t } = useLanguage();
  const player = useVideoPlayer(
    require('@/assets/images/onboarding-video.mp4'),
    (p) => {
      p.loop = false;
      p.play();
    }
  );

  useEffect(() => {
    const sub = player.addListener('playToEnd', onVideoEnd);
    return () => sub.remove();
  }, []);

  return (
    <View style={{ width: SCREEN_W, height: SCREEN_H }}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={welcomeStyles.content}>
        <Text style={welcomeStyles.welcome}>{t.onboarding.welcome}</Text>
        <Text style={welcomeStyles.title}>DishMind</Text>
        <Text style={welcomeStyles.subtitle}>{t.onboarding.subtitle}</Text>
      </View>
    </View>
  );
}

const welcomeStyles = StyleSheet.create({
  content: {
    position: 'absolute',
    bottom: IS_TABLET ? 180 : 140,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: IS_TABLET ? 80 : 36,
  },
  welcome: {
    fontSize: IS_TABLET ? 20 : 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: IS_TABLET ? 68 : 56,
    fontWeight: '900',
    color: '#FF6B2B',
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 24,
  },
});

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
  // Dots are offset by 1 because we skip the video step (index 0)
  const slideIndex = index + 1;
  const animStyle = useAnimatedStyle(() => {
    const inputRange = [
      (slideIndex - 1) * SCREEN_W,
      slideIndex * SCREEN_W,
      (slideIndex + 1) * SCREEN_W,
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
  const { completeOnboarding } = useOnboarding();
  const { openPaywall } = useUI();
  const { colors: C, isDark } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(C), [C]);
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const STEPS = [
    { id: '0', video: require('@/assets/images/onboarding-video.mp4'), title: '', description: '' },
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

  async function handleFinish() {
    await completeOnboarding();
    router.replace('/(tabs)');
    setTimeout(() => openPaywall(), 800);
  }

  function handleNext() {
    flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  }

  const handleVideoEnd = useCallback(() => {
    flatListRef.current?.scrollToIndex({ index: 1, animated: true });
  }, []);

  const isVideoStep = activeIndex === 0;
  const isLast = activeIndex === STEPS.length - 1;

  // Dots only for the 3 regular steps (indices 1-3)
  const regularSteps = STEPS.slice(1);

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <FlatList
        ref={flatListRef}
        data={STEPS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!isVideoStep}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          item.video ? (
            <WelcomeSlide onVideoEnd={handleVideoEnd} />
          ) : (
            <StepSlide step={item} styles={styles} />
          )
        }
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
      />

      {/* Bottom controls — hidden on video welcome step */}
      {!isVideoStep && (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.dots}>
            {regularSteps.map((_, i) => (
              <Dot key={i} index={i} scrollX={scrollX} styles={styles} />
            ))}
          </View>

          {isLast ? (
            <TouchableOpacity style={styles.getStartedBtn} onPress={handleFinish} activeOpacity={0.85}>
              <Text style={styles.getStartedText}>{t.onboarding.getStarted}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.getStartedBtn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.getStartedText}>{t.onboarding.continue}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
      fontSize: IS_TABLET ? 19 : 17,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.1,
    },
  });
}
