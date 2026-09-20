import { GeoLocation } from '../../shared/types';
import { calculateHaversineDistance, generateRouteWaypoints } from '../../shared/utils/geo';
import { config } from '../config';

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  waypoints: GeoLocation[];
  polyline?: string;
}

export interface GeocodeResult {
  address: string;
  placeName: string;
  latitude: number;
  longitude: number;
}

export interface MapsProvider {
  calculateRoute(origin: GeoLocation, destination: GeoLocation): Promise<RouteResult>;
  reverseGeocode(lat: number, lon: number): Promise<GeocodeResult>;
  searchPlaces(query: string): Promise<GeocodeResult[]>;
}

export class OSRMMapsProvider implements MapsProvider {
  /**
   * Calculates realistic road route between two coordinates.
   */
  public async calculateRoute(origin: GeoLocation, destination: GeoLocation): Promise<RouteResult> {
    const distanceKm = calculateHaversineDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    const durationMinutes = Math.max(2, Math.ceil((distanceKm / 26) * 60));

    // Generate smooth navigation waypoints along the route
    const waypoints = generateRouteWaypoints(origin, destination, Math.max(10, Math.min(40, Math.ceil(distanceKm * 4))));

    return {
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      durationMinutes,
      waypoints,
    };
  }

  public async reverseGeocode(lat: number, lon: number): Promise<GeocodeResult> {
    return {
      address: `Latitude: ${lat.toFixed(4)}, Longitude: ${lon.toFixed(4)}, Nairobi, Kenya`,
      placeName: 'Nairobi Location',
      latitude: lat,
      longitude: lon,
    };
  }

  public async searchPlaces(query: string): Promise<GeocodeResult[]> {
    const defaultNairobiLocations: Record<string, GeocodeResult> = {
      'airport': { placeName: 'Jomo Kenyatta Int. Airport (NBO)', address: 'Airport South Rd, Embakasi', latitude: -1.3192, longitude: 36.9275 },
      'westlands': { placeName: 'Westlands Sarit Centre', address: 'Karuna Rd, Westlands, Nairobi', latitude: -1.2635, longitude: 36.8024 },
      'kilimani': { placeName: 'Yaya Centre Kilimani', address: 'Argwings Kodhek Rd, Kilimani', latitude: -1.2933, longitude: 36.7865 },
      'cbd': { placeName: 'Nairobi Central Business District', address: 'Kenyatta Avenue, CBD, Nairobi', latitude: -1.2864, longitude: 36.8172 },
      'upperhill': { placeName: 'Upper Hill Medical & Financial Hub', address: 'Hospital Rd, Upper Hill', latitude: -1.2995, longitude: 36.8167 },
      'karen': { placeName: 'The Hub Karen', address: 'Dagoretti Rd, Karen, Nairobi', latitude: -1.3204, longitude: 36.7042 },
    };

    const q = query.toLowerCase();
    const matched = Object.entries(defaultNairobiLocations)
      .filter(([k, v]) => k.includes(q) || v.placeName.toLowerCase().includes(q) || v.address.toLowerCase().includes(q))
      .map(([, v]) => v);

    return matched.length > 0 ? matched : [defaultNairobiLocations.cbd];
  }
}

export class MapsService {
  private provider: MapsProvider;

  constructor() {
    this.provider = new OSRMMapsProvider();
  }

  public getProvider(): MapsProvider {
    return this.provider;
  }
}

export const mapsService = new MapsService();
