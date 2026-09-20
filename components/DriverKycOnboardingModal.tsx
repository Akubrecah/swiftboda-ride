import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VehicleCategory } from '../shared/types';
import { WEST_POKOT_STAGES } from '../shared/constants/regions';

export interface DriverKycSubmission {
  // Phase 1: Identity
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  driverSelfieUrl: string;
  nationalIdFrontUrl: string;
  nationalIdBackUrl: string;

  // Phase 2: NTSA DL
  dlNumber: string;
  dlExpiry: string;
  dlClassA2Confirmed: boolean;
  dlPhotoUrl: string;

  // Phase 3: Motorbike
  vehiclePlate: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  vehicleCategory: VehicleCategory;
  chassisNumber: string;
  logbookPhotoUrl: string;

  // Phase 4: Insurance & Good Conduct
  insurancePolicy: string;
  insuranceUnderwriter: string;
  insuranceExpiry: string;
  insurancePhotoUrl: string;
  goodConductNumber: string;
  goodConductPhotoUrl: string;

  // Phase 5: SACCO & Base Stage
  baseStage: string;
  saccoName: string;
  saccoNumber: string;
}

interface DriverKycOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: DriverKycSubmission) => void;
  initialUser?: { fullName: string; phone: string; email: string };
}

export const DriverKycOnboardingModal: React.FC<DriverKycOnboardingModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialUser,
}) => {
  const insets = useSafeAreaInsets();
  const [currentPhase, setCurrentPhase] = useState<number>(1);

  // Phase 1: Identity
  const [fullName, setFullName] = useState(initialUser?.fullName || 'Kiprop Chemokil');
  const [phone, setPhone] = useState(initialUser?.phone || '+254712345678');
  const [email, setEmail] = useState(initialUser?.email || 'kiprop@swiftboda.co.ke');
  const [nationalId, setNationalId] = useState('28491022');
  const [driverSelfie, setDriverSelfie] = useState<string>('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400');
  const [nationalIdFront, setNationalIdFront] = useState<string>('https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600');
  const [nationalIdBack, setNationalIdBack] = useState<string>('https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=600');

  // Phase 2: NTSA Driving License
  const [dlNumber, setDlNumber] = useState('DL-KAP-8821');
  const [dlExpiry, setDlExpiry] = useState('11/2027');
  const [dlClassA2, setDlClassA2] = useState(true);
  const [dlPhoto, setDlPhoto] = useState<string>('https://images.unsplash.com/photo-1544717305-2782549b5136?w=600');

  // Phase 3: Vehicle Particulars
  const [vehiclePlate, setVehiclePlate] = useState('KMDK 234P');
  const [vehicleModel, setVehicleModel] = useState('Bajaj Boxer 150X');
  const [vehicleYear, setVehicleYear] = useState('2023');
  const [vehicleColor, setVehicleColor] = useState('Red / Black Trim');
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('BODA_STANDARD');
  const [chassisNumber, setChassisNumber] = useState('MD625BF12N882910');
  const [logbookPhoto, setLogbookPhoto] = useState<string>('https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600');

  // Phase 4: PSV Insurance & Good Conduct
  const [insurancePolicy, setInsurancePolicy] = useState('POL-WP-882910');
  const [insuranceUnderwriter, setInsuranceUnderwriter] = useState('APA Insurance Kenya');
  const [insuranceExpiry, setInsuranceExpiry] = useState('12/2026');
  const [insurancePhoto, setInsurancePhoto] = useState<string>('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600');
  const [goodConductNumber, setGoodConductNumber] = useState('CID-POK-2025-991');
  const [goodConductPhoto, setGoodConductPhoto] = useState<string>('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600');

  // Phase 5: SACCO & Base Stage
  const [baseStage, setBaseStage] = useState('Makutano Junction Stage');
  const [saccoName, setSaccoName] = useState('Makutano Boda Operators SACCO');
  const [saccoNumber, setSaccoNumber] = useState('MB-204');

  // Native Image Picker
  const pickImage = async (setter: (uri: string) => void) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setter(result.assets[0].uri);
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }
    } catch {
      Alert.alert('Upload Photo', 'Select camera or gallery to upload your document.');
    }
  };

  const handleNext = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (currentPhase === 1) {
      if (!fullName || !phone || !nationalId || !driverSelfie || !nationalIdFront) {
        Alert.alert('Incomplete Details', 'Please complete all identity details and upload required photos.');
        return;
      }
    } else if (currentPhase === 2) {
      if (!dlNumber || !dlExpiry || !dlPhoto) {
        Alert.alert('Incomplete License', 'Please provide NTSA Driving License number and photo.');
        return;
      }
    } else if (currentPhase === 3) {
      if (!vehiclePlate || !vehicleModel || !logbookPhoto) {
        Alert.alert('Incomplete Vehicle Details', 'Please provide motorcycle plate, model, and logbook photo.');
        return;
      }
    } else if (currentPhase === 4) {
      if (!insurancePolicy || !insurancePhoto) {
        Alert.alert('Incomplete Insurance', 'Please provide commercial boda PSV insurance details.');
        return;
      }
    }

    if (currentPhase < 5) {
      setCurrentPhase((p) => p + 1);
    } else {
      // Final submission
      const submission: DriverKycSubmission = {
        fullName,
        phone,
        email,
        nationalId,
        driverSelfieUrl: driverSelfie,
        nationalIdFrontUrl: nationalIdFront,
        nationalIdBackUrl: nationalIdBack,
        dlNumber,
        dlExpiry,
        dlClassA2Confirmed: dlClassA2,
        dlPhotoUrl: dlPhoto,
        vehiclePlate,
        vehicleModel,
        vehicleYear,
        vehicleColor,
        vehicleCategory,
        chassisNumber,
        logbookPhotoUrl: logbookPhoto,
        insurancePolicy,
        insuranceUnderwriter,
        insuranceExpiry,
        insurancePhotoUrl: insurancePhoto,
        goodConductNumber,
        goodConductPhotoUrl: goodConductPhoto,
        baseStage,
        saccoName,
        saccoNumber,
      };
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      onSubmit(submission);
    }
  };

  const renderDocumentUploadCard = (
    label: string,
    description: string,
    uri: string,
    onPick: () => void,
    sampleUri?: string
  ) => {
    return (
      <View style={styles.docCard}>
        <View style={styles.docCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.docCardTitle}>{label}</Text>
            <Text style={styles.docCardSubtitle}>{description}</Text>
          </View>
          {uri ? (
            <View style={styles.uploadedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.uploadedBadgeText}>Attached</Text>
            </View>
          ) : (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredBadgeText}>Required</Text>
            </View>
          )}
        </View>

        {uri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri }} style={styles.docThumbnail} />
            <TouchableOpacity style={styles.changeDocBtn} onPress={onPick} activeOpacity={0.8}>
              <Ionicons name="camera-reverse" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.changeDocBtnText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <TouchableOpacity style={styles.uploadBtn} onPress={onPick} activeOpacity={0.8}>
              <Ionicons name="camera" size={20} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.uploadBtnText}>Take or Upload Photo</Text>
            </TouchableOpacity>
            {sampleUri && (
              <TouchableOpacity
                style={styles.sampleBtn}
                onPress={() => onPick()}
                activeOpacity={0.7}
              >
                <Text style={styles.sampleBtnText}>Use Verified Sample</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color="#F8FAFC" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Driver Partner Onboarding</Text>
            <Text style={styles.headerSub}>West Pokot County Pilot • Uber Standard</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Phase Progress Tabs */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${(currentPhase / 5) * 100}%` }]} />
          </View>
          <View style={styles.phaseTitlesRow}>
            <Text style={styles.phaseStepText}>Phase {currentPhase} of 5</Text>
            <Text style={styles.phaseNameText}>
              {currentPhase === 1 && 'Personal & National ID'}
              {currentPhase === 2 && 'NTSA Motorcycle DL'}
              {currentPhase === 3 && 'Motorbike & Logbook'}
              {currentPhase === 4 && 'Commercial PSV & Safety'}
              {currentPhase === 5 && 'Base Stage & SACCO'}
            </Text>
          </View>
        </View>

        {/* Content Scroll View */}
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* PHASE 1: IDENTITY */}
          {currentPhase === 1 && (
            <View style={styles.phaseSection}>
              <Text style={styles.sectionTitle}>1. Personal & Identity Verification</Text>
              <Text style={styles.sectionNotice}>
                Information must match your official Kenyan National ID. Used for rider security and emergency dispatch.
              </Text>

              {/* Driver Live Selfie */}
              {renderDocumentUploadCard(
                'Driver Live Photo / Profile Selfie',
                'Clear headshot without hat or sunglasses for rider safety display',
                driverSelfie,
                () => pickImage(setDriverSelfie)
              )}

              {/* Input Fields */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Legal Name (as on ID)</Text>
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Kiprop Chemokil"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>National ID Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={nationalId}
                    onChangeText={setNationalId}
                    keyboardType="number-pad"
                    placeholder="e.g. 28491022"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  placeholderTextColor="#64748B"
                />
              </View>

              {/* National ID Front & Back */}
              {renderDocumentUploadCard(
                'National ID (Front Side)',
                'Clear photo showing full name, photo, and ID number',
                nationalIdFront,
                () => pickImage(setNationalIdFront)
              )}

              {renderDocumentUploadCard(
                'National ID (Back Side)',
                'Clear photo showing serial number and thumbprint',
                nationalIdBack,
                () => pickImage(setNationalIdBack)
              )}
            </View>
          )}

          {/* PHASE 2: NTSA DRIVING LICENSE */}
          {currentPhase === 2 && (
            <View style={styles.phaseSection}>
              <Text style={styles.sectionTitle}>2. NTSA Commercial Motorcycle License</Text>
              <Text style={styles.sectionNotice}>
                Valid Class A2 Motorcycle endorsement certified by the National Transport and Safety Authority (NTSA).
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NTSA Driving License (DL) Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={dlNumber}
                  onChangeText={setDlNumber}
                  placeholder="e.g. DL-KAP-8821"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>License Expiry Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={dlExpiry}
                    onChangeText={setDlExpiry}
                    placeholder="MM/YYYY"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.endorsementBox, dlClassA2 && styles.endorsementBoxActive]}
                  onPress={() => setDlClassA2(!dlClassA2)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={dlClassA2 ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={dlClassA2 ? '#10B981' : '#64748B'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.endorsementText}>Class A2 Boda Endorsed</Text>
                </TouchableOpacity>
              </View>

              {renderDocumentUploadCard(
                'Driving License (Front Document)',
                'High-resolution scan or photo of your official NTSA Smart DL or Interim DL',
                dlPhoto,
                () => pickImage(setDlPhoto)
              )}
            </View>
          )}

          {/* PHASE 3: MOTORBIKE & LOGBOOK */}
          {currentPhase === 3 && (
            <View style={styles.phaseSection}>
              <Text style={styles.sectionTitle}>3. Motorbike Particulars & Logbook</Text>
              <Text style={styles.sectionNotice}>
                Vehicle details must match the registration plate displayed to riders in Makutano and West Pokot.
              </Text>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Motorbike Registration Plate</Text>
                  <TextInput
                    style={[styles.textInput, { fontWeight: '800', letterSpacing: 1 }]}
                    value={vehiclePlate}
                    onChangeText={setVehiclePlate}
                    placeholder="e.g. KMDK 234P"
                    autoCapitalize="characters"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Year of Manufacture</Text>
                  <TextInput
                    style={styles.textInput}
                    value={vehicleYear}
                    onChangeText={setVehicleYear}
                    keyboardType="number-pad"
                    placeholder="e.g. 2023"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Make & Model</Text>
                  <TextInput
                    style={styles.textInput}
                    value={vehicleModel}
                    onChangeText={setVehicleModel}
                    placeholder="e.g. Bajaj Boxer 150X"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Color & Trim</Text>
                  <TextInput
                    style={styles.textInput}
                    value={vehicleColor}
                    onChangeText={setVehicleColor}
                    placeholder="e.g. Red / Black"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vehicle Service Category</Text>
                <View style={styles.categoryRow}>
                  {(['BODA_STANDARD', 'BODA_COMFORT', 'EXPRESS_DELIVERY'] as VehicleCategory[]).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catPill, vehicleCategory === cat && styles.catPillActive]}
                      onPress={() => setVehicleCategory(cat)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.catPillText, vehicleCategory === cat && styles.catPillTextActive]}>
                        {cat === 'BODA_STANDARD' ? 'Standard' : cat === 'BODA_COMFORT' ? 'Comfort' : 'Cargo Delivery'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Engine / Chassis (VIN) Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={chassisNumber}
                  onChangeText={setChassisNumber}
                  placeholder="e.g. MD625BF12N882910"
                  autoCapitalize="characters"
                  placeholderTextColor="#64748B"
                />
              </View>

              {renderDocumentUploadCard(
                'Motorbike Logbook (Ownership Certificate)',
                'Page 1 showing registered owner and chassis number matching your vehicle',
                logbookPhoto,
                () => pickImage(setLogbookPhoto)
              )}
            </View>
          )}

          {/* PHASE 4: PSV INSURANCE & POLICE GOOD CONDUCT */}
          {currentPhase === 4 && (
            <View style={styles.phaseSection}>
              <Text style={styles.sectionTitle}>4. Commercial Insurance & Good Conduct</Text>
              <Text style={styles.sectionNotice}>
                Kenyan Traffic Act requires active commercial PSV passenger liability insurance and DCI police clearance.
              </Text>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Insurance Policy Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={insurancePolicy}
                    onChangeText={setInsurancePolicy}
                    placeholder="e.g. POL-WP-882910"
                    placeholderTextColor="#64748B"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Underwriter / Insurer</Text>
                  <TextInput
                    style={styles.textInput}
                    value={insuranceUnderwriter}
                    onChangeText={setInsuranceUnderwriter}
                    placeholder="e.g. APA Insurance"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Insurance Policy Expiry Date</Text>
                <TextInput
                  style={styles.textInput}
                  value={insuranceExpiry}
                  onChangeText={setInsuranceExpiry}
                  placeholder="MM/YYYY"
                  placeholderTextColor="#64748B"
                />
              </View>

              {renderDocumentUploadCard(
                'Commercial PSV Insurance Sticker Photo',
                'Clear photo of the round windshield/fork insurance sticker showing expiry date',
                insurancePhoto,
                () => pickImage(setInsurancePhoto)
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>DCI Police Clearance Certificate No.</Text>
                <TextInput
                  style={styles.textInput}
                  value={goodConductNumber}
                  onChangeText={setGoodConductNumber}
                  placeholder="e.g. CID-POK-2025-991"
                  placeholderTextColor="#64748B"
                />
              </View>

              {renderDocumentUploadCard(
                'Police Clearance Certificate (Good Conduct)',
                'Official DCI certificate issued within the last 12 months',
                goodConductPhoto,
                () => pickImage(setGoodConductPhoto)
              )}
            </View>
          )}

          {/* PHASE 5: BASE STAGE & SACCO */}
          {currentPhase === 5 && (
            <View style={styles.phaseSection}>
              <Text style={styles.sectionTitle}>5. West Pokot Base Stage & SACCO</Text>
              <Text style={styles.sectionNotice}>
                Connecting your registration with local stage leadership ensures harmonious pickup zones in West Pokot.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Primary West Pokot Boda Stage</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageScroll}>
                  {WEST_POKOT_STAGES.map((st) => (
                    <TouchableOpacity
                      key={st.name}
                      style={[styles.stageChip, baseStage === st.name && styles.stageChipActive]}
                      onPress={() => setBaseStage(st.name)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="location-sharp"
                        size={14}
                        color={baseStage === st.name ? '#10B981' : '#64748B'}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.stageChipText, baseStage === st.name && styles.stageChipTextActive]}>
                        {st.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Boda SACCO / Cooperative</Text>
                <TextInput
                  style={styles.textInput}
                  value={saccoName}
                  onChangeText={setSaccoName}
                  placeholder="e.g. Makutano Boda Operators SACCO"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SACCO Member / Stage Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={saccoNumber}
                  onChangeText={setSaccoNumber}
                  placeholder="e.g. MB-204"
                  placeholderTextColor="#64748B"
                />
              </View>

              {/* Uber Standard Compliance Checklist */}
              <View style={styles.checklistSummary}>
                <Text style={styles.checklistTitle}>Verification Checklist Ready</Text>
                <View style={styles.checklistItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.checkText}>Identity & Selfie Verified ({fullName})</Text>
                </View>
                <View style={styles.checklistItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.checkText}>NTSA Motorcycle License ({dlNumber})</Text>
                </View>
                <View style={styles.checklistItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.checkText}>Vehicle Plate & Logbook ({vehiclePlate})</Text>
                </View>
                <View style={styles.checklistItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.checkText}>Commercial PSV Insurance ({insurancePolicy})</Text>
                </View>
                <View style={styles.checklistItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.checkText}>Base Stage: {baseStage}</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Navigation Bar */}
        <View style={styles.footerRow}>
          {currentPhase > 1 && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setCurrentPhase((p) => Math.max(1, p - 1))}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={18} color="#94A3B8" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextBtn, currentPhase === 1 && { flex: 1 }]}
            onPress={handleNext}
            activeOpacity={0.88}
          >
            <Text style={styles.nextBtnText}>
              {currentPhase === 5 ? 'Submit for Verification' : 'Continue to Phase ' + (currentPhase + 1)}
            </Text>
            <Ionicons
              name={currentPhase === 5 ? 'checkmark-done' : 'arrow-forward'}
              size={18}
              color="#070A0F"
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0E141F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0E141F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  phaseTitlesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  phaseStepText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  phaseNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  phaseSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  sectionNotice: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 4,
  },
  inputGroup: {
    gap: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  textInput: {
    backgroundColor: '#0E141F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  endorsementBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E141F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginTop: 22,
  },
  endorsementBoxActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  endorsementText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  catPill: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#0E141F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    alignItems: 'center',
  },
  catPillActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  catPillTextActive: {
    color: '#10B981',
  },
  docCard: {
    backgroundColor: '#0E141F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  docCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  docCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  docCardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  uploadedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  requiredBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requiredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#162031',
  },
  changeDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeDocBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  uploadPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  sampleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sampleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  stageScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  stageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E141F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  stageChipActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  stageChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stageChipTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  checklistSummary: {
    backgroundColor: '#0E141F',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginTop: 8,
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E141F',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 2,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#070A0F',
    letterSpacing: 0.3,
  },
});
