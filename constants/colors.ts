export type ColorScheme = {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  text2: string;
  text3: string;
  accent: string;
  accentLight: string;
  accentGlow: string;
  green: string;
  yellow: string;
  red: string;
  white: string;
  overlay: string;
};

export const darkColors: ColorScheme = {
  bg: '#0D0D0D',
  surface: '#1C1C1E',
  surface2: '#2C2C2E',
  border: '#3A3A3C',
  text: '#F5F5F7',
  text2: '#AEAEB2',
  text3: '#636366',
  accent: '#FF6B2B',
  accentLight: 'rgba(255,107,43,0.15)',
  accentGlow: 'rgba(255,107,43,0.35)',
  green: '#30D158',
  yellow: '#FFD60A',
  red: '#FF453A',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.6)',
};

export const lightColors: ColorScheme = {
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  surface2: '#F2F2F7',
  border: '#E5E5EA',
  text: '#1C1C1E',
  text2: '#636366',
  text3: '#AEAEB2',
  accent: '#FF6B2B',
  accentLight: 'rgba(255,107,43,0.12)',
  accentGlow: 'rgba(255,107,43,0.25)',
  green: '#34C759',
  yellow: '#FF9500',
  red: '#FF3B30',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.4)',
};

// Legacy export — camera screen keeps dark styling regardless of theme
export const C = darkColors;
