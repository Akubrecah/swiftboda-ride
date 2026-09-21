export interface SerplySearchOptions {
  query: string;
  num?: number;
  hl?: string;
  gl?: string;
}

export interface SerplyRawPlace {
  position?: number;
  name: string;
  data_id?: string | null;
  place_id?: string | null;
  google_maps_url?: string | null;
  website?: string | null;
  domain?: string | null;
  address?: string | null;
  address_lines?: string[];
  district?: string | null;
  latitude: number;
  longitude: number;
  rating?: number | null;
  review_count?: number | null;
  review_url?: string | null;
  categories?: string[];
  category_ids?: string[];
  phone?: string | null;
  phone_e164?: string | null;
  timezone?: string | null;
  thumbnail?: string | null;
  opening_hours?: Record<string, string> | null;
}

export interface SerplyMapsRawResponse {
  search_engine?: string;
  query?: string;
  places?: SerplyRawPlace[];
  result_count?: number;
  parsed_at?: string;
  metadata?: Record<string, unknown>;
  detail?: string;
}

export interface NormalizedPlace {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  rating: number | null;
  reviewCount: number | null;
  categories: string[];
  phone: string | null;
  phoneE164: string | null;
  website: string | null;
  googleMapsUrl: string | null;
  thumbnail: string | null;
  district: string | null;
  timezone: string | null;
  openingHours: Record<string, string> | null;
}

export interface NormalizedSearchResponse {
  query: string;
  resultCount: number;
  places: NormalizedPlace[];
  source: 'serply';
  cached: boolean;
}
