import { Platform } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ActiveTheme = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  warning: string;
  background: string;
  surface: string;
  headerBg: string;
  surfaceElevated: string;
  surfaceActive: string;
  border: string;
  borderFocus: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
  badgeBg: string;
  badgeBorder: string;
  sosRed: string;
  sosRedSurface: string;
  isDark: boolean;
  // Navigation tab bar
  tabBarBg: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export const DarkThemeColors: ThemeColors = {
  primary: '#10B981',
  primaryDark: '#059669',
  secondary: '#F59E0B',
  warning: '#F59E0B',
  background: '#070A0F',
  surface: '#0E141F',
  headerBg: '#0E141F',
  surfaceElevated: '#162031',
  surfaceActive: '#1E293B',
  border: 'rgba(255, 255, 255, 0.08)',
  borderFocus: '#10B981',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  cardBg: '#0E141F',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  inputBg: '#090D16',
  inputBorder: 'rgba(255, 255, 255, 0.12)',
  badgeBg: 'rgba(16, 185, 129, 0.12)',
  badgeBorder: 'rgba(16, 185, 129, 0.3)',
  sosRed: '#EF4444',
  sosRedSurface: 'rgba(239, 68, 68, 0.15)',
  isDark: true,
  tabBarBg: '#0E141F',
  tabBarBorder: 'rgba(255, 255, 255, 0.08)',
  tabBarActive: '#10B981',
  tabBarInactive: '#64748B',
};

export const LightThemeColors: ThemeColors = {
  primary: '#059669',
  primaryDark: '#047857',
  secondary: '#D97706',
  warning: '#D97706',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  headerBg: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  surfaceActive: '#E2E8F0',
  border: 'rgba(0, 0, 0, 0.08)',
  borderFocus: '#059669',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  cardBg: '#FFFFFF',
  cardBorder: 'rgba(0, 0, 0, 0.08)',
  inputBg: '#F1F5F9',
  inputBorder: 'rgba(0, 0, 0, 0.12)',
  badgeBg: 'rgba(5, 150, 105, 0.12)',
  badgeBorder: 'rgba(5, 150, 105, 0.3)',
  sosRed: '#DC2626',
  sosRedSurface: 'rgba(220, 38, 38, 0.12)',
  isDark: false,
  tabBarBg: '#FFFFFF',
  tabBarBorder: 'rgba(0, 0, 0, 0.08)',
  tabBarActive: '#059669',
  tabBarInactive: '#64748B',
};

// Backward-compatible Colors export for any components using old shape
export const Colors = {
  light: {
    text: LightThemeColors.textPrimary,
    background: LightThemeColors.background,
    tint: LightThemeColors.primary,
    icon: LightThemeColors.textSecondary,
    tabIconDefault: LightThemeColors.tabBarInactive,
    tabIconSelected: LightThemeColors.tabBarActive,
  },
  dark: {
    text: DarkThemeColors.textPrimary,
    background: DarkThemeColors.background,
    tint: DarkThemeColors.primary,
    icon: DarkThemeColors.textSecondary,
    tabIconDefault: DarkThemeColors.tabBarInactive,
    tabIconSelected: DarkThemeColors.tabBarActive,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

