import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeoLocation, Trip, VehicleCategory, TripState } from '../../shared/types';

// Supported default gateway hosts for local LAN and physical devices
const DEFAULT_GATEWAY_HOSTS = [
  'http://192.168.8.5:4000',
  'http://localhost:4000',
  'http://10.0.2.2:4000',
];

export interface LiveOnlineDriver {
  id: string;
  driverId: string;
  name: string;
  phone: string;
  plate: string;
  model: string;
  color?: string;
  category: VehicleCategory;
  rating: number;
  status: string;
  location: {
    latitude: number;
    longitude: number;
    heading: number;
  };
  isLive?: boolean;
  lastPing?: number;
}

export interface AdminLiveState {
  onlineDriversCount: number;
  activeTripsCount: number;
  completedTripsCount: number;
  onlineDrivers: any[];
  activeTrips: Trip[];
  completedTrips: Trip[];
  timestamp: string;
}

type OfferListener = (trip: Trip) => void;
type StatusListener = (trip: Trip) => void;
type LocationListener = (driver: LiveOnlineDriver) => void;
type OfferTakenListener = (payload: { tripId: string; driverId: string }) => void;

class RealtimeSyncClient {
  private activeHttpHost: string = 'http://192.168.8.5:4000';
  private ws: WebSocket | null = null;
  private wsConnected: boolean = false;
  private isDetectingHost: boolean = false;
  private pingInterval: any = null;
  private reconnectTimer: any = null;
  private subscribedChannels: Set<string> = new Set(['global', 'driver:offers', 'admin:telemetry']);

  // Pub/Sub listeners
  private offerListeners: Set<OfferListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private locationListeners: Set<LocationListener> = new Set();
  private offerTakenListeners: Set<OfferTakenListener> = new Set();

  constructor() {
    this.init();
  }

  private async init() {
    await this.detectFastestHost();
    this.connectWebSocket();
  }

