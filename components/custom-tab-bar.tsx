import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ColorScheme } from '@/constants/colors';
import { useLanguage } from '@/contexts/language';
import { useTheme } from '@/contexts/theme';
import { useUI } from '@/contexts/ui';
import { IS_TABLET } from '@/lib/responsive';

const TAB_ICONS = {
  recipes: 'fork.knife' as const,
  index: 'house.fill' as const,
  settings: 'gearshape.fill' as const,
};

// Pill height + wrapper paddingTop — used by screens for bottom padding
export const TAB_BAR_BASE_HEIGHT = 82;

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C, isDark), [C, isDark]);
  const { paywallOpen } = useUI();
  const { t } = useLanguage();

  const TABS = [
    { name: 'recipes', label: t.tabs.recipes, icon: TAB_ICONS.recipes },
    { name: 'index', label: t.tabs.home, icon: TAB_ICONS.index },
    { name: 'settings', label: t.tabs.settings, icon: TAB_ICONS.settings },
  ];

  if (paywallOpen) return null;
  const activeRouteName = state.routes[state.index]?.name ?? '';
  const bottomPad = Math.max(insets.bottom, 12);

  function navigate(name: string) {
    if (activeRouteName === name) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(name);
  }

  return (
    // position: absolute so the tab bar floats over content
    // → screens fill full height, home bg extends behind tab bar
    <View style={[styles.wrapper, { paddingBottom: bottomPad }]}>
      <View style={styles.pill}>
        {TABS.map((tab) => {
          const active = activeRouteName === tab.name;
          const isHome = tab.name === 'index';

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => navigate(tab.name)}
              activeOpacity={0.75}>
              {isHome ? (
                <View style={[styles.homeBtn, active && styles.homeBtnActive]}>
                  <IconSymbol
                    name={tab.icon}
                    size={24}
                    color={active ? '#fff' : C.text3}
                  />
                </View>
              ) : (
                <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                  <IconSymbol
                    name={tab.icon}
                    size={20}
                    color={active ? C.accent : C.text3}
                  />
                </View>
              )}
              <Text style={[styles.label, active && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(C: ColorScheme, isDark: boolean) {
  return StyleSheet.create({
    wrapper: {
      // Float over content — content fills full screen behind us
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 24,
      paddingTop: 10,
      backgroundColor: 'transparent',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.surface,
      borderRadius: 36,
      paddingVertical: 10,
      paddingHorizontal: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.5 : 0.14,
      shadowRadius: 24,
      elevation: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: C.border,
      maxWidth: IS_TABLET ? 380 : undefined,
      alignSelf: IS_TABLET ? 'center' : undefined,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 2,
    },
    iconWrap: {
      width: 44,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapActive: {
      backgroundColor: C.accentLight,
    },
    homeBtn: {
      width: 52,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.surface2,
      borderWidth: 1,
      borderColor: C.border,
    },
    homeBtnActive: {
      backgroundColor: C.accent,
      borderColor: C.accent,
      shadowColor: C.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 10,
    },
    label: {
      fontSize: 10,
      fontWeight: '600',
      color: C.text3,
      letterSpacing: 0.1,
    },
    labelActive: {
      color: C.accent,
    },
  });
}
