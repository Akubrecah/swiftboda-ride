# OpenAPI & WebSocket Event Catalog
## Swift Boda - API Specification

### REST Endpoints Summary

#### 1. Estimate Fare
- **Endpoint**: `POST /api/v1/pricing/estimate`
- **Request Body**:
```json
{
  "pickup": { "latitude": -1.286389, "longitude": 36.817223 },
  "destination": { "latitude": -1.3192, "longitude": 36.9275 },
  "category": "BODA_STANDARD",
  "promoCode": "SWIFT50"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "fare": {
    "baseFare": 1.0,
    "distanceFare": 2.4,
    "timeFare": 0.5,
    "bookingFee": 0.3,
    "surgeMultiplier": 1.0,
    "discountAmount": 2.0,
    "totalFare": 2.2,
    "currency": "USD",
    "estimatedDistanceKm": 4.8,
    "estimatedDurationMin": 10
  }
}
```

#### 2. Request Ride
- **Endpoint**: `POST /api/v1/trips`
- **Response**: `201 Created` returns full `Trip` object with generated `ridePin` (e.g. `7842`).

#### 3. Update Trip Status (Driver)
- **Endpoint**: `PUT /api/v1/trips/:tripId/status`
- **Request Body**: `{ "status": "IN_TRIP", "enteredPin": "7842" }`

#### 4. Emergency SOS Trigger
- **Endpoint**: `POST /api/v1/safety/sos`
- **Request Body**: `{ "tripId": "trip-123", "reporterId": "rider-001", "reporterRole": "RIDER", "location": { "latitude": -1.28, "longitude": 36.81 } }`

---

### WebSocket Event Catalog (Socket.IO)
- `driver:location_update` (Driver -> Gateway): Ingests GPS pings `{ driverId, latitude, longitude, heading, speed }`.
- `trip:matched` (Gateway -> Rider & Driver): Emitted when candidate driver accepts request.
- `trip:status_change` (Gateway -> All): Real-time notification when state transitions occur (`DRIVER_ARRIVED`, `IN_TRIP`, `COMPLETED`).
- `sos:alert_broadcast` (Gateway -> Admin Dashboard): Immediate push notification to Ops Control Room.
