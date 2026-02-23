import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';
import RatingPrompt from '@/components/rating-prompt';
import RecipeCard from '@/components/recipe-card';
import { ColorScheme } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useTheme } from '@/contexts/theme';
import { useUI } from '@/contexts/ui';
import { analyzeIngredients, AnalysisResult } from '@/lib/claude';
import { db } from '@/lib/firebase';
import { getDeviceId } from '@/lib/device-id';
import { useRecipeHistory } from '@/hooks/use-recipe-history';
import { CONTENT_MAX_W, IS_TABLET } from '@/lib/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const FREE_LIMIT = 1;
const PREMIUM_KEYS = ['premium', 'pro', 'unlimited', 'full_access'];

export default function RecipeResultScreen() {
  const { photos: photosParam, text, thumbnail, cachedResult } = useLocalSearchParams<{
    photos: string;
    text: string;
    thumbnail: string;
    cachedResult?: string;
  }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addEntry } = useRecipeHistory();
  const { colors: C, isDark } = useTheme();
  const { t, language } = useLanguage();
  const { openPaywall } = useUI();
  const styles = useMemo(() => createStyles(C), [C]);

  const [result, setResult] = useState<AnalysisResult | null>(
    cachedResult ? (JSON.parse(cachedResult) as AnalysisResult) : null
  );
  const [error, setError] = useState<string | null>(null);
  const [ratingVisible, setRatingVisible] = useState(false);
  const ratingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const msgFadeAnim = useRef(new Animated.Value(1)).current;
  const photoFadeAnim = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const msgInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const photoInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const imageUris: string[] = photosParam ? JSON.parse(photosParam) : [];
  const isPhotoMode = imageUris.length > 0;
  const LOADING_MESSAGES = isPhotoMode
    ? t.recipeResult.photoLoadingMessages
    : t.recipeResult.textLoadingMessages;

  useEffect(() => {
    if (cachedResult) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      return;
    }
    startLoadingAnimation();
    gateAndAnalyze();
    return () => {
      if (msgInterval.current) clearInterval(msgInterval.current);
      if (photoInterval.current) clearInterval(photoInterval.current);
      if (ratingTimer.current) clearTimeout(ratingTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startLoadingAnimation() {
    let idx = 0;
    msgInterval.current = setInterval(() => {
      Animated.timing(msgFadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        idx = (idx + 1) % LOADING_MESSAGES.length;
        setLoadingMsgIdx(idx);
        Animated.timing(msgFadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    }, 2200);

    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    if (imageUris.length > 1) {
      let photoIdx = 0;
      photoInterval.current = setInterval(() => {
        Animated.timing(photoFadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
          photoIdx = (photoIdx + 1) % imageUris.length;
          setCurrentPhotoIdx(photoIdx);
          Animated.timing(photoFadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        });
      }, 2000);
    }
  }

  async function gateAndAnalyze() {
    // Check premium status via RevenueCat (cached, fast)
    let hasPremium = false;
    if (Platform.OS === 'ios') {
      try {
        const info = await Purchases.getCustomerInfo();
        hasPremium =
          PREMIUM_KEYS.some((k) => info.entitlements.active[k]) ||
          Object.keys(info.entitlements.active).length > 0;
      } catch {}
    }

    // Gate free users after FREE_LIMIT recipes (usageCount from Firestore)
    if (!hasPremium) {
      try {
        const deviceId = await getDeviceId();
        const userDoc = await getDoc(doc(db, 'users', deviceId));
        const usageCount = userDoc.exists() ? (userDoc.data().usageCount ?? 0) : 0;
        if (usageCount >= FREE_LIMIT) {
          if (msgInterval.current) clearInterval(msgInterval.current);
          if (photoInterval.current) clearInterval(photoInterval.current);
          router.back();
          setTimeout(() => openPaywall(), 300);
          return;
        }
      } catch {}
    }

    await startAnalysis();
  }

  async function startAnalysis() {
    try {
      const analysisResult = await analyzeIngredients(imageUris, text || undefined, undefined, language);
      if (msgInterval.current) clearInterval(msgInterval.current);
      setResult(analysisResult);
      await addEntry({
        thumbnailUri: thumbnail || imageUris[0] || undefined,
        textDescription: text || undefined,
        result: analysisResult,
      });



      // Increment usage count (never decremented, even if recipe is deleted)
      try {
        const deviceId = await getDeviceId();
        const userRef = doc(db, 'users', deviceId);
        const userDoc = await getDoc(userRef);
        const prev = userDoc.exists() ? (userDoc.data().usageCount ?? 0) : 0;
        await setDoc(userRef, { usageCount: prev + 1 }, { merge: true });
      } catch {}

      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      maybeShowRatingPrompt();
    } catch (err) {
      if (msgInterval.current) clearInterval(msgInterval.current);
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[RecipeResult] Analysis failed:', msg);
      setError(msg);
    }
  }

  async function maybeShowRatingPrompt() {
    const shown = await AsyncStorage.getItem('rating_prompted');
    if (shown) return;
    ratingTimer.current = setTimeout(() => {
      setRatingVisible(true);
    }, 5000);
  }

  function handleRatingDismiss() {
    setRatingVisible(false);
    AsyncStorage.setItem('rating_prompted', 'true');
    if (ratingTimer.current) clearTimeout(ratingTimer.current);
  }

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  if (error) {
    return (
      <View style={[styles.fullCenter, { paddingTop: insets.top }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.errorIcon}>
          <Text style={{ fontSize: 36 }}>😕</Text>
        </View>
        <Text style={styles.errorTitle}>{t.recipeResult.errorTitle}</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>{t.recipeResult.goBack}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!result) {
    if (isPhotoMode) {
      const scanY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 260] });
      return (
        <View style={[styles.fullCenter, { paddingTop: insets.top }]}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          {/* Photo with scan overlay */}
          <View style={styles.photoWrap}>
            <Animated.Image
              source={{ uri: imageUris[currentPhotoIdx] }}
              style={[styles.photoPreview, { opacity: photoFadeAnim }]}
            />
            {/* Scan line */}
            <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanY }] }]} />
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>

          <Animated.Text style={[styles.loadingMsg, { opacity: msgFadeAnim }]}>
            {LOADING_MESSAGES[loadingMsgIdx]}
          </Animated.Text>
          <Text style={styles.loadingHint}>{t.recipeResult.photosSelected(imageUris.length)}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.fullCenter, { paddingTop: insets.top }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.spinnerWrap}>
          <Animated.View style={[styles.spinnerRing, { transform: [{ rotate: spin }] }]} />
        </View>
        <Animated.Text style={[styles.loadingMsg, { opacity: msgFadeAnim }]}>
          {LOADING_MESSAGES[loadingMsgIdx]}
        </Animated.Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backCircle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.recipeResult.recipes}</Text>
        <View style={styles.recipeBadge}>
          <Text style={styles.recipeBadgeText}>{result.recipes.length}</Text>
        </View>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 16 }]}>

        {result.detectedIngredients.length > 0 && (
          <View style={styles.ingredientsSection}>
            <Text style={styles.sectionLabel}>{t.recipeResult.detectedIngredients}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tagRow}>
                {result.detectedIngredients.map((ing, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{ing}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <Text style={styles.recipesHeading}>{t.recipeResult.suggestedRecipes}</Text>

        {result.recipes.map((recipe, i) => (
          <RecipeCard key={i} recipe={recipe} />
        ))}
      </Animated.ScrollView>

      {/* Sticky bottom button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomBarInner}>
          <TouchableOpacity
            style={styles.newSearchBtn}
            onPress={() => router.replace('/')}
            activeOpacity={0.85}>
            <Text style={styles.newSearchText}>{t.recipeResult.newSearch}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <RatingPrompt visible={ratingVisible} onDismiss={handleRatingDismiss} />
    </View>
  );
}

function createStyles(C: ColorScheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    fullCenter: {
      flex: 1,
      backgroundColor: C.bg,
      alignItems: 'center',
      justifyContent: 'center',
      padding: IS_TABLET ? 80 : 40,
    },
    spinnerWrap: {
      width: IS_TABLET ? 100 : 72,
      height: IS_TABLET ? 100 : 72,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 40,
    },
    spinnerRing: {
      position: 'absolute',
      width: IS_TABLET ? 100 : 72,
      height: IS_TABLET ? 100 : 72,
      borderRadius: IS_TABLET ? 50 : 36,
      borderWidth: IS_TABLET ? 4 : 3,
      borderColor: C.border,
      borderTopColor: C.accent,
      borderRightColor: C.accent + '60',
    },
    loadingMsg: {
      fontSize: IS_TABLET ? 20 : 17,
      fontWeight: '600',
      color: C.text,
      textAlign: 'center',
      marginBottom: 10,
      letterSpacing: -0.2,
      maxWidth: 480,
    },
    loadingHint: {
      fontSize: 13,
      color: C.text3,
      textAlign: 'center',
    },
    photoWrap: {
      width: IS_TABLET ? 360 : 260,
      height: IS_TABLET ? 360 : 260,
      borderRadius: 24,
      overflow: 'hidden',
      marginBottom: 40,
      position: 'relative',
    },
    photoPreview: {
      width: '100%',
      height: '100%',
    },
    scanLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: C.accent,
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 8,
    },
    corner: {
      position: 'absolute',
      width: 22,
      height: 22,
      borderColor: C.accent,
    },
    cornerTL: {
      top: 12,
      left: 12,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderTopLeftRadius: 6,
    },
    cornerTR: {
      top: 12,
      right: 12,
      borderTopWidth: 3,
      borderRightWidth: 3,
      borderTopRightRadius: 6,
    },
    cornerBL: {
      bottom: 12,
      left: 12,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
      borderBottomLeftRadius: 6,
    },
    cornerBR: {
      bottom: 12,
      right: 12,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderBottomRightRadius: 6,
    },
    errorIcon: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: C.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: C.border,
    },
    errorTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: C.text,
      marginBottom: 10,
    },
    errorMsg: {
      fontSize: 14,
      color: C.text2,
      textAlign: 'center',
      lineHeight: 21,
      marginBottom: 28,
    },
    backBtn: {
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 30,
    },
    backBtnText: {
      color: C.text,
      fontWeight: '600',
      fontSize: 15,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: IS_TABLET ? 24 : 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      maxWidth: CONTENT_MAX_W,
      alignSelf: 'center',
      width: '100%',
    },
    backCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    backIcon: {
      fontSize: 22,
      color: C.text,
      fontWeight: '300',
      lineHeight: 26,
      marginTop: -1,
    },
    headerTitle: {
      flex: 1,
      fontSize: IS_TABLET ? 24 : 18,
      fontWeight: '700',
      color: C.text,
    },
    recipeBadge: {
      backgroundColor: C.accentLight,
      borderWidth: 1,
      borderColor: C.accent + '55',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    recipeBadgeText: {
      color: C.accent,
      fontWeight: '700',
      fontSize: 14,
    },
    scroll: {
      paddingTop: 16,
      maxWidth: CONTENT_MAX_W,
      alignSelf: 'center',
      width: '100%',
    },
    ingredientsSection: {
      marginHorizontal: IS_TABLET ? 24 : 16,
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: IS_TABLET ? 13 : 11,
      fontWeight: '700',
      color: C.text3,
      letterSpacing: 1.2,
      marginBottom: 10,
    },
    tagRow: {
      flexDirection: 'row',
      gap: 6,
    },
    tag: {
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: IS_TABLET ? 18 : 14,
      paddingVertical: IS_TABLET ? 10 : 7,
      borderRadius: 20,
    },
    tagText: {
      color: C.text2,
      fontSize: IS_TABLET ? 16 : 13,
      fontWeight: '500',
    },
    recipesHeading: {
      fontSize: IS_TABLET ? 24 : 20,
      fontWeight: '800',
      color: C.text,
      marginHorizontal: IS_TABLET ? 24 : 16,
      marginBottom: 12,
      letterSpacing: -0.3,
    },
    bottomBar: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: C.border,
      backgroundColor: C.bg,
    },
    bottomBarInner: {
      paddingHorizontal: IS_TABLET ? 28 : 16,
      maxWidth: CONTENT_MAX_W,
      alignSelf: 'center',
      width: '100%',
    },
    newSearchBtn: {
      backgroundColor: C.accent,
      borderRadius: 18,
      paddingVertical: IS_TABLET ? 22 : 18,
      alignItems: 'center',
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
    },
    newSearchText: {
      color: '#fff',
      fontSize: IS_TABLET ? 20 : 17,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
}
