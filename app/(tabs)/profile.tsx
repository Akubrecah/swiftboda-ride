import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthModal from '../../components/AuthModal';
import { DriverKycOnboardingModal, DriverKycSubmission } from '../../components/DriverKycOnboardingModal';
import { useSwiftBoda } from '../../context/SwiftBodaContext';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentUser,
    logout,
    savedPlaces,
    addSavedPlace,
    deleteSavedPlace,
    setAppMode,
    triggerSOS,
    shareLiveTrip,
    driverVerificationStatus,
    applyForDriver,
  } = useSwiftBoda();

  const [pinVerification, setPinVerification] = useState(true);
  const [rideCheck, setRideCheck] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [forceOnboarding, setForceOnboarding] = useState(false);

  // Driver Application Modal States
  const [showDriverApplicationModal, setShowDriverApplicationModal] = useState(false);
  const [applyPlate, setApplyPlate] = useState('');
  const [applyModel, setApplyModel] = useState('');
  const [applyNationalId, setApplyNationalId] = useState('');
  const [applyDlNumber, setApplyDlNumber] = useState('');

  // Add Saved Place Modal
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [placeAddress, setPlaceAddress] = useState('');
  const [placeIcon, setPlaceIcon] = useState('pin');

  const handleSavePlace = () => {
    if (!placeName.trim() || !placeAddress.trim()) {
      Alert.alert('Missing Info', 'Please enter a name and address for your saved place.');
      return;
    }
    addSavedPlace({
      name: placeName.trim(),
      address: placeAddress.trim(),
      lat: -1.286389,
      lon: 36.817223,
      icon: placeIcon,
    });
    setPlaceName('');
    setPlaceAddress('');
    setShowAddPlaceModal(false);
    Alert.alert('Place Saved', `"${placeName}" has been added to your saved locations.`);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
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
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 20) }]}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        {currentUser ? (
          <View style={styles.userCard}>
            <View style={styles.avatarCircle}>
              <Ionicons
                name={currentUser.role === 'DRIVER' ? 'bicycle' : 'person'}
                size={28}
                color="#10B981"
              />
            </View>
            <View style={styles.userInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.userName}>{currentUser.fullName}</Text>
                <View style={[styles.roleBadge, currentUser.role === 'DRIVER' && styles.driverBadge]}>
                  <Text style={styles.roleBadgeText}>{currentUser.role}</Text>
                </View>
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.ratingText}>
                  {currentUser.rating} ★ • Verified {currentUser.role === 'DRIVER' ? 'Driver' : 'Rider'}
                </Text>
              </View>
              <Text style={styles.userPhone}>{currentUser.phoneNumber}</Text>
            </View>
            <TouchableOpacity style={styles.editProfileBtn} onPress={() => setShowAuthModal(true)}>
              <Ionicons name="swap-horizontal" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.userCard} onPress={() => setShowAuthModal(true)}>
            <View style={styles.avatarCircle}>
              <Ionicons name="log-in" size={28} color="#10B981" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Sign In to SwiftBoda</Text>
              <Text style={styles.userPhone}>Tap here to sign in with phone OTP</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}

        {/* Driver Details Card (If user is a driver) */}
        {currentUser?.role === 'DRIVER' && currentUser.driverDetails && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="bicycle" size={18} color="#10B981" />
              <Text style={styles.sectionTitle}>Registered Vehicle Details</Text>
            </View>
            <View style={styles.driverDetailGrid}>
              <View style={styles.driverDetailItem}>
                <Text style={styles.driverDetailLabel}>License Plate</Text>
                <Text style={styles.driverDetailVal}>{currentUser.driverDetails.vehiclePlate}</Text>
              </View>
              <View style={styles.driverDetailItem}>
                <Text style={styles.driverDetailLabel}>Motorcycle</Text>
                <Text style={styles.driverDetailVal}>{currentUser.driverDetails.vehicleModel}</Text>
              </View>
              <View style={styles.driverDetailItem}>
                <Text style={styles.driverDetailLabel}>Today Earnings</Text>
                <Text style={styles.driverDetailValGreen}>KES {currentUser.driverDetails.todayEarnings}</Text>
              </View>
              <View style={styles.driverDetailItem}>
                <Text style={styles.driverDetailLabel}>Completed Trips</Text>
                <Text style={styles.driverDetailVal}>{currentUser.driverDetails.tripsCompleted}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Service Buttons */}
        <View style={styles.quickNavRow}>
          <TouchableOpacity style={styles.quickNavTile} onPress={() => router.push('/(tabs)/explore')}>
            <Ionicons name="receipt-outline" size={22} color="#10B981" />
            <Text style={styles.quickNavText}>Activity</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickNavTile} onPress={() => router.push('/(tabs)/wallet')}>
            <Ionicons name="wallet-outline" size={22} color="#10B981" />
            <Text style={styles.quickNavText}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickNavTile}
            onPress={() => Alert.alert('Swift Help Desk', '24/7 Priority Hotline: +254 700 999 888')}
          >
            <Ionicons name="help-buoy-outline" size={22} color="#10B981" />
            <Text style={styles.quickNavText}>Help</Text>
          </TouchableOpacity>
        </View>

        {/* Saved Places CRUD Section */}
        {currentUser?.role === 'RIDER' && (
          <View style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="bookmark" size={18} color="#10B981" />
                <Text style={styles.sectionTitle}>Saved Places</Text>
              </View>
              <TouchableOpacity style={styles.addPlaceBtn} onPress={() => setShowAddPlaceModal(true)}>
                <Ionicons name="add" size={16} color="#070A0F" />
                <Text style={styles.addPlaceBtnText}>Add Place</Text>
              </TouchableOpacity>
            </View>

            {savedPlaces.length === 0 ? (
              <Text style={styles.noPlacesText}>No saved places yet. Add your Home or Work!</Text>
            ) : (
              savedPlaces.map((place) => (
                <View key={place.id} style={styles.savedPlaceRow}>
                  <View style={styles.placeIconCircle}>
                    <Ionicons
                      name={
                        place.name.toLowerCase() === 'home'
                          ? 'home-outline'
                          : place.name.toLowerCase() === 'work'
                          ? 'briefcase-outline'
                          : 'pin-outline'
                      }
                      size={18}
                      color="#10B981"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedPlaceName}>{place.name}</Text>
                    <Text style={styles.savedPlaceAddress} numberOfLines={1}>
                      {place.address}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deletePlaceBtn}
                    onPress={() => {
                      Alert.alert('Remove Place', `Delete "${place.name}" from saved places?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteSavedPlace(place.id) },
                      ]);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Uber Safety Toolkit */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="shield-checkmark" size={18} color="#10B981" />
            <Text style={styles.sectionTitle}>Safety & Security Hub</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>4-Digit Ride PIN</Text>
              <Text style={styles.settingSub}>
                Drivers must enter your PIN to start every ride, ensuring the correct vehicle.
              </Text>
            </View>
            <Switch
              value={pinVerification}
              onValueChange={setPinVerification}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>RideCheck™ Anomaly Detection</Text>
              <Text style={styles.settingSub}>
                Detects unexpected long stops or route deviations and notifies the safety team.
              </Text>
            </View>
            <Switch
              value={rideCheck}
              onValueChange={setRideCheck}
              trackColor={{ false: '#334155', true: '#10B981' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow} onPress={triggerSOS}>
            <View style={styles.sosIconBox}>
              <Ionicons name="warning" size={18} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sosTitle}>Emergency 24/7 Panic Button</Text>
              <Text style={styles.sosSub}>Broadcasts GPS telemetry to West Pokot Police & Swift Safety Team</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow} onPress={shareLiveTrip}>
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="share-social" size={18} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Share Live Location</Text>
              <Text style={styles.menuSub}>Send live GPS coordinates & trip link to trusted contacts</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              setForceOnboarding(true);
              setShowAuthModal(true);
            }}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="sparkles" size={18} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>Welcome Tour & Safety Guide</Text>
              <Text style={styles.menuSub}>Replay the Uber-style onboarding intro & features</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Driver Status / Drive with SwiftBoda in West Pokot Banner */}
        {currentUser?.role === 'RIDER' && (
          <View style={{ marginVertical: 8 }}>
            {driverVerificationStatus === 'APPROVED' ? (
              <TouchableOpacity
                style={styles.driverModeBanner}
                onPress={() => {
                  setAppMode('DRIVER');
                  router.push('/(tabs)');
                }}
              >
                <View style={styles.driverBannerIcon}>
                  <Ionicons name="bicycle" size={24} color="#070A0F" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverBannerTitle}>Switch to Driver Console</Text>
                  <Text style={styles.driverBannerSub}>Approved Driver • Go online & accept rides</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#10B981" />
              </TouchableOpacity>
            ) : driverVerificationStatus === 'PENDING' ? (
              <View style={[styles.driverModeBanner, { backgroundColor: '#1E293B', borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
                <View style={[styles.driverBannerIcon, { backgroundColor: '#F59E0B' }]}>
                  <Ionicons name="time" size={24} color="#070A0F" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.driverBannerTitle, { color: '#F59E0B' }]}>Driver Verification Pending</Text>
                  <Text style={[styles.driverBannerSub, { color: '#CBD5E1' }]}>
                    Your documents are under review by West Pokot Ops Admin. You can continue as a passenger.
                  </Text>
                </View>
              </View>
            ) : driverVerificationStatus === 'REJECTED' ? (
              <TouchableOpacity
                style={[styles.driverModeBanner, { backgroundColor: '#1E293B', borderColor: 'rgba(239, 68, 68, 0.4)' }]}
                onPress={() => setShowDriverApplicationModal(true)}
              >
                <View style={[styles.driverBannerIcon, { backgroundColor: '#EF4444' }]}>
                  <Ionicons name="alert-circle" size={24} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.driverBannerTitle, { color: '#EF4444' }]}>Application Rejected • Re-apply</Text>
                  <Text style={[styles.driverBannerSub, { color: '#CBD5E1' }]}>
                    Document check failed. Tap to re-submit with valid DL & logbook.
                  </Text>
                </View>
                <Ionicons name="refresh" size={18} color="#EF4444" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.driverModeBanner}
                onPress={() => setShowDriverApplicationModal(true)}
              >
                <View style={styles.driverBannerIcon}>
                  <Ionicons name="bicycle" size={24} color="#070A0F" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverBannerTitle}>Drive with SwiftBoda in West Pokot</Text>
                  <Text style={styles.driverBannerSub}>Earn KES 2,500+ daily • Register your motorbike</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#10B981" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Switch Account or Sign Out */}
        <View style={{ gap: 10, marginTop: 6 }}>
          <TouchableOpacity style={styles.switchAccountBtn} onPress={() => setShowAuthModal(true)}>
            <Ionicons name="people-outline" size={18} color="#10B981" style={{ marginRight: 8 }} />
            <Text style={styles.switchAccountText}>Switch Account / Role</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Saved Place Modal */}
      <Modal visible={showAddPlaceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.addPlaceCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.addPlaceTitle}>Add New Saved Place</Text>
              <TouchableOpacity onPress={() => setShowAddPlaceModal(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Place Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Mum's House, Doctor, Gym"
              placeholderTextColor="#64748B"
              value={placeName}
              onChangeText={setPlaceName}
            />

            <Text style={styles.inputLabel}>Street / Area Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Makutano Town, Kapenguria Rd"
              placeholderTextColor="#64748B"
              value={placeAddress}
              onChangeText={setPlaceAddress}
            />

            <TouchableOpacity style={styles.savePlaceConfirmBtn} onPress={handleSavePlace}>
              <Text style={styles.savePlaceConfirmText}>Save Place</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Uber-Parity Driver KYC & Document Onboarding Modal */}
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

      {/* Auth Modal */}
      <AuthModal
        visible={showAuthModal}
        forceShowOnboarding={forceOnboarding}
        onClose={() => {
          setShowAuthModal(false);
          setForceOnboarding(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070A0F' },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#0E141F',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  scrollContent: { padding: 16, gap: 14 },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E141F',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  userInfo: { flex: 1 },
  userName: { color: '#F8FAFC', fontSize: 17, fontWeight: '800' },
  roleBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  driverBadge: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  roleBadgeText: { color: '#10B981', fontSize: 10, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { color: '#F59E0B', fontSize: 12, fontWeight: '700' },
  userPhone: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  editProfileBtn: { padding: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 10 },

  quickNavRow: { flexDirection: 'row', gap: 10 },
  quickNavTile: {
    flex: 1,
    backgroundColor: '#0E141F',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickNavText: { color: '#F8FAFC', fontSize: 12, fontWeight: '700' },

  sectionCard: {
    backgroundColor: '#0E141F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },

  driverDetailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  driverDetailItem: { width: '48%', backgroundColor: '#070A0F', padding: 12, borderRadius: 12 },
  driverDetailLabel: { color: '#64748B', fontSize: 10, fontWeight: '700' },
  driverDetailVal: { color: '#F8FAFC', fontSize: 14, fontWeight: '800', marginTop: 2 },
  driverDetailValGreen: { color: '#10B981', fontSize: 15, fontWeight: '900', marginTop: 2 },

  addPlaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  addPlaceBtnText: { color: '#070A0F', fontSize: 11, fontWeight: '800' },
  noPlacesText: { color: '#64748B', fontSize: 12, fontStyle: 'italic' },
  savedPlaceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  placeIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedPlaceName: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
  savedPlaceAddress: { color: '#94A3B8', fontSize: 11, marginTop: 1 },
  deletePlaceBtn: { padding: 8 },

  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  settingTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
  settingSub: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)' },

  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
  menuSub: { color: '#94A3B8', fontSize: 11, marginTop: 1 },
  sosIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sosTitle: { color: '#EF4444', fontSize: 13, fontWeight: '800' },
  sosSub: { color: '#94A3B8', fontSize: 11, marginTop: 1 },

  driverModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 12,
  },
  driverBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverBannerTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
  driverBannerSub: { color: '#10B981', fontSize: 11, fontWeight: '600', marginTop: 1 },

  switchAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E141F',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  switchAccountText: { color: '#10B981', fontSize: 14, fontWeight: '800' },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E141F',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  signOutText: { color: '#EF4444', fontSize: 14, fontWeight: '800' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  addPlaceCard: { backgroundColor: '#0E141F', borderRadius: 20, padding: 20, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  addPlaceTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  inputLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  textInput: {
    backgroundColor: '#070A0F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  savePlaceConfirmBtn: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  savePlaceConfirmText: { color: '#070A0F', fontSize: 14, fontWeight: '900' },
});
