import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSwiftBoda } from '../../context/SwiftBodaContext';
import { useTheme } from '../../context/ThemeContext';
import { SwiftBodaLoader } from '../../components/SwiftBodaLoader';

export default function WalletScreen() {
  const { currentUser, walletBalance, initiateMpesaSTKPush, isProcessingPayment } = useSwiftBoda();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [topUpAmount, setTopUpAmount] = useState('500');
  const [mpesaNumber, setMpesaNumber] = useState('+254712345678');
  const [isPushing, setIsPushing] = useState(false);
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

  const handleMpesaPush = async () => {
    if (isPushing || isProcessingPayment) return;
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 20) }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Swift Pay & Wallet</Text>
        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Instant ride payments & Safaricom M-Pesa</Text>
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
        {/* Uber Cash / Swift Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <View style={styles.balanceTopRow}>
            <View>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>SWIFT CASH BALANCE</Text>
              <Text style={[styles.balanceAmount, { color: theme.textPrimary }]}>KES {walletBalance.toFixed(2)}</Text>
            </View>
            <View style={[styles.balanceShieldBadge, { backgroundColor: theme.badgeBg }]}>
              <Ionicons name="shield-checkmark" size={16} color={theme.primary} />
              <Text style={[styles.balanceShieldText, { color: theme.primary }]}>Secured</Text>
            </View>
          </View>
          <Text style={[styles.balanceNote, { color: theme.textSecondary }]}>Auto-deducted on ride arrival • Zero transaction fees</Text>
        </View>

        {/* Quick Top-up with M-Pesa */}
        <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Instant M-Pesa Top-Up</Text>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>M-Pesa Mobile Number</Text>
          <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            <Ionicons name="call" size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.textInput, { color: theme.textPrimary }]}
              keyboardType="phone-pad"
              value={mpesaNumber}
              onChangeText={setMpesaNumber}
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Amount (KES)</Text>
          <View style={styles.quickAmountRow}>
            {['250', '500', '1000', '2000'].map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.quickAmountBtn,
                  { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                  topUpAmount === val && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => setTopUpAmount(val)}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    { color: theme.textSecondary },
                    topUpAmount === val && { color: '#FFFFFF', fontWeight: '800' },
                  ]}
                >
                  KES {val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.stkPushButton, (isPushing || isProcessingPayment) && { opacity: 0.7 }]}
            onPress={handleMpesaPush}
            disabled={isPushing || isProcessingPayment}
          >
            {isPushing || isProcessingPayment ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sync" size={16} color="#FFFFFF" />
                <Text style={styles.stkPushButtonText}>DISPATCHING STK PUSH...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="flash" size={16} color="#FFFFFF" />
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
        <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Payment Methods</Text>

          <View style={[styles.pmRow, { borderColor: theme.border }]}>
            <View style={[styles.pmIconBox, { backgroundColor: theme.surfaceElevated }]}>
              <Ionicons name="phone-portrait" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pmTitle, { color: theme.textPrimary }]}>Safaricom M-Pesa</Text>
              <Text style={[styles.pmSub, { color: theme.textSecondary }]}>{mpesaNumber} (Active)</Text>
            </View>
            <View style={[styles.defaultBadge, { backgroundColor: theme.badgeBg }]}>
              <Text style={[styles.defaultBadgeText, { color: theme.primary }]}>DEFAULT</Text>
            </View>
          </View>

          <View style={[styles.pmRow, { borderColor: theme.border }]}>
            <View style={[styles.pmIconBox, { backgroundColor: theme.surfaceElevated }]}>
              <Ionicons name="card" size={18} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pmTitle, { color: theme.textPrimary }]}>Visa / Mastercard</Text>
              <Text style={[styles.pmSub, { color: theme.textSecondary }]}>•••• •••• •••• 4242</Text>
            </View>
          </View>

          <View style={[styles.pmRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.pmIconBox, { backgroundColor: theme.surfaceElevated }]}>
              <Ionicons name="cash" size={18} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pmTitle, { color: theme.textPrimary }]}>Cash</Text>
              <Text style={[styles.pmSub, { color: theme.textSecondary }]}>Pay rider in person</Text>
            </View>
          </View>
        </View>

        {/* Transactions Ledger */}
        <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent Transactions</Text>
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIconCircle, tx.type === 'CREDIT' ? { backgroundColor: theme.badgeBg } : { backgroundColor: theme.surfaceElevated }]}>
                <Ionicons
                  name={tx.icon as any}
                  size={16}
                  color={tx.type === 'CREDIT' ? theme.primary : theme.textPrimary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.txDesc, { color: theme.textPrimary }]}>{tx.desc}</Text>
                <Text style={[styles.txDate, { color: theme.textMuted }]}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, tx.type === 'CREDIT' ? { color: theme.primary } : { color: theme.textPrimary }]}>
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
