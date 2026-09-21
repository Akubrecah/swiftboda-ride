import { NormalizedPlace, SerplySearchOptions } from './maps-service/serply/types';
import { serplyMapsClient } from './maps-service/serply/client';

export interface SearchPlacesResult {
  places: NormalizedPlace[];
  cached?: boolean;
  source: string;
}

// Candidates for gateway host depending on runtime platform
const GATEWAY_HOSTS = [
  'http://localhost:4000',
  'http://10.0.2.2:4000',
  'http://192.168.8.5:4000',
];

export async function searchPlacesLive(
  query: string,
  options?: Partial<SerplySearchOptions>
): Promise<SearchPlacesResult> {
  const cleanQuery = query ? query.trim() : '';
  if (!cleanQuery) {
    return { places: [], source: 'empty' };
  }

  const num = options?.num || 20;
  const hl = options?.hl || 'en';
  const gl = options?.gl || 'ke';

  // 1. Try to fetch from Backend Gateway Proxy
  for (const host of GATEWAY_HOSTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const params = new URLSearchParams({
        q: cleanQuery,
        num: String(num),
        hl,
        gl,
      });

      const res = await fetch(`${host}/api/v1/maps/places/search?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.places)) {
          return {
            places: json.places,
            cached: json.cached,
            source: 'gateway-proxy',
          };
        }
      }
    } catch {
      // Try next host or fallback to direct client
    }
  }

  // 2. Direct client fallback (when running in unified environment or direct dev)
  try {
    const directResult = await serplyMapsClient.searchPlaces({
      query: cleanQuery,
      num,
      hl,
      gl,
    });
    return {
      places: directResult.places,
      cached: directResult.cached,
      source: 'serply-direct',
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[PlacesService] Failed to search places:', error.message);
    throw error;
  }
}
