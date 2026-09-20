import { matchingService } from '../services/matching-service';
import { redisService } from '../services/redis/redis';
import { GeoLocation } from '../shared/types';

async function runMatchingTests() {
  console.log('🧪 [TEST SUITE] RUNNING ATOMIC DRIVER MATCHING & DISPATCH LOCK TESTS...');

  const pickup: GeoLocation = { latitude: -1.286389, longitude: 36.817223 }; // Nairobi CBD

  // 1. Test Match and Lock Driver
  const matched = await matchingService.matchAndLockDriver(pickup, 'BODA_STANDARD');
  console.assert(matched !== null, 'Matching engine must return an eligible candidate');
  if (matched) {
    console.assert(matched.score > 0, 'Driver candidate score must be positive');
    console.assert(matched.distanceKm <= 8.0, 'Driver distance must be within 8km radius');
    console.assert(matched.vehiclePlate.length > 0, 'Candidate must have an approved vehicle plate');
    console.log(`✅ Matched Driver: ${matched.name} (${matched.vehiclePlate}) - Score: ${matched.score}, Distance: ${matched.distanceKm} km, ETA: ${matched.etaMinutes} min`);

    // 2. Test Distributed Lock Concurrency: Attempting to match again immediately should not double-assign the same driver
    const lockCheck = await redisService.acquireLock(`driver_dispatch:${matched.driverId}`, 10000);
    console.assert(!lockCheck, 'Driver must be locked against concurrent dispatch collision');
    console.log(`✅ Concurrency Lock Verified: Driver ${matched.driverId} cannot be double-booked by racing riders.`);

    // 3. Release lock
    await matchingService.releaseDriverDispatchLock(matched.driverId);
    const lockReleased = await redisService.acquireLock(`driver_dispatch:${matched.driverId}`, 5000);
    console.assert(lockReleased, 'Lock must be acquirable after explicit release');
    await matchingService.releaseDriverDispatchLock(matched.driverId);
    console.log(`✅ Lock Release Verified: Driver returned to available pool.`);
  }
}

if (require.main === module) {
  runMatchingTests();
}

export { runMatchingTests };
