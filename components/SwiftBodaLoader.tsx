import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface SwiftBodaLoaderProps {
  visible?: boolean;
  message?: string;
  subMessage?: string;
  fullscreen?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * SwiftBoda High-Precision Branded Loader
 * Replaces generic concentric pulse rings with an authentic tachometer-gauge
 * emerald accelerator ring, an obsidian emblem with a sharp emerald boda icon,
 * dynamic status messages, and seamless opacity cross-fade.
 */
export const SwiftBodaLoader: React.FC<SwiftBodaLoaderProps> = ({
  visible = true,
  message = 'Connecting to SwiftBoda...',
  subMessage = 'West Pokot Pilot • Makutano & Kapenguria',
  fullscreen = false,
  size = 'medium',
}) => {
  // Fade animation for seamless show/hide without jarring pop
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Continuous tachometer spin (clockwise rotation)
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Subtle motorcycle suspension float (subtle vertical hover)
  const hoverAnim = useRef(new Animated.Value(0)).current;

  // Emerald glow breathing pulse
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      // 1. Continuous smooth rotation for outer tachometer ring
      const spinLoop = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      // 2. Micro-motion hover for central motorcycle icon
      const hoverLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(hoverAnim, {
            toValue: -3,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(hoverAnim, {
            toValue: 2,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );

      // 3. Subtle glow pulse
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.9,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.35,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      spinLoop.start();
      hoverLoop.start();
      glowLoop.start();

      return () => {
        spinLoop.stop();
        hoverLoop.stop();
        glowLoop.stop();
      };
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim, spinAnim, hoverAnim, glowAnim]);

  if (!visible) return null;

  const isSmall = size === 'small';
  const badgeSize = isSmall ? 44 : size === 'large' ? 84 : 68;
  const iconSize = isSmall ? 22 : size === 'large' ? 42 : 32;

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const content = (
    <Animated.View
      style={[
        styles.centerContainer,
        isSmall && styles.compactCenter,
        { opacity: fadeAnim },
      ]}
    >
      {/* Outer Tachometer Gauge Ring */}
      <View style={{ width: badgeSize + 28, height: badgeSize + 28, alignItems: 'center', justifyContent: 'center' }}>
        {/* Rotating Segmented Ring */}
        <Animated.View
          style={[
            styles.gaugeRing,
            {
              width: badgeSize + 24,
              height: badgeSize + 24,
              borderRadius: (badgeSize + 24) / 2,
              transform: [{ rotate: spin }],
            },
          ]}
        />

        {/* Central Obsidian Emblem */}
        <View
          style={[
            styles.logoCircle,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            },
          ]}
        >
          {/* Subtle green backlight glow */}
          <Animated.View
            style={[
              styles.innerGlow,
              {
                width: badgeSize,
                height: badgeSize,
                borderRadius: badgeSize / 2,
                opacity: glowAnim,
              },
            ]}
          />

          {/* Motorcycle Icon with hover suspension */}
          <Animated.View style={{ transform: [{ translateY: hoverAnim }] }}>
            <Ionicons name="bicycle" size={iconSize} color="#10B981" />
          </Animated.View>
        </View>
      </View>

      {/* Brand & Loading Status Typography */}
      {!isSmall && (
        <View style={styles.textWrapper}>
          <View style={styles.brandRow}>
            <View style={styles.statusDot} />
            <Text style={styles.brandTitle}>
              Swift<Text style={{ color: '#10B981' }}>Boda</Text>
            </Text>
          </View>

          <Text style={styles.primaryMessage}>{message}</Text>
          {subMessage ? <Text style={styles.subMessage}>{subMessage}</Text> : null}
        </View>
      )}
    </Animated.View>
  );

  if (fullscreen) {
    return (
      <Modal transparent animationType="fade" visible={visible}>
        <View style={styles.modalBackdrop}>{content}</View>
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 15, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  compactCenter: {
    padding: 8,
  },
  gaugeRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#10B981',
    borderTopColor: 'transparent',
    borderRightColor: '#10B981',
    borderBottomColor: 'rgba(16, 185, 129, 0.2)',
    borderLeftColor: '#10B981',
  },
  logoCircle: {
    backgroundColor: '#0E141F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  innerGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  textWrapper: {
    alignItems: 'center',
    marginTop: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  primaryMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  subMessage: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.2,
  },
});
