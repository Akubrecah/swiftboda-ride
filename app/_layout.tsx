import 'react-native-reanimated';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLockModal } from '../components/AppLockModal';
import { SwiftBodaProvider, useSwiftBoda } from '../context/SwiftBodaContext';

// Polyfill Buffer globally for Hermes / React Native runtime
if (typeof (global as any).Buffer === 'undefined') {
  (global as any).Buffer = Buffer;
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <SwiftBodaProvider>
      <ThemeProvider value={DarkTheme}>
        <RootNavigationWithLock />
        <StatusBar style="light" />
      </ThemeProvider>
    </SwiftBodaProvider>
  );
}

function RootNavigationWithLock() {
  const { currentUser } = useSwiftBoda();
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const checkLockOnResume = async (nextAppState: AppStateStatus) => {
      // Only lock if user has explicitly enabled App Lock in settings
      const isLockEnabled = await AsyncStorage.getItem('@swiftboda_app_lock_enabled');
      if (isLockEnabled === 'true') {
        // Only lock when transitioning from active to background (leaving the app)
        // NEVER lock on 'inactive' because native dialogs, keyboards, and biometrics trigger 'inactive'
        if (appState.current.match(/active/) && nextAppState === 'background') {
          setIsLocked(true);
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', checkLockOnResume);

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <>
      <StackScreenLayout />
      {isLocked && (
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
    </Stack>
  );
}
