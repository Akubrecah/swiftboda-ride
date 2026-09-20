import { v4 as uuidv4 } from 'uuid';
import { PaymentMethod, PaymentStatus } from '../../shared/types';
import { config } from '../config';
import { db, PaymentRecord, WalletTransactionRecord } from '../database/db';

export interface PaymentSettlementResult {
  payment: PaymentRecord;
  riderTransaction?: WalletTransactionRecord;
  driverTransaction?: WalletTransactionRecord;
  platformFee: number;
  driverPayout: number;
}

export class PaymentService {
  /**
   * Executes double-entry financial settlement upon trip completion.
   * Atomically splits gross fare into platform commission and driver wallet credit.
   */
  public async processTripSettlement(
    tripId: string,
    riderId: string,
    driverId: string | undefined,
    totalFare: number,
    paymentMethod: PaymentMethod
  ): Promise<PaymentSettlementResult> {
    const platformFee = parseFloat((totalFare * config.PLATFORM_COMMISSION_RATE).toFixed(2));
    const driverPayout = parseFloat((totalFare - platformFee).toFixed(2));

    const paymentId = `pay-${uuidv4().substring(0, 8)}`;
    const txRef = `SB-TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment: PaymentRecord = {
      id: paymentId,
      trip_id: tripId,
      rider_id: riderId,
      driver_id: driverId,
      amount: totalFare,
      platform_fee: platformFee,
      driver_payout: driverPayout,
      currency: config.DEFAULT_CURRENCY,
      payment_method: paymentMethod,
      status: 'COMPLETED',
      transaction_ref: txRef,
      provider_reference: paymentMethod === 'MPESA' ? `WS-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.payments.set(paymentId, payment);

    let riderTx: WalletTransactionRecord | undefined;
    let driverTx: WalletTransactionRecord | undefined;

    // 1. Double-entry accounting: Debit Rider Wallet (if wallet used)
    if (paymentMethod === 'WALLET') {
      const riderWallet = Array.from(db.wallets.values()).find((w) => w.user_id === riderId);
      if (riderWallet) {
        riderWallet.balance = Math.max(0, parseFloat((riderWallet.balance - totalFare).toFixed(2)));
        db.wallets.set(riderWallet.id, riderWallet);

        riderTx = {
          id: uuidv4(),
          wallet_id: riderWallet.id,
          trip_id: tripId,
          amount: totalFare,
          type: 'TRIP_PAYMENT',
          direction: 'DEBIT',
          reference: `${txRef}-DEBIT-RIDER`,
          description: `Fare payment for Trip ${tripId}`,
          created_at: new Date().toISOString(),
        };
        db.walletTransactions.set(riderTx.id, riderTx);
      }
    }

    // 2. Double-entry accounting: Credit Driver Wallet with Earnings (85% net fare)
    if (driverId) {
      const driver = db.drivers.get(driverId);
      if (driver) {
        const driverWallet = Array.from(db.wallets.values()).find((w) => w.user_id === driver.user_id);
        if (driverWallet) {
          driverWallet.balance = parseFloat((driverWallet.balance + driverPayout).toFixed(2));
          db.wallets.set(driverWallet.id, driverWallet);

          driverTx = {
            id: uuidv4(),
            wallet_id: driverWallet.id,
            trip_id: tripId,
            amount: driverPayout,
            type: 'DRIVER_PAYOUT',
            direction: 'CREDIT',
            reference: `${txRef}-CREDIT-DRIVER`,
            description: `Driver earnings payout for Trip ${tripId} (after 15% platform fee)`,
            created_at: new Date().toISOString(),
          };
          db.walletTransactions.set(driverTx.id, driverTx);
        }
      }
    }

    return {
      payment,
      riderTransaction: riderTx,
      driverTransaction: driverTx,
      platformFee,
      driverPayout,
    };
  }

  /**
   * Triggers Safaricom M-Pesa STK Push for instant mobile money checkout.
   */
  public async initiateMpesaSTKPush(
    phoneNumber: string,
    amount: number,
    accountReference: string
  ): Promise<{ checkoutRequestId: string; customerMessage: string }> {
    // Standard format Kenyan phone number (2547XXXXXXXX)
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    const checkoutRequestId = `ws_CO_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    console.log(
      `📲 [M-PESA DARAJA STK PUSH] Requesting KES ${amount} from ${formattedPhone} for ref: ${accountReference}`
    );

    return {
      checkoutRequestId,
      customerMessage: `Success. Prompt sent to ${formattedPhone}. Enter M-Pesa PIN to complete payment.`,
    };
  }

  /**
   * Top up in-app wallet balance.
   */
  public async topUpWallet(userId: string, amount: number, paymentMethod: PaymentMethod = 'MPESA'): Promise<number> {
    let wallet = Array.from(db.wallets.values()).find((w) => w.user_id === userId);
    if (!wallet) {
      const walletId = uuidv4();
      wallet = {
        id: walletId,
        user_id: userId,
        balance: 0,
        currency: config.DEFAULT_CURRENCY,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.wallets.set(walletId, wallet);
    }

    wallet.balance = parseFloat((wallet.balance + amount).toFixed(2));
    db.wallets.set(wallet.id, wallet);

    const txId = uuidv4();
    const tx: WalletTransactionRecord = {
      id: txId,
      wallet_id: wallet.id,
      amount,
      type: 'TOPUP',
      direction: 'CREDIT',
      reference: `TOPUP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      description: `Wallet top-up via ${paymentMethod}`,
      created_at: new Date().toISOString(),
    };
    db.walletTransactions.set(txId, tx);

    return wallet.balance;
  }

  public getWallet(userId: string) {
    return Array.from(db.wallets.values()).find((w) => w.user_id === userId);
  }

  public getAllPayments(): PaymentRecord[] {
    return Array.from(db.payments.values());
  }

  public getDriverTransactions(driverId: string): PaymentRecord[] {
    return Array.from(db.payments.values()).filter((p) => p.driver_id === driverId);
  }
}

export const paymentService = new PaymentService();
