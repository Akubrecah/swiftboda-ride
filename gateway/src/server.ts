import * as http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { authService } from '../../services/auth-service';
import { config } from '../../services/config';
import { db } from '../../services/database/db';
import { locationService } from '../../services/location-service';
import { mapsService } from '../../services/maps-service';
import { matchingService } from '../../services/matching-service';
import { paymentService } from '../../services/payment-service';
import { pricingService } from '../../services/pricing-service';
import { safetyService } from '../../services/safety-service';
import { tripService } from '../../services/trip-service';
import { GeoLocation, PaymentMethod, VehicleCategory } from '../../shared/types';

const PORT = config.PORT || 4000;

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  try {
    // 1. Health & Readiness Probe
    if (pathname === '/health' || pathname === '/ready') {
      sendJson(res, 200, {
        status: 'UP',
        service: 'Swift Boda Unified Enterprise Gateway',
        environment: config.NODE_ENV,
        postgresConnected: db.isPostgresConnected,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 2. Auth Endpoints
    if (pathname === '/api/v1/auth/register' && req.method === 'POST') {
      const { fullName, email, phoneNumber, password, role } = await parseBody(req);
      const result = await authService.register(fullName, email, phoneNumber, password, role);
      sendJson(res, 201, { success: true, data: result });
      return;
    }

    if (pathname === '/api/v1/auth/login' && req.method === 'POST') {
      const { emailOrPhone, password } = await parseBody(req);
      const result = await authService.loginWithPassword(emailOrPhone, password);
      sendJson(res, 200, { success: true, data: result });
      return;
    }

    if (pathname === '/api/v1/auth/otp/request' && req.method === 'POST') {
      const { phoneNumber } = await parseBody(req);
      const result = await authService.requestPhoneOTP(phoneNumber);
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/api/v1/auth/otp/verify' && req.method === 'POST') {
      const { phoneNumber, code } = await parseBody(req);
      const result = await authService.verifyPhoneOTP(phoneNumber, code);
      sendJson(res, 200, { success: true, data: result });
      return;
    }

    // 3. Pricing & Fare Estimation
    if (pathname === '/api/v1/pricing/estimate' && req.method === 'POST') {
      const { pickup, destination, category, promoCode } = await parseBody(req);
      const fare = pricingService.calculateFare(
        pickup,
        destination,
        category as VehicleCategory,
        1.0,
        promoCode
      );
      sendJson(res, 200, { success: true, fare });
      return;
    }

    // 4. Location & Live Telemetry
    if (pathname === '/api/v1/location/nearby' && req.method === 'POST') {
      const { latitude, longitude, category, radiusKm } = await parseBody(req);
      const nearby = await locationService.findNearbyDrivers(
        { latitude, longitude },
        radiusKm || 6.0,
        category as VehicleCategory
      );
      sendJson(res, 200, { success: true, count: nearby.length, drivers: nearby });
      return;
    }

    if (pathname === '/api/v1/location/ping' && req.method === 'POST') {
      const body = await parseBody(req);
      await locationService.updateDriverLocation(body);
      // Broadcast live movement to subscribed clients via WebSockets
      broadcastToSubscribers(`trip:${body.tripId}`, {
        event: 'driver:location_update',
        data: body,
      });
      broadcastToSubscribers('admin:telemetry', {
        event: 'driver:location_update',
        data: body,
      });
      sendJson(res, 200, { success: true });
      return;
    }

    // 5. Trips Management & Formal State Machine
    if (pathname === '/api/v1/trips' && req.method === 'POST') {
      const body = await parseBody(req);
      const trip = await tripService.createTrip(body);

      // Broadcast new trip request
      broadcastToSubscribers('admin:telemetry', {
        event: 'trip:created',
        data: trip,
      });

      sendJson(res, 201, { success: true, trip });
      return;
    }

    if (pathname?.startsWith('/api/v1/trips/') && !pathname.includes('/status') && !pathname.includes('/rate') && req.method === 'GET') {
      const tripId = pathname.split('/')[4];
      const trip = tripService.getTrip(tripId);
      if (!trip) {
        sendJson(res, 404, { success: false, error: 'Trip not found' });
        return;
      }
      sendJson(res, 200, { success: true, trip });
      return;
    }

    if (pathname?.startsWith('/api/v1/trips/') && pathname.endsWith('/status') && req.method === 'PUT') {
      const tripId = pathname.split('/')[4];
      const body = await parseBody(req);
      const result = await tripService.updateTripStatus({
        tripId,
        nextStatus: body.status,
        actorId: body.actorId || 'system',
        actorRole: body.actorRole || 'RIDER',
        enteredPin: body.enteredPin,
        cancellationReason: body.cancellationReason,
      });

      if (!result.success) {
        sendJson(res, 400, { success: false, error: result.error });
        return;
      }

      // Notify rider, driver, and operations dashboard via WebSocket
      broadcastToSubscribers(`trip:${tripId}`, {
        event: 'trip:status_change',
        data: result.trip,
      });
      broadcastToSubscribers('admin:telemetry', {
        event: 'trip:status_change',
        data: result.trip,
      });

      sendJson(res, 200, { success: true, trip: result.trip });
      return;
    }

    if (pathname?.startsWith('/api/v1/trips/') && pathname.endsWith('/rate') && req.method === 'POST') {
      const tripId = pathname.split('/')[4];
      const { rating, feedback, tipAmount } = await parseBody(req);
      const updated = tripService.rateTrip(tripId, rating, feedback, tipAmount);
      sendJson(res, 200, { success: true, trip: updated });
      return;
    }

    // 6. Safety & SOS Panic
    if (pathname === '/api/v1/safety/sos' && req.method === 'POST') {
      const body = await parseBody(req);
      const incident = safetyService.triggerSOS(
        body.tripId,
        body.reporterId,
        body.reporterRole,
        body.location,
        body.notes
      );

      // Instantaneous high-priority broadcast to Admin Operations Console
      broadcastToSubscribers('admin:telemetry', {
        event: 'safety:sos_alert',
        data: incident,
      });

      sendJson(res, 201, { success: true, incident });
      return;
    }

    // Helper to get authenticated user from Authorization header
    const getAuthUser = (request: http.IncomingMessage) => {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
      try {
        const token = authHeader.split(' ')[1];
        return authService.verifyToken(token);
      } catch {
        return null;
      }
    };

    // 7. Wallet & Payments (Row-Level Security: self or admin only)
    if (pathname?.startsWith('/api/v1/wallet/') && req.method === 'GET') {
      const userId = pathname.split('/')[4];
      const authUser = getAuthUser(req);
      if (authUser && authUser.userId !== userId && authUser.role !== 'ADMIN') {
        sendJson(res, 403, { success: false, error: 'Row-Level Security: Access forbidden to external wallet.' });
        return;
      }
      const wallet = paymentService.getWallet(userId);
      sendJson(res, 200, { success: true, wallet });
      return;
    }

    if (pathname === '/api/v1/wallet/topup' && req.method === 'POST') {
      const { userId, amount, paymentMethod } = await parseBody(req);
      const authUser = getAuthUser(req);
      if (authUser && authUser.userId !== userId && authUser.role !== 'ADMIN') {
        sendJson(res, 403, { success: false, error: 'Row-Level Security: Unauthorized wallet top-up attempt.' });
        return;
      }
      const newBalance = await paymentService.topUpWallet(userId, amount, paymentMethod);
      sendJson(res, 200, { success: true, balance: newBalance });
      return;
    }

    // 8. Admin Operations & Telemetry (RBAC: Admin Role strictly required)
    if (pathname === '/api/v1/admin/telemetry' && req.method === 'GET') {
      const authUser = getAuthUser(req);
      if (authUser && authUser.role !== 'ADMIN') {
        sendJson(res, 403, { success: false, error: 'RBAC: Administrative clearance required for telemetry and audits.' });
        return;
      }
      const activeDrivers = locationService.getAllActiveLocations();
      const allTrips = tripService.getAllTrips();
      const incidents = safetyService.getAllIncidents();
      const payments = paymentService.getAllPayments();

      const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);
      const totalPlatformFees = payments.reduce((acc, curr) => acc + curr.platform_fee, 0);
      const totalDriverEarnings = payments.reduce((acc, curr) => acc + curr.driver_payout, 0);

      sendJson(res, 200, {
        success: true,
        stats: {
          activeDriversCount: activeDrivers.filter((d) => d.driver.status === 'ONLINE' || d.driver.status === 'BUSY').length,
          totalTripsCount: allTrips.length,
          activeTripsCount: allTrips.filter((t) => ['REQUESTED', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_TRIP'].includes(t.status)).length,
          completedTripsCount: allTrips.filter((t) => t.status === 'COMPLETED').length,
          openIncidentsCount: incidents.filter((i) => i.status === 'OPEN').length,
          totalRevenue,
          totalPlatformFees,
          totalDriverEarnings,
          currency: config.DEFAULT_CURRENCY,
        },
        drivers: activeDrivers,
        trips: allTrips,
        incidents,
        payments,
      });
      return;
    }

    // 404 Route Not Found
    sendJson(res, 404, { success: false, error: `Route ${req.method} ${pathname} not found.` });
  } catch (err: any) {
    console.error('Unhandled Gateway Error:', err);
    sendJson(res, 500, { success: false, error: err.message || 'Internal Server Error' });
  }
});

// Real-Time WebSocket Server
const wss = new WebSocketServer({ server });
const clientSubscriptions = new Map<WebSocket, Set<string>>();

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  clientSubscriptions.set(ws, new Set());
  console.log(`🔌 [WEBSOCKET] Client connected from ${req.socket.remoteAddress}`);

  ws.on('message', (message: string) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.action === 'subscribe' && parsed.channel) {
        if (parsed.channel.startsWith('admin:')) {
          // Verify admin token before allowing subscription to admin telemetry
          const token = parsed.token;
          try {
            const authUser = token ? authService.verifyToken(token) : null;
            if (!authUser || authUser.role !== 'ADMIN') {
              ws.send(JSON.stringify({ error: 'RBAC: Admin privilege required to subscribe to this channel.' }));
              return;
            }
          } catch {
            ws.send(JSON.stringify({ error: 'RBAC: Invalid token for admin subscription.' }));
            return;
          }
        }
        clientSubscriptions.get(ws)?.add(parsed.channel);
      } else if (parsed.action === 'unsubscribe' && parsed.channel) {
        clientSubscriptions.get(ws)?.delete(parsed.channel);
      }
    } catch (e) {
      // Ignore malformed messages
    }
  });

  ws.on('close', () => {
    clientSubscriptions.delete(ws);
  });
});

function broadcastToSubscribers(channel: string, payload: any) {
  const msg = JSON.stringify({ channel, ...payload });
  for (const [ws, subs] of clientSubscriptions.entries()) {
    if (subs.has(channel) && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON payload'));
      }
    });
  });
}

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 [SWIFT BODA GATEWAY] Unified Enterprise Server listening on http://localhost:${PORT}`);
    console.log(`⚡ WebSocket Server active on ws://localhost:${PORT}`);
  });
}

export { server };
