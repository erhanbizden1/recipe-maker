import { useFocusEffect } from 'expo-router';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback, useMemo } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_BASE_HEIGHT } from '@/components/custom-tab-bar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ColorScheme } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { ThemePref, useTheme } from '@/contexts/theme';
import { Language, LANGUAGE_LABELS } from '@/lib/i18n';
import { CONTENT_MAX_W, IS_TABLET } from '@/lib/responsive';

// TODO: Gerçek URL'lerle değiştir
const APP_STORE_URL = 'https://apps.apple.com/app/idYOUR_APP_ID?action=write-review';
const PLAY_STORE_URL = 'market://details?id=YOUR_PACKAGE_NAME';
const PRIVACY_POLICY_URL = 'https://yoursite.com/privacy';
const TERMS_URL = 'https://yoursite.com/terms';

const THEME_PREFS: ThemePref[] = ['system', 'light', 'dark'];
const LANGUAGES: Language[] = ['en', 'fr', 'de', 'pt', 'es', 'tr'];

function openURL(url: string) {
  Linking.openURL(url).catch(() => {});
}

function handleRate() {
  openURL(Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL);
}

export default function SettingsScreen() {
  const { colors: C, pref, setPref, isDark } = useTheme();

  useFocusEffect(useCallback(() => {
    setStatusBarStyle(isDark ? 'light' : 'dark');
  }, [isDark]));
  const { t, language, setLanguage } = useLanguage();
  const styles = useMemo(() => createStyles(C), [C]);
  const insets = useSafeAreaInsets();
  const bottomPad = TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, 12);

  const themeLabels: Record<ThemePref, string> = {
    system: t.settings.system,
    light: t.settings.light,
    dark: t.settings.dark,
  };

  async function handleShare() {
    try {
      await Share.share({ message: t.settings.shareMessage });
    } catch {}
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Fixed header */}
      <View style={styles.headerWrap}>
        <View style={[styles.header, { maxWidth: CONTENT_MAX_W, alignSelf: 'center', width: '100%' }]}>
          <Text style={styles.title}>{t.settings.title}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 24 }}>
        <View style={styles.inner}>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t.settings.appearance}</Text>
        <View style={styles.card}>
          <View style={styles.linkRow}>
            <View style={styles.rowIcon}>
              <IconSymbol name="moon.fill" size={16} color={C.accent} />
            </View>
            <Text style={styles.rowLabel}>{t.settings.theme}</Text>
          </View>
          <View style={styles.segmented}>
            {THEME_PREFS.map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.segment, pref === value && styles.segmentActive]}
                onPress={() => setPref(value)}
                activeOpacity={0.75}>
                <Text style={[styles.segmentText, pref === value && styles.segmentTextActive]}>
                  {themeLabels[value]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Language — disabled for now
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t.settings.language}</Text>
        <View style={styles.card}>
          <View style={styles.langHeaderRow}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(90,120,255,0.12)' }]}>
              <IconSymbol name="globe" size={16} color="#5A78FF" />
            </View>
            <Text style={styles.rowLabel}>{t.settings.appLanguage}</Text>
          </View>
          <View style={styles.langGrid}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langChip, language === lang && styles.langChipActive]}
                onPress={() => setLanguage(lang)}
                activeOpacity={0.75}>
                <Text style={[styles.langChipText, language === lang && styles.langChipTextActive]}>
                  {LANGUAGE_LABELS[lang]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      */}

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t.settings.support}</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.linkRow} onPress={handleRate} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(255,214,0,0.15)' }]}>
              <IconSymbol name="star.fill" size={16} color={C.yellow} />
            </View>
            <Text style={styles.rowLabel}>{t.settings.rateApp}</Text>
            <IconSymbol name="chevron.right" size={14} color={C.text3} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.linkRow} onPress={handleShare} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(48,209,88,0.15)' }]}>
              <IconSymbol name="square.and.arrow.up" size={16} color={C.green} />
            </View>
            <Text style={styles.rowLabel}>{t.settings.shareApp}</Text>
            <IconSymbol name="chevron.right" size={14} color={C.text3} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t.settings.legal}</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => openURL(PRIVACY_POLICY_URL)}
            activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(10,132,255,0.15)' }]}>
              <IconSymbol name="lock.fill" size={16} color="#0A84FF" />
            </View>
            <Text style={styles.rowLabel}>{t.settings.privacyPolicy}</Text>
            <IconSymbol name="chevron.right" size={14} color={C.text3} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => openURL(TERMS_URL)}
            activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: 'rgba(255,107,43,0.15)' }]}>
              <IconSymbol name="doc.text.fill" size={16} color={C.accent} />
            </View>
            <Text style={styles.rowLabel}>{t.settings.termsOfUse}</Text>
            <IconSymbol name="chevron.right" size={14} color={C.text3} />
          </TouchableOpacity>
        </View>
      </View>

        </View>{/* inner */}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(C: ColorScheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    scroll: {
      flex: 1,
    },
    inner: {
      maxWidth: CONTENT_MAX_W,
      alignSelf: 'center',
      width: '100%',
    },
    headerWrap: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.border,
    },
    header: {
      paddingHorizontal: IS_TABLET ? 24 : 20,
      paddingVertical: 16,
    },
    title: {
      fontSize: IS_TABLET ? 32 : 28,
      fontWeight: '800',
      color: C.text,
      letterSpacing: -0.5,
    },
    section: {
      marginTop: 28,
      paddingHorizontal: IS_TABLET ? 24 : 16,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: C.text3,
      letterSpacing: 1.2,
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: C.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
    },
    langHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: 10,
      paddingBottom: 8,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: C.border,
      marginLeft: 44,
    },
    rowIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: C.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: C.text,
      flex: 1,
    },
    segmented: {
      flexDirection: 'row',
      backgroundColor: C.surface2,
      borderRadius: 12,
      padding: 3,
      marginBottom: 6,
    },
    segment: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 10,
      alignItems: 'center',
    },
    segmentActive: {
      backgroundColor: C.accent,
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: '600',
      color: C.text3,
    },
    segmentTextActive: {
      color: C.white,
    },
    langGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingBottom: 10,
    },
    langChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: C.surface2,
      borderWidth: 1,
      borderColor: C.border,
    },
    langChipActive: {
      backgroundColor: C.accent,
      borderColor: C.accent,
    },
    langChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: C.text2,
    },
    langChipTextActive: {
      color: '#fff',
    },
  });
}
