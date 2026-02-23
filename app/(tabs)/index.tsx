import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/language';
import { useUI } from '@/contexts/ui';
import { CONTENT_MAX_W, IS_TABLET } from '@/lib/responsive';


const BG = require('@/assets/images/bg.jpg');
const ACCENT = '#FF6B2B';

// Use screen dimensions (not window) to include tab bar + home indicator area
const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('screen');

export default function HomeScreen() {
  const router = useRouter();
  const { openPaywall, isPremium } = useUI();
  const { t } = useLanguage();

  useFocusEffect(useCallback(() => {
    setStatusBarStyle('light');
  }, []));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {/* Full-screen bg image — extends below content area into tab bar region */}
      <Image
        source={BG}
        style={styles.bgImage}
        resizeMode="cover"
      />

      {/* Full-screen overlay */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.content} edges={['top']}>
        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <View style={styles.topBarCenter}>
            <Text style={styles.appName}>Recipe Maker</Text>
            <Text style={styles.tagline}>{t.home.tagline}</Text>
          </View>
          <TouchableOpacity style={styles.proBtn} activeOpacity={isPremium ? 1 : 0.8} onPress={isPremium ? undefined : openPaywall}>
            <LinearGradient
              colors={[ACCENT, '#FF8C42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.proBtnGradient}
            >
              <Ionicons name={isPremium ? 'checkmark' : 'flash'} size={13} color="#fff" />
              <Text style={styles.proBtnText}>Pro</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Center Content ── */}
        <View style={styles.centerContent}>
          {/* ── Action Cards ── */}
          <View style={styles.cards}>
            {/* Primary: Scan */}
            <TouchableOpacity
              style={styles.primaryCard}
              onPress={() => router.push('/camera')}
              activeOpacity={0.88}>
              <View style={styles.primaryCardInner}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name="camera" size={IS_TABLET ? 36 : 28} color="#fff" />
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
              onPress={() => router.push('/ingredients')}
              activeOpacity={0.88}>
              <View style={styles.secondaryCardInner}>
                <View style={styles.cardIconWrapSecondary}>
                  <Ionicons name="create" size={IS_TABLET ? 30 : 24} color={ACCENT} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitleSecondary}>{t.home.typeTitle}</Text>
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
    backgroundColor: '#000',
  },
  // Absolutely positioned — full screen height, extends behind tab bar
  bgImage: {
    position: 'absolute',
    width: SCREEN_W,
    height: SCREEN_H,
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    width: SCREEN_W,
    height: SCREEN_H,
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  content: {
    flex: 1,
    paddingHorizontal: IS_TABLET ? 0 : 20,
    paddingBottom: 20,
    maxWidth: CONTENT_MAX_W,
    alignSelf: 'center',
    width: '100%',
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingHorizontal: IS_TABLET ? 32 : 0,
  },
  topBarCenter: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
    marginTop: -6,
  },
  appName: {
    fontSize: IS_TABLET ? 44 : 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: IS_TABLET ? 18 : 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    fontWeight: '500',
  },
  proBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
  },
  proBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  proBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // ── Center Content ──
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },

  // ── Cards ──
  cards: {
    gap: 12,
    paddingHorizontal: IS_TABLET ? 32 : 0,
  },
  primaryCard: {
    backgroundColor: ACCENT,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  primaryCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: IS_TABLET ? 28 : 22,
    gap: IS_TABLET ? 20 : 16,
  },
  cardIconWrap: {
    width: IS_TABLET ? 64 : 52,
    height: IS_TABLET ? 64 : 52,
    borderRadius: IS_TABLET ? 20 : 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: IS_TABLET ? 22 : 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: IS_TABLET ? 16 : 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: IS_TABLET ? 22 : 18,
  },
  cardArrow: {
    width: IS_TABLET ? 40 : 32,
    height: IS_TABLET ? 40 : 32,
    borderRadius: IS_TABLET ? 20 : 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deco: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decoTR: { width: 100, height: 100, top: -30, right: -20 },
  decoBL: { width: 70, height: 70, bottom: -20, left: 60 },

  secondaryCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  secondaryCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: IS_TABLET ? 28 : 22,
    gap: IS_TABLET ? 20 : 16,
  },
  cardIconWrapSecondary: {
    width: IS_TABLET ? 64 : 52,
    height: IS_TABLET ? 64 : 52,
    borderRadius: IS_TABLET ? 20 : 16,
    backgroundColor: 'rgba(255,107,43,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitleSecondary: {
    fontSize: IS_TABLET ? 22 : 18,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.2,
  },
  cardSubSecondary: {
    fontSize: IS_TABLET ? 16 : 13,
    color: '#636366',
    lineHeight: IS_TABLET ? 22 : 18,
    marginTop: 4,
  },
  cardArrowSecondary: {
    width: IS_TABLET ? 40 : 32,
    height: IS_TABLET ? 40 : 32,
    borderRadius: IS_TABLET ? 20 : 16,
    backgroundColor: 'rgba(255,107,43,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,43,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  statsIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,43,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyStats: {
    alignItems: 'center',
  },
  emptyStatsText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.62)',
  },
});
