import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSwiftBoda } from '../context/SwiftBodaContext';
import { SwiftBodaLoader } from './SwiftBodaLoader';

const { width, height } = Dimensions.get('window');

const UBER_ONBOARDING_SLIDES = [
  {
    title: 'Ride safely across Nairobi',
    subtitle: 'Vetted riders with sanitized helmets, real-time GPS tracking, 4-digit ride PIN, and 24/7 emergency SOS support.',
    icon: 'shield-checkmark',
    tag: 'SAFETY FIRST',
    image: require('../assets/images/onboarding_2.png'),
  },
  {
    title: 'Beat traffic in minutes',
    subtitle: 'Skip the highway gridlock with quick boda pickups. Upfront transparent fares with zero hidden charges.',
    icon: 'flash',
    tag: 'FAST & RELIABLE',
    image: require('../assets/images/onboarding_3.png'),
  },
  {
    title: 'Instant cashless M-Pesa',
    subtitle: 'Seamless contactless STK push payments directly to your Safaricom M-Pesa. Simple, safe, and instant.',
    icon: 'phone-portrait',
    tag: 'CASHLESS PAYMENTS',
    image: require('../assets/images/onboarding_mpesa.jpg'),
  },
];

interface AuthModalProps {
  visible: boolean;
  onClose?: () => void;
  forceShowOnboarding?: boolean;
}

