import React, { createContext, useContext } from 'react';
import { ColorScheme, lightColors } from '@/constants/colors';

interface ThemeContextValue {
  colors: ColorScheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ colors: lightColors, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
