import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSwiftBoda } from '../../context/SwiftBodaContext';
import { SwiftBodaLoader } from '../../components/SwiftBodaLoader';

export default function WalletScreen() {
  const { currentUser, walletBalance, initiateMpesaSTKPush } = useSwiftBoda();
  const insets = useSafeAreaInsets();
  const [topUpAmount, setTopUpAmount] = useState('500');
  const [mpesaNumber, setMpesaNumber] = useState('+254712345678');
  const [isPushing, setIsPushing] = useState(false);

  const handleMpesaPush = async () => {
    const val = parseFloat(topUpAmount) || 0;
    if (val <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid top-up amount.');
      return;
    }
    setIsPushing(true);
    try {
      const res = await initiateMpesaSTKPush(mpesaNumber, val, 'SwiftBoda');
      if (res.success) {
        Alert.alert(
          'M-Pesa STK Prompt Sent 📲',
          `${res.customerMessage || 'Check your phone and enter your Safaricom M-Pesa PIN.'}\n\nCheckout ID: ${res.checkoutRequestId || 'Processed'}\nWallet credited: +KES ${val.toFixed(2)}`
        );
      } else {
        Alert.alert(
          'STK Push Error',
          res.errorMessage || 'Failed to trigger STK Push. Please check the phone number.'
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unexpected network error.');
    } finally {
      setIsPushing(false);
    }
  };

  const transactions = currentUser?.role === 'DRIVER' ? [
    { id: 'tx-drv-1', type: 'CREDIT', desc: 'Ride Payout - Makutano to Hospital', date: 'Today, 11:20 AM', amount: 76.5, icon: 'bicycle' },
    { id: 'tx-drv-2', type: 'CREDIT', desc: 'Ride Payout - Chepareria Market', date: 'Today, 8:45 AM', amount: 212.5, icon: 'bicycle' },
    { id: 'tx-drv-3', type: 'DEBIT', desc: 'M-Pesa Withdrawal to Safaricom', date: 'Yesterday, 6:00 PM', amount: -1500.0, icon: 'arrow-up-circle' },
  ] : [
    { id: 'tx-1', type: 'CREDIT', desc: 'M-Pesa Express Top-up', date: 'Today, 11:20 AM', amount: 500.0, icon: 'arrow-down-circle' },
    { id: 'tx-2', type: 'DEBIT', desc: 'Ride to Kapenguria Hospital', date: 'Today, 8:45 AM', amount: -90.0, icon: 'bicycle' },
    { id: 'tx-3', type: 'DEBIT', desc: 'Ride to Chepareria Stage', date: 'Yesterday, 6:15 PM', amount: -250.0, icon: 'bicycle' },
    { id: 'tx-4', type: 'CREDIT', desc: 'Promo Bonus POKOT50', date: 'Yesterday, 10:00 AM', amount: 50.0, icon: 'gift' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 20) }]}>
        <Text style={styles.headerTitle}>Swift Pay & Wallet</Text>
        <Text style={styles.headerSub}>Instant ride payments & Safaricom M-Pesa</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Uber Cash / Swift Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <View>
              <Text style={styles.balanceLabel}>SWIFT CASH BALANCE</Text>
              <Text style={styles.balanceAmount}>KES {walletBalance.toFixed(2)}</Text>
            </View>
            <View style={styles.balanceShieldBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.balanceShieldText}>Secured</Text>
            </View>
          </View>
          <Text style={styles.balanceNote}>Auto-deducted on ride arrival • Zero transaction fees</Text>
        </View>

        {/* Quick Top-up with M-Pesa */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Instant M-Pesa Top-Up</Text>

          <Text style={styles.inputLabel}>M-Pesa Mobile Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              keyboardType="phone-pad"
              value={mpesaNumber}
              onChangeText={setMpesaNumber}
              placeholderTextColor="#64748B"
            />
          </View>

          <Text style={styles.inputLabel}>Amount (KES)</Text>
          <View style={styles.quickAmountRow}>
            {['250', '500', '1000', '2000'].map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.quickAmountBtn, topUpAmount === val && styles.quickAmountBtnActive]}
                onPress={() => setTopUpAmount(val)}
              >
                <Text style={[styles.quickAmountText, topUpAmount === val && styles.quickAmountTextActive]}>
                  KES {val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.stkPushButton, isPushing && { opacity: 0.7 }]}
            onPress={handleMpesaPush}
            disabled={isPushing}
          >
            {isPushing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sync" size={16} color="#070A0F" />
                <Text style={styles.stkPushButtonText}>DISPATCHING STK PUSH...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="flash" size={16} color="#070A0F" />
                <Text style={styles.stkPushButtonText}>SEND M-PESA STK PUSH</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Branded SwiftBoda Emerald Radar Loader */}
        <SwiftBodaLoader
          visible={isPushing}
          fullscreen
          message="Dispatching Lipa Na M-Pesa..."
          subMessage={`Prompting ${mpesaNumber} for KES ${parseFloat(topUpAmount) || 0}.\nEnter your Safaricom PIN to authorize.`}
        />

        {/* Payment Methods */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>

          <View style={styles.pmRow}>
            <View style={styles.pmIconBox}>
              <Ionicons name="phone-portrait" size={18} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pmTitle}>Safaricom M-Pesa</Text>
              <Text style={styles.pmSub}>{mpesaNumber} (Active)</Text>
            </View>
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>DEFAULT</Text>
            </View>
          </View>

          <View style={styles.pmRow}>
            <View style={styles.pmIconBox}>
              <Ionicons name="card" size={18} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pmTitle}>Visa / Mastercard</Text>
              <Text style={styles.pmSub}>•••• •••• •••• 4242</Text>
            </View>
          </View>

          <View style={[styles.pmRow, { borderBottomWidth: 0 }]}>
            <View style={styles.pmIconBox}>
              <Ionicons name="cash" size={18} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pmTitle}>Cash</Text>
              <Text style={styles.pmSub}>Pay rider in person</Text>
            </View>
          </View>
        </View>

        {/* Transactions Ledger */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIconCircle, tx.type === 'CREDIT' ? styles.txCreditIcon : styles.txDebitIcon]}>
                <Ionicons
                  name={tx.icon as any}
                  size={16}
                  color={tx.type === 'CREDIT' ? '#10B981' : '#F8FAFC'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txDesc}>{tx.desc}</Text>
                <Text style={styles.txDate}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, tx.type === 'CREDIT' ? styles.txCreditAmount : styles.txDebitAmount]}>
                {tx.type === 'CREDIT' ? `+KES ${tx.amount.toFixed(0)}` : `KES ${tx.amount.toFixed(0)}`}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
  headerSub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  scrollContent: { padding: 16, gap: 14 },

  balanceCard: {
    backgroundColor: '#0E141F',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  balanceTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  balanceLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  balanceAmount: { color: '#F8FAFC', fontSize: 28, fontWeight: '900', marginTop: 4 },
  balanceShieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  balanceShieldText: { color: '#10B981', fontSize: 11, fontWeight: '700' },
  balanceNote: { color: '#94A3B8', fontSize: 11, marginTop: 10 },

  sectionCard: {
    backgroundColor: '#0E141F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  inputLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#070A0F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInput: { flex: 1, color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  quickAmountRow: { flexDirection: 'row', gap: 8 },
  quickAmountBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  quickAmountBtnActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  quickAmountText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  quickAmountTextActive: { color: '#070A0F', fontWeight: '800' },

  stkPushButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  stkPushButtonText: { color: '#070A0F', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

  pmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pmIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pmTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  pmSub: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  defaultBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  defaultBadgeText: { color: '#10B981', fontSize: 10, fontWeight: '800' },

  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  txIconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txCreditIcon: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  txDebitIcon: { backgroundColor: '#1E293B' },
  txDesc: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  txDate: { color: '#64748B', fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 13, fontWeight: '800' },
  txCreditAmount: { color: '#10B981' },
  txDebitAmount: { color: '#F8FAFC' },
});
