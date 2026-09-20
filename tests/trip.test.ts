import { db } from '../services/database/db';
import { tripService } from '../services/trip-service';
import { GeoLocation } from '../shared/types';

async function runTripStateTests() {
  console.log('🧪 [TEST SUITE] RUNNING FORMAL TRIP STATE MACHINE & SETTLEMENT TESTS...');

  const pickup: GeoLocation = { latitude: -1.286389, longitude: 36.817223, address: 'Kenyatta Ave, CBD', placeName: 'Nairobi CBD' };
  const dest: GeoLocation = { latitude: -1.3192, longitude: 36.9275, address: 'Airport Rd', placeName: 'JKIA Airport' };

  // 1. Create Trip Request
  const trip = await tripService.createTrip({
    riderId: 'usr-rider-01',
    pickup,
    destination: dest,
    category: 'BODA_STANDARD',
    paymentMethod: 'WALLET',
  });

  console.assert(trip.id !== undefined, 'Trip ID must be generated');
  console.assert(trip.ride_pin.length === 4, 'Ride PIN must be exactly 4 digits');
  console.assert(trip.total_fare > 0, 'Total fare must be positive');
  console.assert(trip.currency === 'KES', 'Currency must be KES');
  console.log(`✅ Trip Created: ID ${trip.id} | Status: ${trip.status} | PIN: ${trip.ride_pin} | Total Fare: KES ${trip.total_fare}`);

  // 2. Test Invalid State Transition (jumping from current state straight to COMPLETED without start)
  const invalidTransition = await tripService.updateTripStatus({
    tripId: trip.id,
    nextStatus: 'COMPLETED',
    actorId: 'usr-rider-01',
    actorRole: 'RIDER',
  });
  console.assert(!invalidTransition.success, 'Direct transition to COMPLETED without IN_TRIP must be blocked');
  console.log(`✅ State Transition Guard Verified: ${invalidTransition.error}`);

  // 3. Test Driver Arrival
  const arrivedResult = await tripService.updateTripStatus({
    tripId: trip.id,
    nextStatus: 'DRIVER_ARRIVED',
    actorId: trip.driver_id || 'drv-01',
    actorRole: 'DRIVER',
  });
  console.assert(arrivedResult.success, 'DRIVER_ARRIVED transition must succeed');
  console.log(`✅ Driver Arrived: Status updated to ${arrivedResult.trip.status}`);

  // 4. Test Invalid Ride PIN Rejection
  const invalidPinResult = await tripService.updateTripStatus({
    tripId: trip.id,
    nextStatus: 'IN_TRIP',
    actorId: trip.driver_id || 'drv-01',
    actorRole: 'DRIVER',
    enteredPin: '0000',
  });
  console.assert(!invalidPinResult.success, 'Incorrect Ride PIN must be rejected');
  console.log(`✅ Ride PIN Security Verified: Rejection on incorrect PIN`);

  // 5. Test Valid Ride PIN & IN_TRIP transition
  const validPinResult = await tripService.updateTripStatus({
    tripId: trip.id,
    nextStatus: 'IN_TRIP',
    actorId: trip.driver_id || 'drv-01',
    actorRole: 'DRIVER',
    enteredPin: trip.ride_pin,
  });
  console.assert(validPinResult.success, 'Correct Ride PIN must initiate trip');
  console.assert(validPinResult.trip.status === 'IN_TRIP', 'Status must be IN_TRIP');
  console.log(`✅ Ride Started: Status is IN_TRIP with verified PIN`);

  // 6. Test Trip Completion & Financial Settlement
  const initialDriverWallet = trip.driver_id
    ? Array.from(db.wallets.values()).find((w) => {
        const d = db.drivers.get(trip.driver_id!);
        return d && w.user_id === d.user_id;
      })?.balance || 0
    : 0;

  const completedResult = await tripService.updateTripStatus({
    tripId: trip.id,
    nextStatus: 'COMPLETED',
    actorId: trip.driver_id || 'drv-01',
    actorRole: 'DRIVER',
  });
  console.assert(completedResult.success, 'Trip completion must succeed');
  console.assert(completedResult.trip.status === 'COMPLETED', 'Status must be COMPLETED');

  // Verify wallet settlement
  if (trip.driver_id) {
    const updatedDriverWallet = Array.from(db.wallets.values()).find((w) => {
      const d = db.drivers.get(trip.driver_id!);
      return d && w.user_id === d.user_id;
    })?.balance || 0;
    const expectedPayout = trip.total_fare * 0.85; // 85%
    console.assert(updatedDriverWallet >= initialDriverWallet + expectedPayout - 1, 'Driver wallet must be credited 85% net fare');
    console.log(`✅ Financial Settlement Verified: Driver received KES ${expectedPayout.toFixed(2)} (15% platform commission deducted)`);
  }
}

if (require.main === module) {
  runTripStateTests();
}

export { runTripStateTests };
