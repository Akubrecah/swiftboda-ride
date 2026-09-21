import Redis from 'ioredis';
import { config } from '../config';
import { calculateHaversineDistance } from '../../shared/utils/geo';

interface GeoLocationItem {
  key: string;
  latitude: number;
  longitude: number;
  member: string;
}

class RedisService {
  private client: Redis | null = null;
  public isConnected = false;

  // In-Memory fallback cache when Redis server container is offline
  private inMemoryStore = new Map<string, { value: string; expiresAt?: number }>();
  private geoStore = new Map<string, Map<string, { latitude: number; longitude: number }>>();

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    try {
      this.client = new Redis(config.REDIS_URL, {
        lazyConnect: true,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
        enableOfflineQueue: false,
      });

      this.client.on('error', () => {
        this.isConnected = false;
      });

      this.client.connect().then(() => {
        this.isConnected = true;
        console.log('✅ Connected to Redis 7 distributed cache & spatial index.');
      }).catch(() => {
        console.warn(`ℹ️ Redis not reachable at ${config.REDIS_URL}. Operating with Resilient Spatial Cache.`);
        this.isConnected = false;
      });
    } catch (e) {
      this.isConnected = false;
    }
  }

  // --- 1. Distributed Locking Primitives (Redlock Pattern) ---

  /**
   * Acquires an atomic distributed lock with a TTL in milliseconds.
   * Returns true if the lock was acquired, false if already locked by another process.
   */
  public async acquireLock(lockKey: string, ttlMs: number = 10000): Promise<boolean> {
    const fullKey = `lock:${lockKey}`;
    const token = Date.now().toString();

    if (this.isConnected && this.client) {
      try {
        const res = await this.client.set(fullKey, token, 'PX', ttlMs, 'NX');
        return res === 'OK';
      } catch (err) {
        // Fall back to in-memory lock
      }
    }

    // In-memory atomic lock check
    const existing = this.inMemoryStore.get(fullKey);
    const now = Date.now();
    if (existing && (!existing.expiresAt || existing.expiresAt > now)) {
      return false; // Already locked
    }

    this.inMemoryStore.set(fullKey, { value: token, expiresAt: now + ttlMs });
    return true;
  }

  /**
   * Releases an acquired distributed lock.
   */
  public async releaseLock(lockKey: string): Promise<void> {
    const fullKey = `lock:${lockKey}`;
    if (this.isConnected && this.client) {
      try {
        await this.client.del(fullKey);
        return;
      } catch (err) {
        // Fall back
      }
    }
    this.inMemoryStore.delete(fullKey);
  }

  // --- 2. Geospatial Indexing (GEOADD / GEORADIUS) ---

  /**
   * Adds or updates a driver's live GPS coordinate in the spatial index.
   */
  public async geoAdd(key: string, latitude: number, longitude: number, member: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        // Note: Redis GEOADD takes (key, longitude, latitude, member)
        await this.client.geoadd(key, longitude, latitude, member);
        return;
      } catch (err) {
        // Fall back
      }
    }

    if (!this.geoStore.has(key)) {
      this.geoStore.set(key, new Map());
    }
    this.geoStore.get(key)!.set(member, { latitude, longitude });
  }

  /**
   * Finds all members within radius (in KM) sorted by proximity.
   */
  public async geoRadius(
    key: string,
    centerLat: number,
    centerLon: number,
    radiusKm: number
  ): Promise<{ member: string; distanceKm: number }[]> {
    if (this.isConnected && this.client) {
      try {
        const results = (await this.client.georadius(
          key,
          centerLon,
          centerLat,
          radiusKm,
          'km',
          'WITHDIST',
          'ASC'
        )) as [string, string][];

        return results.map(([member, distStr]) => ({
          member,
          distanceKm: parseFloat(distStr),
        }));
      } catch (err) {
        // Fall back
      }
    }

    const items = this.geoStore.get(key);
    if (!items) return [];

    const matches: { member: string; distanceKm: number }[] = [];
    for (const [member, coords] of items.entries()) {
      const dist = calculateHaversineDistance(centerLat, centerLon, coords.latitude, coords.longitude);
      if (dist <= radiusKm) {
        matches.push({ member, distanceKm: parseFloat(dist.toFixed(3)) });
      }
    }

    return matches.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  // --- 3. Key-Value and Sliding Window Rate Limiting ---

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.setex(key, ttlSeconds, value);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        // Fall back
      }
    }

    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.inMemoryStore.set(key, { value, expiresAt });
  }

  public async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        // Fall back
      }
    }

    const item = this.inMemoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.inMemoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  public async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        // Fall back
      }
    }
    this.inMemoryStore.delete(key);
  }
}

export const redisService = new RedisService();
