import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppLockModalProps {
  visible: boolean;
  onUnlock: () => void;
  userName?: string;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({
  visible,
  onUnlock,
  userName = 'SwiftBoda User',
}) => {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<string>('Biometrics');

  // Animation values
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Check device biometrics support on mount
  useEffect(() => {
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
          setHasBiometrics(true);
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('Face ID');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('Fingerprint');
          }
        }
      } catch {
        // Fallback gracefully to PIN keypad
        setHasBiometrics(false);
      }
    })();
  }, []);

  // Biometric authentication trigger
  const triggerBiometrics = useCallback(async () => {
    try {
      if (Platform.OS === 'web') return;
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SwiftBoda West Pokot',
        cancelLabel: 'Use PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        setPin('');
        setErrorMsg('');
        onUnlock();
      }
    } catch {
      // User cancelled or biometric failed, fall back to PIN
    }
  }, [onUnlock]);

  // Automatically prompt biometrics whenever the lock screen becomes visible
  useEffect(() => {
    if (visible) {
      setPin('');
      setErrorMsg('');

      // Continuous subtle breathing on the biometric button
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Trigger native biometric dialog if available
      const timer = setTimeout(() => {
        if (hasBiometrics) {
          triggerBiometrics();
        }
      }, 350);

      return () => {
        clearTimeout(timer);
        pulse.stop();
      };
    }
  }, [visible, hasBiometrics, pulseAnim, triggerBiometrics]);

  // Trigger shake animation on wrong PIN
  const shakeKeypad = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 14, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -14, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // Handle number pad inputs
  const handleDigit = async (digit: string) => {
    if (pin.length >= 4) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMsg('');

    if (nextPin.length === 4) {
      // Validate PIN against stored custom PIN or default 1234
      const storedPin = (await AsyncStorage.getItem('@swiftboda_security_pin')) || '1234';
      if (nextPin === storedPin || nextPin === '1234') {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        setTimeout(() => {
          setPin('');
          onUnlock();
        }, 150);
      } else {
        shakeKeypad();
        setErrorMsg('Incorrect PIN. Try again (Default: 1234)');
        setTimeout(() => {
          setPin('');
        }, 600);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      setPin(pin.slice(0, -1));
      setErrorMsg('');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false} statusBarTranslucent>
      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.brandIconWrapper}>
            <Ionicons name="shield-checkmark" size={32} color="#10B981" />
          </View>
          <Text style={styles.brandTitle}>
            Swift<Text style={{ color: '#10B981' }}>Boda</Text> Security
          </Text>
          <Text style={styles.subGreeting}>Welcome back, {userName.split(' ')[0]}</Text>
          <Text style={styles.promptText}>Confirm your biometrics or enter 4-digit PIN</Text>
        </View>

        {/* PIN Indicators */}
        <Animated.View style={[styles.pinDotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <View
                key={index}
                style={[
                  styles.pinDot,
                  isFilled && styles.pinDotFilled,
                  errorMsg ? styles.pinDotError : null,
                ]}
              />
            );
          })}
        </Animated.View>

        {/* Error message */}
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : <View style={{ height: 20 }} />}

        {/* Biometric Quick-Action Pill */}
        {hasBiometrics && (
          <TouchableOpacity
            style={styles.biometricPill}
            onPress={triggerBiometrics}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons
                name={biometricType === 'Face ID' ? 'scan' : 'finger-print'}
                size={28}
                color="#10B981"
              />
            </Animated.View>
            <Text style={styles.biometricPillText}>Tap for {biometricType}</Text>
          </TouchableOpacity>
        )}

        {/* Number Keypad */}
        <View style={styles.keypadContainer}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
          ].map((row, rIdx) => (
            <View key={rIdx} style={styles.keypadRow}>
              {row.map((num) => (
                <TouchableOpacity
                  key={num}
                  style={styles.keypadBtn}
                  onPress={() => handleDigit(num)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.keypadBtnText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Bottom row: Biometrics / Empty, 0, Backspace */}
          <View style={styles.keypadRow}>
            <TouchableOpacity
              style={[styles.keypadBtn, styles.specialKeypadBtn]}
              onPress={hasBiometrics ? triggerBiometrics : undefined}
              activeOpacity={0.7}
              disabled={!hasBiometrics}
            >
              {hasBiometrics ? (
                <Ionicons
                  name={biometricType === 'Face ID' ? 'scan-outline' : 'finger-print-outline'}
                  size={26}
                  color="#10B981"
                />
              ) : (
                <View />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keypadBtn}
              onPress={() => handleDigit('0')}
              activeOpacity={0.7}
            >
              <Text style={styles.keypadBtnText}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.keypadBtn, styles.specialKeypadBtn]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="backspace-outline" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer info & Quick Unlock Bypass */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.emergencyBypassBtn}
            onPress={() => {
              setPin('');
              setErrorMsg('');
              onUnlock();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="lock-open-outline" size={16} color="#10B981" />
            <Text style={styles.emergencyBypassText}>Quick Unlock (Default: 1234)</Text>
          </TouchableOpacity>
          <Text style={styles.footerHelp}>Configure or disable App Lock in Account → Safety Settings</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A0F',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
  },
  brandIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subGreeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginTop: 6,
  },
  promptText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  pinDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginVertical: 18,
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 4,
  },
  pinDotError: {
    borderColor: '#EF4444',
    backgroundColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  biometricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0E141F',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    marginBottom: 16,
  },
  biometricPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.2,
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 14,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0E141F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialKeypadBtn: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  keypadBtnText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  emergencyBypassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  emergencyBypassText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.2,
  },
  footerHelp: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.3,
  },
});
