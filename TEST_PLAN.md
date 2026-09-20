# Test Plan (TEST_PLAN.md)

> Master verification checklist for Swift-Boda ride-hailing platform.
> Derived from "Vibe Coding: A Complete Beginner-to-Production Guide" Step 14 & 38.

---

## 1. Authentication & Security
- [ ] User can register with phone number and OTP.
- [ ] User can log in with valid credentials and receive JWT access + refresh tokens.
- [ ] Invalid credentials return appropriate HTTP 401 error with clean UI message.
- [ ] Expired tokens are automatically refreshed without interrupting user flow.
- [ ] Unauthenticated requests to protected endpoints return HTTP 401.
- [ ] Riders cannot access driver-only endpoints; drivers cannot access admin endpoints (RBAC).

---

## 2. Ride Request & Matching Lifecycle
- [ ] Rider can select pickup and dropoff points; distance and fare are computed accurately.
- [ ] Available drivers within specified search radius (e.g. 3km) receive ride offers.
- [ ] First driver to accept claims the ride; atomic lock prevents double-assignment.
- [ ] If driver rejects or offer times out (15s), offer cascades to next nearest candidate.
- [ ] Rider sees assigned driver details: name, photo, vehicle plate, rating, and ETA.
- [ ] Driver cannot start trip without entering rider's unique 4-digit Ride PIN.
- [ ] Trip transitions strictly adhere to: `REQUESTED → OFFERED → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED`.
- [ ] Rider can cancel trip before driver arrival without penalty; late cancellation assesses fee.

---

## 3. Real-Time Telemetry & Geolocation
- [ ] Driver GPS coordinates update every 2-4 seconds via WebSocket.
- [ ] Rider map animates driver motorbike icon smoothly along the route.
- [ ] Driver stale timeout: driver set to inactive if no GPS ping received for 15 seconds.
- [ ] Route deviation >500m flags an alert to the Operations Control Center.
- [ ] Speed violation >80 km/h triggers warning in driver app and flags safety log.

---

## 4. Payments, Wallets & Financial Ledger
- [ ] M-Pesa STK Push prompts user phone with correct amount in KES.
- [ ] Valid M-Pesa callback credits user wallet balance immediately.
- [ ] Duplicate payment callbacks are rejected via idempotency key checks.
- [ ] Completed trip automatically deducts fare from rider wallet or processes selected payment method.
- [ ] Platform commission (15%) is credited to system revenue ledger; 85% is credited to driver earnings.
- [ ] Insufficient wallet funds prevent ride request unless cash/M-Pesa payment is selected.

---

## 5. Safety Protocols & Emergency SOS
- [ ] Tapping SOS panic button prompts instant confirmation with 3-second auto-trigger.
- [ ] SOS event dispatches SMS notification to rider's emergency contacts with live tracking URL.
- [ ] SOS event creates priority incident in Admin Dashboard with audible alarm and red badge.
- [ ] Incident cannot be marked resolved without mandatory dispatcher resolution notes.

---

## 6. Viewport & Platform Breakpoints
- [ ] **Mobile (375px)**: Tested on iOS (iPhone SE/13/15) and Android devices. No horizontal overflow, touch targets ≥ 44px, readable text.
- [ ] **Tablet (768px)**: Split-screen layouts for driver navigation and tablet riders.
- [ ] **Desktop (1440px)**: Admin Operations Dashboard displays multi-column telemetry tables, interactive maps, and side panels.

---

## 7. Edge Cases & Resilience
- [ ] App recovers gracefully when internet connection drops and reconnects (offline banners).
- [ ] Gateway restart retains active trips and driver states via PostgreSQL and Redis rehydration.
- [ ] Rapid button spamming on "Book Ride" or "Pay" triggers only one server mutation (idempotency).
- [ ] Empty state renders friendly illustration when rider has zero past trip history.