  public async detectFastestHost(): Promise<string> {
    if (this.isDetectingHost) return this.activeHttpHost;
    this.isDetectingHost = true;

    try {
      const savedHost = await AsyncStorage.getItem('@swiftboda_gateway_url');
      const candidateList = savedHost ? [savedHost, ...DEFAULT_GATEWAY_HOSTS] : DEFAULT_GATEWAY_HOSTS;

      for (const host of candidateList) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 1200);
          const res = await fetch(`${host}/health`, { signal: controller.signal });
          clearTimeout(timer);
          if (res.ok) {
            this.activeHttpHost = host;
            await AsyncStorage.setItem('@swiftboda_gateway_url', host);
            this.isDetectingHost = false;
            return host;
          }
        } catch {
          // Continue to next candidate host
        }
      }
    } catch {
      // Fallback to primary LAN IP
    }

    this.isDetectingHost = false;
    return this.activeHttpHost;
  }

  public getHttpHost(): string {
    return this.activeHttpHost;
  }

  public async setCustomGatewayHost(host: string) {
    this.activeHttpHost = host;
    await AsyncStorage.setItem('@swiftboda_gateway_url', host);
    this.connectWebSocket();
  }

  // ==================== WEBSOCKET CONNECTION & PROTOCOL ====================

  private connectWebSocket() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    const wsUrl = this.activeHttpHost.replace(/^http/, 'ws');
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.wsConnected = true;
        // Resubscribe to required channels
        for (const channel of this.subscribedChannels) {
          this.ws?.send(JSON.stringify({ action: 'subscribe', channel }));
        }

        // Setup 20-second heartbeat ping
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: 'ping' }));
          }
        }, 20000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch {}
      };

      this.ws.onerror = () => {
        this.wsConnected = false;
      };

      this.ws.onclose = () => {
        this.wsConnected = false;
        if (this.pingInterval) clearInterval(this.pingInterval);
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connectWebSocket();
        }, 3000);
      };
    } catch {
      this.wsConnected = false;
    }
  }

  private handleIncomingMessage(msg: any) {
    if (!msg) return;

    // 1. Incoming Ride Offer (dispatched to driver)
    if (msg.event === 'trip:incoming_offer' && msg.trip) {
      this.offerListeners.forEach((listener) => {
        try {
          listener(msg.trip);
        } catch {}
      });
      return;
    }

    // 2. Trip Status Change (e.g. DRIVER_ASSIGNED, DRIVER_ARRIVED, IN_TRIP, COMPLETED, CANCELLED)
    if (msg.event === 'trip:status_change' && msg.data) {
      this.statusListeners.forEach((listener) => {
        try {
          listener(msg.data);
        } catch {}
      });
      return;
    }

    // 3. Driver Live Location Movement
    if (msg.event === 'driver:location_update' && msg.data) {
      const driver: LiveOnlineDriver = {
        id: msg.data.driverId,
        driverId: msg.data.driverId,
        name: msg.data.name,
        phone: msg.data.phone,
        plate: msg.data.plate,
        model: msg.data.model,
        color: msg.data.color,
        category: msg.data.category,
        rating: msg.data.rating,
        status: msg.data.status,
        location: {
          latitude: msg.data.latitude,
          longitude: msg.data.longitude,
          heading: msg.data.heading,
        },
        isLive: true,
        lastPing: msg.data.lastPing,
      };
      this.locationListeners.forEach((listener) => {
        try {
          listener(driver);
        } catch {}
      });
      return;
    }

    // 4. Offer taken by another driver
    if (msg.event === 'trip:offer_taken') {
      this.offerTakenListeners.forEach((listener) => {
        try {
          listener({ tripId: msg.tripId, driverId: msg.driverId });
        } catch {}
      });
      return;
    }
  }

  public subscribeTrip(tripId: string) {
    const channel = `trip:${tripId}`;
    this.subscribedChannels.add(channel);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'subscribe', channel }));
    }
  }

  public unsubscribeTrip(tripId: string) {
    const channel = `trip:${tripId}`;
    this.subscribedChannels.delete(channel);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'unsubscribe', channel }));
    }
  }

  // ==================== LISTENER SUBSCRIPTIONS ====================

  public onIncomingOffer(listener: OfferListener): () => void {
    this.offerListeners.add(listener);
    return () => this.offerListeners.delete(listener);
  }

  public onTripStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  public onDriverLocationUpdate(listener: LocationListener): () => void {
    this.locationListeners.add(listener);
    return () => this.locationListeners.delete(listener);
  }

  public onOfferTaken(listener: OfferTakenListener): () => void {
    this.offerTakenListeners.add(listener);
    return () => this.offerTakenListeners.delete(listener);
  }

  // ==================== LIVE REST API ACTIONS ====================

  /**
   * Driver sends high-frequency location & status telemetry ping to Gateway.
   */
  public async sendDriverTelemetry(data: {
    driverId: string;
    name: string;
    phone: string;
    plate: string;
    model: string;
    color?: string;
    category: VehicleCategory;
    status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'EN_ROUTE_PICKUP' | 'ON_TRIP';
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    rating?: number;
    tripId?: string;
  }): Promise<boolean> {
    try {
      const res = await fetch(`${this.activeHttpHost}/api/v1/driver/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Rider searches for online drivers.
   */
  public async fetchOnlineDrivers(): Promise<LiveOnlineDriver[]> {
    try {
      const res = await fetch(`${this.activeHttpHost}/api/v1/drivers/online`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.drivers)) {
          return json.drivers;
        }
      }
    } catch {}
    return [];
  }

  /**
   * Rider requests a ride. Gateway creates trip and broadcasts offer to drivers.
   */
  public async requestRide(payload: {
    riderId: string;
    rider: { name: string; phone: string; rating?: number };
    recipientRider?: { name: string; phone: string; isOther: boolean };
    pickup: GeoLocation;
    destination: GeoLocation;
    category: VehicleCategory;
    fare: any;
    paymentMethod: string;
    ridePin: string;
  }): Promise<{ success: boolean; trip?: Trip; error?: string }> {
    try {
      const res = await fetch(`${this.activeHttpHost}/api/v1/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success && json.trip) {
        this.subscribeTrip(json.trip.id);
        return { success: true, trip: json.trip };
      }
      return { success: false, error: json.error || 'Failed to book trip' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error requesting trip' };
    }
  }

  /**
   * Driver checks for pending offers (HTTP fallback polling).
   */
  public async fetchDriverOffers(driverId: string): Promise<Trip[]> {
    try {
      const res = await fetch(`${this.activeHttpHost}/api/v1/driver/offers?driverId=${driverId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.offers)) {
          return json.offers;
        }
      }
    } catch {}
    return [];
  }

  /**
   * Driver accepts an incoming offer.
   */
  public async acceptRideOffer(
    tripId: string,
    driverId: string,
    driver: {
      name: string;
      phone: string;
      rating?: number;
      vehiclePlate: string;
      vehicleModel: string;
      vehicleColor?: string;
      vehicleCategory?: VehicleCategory;
    }
  ): Promise<{ success: boolean; trip?: Trip; error?: string }> {
    try {
      const res = await fetch(`${this.activeHttpHost}/api/v1/trips/${tripId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, driver }),
      });
      const json = await res.json();
      if (json.success && json.trip) {
        this.subscribeTrip(tripId);
        return { success: true, trip: json.trip };
      }
      return { success: false, error: json.error || 'Failed to accept trip' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error accepting trip' };
    }
  }

  /**
   * Driver declines an offer.
   */
  public async declineRideOffer(tripId: string, driverId: string): Promise<void> {
    try {
      await fetch(`${this.activeHttpHost}/api/v1/trips/${tripId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      });
    } catch {}
  }

  /**
   * Updates trip status (DRIVER_ARRIVED, IN_TRIP with PIN verification, COMPLETED, CANCELLED).
   */
  public async updateTripStatus(
    tripId: string,
    status: TripState,
    options?: {
      enteredPin?: string;
      actorId?: string;
      actorRole?: string;
      cancellationReason?: string;
    }
  ): Promise<{ success: boolean; trip?: Trip; error?: string }> {
    try {
      const res = await fetch(`${this.activeHttpHost}/api/v1/trips/${tripId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          enteredPin: options?.enteredPin,
          actorId: options?.actorId || 'system',
          actorRole: options?.actorRole || 'DRIVER',
          cancellationReason: options?.cancellationReason,
        }),
      });
      const json = await res.json();
      if (json.success && json.trip) {
        return { success: true, trip: json.trip };
      }
      return { success: false, error: json.error || 'Failed to update trip status' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating trip status' };
    }
  }

  /**
   * Fetches latest trip details.
   */
  public async fetchTrip(tripId: string): Promise<Trip | null> {
    try {
      const res = await fetch(`${this.activeHttpHost}/api/v1/trips/${tripId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.trip) {
          return json.trip;
        }
      }
    } catch {}
    return null;
  }

  /**
   * Fetches active trips.
   */
  public async fetchActiveTrips(): Promise<Trip[]> {
    try {
      const res = await fetch(`${this.activeHttpHost}/api/v1/trips/active`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.trips)) {
          return json.trips;
        }
      }
    } catch {}
    return [];
  }

  /**
   * Admin: Fetches live operations state (active trips, online fleet, metrics).
   */
  public async fetchAdminLiveState(): Promise<AdminLiveState | null> {
    try {
      const res = await fetch(`${this.activeHttpHost}/api/v1/admin/live-state`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          return json;
        }
      }
    } catch {}
    return null;
  }
}

export const syncClient = new RealtimeSyncClient();
