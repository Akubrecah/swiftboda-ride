import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLockModal } from '../components/AppLockModal';
import { SecuritySetupModal } from '../components/SecuritySetupModal';
import { SwiftBodaLoader } from '../components/SwiftBodaLoader';
import { SwiftBodaProvider, useSwiftBoda } from '../context/SwiftBodaContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { DarkThemeColors, LightThemeColors } from '../constants/theme';

// Keep native splash screen visible while React Native initializes
SplashScreen.preventAutoHideAsync().catch(() => {});

// Polyfill Buffer globally for Hermes / React Native runtime
if (typeof (global as any).Buffer === 'undefined') {
  (global as any).Buffer = Buffer;
}

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

const NavigationDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: DarkThemeColors.primary,
    background: DarkThemeColors.background,
    card: DarkThemeColors.surface,
    text: DarkThemeColors.textPrimary,
    border: DarkThemeColors.border,
  },
};

const NavigationLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: LightThemeColors.primary,
    background: LightThemeColors.background,
    card: LightThemeColors.surface,
    text: LightThemeColors.textPrimary,
    border: LightThemeColors.border,
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.rootGestureContainer}>
      <ThemeProvider>
        <SwiftBodaProvider>
          <RootLayoutWithTheme />
        </SwiftBodaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutWithTheme() {
  const { activeTheme } = useTheme();
  const navTheme = activeTheme === 'dark' ? NavigationDarkTheme : NavigationLightTheme;

  return (
    <NavThemeProvider value={navTheme}>
      <RootNavigationWithLock />
      <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

function RootNavigationWithLock() {
  const { currentUser, isHydrating } = useSwiftBoda();
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showSecuritySetup, setShowSecuritySetup] = useState<boolean>(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Check if first-time security setup has been completed once hydration finishes
  useEffect(() => {
    if (isHydrating) return;
    (async () => {
      try {
        const setupDone = await AsyncStorage.getItem('@swiftboda_security_setup_done');
        if (setupDone !== 'true') {
          setShowSecuritySetup(true);
        } else {
          // If setup was already done, verify if app lock is enabled
          const isLockEnabled = await AsyncStorage.getItem('@swiftboda_app_lock_enabled');
          if (isLockEnabled === 'true') {
            setIsLocked(true);
          }
        }
      } catch {
        // Safe fallback
      }
    })();
  }, [isHydrating]);

  useEffect(() => {
    const checkLockOnResume = async (nextAppState: AppStateStatus) => {
      try {
        // Only lock if user has explicitly enabled App Lock in settings
        const isLockEnabled = await AsyncStorage.getItem('@swiftboda_app_lock_enabled');
        if (isLockEnabled === 'true') {
          // Lock when transitioning from active to background
          if (appState.current === 'active' && nextAppState === 'background') {
            setIsLocked(true);
          }
        }
      } catch {
        // Safe fallback - avoid locking if storage access fails
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', checkLockOnResume);

    return () => {
      subscription.remove();
    };
  }, []);

  // Dismiss native splash screen once React Native has mounted and loader is ready
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Display startup loader while initial session & settings are hydrating
  if (isHydrating) {
    return (
      <View style={styles.hydrationContainer}>
        <SwiftBodaLoader
          visible={true}
          message="Starting SwiftBoda..."
          subMessage="West Pokot Pilot • Makutano & Kapenguria"
          size="large"
        />
      </View>
    );
  }

  return (
    <>
      <StackScreenLayout />
      {showSecuritySetup && (
        <SecuritySetupModal
          visible={showSecuritySetup}
          onComplete={() => {
            setShowSecuritySetup(false);
            setIsLocked(true);
          }}
          userName={currentUser?.fullName || 'SwiftBoda Passenger'}
        />
      )}
      {isLocked && !showSecuritySetup && (
        <AppLockModal
          visible={isLocked}
          onUnlock={() => setIsLocked(false)}
          userName={currentUser?.fullName || 'SwiftBoda Passenger'}
        />
      )}
    </>
  );
}

function StackScreenLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Swift Boda Details' }} />
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  rootGestureContainer: {
    flex: 1,
  },
  hydrationContainer: {
    flex: 1,
    backgroundColor: '#070A0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
