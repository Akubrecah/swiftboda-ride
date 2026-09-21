import {
  SerplySearchOptions,
  SerplyMapsRawResponse,
  SerplyRawPlace,
  NormalizedPlace,
  NormalizedSearchResponse,
} from './types';

interface CacheEntry {
  data: NormalizedSearchResponse;
  expiresAt: number;
}

export const DEFAULT_SERPLY_API_KEY = 'TF5AxxbSLF1ezxP2tC4EyKBx';

export class SerplyMapsClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.serply.io/v1/maps/search';
  private readonly cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache as per Serply specification

  constructor(apiKey?: string) {
    this.apiKey =
      apiKey ||
      (typeof process !== 'undefined' && process.env && process.env.SERPLY_API_KEY ? process.env.SERPLY_API_KEY : '') ||
      DEFAULT_SERPLY_API_KEY;
  }

  /**
   * Cleans special Unicode characters (narrow no-break spaces \u202F, non-breaking spaces \u00A0,
   * en-dashes \u2013, em-dashes \u2014) from opening hours strings.
   */
  public normalizeOpeningHours(openingHours?: Record<string, string> | null): Record<string, string> | null {
    if (!openingHours || typeof openingHours !== 'object') {
      return null;
    }

    const normalized: Record<string, string> = {};
    for (const [day, hours] of Object.entries(openingHours)) {
      if (typeof hours === 'string') {
        normalized[day] = hours
          .replace(/[\u202F\u00A0]/g, ' ')
          .replace(/[\u2013\u2014]/g, ' - ')
          .trim();
      } else {
        normalized[day] = String(hours);
      }
    }
    return normalized;
  }

  /**
   * Normalizes a raw Serply place into a safe, strongly-typed Place entity.
   */
  public normalizePlace(raw: SerplyRawPlace, index: number): NormalizedPlace {
    const lat = typeof raw.latitude === 'number' ? raw.latitude : Number(raw.latitude) || 0;
    const lng = typeof raw.longitude === 'number' ? raw.longitude : Number(raw.longitude) || 0;

    const id =
      raw.place_id && raw.place_id.trim().length > 0
        ? raw.place_id
        : raw.data_id && raw.data_id.trim().length > 0
        ? raw.data_id
        : `serply-place-${lat.toFixed(6)}-${lng.toFixed(6)}-${index}`;

    return {
      id,
      name: raw.name || 'Unnamed Location',
      address: raw.address || (raw.address_lines && raw.address_lines.length > 0 ? raw.address_lines.join(', ') : null),
      latitude: lat,
      longitude: lng,
      rating: typeof raw.rating === 'number' ? raw.rating : null,
      reviewCount: typeof raw.review_count === 'number' ? raw.review_count : null,
      categories: Array.isArray(raw.categories) ? raw.categories : [],
      phone: raw.phone || null,
      phoneE164: raw.phone_e164 || null,
      website: raw.website || null,
      googleMapsUrl: raw.google_maps_url || null,
      thumbnail: raw.thumbnail || null,
      district: raw.district || null,
      timezone: raw.timezone || null,
      openingHours: this.normalizeOpeningHours(raw.opening_hours),
    };
  }

  /**
   * Search for real places using the Serply Google Maps API.
   */
  public async searchPlaces(options: SerplySearchOptions): Promise<NormalizedSearchResponse> {
    const rawQuery = options.query ? options.query.trim() : '';
    if (!rawQuery) {
      throw new Error('Search query must not be empty');
    }

    // Default num = 20, clamped between 1 and 200 per API specification
    const num = Math.min(Math.max(Number(options.num) || 20, 1), 200);
    const hl = options.hl || 'en';
    const gl = options.gl || 'ke'; // Default to Kenya for SwiftBoda

    const cacheKey = `${rawQuery.toLowerCase()}_${num}_${hl}_${gl}`;
    const now = Date.now();

    // Check application-level in-memory cache
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && cachedEntry.expiresAt > now) {
      console.log(`[Serply] Cache HIT for query: "${rawQuery}" (results: ${cachedEntry.data.places.length})`);
      return {
        ...cachedEntry.data,
        cached: true,
      };
    }

    if (!this.apiKey) {
      throw new Error('SERPLY_API_KEY is not configured on the server');
    }

    const encodedQuery = encodeURIComponent(rawQuery);
    const searchParams = new URLSearchParams({
      num: String(num),
      hl,
      gl,
    });

    const targetUrl = `${this.baseUrl}/${encodedQuery}?${searchParams.toString()}`;
    console.log(`[Serply] Request started: GET /v1/maps/search/${encodedQuery}?${searchParams.toString()}`);

    // Request with retry for 429 rate limiting with exponential backoff
    let attempt = 0;
    const maxAttempts = 3;
    let lastError: Error | null = null;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const response = await fetch(targetUrl, {
          method: 'GET',
          headers: {
            'X-Api-Key': this.apiKey,
            Accept: 'application/json',
          },
        });

        if (response.status === 429) {
          console.warn(`[Serply] Rate limited (HTTP 429) on attempt ${attempt}`);
          if (attempt < maxAttempts) {
            const backoffDelay = Math.pow(2, attempt) * 500;
            await new Promise((res) => setTimeout(res, backoffDelay));
            continue;
          }
          throw new Error('Rate limit exceeded from location service. Please try again in a few moments.');
        }

        if (response.status === 400) {
          const errBody = (await response.json().catch(() => ({}))) as SerplyMapsRawResponse;
          console.error('[Serply] Invalid request (HTTP 400):', errBody.detail || 'Malformed parameters');
          throw new Error(errBody.detail || 'Invalid search parameters.');
        }

        if (response.status === 502) {
          console.error('[Serply] Upstream failure (HTTP 502)');
          throw new Error('The location service is temporarily unavailable. Please try again.');
        }

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          console.error(`[Serply] Request failed with HTTP ${response.status}:`, errText);
          throw new Error(`Location service error (HTTP ${response.status})`);
        }

        const data = (await response.json()) as SerplyMapsRawResponse;
        const rawPlaces = Array.isArray(data.places) ? data.places : [];

        const normalizedPlaces = rawPlaces.map((p, idx) => this.normalizePlace(p, idx));

        const result: NormalizedSearchResponse = {
          query: rawQuery,
          resultCount: normalizedPlaces.length,
          places: normalizedPlaces,
          source: 'serply',
          cached: false,
        };

        // Cache the successful result for 10 minutes
        this.cache.set(cacheKey, {
          data: result,
          expiresAt: now + this.CACHE_TTL_MS,
        });

        console.log(`[Serply] Request completed: found ${normalizedPlaces.length} places for "${rawQuery}"`);
        return result;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (
          lastError.message.includes('Search query must not be empty') ||
          lastError.message.includes('Invalid search parameters') ||
          lastError.message.includes('SERPLY_API_KEY is not configured') ||
          lastError.message.includes('The location service is temporarily unavailable')
        ) {
          throw lastError;
        }
        if (attempt >= maxAttempts) {
          break;
        }
      }
    }

    throw lastError || new Error('Failed to retrieve places from Serply');
  }

  /**
   * Clear in-memory cache (primarily for tests)
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

export const serplyMapsClient = new SerplyMapsClient();
