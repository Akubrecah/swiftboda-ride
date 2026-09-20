import { FareBreakdown, GeoLocation, VehicleCategory } from '../../shared/types';
import { calculateHaversineDistance, estimateDurationMinutes } from '../../shared/utils/geo';
import { config } from '../config';

export interface CategoryPricingRule {
  category: VehicleCategory;
  name: string;
  baseFare: number;       // in KES
  perKmRate: number;      // in KES
  perMinuteRate: number;  // in KES
  bookingFee: number;     // in KES
  minimumFare: number;    // in KES
  description: string;
}

export const KENYA_CATEGORY_PRICING: Record<VehicleCategory, CategoryPricingRule> = {
  BODA_STANDARD: {
    category: 'BODA_STANDARD',
    name: 'Standard Boda',
    baseFare: 70.0,
    perKmRate: 35.0,
    perMinuteRate: 5.0,
    bookingFee: 20.0,
    minimumFare: 100.0,
    description: 'Fast, agile motorcycle ride through Nairobi traffic.',
  },
  BODA_COMFORT: {
    category: 'BODA_COMFORT',
    name: 'Comfort Boda',
    baseFare: 100.0,
    perKmRate: 45.0,
    perMinuteRate: 7.0,
    bookingFee: 30.0,
    minimumFare: 150.0,
    description: 'Top-rated drivers with premium helmets and ride raincoats.',
  },
  BODA_XL: {
    category: 'BODA_XL',
    name: 'Boda XL / Cargo',
    baseFare: 130.0,
    perKmRate: 55.0,
    perMinuteRate: 9.0,
    bookingFee: 40.0,
    minimumFare: 200.0,
    description: 'Heavy duty motorcycle equipped for extra luggage or 2 passengers.',
  },
  EXPRESS_DELIVERY: {
    category: 'EXPRESS_DELIVERY',
    name: 'Express Courier',
    baseFare: 80.0,
    perKmRate: 40.0,
    perMinuteRate: 6.0,
    bookingFee: 25.0,
    minimumFare: 120.0,
    description: 'Quick parcel, document, or food delivery with delivery PIN verification.',
  },
};

export class PricingService {
  /**
   * Calculates detailed fare breakdown based on road distance, estimated time, and category pricing rules.
   */
  public calculateFare(
    pickup: GeoLocation,
    destination: GeoLocation,
    category: VehicleCategory = 'BODA_STANDARD',
    surgeMultiplier: number = 1.0,
    promoCode?: string
  ): FareBreakdown {
    const rule = KENYA_CATEGORY_PRICING[category] || KENYA_CATEGORY_PRICING.BODA_STANDARD;

    const distanceKm = calculateHaversineDistance(
      pickup.latitude,
      pickup.longitude,
      destination.latitude,
      destination.longitude
    );

    // Estimate realistic Nairobi city travel duration (average 26 km/h)
    const durationMin = estimateDurationMinutes(distanceKm, 26);

    const rawDistanceFare = distanceKm * rule.perKmRate;
    const rawTimeFare = durationMin * rule.perMinuteRate;
    const subtotal = rule.baseFare + rawDistanceFare + rawTimeFare + rule.bookingFee;

    const effectiveSurge = Math.max(1.0, Math.min(3.5, surgeMultiplier));
    const surgedSubtotal = subtotal * effectiveSurge;
    const surgeAmount = surgedSubtotal - subtotal;

    // Apply promo discounts
    let discountAmount = 0;
    if (promoCode === 'SWIFT50') discountAmount = 50.0;
    else if (promoCode === 'WELCOME100') discountAmount = 100.0;

    const finalTotal = Math.max(rule.minimumFare, surgedSubtotal - discountAmount);

    return {
      baseFare: parseFloat(rule.baseFare.toFixed(2)),
      distanceFare: parseFloat(rawDistanceFare.toFixed(2)),
      timeFare: parseFloat(rawTimeFare.toFixed(2)),
      bookingFee: parseFloat(rule.bookingFee.toFixed(2)),
      surgeMultiplier: parseFloat(effectiveSurge.toFixed(2)),
      surgeAmount: parseFloat(surgeAmount.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      totalFare: parseFloat(finalTotal.toFixed(2)),
      currency: config.DEFAULT_CURRENCY,
      estimatedDistanceKm: parseFloat(distanceKm.toFixed(2)),
      estimatedDurationMin: durationMin,
    };
  }

  /**
   * Computes dynamic surge multiplier based on active demand vs online available supply in the zone.
   */
  public computeSurgeMultiplier(activeDemandRequests: number, onlineAvailableDrivers: number): number {
    if (onlineAvailableDrivers === 0) {
      return activeDemandRequests > 0 ? 2.5 : 1.0;
    }

    const demandSupplyRatio = activeDemandRequests / onlineAvailableDrivers;

    if (demandSupplyRatio >= 4.0) return 2.8;
    if (demandSupplyRatio >= 3.0) return 2.2;
    if (demandSupplyRatio >= 2.0) return 1.7;
    if (demandSupplyRatio >= 1.4) return 1.3;
    return 1.0;
  }
}

export const pricingService = new PricingService();