export default function AuthModal({ visible, onClose, forceShowOnboarding }: AuthModalProps) {
  const insets = useSafeAreaInsets();
  const {
    sendOtp,
    verifyOtpAndLogin,
    registerUser,
    pendingOtpPhone,
    hasSeenOnboarding,
    completeOnboarding,
  } = useSwiftBoda();

  // Navigation Steps: 'ONBOARDING' | 'AUTH_FORM' | 'OTP_VERIFY'
  const [step, setStep] = useState<'ONBOARDING' | 'AUTH_FORM' | 'OTP_VERIFY'>('AUTH_FORM');
  const [slideIndex, setSlideIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'RIDER' | 'DRIVER'>('RIDER');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('712345001');
  const [email, setEmail] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('KMC 123A');
  const [vehicleModel, setVehicleModel] = useState('TVS HLX 150');

  // OTP State
  const [otpCode, setOtpCode] = useState('');

  // Branded Loading State matching Logo
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMessage, setAuthMessage] = useState('Connecting to SwiftBoda...');
  const [authSubMessage, setAuthSubMessage] = useState('');

  // Synchronize step based on onboarding status
  useEffect(() => {
    if (forceShowOnboarding || !hasSeenOnboarding) {
      setStep('ONBOARDING');
    } else {
      setStep('AUTH_FORM');
    }
  }, [hasSeenOnboarding, forceShowOnboarding]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index >= 0 && index < UBER_ONBOARDING_SLIDES.length && index !== slideIndex) {
      setSlideIndex(index);
    }
  };

  const handleNextSlide = () => {
    if (slideIndex < UBER_ONBOARDING_SLIDES.length - 1) {
      const nextIdx = slideIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIdx * width, animated: true });
      setSlideIndex(nextIdx);
    } else {
      completeOnboarding();
      setStep('AUTH_FORM');
    }
  };

  const handleSkipOnboarding = () => {
    completeOnboarding();
    setStep('AUTH_FORM');
  };

  const formattedPhone = phoneNumber.startsWith('+254')
    ? phoneNumber
    : `+254${phoneNumber.replace(/^0+/, '')}`;

  const handleSendOtp = () => {
    const rawNumber = phoneNumber.trim().replace(/^0+/, '');
    if (!rawNumber || rawNumber.length < 9) {
      Alert.alert('Phone Number Required', 'Please enter a valid Safaricom / Airtel phone number (e.g. 712 345 678).');
      return;
    }

    if (isSignUp) {
      if (!fullName.trim()) {
        Alert.alert('Name Required', 'Please enter your full legal name.');
        return;
      }
      registerUser({
        fullName,
        phoneNumber: formattedPhone,
        email: email || `${rawNumber}@swiftboda.co.ke`,
        role: selectedRole,
        vehiclePlate: selectedRole === 'DRIVER' ? vehiclePlate : undefined,
        vehicleModel: selectedRole === 'DRIVER' ? vehicleModel : undefined,
      });
    }

    setIsAuthenticating(true);
    setAuthMessage('Sending Verification Code...');
    setAuthSubMessage(`Dispatching 6-digit SMS to ${formattedPhone}`);
    sendOtp(formattedPhone);

    setTimeout(() => {
      setIsAuthenticating(false);
      setStep('OTP_VERIFY');
    }, 450);
  };

  const handleVerifyOtp = (codeOverride?: string) => {
    const codeToVerify = codeOverride || otpCode;
    if (codeToVerify.length !== 6) {
      Alert.alert('Incomplete Code', 'Please enter the 6-digit verification code.');
      return;
    }

    setIsAuthenticating(true);
    setAuthMessage('Verifying Security Token...');
    setAuthSubMessage('Signing into SwiftBoda Core');

    setTimeout(() => {
      const res = verifyOtpAndLogin(codeToVerify);
      setIsAuthenticating(false);
      if (res.success) {
        setStep('AUTH_FORM');
        setOtpCode('');
        if (onClose) onClose();
      } else {
        Alert.alert('Invalid Code', 'The verification code you entered is incorrect. Please try again.');
      }
    }, 450);
  };

  // Dynamic adaptive card dimensions based on screen height
  const isCompactScreen = height < 750;
  const imageCardHeight = isCompactScreen ? Math.round(height * 0.32) : Math.round(height * 0.37);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* ==================== STEP 1: FRIENDLY UBER ONBOARDING ==================== */}
        {step === 'ONBOARDING' && (
          <View
            style={[
              styles.onboardingContainer,
              {
                paddingTop: Math.max(insets.top, 18),
                paddingBottom: Math.max(insets.bottom + 12, 24),
              },
            ]}
          >
            {/* Top Bar: Brand & Skip Button */}
            <View style={styles.topBar}>
              <View style={styles.brandContainer}>
                <View style={styles.brandDot} />
                <Text style={styles.brandTitle}>
                  Swift<Text style={{ color: '#10B981' }}>Boda</Text>
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSkipOnboarding}
                style={styles.skipButton}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Horizontal Swipeable Slides */}
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={styles.carousel}
              contentContainerStyle={{ alignItems: 'center' }}
            >
              {UBER_ONBOARDING_SLIDES.map((slide, idx) => (
                <View key={idx} style={[styles.slideCard, { width }]}>
                  {/* Hero Visual Card */}
                  <View style={[styles.heroCard, { height: imageCardHeight }]}>
                    <Image source={slide.image} style={styles.heroImage} resizeMode="cover" />
                    <View style={styles.heroScrim} />
                    <View style={styles.heroBadge}>
                      <Ionicons name={slide.icon as any} size={12} color="#10B981" />
                      <Text style={styles.heroBadgeText}>{slide.tag}</Text>
                    </View>
                  </View>

                  {/* Slide Typography */}
                  <View style={styles.textContainer}>
                    <Text style={styles.slideTitle}>{slide.title}</Text>
                    <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Interactive Progress Indicator Dots */}
            <View style={styles.progressDotsRow}>
              {UBER_ONBOARDING_SLIDES.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => {
                    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
                    setSlideIndex(idx);
                  }}
                  style={[
                    styles.progressDot,
                    idx === slideIndex ? styles.progressDotActive : styles.progressDotInactive,
                  ]}
                />
              ))}
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={handleNextSlide}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryActionButtonText}>
                  {slideIndex === UBER_ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Continue'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#000000" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signInLink}
                onPress={handleSkipOnboarding}
                activeOpacity={0.7}
              >
                <Text style={styles.signInLinkText}>
                  Already have an account? <Text style={styles.signInLinkBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ==================== STEP 2: PHONE SIGN IN / SIGN UP ==================== */}
        {step === 'AUTH_FORM' && (
          <ScrollView
            contentContainerStyle={[
              styles.formScrollContainer,
              {
                paddingTop: Math.max(insets.top, 16),
                paddingBottom: Math.max(insets.bottom + 20, 32),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header with Back/Close Navigation */}
            <View style={styles.formHeader}>
              <TouchableOpacity
                onPress={() => setStep('ONBOARDING')}
                style={styles.roundIconButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
              </TouchableOpacity>
              <Text style={styles.formHeaderTitle}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>
              {onClose ? (
                <TouchableOpacity onPress={onClose} style={styles.roundIconButton} activeOpacity={0.7}>
                  <Ionicons name="close" size={22} color="#94A3B8" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 40 }} />
              )}
            </View>

            {/* Welcoming Headline */}
            <View style={styles.headlineBox}>
              <Text style={styles.mainHeadline}>
                {isSignUp ? 'Join SwiftBoda' : "What's your phone number?"}
              </Text>
              <Text style={styles.subHeadline}>
                {isSignUp
                  ? 'Sign up to request fast rides or earn as a verified boda driver.'
                  : "We'll send a 6-digit SMS verification code to secure your account."}
              </Text>
            </View>

            {/* Tab Switcher: Sign In vs Sign Up */}
            <View style={styles.tabSwitcher}>
              <TouchableOpacity
                style={[styles.tabButton, !isSignUp && styles.tabButtonActive]}
                onPress={() => setIsSignUp(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabButtonText, !isSignUp && styles.tabButtonTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, isSignUp && styles.tabButtonActive]}
                onPress={() => setIsSignUp(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabButtonText, isSignUp && styles.tabButtonTextActive]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {/* Role Switcher (When Registering) */}
            {isSignUp && (
              <View style={styles.roleContainer}>
                <Text style={styles.fieldLabel}>I WANT TO:</Text>
                <View style={styles.roleGrid}>
                  <TouchableOpacity
                    style={[styles.roleOption, selectedRole === 'RIDER' && styles.roleOptionActive]}
                    onPress={() => setSelectedRole('RIDER')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="person"
                      size={20}
                      color={selectedRole === 'RIDER' ? '#10B981' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.roleOptionText,
                        selectedRole === 'RIDER' && styles.roleOptionTextActive,
                      ]}
                    >
                      Ride as Passenger
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleOption, selectedRole === 'DRIVER' && styles.roleOptionActive]}
                    onPress={() => setSelectedRole('DRIVER')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="bicycle"
                      size={20}
                      color={selectedRole === 'DRIVER' ? '#10B981' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.roleOptionText,
                        selectedRole === 'DRIVER' && styles.roleOptionTextActive,
                      ]}
                    >
                      Drive & Earn
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.fieldsContainer}>
              {isSignUp && (
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>FULL NAME</Text>
                  <TextInput
                    style={styles.textInputField}
                    placeholder="e.g. Grace Wanjiku"
                    placeholderTextColor="#64748B"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              {/* Kenyan Phone Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>PHONE NUMBER (SAFARICOM / AIRTEL)</Text>
                <View style={styles.phoneInputRow}>
                  <View style={styles.flagBadge}>
                    <Text style={styles.flagIcon}>🇰🇪</Text>
                    <Text style={styles.flagCode}>+254</Text>
                  </View>
                  <TextInput
                    style={styles.phoneNumberField}
                    placeholder="712 345 678"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    value={phoneNumber.replace(/^\+254/, '')}
                    onChangeText={setPhoneNumber}
                  />
                </View>
              </View>

              {/* Driver Extra Fields */}
              {isSignUp && selectedRole === 'DRIVER' && (
                <View style={styles.driverSection}>
                  <View style={styles.driverInfoBanner}>
                    <Ionicons name="information-circle" size={16} color="#10B981" />
                    <Text style={styles.driverInfoBannerText}>
                      Driver partners undergo administrative verification before trips are activated.
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.fieldLabel}>MOTORBIKE NUMBER PLATE</Text>
                    <TextInput
                      style={styles.textInputField}
                      placeholder="e.g. KMC 123A"
                      placeholderTextColor="#64748B"
                      value={vehiclePlate}
                      onChangeText={setVehiclePlate}
                      autoCapitalize="characters"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.fieldLabel}>MOTORBIKE MODEL</Text>
                    <TextInput
                      style={styles.textInputField}
                      placeholder="e.g. Boxer 150 / TVS HLX"
                      placeholderTextColor="#64748B"
                      value={vehicleModel}
                      onChangeText={setVehicleModel}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={styles.formSubmitButton}
              onPress={handleSendOtp}
              activeOpacity={0.88}
            >
              <Text style={styles.formSubmitButtonText}>
                {isSignUp ? 'Agree & Continue' : 'Continue'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#000000" />
            </TouchableOpacity>

            {/* Trust and Privacy Note */}
            <View style={styles.trustNote}>
              <Ionicons name="lock-closed" size={13} color="#64748B" />
              <Text style={styles.trustNoteText}>
                Secured by Safaricom Daraja M-Pesa • Your privacy is guaranteed
              </Text>
            </View>
          </ScrollView>
        )}

        {/* ==================== STEP 3: SMS OTP VERIFICATION ==================== */}
        {step === 'OTP_VERIFY' && (
          <View
            style={[
              styles.otpContainer,
              {
                paddingTop: Math.max(insets.top, 16),
                paddingBottom: Math.max(insets.bottom + 20, 32),
              },
            ]}
          >
            {/* Header */}
            <View style={styles.formHeader}>
              <TouchableOpacity
                onPress={() => setStep('AUTH_FORM')}
                style={styles.roundIconButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
              </TouchableOpacity>
              <Text style={styles.formHeaderTitle}>Verification</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.otpMainContent}>
              <View style={styles.otpIconBadge}>
                <Ionicons name="chatbox-ellipses" size={32} color="#10B981" />
              </View>

              <Text style={styles.otpMainTitle}>Enter 6-digit code</Text>
              <Text style={styles.otpSubTitle}>
                We sent a text message to{' '}
                <Text style={{ color: '#F8FAFC', fontWeight: '800' }}>{pendingOtpPhone}</Text>
              </Text>

              {/* Code Input Field */}
              <View style={styles.otpInputWrapper}>
                <TextInput
                  style={styles.otpInputBox}
                  placeholder="------"
                  placeholderTextColor="#334155"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={(val) => {
                    setOtpCode(val);
                    if (val.length === 6) {
                      const res = verifyOtpAndLogin(val);
                      if (res.success) {
                        setStep('AUTH_FORM');
                        setOtpCode('');
                        if (onClose) onClose();
                      }
                    }
                  }}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={styles.resendLink}
                onPress={() => {
                  sendOtp(formattedPhone);
                  Alert.alert('Code Resent', `A new verification code was sent to ${formattedPhone}.`);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.resendLinkText}>
                  Did not receive the code? <Text style={styles.resendLinkBold}>Resend SMS</Text>
                </Text>
              </TouchableOpacity>

              {/* Tester Fast-Fill Pill Button */}
              <TouchableOpacity
                style={styles.testerFastFillBtn}
                onPress={() => {
                  setOtpCode('123456');
                  handleVerifyOtp('123456');
                }}
                activeOpacity={0.75}
              >
                <Ionicons name="flash" size={13} color="#10B981" />
                <Text style={styles.testerFastFillText}>Universal Testing PIN: 123456 (Tap to Fill)</Text>
              </TouchableOpacity>
            </View>

            {/* Verify CTA */}
            <TouchableOpacity
              style={styles.otpVerifyButton}
              onPress={() => handleVerifyOtp()}
              activeOpacity={0.88}
            >
              <Text style={styles.otpVerifyButtonText}>Verify & Continue</Text>
              <Ionicons name="checkmark-circle" size={18} color="#000000" />
            </TouchableOpacity>
          </View>
        )}

        {/* Branded SwiftBoda Emerald Radar Loader matching Logo */}
        <SwiftBodaLoader
          visible={isAuthenticating}
          fullscreen
          message={authMessage}
          subMessage={authSubMessage}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A0F',
  },

  // Onboarding Layout
  onboardingContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  skipButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },

  // Carousel
  carousel: {
    flex: 1,
  },
  slideCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  heroCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0E141F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(7, 10, 15, 0.4)',
  },
  heroBadge: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(7, 10, 15, 0.88)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  slideTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },

  // Progress Dots
  progressDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  progressDot: {
    height: 5,
    borderRadius: 3,
  },
  progressDotActive: {
    width: 26,
    backgroundColor: '#10B981',
  },
  progressDotInactive: {
    width: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Bottom Controls
  bottomActions: {
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryActionButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 9999,
  },
  primaryActionButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  signInLinkText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  signInLinkBold: {
    color: '#10B981',
    fontWeight: '800',
  },

  // Phone Form Layout
  formScrollContainer: {
    paddingHorizontal: 24,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roundIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0E141F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  formHeaderTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },

  headlineBox: {
    marginBottom: 22,
    gap: 6,
  },
  mainHeadline: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subHeadline: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },

  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#0E141F',
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#162031',
  },
  tabButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#F8FAFC',
  },

  roleContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0E141F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  roleOptionActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  roleOptionText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  roleOptionTextActive: {
    color: '#10B981',
  },

  fieldsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 6,
  },
  textInputField: {
    backgroundColor: '#0E141F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 15,
  },
  phoneInputRow: {
    flexDirection: 'row',
    backgroundColor: '#0E141F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    alignItems: 'center',
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  flagIcon: {
    fontSize: 18,
  },
  flagCode: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  phoneNumberField: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#F8FAFC',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  driverSection: {
    gap: 14,
    marginTop: 4,
  },
  driverInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 12,
    padding: 12,
  },
  driverInfoBannerText: {
    flex: 1,
    color: '#A7F3D0',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },

  formSubmitButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 9999,
    marginBottom: 20,
  },
  formSubmitButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
  },
  trustNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  trustNoteText: {
    color: '#64748B',
    fontSize: 12,
  },

  // OTP Verification Screen
  otpContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  otpMainContent: {
    alignItems: 'center',
    gap: 12,
    marginVertical: 'auto',
  },
  otpIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  otpMainTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '900',
  },
  otpSubTitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  otpInputWrapper: {
    alignItems: 'center',
    marginVertical: 16,
  },
  otpInputBox: {
    backgroundColor: '#0E141F',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
    width: 220,
  },
  resendLink: {
    paddingVertical: 8,
  },
  resendLinkText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  resendLinkBold: {
    color: '#10B981',
    fontWeight: '800',
  },
  testerFastFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginTop: 8,
  },
  testerFastFillText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  otpVerifyButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 9999,
  },
  otpVerifyButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
  },
});
