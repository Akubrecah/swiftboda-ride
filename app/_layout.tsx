import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import 'react-native-reanimated';
import { Buffer } from 'buffer';
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
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Whenever app transitions from active to background or inactive, lock immediately
      if (
        appState.current.match(/active/) &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        setIsLocked(true);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <>
      <StackScreenLayout />
      <AppLockModal
        visible={isLocked}
        onUnlock={() => setIsLocked(false)}
        userName={currentUser?.fullName || 'SwiftBoda Passenger'}
      />
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
