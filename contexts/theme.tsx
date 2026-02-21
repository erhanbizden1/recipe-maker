import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ColorScheme, darkColors, lightColors } from '@/constants/colors';

export type ThemePref = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  colors: ColorScheme;
  isDark: boolean;
  pref: ThemePref;
  setPref: (pref: ThemePref) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  isDark: true,
  pref: 'system',
  setPref: () => {},
});

const STORAGE_KEY = 'theme_pref';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setPrefState(v);
    });
  }, []);

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    AsyncStorage.setItem(STORAGE_KEY, p);
  }, []);

  const isDark = useMemo(() => {
    if (pref === 'dark') return true;
    if (pref === 'light') return false;
    return systemScheme === 'dark';
  }, [pref, systemScheme]);

  const colors = isDark ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, isDark, pref, setPref }),
    [colors, isDark, pref, setPref]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
