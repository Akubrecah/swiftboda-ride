import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: 'slide-1',
    title: 'Welcome to SwiftBoda\nRide Anytime!',
    subtitle: 'Sub-second driver matching and real-time GPS tracking across the city.',
    image: require('../assets/images/onboarding_1.png'),
    accentColor: '#10B981',
  },
  {
    id: 'slide-2',
    title: 'Quick and simple\nride booking!',
    subtitle: 'Transparent fare estimates, 4-digit Ride PIN safety, and instant M-Pesa payments.',
    image: require('../assets/images/onboarding_2.png'),
    accentColor: '#F59E0B',
  },
  {
    id: 'slide-3',
    title: 'Start Your Journey\nwith SwiftBoda!',
    subtitle: 'Join thousands of riders enjoying safe, affordable urban transport.',
    image: require('../assets/images/onboarding_3.png'),
    accentColor: '#3B82F6',
  },
];

interface OnboardingModalProps {
  visible: boolean;
  onFinish: () => void;
}

export default function OnboardingModal({ visible, onFinish }: OnboardingModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentSlide = ONBOARDING_SLIDES[currentIndex];

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        {/* Full-bleed Hero Image */}
        <Image source={currentSlide.image} style={styles.backgroundImage} resizeMode="cover" />

        {/* Dark Vignette Gradient Overlay */}
        <View style={styles.vignetteOverlay} />

        {/* Top Header & Status Bar */}
        <View style={styles.topHeader}>
          <Text style={styles.timeText}>9:30 PM</Text>
          <View style={styles.brandLogoRow}>
            <Text style={styles.brandLogoText}>
              Go<Text style={{ color: '#F59E0B' }}>boda</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={onFinish} style={styles.skipButton}>
            <Text style={styles.skipText}>SKIP</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Hero Content Area */}
        <View style={styles.bottomContentArea}>
          {/* Main Title Matching Reference */}
          <Text style={styles.slideTitle}>{currentSlide.title}</Text>
          <Text style={styles.slideSubtitle}>{currentSlide.subtitle}</Text>

          {/* Bottom Navigation Control Bar */}
          <View style={styles.controlsRow}>
            {/* Left: Pagination Bar Indicators */}
            <View style={styles.paginationRow}>
              {ONBOARDING_SLIDES.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.paginationDot,
                    idx === currentIndex
                      ? [styles.paginationActiveBar, { backgroundColor: '#F59E0B' }]
                      : styles.paginationInactiveDot,
                  ]}
                />
              ))}
            </View>

            {/* Right: Circular Arrow Buttons */}
            <View style={styles.arrowButtonsRow}>
              {/* Previous Button (<) */}
              <TouchableOpacity
                style={[
                  styles.arrowBtnPrev,
                  currentIndex === 0 && { opacity: 0.3 },
                ]}
                disabled={currentIndex === 0}
                onPress={handlePrev}
              >
                <Text style={styles.arrowBtnPrevText}>‹</Text>
              </TouchableOpacity>

              {/* Next Button (>) */}
              <TouchableOpacity style={styles.arrowBtnNext} onPress={handleNext}>
                <Text style={styles.arrowBtnNextText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070A0F', position: 'relative' },
  backgroundImage: { width: '100%', height: '100%', position: 'absolute' },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 10, 15, 0.45)',
    // Radial dark bottom gradient feel
  },

  topHeader: {
    position: 'absolute',
    top: 45,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  timeText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  brandLogoRow: { flexDirection: 'row', alignItems: 'center' },
  brandLogoText: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  skipButton: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  skipText: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold' },

  bottomContentArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 45,
    paddingTop: 80,
    backgroundColor: 'rgba(7, 10, 15, 0.85)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },

  slideTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 30,
    fontWeight: '500',
  },

  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationDot: {
    borderRadius: 4,
  },
  paginationActiveBar: {
    width: 28,
    height: 8,
  },
  paginationInactiveDot: {
    width: 8,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  arrowButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  arrowBtnPrev: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowBtnPrevText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: -2,
  },
  arrowBtnNext: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow
    // @ts-ignore
    boxShadow: '0px 4px 12px rgba(255, 255, 255, 0.3)',
  },
  arrowBtnNextText: {
    color: '#000000',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: -2,
  },
});
