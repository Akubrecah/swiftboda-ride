import { GeoLocation, VehicleCategory } from '../../shared/types';
import { db, DriverRecord } from '../database/db';
import { redisService } from '../redis/redis';
import { calculateHaversineDistance } from '../../shared/utils/geo';

export interface DriverLocationPing {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp?: number;
  tripId?: string;
}

export class LocationService {
  private SPATIAL_KEY = 'drivers:spatial_index';

  /**
   * Ingests real-time high-frequency GPS location pings from driver application.
   */
  public async updateDriverLocation(ping: DriverLocationPing): Promise<void> {
    const { driverId, latitude, longitude, heading = 0, speed = 0, tripId } = ping;

    // 1. Update Redis geospatial index for instantaneous radius lookup
    await redisService.geoAdd(this.SPATIAL_KEY, latitude, longitude, driverId);

    // 2. Cache driver latest telemetry payload with 30s TTL
    const telemetryPayload = JSON.stringify({
      driverId,
      latitude,
      longitude,
      heading,
      speed,
      timestamp: ping.timestamp || Date.now(),
      tripId,
    });
    await redisService.set(`driver:telemetry:${driverId}`, telemetryPayload, 30);

    // 3. Update database driver record
    const driver = db.drivers.get(driverId);
    if (driver) {
      driver.current_latitude = latitude;
      driver.current_longitude = longitude;
      driver.current_heading = heading;
      driver.current_speed = speed;
      driver.last_heartbeat = new Date().toISOString();
      db.drivers.set(driverId, driver);
    }

    // 4. If driver is on an active trip, record location breadcrumb in trip_locations
    if (tripId) {
      // In production, buffer breadcrumbs in memory / Redis list and batch write
      // to avoid saturating disk I/O on every single GPS ping.
      db.query(
        'INSERT INTO trip_locations (trip_id, latitude, longitude, speed, heading) VALUES ($1, $2, $3, $4, $5)',
        [tripId, latitude, longitude, speed, heading]
      ).catch(() => {
        // Resilient async error capture
      });
    }
  }

  /**
   * Finds all available, verified online drivers within a given radius (km).
   */
  public async findNearbyDrivers(
    center: GeoLocation,
    radiusKm: number = 6.0,
    category?: VehicleCategory
  ): Promise<{ driverId: string; location: GeoLocation; distanceKm: number; driver: DriverRecord }[]> {
    // 1. Query Redis geospatial index for candidates within radius
    const nearbyMembers = await redisService.geoRadius(
      this.SPATIAL_KEY,
      center.latitude,
      center.longitude,
      radiusKm
    );

    const results: { driverId: string; location: GeoLocation; distanceKm: number; driver: DriverRecord }[] = [];

    for (const item of nearbyMembers) {
      const driver = db.drivers.get(item.member);
      if (!driver) continue;

      // Filter for online, verified, and available drivers
      if (!driver.is_verified || driver.status !== 'ONLINE') continue;

      // Filter by vehicle category if requested
      if (category) {
        const vehicle = Array.from(db.vehicles.values()).find((v) => v.driver_id === driver.id);
        if (!vehicle || vehicle.category !== category) continue;
      }

      results.push({
        driverId: driver.id,
        location: {
          latitude: driver.current_latitude,
          longitude: driver.current_longitude,
          heading: driver.current_heading,
          speed: driver.current_speed,
        },
        distanceKm: item.distanceKm,
        driver,
      });
    }

    // Fallback: If Redis spatial index was empty, query DB drivers directly
    if (results.length === 0) {
      for (const driver of db.drivers.values()) {
        if (!driver.is_verified || driver.status !== 'ONLINE') continue;

        if (category) {
          const vehicle = Array.from(db.vehicles.values()).find((v) => v.driver_id === driver.id);
          if (!vehicle || vehicle.category !== category) continue;
        }

        const dist = calculateHaversineDistance(
          center.latitude,
          center.longitude,
          driver.current_latitude,
          driver.current_longitude
        );

        if (dist <= radiusKm) {
          results.push({
            driverId: driver.id,
            location: {
              latitude: driver.current_latitude,
              longitude: driver.current_longitude,
              heading: driver.current_heading,
              speed: driver.current_speed,
            },
            distanceKm: parseFloat(dist.toFixed(2)),
            driver,
          });
        }
      }
    }

    return results.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Retrieves current active locations of all online drivers for admin operations telemetry map.
   */
  public getAllActiveLocations(): { driver: DriverRecord; vehicle?: any; location: GeoLocation }[] {
    const list: { driver: DriverRecord; vehicle?: any; location: GeoLocation }[] = [];

    for (const driver of db.drivers.values()) {
      const vehicle = Array.from(db.vehicles.values()).find((v) => v.driver_id === driver.id);
      list.push({
        driver,
        vehicle,
        location: {
          latitude: driver.current_latitude,
          longitude: driver.current_longitude,
          heading: driver.current_heading,
          speed: driver.current_speed,
        },
      });
    }

    return list;
  }
}

export const locationService = new LocationService();
