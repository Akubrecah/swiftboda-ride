import { GeoLocation } from '../types';

/**
 * Calculates Haversine distance in kilometers between two coordinates.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in KM
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Calculates bearing in degrees between two coordinates (0 - 360).
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

  let brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

/**
 * Estimates driving time in minutes based on distance and average speed (km/h).
 */
export function estimateDurationMinutes(
  distanceKm: number,
  averageSpeedKmH: number = 30
): number {
  if (distanceKm <= 0) return 1;
  const timeHours = distanceKm / averageSpeedKmH;
  const minutes = Math.ceil(timeHours * 60);
  return Math.max(1, minutes);
}

/**
 * Simple Geohash generator for fast spatial indexing simulation.
 */
export function encodeGeohash(lat: number, lon: number, precision: number = 7): string {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;
  let geohash = '';
  let bits = 0;
  let bit = 0;
  let even = true;

  while (geohash.length < precision) {
    if (even) {
      const lonMid = (lonMin + lonMax) / 2;
      if (lon >= lonMid) {
        bit = (bit << 1) | 1;
        lonMin = lonMid;
      } else {
        bit = (bit << 1) | 0;
        lonMax = lonMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        bit = (bit << 1) | 1;
        latMin = latMid;
      } else {
        bit = (bit << 1) | 0;
        latMax = latMid;
      }
    }
    even = !even;

    bits++;
    if (bits === 5) {
      geohash += BASE32[bit];
      bits = 0;
      bit = 0;
    }
  }

  return geohash;
}

/**
 * Dead reckoning / Interpolation between two points for smooth map vehicle movement simulation.
 */
export function interpolateCoordinate(
  start: GeoLocation,
  end: GeoLocation,
  fraction: number
): GeoLocation {
  const clampedFraction = Math.min(1, Math.max(0, fraction));
  const lat = start.latitude + (end.latitude - start.latitude) * clampedFraction;
  const lon = start.longitude + (end.longitude - start.longitude) * clampedFraction;
  const heading = calculateBearing(start.latitude, start.longitude, end.latitude, end.longitude);

  return {
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lon.toFixed(6)),
    heading: Math.round(heading),
    speed: 35, // km/h
    timestamp: Date.now(),
  };
}

/**
 * Generates intermediate route waypoints for realistic navigation pathing.
 */
export function generateRouteWaypoints(
  start: GeoLocation,
  end: GeoLocation,
  stepsCount: number = 20
): GeoLocation[] {
  const waypoints: GeoLocation[] = [];
  // Add slight curvature / jitter to simulate realistic road geometry
  const midLatJitter = (Math.random() - 0.5) * 0.004;
  const midLonJitter = (Math.random() - 0.5) * 0.004;

  for (let i = 0; i <= stepsCount; i++) {
    const t = i / stepsCount;
    // Quadratic Bezier interpolation for natural road curves
    const lat = (1 - t) * (1 - t) * start.latitude + 2 * (1 - t) * t * (start.latitude + midLatJitter) + t * t * end.latitude;
    const lon = (1 - t) * (1 - t) * start.longitude + 2 * (1 - t) * t * (start.longitude + midLonJitter) + t * t * end.longitude;

    const prevPoint = waypoints.length > 0 ? waypoints[waypoints.length - 1] : start;
    const heading = calculateBearing(prevPoint.latitude, prevPoint.longitude, lat, lon);

    waypoints.push({
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lon.toFixed(6)),
      heading: Math.round(heading),
      timestamp: Date.now() + i * 2000,
    });
  }

  return waypoints;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}
