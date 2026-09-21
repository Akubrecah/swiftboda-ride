import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSwiftBoda } from '../../context/SwiftBodaContext';
import { useTheme } from '../../context/ThemeContext';
import { IntegratedMapView } from '../../components/IntegratedMapView';
import AuthModal from '../../components/AuthModal';
import { DriverKycOnboardingModal, DriverKycSubmission } from '../../components/DriverKycOnboardingModal';
import { VehicleCategory } from '../../shared/types';
import { getActiveRegion } from '../../shared/constants/regions';
import { generateAndShareReceiptPDF } from '../../services/receiptPdfService';
import { createHomeStyles } from '../../styles/home.styles';
import { searchPlacesLive } from '../../services/placesService';
import { NormalizedPlace } from '../../services/maps-service/serply/types';
import { calculateHaversineDistance } from '../../shared/utils/geo';

const { width } = Dimensions.get('window');

const activeRegion = getActiveRegion();
const WEST_POKOT_DESTINATIONS = activeRegion.landmarks;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(() => createHomeStyles(theme), [theme]);
  const {
    currentUser,
    isAuthenticated,
    savedPlaces,
    appMode,
    setAppMode,
    userLocation,
    destinationLocation,
    setDestinationLocation,
    selectedCategory,
    setSelectedCategory,
    paymentMethod,
    setPaymentMethod,
    promoCode,
    setPromoCode,
    walletBalance,
    fareEstimate,
    activeTrip,
    requestRide,
    isSubmittingRide,
    isOnline,
    cancelRide,
    rateTrip,
    triggerSOS,
    chatMessages,
    sendChatMessage,
    shareLiveTrip,
    bookingForOther,
    setBookingForOther,
    nearbyDrivers,
    simulatedDriverPos,
    isDriverOnline,
    setIsDriverOnline,
    driverEarnings,
    incomingOffer,
    offerCountdown,
    acceptIncomingOffer,
    declineIncomingOffer,
    driverArrived,
    driverStartTrip,
    driverCompleteTrip,
    adminDrivers,
    approveDriver,
    rejectDriver,
    adminRiders,
    verifyRiderKyc,
    flagRiderRisk,
    adminTransactions,
    auditTransaction,
    driverVerificationStatus,
    applyForDriver,
    adminLiveFleet,
    adminActiveTrips,
    refreshAdminLiveState,
    logout,
  } = useSwiftBoda();

  // Admin Operations & Verification State
  const [adminSubTab, setAdminSubTab] = useState<'LIVE_OPS' | 'DRIVERS' | 'RIDERS' | 'TRANSACTIONS'>('LIVE_OPS');
  const [selectedDriverDoc, setSelectedDriverDoc] = useState<any | null>(null);
  const [showDriverDocModal, setShowDriverDocModal] = useState(false);
  const [selectedTxAudit, setSelectedTxAudit] = useState<any | null>(null);
  const [showTxAuditModal, setShowTxAuditModal] = useState(false);

  // Driver Application Modal State
  const [showDriverApplicationModal, setShowDriverApplicationModal] = useState(false);
  const [applyPlate, setApplyPlate] = useState('KMD 409B');
  const [applyModel, setApplyModel] = useState('Bajaj Boxer 150');
  const [applyCategory, setApplyCategory] = useState<VehicleCategory>('BODA_STANDARD');
  const [applyNationalId, setApplyNationalId] = useState('32849102');
  const [applyDlNumber, setApplyDlNumber] = useState('DL-NBO-7712');

  // Search & Modal States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hasDismissedAuth, setHasDismissedAuth] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRiderSelectorModal, setShowRiderSelectorModal] = useState(false);
  const [otherRiderName, setOtherRiderName] = useState('');
  const [otherRiderPhone, setOtherRiderPhone] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [selectedTip, setSelectedTip] = useState(0);
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>(['Clean helmet', 'Smooth ride']);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Real Serply Google Maps Live Search State
  const [placesResults, setPlacesResults] = useState<NormalizedPlace[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Debounced live search with deduplication and error handling
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setPlacesResults([]);
      setIsSearchingPlaces(false);
      setSearchError(null);
      return;
    }

    setIsSearchingPlaces(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const result = await searchPlacesLive(trimmed, { num: 20, hl: 'en', gl: 'ke' });
        setPlacesResults(result.places);
      } catch (err: any) {
        console.error('[SerplyUI] Live search error:', err);
        if (err.message?.includes('temporarily unavailable')) {
          setSearchError('The location service is temporarily unavailable. Please try again.');
        } else if (err.message?.includes('Rate limit')) {
          setSearchError('Rate limit exceeded from location service. Please try again in a few moments.');
        } else {
          setSearchError(err.message || 'Unable to search places. Please check your network.');
        }
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectPlace = (place: NormalizedPlace) => {
    setDestinationLocation({
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address || place.district || place.name,
      placeName: place.name,
    });
    setShowSearchModal(false);
    setSearchQuery('');
  };

  const handleSelectDestination = (dest: typeof WEST_POKOT_DESTINATIONS[0]) => {
    setDestinationLocation({
      latitude: dest.lat,
      longitude: dest.lon,
      address: dest.address,
      placeName: dest.name,
    });
    setShowSearchModal(false);
    setSearchQuery('');
  };

  const handleClearDestination = () => {
    setDestinationLocation(null);
    setSearchQuery('');
    setPlacesResults([]);
    setSearchError(null);
  };

  // Role-Based Security & Dashboard Isolation Guard
  useEffect(() => {
    if (!currentUser || currentUser.role === 'RIDER') {
      if (appMode !== 'RIDER') {
        setAppMode('RIDER');
      }
    } else if (currentUser.role === 'DRIVER') {
      if (driverVerificationStatus !== 'APPROVED' && appMode === 'DRIVER') {
        setAppMode('RIDER');
      }
    }
  }, [currentUser?.role, driverVerificationStatus, appMode]);

  const categories: { id: VehicleCategory; name: string; subtitle: string; icon: string; capacity: string; eta: string }[] = [
    { id: 'BODA_STANDARD', name: 'Swift Boda', subtitle: 'Affordable • Fast rides across West Pokot', icon: 'bicycle', capacity: '1', eta: '2 min' },
    { id: 'BODA_COMFORT', name: 'Swift Comfort', subtitle: 'Top rated • Clean helmet & hairnet', icon: 'shield-checkmark', capacity: '1', eta: '4 min' },
    { id: 'BODA_XL', name: 'Swift XL / Cargo', subtitle: 'Heavy duty • Extra luggage space', icon: 'cube', capacity: '2', eta: '5 min' },
    { id: 'EXPRESS_DELIVERY', name: 'Swift Package', subtitle: 'Send parcels with recipient PIN', icon: 'paper-plane', capacity: '15kg', eta: '3 min' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 1. UBER TOP HEADER */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top + 6, 16), backgroundColor: theme.headerBg, borderColor: theme.border }]}>
        <View style={styles.brandRow}>
          {/* Left: Brand Logo + Compact Pilot Indicator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
            <View style={styles.brandLogo}>
              <View style={[styles.onlineDot, { backgroundColor: isOnline ? theme.primary : theme.textMuted }]} />
              <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
                Swift<Text style={{ color: theme.primary }}>Boda</Text>
              </Text>
            </View>
            <View style={[styles.pilotBadge, { backgroundColor: theme.badgeBg, borderColor: theme.badgeBorder, paddingHorizontal: 7, paddingVertical: 2.5 }]}>
              <Ionicons name="location-sharp" size={10} color={theme.primary} />
              <Text style={[styles.pilotBadgeText, { color: theme.primary, fontSize: 10 }]}>West Pokot</Text>
            </View>
          </View>

          {/* Center: Role Switcher (for Driver / Admin) */}
          {currentUser?.role === 'ADMIN' ? (
            <View style={[styles.modeSwitchPill, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.modePillBtn, appMode === 'ADMIN' && { backgroundColor: theme.primary }]}
                onPress={() => setAppMode('ADMIN')}
              >
                <Text style={[styles.modePillText, { color: appMode === 'ADMIN' ? '#FFFFFF' : theme.textSecondary }]}>Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modePillBtn, appMode === 'RIDER' && { backgroundColor: theme.primary }]}
                onPress={() => setAppMode('RIDER')}
              >
                <Text style={[styles.modePillText, { color: appMode === 'RIDER' ? '#FFFFFF' : theme.textSecondary }]}>Rider</Text>
              </TouchableOpacity>
            </View>
          ) : currentUser?.role === 'DRIVER' && driverVerificationStatus === 'APPROVED' ? (
            <View style={[styles.modeSwitchPill, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.modePillBtn, appMode === 'DRIVER' && { backgroundColor: theme.primary }]}
                onPress={() => setAppMode('DRIVER')}
              >
                <Text style={[styles.modePillText, { color: appMode === 'DRIVER' ? '#FFFFFF' : theme.textSecondary }]}>Driver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modePillBtn, appMode === 'RIDER' && { backgroundColor: theme.primary }]}
                onPress={() => setAppMode('RIDER')}
              >
                <Text style={[styles.modePillText, { color: appMode === 'RIDER' ? '#FFFFFF' : theme.textSecondary }]}>Rider</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Right: Actions (SOS + Profile Avatar + Logout) */}
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={triggerSOS} style={[styles.sosShieldBtn, { backgroundColor: theme.sosRedSurface, borderColor: theme.sosRed }]} activeOpacity={0.7}>
              <Ionicons name="shield" size={13} color={theme.sosRed} />
              <Text style={[styles.sosShieldText, { color: theme.sosRed }]}>SOS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.walletBadge, { backgroundColor: theme.badgeBg, borderColor: theme.badgeBorder }]}
              onPress={() => setShowAuthModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle" size={15} color={theme.primary} style={{ marginRight: 3 }} />
              <Text style={[styles.walletBadgeText, { color: theme.primary }]} numberOfLines={1}>
                {currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {currentUser && (
              <TouchableOpacity
                style={[styles.logoutHeaderBtn, { backgroundColor: theme.sosRedSurface, borderColor: theme.border }]}
                onPress={() => {
                  Alert.alert('Sign Out', `Sign out from ${currentUser.fullName}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Sign Out',
                      style: 'destructive',
                      onPress: () => {
                        logout();
                        setShowAuthModal(true);
                      },
                    },
                  ]);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="log-out-outline" size={15} color={theme.sosRed} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* 2. REAL-TIME INTEGRATED MAP VIEWPORT */}
      <IntegratedMapView
        userLocation={userLocation}
        destinationLocation={destinationLocation}
        nearbyDrivers={nearbyDrivers}
        simulatedDriverPos={simulatedDriverPos}
        activeTrip={activeTrip}
        height={Dimensions.get('window').height * 0.42}
      />

      {/* 3. DYNAMIC UBER BOTTOM SHEET */}
      <ScrollView
        style={styles.bottomSheet}
        contentContainerStyle={[styles.bottomSheetContent, { paddingBottom: 110 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ==================== RIDER MODE ==================== */}
        {appMode === 'RIDER' && (
          <View>
            {/* STATE 1: DISPATCHING SEARCHING DRIVER (RADAR MATCHING) */}
            {activeTrip && activeTrip.status === 'SEARCHING_DRIVER' ? (
              <View style={styles.searchingCard}>
                <View style={styles.radarWaveOuter}>
                  <View style={styles.radarWaveInner}>
                    <Ionicons name="bicycle" size={28} color="#10B981" />
                  </View>
                </View>

                <Text style={styles.searchingTitle}>Connecting to nearest boda...</Text>
                <Text style={styles.searchingSubtitle}>
                  Contacting top-rated drivers near Kenyatta Avenue
                </Text>

                <View style={styles.searchingProgressBar}>
                  <View style={styles.searchingProgressFill} />
                </View>

                <View style={styles.searchingDetailsRow}>
                  <Text style={styles.searchingDetailText}>
                    {categories.find((c) => c.id === activeTrip.category)?.name} • KES {activeTrip.fare.totalFare}
                  </Text>
                  <Text style={styles.searchingDetailText}>
                    Paid via {activeTrip.paymentMethod}
                  </Text>
                </View>

                <TouchableOpacity style={styles.cancelSearchBtn} onPress={cancelRide}>
                  <Text style={styles.cancelSearchBtnText}>Cancel Request</Text>
                </TouchableOpacity>
              </View>
            ) : activeTrip ? (
              /* STATE 2: DRIVER ASSIGNED / ARRIVED / IN-TRIP (ACTIVE RIDE) */
              <View style={styles.activeRideSheet}>
                {/* Trip State Banner */}
                <View style={styles.statusBarRow}>
                  <View style={styles.statusPulseDot} />
                  <Text style={styles.statusTitle}>
                    {activeTrip.status === 'DRIVER_ASSIGNED' && 'Driver matched • Heading to pickup'}
                    {activeTrip.status === 'DRIVER_ARRIVED' && 'Driver has arrived at pickup point'}
                    {activeTrip.status === 'IN_TRIP' && 'Trip in progress • On the road'}
                  </Text>
                </View>

                {/* Driver Profile Card */}
                <View style={styles.driverProfileCard}>
                  <View style={styles.driverAvatar}>
                    <Ionicons name="person" size={26} color="#FFF" />
                  </View>
                  <View style={styles.driverMeta}>
                    <Text style={styles.driverName}>{activeTrip.driver?.name || 'Kipchoge Moto'}</Text>
                    <Text style={styles.driverSub}>
                      {activeTrip.driver?.vehicleModel || 'TVS HLX 150'} • {activeTrip.driver?.vehicleColor || 'Red'}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={13} color="#F59E0B" />
                      <Text style={styles.ratingText}>4.92 ★ (650+ trips)</Text>
                    </View>
                  </View>
                  <View style={styles.plateBadge}>
                    <Text style={styles.plateText}>{activeTrip.driver?.vehiclePlate || 'KMC 123A'}</Text>
                  </View>
                </View>

                {/* 4-DIGIT SAFETY RIDE PIN CARD */}
                <View style={styles.safetyPinCard}>
                  <View style={styles.safetyPinHeader}>
                    <Ionicons name="lock-closed" size={16} color="#10B981" />
                    <Text style={styles.safetyPinTitle}>Ride Safety PIN</Text>
                  </View>
                  <Text style={styles.safetyPinDesc}>
                    Give this 4-digit code to driver {activeTrip.driver?.name?.split(' ')[0]} to start your ride:
                  </Text>
                  <View style={styles.pinDigitsRow}>
                    {activeTrip.ridePin.split('').map((digit, idx) => (
                      <View key={idx} style={styles.pinDigitBox}>
                        <Text style={styles.pinDigitText}>{digit}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Route Points */}
                <View style={styles.routeLocationsCard}>
                  <View style={styles.routePointRow}>
                    <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.routePointText} numberOfLines={1}>
                      From: {activeTrip.pickup.address || 'Nairobi Central CBD'}
                    </Text>
                  </View>
                  <View style={styles.routeConnectorLine} />
                  <View style={styles.routePointRow}>
                    <View style={[styles.routeDot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.routePointText} numberOfLines={1}>
                      To: {activeTrip.destination.placeName || activeTrip.destination.address}
                    </Text>
                  </View>
                </View>

                {/* Recipient Passenger Badge if Booked for Someone Else */}
                {activeTrip.recipientRider && (
                  <View style={styles.recipientBadge}>
                    <Ionicons name="people" size={14} color="#10B981" />
                    <Text style={styles.recipientBadgeText}>
                      Riding: <Text style={{ color: '#F8FAFC', fontWeight: '800' }}>{activeTrip.recipientRider.name}</Text> ({activeTrip.recipientRider.phone})
                    </Text>
                  </View>
                )}

                {/* Trip Action Buttons */}
                <View style={styles.tripActionsGrid}>
                  <TouchableOpacity
                    style={styles.callDriverBtn}
                    onPress={() => Alert.alert('Calling Driver', `Dialing ${activeTrip.driver?.phone || '+254712345678'}...`)}
                  >
                    <Ionicons name="call" size={16} color="#FFF" />
                    <Text style={styles.callDriverText}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.messageDriverBtn}
                    onPress={() => setShowChatModal(true)}
                  >
                    <Ionicons name="chatbubble" size={16} color="#FFF" />
                    <Text style={styles.messageDriverText}>Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shareTripBtn}
                    onPress={shareLiveTrip}
                  >
                    <Ionicons name="share-social" size={16} color="#10B981" />
                    <Text style={styles.shareTripText}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelTripBtn}
                    onPress={() => {
                      Alert.alert('Cancel Ride', 'Are you sure you want to cancel this ride?', [
                        { text: 'No, Keep Ride', style: 'cancel' },
                        { text: 'Yes, Cancel', style: 'destructive', onPress: cancelRide },
                      ]);
                    }}
                  >
                    <Ionicons name="close" size={16} color="#EF4444" />
                    <Text style={styles.cancelTripText}>Cancel</Text>
                  </TouchableOpacity>
                </View>

                {/* Driver Completed Simulation Button */}
                {activeTrip.status === 'IN_TRIP' && (
                  <TouchableOpacity
                    style={styles.simulateArrivedBtn}
                    onPress={() => setShowRatingModal(true)}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.simulateArrivedText}>Trip Arrived • View Receipt & Rate</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : destinationLocation && fareEstimate ? (
              /* STATE 3: VEHICLE SELECTION & FARE ESTIMATE */
              <View style={styles.selectionSheet}>
                {/* Destination Bar */}
                <View style={styles.destinationSelectedBar}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.destSelectedTitle}>{destinationLocation.placeName || 'Destination'}</Text>
                    <Text style={styles.destSelectedAddress} numberOfLines={1}>
                      {destinationLocation.address}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleClearDestination} style={styles.changeDestBtn}>
                    <Ionicons name="close-circle" size={22} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* Rider Selector (For Me vs For Someone Else) */}
                <View style={styles.riderSelectorRow}>
                  <TouchableOpacity
                    style={styles.riderSelectorPill}
                    onPress={() => setShowRiderSelectorModal(true)}
                  >
                    <Ionicons
                      name={bookingForOther.enabled ? 'people' : 'person'}
                      size={14}
                      color="#10B981"
                    />
                    <Text style={styles.riderSelectorPillText}>
                      {bookingForOther.enabled && bookingForOther.name
                        ? `For: ${bookingForOther.name}`
                        : `For Me (${currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'Grace'})`}
                    </Text>
                    <Ionicons name="chevron-down" size={12} color="#94A3B8" />
                  </TouchableOpacity>

                  {bookingForOther.enabled && (
                    <TouchableOpacity
                      style={styles.resetRiderBtn}
                      onPress={() => setBookingForOther({ enabled: false, name: '', phone: '' })}
                    >
                      <Text style={styles.resetRiderBtnText}>Reset to Me</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Ride Categories */}
                <Text style={styles.sectionHeader}>Choose a ride</Text>
                <View style={styles.categoryList}>
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    const price =
                      cat.id === 'BODA_STANDARD'
                        ? fareEstimate.totalFare
                        : cat.id === 'BODA_COMFORT'
                        ? Math.round(fareEstimate.totalFare * 1.35)
                        : cat.id === 'BODA_XL'
                        ? Math.round(fareEstimate.totalFare * 1.7)
                        : Math.round(fareEstimate.totalFare * 1.15);

                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                        onPress={() => setSelectedCategory(cat.id)}
                      >
                        <View style={[styles.categoryIconCircle, isSelected && styles.categoryIconCircleSelected]}>
                          <Ionicons name={cat.icon as any} size={22} color={isSelected ? '#10B981' : '#FFF'} />
                        </View>
                        <View style={styles.categoryInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.categoryName}>{cat.name}</Text>
                            <View style={styles.capacityBadge}>
                              <Ionicons name="person" size={10} color="#94A3B8" />
                              <Text style={styles.capacityText}>{cat.capacity}</Text>
                            </View>
                            <Text style={styles.categoryEta}>• {cat.eta}</Text>
                          </View>
                          <Text style={styles.categorySub}>{cat.subtitle}</Text>
                        </View>
                        <View style={styles.categoryPriceBox}>
                          <Text style={styles.categoryPriceText}>KES {price}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Payment & Promo Bar */}
                <View style={styles.paymentSelectorRow}>
                  <TouchableOpacity
                    style={styles.paymentMethodChip}
                    onPress={() => setShowPaymentModal(true)}
                  >
                    <Ionicons
                      name={paymentMethod === 'MPESA' ? 'phone-portrait' : paymentMethod === 'WALLET' ? 'wallet' : 'cash'}
                      size={14}
                      color="#10B981"
                    />
                    <Text style={styles.paymentMethodText}>
                      {paymentMethod === 'MPESA' ? 'M-Pesa Express' : paymentMethod === 'WALLET' ? 'Wallet (KES 1,500)' : 'Cash'}
                    </Text>
                    <Ionicons name="chevron-down" size={12} color="#94A3B8" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.promoCodeChip}
                    onPress={() => {
                      if (!promoCode) {
                        setPromoCode('SWIFT50');
                        Alert.alert('Promo Applied', 'SWIFT50 applied! You save KES 50 on this ride.');
                      } else {
                        setPromoCode('');
                      }
                    }}
                  >
                    <Ionicons name="pricetag" size={12} color="#F59E0B" />
                    <Text style={styles.promoCodeText}>{promoCode ? 'SWIFT50 (-KES 50)' : 'Add Promo'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Confirm Ride Button with Anti-Double-Action Loading State */}
                <TouchableOpacity
                  style={[styles.confirmRideButton, isSubmittingRide && { opacity: 0.7 }]}
                  onPress={requestRide}
                  disabled={isSubmittingRide}
                >
                  {isSubmittingRide ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#070A0F" />
                      <Text style={styles.confirmRideButtonText}>Confirming Ride...</Text>
                    </View>
                  ) : (
                    <Text style={styles.confirmRideButtonText}>
                      Choose {categories.find((c) => c.id === selectedCategory)?.name} • KES {fareEstimate.totalFare}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* STATE 4: IDLE "WHERE TO?" UBER HOME */
              <View style={styles.idleSearchSheet}>
                {/* Driver Verification Status Banner for Passengers */}
                {driverVerificationStatus === 'PENDING' && (
                  <View style={styles.driverStatusBannerPending}>
                    <View style={styles.statusBannerLeft}>
                      <View style={styles.statusBannerIconPending}>
                        <Ionicons name="time" size={20} color="#F59E0B" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.statusBannerTitlePending}>Driver Application Under Review</Text>
                          <View style={styles.statusPillPending}>
                            <Text style={styles.statusPillTextPending}>PENDING</Text>
                          </View>
                        </View>
                        <Text style={styles.statusBannerSub}>
                          NTSA Class A2 license & logbook review in progress. You are active as a passenger until Admin approves.
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.statusBannerActionPending}
                      onPress={() => setAppMode('ADMIN')}
                    >
                      <Ionicons name="shield-checkmark" size={13} color="#070A0F" />
                      <Text style={styles.statusBannerActionTextPending}>Review in Admin</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {driverVerificationStatus === 'REJECTED' && (
                  <View style={styles.driverStatusBannerRejected}>
                    <View style={styles.statusBannerLeft}>
                      <View style={styles.statusBannerIconRejected}>
                        <Ionicons name="alert-circle" size={20} color="#EF4444" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.statusBannerTitleRejected}>Driver Application Not Approved</Text>
                          <View style={styles.statusPillRejected}>
                            <Text style={styles.statusPillTextRejected}>REJECTED</Text>
                          </View>
                        </View>
                        <Text style={styles.statusBannerSub}>
                          Verification failed (expired insurance or unverified logbook). You are logged in as a passenger.
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.statusBannerActionRejected}
                      onPress={() => setShowDriverApplicationModal(true)}
                    >
                      <Text style={styles.statusBannerActionTextRejected}>Re-apply</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {driverVerificationStatus === 'APPROVED' && (
                  <View style={styles.driverStatusBannerApproved}>
                    <View style={styles.statusBannerLeft}>
                      <View style={styles.statusBannerIconApproved}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.statusBannerTitleApproved}>Verified SwiftBoda Driver</Text>
                          <View style={styles.statusPillApproved}>
                            <Text style={styles.statusPillTextApproved}>ACTIVE</Text>
                          </View>
                        </View>
                        <Text style={styles.statusBannerSub}>
                          Commercial license approved. Switch to Driver mode anytime to start accepting trips.
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.statusBannerActionApproved}
                      onPress={() => setAppMode('DRIVER')}
                    >
                      <Ionicons name="bicycle" size={13} color="#070A0F" />
                      <Text style={styles.statusBannerActionTextApproved}>Go to Driver</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {driverVerificationStatus === 'NOT_APPLIED' && (
                  <TouchableOpacity
                    style={styles.driverStatusBannerApply}
                    onPress={() => setShowDriverApplicationModal(true)}
                  >
                    <View style={styles.statusBannerLeft}>
                      <View style={styles.statusBannerIconApply}>
                        <Ionicons name="bicycle" size={20} color="#10B981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.statusBannerTitleApply}>Earn with SwiftBoda • Drive & Earn</Text>
                        <Text style={styles.statusBannerSub}>
                          Sign up your motorbike, get NTSA verified, and earn up to KES 3,500 daily.
                        </Text>
                      </View>
                    </View>
                    <View style={styles.applyArrowCircle}>
                      <Ionicons name="chevron-forward" size={16} color="#10B981" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* Two Top Service Tiles (Ride / Package) */}
                <View style={styles.serviceTilesRow}>
                  <TouchableOpacity
                    style={[styles.serviceTile, selectedCategory === 'BODA_STANDARD' && styles.serviceTileActive]}
                    onPress={() => setShowSearchModal(true)}
                  >
                    <View style={styles.serviceTileIcon}>
                      <Ionicons name="bicycle" size={24} color="#10B981" />
                    </View>
                    <Text style={styles.serviceTileTitle}>Ride</Text>
                    <Text style={styles.serviceTileSub}>Boda & Comfort</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.serviceTile}
                    onPress={() => {
                      setSelectedCategory('EXPRESS_DELIVERY');
                      setShowSearchModal(true);
                    }}
                  >
                    <View style={styles.serviceTileIcon}>
                      <Ionicons name="paper-plane" size={22} color="#3B82F6" />
                    </View>
                    <Text style={styles.serviceTileTitle}>Package</Text>
                    <Text style={styles.serviceTileSub}>Instant Courier</Text>
                  </TouchableOpacity>
                </View>

                {/* Uber "Where to?" Search Bar Pill */}
                <TouchableOpacity
                  style={styles.whereToSearchBar}
                  onPress={() => setShowSearchModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="search" size={20} color="#10B981" style={{ marginRight: 10 }} />
                  <Text style={styles.whereToPlaceholder}>Where to?</Text>
                  <View style={styles.nowBadge}>
                    <Ionicons name="time" size={13} color="#F8FAFC" />
                    <Text style={styles.nowBadgeText}>Now</Text>
                    <Ionicons name="chevron-down" size={12} color="#F8FAFC" />
                  </View>
                </TouchableOpacity>

                {/* Popular West Pokot Pilot Destinations */}
                <Text style={styles.sectionHeader}>Saved & Popular West Pokot Stages</Text>
                <View style={styles.placesList}>
                  {WEST_POKOT_DESTINATIONS.slice(0, 4).map((dest) => (
                    <TouchableOpacity
                      key={dest.name}
                      style={styles.placeItem}
                      onPress={() => handleSelectDestination(dest)}
                    >
                      <View style={styles.placeIconCircle}>
                        <Ionicons name={dest.icon as any} size={18} color="#10B981" />
                      </View>
                      <View style={styles.placeInfo}>
                        <Text style={styles.placeName}>{dest.name}</Text>
                        <Text style={styles.placeAddress} numberOfLines={1}>
                          {dest.address}
                        </Text>
                      </View>
                      <Text style={styles.placeEta}>{dest.eta}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ==================== DRIVER MODE (APPROVED DRIVERS ONLY) ==================== */}
        {appMode === 'DRIVER' && currentUser?.role === 'DRIVER' && driverVerificationStatus === 'APPROVED' && (
          <View style={styles.driverSheet}>
            {/* Driver Earnings Strip */}
            <View style={styles.driverEarningsCard}>
              <View style={styles.driverEarningsTop}>
                <View>
                  <Text style={styles.earningsLabel}>TODAY&apos;S EARNINGS</Text>
                  <Text style={styles.earningsValue}>KES {driverEarnings.today.toFixed(2)}</Text>
                </View>
                <View style={styles.tripsCountBadge}>
                  <Text style={styles.tripsCountNumber}>{driverEarnings.tripsCompleted}</Text>
                  <Text style={styles.tripsCountLabel}>trips</Text>
                </View>
              </View>

              <View style={styles.driverStatsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statColVal}>98.5%</Text>
                  <Text style={styles.statColLabel}>Acceptance</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statColVal}>4.92 ★</Text>
                  <Text style={styles.statColLabel}>Rating</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statColVal}>KES {driverEarnings.weekly.toFixed(0)}</Text>
                  <Text style={styles.statColLabel}>This Week</Text>
                </View>
              </View>
            </View>

            {/* Giant Uber Driver "GO" Online Button */}
            <View style={styles.goButtonContainer}>
              <TouchableOpacity
                style={[styles.giantGoButton, isDriverOnline ? styles.giantGoOnline : styles.giantGoOffline]}
                onPress={() => setIsDriverOnline(!isDriverOnline)}
              >
                <Text style={styles.giantGoText}>{isDriverOnline ? 'ONLINE' : 'GO'}</Text>
                <Text style={styles.giantGoSubtext}>{isDriverOnline ? 'Ready for trips' : 'Tap to drive'}</Text>
              </TouchableOpacity>
            </View>

            {/* Incoming Offer Card (Uber Driver Style 15-second countdown) */}
            {incomingOffer && (
              <View style={styles.incomingOfferCard}>
                <View style={styles.incomingOfferHeader}>
                  <View style={styles.countdownBadge}>
                    <Ionicons name="timer" size={16} color="#F59E0B" />
                    <Text style={styles.countdownText}>{offerCountdown}s left</Text>
                  </View>
                  <Text style={styles.incomingOfferPrice}>KES {incomingOffer.fare.totalFare}</Text>
                </View>

                <View style={styles.incomingRiderRow}>
                  <View style={styles.riderAvatarCircle}>
                    <Ionicons name="person" size={18} color="#FFF" />
                  </View>
                  <View>
                    <Text style={styles.incomingRiderName}>{incomingOffer.rider.name}</Text>
                    <Text style={styles.incomingRiderRating}>★ {incomingOffer.rider.rating} Rating</Text>
                  </View>
                </View>

                <View style={styles.incomingRouteBox}>
                  <Text style={styles.incomingRouteText}>📍 Pickup: {incomingOffer.pickup.address} (0.8 km)</Text>
                  <Text style={styles.incomingRouteText}>🏁 Dropoff: {incomingOffer.destination.address} (4.8 km)</Text>
                </View>

                <View style={styles.offerButtonsRow}>
                  <TouchableOpacity style={styles.declineOfferBtn} onPress={declineIncomingOffer}>
                    <Text style={styles.declineOfferText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.acceptOfferBtn} onPress={acceptIncomingOffer}>
                    <Text style={styles.acceptOfferText}>ACCEPT RIDE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Active Driver Trip Workflow (PIN Entry & Trip Actions) */}
            {activeTrip && (
              <View style={styles.driverActiveTripCard}>
                <Text style={styles.driverTripHeader}>CURRENT ACTIVE TRIP • {activeTrip.status}</Text>
                <Text style={styles.driverPassengerText}>Passenger: {activeTrip.rider?.name || 'Alex Rider'}</Text>
                <Text style={styles.driverDestinationText}>
                  Heading to: {activeTrip.destination.placeName || activeTrip.destination.address}
                </Text>

                {activeTrip.status === 'DRIVER_ASSIGNED' && (
                  <TouchableOpacity style={styles.driverActionBtnGreen} onPress={driverArrived}>
                    <Text style={styles.driverActionBtnText}>I Have Arrived at Pickup</Text>
                  </TouchableOpacity>
                )}

                {activeTrip.status === 'DRIVER_ARRIVED' && (
                  <View style={styles.pinVerifySection}>
                    <Text style={styles.pinVerifyPrompt}>Ask rider for their 4-digit Ride PIN:</Text>
                    <TextInput
                      style={styles.pinVerifyInput}
                      keyboardType="number-pad"
                      maxLength={4}
                      placeholder="PIN"
                      placeholderTextColor="#64748B"
                      value={pinInput}
                      onChangeText={setPinInput}
                    />
                    <TouchableOpacity
                      style={styles.driverActionBtnGreen}
                      onPress={() => {
                        const success = driverStartTrip(pinInput);
                        if (!success) {
                          Alert.alert('Invalid PIN', 'The 4-digit PIN does not match. Please verify with rider.');
                        }
                      }}
                    >
                      <Text style={styles.driverActionBtnText}>Start Trip (Verify PIN)</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {activeTrip.status === 'IN_TRIP' && (
                  <TouchableOpacity style={styles.driverActionBtnBlue} onPress={driverCompleteTrip}>
                    <Text style={styles.driverActionBtnText}>Complete Trip & Collect Fare</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* ==================== ADMIN OPERATIONS & VERIFICATION SUITE (ADMINS ONLY) ==================== */}
        {appMode === 'ADMIN' && currentUser?.role === 'ADMIN' && (
          <View style={styles.adminContainer}>
            {/* Admin Header Banner */}
            <View style={styles.adminBanner}>
              <View style={styles.adminBannerLeft}>
                <View style={styles.adminBadgeIcon}>
                  <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                </View>
                <View>
                  <Text style={styles.adminBannerTitle}>NTSA & Trust Verification</Text>
                  <Text style={styles.adminBannerSub}>
                    Admin: {currentUser?.fullName || 'Sarah Kemunto (Ops)'} • Central Desk
                  </Text>
                </View>
              </View>
              <View style={styles.adminLivePill}>
                <View style={styles.adminLiveDot} />
                <Text style={styles.adminLiveText}>LIVE</Text>
              </View>
            </View>

            {/* Quick Metrics Bar */}
            <View style={styles.adminMetricsRow}>
              <View style={styles.adminMetricCard}>
                <Text style={[styles.adminMetricVal, { color: '#10B981' }]}>
                  {adminLiveFleet.length}
                </Text>
                <Text style={styles.adminMetricLabel}>Online Fleet</Text>
              </View>
              <View style={styles.adminMetricDivider} />
              <View style={styles.adminMetricCard}>
                <Text style={[styles.adminMetricVal, { color: '#38BDF8' }]}>
                  {adminActiveTrips.length}
                </Text>
                <Text style={styles.adminMetricLabel}>Active Trips</Text>
              </View>
              <View style={styles.adminMetricDivider} />
              <View style={styles.adminMetricCard}>
                <Text style={styles.adminMetricVal}>
                  {adminDrivers.filter((d) => d.status === 'PENDING').length}
                </Text>
                <Text style={styles.adminMetricLabel}>Pending Drivers</Text>
              </View>
              <View style={styles.adminMetricDivider} />
              <View style={styles.adminMetricCard}>
                <Text style={[styles.adminMetricVal, { color: '#10B981' }]}>
                  KES {adminTransactions.reduce((sum, t) => sum + t.platformFee, 0).toFixed(0)}
                </Text>
                <Text style={styles.adminMetricLabel}>Fee Revenue</Text>
              </View>
            </View>

            {/* Sub-Tabs: LIVE_OPS | DRIVERS | RIDERS | TRANSACTIONS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.adminSubTabRow}>
              <TouchableOpacity
                style={[styles.adminSubTabBtn, adminSubTab === 'LIVE_OPS' && styles.adminSubTabBtnActive]}
                onPress={() => {
                  setAdminSubTab('LIVE_OPS');
                  refreshAdminLiveState();
                }}
              >
                <Ionicons
                  name="radio"
                  size={15}
                  color={adminSubTab === 'LIVE_OPS' ? '#070A0F' : '#10B981'}
                />
                <Text style={[styles.adminSubTabText, adminSubTab === 'LIVE_OPS' && styles.adminSubTabTextActive]}>
                  Live Ops ({adminActiveTrips.length + adminLiveFleet.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminSubTabBtn, adminSubTab === 'DRIVERS' && styles.adminSubTabBtnActive]}
                onPress={() => setAdminSubTab('DRIVERS')}
              >
                <Ionicons
                  name="bicycle"
                  size={15}
                  color={adminSubTab === 'DRIVERS' ? '#070A0F' : '#94A3B8'}
                />
                <Text style={[styles.adminSubTabText, adminSubTab === 'DRIVERS' && styles.adminSubTabTextActive]}>
                  Drivers ({adminDrivers.filter((d) => d.status === 'PENDING').length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminSubTabBtn, adminSubTab === 'RIDERS' && styles.adminSubTabBtnActive]}
                onPress={() => setAdminSubTab('RIDERS')}
              >
                <Ionicons
                  name="people"
                  size={15}
                  color={adminSubTab === 'RIDERS' ? '#070A0F' : '#94A3B8'}
                />
                <Text style={[styles.adminSubTabText, adminSubTab === 'RIDERS' && styles.adminSubTabTextActive]}>
                  Riders ({adminRiders.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminSubTabBtn, adminSubTab === 'TRANSACTIONS' && styles.adminSubTabBtnActive]}
                onPress={() => setAdminSubTab('TRANSACTIONS')}
              >
                <Ionicons
                  name="receipt"
                  size={15}
                  color={adminSubTab === 'TRANSACTIONS' ? '#070A0F' : '#94A3B8'}
                />
                <Text style={[styles.adminSubTabText, adminSubTab === 'TRANSACTIONS' && styles.adminSubTabTextActive]}>
                  M-Pesa ({adminTransactions.length})
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* TAB CONTENT: LIVE_OPS (REAL-TIME ACTIVE TRIPS & CONNECTED FLEET) */}
            {adminSubTab === 'LIVE_OPS' && (
              <View style={styles.adminListContainer}>
                {/* Header with quick refresh */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={styles.adminSectionHeader}>
                    REAL-TIME ACTIVE TRIPS ({adminActiveTrips.length})
                  </Text>
                  <TouchableOpacity
                    onPress={() => refreshAdminLiveState()}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: 8 }}
                  >
                    <Ionicons name="refresh" size={12} color="#10B981" />
                    <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '800' }}>Sync Desk</Text>
                  </TouchableOpacity>
                </View>

                {adminActiveTrips.length === 0 ? (
                  <View style={[styles.adminCard, { paddingVertical: 20, alignItems: 'center', gap: 6 }]}>
                    <Ionicons name="navigate-circle-outline" size={32} color="#64748B" />
                    <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                      No trips currently active
                    </Text>
                    <Text style={{ color: '#64748B', fontSize: 11, textAlign: 'center', maxWidth: 280 }}>
                      When a passenger books on any device, the dispatching trip will appear here instantly.
                    </Text>
                  </View>
                ) : (
                  adminActiveTrips.map((trip) => {
                    const statusColor =
                      trip.status === 'IN_TRIP' ? '#10B981' :
                      trip.status === 'DRIVER_ARRIVED' ? '#38BDF8' :
                      trip.status === 'DRIVER_ASSIGNED' ? '#F59E0B' : '#E2E8F0';
                    return (
                      <View key={trip.id} style={styles.adminCard}>
                        <View style={styles.adminCardTop}>
                          <View style={[styles.adminCardAvatar, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                            <Ionicons name="speedometer" size={20} color="#38BDF8" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.adminNameRow}>
                              <Text style={styles.adminCardTitle}>Trip #{trip.id.slice(0, 8)}</Text>
                              <View style={[styles.adminStatusBadge, { backgroundColor: `${statusColor}22` }]}>
                                <Text style={[styles.adminStatusText, { color: statusColor }]}>
                                  {trip.status.replace('_', ' ')}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.adminCardSub}>
                              Passenger: {trip.rider?.name || 'Passenger'} ({trip.rider?.phone || 'N/A'})
                            </Text>
                          </View>
                        </View>

                        <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 8, padding: 10, gap: 6, marginVertical: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="radio-button-on" size={13} color="#10B981" />
                            <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                              Pickup: {trip.pickup?.placeName || trip.pickup?.address || 'Pickup'}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="location" size={13} color="#EF4444" />
                            <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                              Dropoff: {trip.destination?.placeName || trip.destination?.address || 'Destination'}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.06)', paddingTop: 6 }}>
                            <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                              Fare: <Text style={{ color: '#10B981', fontWeight: '800' }}>KES {trip.fare?.totalFare || (trip as any).fare?.amount || 0}</Text>
                            </Text>
                            {trip.ridePin && (
                              <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                                PIN: <Text style={{ color: '#F59E0B', fontWeight: '800', letterSpacing: 1 }}>{trip.ridePin}</Text>
                              </Text>
                            )}
                            <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                              Driver: <Text style={{ color: '#38BDF8', fontWeight: '700' }}>{trip.driver?.name || 'Searching...'}</Text>
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}

                {/* Section 2: Online Connected Fleet */}
                <Text style={[styles.adminSectionHeader, { marginTop: 14 }]}>
                  CONNECTED FLEET TELEMETRY ({adminLiveFleet.length} ONLINE)
                </Text>

                {adminLiveFleet.length === 0 ? (
                  <View style={[styles.adminCard, { paddingVertical: 20, alignItems: 'center', gap: 6 }]}>
                    <Ionicons name="bicycle-outline" size={32} color="#64748B" />
                    <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                      No drivers currently transmitting
                    </Text>
                    <Text style={{ color: '#64748B', fontSize: 11, textAlign: 'center', maxWidth: 280 }}>
                      When a driver opens the app and toggles 'Online', their live coordinates and status will appear here.
                    </Text>
                  </View>
                ) : (
                  adminLiveFleet.map((fleetDriver) => (
                    <View key={fleetDriver.driverId || fleetDriver.id} style={styles.adminCard}>
                      <View style={styles.adminCardTop}>
                        <View style={[styles.adminCardAvatar, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                          <Ionicons name="bicycle" size={20} color="#10B981" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.adminNameRow}>
                            <Text style={styles.adminCardTitle}>{fleetDriver.name || 'Boda Operator'}</Text>
                            <View style={[styles.adminStatusBadge, styles.statusBadgeApproved]}>
                              <Text style={[styles.adminStatusText, styles.statusTextApproved]}>
                                {fleetDriver.status || 'ONLINE'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.adminCardSub}>
                            {fleetDriver.phone || '+254...'} • {fleetDriver.plate || 'KMDK 234P'} ({fleetDriver.vehicleModel || 'Boxer 150X'})
                          </Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 8, padding: 8, marginTop: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="navigate" size={13} color="#10B981" />
                          <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                            GPS: <Text style={{ color: '#E2E8F0', fontWeight: '700' }}>{fleetDriver.location?.latitude?.toFixed(4) || '1.2405'}, {fleetDriver.location?.longitude?.toFixed(4) || '35.1135'}</Text>
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                          <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '800' }}>Live Telemetry</Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB CONTENT: DRIVERS */}
            {adminSubTab === 'DRIVERS' && (
              <View style={styles.adminListContainer}>
                <Text style={styles.adminSectionHeader}>
                  DRIVER ONBOARDING & DOCUMENT VERIFICATION
                </Text>
                {adminDrivers.map((driver) => (
                  <View key={driver.id} style={styles.adminCard}>
                    <View style={styles.adminCardTop}>
                      <View style={styles.adminCardAvatar}>
                        <Ionicons name="person" size={20} color="#10B981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.adminNameRow}>
                          <Text style={styles.adminCardTitle}>{driver.name}</Text>
                          <View
                            style={[
                              styles.adminStatusBadge,
                              driver.status === 'APPROVED' && styles.statusBadgeApproved,
                              driver.status === 'PENDING' && styles.statusBadgePending,
                              driver.status === 'REJECTED' && styles.statusBadgeRejected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.adminStatusText,
                                driver.status === 'APPROVED' && styles.statusTextApproved,
                                driver.status === 'PENDING' && styles.statusTextPending,
                                driver.status === 'REJECTED' && styles.statusTextRejected,
                              ]}
                            >
                              {driver.status}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.adminCardSub}>
                          {driver.phone} • {driver.plate} ({driver.vehicleModel})
                        </Text>
                      </View>
                    </View>

                    {/* Verification Checklist */}
                    <View style={styles.adminDocChecklist}>
                      <View style={styles.docCheckItem}>
                        <Ionicons name="card" size={14} color="#94A3B8" />
                        <Text style={styles.docCheckText}>
                          National ID: <Text style={styles.docCheckValue}>{driver.nationalId}</Text>
                        </Text>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      </View>
                      <View style={styles.docCheckItem}>
                        <Ionicons name="ribbon" size={14} color="#94A3B8" />
                        <Text style={styles.docCheckText}>
                          DL: <Text style={styles.docCheckValue}>{driver.dlNumber}</Text>
                        </Text>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      </View>
                      <View style={styles.docCheckItem}>
                        <Ionicons name="document-text" size={14} color="#94A3B8" />
                        <Text style={styles.docCheckText}>
                          Logbook:{' '}
                          <Text style={styles.docCheckValue}>
                            {driver.logbookVerified ? 'NTSA Verified' : 'Unconfirmed'}
                          </Text>
                        </Text>
                        <Ionicons
                          name={driver.logbookVerified ? 'checkmark-circle' : 'alert-circle'}
                          size={14}
                          color={driver.logbookVerified ? '#10B981' : '#F59E0B'}
                        />
                      </View>
                      <View style={styles.docCheckItem}>
                        <Ionicons name="shield" size={14} color="#94A3B8" />
                        <Text style={styles.docCheckText}>
                          Insurance Exp:{' '}
                          <Text style={styles.docCheckValue}>{driver.insuranceExpiry}</Text>
                        </Text>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.adminCardActions}>
                      <TouchableOpacity
                        style={styles.adminInspectBtn}
                        onPress={() => {
                          setSelectedDriverDoc(driver);
                          setShowDriverDocModal(true);
                        }}
                      >
                        <Ionicons name="eye-outline" size={14} color="#F8FAFC" />
                        <Text style={styles.adminInspectBtnText}>Inspect Docs</Text>
                      </TouchableOpacity>

                      {driver.status === 'PENDING' && (
                        <>
                          <TouchableOpacity
                            style={styles.adminRejectBtn}
                            onPress={() => {
                              rejectDriver(driver.id);
                              Alert.alert('Driver Rejected', `${driver.name} has been rejected.`);
                            }}
                          >
                            <Ionicons name="close" size={14} color="#EF4444" />
                            <Text style={styles.adminRejectBtnText}>Reject</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.adminApproveBtn}
                            onPress={() => {
                              approveDriver(driver.id);
                              Alert.alert('Driver Approved', `${driver.name} is now approved to accept rides.`);
                            }}
                          >
                            <Ionicons name="checkmark" size={14} color="#070A0F" />
                            <Text style={styles.adminApproveBtnText}>Approve</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* TAB CONTENT: RIDERS */}
            {adminSubTab === 'RIDERS' && (
              <View style={styles.adminListContainer}>
                <Text style={styles.adminSectionHeader}>
                  RIDER KYC VERIFICATION & RISK AUDIT
                </Text>
                {adminRiders.map((rider) => (
                  <View key={rider.id} style={styles.adminCard}>
                    <View style={styles.adminCardTop}>
                      <View style={[styles.adminCardAvatar, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                        <Ionicons name="person" size={20} color="#3B82F6" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.adminNameRow}>
                          <Text style={styles.adminCardTitle}>{rider.name}</Text>
                          <View
                            style={[
                              styles.adminStatusBadge,
                              rider.status === 'VERIFIED' && styles.statusBadgeApproved,
                              rider.status === 'PENDING_KYC' && styles.statusBadgePending,
                              rider.status === 'FLAGGED' && styles.statusBadgeRejected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.adminStatusText,
                                rider.status === 'VERIFIED' && styles.statusTextApproved,
                                rider.status === 'PENDING_KYC' && styles.statusTextPending,
                                rider.status === 'FLAGGED' && styles.statusTextRejected,
                              ]}
                            >
                              {rider.status}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.adminCardSub}>
                          {rider.phone} • {rider.email}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.adminRiderMetaRow}>
                      <View style={styles.riderMetaChip}>
                        <Text style={styles.riderMetaChipLabel}>Trips:</Text>
                        <Text style={styles.riderMetaChipVal}>{rider.tripsCount}</Text>
                      </View>
                      <View style={styles.riderMetaChip}>
                        <Text style={styles.riderMetaChipLabel}>M-Pesa Match:</Text>
                        <Text
                          style={[
                            styles.riderMetaChipVal,
                            { color: rider.mpesaKycVerified ? '#10B981' : '#F59E0B' },
                          ]}
                        >
                          {rider.mpesaKycVerified ? 'Verified' : 'Pending'}
                        </Text>
                      </View>
                      <View style={styles.riderMetaChip}>
                        <Text style={styles.riderMetaChipLabel}>Risk Level:</Text>
                        <Text
                          style={[
                            styles.riderMetaChipVal,
                            {
                              color:
                                rider.riskScore === 'LOW'
                                  ? '#10B981'
                                  : rider.riskScore === 'MEDIUM'
                                  ? '#F59E0B'
                                  : '#EF4444',
                            },
                          ]}
                        >
                          {rider.riskScore}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.adminCardActions}>
                      <TouchableOpacity
                        style={styles.adminFlagRiskBtn}
                        onPress={() => {
                          flagRiderRisk(rider.id);
                          Alert.alert('Risk Status Updated', `${rider.name} risk status has been toggled.`);
                        }}
                      >
                        <Ionicons name="flag-outline" size={14} color="#F59E0B" />
                        <Text style={styles.adminFlagRiskText}>
                          {rider.status === 'FLAGGED' ? 'Unflag Account' : 'Flag Risk'}
                        </Text>
                      </TouchableOpacity>

                      {rider.status !== 'VERIFIED' && (
                        <TouchableOpacity
                          style={styles.adminApproveBtn}
                          onPress={() => {
                            verifyRiderKyc(rider.id);
                            Alert.alert('KYC Approved', `${rider.name} is now verified with Safaricom M-Pesa KYC.`);
                          }}
                        >
                          <Ionicons name="checkmark-done" size={14} color="#070A0F" />
                          <Text style={styles.adminApproveBtnText}>Verify KYC</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* TAB CONTENT: TRANSACTIONS & M-PESA AUDIT */}
            {adminSubTab === 'TRANSACTIONS' && (
              <View style={styles.adminListContainer}>
                <Text style={styles.adminSectionHeader}>
                  SAFARICOM M-PESA TRANSACTIONS & SETTLEMENT AUDIT
                </Text>

                {/* Financial Summary Strip */}
                <View style={styles.txSummaryBox}>
                  <View style={styles.txSummaryCol}>
                    <Text style={styles.txSummaryLabel}>TOTAL GROSS</Text>
                    <Text style={styles.txSummaryVal}>
                      KES {adminTransactions.reduce((acc, t) => acc + t.grossAmount, 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.txSummaryDivider} />
                  <View style={styles.txSummaryCol}>
                    <Text style={styles.txSummaryLabel}>DRIVER (85%)</Text>
                    <Text style={[styles.txSummaryVal, { color: '#38BDF8' }]}>
                      KES {adminTransactions.reduce((acc, t) => acc + t.driverPayout, 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.txSummaryDivider} />
                  <View style={styles.txSummaryCol}>
                    <Text style={styles.txSummaryLabel}>FEE (15%)</Text>
                    <Text style={[styles.txSummaryVal, { color: '#10B981' }]}>
                      KES {adminTransactions.reduce((acc, t) => acc + t.platformFee, 0).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {adminTransactions.map((tx) => (
                  <View key={tx.id} style={styles.adminCard}>
                    <View style={styles.adminCardTop}>
                      <View style={[styles.adminCardAvatar, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                        <Ionicons name="receipt" size={20} color="#10B981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.adminNameRow}>
                          <Text style={styles.adminCardTitle}>Receipt: {tx.mpesaReceiptNo}</Text>
                          <View
                            style={[
                              styles.adminStatusBadge,
                              tx.status === 'SETTLED' && styles.statusBadgeApproved,
                              tx.status === 'PENDING' && styles.statusBadgePending,
                              tx.status === 'FLAGGED' && styles.statusBadgeRejected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.adminStatusText,
                                tx.status === 'SETTLED' && styles.statusTextApproved,
                                tx.status === 'PENDING' && styles.statusTextPending,
                                tx.status === 'FLAGGED' && styles.statusTextRejected,
                              ]}
                            >
                              {tx.status}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.adminCardSub}>
                          {tx.timestamp} • Trip #{tx.tripId}
                        </Text>
                      </View>
                    </View>

                    {/* Parties and Amounts */}
                    <View style={styles.txPartyRow}>
                      <Text style={styles.txPartyText}>
                        Rider: <Text style={styles.txPartyBold}>{tx.riderName}</Text>
                      </Text>
                      <Ionicons name="arrow-forward" size={12} color="#64748B" />
                      <Text style={styles.txPartyText}>
                        Driver: <Text style={styles.txPartyBold}>{tx.driverName}</Text>
                      </Text>
                    </View>

                    <View style={styles.txBreakdownBox}>
                      <View style={styles.txBreakRow}>
                        <Text style={styles.txBreakLabel}>Gross Ride Fare:</Text>
                        <Text style={styles.txBreakVal}>KES {tx.grossAmount.toFixed(2)}</Text>
                      </View>
                      <View style={styles.txBreakRow}>
                        <Text style={styles.txBreakLabel}>Driver Net Payout (85%):</Text>
                        <Text style={[styles.txBreakVal, { color: '#38BDF8' }]}>
                          KES {tx.driverPayout.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.txBreakRow}>
                        <Text style={styles.txBreakLabel}>SwiftBoda Commission (15%):</Text>
                        <Text style={[styles.txBreakVal, { color: '#10B981' }]}>
                          KES {tx.platformFee.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.txBreakRow}>
                        <Text style={styles.txBreakLabel}>Payment Gateway:</Text>
                        <Text style={styles.txBreakVal}>{tx.paymentMethod}</Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.adminCardActions}>
                      <TouchableOpacity
                        style={styles.adminInspectBtn}
                        onPress={() => {
                          setSelectedTxAudit(tx);
                          setShowTxAuditModal(true);
                        }}
                      >
                        <Ionicons name="document-text-outline" size={14} color="#F8FAFC" />
                        <Text style={styles.adminInspectBtnText}>Audit Receipt</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.adminReconcileBtn}
                        onPress={() => {
                          auditTransaction(tx.id);
                          Alert.alert('Daraja Reconciled', `Receipt ${tx.mpesaReceiptNo} reconciled against Safaricom B2C ledger.`);
                        }}
                      >
                        <Ionicons name="sync" size={14} color="#070A0F" />
                        <Text style={styles.adminReconcileBtnText}>Reconcile</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 4. UBER SEARCH DESTINATION MODAL */}
      <Modal visible={showSearchModal} animationType="slide" transparent={false}>
        <View style={[styles.searchModalContainer, { paddingTop: Math.max(insets.top + 8, 20) }]}>
          {/* Header */}
          <View style={styles.searchModalHeader}>
            <TouchableOpacity onPress={() => setShowSearchModal(false)} style={styles.searchBackBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.searchModalTitle}>Plan your ride</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Pickup & Destination Inputs */}
          <View style={styles.searchInputsContainer}>
            <View style={styles.pickupInputRow}>
              <View style={[styles.searchDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.pickupInputStatic}>Current Location (West Pokot • Makutano)</Text>
            </View>

            <View style={styles.searchConnectorLine} />

            <View style={styles.destinationInputRow}>
              <View style={[styles.searchDot, { backgroundColor: theme.textPrimary }]} />
              <TextInput
                style={styles.destinationTextInput}
                placeholder="Where to?"
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Autocomplete Results List */}
          <ScrollView
            style={styles.searchResultsList}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* SAVED PLACES (HOME, WORK, GYM, ETC.) */}
            {savedPlaces && savedPlaces.length > 0 && !searchQuery && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.searchSectionLabel}>SAVED PLACES</Text>
                {savedPlaces.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    style={styles.searchResultItem}
                    onPress={() => {
                      setDestinationLocation({
                        latitude: place.lat,
                        longitude: place.lon,
                        address: place.address,
                        placeName: place.name,
                      });
                      setShowSearchModal(false);
                      setSearchQuery('');
                    }}
                  >
                    <View style={[styles.searchResultIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                      <Ionicons
                        name={
                          place.icon === 'home'
                            ? 'home'
                            : place.icon === 'work' || place.icon === 'briefcase'
                            ? 'briefcase'
                            : place.icon === 'gym' || place.icon === 'barbell'
                            ? 'barbell'
                            : 'bookmark'
                        }
                        size={20}
                        color="#10B981"
                      />
                    </View>
                    <View style={styles.searchResultMeta}>
                      <Text style={styles.searchResultName}>{place.name}</Text>
                      <Text style={styles.searchResultAddress} numberOfLines={1}>
                        {place.address}
                      </Text>
                    </View>
                    <View style={styles.searchResultDistance}>
                      <Text style={styles.searchResultDistText}>Saved</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* LIVE SERPLY SEARCH RESULTS / STATES */}
            {isSearchingPlaces ? (
              <View style={styles.searchStatusBox}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.searchStatusTitle}>Searching live Google Maps...</Text>
                <Text style={styles.searchStatusSubtitle}>Fetching real places and coordinates from Serply</Text>
              </View>
            ) : searchError ? (
              <View style={styles.searchStatusBox}>
                <Ionicons name="alert-circle" size={36} color="#EF4444" />
                <Text style={styles.searchStatusTitle}>Search Unavailable</Text>
                <Text style={styles.searchStatusSubtitle}>{searchError}</Text>
                <TouchableOpacity
                  style={styles.searchRetryBtn}
                  onPress={async () => {
                    if (!searchQuery.trim()) return;
                    setIsSearchingPlaces(true);
                    setSearchError(null);
                    try {
                      const res = await searchPlacesLive(searchQuery.trim());
                      setPlacesResults(res.places);
                    } catch (e: any) {
                      setSearchError(e.message || 'Retry failed');
                    } finally {
                      setIsSearchingPlaces(false);
                    }
                  }}
                >
                  <Text style={styles.searchRetryBtnText}>Retry Search</Text>
                </TouchableOpacity>
              </View>
            ) : searchQuery && placesResults.length === 0 ? (
              <View style={styles.searchStatusBox}>
                <Ionicons name="search-outline" size={36} color="#64748B" />
                <Text style={styles.searchStatusTitle}>No places found for your search.</Text>
                <Text style={styles.searchStatusSubtitle}>
                  Try searching with more specific keywords or different locations across Kenya.
                </Text>
              </View>
            ) : placesResults.length > 0 ? (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={styles.searchSectionLabel}>PLACES FOUND ({placesResults.length})</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="globe-outline" size={12} color="#10B981" />
                    <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '700' }}>Live Google Maps</Text>
                  </View>
                </View>

                {placesResults.map((place) => {
                  const distanceKm = userLocation
                    ? calculateHaversineDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        place.latitude,
                        place.longitude
                      ).toFixed(1)
                    : null;

                  const firstHoursEntry = place.openingHours
                    ? Object.entries(place.openingHours)[0]
                    : null;

                  return (
                    <View key={place.id} style={styles.placeCardContainer}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleSelectPlace(place)}
                        style={styles.placeCardHeader}
                      >
                        {place.thumbnail ? (
                          <Image
                            source={{ uri: place.thumbnail }}
                            style={styles.placeCardThumb}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.placeCardThumbPlaceholder}>
                            <Ionicons name="location" size={26} color="#10B981" />
                          </View>
                        )}

                        <View style={styles.placeCardMeta}>
                          <Text style={styles.placeCardName} numberOfLines={1}>
                            {place.name}
                          </Text>
                          <Text style={styles.placeCardAddress} numberOfLines={2}>
                            {place.address || place.district || 'Address unavailable'}
                          </Text>

                          <View style={styles.placeCardBadgeRow}>
                            {place.rating !== null ? (
                              <View style={styles.placeRatingBadge}>
                                <Ionicons name="star" size={12} color="#F59E0B" />
                                <Text style={styles.placeRatingText}>
                                  {place.rating.toFixed(1)}
                                  {place.reviewCount ? ` (${place.reviewCount})` : ''}
                                </Text>
                              </View>
                            ) : null}

                            {place.categories.slice(0, 2).map((cat, idx) => (
                              <View key={idx} style={styles.placeCategoryBadge}>
                                <Text style={styles.placeCategoryText}>{cat}</Text>
                              </View>
                            ))}

                            {distanceKm !== null ? (
                              <View style={[styles.placeCategoryBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                                <Text style={[styles.placeCategoryText, { color: '#10B981' }]}>
                                  {distanceKm} km away
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          {firstHoursEntry ? (
                            <Text style={styles.placeHoursText} numberOfLines={1}>
                              🕒 {firstHoursEntry[0]}: {firstHoursEntry[1]}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>

                      {/* Action Buttons */}
                      <View style={styles.placeCardActions}>
                        <TouchableOpacity
                          style={styles.placeSelectBtn}
                          onPress={() => handleSelectPlace(place)}
                        >
                          <Ionicons name="navigate" size={16} color="#FFFFFF" />
                          <Text style={styles.placeSelectBtnText}>Set as Destination</Text>
                        </TouchableOpacity>

                        {place.googleMapsUrl ? (
                          <TouchableOpacity
                            style={styles.placeActionIconBtn}
                            onPress={() => Linking.openURL(place.googleMapsUrl!)}
                          >
                            <Ionicons name="map-outline" size={18} color={theme.textPrimary} />
                          </TouchableOpacity>
                        ) : null}

                        {place.phoneE164 || place.phone ? (
                          <TouchableOpacity
                            style={styles.placeActionIconBtn}
                            onPress={() => Linking.openURL(`tel:${place.phoneE164 || place.phone}`)}
                          >
                            <Ionicons name="call-outline" size={18} color="#10B981" />
                          </TouchableOpacity>
                        ) : null}

                        {place.website ? (
                          <TouchableOpacity
                            style={styles.placeActionIconBtn}
                            onPress={() => Linking.openURL(place.website!)}
                          >
                            <Ionicons name="globe-outline" size={18} color={theme.textPrimary} />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View>
                <Text style={styles.searchSectionLabel}>POPULAR SEARCHES</Text>
                {[
                  { query: 'Coffee shops in Nairobi', icon: 'cafe-outline' },
                  { query: 'Hospitals in Nairobi', icon: 'medkit-outline' },
                  { query: 'Restaurants in Westlands Nairobi', icon: 'restaurant-outline' },
                  { query: 'Banks in CBD Nairobi', icon: 'business-outline' },
                  { query: 'Hotels in Mombasa', icon: 'bed-outline' },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.query}
                    style={styles.searchResultItem}
                    onPress={() => setSearchQuery(s.query)}
                  >
                    <View style={styles.searchResultIcon}>
                      <Ionicons name={s.icon as any} size={20} color="#10B981" />
                    </View>
                    <View style={styles.searchResultMeta}>
                      <Text style={styles.searchResultName}>{s.query}</Text>
                      <Text style={styles.searchResultAddress}>Tap to search real Google Maps places</Text>
                    </View>
                    <Ionicons name="search" size={16} color="#64748B" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* 5. IN-APP DRIVER CHAT MODAL */}
      <Modal visible={showChatModal} animationType="slide" transparent={false}>
        <View style={[styles.chatModalContainer, { paddingTop: Math.max(insets.top + 8, 20) }]}>
          <View style={styles.chatModalHeader}>
            <TouchableOpacity onPress={() => setShowChatModal(false)} style={styles.searchBackBtn}>
              <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
            </TouchableOpacity>
            <View>
              <Text style={styles.chatDriverName}>{activeTrip?.driver?.name || 'Kipchoge Moto'}</Text>
              <Text style={styles.chatDriverSub}>{activeTrip?.driver?.vehiclePlate} • TVS HLX 150</Text>
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert('Calling Driver', `Dialing ${activeTrip?.driver?.phone}...`)}
              style={styles.chatCallBtn}
            >
              <Ionicons name="call" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>

          {/* Quick replies */}
          <View style={styles.quickRepliesRow}>
            {["I'm at the entrance", 'Waiting at the gate', 'Be right there!'].map((msg) => (
              <TouchableOpacity
                key={msg}
                style={styles.quickReplyChip}
                onPress={() => sendChatMessage(msg)}
              >
                <Text style={styles.quickReplyText}>{msg}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Messages */}
          <ScrollView style={styles.chatMessagesScroll} contentContainerStyle={{ padding: 16, gap: 12 }}>
            {chatMessages.map((msg) => (
              <View
                key={msg.id}
                style={[styles.chatBubble, msg.sender === 'RIDER' ? styles.chatBubbleRider : styles.chatBubbleDriver]}
              >
                <Text style={styles.chatText}>{msg.text}</Text>
                <Text style={styles.chatTime}>{msg.time}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={[styles.chatInputRow, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TextInput
              style={styles.chatTextInput}
              placeholder="Send message to driver..."
              placeholderTextColor="#64748B"
              value={chatInput}
              onChangeText={setChatInput}
            />
            <TouchableOpacity
              style={styles.chatSendBtn}
              onPress={() => {
                sendChatMessage(chatInput);
                setChatInput('');
              }}
            >
              <Ionicons name="send" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 6. PAYMENT METHOD SELECTOR MODAL */}
      <Modal visible={showPaymentModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalCard}>
            <Text style={styles.paymentModalTitle}>Select Payment Method</Text>

            <TouchableOpacity
              style={[styles.pmOptionRow, paymentMethod === 'MPESA' && styles.pmOptionRowSelected]}
              onPress={() => {
                setPaymentMethod('MPESA');
                setShowPaymentModal(false);
              }}
            >
              <Ionicons name="phone-portrait" size={20} color="#10B981" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.pmOptionTitle}>Safaricom M-Pesa</Text>
                <Text style={styles.pmOptionSub}>Instant STK Push to phone</Text>
              </View>
              {paymentMethod === 'MPESA' && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pmOptionRow, paymentMethod === 'WALLET' && styles.pmOptionRowSelected]}
              onPress={() => {
                setPaymentMethod('WALLET');
                setShowPaymentModal(false);
              }}
            >
              <Ionicons name="wallet" size={20} color="#10B981" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.pmOptionTitle}>Swift Wallet</Text>
                <Text style={styles.pmOptionSub}>Balance: KES {walletBalance.toFixed(2)}</Text>
              </View>
              {paymentMethod === 'WALLET' && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pmOptionRow, paymentMethod === 'CASH' && styles.pmOptionRowSelected]}
              onPress={() => {
                setPaymentMethod('CASH');
                setShowPaymentModal(false);
              }}
            >
              <Ionicons name="cash" size={20} color="#10B981" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.pmOptionTitle}>Cash</Text>
                <Text style={styles.pmOptionSub}>Pay driver directly upon arrival</Text>
              </View>
              {paymentMethod === 'CASH' && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.closePaymentBtn} onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.closePaymentBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 7. UBER RATING & TIP MODAL */}
      <Modal visible={showRatingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.ratingCard}>
            <View style={styles.ratingAvatarCircle}>
              <Ionicons name="bicycle" size={32} color="#10B981" />
            </View>

            <Text style={styles.ratingModalTitle}>How was your ride with Kipchoge?</Text>
            <Text style={styles.ratingModalSub}>TVS HLX 150 • KMC 123A</Text>

            {/* 5 Stars */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
                  <Ionicons
                    name={star <= selectedRating ? 'star' : 'star-outline'}
                    size={36}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Compliments */}
            <View style={styles.complimentsRow}>
              {['Clean helmet', 'Smooth ride', 'Courteous', 'Great navigation'].map((item) => {
                const active = selectedCompliments.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.complimentChip, active && styles.complimentChipActive]}
                    onPress={() => {
                      if (active) {
                        setSelectedCompliments(selectedCompliments.filter((c) => c !== item));
                      } else {
                        setSelectedCompliments([...selectedCompliments, item]);
                      }
                    }}
                  >
                    <Text style={[styles.complimentText, active && styles.complimentTextActive]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tip Selector */}
            <Text style={styles.tipLabel}>Add a tip for Kipchoge:</Text>
            <View style={styles.tipButtonsRow}>
              {[0, 50, 100, 200].map((tip) => (
                <TouchableOpacity
                  key={tip}
                  style={[styles.tipChip, selectedTip === tip && styles.tipChipActive]}
                  onPress={() => setSelectedTip(tip)}
                >
                  <Text style={[styles.tipText, selectedTip === tip && styles.tipTextActive]}>
                    {tip === 0 ? 'No Tip' : `+KES ${tip}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Itemized Fare Summary */}
            <View style={styles.receiptBox}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Ride Fare</Text>
                <Text style={styles.receiptValue}>KES {activeTrip?.fare.totalFare || 140}</Text>
              </View>
              {selectedTip > 0 && (
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Driver Tip</Text>
                  <Text style={styles.receiptValue}>+KES {selectedTip}</Text>
                </View>
              )}
              <View style={[styles.receiptRow, { borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingTop: 6, marginTop: 4 }]}>
                <Text style={styles.receiptTotalLabel}>Total Charged</Text>
                <Text style={styles.receiptTotalValue}>
                  KES {(activeTrip?.fare.totalFare || 140) + selectedTip}
                </Text>
              </View>
            </View>

            {/* PDF Receipt Export Button */}
            <TouchableOpacity
              style={styles.pdfReceiptBtn}
              onPress={async () => {
                if (activeTrip) {
                  try {
                    setIsExportingPdf(true);
                    await generateAndShareReceiptPDF({
                      id: activeTrip.id,
                      createdAt: activeTrip.createdAt || new Date().toISOString(),
                      completedAt: new Date().toISOString(),
                      riderName: currentUser?.fullName || 'Valued Passenger',
                      riderPhone: currentUser?.phoneNumber || '+254712345001',
                      driverName: activeTrip.driver?.name || 'Kipchoge Chemokil',
                      driverPhone: activeTrip.driver?.phone || '+254722001122',
                      vehicleModel: activeTrip.driver?.vehicleModel || 'Bajaj Boxer 150X',
                      vehiclePlate: activeTrip.driver?.vehiclePlate || 'KMDK 234P',
                      category: activeTrip.category || 'STANDARD_BODA',
                      pickupAddress: activeTrip.pickup?.address || userLocation?.address || 'Pickup Point',
                      destinationAddress: activeTrip.destination?.placeName || activeTrip.destination?.address || 'Destination',
                      distanceKm: activeTrip.fare?.estimatedDistanceKm || 2.4,
                      durationMin: activeTrip.fare?.estimatedDurationMin || 7,
                      baseFare: activeTrip.fare?.baseFare || 50,
                      distanceFare: activeTrip.fare?.distanceFare || 60,
                      timeFare: activeTrip.fare?.timeFare || 15,
                      bookingFee: activeTrip.fare?.bookingFee || 15,
                      tipAmount: selectedTip,
                      totalFare: (activeTrip.fare?.totalFare || 140) + selectedTip,
                      paymentMethod: activeTrip.paymentMethod || 'MPESA',
                    });
                  } catch (e) {
                    // handled
                  } finally {
                    setIsExportingPdf(false);
                  }
                }
              }}
              disabled={isExportingPdf}
              activeOpacity={0.8}
            >
              {isExportingPdf ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={18} color="#10B981" />
                  <Text style={styles.pdfReceiptText}>Download Official PDF Receipt</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitRatingBtn}
              onPress={() => {
                rateTrip(selectedRating, selectedCompliments.join(', '), selectedTip);
                setShowRatingModal(false);
              }}
            >
              <Text style={styles.submitRatingText}>Complete & Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 8. AUTHENTICATION & ONBOARDING MODAL */}
      <AuthModal
        visible={showAuthModal || (!isAuthenticated && !hasDismissedAuth)}
        onClose={() => {
          setShowAuthModal(false);
          setHasDismissedAuth(true);
        }}
      />

      {/* 9. RIDER SELECTOR MODAL (WHO IS RIDING?) */}
      <Modal visible={showRiderSelectorModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.riderModalCard}>
            <View style={styles.riderModalHeader}>
              <Text style={styles.riderModalTitle}>Who is riding?</Text>
              <TouchableOpacity onPress={() => setShowRiderSelectorModal(false)}>
                <Ionicons name="close" size={24} color="#F8FAFC" />
              </TouchableOpacity>
            </View>

            {/* Option 1: For Me */}
            <TouchableOpacity
              style={[
                styles.riderOptionCard,
                !bookingForOther.enabled && styles.riderOptionCardSelected,
              ]}
              onPress={() => {
                setBookingForOther({ enabled: false, name: '', phone: '' });
                setShowRiderSelectorModal(false);
              }}
            >
              <View style={styles.riderOptionAvatar}>
                <Ionicons name="person" size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.riderOptionName}>For Me ({currentUser?.fullName || 'Grace Wanjiku'})</Text>
                <Text style={styles.riderOptionSub}>{currentUser?.phoneNumber || '+254 712 345 001'}</Text>
              </View>
              {!bookingForOther.enabled && (
                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              )}
            </TouchableOpacity>

            {/* Option 2: Someone Else */}
            <View
              style={[
                styles.riderOptionCardOther,
                bookingForOther.enabled && styles.riderOptionCardSelected,
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={[styles.riderOptionAvatar, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Ionicons name="people" size={20} color="#F59E0B" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.riderOptionName}>Book for Someone Else</Text>
                  <Text style={styles.riderOptionSub}>Driver sees passenger details & SMS tracking link sent</Text>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                <TextInput
                  style={styles.otherRiderInput}
                  placeholder="Passenger Name (e.g. Brian Otieno)"
                  placeholderTextColor="#64748B"
                  value={otherRiderName}
                  onChangeText={setOtherRiderName}
                />
                <TextInput
                  style={styles.otherRiderInput}
                  placeholder="Passenger Phone (+254 7XX XXX XXX)"
                  placeholderTextColor="#64748B"
                  keyboardType="phone-pad"
                  value={otherRiderPhone}
                  onChangeText={setOtherRiderPhone}
                />

                {/* Quick Presets */}
                <View style={styles.presetRidersRow}>
                  <TouchableOpacity
                    style={styles.presetRiderChip}
                    onPress={() => {
                      setOtherRiderName('Brian Otieno');
                      setOtherRiderPhone('+254798654321');
                    }}
                  >
                    <Text style={styles.presetRiderText}>Brian (+254 798...)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetRiderChip}
                    onPress={() => {
                      setOtherRiderName('Amina Hassan');
                      setOtherRiderPhone('+254711998877');
                    }}
                  >
                    <Text style={styles.presetRiderText}>Amina (+254 711...)</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.saveOtherRiderBtn}
                  onPress={() => {
                    if (!otherRiderName.trim()) {
                      Alert.alert('Name Required', 'Please enter the passenger\'s name.');
                      return;
                    }
                    setBookingForOther({
                      enabled: true,
                      name: otherRiderName.trim(),
                      phone: otherRiderPhone.trim() || '+254700000000',
                    });
                    setShowRiderSelectorModal(false);
                  }}
                >
                  <Text style={styles.saveOtherRiderBtnText}>Set as Passenger</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 8. DRIVER DOCUMENT INSPECTION MODAL */}
      <Modal visible={showDriverDocModal} animationType="slide" transparent>
        <View style={styles.modalOverlayDark}>
          <View style={[styles.adminModalCard, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <View style={styles.adminModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                <Text style={styles.adminModalTitle}>Driver Document Dossier</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDriverDocModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {selectedDriverDoc && (
              <ScrollView style={{ maxHeight: 420 }}>
                {/* Driver Profile Summary */}
                <View style={styles.dossierProfileHeader}>
                  <View style={styles.dossierAvatar}>
                    <Ionicons name="person" size={28} color="#10B981" />
                  </View>
                  <View>
                    <Text style={styles.dossierDriverName}>{selectedDriverDoc.name}</Text>
                    <Text style={styles.dossierDriverSub}>
                      {selectedDriverDoc.phone} • {selectedDriverDoc.plate}
                    </Text>
                    <Text style={styles.dossierVehicleBadge}>
                      {selectedDriverDoc.vehicleModel} ({selectedDriverDoc.category})
                    </Text>
                  </View>
                </View>

                {/* Digital NTSA Certificate Card Preview */}
                <View style={styles.docCertPreviewCard}>
                  <View style={styles.docCertHeader}>
                    <Text style={styles.docCertAgency}>REPUBLIC OF KENYA • NTSA DIGITAL PORTAL</Text>
                    <Text style={styles.docCertType}>COMMERCIAL MOTORCYCLE OPERATOR</Text>
                  </View>

                  <View style={styles.docCertGrid}>
                    <View style={styles.docCertItem}>
                      <Text style={styles.docCertLabel}>NATIONAL ID NUMBER</Text>
                      <Text style={styles.docCertVal}>{selectedDriverDoc.nationalId}</Text>
                      <Text style={styles.docCertStatusGreen}>✓ IPRS Verified</Text>
                    </View>
                    <View style={styles.docCertItem}>
                      <Text style={styles.docCertLabel}>DRIVING LICENSE</Text>
                      <Text style={styles.docCertVal}>{selectedDriverDoc.dlNumber}</Text>
                      <Text style={styles.docCertStatusGreen}>✓ Class A2 (Motorbike)</Text>
                    </View>
                    <View style={styles.docCertItem}>
                      <Text style={styles.docCertLabel}>LOGBOOK OWNERSHIP</Text>
                      <Text style={styles.docCertVal}>
                        {selectedDriverDoc.logbookVerified ? 'MATCH: Owner' : 'UNCONFIRMED'}
                      </Text>
                      <Text style={styles.docCertStatusGreen}>✓ Engine # Confirmed</Text>
                    </View>
                    <View style={styles.docCertItem}>
                      <Text style={styles.docCertLabel}>INSURANCE EXPIRY</Text>
                      <Text style={styles.docCertVal}>{selectedDriverDoc.insuranceExpiry}</Text>
                      <Text style={styles.docCertStatusGreen}>✓ Comprehensive PSV</Text>
                    </View>
                  </View>

                  <View style={styles.docCertFooter}>
                    <Ionicons name="finger-print" size={20} color="#10B981" />
                    <Text style={styles.docCertHash}>
                      SHA-256: 8f4b912a...7c91 (Cryptographically Signed)
                    </Text>
                  </View>
                </View>

                {/* Uploaded Documents & Photos Carousel / Gallery */}
                <View style={{ marginTop: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#F8FAFC', marginBottom: 8 }}>
                    Uploaded Document Files & Photos
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                    {selectedDriverDoc.driverSelfieUrl && (
                      <View style={styles.adminDocThumbnailCard}>
                        <Image source={{ uri: selectedDriverDoc.driverSelfieUrl }} style={styles.adminDocImage} />
                        <Text style={styles.adminDocThumbLabel}>Driver Selfie</Text>
                      </View>
                    )}
                    {selectedDriverDoc.nationalIdFrontUrl && (
                      <View style={styles.adminDocThumbnailCard}>
                        <Image source={{ uri: selectedDriverDoc.nationalIdFrontUrl }} style={styles.adminDocImage} />
                        <Text style={styles.adminDocThumbLabel}>National ID Front</Text>
                      </View>
                    )}
                    {selectedDriverDoc.nationalIdBackUrl && (
                      <View style={styles.adminDocThumbnailCard}>
                        <Image source={{ uri: selectedDriverDoc.nationalIdBackUrl }} style={styles.adminDocImage} />
                        <Text style={styles.adminDocThumbLabel}>National ID Back</Text>
                      </View>
                    )}
                    {selectedDriverDoc.dlPhotoUrl && (
                      <View style={styles.adminDocThumbnailCard}>
                        <Image source={{ uri: selectedDriverDoc.dlPhotoUrl }} style={styles.adminDocImage} />
                        <Text style={styles.adminDocThumbLabel}>NTSA DL (Class A2)</Text>
                      </View>
                    )}
                    {selectedDriverDoc.logbookPhotoUrl && (
                      <View style={styles.adminDocThumbnailCard}>
                        <Image source={{ uri: selectedDriverDoc.logbookPhotoUrl }} style={styles.adminDocImage} />
                        <Text style={styles.adminDocThumbLabel}>Motorbike Logbook</Text>
                      </View>
                    )}
                    {selectedDriverDoc.insurancePhotoUrl && (
                      <View style={styles.adminDocThumbnailCard}>
                        <Image source={{ uri: selectedDriverDoc.insurancePhotoUrl }} style={styles.adminDocImage} />
                        <Text style={styles.adminDocThumbLabel}>PSV Insurance</Text>
                      </View>
                    )}
                    {selectedDriverDoc.goodConductPhotoUrl && (
                      <View style={styles.adminDocThumbnailCard}>
                        <Image source={{ uri: selectedDriverDoc.goodConductPhotoUrl }} style={styles.adminDocImage} />
                        <Text style={styles.adminDocThumbLabel}>DCI Good Conduct</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>

                {/* West Pokot Stage & SACCO Affiliation */}
                {selectedDriverDoc.baseStage && (
                  <View style={styles.adminSaccoBox}>
                    <Ionicons name="location" size={16} color="#10B981" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.adminSaccoTitle}>
                        {selectedDriverDoc.baseStage} • {selectedDriverDoc.saccoName || 'Registered Stage Member'}
                      </Text>
                      <Text style={styles.adminSaccoSub}>
                        Member No: {selectedDriverDoc.saccoNumber || 'Pending'} • County: West Pokot
                      </Text>
                    </View>
                  </View>
                )}

                {/* Status & Decision in Modal */}
                <View style={styles.modalDecisionRow}>
                  {selectedDriverDoc.status === 'PENDING' ? (
                    <>
                      <TouchableOpacity
                        style={styles.modalRejectBtn}
                        onPress={() => {
                          rejectDriver(selectedDriverDoc.id);
                          setShowDriverDocModal(false);
                          Alert.alert('Driver Rejected', `${selectedDriverDoc.name} has been rejected.`);
                        }}
                      >
                        <Ionicons name="close" size={16} color="#EF4444" />
                        <Text style={styles.modalRejectText}>Reject Application</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.modalApproveBtn}
                        onPress={() => {
                          approveDriver(selectedDriverDoc.id);
                          setShowDriverDocModal(false);
                          Alert.alert('Driver Approved', `${selectedDriverDoc.name} is now approved to accept rides.`);
                        }}
                      >
                        <Ionicons name="checkmark" size={16} color="#070A0F" />
                        <Text style={styles.modalApproveText}>Approve & Activate</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.modalStatusBanner}>
                      <Text style={styles.modalStatusBannerText}>
                        Current Status: {selectedDriverDoc.status}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 9. TRANSACTION & DARAJA AUDIT MODAL */}
      <Modal visible={showTxAuditModal} animationType="slide" transparent>
        <View style={styles.modalOverlayDark}>
          <View style={[styles.adminModalCard, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <View style={styles.adminModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="receipt" size={20} color="#10B981" />
                <Text style={styles.adminModalTitle}>Safaricom Daraja Audit</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTxAuditModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {selectedTxAudit && (
              <ScrollView style={{ maxHeight: 420 }}>
                {/* M-Pesa Receipt Header */}
                <View style={styles.txAuditReceiptHeader}>
                  <Text style={styles.txAuditMpesaBrand}>SAFARICOM M-PESA DARAJA B2C / C2B</Text>
                  <Text style={styles.txAuditReceiptNo}>{selectedTxAudit.mpesaReceiptNo}</Text>
                  <Text style={styles.txAuditTimestamp}>{selectedTxAudit.timestamp}</Text>
                </View>

                {/* Audit Payload Parameters */}
                <View style={styles.txAuditPayloadBox}>
                  <View style={styles.txAuditRow}>
                    <Text style={styles.txAuditKey}>Result Code:</Text>
                    <Text style={[styles.txAuditVal, { color: '#10B981', fontWeight: '900' }]}>0 (Success - Settled)</Text>
                  </View>
                  <View style={styles.txAuditRow}>
                    <Text style={styles.txAuditKey}>Trip Reference:</Text>
                    <Text style={styles.txAuditVal}>#{selectedTxAudit.tripId}</Text>
                  </View>
                  <View style={styles.txAuditRow}>
                    <Text style={styles.txAuditKey}>Passenger (Debit):</Text>
                    <Text style={styles.txAuditVal}>{selectedTxAudit.riderName}</Text>
                  </View>
                  <View style={styles.txAuditRow}>
                    <Text style={styles.txAuditKey}>Driver (Credit):</Text>
                    <Text style={styles.txAuditVal}>{selectedTxAudit.driverName}</Text>
                  </View>
                  <View style={styles.txAuditRow}>
                    <Text style={styles.txAuditKey}>Gross Fare:</Text>
                    <Text style={styles.txAuditVal}>KES {selectedTxAudit.grossAmount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.txAuditRow}>
                    <Text style={styles.txAuditKey}>Platform Fee (15%):</Text>
                    <Text style={[styles.txAuditVal, { color: '#10B981' }]}>
                      KES {selectedTxAudit.platformFee.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.txAuditRow}>
                    <Text style={styles.txAuditKey}>Driver Net Disbursed (85%):</Text>
                    <Text style={[styles.txAuditVal, { color: '#38BDF8', fontWeight: '800' }]}>
                      KES {selectedTxAudit.driverPayout.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Reconcile Button */}
                <TouchableOpacity
                  style={styles.modalAuditReconcileBtn}
                  onPress={() => {
                    auditTransaction(selectedTxAudit.id);
                    setShowTxAuditModal(false);
                    Alert.alert('Daraja Reconciled', `Receipt ${selectedTxAudit.mpesaReceiptNo} re-verified.`);
                  }}
                >
                  <Ionicons name="checkmark-done" size={16} color="#070A0F" />
                  <Text style={styles.modalAuditReconcileText}>Confirm Ledger Reconciliation</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 10. UBER-PARITY DRIVER KYC & DOCUMENT ONBOARDING MODAL */}
      <DriverKycOnboardingModal
        visible={showDriverApplicationModal}
        onClose={() => setShowDriverApplicationModal(false)}
        onSubmit={(submission: DriverKycSubmission) => {
          applyForDriver(submission);
          setShowDriverApplicationModal(false);
          Alert.alert(
            'Application Submitted to Admin! 📋',
            'Your driver partner details, NTSA driving license, motorbike logbook, and PSV insurance have been submitted to the West Pokot Ops Admin.\n\nYou remain active as a passenger while under review.'
          );
        }}
        initialUser={
          currentUser
            ? { fullName: currentUser.fullName, phone: currentUser.phoneNumber, email: currentUser.email }
            : undefined
        }
      />
    </View>
  );
}

