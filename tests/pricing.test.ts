import { pricingService } from '../services/pricing-service/index';
import { GeoLocation } from '../shared/types';

async function runPricingTests() {
  console.log('🧪 [TEST SUITE] RUNNING PRODUCTION PRICING ENGINE TESTS (KENYA KES)...');

  const pickup: GeoLocation = { latitude: -1.286389, longitude: 36.817223 }; // Nairobi CBD
  const dest: GeoLocation = { latitude: -1.3192, longitude: 36.9275 };       // JKIA Airport

  // 1. Test Standard Boda fare calculation
  const fare = pricingService.calculateFare(pickup, dest, 'BODA_STANDARD', 1.0);
  console.assert(fare.totalFare > 100, 'Standard total fare should be above minimum fare (100 KES)');
  console.assert(fare.currency === 'KES', 'Currency should be KES');
  console.assert(fare.estimatedDistanceKm > 0, 'Distance should be greater than 0');
  console.log(`✅ Standard Fare Test: KES ${fare.totalFare} for ${fare.estimatedDistanceKm} km (~${fare.estimatedDurationMin} mins)`);

  // 2. Test Promotional Discount (SWIFT50)
  const promoFare = pricingService.calculateFare(pickup, dest, 'BODA_STANDARD', 1.0, 'SWIFT50');
  console.assert(promoFare.discountAmount === 50.0, 'Discount amount should be 50 KES');
  console.assert(promoFare.totalFare === Math.max(100, fare.totalFare - 50), 'Discounted fare should deduct 50 KES');
  console.log(`✅ Promo Discount Test: KES ${promoFare.totalFare} (Saved 50 KES via SWIFT50)`);

  // 3. Test Dynamic Surge Pricing (1.8x)
  const surgeFare = pricingService.calculateFare(pickup, dest, 'BODA_STANDARD', 1.8);
  console.assert(surgeFare.surgeMultiplier === 1.8, 'Surge multiplier should be 1.8');
  console.assert(surgeFare.totalFare > fare.totalFare, 'Surge fare should be greater than standard fare');
  console.log(`✅ Surge Pricing Test: KES ${surgeFare.totalFare} (1.8x Peak Hour Surge)`);

  // 4. Test Surge Multiplier Calculation (Supply vs Demand)
  const normalSurge = pricingService.computeSurgeMultiplier(5, 10);
  console.assert(normalSurge === 1.0, 'Balanced demand should produce 1.0x surge');

  const heavySurge = pricingService.computeSurgeMultiplier(40, 10);
  console.assert(heavySurge >= 2.2, '4:1 demand ratio should produce >= 2.2x surge');
  console.log(`✅ Surge Multiplier Logic: 5/10 -> ${normalSurge}x, 40/10 -> ${heavySurge}x`);
}

if (require.main === module) {
  runPricingTests();
}

export { runPricingTests };
