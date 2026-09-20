import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { db, UserRecord } from '../database/db';
import { redisService } from '../redis/redis';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Omit<UserRecord, 'password_hash'>;
}

export interface JwtPayload {
  userId: string;
  role: UserRecord['role'];
  email: string;
  phoneNumber: string;
}

export class AuthService {
  /**
   * Registers a new User (Rider or Driver) with secure password hashing.
   */
  public async register(
    fullName: string,
    email: string,
    phoneNumber: string,
    passwordPlain: string,
    role: UserRecord['role'] = 'RIDER'
  ): Promise<AuthTokens> {
    // Check existing email/phone
    const existingUser = Array.from(db.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase() || u.phone_number === phoneNumber
    );

    if (existingUser) {
      throw new Error('A user with this email or phone number already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    const userId = `usr-${uuidv4()}`;
    const newUser: UserRecord = {
      id: userId,
      full_name: fullName,
      email: email.toLowerCase(),
      phone_number: phoneNumber,
      password_hash: passwordHash,
      role,
      status: 'ACTIVE',
      rating: 5.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.users.set(userId, newUser);

    // Initialize user wallet
    const walletId = uuidv4();
    db.wallets.set(walletId, {
      id: walletId,
      user_id: userId,
      balance: role === 'RIDER' ? 500.0 : 0.0, // 500 KES welcome credit for new riders
      currency: config.DEFAULT_CURRENCY,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return this.generateTokens(newUser);
  }

  /**
   * Authenticates user via email/phone and password.
   */
  public async loginWithPassword(emailOrPhone: string, passwordPlain: string): Promise<AuthTokens> {
    const user = Array.from(db.users.values()).find(
      (u) => u.email.toLowerCase() === emailOrPhone.toLowerCase() || u.phone_number === emailOrPhone
    );

    if (!user) {
      throw new Error('Invalid email/phone or password credentials.');
    }

    if (user.status === 'SUSPENDED' || user.status === 'BLOCKED') {
      throw new Error('Account suspended. Contact operations support.');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email/phone or password credentials.');
    }

    return this.generateTokens(user);
  }

  /**
   * Requests a 6-digit SMS OTP code (simulated / rate-limited via Redis).
   */
  public async requestPhoneOTP(phoneNumber: string): Promise<{ success: boolean; message: string; otpHint?: string }> {
    const rateLimitKey = `otp_limit:${phoneNumber}`;
    const recentRequest = await redisService.get(rateLimitKey);
    if (recentRequest) {
      throw new Error('Too many OTP requests. Please wait 60 seconds before requesting another code.');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${phoneNumber}`;
    // Store OTP in Redis with 5 minute expiration
    await redisService.set(otpKey, otpCode, 300);
    // 60-second rate limit
    await redisService.set(rateLimitKey, '1', 60);

    console.log(`📱 [SMS DISPATCH to ${phoneNumber}] Your Swift Boda verification code is: ${otpCode}`);

    return {
      success: true,
      message: `Verification code sent to ${phoneNumber}`,
      otpHint: config.NODE_ENV !== 'production' ? otpCode : undefined,
    };
  }

  /**
   * Verifies Phone OTP and logs in or creates rider account.
   */
  public async verifyPhoneOTP(phoneNumber: string, enteredCode: string): Promise<AuthTokens> {
    const otpKey = `otp:${phoneNumber}`;
    const storedCode = await redisService.get(otpKey);

    // Default test OTP for sandbox
    const isValid = storedCode === enteredCode || (enteredCode === '123456' && config.NODE_ENV !== 'production');
    if (!isValid) {
      throw new Error('Invalid or expired verification code.');
    }

    await redisService.del(otpKey);

    let user = Array.from(db.users.values()).find((u) => u.phone_number === phoneNumber);
    if (!user) {
      // Auto-register rider via OTP
      const salt = await bcrypt.genSalt(10);
      const tempHash = await bcrypt.hash('DefaultPass123!', salt);
      const userId = `usr-${uuidv4()}`;
      user = {
        id: userId,
        full_name: 'Swift User',
        email: `${phoneNumber.replace(/[^0-9]/g, '')}@swiftboda.co.ke`,
        phone_number: phoneNumber,
        password_hash: tempHash,
        role: 'RIDER',
        status: 'ACTIVE',
        rating: 5.0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.users.set(userId, user);

      const walletId = uuidv4();
      db.wallets.set(walletId, {
        id: walletId,
        user_id: userId,
        balance: 500.0,
        currency: config.DEFAULT_CURRENCY,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return this.generateTokens(user);
  }

  public verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    } catch (err) {
      throw new Error('Invalid or expired authentication token.');
    }
  }

  private generateTokens(user: UserRecord): AuthTokens {
    const payload: JwtPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
      phoneNumber: user.phone_number,
    };

    const accessToken = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign({ userId: user.id }, config.JWT_SECRET, {
      expiresIn: '7d',
    });

    const { password_hash, ...safeUser } = user;

    return {
      accessToken,
      refreshToken,
      user: safeUser,
    };
  }
}

export const authService = new AuthService();
