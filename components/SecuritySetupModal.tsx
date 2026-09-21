import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useEffect, useRef, useState } from 'react';
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
import { useTheme } from '../context/ThemeContext';

interface SecuritySetupModalProps {
  visible: boolean;
  onComplete: () => void;
  userName?: string;
}

type SetupMethod = 'CHOICE' | 'PIN_ENTER' | 'PIN_CONFIRM' | 'BIOMETRICS_PIN_BACKUP';

export const SecuritySetupModal: React.FC<SecuritySetupModalProps> = ({
  visible,
  onComplete,
  userName = 'Passenger',
}) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [step, setStep] = useState<SetupMethod>('CHOICE');
  const [selectedMethod, setSelectedMethod] = useState<'PIN' | 'BIOMETRICS'>('PIN');
  const [firstPin, setFirstPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);
  const [biometricName, setBiometricName] = useState<string>('Biometrics');

  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Check device biometrics capability on mount
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'web') return;
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
          setHasBiometrics(true);
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricName('Face ID');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricName('Fingerprint');
          }
        }
      } catch {
        setHasBiometrics(false);
      }
    })();
  }, []);

  const triggerShake = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleChoosePin = () => {
    setSelectedMethod('PIN');
    setStep('PIN_ENTER');
    setFirstPin('');
    setConfirmPin('');
    setErrorMsg('');
  };

  const handleChooseBiometrics = async () => {
    try {
      setSelectedMethod('BIOMETRICS');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Setup ${biometricName} for SwiftBoda`,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        // Also set up a 4-digit backup PIN
        setStep('BIOMETRICS_PIN_BACKUP');
        setFirstPin('');
        setConfirmPin('');
        setErrorMsg('');
      } else {
        setErrorMsg('Biometric authentication cancelled. You can set up a 4-digit PIN instead.');
      }
    } catch {
      setErrorMsg('Biometric setup failed. Please use PIN setup.');
    }
  };

  const handleDigit = async (digit: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (step === 'PIN_ENTER' || step === 'BIOMETRICS_PIN_BACKUP') {
      if (firstPin.length >= 4) return;
      const next = firstPin + digit;
      setFirstPin(next);
      setErrorMsg('');

      if (next.length === 4) {
        setTimeout(() => {
          setStep('PIN_CONFIRM');
          setConfirmPin('');
        }, 200);
      }
    } else if (step === 'PIN_CONFIRM') {
      if (confirmPin.length >= 4) return;
      const next = confirmPin + digit;
      setConfirmPin(next);
      setErrorMsg('');

      if (next.length === 4) {
        if (next === firstPin) {
          // PINs match! Save configuration
          try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
          await finalizeSecurity(firstPin, selectedMethod);
        } else {
          triggerShake();
          setErrorMsg('PINs do not match. Please re-enter.');
          setTimeout(() => {
            setConfirmPin('');
            setFirstPin('');
            setStep(selectedMethod === 'BIOMETRICS' ? 'BIOMETRICS_PIN_BACKUP' : 'PIN_ENTER');
          }, 700);
        }
      }
    }
  };

  const handleDelete = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (step === 'PIN_ENTER' || step === 'BIOMETRICS_PIN_BACKUP') {
      if (firstPin.length > 0) setFirstPin(firstPin.slice(0, -1));
    } else if (step === 'PIN_CONFIRM') {
      if (confirmPin.length > 0) setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const finalizeSecurity = async (pinValue: string, authType: 'PIN' | 'BIOMETRICS') => {
    try {
      await AsyncStorage.setItem('@swiftboda_security_setup_done', 'true');
      await AsyncStorage.setItem('@swiftboda_app_lock_enabled', 'true');
      await AsyncStorage.setItem('@swiftboda_security_pin', pinValue || '1234');
      await AsyncStorage.setItem('@swiftboda_auth_type', authType);

      onComplete();
    } catch (e) {
      console.error('Failed to save security settings:', e);
      onComplete();
    }
  };

  if (!visible) return null;

  const currentPinLength =
    step === 'PIN_CONFIRM' ? confirmPin.length : firstPin.length;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
            backgroundColor: theme.background,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.shieldIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <Ionicons name="shield-checkmark" size={36} color="#10B981" />
          </View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Protect Your Swift<Text style={{ color: '#10B981' }}>Boda</Text>
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {step === 'CHOICE'
              ? `Hi ${userName.split(' ')[0]}, choose how you want to secure your rides, wallet, and account.`
              : step === 'PIN_ENTER'
              ? 'Create a 4-digit Security PIN'
              : step === 'PIN_CONFIRM'
              ? 'Confirm your 4-digit Security PIN'
              : `Create a 4-digit backup PIN for ${biometricName}`}
          </Text>
        </View>

        {/* STEP 1: CHOICE SCREEN */}
        {step === 'CHOICE' && (
          <View style={styles.choiceContainer}>
            {/* Option A: Biometrics */}
            {hasBiometrics && (
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: '#10B981',
                  },
                ]}
                onPress={handleChooseBiometrics}
                activeOpacity={0.85}
              >
                <View style={[styles.optionIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Ionicons
                    name={biometricName === 'Face ID' ? 'scan' : 'finger-print'}
                    size={28}
                    color="#10B981"
                  />
                </View>
                <View style={styles.optionTextBox}>
                  <View style={styles.optionTitleRow}>
                    <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                      Unlock with {biometricName}
                    </Text>
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedBadgeText}>Fastest</Text>
                    </View>
                  </View>
                  <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                    Instant, seamless unlock using your device {biometricName.toLowerCase()}.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            )}

            {/* Option B: 4-Digit PIN */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: theme.cardBorder,
                },
              ]}
              onPress={handleChoosePin}
              activeOpacity={0.85}
            >
              <View style={[styles.optionIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Ionicons name="keypad" size={26} color="#10B981" />
              </View>
              <View style={styles.optionTextBox}>
                <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                  Set 4-Digit PIN
                </Text>
                <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                  A private 4-digit numeric code to unlock your app anytime.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={styles.noticeBox}>
              <Ionicons name="lock-closed" size={16} color="#10B981" />
              <Text style={[styles.noticeText, { color: theme.textMuted }]}>
                SwiftBoda will lock immediately upon setup to ensure your account is protected right away.
              </Text>
            </View>
          </View>
        )}

        {/* STEP 2: PIN ENTRY / CONFIRMATION */}
        {step !== 'CHOICE' && (
          <View style={styles.keypadSection}>
            {/* PIN Indicators */}
            <Animated.View style={[styles.pinDotsRow, { transform: [{ translateX: shakeAnim }] }]}>
              {[0, 1, 2, 3].map((index) => {
                const isFilled = currentPinLength > index;
                return (
                  <View
                    key={index}
                    style={[
                      styles.pinDot,
                      {
                        borderColor: isFilled ? '#10B981' : theme.border,
                        backgroundColor: isFilled ? '#10B981' : 'transparent',
                      },
                    ]}
                  />
                );
              })}
            </Animated.View>

            {errorMsg ? (
              <Text style={styles.errorText}>{errorMsg}</Text>
            ) : (
              <Text style={[styles.stepHint, { color: theme.textMuted }]}>
                {step === 'PIN_ENTER' || step === 'BIOMETRICS_PIN_BACKUP'
                  ? 'Enter 4 digits'
                  : 'Re-enter to confirm'}
              </Text>
            )}

            {/* Numeric Keypad */}
            <View style={styles.keypadGrid}>
              {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['BACK', '0', 'DEL'],
              ].map((row, rIdx) => (
                <View key={rIdx} style={styles.keypadRow}>
                  {row.map((item) => {
                    if (item === 'BACK') {
                      return (
                        <TouchableOpacity
                          key={item}
                          style={styles.keypadKeyEmpty}
                          onPress={() => {
                            setStep('CHOICE');
                            setFirstPin('');
                            setConfirmPin('');
                            setErrorMsg('');
                          }}
                        >
                          <Ionicons name="arrow-back" size={20} color={theme.textMuted} />
                        </TouchableOpacity>
                      );
                    }
                    if (item === 'DEL') {
                      return (
                        <TouchableOpacity
                          key={item}
                          style={styles.keypadKeyEmpty}
                          onPress={handleDelete}
                        >
                          <Ionicons name="backspace-outline" size={24} color={theme.textPrimary} />
                        </TouchableOpacity>
                      );
                    }
                    return (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.keypadKey,
                          {
                            backgroundColor: theme.isDark ? '#162031' : '#E2E8F0',
                          },
                        ]}
                        onPress={() => handleDigit(item)}
                        activeOpacity={0.65}
                      >
                        <Text style={[styles.keypadDigit, { color: theme.textPrimary }]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
  },
  shieldIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  choiceContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 14,
    elevation: 3,
  },
  optionIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextBox: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  recommendedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendedBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  optionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  keypadSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  stepHint: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 28,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 28,
  },
  keypadGrid: {
    width: '100%',
    maxWidth: 320,
    gap: 14,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  keypadKey: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  keypadKeyEmpty: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadDigit: {
    fontSize: 26,
    fontWeight: '700',
  },
});
