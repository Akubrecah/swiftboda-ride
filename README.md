# Swift-Boda ⚡🏍️

> **Production-Grade Real-Time Motorcycle (Boda Boda) Ride-Hailing & Operations Dispatch Platform**  
> Tailored for hyper-local mobility, fast matching, sub-second telemetry, safety PIN verification, and M-Pesa payments across Kenya.

---

## 📑 Table of Contents
1. [🌟 Executive Overview](#-executive-overview)
2. [🏗️ System Architecture & State Machine](#️-system-architecture--state-machine)
3. [📋 Prerequisites & Tooling Requirements](#-prerequisites--tooling-requirements)
4. [⚡ Step-by-Step Installation & Setup](#-step-by-step-installation--setup)
5. [🔐 Comprehensive Environment Configuration (`.env`)](#-comprehensive-environment-configuration-env)
6. [🖥️ Starting the Backend Gateway & Services](#️-starting-the-backend-gateway--services)
7. [📱 Compiling & Deploying the Android Mobile App](#-compiling--deploying-the-android-mobile-app)
8. [👥 Two-Device Multi-Phone Live Testing Protocol](#-two-device-multi-phone-live-testing-protocol)
9. [📡 REST API & WebSocket Protocol Reference](#-rest-api--websocket-protocol-reference)
10. [🛡️ Security, Privacy & npm Dependency Audit Protocol](#️-security-privacy--npm-dependency-audit-protocol)
11. [📂 Repository Directory Structure](#-repository-directory-structure)
12. [🧪 Automated Testing & Verification Commands](#-automated-testing--verification-commands)
13. [🚀 Production Deployment & Scaling Strategy](#-production-deployment--scaling-strategy)
14. [📄 License, Author & Maintenance](#-license-author--maintenance)

---

## 🌟 Executive Overview

**Swift-Boda** is a mission-critical, full-stack mobility ecosystem engineered specifically for the two-wheeler transport economy in East Africa. Built with **React Native / Expo SDK 54**, strict **TypeScript**, a resilient **Unified Node.js Gateway & WebSocket Server**, and integrated with **Live Serply Google Maps** and **Safaricom Daraja M-Pesa**.

### What Makes Swift-Boda Unique?
- 📱 **Unified Triple-Persona Mobile Client**: Seamless in-app switching between **Rider (Passenger)**, **Driver Partner**, and **Operations Admin Desk** without downloading separate apps.
- 🛰️ **Real-Time Cross-Device Synchronization**: Sub-second location broadcasting via WebSocket with automatic HTTP fallback and heartbeat recovery.
- 🔐 **4-Digit Safety PIN Handshake**: Cryptographic trip validation ensuring passengers only board authorized motorbikes.
- 🗺️ **Live Geospatial Navigation**: Real-time driver discovery, Leaflet / Native interactive maps, and landmark routing.
- 💰 **M-Pesa Financial Ledger**: Real-time fare calculation, STK Push integration, platform fee split (15% / 85%), and PDF receipt generation.
- 🔒 **Biometric & App-Lock Security**: Enforced PIN / FaceID / Fingerprint lock protecting driver earnings and rider wallets.

---

## 🏗️ System Architecture & State Machine

### 1. High-Level Multi-Tier Architecture

```mermaid
flowchart TD
    subgraph Clients["Mobile & Web Clients (Expo SDK 54 / React Native)"]
        Rider["📱 Rider Client\n(Grace Chemutai)"]
        Driver["🏍️ Driver Client\n(Kiprop Chemokil)"]
        Admin["💻 Ops Admin Desk\n(Sarah Kemunto)"]
    end

    subgraph Gateway["Unified Enterprise Gateway (:4000)"]
        WS["⚡ WebSocket Server\n(Pub/Sub Telemetry Engine)"]
        Router["🌐 REST API Engine\n(Express / HTTP)"]
        Auth["🔑 JWT & RBAC Engine\n(Roles: RIDER, DRIVER, ADMIN)"]
        Matching["🎯 Dispatch Engine & Trip State Machine"]
    end

    subgraph Integrations["External & Infrastructure Services"]
        Serply["🗺️ Serply Google Maps API\n(Live Places & Landmarks)"]
        Daraja["💳 Safaricom M-Pesa\n(STK Push & C2B Ledger)"]
        Postgres["🐘 PostgreSQL / Redis\n(Spatial Cache & History)"]
    end

    Rider <-->|WebSocket / REST| Gateway
    Driver <-->|Live Telemetry / Offers| Gateway
    Admin <-->|Live State Stream| Gateway

    Gateway <--> Serply
    Gateway <--> Daraja
    Gateway <--> Postgres
```

### 2. End-to-End Trip State Machine

```mermaid
stateDiagram-v2
    [*] --> SEARCHING_DRIVER: Rider Books Ride (POST /api/v1/trips)
    SEARCHING_DRIVER --> DRIVER_ASSIGNED: Driver Accepts Offer (POST /api/v1/trips/:id/accept)
    SEARCHING_DRIVER --> CANCELLED: Rider Cancels or Timeout
    DRIVER_ASSIGNED --> DRIVER_ARRIVED: Driver Arrives at Pickup (PUT /api/v1/trips/:id/status)
    DRIVER_ASSIGNED --> CANCELLED: Driver or Rider Cancels
    DRIVER_ARRIVED --> IN_TRIP: Driver Enters 4-Digit Ride PIN (Verified Server-Side)
    IN_TRIP --> COMPLETED: Driver Taps Complete (PUT /api/v1/trips/:id/status)
    COMPLETED --> [*]: M-Pesa Ledger Settled & PDF Receipt Generated
    CANCELLED --> [*]: Cancellation broadcasted
```

---

## 📋 Prerequisites & Tooling Requirements

Before running Swift-Boda, ensure your workstation has the following tools installed and accessible via your shell terminal:

| Tool | Recommended Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `v18.x` or `v20.x` (LTS) | JavaScript runtime for Gateway server and Expo bundler |
| **npm** | `v9.x` or `v10.x` | Package manager |
| **Java Development Kit (JDK)** | OpenJDK 17 | Required for Android native builds and Gradle |
| **Android Studio & SDK** | Android SDK 34 / 35 | Native Android toolchain, NDK 27+, CMake 3.22+ |
| **Android Debug Bridge (ADB)** | Latest Android SDK Platform-Tools | Deploying and debugging on physical devices |
| **Git** | `v2.40+` | Source control |

Verify your environment by running:
```bash
node -v
npm -v
java -version
adb version
```

---

## ⚡ Step-by-Step Installation & Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/Akubrecah/swiftboda-ride.git
cd swiftboda-ride
```

### Step 2: Install Node Dependencies
Install all project dependencies cleanly:
```bash
npm install
```
*(Note: Do not run `npm audit fix --force`. See the [Security & Audit Protocol](#️-security-privacy--npm-dependency-audit-protocol) section for details).*

### Step 3: Configure Environment Variables
Create your local `.env` configuration file from the provided template:
```bash
cp .env.example .env
```
Edit `.env` and verify the required configuration keys (explained in detail below).

---

## 🔐 Comprehensive Environment Configuration (`.env`)

The project uses a unified environment configuration across services, gateways, and the mobile client:

| Environment Variable | Description | Default / Example Value | Required? |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Application environment mode | `development` or `production` | **Yes** |
| `PORT` | Unified Gateway HTTP & WebSocket port | `4000` | **Yes** |
| `SERPLY_API_KEY` | Live Serply Google Maps API key for geocoding & places | `TF5AxxbSLF1ezxP2tC4EyKBx` | **Yes** |
| `JWT_SECRET` | Secret key for signing and validating JWT tokens | `swiftboda_enterprise_jwt_secret_2026` | **Yes** |
| `DATABASE_URL` | PostgreSQL connection string with PostGIS | `postgresql://swift_admin:secure_swift_password@localhost:5432/swiftboda_db` | Optional in dev |
| `REDIS_URL` | Redis spatial cache connection string | `redis://localhost:6379` | Optional in dev |
| `MPESA_CONSUMER_KEY` | Safaricom Daraja API Consumer Key | Sandbox / Production key | Optional in dev |
| `MPESA_CONSUMER_SECRET`| Safaricom Daraja API Consumer Secret | Sandbox / Production secret | Optional in dev |
| `MPESA_SHORTCODE` | Daraja Business Shortcode / Paybill | `174379` | Optional in dev |
| `MPESA_PASSKEY` | Lipa Na M-Pesa Online Passkey | Sandbox passkey | Optional in dev |

> 🔒 **Security Notice**: Never commit `.env` containing live secrets to Git. `.env` is included in `.gitignore` by default.

---

## 🖥️ Starting the Backend Gateway & Services

The Swift-Boda backend gateway runs an in-memory resilient engine (with automatic fallback if PostgreSQL or Redis are not running locally) so you can develop immediately.

### Step 1: Start the Gateway Server
```bash
npm run start:gateway
```

### Step 2: Verify Server Output
You should see:
```text
🚀 [SWIFT BODA GATEWAY] Unified Enterprise Server listening on http://localhost:4000
⚡ WebSocket Server active on ws://localhost:4000
ℹ️ Operating with Resilient Persistent Engine.
```

### Step 3: Test Gateway Health & Endpoints
Open a new terminal and run:
```bash
# 1. Health Probe
curl -s http://localhost:4000/api/v1/health

# Expected response:
# {"status":"UP","service":"Swift Boda Unified Enterprise Gateway","environment":"development", ...}

# 2. Query Online Fleet
curl -s http://localhost:4000/api/v1/drivers/online

# Expected response:
# {"success":true,"count":3,"drivers":[ ... ]}
```

---

## 📱 Compiling & Deploying the Android Mobile App

Swift-Boda is fully configured with Expo SDK 54 and native Android Gradle builds.

### Step 1: Connect Your Physical Android Phone
1. Enable **Developer Options** and **USB Debugging** on your phone:
   - Go to *Settings > About Phone > Tap 'Build Number' 7 times*.
   - Go to *Settings > Developer Options > Enable 'USB Debugging'*.
2. Connect your phone to your Mac via USB.
3. Verify connection:
   ```bash
   adb devices
   # Expected output:
   # List of devices attached
   # <DEVICE_ID>    device
   ```

### Step 2: Configure Reverse Port Forwarding
Because the mobile app connects to the Gateway on port `4000`, configure ADB port forwarding so the phone reaches your computer's services over USB:
```bash
adb reverse tcp:4000 tcp:4000
adb reverse tcp:8081 tcp:8081
```

### Step 3: Build & Install Native Debug APK
Run the Gradle assembly command directly:
```bash
cd android
./gradlew assembleDebug
cd ..
```
Install the compiled APK to your connected phone:
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 4: Launch the Application
Launch the app directly from your terminal:
```bash
adb shell am start -n com.swiftboda.app/.MainActivity
```

Alternatively, to run with hot-reloading Metro development server:
```bash
npx expo start
```

---

## 👥 Two-Device Multi-Phone Live Testing Protocol

To experience real-time matching between two physical devices (e.g. Device 1 = Driver, Device 2 = Rider):

### Pre-requisites:
- Ensure both devices are on the same Wi-Fi network as your Mac (`192.168.8.5`), or connected via USB with `adb reverse tcp:4000 tcp:4000`.

### Step 1: Set Up Device 1 as Driver
1. Open Swift Boda on Device 1.
2. Log in using the verified driver account:
   - **Phone**: `0712345678`
   - **OTP**: `123456`
   - *(Or tap Quick Login: "Kiprop Chemokil - Driver")*
3. If prompted for App Security, set PIN `1234` or use Fingerprint.
4. On the top right of the Driver dashboard, toggle the switch to **"Online"**.
5. Live telemetry begins streaming every 3 seconds to the Gateway.

### Step 2: Set Up Device 2 as Rider
1. Open Swift Boda on Device 2.
2. Log in using the verified passenger account:
   - **Phone**: `0712345001`
   - **OTP**: `123456`
   - *(Or tap Quick Login: "Grace Chemutai - Rider")*
3. Look at the interactive map: you will see Kiprop's Bajaj Boxer motorcycle marker live on the map.

### Step 3: Requesting & Accepting the Ride
1. On **Device 2 (Rider)**:
   - Enter destination: `Kapenguria District Hospital`.
   - Tap **"Request Boda"**.
   - Rider screen transitions to `SEARCHING_DRIVER` and displays a unique **4-digit Ride PIN** (e.g. `5432`).
2. On **Device 1 (Driver)**:
   - Within 1 second, an **Incoming Ride Offer Modal** rings with passenger name, pickup, destination, fare in KES, and a 15-second countdown.
   - Tap **"Accept Ride"**.
3. Observe Instant Live Sync:
   - **Rider's screen immediately updates** to show driver Kiprop Chemokil, vehicle plate `KMDK 234P`, model Bajaj Boxer 150X, driver phone, and live moving marker.

### Step 4: Arrived & 4-Digit Safety PIN Verification
1. On **Device 1 (Driver)**:
   - Tap **"Arrived at Pickup"**.
   - Rider's screen immediately notifies passenger: *"Your boda has arrived"*.
   - Driver screen prompts: *"Enter Passenger's 4-Digit PIN"*.
2. On **Device 1 (Driver)**:
   - Enter the PIN from the Rider's screen (e.g. `5432`).
   - The Gateway validates the PIN cryptographically.
   - Both devices simultaneously transition to **`IN_TRIP`**.

### Step 5: Completing the Trip & Admin Verification
1. On **Device 1 (Driver)**:
   - Tap **"Complete Trip"**.
   - Both devices transition to **`COMPLETED`**.
   - Rider can submit a 5-star rating, add a tip, and tap **"Share Official PDF Receipt"**.
2. On either device:
   - Switch to **Admin Mode** (Sarah Kemunto - Ops Central Desk).
   - Tap the **"Live Ops"** tab to see real-time active trips, driver telemetry, and ledger reconciliation in real time.

---

## 📡 REST API & WebSocket Protocol Reference

### 1. REST Endpoints

#### `POST /api/v1/driver/telemetry`
Ingests continuous GPS coordinates and status from online drivers.
```json
// Request Body
{
  "driverId": "drv-wp-1",
  "name": "Kiprop Chemokil",
  "phone": "+254712345678",
  "plate": "KMDK 234P",
  "model": "Bajaj Boxer 150X",
  "category": "BODA_STANDARD",
  "status": "AVAILABLE",
  "location": {
    "latitude": 1.2410,
    "longitude": 35.1140,
    "heading": 90
  }
}

// Response: 200 OK
{
  "success": true,
  "driver": { "isLive": true, "status": "AVAILABLE", ... }
}
```

#### `GET /api/v1/drivers/online`
Returns all online drivers currently broadcasting telemetry.
```bash
curl http://localhost:4000/api/v1/drivers/online?category=BODA_STANDARD
```

#### `POST /api/v1/trips`
Creates a trip request and broadcasts incoming offers across online drivers.
```json
// Request Body
{
  "riderId": "user-rider-grace",
  "rider": { "name": "Grace Chemutai", "phone": "+254712345001", "rating": 4.95 },
  "pickup": { "latitude": 1.2405, "longitude": 35.1135, "placeName": "Makutano Junction" },
  "destination": { "latitude": 1.2480, "longitude": 35.1180, "placeName": "Kapenguria District Hospital" },
  "category": "BODA_STANDARD",
  "fare": { "totalFare": 150, "currency": "KES" },
  "paymentMethod": "MPESA",
  "ridePin": "5432"
}
```

#### `POST /api/v1/trips/:tripId/accept`
Driver accepts an incoming trip offer.
```json
// Request Body
{
  "driverId": "drv-wp-1",
  "driver": {
    "name": "Kiprop Chemokil",
    "phone": "+254712345678",
    "plate": "KMDK 234P",
    "model": "Bajaj Boxer 150X",
    "category": "BODA_STANDARD"
  }
}
```

#### `PUT /api/v1/trips/:tripId/status`
Advances the trip state machine with PIN verification.
```json
// Request Body (Starting Trip)
{
  "status": "IN_TRIP",
  "enteredPin": "5432"
}
```

#### `GET /api/v1/admin/live-state`
Returns active trips, online fleet counts, and completed trips for the dispatch console.

---

### 2. WebSocket Events (`ws://localhost:4000`)

| Event Channel | Payload | Description |
| :--- | :--- | :--- |
| `trip:incoming_offer` | `{ tripId, trip }` | Broadcasted to eligible online drivers when a trip is booked |
| `trip:offer_taken` | `{ tripId, driverId }` | Closes the offer modal on other drivers' phones |
| `trip:status_change` | `{ tripId, status, trip }` | Streams real-time lifecycle transitions to rider and driver |
| `driver:location_update`| `{ driverId, location, status }` | Streams live driver coordinates to rider map and admin desk |

---

## 🛡️ Security, Privacy & npm Dependency Audit Protocol

### Understanding `npm audit` on Expo SDK 54
When running `npm audit`, npm flags 25 vulnerabilities in packages like `metro`, `image-size`, and `postcss`.
**CRITICAL RULE:** **DO NOT run `npm audit fix --force`.**

#### Why `--force` is Banned:
- The audit report warns: `Will install expo@57.0.24, which is a breaking change`.
- Expo SDK 54 locks dependencies to guarantee compatibility with React Native 0.81.5, Kotlin 2.1, and Android NDK 27. Running `--force` replaces core SDK packages with incompatible versions, breaking native Gradle builds.
- **None of these flagged packages run in production on the mobile device.** They are build-time tools executed solely on your Mac to bundle JavaScript.

#### Application Security Measures:
1. **Zero Secrets in Source**: API keys and secrets are loaded via environment variables and never checked into Git.
2. **Server-Side Authorization**: Pricing, trip state changes, and ride PIN validation are strictly executed on the server.
3. **App-Lock Biometrics**: Sensitive screens (Driver Wallet, Rider KYC) require local biometric or PIN re-authentication.

---

## 📂 Repository Directory Structure

```text
swiftboda/
├── android/                 # Native Android project configuration & Gradle scripts
├── app/                     # Expo Router file-based application screens
│   ├── (tabs)/              # Main application tabs (Home, Explore, Wallet, Profile)
│   ├── _layout.tsx          # Root tab navigation and modal shell
│   └── modal.tsx            # Fullscreen modal router
├── assets/                  # High-density icons, splash screens, and brand imagery
├── components/              # Reusable UI components (MapView, AuthModal, SecurityLock)
├── context/                 # Application state (SwiftBodaContext, ThemeContext)
├── gateway/                 # Enterprise Unified Gateway Server (server.ts)
├── packages/                # Monorepo packages & shared utilities
├── services/
│   ├── config/              # Centralized environment & credentials manager
│   ├── database/            # Resilient persistence engine & pilot seeds
│   ├── maps-service/        # Serply Google Maps engine & fallback resolvers
│   ├── realtime/            # Universal SyncClient (WebSocket + HTTP Polling)
│   ├── receiptPdfService.ts # Digital PDF receipt generator
│   └── trip-service/        # Trip lifecycle & state machine
├── shared/                  # Universal types, constants, geo math, and region seeds
├── styles/                  # Clean CSS-in-JS style system with theme support
├── tests/                   # Automated integration and unit test suites
├── TASKS.md                 # Project backlog & Vibe Coding execution tracker
└── README.md                # Project documentation
```

---

## 🧪 Automated Testing & Verification Commands

Execute the verification commands before submitting code:

```bash
# 1. Type Safety Check (Zero TypeScript errors)
npx tsc --noEmit

# 2. Code Linting Check
npm run lint

# 3. Dynamic Pricing Model Tests
npm run test:pricing

# 4. Serply Google Maps Integration Tests
npm run test:serply
```

---

## 🚀 Production Deployment & Scaling Strategy

1. **Mobile Application**:
   - Built with EAS Build (`eas build --platform android`).
   - Target: Google Play Console (Internal Track → Production Release).
2. **Backend Gateway**:
   - Containerized via Docker (`infra/Dockerfile`).
   - Deployed on AWS ECS / Render / Fly.io with managed PostgreSQL and Redis.
3. **Ops Web Console & Marketing Web**:
   - Next.js / Vite web application deployed to Vercel or Cloudflare Pages.

---

## 📄 License, Author & Maintenance

### License
This project is open-sourced under the **[MIT License](./LICENSE)** — authored and maintained by **[Akubrecah](https://github.com/Akubrecah)**.

### Author & Lead Maintainer
- **Architect & Developer**: [Akubrecah](https://github.com/Akubrecah)
- **GitHub Profile**: [@Akubrecah](https://github.com/Akubrecah)
- **Repository**: [swiftboda-ride](https://github.com/Akubrecah/swiftboda-ride)
- **Contact & Inquiries**: [poweldayck@gmail.com](mailto:poweldayck@gmail.com)

---

Developed with ❤️ by **[Akubrecah](https://github.com/Akubrecah)** for hyper-local transportation, driver empowerment, and digital mobility across Kenya.
