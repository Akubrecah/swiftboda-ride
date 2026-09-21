import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSwiftBoda } from '../../context/SwiftBodaContext';
import { useTheme } from '../../context/ThemeContext';
import { generateAndShareReceiptPDF } from '../../services/receiptPdfService';

export default function ActivityScreen() {
  const router = useRouter();
  const { pastTrips, currentUser, rebookDestination } = useSwiftBoda();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'PAST' | 'UPCOMING'>('PAST');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  const handleRebook = (destName: string, destAddr: string, lat: number, lon: number) => {
    rebookDestination({
      latitude: lat,
      longitude: lon,
      placeName: destName,
      address: destAddr,
    });
    router.push('/');
  };

  const handleDownloadReceipt = async (receipt: any) => {
    try {
      setIsExportingPdf(true);
      await generateAndShareReceiptPDF({
        id: receipt.id || '98124',
        createdAt: receipt.createdAt || new Date().toISOString(),
        completedAt: receipt.completedAt,
        riderName: receipt.rider?.name || currentUser?.fullName || 'Valued Passenger',
        riderPhone: receipt.rider?.phone || currentUser?.phoneNumber || '+254712345001',
        driverName: receipt.driver?.name || 'Kiprop Chemokil',
        driverPhone: receipt.driver?.phone || '+254722001122',
        vehicleModel: receipt.driver?.vehicleModel || 'Bajaj Boxer 150X',
        vehiclePlate: receipt.driver?.vehiclePlate || 'KMDK 234P',
        category: receipt.category || 'STANDARD_BODA',
        pickupAddress: receipt.pickup?.address || 'Makutano Junction Stage',
        destinationAddress: receipt.destination?.placeName || receipt.destination?.address || 'Kapenguria County Hospital',
        distanceKm: receipt.fare?.estimatedDistanceKm || 1.9,
        durationMin: receipt.fare?.estimatedDurationMin || 6,
        baseFare: receipt.fare?.baseFare || 50,
        distanceFare: receipt.fare?.distanceFare || 30,
        timeFare: receipt.fare?.timeFare || 10,
        bookingFee: receipt.fare?.bookingFee || 0,
        tipAmount: receipt.tipAmount || 0,
        totalFare: (receipt.fare?.totalFare || 90) + (receipt.tipAmount || 0),
        paymentMethod: receipt.paymentMethod || 'MPESA',
      });
    } catch (e) {
      Alert.alert('Download Error', 'Could not generate PDF receipt.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 20), backgroundColor: theme.headerBg, borderColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Activity</Text>
        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
          {currentUser?.role === 'DRIVER' ? 'Your completed driver trips & payouts' : 'Past rides, receipts and rebooking'}
        </Text>

        {/* Segmented Tabs */}
        <View style={[styles.segmentedRow, { backgroundColor: theme.surfaceElevated }]}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'PAST' && { backgroundColor: theme.cardBg, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
            ]}
            onPress={() => setActiveTab('PAST')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'PAST' ? theme.textPrimary : theme.textMuted }]}>
              Past ({pastTrips.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'UPCOMING' && { backgroundColor: theme.cardBg, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
            ]}
            onPress={() => setActiveTab('UPCOMING')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'UPCOMING' ? theme.textPrimary : theme.textMuted }]}>
              Upcoming
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {activeTab === 'UPCOMING' ? (
          <View style={styles.emptyUpcomingBox}>
            <Ionicons name="calendar-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyUpcomingTitle, { color: theme.textPrimary }]}>No upcoming trips</Text>
            <Text style={[styles.emptyUpcomingSub, { color: theme.textSecondary }]}>Reserve a ride up to 30 days in advance</Text>
          </View>
        ) : pastTrips.length === 0 ? (
          <View style={styles.emptyUpcomingBox}>
            <Ionicons name="receipt-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyUpcomingTitle, { color: theme.textPrimary }]}>No past trips found</Text>
            <Text style={[styles.emptyUpcomingSub, { color: theme.textSecondary }]}>Your ride history will appear here after your first trip.</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {pastTrips.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.activityCard,
                  { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.categoryIconCircle, { backgroundColor: theme.badgeBg }]}>
                    <Ionicons
                      name={item.category === 'EXPRESS_DELIVERY' ? 'paper-plane' : 'bicycle'}
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={[styles.destinationTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.destination.placeName || item.destination.address}
                    </Text>
                    <Text style={[styles.tripDate, { color: theme.textMuted }]}>
                      {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={[styles.fareAmount, { color: theme.textPrimary }]}>
                    KES {item.fare.totalFare.toFixed(0)}
                  </Text>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />

                <View style={styles.routeBox}>
                  <View style={styles.routeRow}>
                    <View style={[styles.dot, { backgroundColor: theme.primary }]} />
                    <Text style={[styles.routeText, { color: theme.textSecondary }]} numberOfLines={1}>
                      From: {item.pickup.address}
                    </Text>
                  </View>
                  <View style={styles.routeRow}>
                    <View style={[styles.dot, { backgroundColor: theme.warning }]} />
                    <Text style={[styles.routeText, { color: theme.textSecondary }]} numberOfLines={1}>
                      To: {item.destination.address}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  {currentUser?.role === 'RIDER' && (
                    <TouchableOpacity
                      style={[
                        styles.rebookBtn,
                        { backgroundColor: theme.badgeBg, borderColor: theme.badgeBorder },
                      ]}
                      onPress={() =>
                        handleRebook(
                          item.destination.placeName || 'Destination',
                          item.destination.address || '',
                          item.destination.latitude,
                          item.destination.longitude
                        )
                      }
                    >
                      <Ionicons name="repeat" size={14} color={theme.primary} />
                      <Text style={[styles.rebookText, { color: theme.primary }]}>Rebook</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.viewReceiptBtn,
                      { backgroundColor: theme.surfaceElevated },
                    ]}
                    onPress={() => setSelectedReceipt(item)}
                  >
                    <Ionicons name="receipt" size={14} color={theme.textPrimary} style={{ marginRight: 4 }} />
                    <Text style={[styles.viewReceiptText, { color: theme.textPrimary }]}>Receipt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Official Receipt Modal */}
      {selectedReceipt && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.receiptModalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <View style={styles.receiptModalTop}>
                <View>
                  <Text style={[styles.receiptModalTitle, { color: theme.textPrimary }]}>Official Trip Receipt</Text>
                  <Text style={[styles.receiptModalSub, { color: theme.textSecondary }]}>SB-{selectedReceipt.id}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedReceipt(null)}>
                  <Ionicons name="close" size={22} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={[styles.receiptItemsList, { backgroundColor: theme.surfaceElevated }]}>
                <View style={styles.receiptLine}>
                  <Text style={[styles.receiptItemName, { color: theme.textSecondary }]}>Base Fare</Text>
                  <Text style={[styles.receiptItemVal, { color: theme.textPrimary }]}>KES {selectedReceipt.fare?.baseFare || 70}.00</Text>
                </View>
                <View style={styles.receiptLine}>
                  <Text style={[styles.receiptItemName, { color: theme.textSecondary }]}>Distance Charge</Text>
                  <Text style={[styles.receiptItemVal, { color: theme.textPrimary }]}>KES {selectedReceipt.fare?.distanceFare || 80}.00</Text>
                </View>
                <View style={styles.receiptLine}>
                  <Text style={[styles.receiptItemName, { color: theme.textSecondary }]}>Time Charge</Text>
                  <Text style={[styles.receiptItemVal, { color: theme.textPrimary }]}>KES {selectedReceipt.fare?.timeFare || 20}.00</Text>
                </View>
                <View style={styles.receiptLine}>
                  <Text style={[styles.receiptItemName, { color: theme.textSecondary }]}>Booking Fee</Text>
                  <Text style={[styles.receiptItemVal, { color: theme.textPrimary }]}>KES {selectedReceipt.fare?.bookingFee || 20}.00</Text>
                </View>
                {selectedReceipt.tipAmount > 0 && (
                  <View style={styles.receiptLine}>
                    <Text style={[styles.receiptItemName, { color: theme.textSecondary }]}>Driver Tip</Text>
                    <Text style={[styles.receiptItemVal, { color: theme.primary }]}>+KES {selectedReceipt.tipAmount}.00</Text>
                  </View>
                )}
                <View style={[styles.receiptLine, styles.receiptTotalLine, { borderColor: theme.border }]}>
                  <Text style={[styles.receiptTotalLabel, { color: theme.textPrimary }]}>Total Paid</Text>
                  <Text style={[styles.receiptTotalValue, { color: theme.primary }]}>KES {selectedReceipt.fare?.totalFare || 190}.00</Text>
                </View>
              </View>

              <View style={[styles.paymentMethodNotice, { backgroundColor: theme.badgeBg }]}>
                <Ionicons name="phone-portrait" size={16} color={theme.primary} />
                <View>
                  <Text style={[styles.paymentMethodNoticeText, { color: theme.primary }]}>Paid via Safaricom M-Pesa</Text>
                  <Text style={[styles.paymentRefText, { color: theme.textMuted }]}>Ref Code: QK89XP4021 • Verified</Text>
                </View>
              </View>

              {/* Download / Share Official PDF Receipt Button */}
              <TouchableOpacity
                style={[styles.downloadReceiptBtn, { backgroundColor: theme.primary }]}
                onPress={() => handleDownloadReceipt(selectedReceipt)}
                disabled={isExportingPdf}
                activeOpacity={0.8}
              >
                {isExportingPdf ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="document-text" size={18} color="#FFFFFF" />
                    <Text style={[styles.downloadReceiptBtnText, { color: '#FFFFFF' }]}>Export Official PDF Receipt</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeReceiptBtn} onPress={() => setSelectedReceipt(null)}>
                <Text style={[styles.closeReceiptBtnText, { color: theme.textMuted }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070A0F' },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#0E141F',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },

  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 3,
    marginTop: 14,
  },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 12 },
  segmentBtnActive: { backgroundColor: '#0E141F' },
  segmentText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  segmentTextActive: { color: '#F8FAFC' },

  scrollContent: { padding: 16 },

  emptyUpcomingBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyUpcomingTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  emptyUpcomingSub: { color: '#94A3B8', fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },

  activityCard: {
    backgroundColor: '#0E141F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: { flex: 1 },
  destinationTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
  tripDate: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  fareAmount: { color: '#F8FAFC', fontSize: 16, fontWeight: '900' },

  cardDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)', marginVertical: 12 },

  routeBox: { gap: 6, marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  routeText: { color: '#94A3B8', fontSize: 12, flex: 1 },

  actionsRow: { flexDirection: 'row', gap: 10 },
  rebookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  rebookText: { color: '#10B981', fontSize: 12, fontWeight: '800' },
  viewReceiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 10,
  },
  viewReceiptText: { color: '#F8FAFC', fontSize: 12, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'center', padding: 20 },
  receiptModalCard: { backgroundColor: '#0E141F', borderRadius: 20, padding: 20, gap: 14, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  receiptModalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  receiptModalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  receiptModalSub: { color: '#64748B', fontSize: 11, fontWeight: '700', marginTop: 2 },
  receiptItemsList: { backgroundColor: '#070A0F', borderRadius: 12, padding: 14, gap: 8 },
  receiptLine: { flexDirection: 'row', justifyContent: 'space-between' },
  receiptItemName: { color: '#94A3B8', fontSize: 12 },
  receiptItemVal: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },
  receiptTotalLine: { borderTopWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', paddingTop: 8, marginTop: 4 },
  receiptTotalLabel: { color: '#F8FAFC', fontSize: 14, fontWeight: '800' },
  receiptTotalValue: { color: '#10B981', fontSize: 16, fontWeight: '900' },
  paymentMethodNotice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 10, borderRadius: 10 },
  paymentMethodNoticeText: { color: '#10B981', fontSize: 12, fontWeight: '800' },
  paymentRefText: { color: '#64748B', fontSize: 10, marginTop: 1 },

  downloadReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
  },
  downloadReceiptBtnText: { color: '#070A0F', fontSize: 14, fontWeight: '900' },
  closeReceiptBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeReceiptBtnText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
});
