# Software Architecture Document
## Swift Boda - Enterprise Microservices & Real-Time Telemetry Platform

### 1. Architectural Style & Monorepo Topology
Swift Boda is built as an event-driven monorepo architecture designed to scale to millions of concurrent active trips and location pings per minute.

```
                                  ┌─────────────────────────────┐
                                  │      Client Applications    │
                                  │  (Rider, Driver, Admin)     │
                                  └──────────────┬──────────────┘
                                                 │
                                         HTTPS / WebSocket
                                                 │
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │    API Gateway & Socket.IO   │
                                  │       (Nginx + Gateway)     │
                                  └──────────────┬──────────────┘
                                                 │
         ┌───────────────────────┬───────────────┴───────────────┬───────────────────────┐
         │                       │                               │                       │
         ▼                       ▼                               ▼                       ▼
 ┌──────────────┐        ┌──────────────┐                ┌──────────────┐        ┌──────────────┐
 │ Auth & User  │        │ Location &   │                │ Matching &   │        │ Pricing &    │
 │ Service      │        │ Geofence     │                │ Trip Service │        │ Surge Engine │
 └──────┬───────┘        └──────┬───────┘                └──────┬───────┘        └──────┬───────┘
        │                       │                               │                       │
        └───────────────────────┴───────────────┬───────────────┴───────────────────────┘
                                                │
                                                ▼
                                  ┌─────────────────────────────┐
                                  │   Data Storage Layer        │
                                  │ PostgreSQL + PostGIS        │
                                  │ Redis Spatial Geohash       │
                                  └─────────────────────────────┘
```

---

### 2. Microservice Descriptions
1. **API Gateway (`/gateway`)**: Unified ingress point handling authentication token validation, SSL termination, rate limiting, and Socket.IO real-time event broadcasting (`driver:location_update`, `trip:status_change`).
2. **Location Service (`/services/location-service`)**: Ingests high-frequency GPS pings from drivers, computes spatial geohashes, stores real-time driver coordinates in Redis, and performs radius-based nearest driver queries.
3. **Matching Engine (`/services/matching-service`)**: Evaluates eligible online drivers within 8km, scoring candidates based on distance weight (60%) and driver rating (40%). Dispatches request to highest scoring driver with a 15-second response countdown.
4. **Pricing & Surge Engine (`/services/pricing-service`)**: Computes fare breakdowns using dynamic formula: `Base Fare + (Distance * perKm) + (Duration * perMin) + Booking Fee * Surge Multiplier - Promo Discount`.
5. **Trip Manager (`/services/trip-service`)**: Enforces state machine progression (`REQUESTED` → `SEARCHING_DRIVER` → `DRIVER_ASSIGNED` → `DRIVER_ARRIVED` → `IN_TRIP` → `COMPLETED` / `CANCELLED`).
6. **Payment & Wallet Service (`/services/payment-service`)**: Integrates with M-Pesa STK Push, credit cards, and internal wallet balance. Deducts 15% platform commission and credits driver earnings instantly upon trip completion.
7. **Safety & SOS Service (`/services/safety-service`)**: Audits ride PIN entries, logs speed anomalies, and broadcasts immediate panic alerts to the Operations Control Center.

---

### 3. Spatial Indexing & Dead Reckoning
- **Geohashing & H3 Indexing**: Driver locations are indexed using 7-character Geohashes for O(1) grid lookup.
- **Dead Reckoning & Bezier Interpolation**: Mobile applications render smooth vehicle movement on maps using quadratic Bezier curve interpolation between GPS coordinates, preventing erratic vehicle jumpiness.
