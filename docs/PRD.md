# Product Requirements Document (PRD)
## Swift Boda (Sift Boda) - Enterprise Scale Ride-Hailing Platform

### 1. Vision & Executive Summary
Swift Boda is a production-grade, enterprise-scale ride-hailing and express urban logistics platform engineered for high-density metropolitan markets (e.g. Nairobi, Kampala, Dar es Salaam, Lagos). The platform connects riders, motorbikes (Boda Bodas), comfort cars, XL cargo bikes, and courier delivery merchants with sub-second matching, real-time spatial telemetry, dynamic surge pricing, and multi-channel instant payments (M-Pesa, Swift Wallet, Cards).

---

### 2. User Personas & Target Audiences
1. **Riders**: Commuters, urban workers, and shoppers seeking fast, affordable, safe transport with transparent pricing, live GPS tracking, and instant safety panic tools.
2. **Drivers / Boda Riders**: Independent vehicle operators looking for optimal trip dispatches, minimal idle time, high earnings, transparent commission splits, and instant daily wallet payouts.
3. **Dispatch & Operations Managers**: Fleet administrators and customer support agents who monitor fleet telemetry, verify driver documentation, override dispatch queues, manage dynamic surge multipliers, and resolve emergency SOS alerts.
4. **Merchants / Express Delivery Partners**: Businesses sending on-demand parcel deliveries with proof of delivery and real-time route verification.

---

### 3. Core Ride Categories & Service Tiers
| Category Code | Display Name | Target Vehicle | Base Fare | Per KM | Features |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `BODA_STANDARD` | Swift Boda Standard | 150cc Motorbike | $1.00 | $0.50 | 1 Passenger, Helmet Provided |
| `BODA_COMFORT` | Swift Boda Comfort | Executive Bike / Compact Car | $1.50 | $0.70 | Top Rated Drivers (4.85+), Premium Hairnet |
| `BODA_XL` | Swift Boda XL Cargo | Heavy Luggage Boda | $2.50 | $1.00 | Reinforced Rear Carrier (Up to 40kg) |
| `EXPRESS_DELIVERY` | Express Package | Delivery Bike with Box | $1.20 | $0.60 | Live OTP Pin Delivery & Signature |

---

### 4. Critical Safety Features & Protocols
- **4-Digit Ride PIN Verification**: Before starting any trip, the driver must enter the rider's unique 4-digit PIN in their application to prevent incorrect pick-ups.
- **Emergency SOS Panic Response**: Dual-mode SOS trigger for riders and drivers with instant SMS alert to emergency contacts, live GPS broadcast to the Ops Control Center, and optional audio recording.
- **Speed Violation & Route Anomaly Detection**: Background tracking flags sudden route deviations (>500m off-route) or speed breaches (>80 km/h for motorbikes).
