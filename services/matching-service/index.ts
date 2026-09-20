import { GeoLocation, VehicleCategory } from '../../shared/types';
import { db, DriverRecord, UserRecord, VehicleRecord } from '../database/db';
import { locationService } from '../location-service';
import { redisService } from '../redis/redis';

export interface MatchedDriverCandidate {
  driverId: string;
  userId: string;
  name: string;
  phone: string;
  rating: number;
  acceptanceRate: number;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleColor: string;
  category: VehicleCategory;
  score: number;
  distanceKm: number;
  etaMinutes: number;
}

export class MatchingService {
  /**
   * Evaluates, scores, and atomically reserves the best eligible online driver for a ride request.
   * Uses Redis distributed locking to guarantee zero race conditions between concurrent riders.
   */
  public async matchAndLockDriver(
    pickup: GeoLocation,
    category: VehicleCategory = 'BODA_STANDARD'
  ): Promise<MatchedDriverCandidate | null> {
    // 1. Query spatial index for candidate drivers within 8.0 KM
    const nearby = await locationService.findNearbyDrivers(pickup, 8.0, category);
    if (nearby.length === 0) {
      return null;
    }

    // 2. Rank candidates using multi-factor scoring
    const candidates: MatchedDriverCandidate[] = [];

    for (const item of nearby) {
      const candidate = this.evaluateCandidate(item.driver, item.distanceKm, category);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    // 3. Atomically attempt to acquire distributed lock for highest scoring available driver
    for (const candidate of candidates) {
      const lockAcquired = await redisService.acquireLock(`driver_dispatch:${candidate.driverId}`, 15000);
      if (lockAcquired) {
        // Successfully reserved driver exclusively for 15 seconds
        return candidate;
      }
      // If locked, driver is already receiving an offer or busy; continue to next candidate
    }

    return null;
  }

  /**
   * Releases dispatch lock when driver rejects or offer times out.
   */
  public async releaseDriverDispatchLock(driverId: string): Promise<void> {
    await redisService.releaseLock(`driver_dispatch:${driverId}`);
  }

  private evaluateCandidate(
    driver: DriverRecord,
    distanceKm: number,
    requestedCategory: VehicleCategory
  ): MatchedDriverCandidate | null {
    const user = db.users.get(driver.user_id);
    if (!user) return null;

    const vehicle = Array.from(db.vehicles.values()).find((v) => v.driver_id === driver.id);
    if (!vehicle) return null;

    // Multi-factor Scoring:
    // Distance weight (50%): closer driver = higher score (max 100 points)
    const distanceScore = Math.max(0, 100 - distanceKm * 12);
    // Rating weight (30%): 5.0 rating = 100 points
    const ratingScore = (user.rating / 5.0) * 100;
    // Acceptance rate weight (20%): 100% acceptance = 100 points
    const acceptanceScore = driver.acceptance_rate;

    const compositeScore = distanceScore * 0.5 + ratingScore * 0.3 + acceptanceScore * 0.2;
    const etaMinutes = Math.max(1, Math.ceil((distanceKm / 24) * 60));

    return {
      driverId: driver.id,
      userId: user.id,
      name: user.full_name,
      phone: user.phone_number,
      rating: user.rating,
      acceptanceRate: driver.acceptance_rate,
      vehiclePlate: vehicle.license_plate,
      vehicleModel: `${vehicle.make} ${vehicle.model}`,
      vehicleColor: vehicle.color,
      category: vehicle.category,
      score: parseFloat(compositeScore.toFixed(2)),
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      etaMinutes,
    };
  }
}

export const matchingService = new MatchingService();
