import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default('postgresql://swift_admin:secure_swift_password@localhost:5432/swiftboda_db'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16).default('swiftboda_production_secure_jwt_secret_key_2026'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  DEFAULT_CURRENCY: z.string().default('KES'),
  DEFAULT_COUNTRY: z.string().default('KE'),
  DEFAULT_TIMEZONE: z.string().default('Africa/Nairobi'),
  PLATFORM_COMMISSION_RATE: z.coerce.number().min(0).max(1).default(0.15),
  MPESA_CONSUMER_KEY: z.string().default('mock_daraja_consumer_key'),
  MPESA_CONSUMER_SECRET: z.string().default('mock_daraja_consumer_secret'),
  MPESA_SHORTCODE: z.string().default('174379'),
  MPESA_PASSKEY: z.string().default('mock_daraja_passkey'),
  MAPS_PROVIDER: z.enum(['OSRM', 'GOOGLE', 'MAPBOX', 'SERPLY']).default('SERPLY'),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  SERPLY_API_KEY: z.string().default('TF5AxxbSLF1ezxP2tC4EyKBx'),
});

export type Config = z.infer<typeof envSchema>;

function loadConfig(): Config {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment configuration:', parsed.error.format());
    // In production fail-fast; in dev apply defaults
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration');
    }
    return envSchema.parse({});
  }
  return parsed.data;
}

export const config = loadConfig();
