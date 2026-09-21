import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';
import {
  ActiveTheme,
  DarkThemeColors,
  LightThemeColors,
  ThemeColors,
  ThemeMode,
} from '../constants/theme';

interface ThemeContextType {
  themeMode: ThemeMode;
  activeTheme: ActiveTheme;
  theme: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const THEME_STORAGE_KEY = '@swiftboda_theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Determine active theme based on user preference or system
  const resolveActiveTheme = (mode: ThemeMode, sysScheme: ColorSchemeName): ActiveTheme => {
    if (mode === 'light') return 'light';
    if (mode === 'dark') return 'dark';
    return sysScheme === 'light' ? 'light' : 'dark';
  };

  const [activeTheme, setActiveTheme] = useState<ActiveTheme>(
    resolveActiveTheme('system', systemColorScheme)
  );

  // Hydrate stored theme mode on startup
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemeModeState(stored);
          setActiveTheme(resolveActiveTheme(stored, Appearance.getColorScheme()));
        } else {
          setActiveTheme(resolveActiveTheme('system', Appearance.getColorScheme()));
        }
      } catch (err) {
        console.warn('Failed loading stored theme mode', err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Listen to system color scheme changes when in 'system' mode
  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === 'system') {
        setActiveTheme(colorScheme === 'light' ? 'light' : 'dark');
      }
    });

    return () => {
      listener.remove();
    };
  }, [themeMode]);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      const nextActive = resolveActiveTheme(mode, Appearance.getColorScheme());
      setActiveTheme(nextActive);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (err) {
      console.warn('Failed saving theme mode to storage', err);
    }
  };

  const currentTheme = activeTheme === 'light' ? LightThemeColors : DarkThemeColors;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        activeTheme,
        theme: currentTheme,
        setThemeMode,
        isDark: activeTheme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
