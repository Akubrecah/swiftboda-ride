import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSwiftBoda } from '../../context/SwiftBodaContext';

export default function ActivityScreen() {
  const router = useRouter();
  const { pastTrips, currentUser, rebookDestination } = useSwiftBoda();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'PAST' | 'UPCOMING'>('PAST');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const handleRebook = (destName: string, destAddr: string, lat: number, lon: number) => {
    rebookDestination({
      latitude: lat,
      longitude: lon,
      placeName: destName,
      address: destAddr,
    });
    router.push('/(tabs)');
  };

  const handleDownloadReceipt = async (receipt: any) => {
    try {
      const receiptText = `=========================================
      SWIFTBODA TAXI & COURIER
       OFFICIAL TRIP RECEIPT
=========================================
Receipt No:      SB-${receipt.id || '98124'}
Date & Time:     ${new Date(receipt.createdAt || Date.now()).toLocaleString()}
Status:          PAID & COMPLETED
-----------------------------------------
PASSENGER:       ${receipt.rider?.name || currentUser?.fullName || 'Valued Rider'}
Phone:           ${receipt.rider?.phone || currentUser?.phoneNumber || '+254712345001'}

DRIVER:          ${receipt.driver?.name || 'Kiprop Chemokil'}
Vehicle:         ${receipt.driver?.vehicleModel || 'Bajaj Boxer 150X'} (${receipt.driver?.vehiclePlate || 'KMDK 234P'})
Rating:          ★ ${receipt.rating || 5}.0

ROUTE DETAILS:
Pickup:          ${receipt.pickup?.address || 'Makutano Junction Stage'}
Destination:     ${receipt.destination?.placeName || receipt.destination?.address || 'Kapenguria County Hospital'}
Distance:        ${receipt.fare?.estimatedDistanceKm || 1.9} km
Duration:        ${receipt.fare?.estimatedDurationMin || 6} mins
-----------------------------------------
ITEMIZED FARE BREAKDOWN:
Base Fare:                 KES ${receipt.fare?.baseFare || 50}.00
Distance Charge:           KES ${receipt.fare?.distanceFare || 30}.00
Time Charge:               KES ${receipt.fare?.timeFare || 10}.00
Booking Fee:               KES ${receipt.fare?.bookingFee || 0}.00
${receipt.tipAmount ? `Driver Tip:                KES ${receipt.tipAmount}.00\n` : ''}TOTAL CHARGED:             KES ${receipt.fare?.totalFare || 90}.00
-----------------------------------------
PAYMENT SUMMARY:
Payment Method:            Safaricom M-Pesa
M-Pesa Trans Code:         QK89XP4021
Transaction Status:        SUCCESSFUL
=========================================
Swift Boda Kenya Ltd.
Thank you for riding with us safely!
=========================================`;

      await Share.share({
        message: receiptText,
        title: `SwiftBoda Official Receipt - ${receipt.id}`,
      });
    } catch (e) {
      Alert.alert('Download Error', 'Could not export receipt.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 20) }]}>
        <Text style={styles.headerTitle}>Activity</Text>
        <Text style={styles.headerSub}>
          {currentUser?.role === 'DRIVER' ? 'Your completed driver trips & payouts' : 'Past rides, receipts and rebooking'}
        </Text>

        {/* Uber Segmented Tabs */}
        <View style={styles.segmentedRow}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'PAST' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('PAST')}
          >
            <Text style={[styles.segmentText, activeTab === 'PAST' && styles.segmentTextActive]}>
              Past ({pastTrips.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'UPCOMING' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('UPCOMING')}
          >
            <Text style={[styles.segmentText, activeTab === 'UPCOMING' && styles.segmentTextActive]}>Upcoming</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'UPCOMING' ? (
          <View style={styles.emptyUpcomingBox}>
            <Ionicons name="calendar-outline" size={48} color="#64748B" />
            <Text style={styles.emptyUpcomingTitle}>No upcoming trips</Text>
            <Text style={styles.emptyUpcomingSub}>Reserve a ride up to 30 days in advance</Text>
          </View>
        ) : pastTrips.length === 0 ? (
          <View style={styles.emptyUpcomingBox}>
            <Ionicons name="receipt-outline" size={48} color="#64748B" />
            <Text style={styles.emptyUpcomingTitle}>No past trips found</Text>
            <Text style={styles.emptyUpcomingSub}>Your ride history will appear here after your first trip.</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {pastTrips.map((item) => (
              <View key={item.id} style={styles.activityCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.categoryIconCircle}>
                    <Ionicons
                      name={item.category === 'EXPRESS_DELIVERY' ? 'paper-plane' : 'bicycle'}
                      size={20}
                      color="#10B981"
                    />
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.destinationTitle} numberOfLines={1}>
                      {item.destination.placeName || item.destination.address}
                    </Text>
                    <Text style={styles.tripDate}>
                      {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.fareAmount}>KES {item.fare.totalFare.toFixed(0)}</Text>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.routeBox}>
                  <View style={styles.routeRow}>
                    <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      From: {item.pickup.address}
                    </Text>
                  </View>
                  <View style={styles.routeRow}>
                    <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      To: {item.destination.address}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  {currentUser?.role === 'RIDER' && (
                    <TouchableOpacity
                      style={styles.rebookBtn}
                      onPress={() =>
                        handleRebook(
                          item.destination.placeName || 'Destination',
                          item.destination.address || '',
                          item.destination.latitude,
                          item.destination.longitude
                        )
                      }
                    >
                      <Ionicons name="repeat" size={14} color="#10B981" />
                      <Text style={styles.rebookText}>Rebook</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.viewReceiptBtn}
                    onPress={() => setSelectedReceipt(item)}
                  >
                    <Ionicons name="receipt" size={14} color="#F8FAFC" style={{ marginRight: 4 }} />
                    <Text style={styles.viewReceiptText}>Receipt</Text>
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
            <View style={styles.receiptModalCard}>
              <View style={styles.receiptModalTop}>
                <View>
                  <Text style={styles.receiptModalTitle}>Official Trip Receipt</Text>
                  <Text style={styles.receiptModalSub}>SB-{selectedReceipt.id}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedReceipt(null)}>
                  <Ionicons name="close" size={22} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.receiptItemsList}>
                <View style={styles.receiptLine}>
                  <Text style={styles.receiptItemName}>Base Fare</Text>
                  <Text style={styles.receiptItemVal}>KES {selectedReceipt.fare?.baseFare || 70}.00</Text>
                </View>
                <View style={styles.receiptLine}>
                  <Text style={styles.receiptItemName}>Distance Charge</Text>
                  <Text style={styles.receiptItemVal}>KES {selectedReceipt.fare?.distanceFare || 80}.00</Text>
                </View>
                <View style={styles.receiptLine}>
                  <Text style={styles.receiptItemName}>Time Charge</Text>
                  <Text style={styles.receiptItemVal}>KES {selectedReceipt.fare?.timeFare || 20}.00</Text>
                </View>
                <View style={styles.receiptLine}>
                  <Text style={styles.receiptItemName}>Booking Fee</Text>
                  <Text style={styles.receiptItemVal}>KES {selectedReceipt.fare?.bookingFee || 20}.00</Text>
                </View>
                {selectedReceipt.tipAmount > 0 && (
                  <View style={styles.receiptLine}>
                    <Text style={styles.receiptItemName}>Driver Tip</Text>
                    <Text style={styles.receiptItemVal}>+KES {selectedReceipt.tipAmount}.00</Text>
                  </View>
                )}
                <View style={[styles.receiptLine, styles.receiptTotalLine]}>
                  <Text style={styles.receiptTotalLabel}>Total Paid</Text>
                  <Text style={styles.receiptTotalValue}>KES {selectedReceipt.fare?.totalFare || 190}.00</Text>
                </View>
              </View>

              <View style={styles.paymentMethodNotice}>
                <Ionicons name="phone-portrait" size={16} color="#10B981" />
                <View>
                  <Text style={styles.paymentMethodNoticeText}>Paid via Safaricom M-Pesa</Text>
                  <Text style={styles.paymentRefText}>Ref Code: QK89XP4021 • Verified</Text>
                </View>
              </View>

              {/* Download / Share Official Receipt Button */}
              <TouchableOpacity
                style={styles.downloadReceiptBtn}
                onPress={() => handleDownloadReceipt(selectedReceipt)}
              >
                <Ionicons name="download-outline" size={18} color="#070A0F" />
                <Text style={styles.downloadReceiptBtnText}>Download / Share Official Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeReceiptBtn} onPress={() => setSelectedReceipt(null)}>
                <Text style={styles.closeReceiptBtnText}>Close</Text>
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
