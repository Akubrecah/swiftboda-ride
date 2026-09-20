import { VehicleCategory } from '../types';

export interface RegionalLandmark {
  name: string;
  lat: number;
  lon: number;
  address: string;
  icon: string;
  eta: string;
  dist: string;
}

export interface RegionDriverSeed {
  id: string;
  name: string;
  phone: string;
  plate: string;
  model: string;
  rating: number;
  location: {
    latitude: number;
    longitude: number;
    heading: number;
  };
  category: VehicleCategory;
}

export interface RegionConfig {
  id: string;
  name: string;
  county: string;
  country: string;
  status: 'ACTIVE_PILOT' | 'UPCOMING' | 'ACTIVE';
  center: {
    latitude: number;
    longitude: number;
  };
  defaultDelta: {
    latitudeDelta: number;
    longitudeDelta: number;
  };
  landmarks: RegionalLandmark[];
  driverSeeds: RegionDriverSeed[];
}

export const REGIONS: Record<string, RegionConfig> = {
  WEST_POKOT: {
    id: 'WEST_POKOT',
    name: 'West Pokot Pilot',
    county: 'West Pokot County',
    country: 'Kenya',
    status: 'ACTIVE_PILOT',
    center: {
      latitude: 1.2389,
      longitude: 35.1119,
    },
    defaultDelta: {
      latitudeDelta: 0.042,
      longitudeDelta: 0.042,
    },
    landmarks: [
      {
        name: 'Makutano Junction Stage',
        lat: 1.2389,
        lon: 35.1119,
        address: 'Makutano Town Centre, Kitale-Lodwar Rd',
        icon: 'bicycle',
        eta: '3 min',
        dist: '0.8 km',
      },
      {
        name: 'Kapenguria County Referral Hospital',
        lat: 1.2440,
        lon: 35.1180,
        address: 'Hospital Rd, Kapenguria',
        icon: 'medical',
        eta: '6 min',
        dist: '1.9 km',
      },
      {
        name: 'Chepareria Boda Stage',
        lat: 1.3060,
        lon: 35.2040,
        address: 'Chepareria Market Stage, West Pokot',
        icon: 'storefront',
        eta: '18 min',
        dist: '8.4 km',
      },
      {
        name: 'Tartar Mission & Center',
        lat: 1.2580,
        lon: 35.1050,
        address: 'Tartar Rd, Kapenguria Sub-County',
        icon: 'school',
        eta: '8 min',
        dist: '2.7 km',
      },
      {
        name: 'Ortum Market & Hospital',
        lat: 1.4310,
        lon: 35.3480,
        address: 'Ortum Town Centre, Sigor Highway',
        icon: 'cart',
        eta: '28 min',
        dist: '14.2 km',
      },
      {
        name: 'Kacheliba Town Centre',
        lat: 1.5120,
        lon: 35.0110,
        address: 'Kacheliba Boda Stage, North Pokot',
        icon: 'business',
        eta: '35 min',
        dist: '19.5 km',
      },
      {
        name: 'Nasokol Peace Grounds',
        lat: 1.2480,
        lon: 35.1130,
        address: 'Kapenguria Museum Rd',
        icon: 'shield-checkmark',
        eta: '5 min',
        dist: '1.4 km',
      },
      {
        name: 'Sigor Wei-Wei Stage',
        lat: 1.4810,
        lon: 35.4610,
        address: 'Sigor Irrigation Scheme Stage',
        icon: 'water',
        eta: '32 min',
        dist: '16.8 km',
      },
    ],
    driverSeeds: [
      {
        id: 'drv-wp-1',
        name: 'Kiprop Chemokil',
        phone: '+254712345678',
        plate: 'KMDK 234P',
        model: 'Bajaj Boxer 150X',
        rating: 4.95,
        location: { latitude: 1.2405, longitude: 35.1135, heading: 45 },
        category: 'BODA_STANDARD',
      },
      {
        id: 'drv-wp-2',
        name: 'Pkemoi Rotich',
        phone: '+254722334455',
        plate: 'KMDF 891B',
        model: 'TVS HLX 150',
        rating: 4.88,
        location: { latitude: 1.2365, longitude: 35.1095, heading: 120 },
        category: 'BODA_STANDARD',
      },
      {
        id: 'drv-wp-3',
        name: 'Chebet Lonyangapuo',
        phone: '+254733445566',
        plate: 'KMC 556A',
        model: 'Honda Ace 125',
        rating: 4.98,
        location: { latitude: 1.2420, longitude: 35.1105, heading: 210 },
        category: 'BODA_COMFORT',
      },
      {
        id: 'drv-wp-4',
        name: 'Lokira James',
        phone: '+254744556677',
        plate: 'KMDE 412X',
        model: 'Hero Hunter 150',
        rating: 4.92,
        location: { latitude: 1.2350, longitude: 35.1140, heading: 330 },
        category: 'EXPRESS_DELIVERY',
      },
    ],
  },
  // Upcoming expansion zones
  TRANS_NZOIA: {
    id: 'TRANS_NZOIA',
    name: 'Trans-Nzoia (Kitale)',
    county: 'Trans-Nzoia County',
    country: 'Kenya',
    status: 'UPCOMING',
    center: {
      latitude: 1.0167,
      longitude: 35.0067,
    },
    defaultDelta: {
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    },
    landmarks: [],
    driverSeeds: [],
  },
  TURKANA: {
    id: 'TURKANA',
    name: 'Turkana (Lodwar)',
    county: 'Turkana County',
    country: 'Kenya',
    status: 'UPCOMING',
    center: {
      latitude: 3.1199,
      longitude: 35.5972,
    },
    defaultDelta: {
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    },
    landmarks: [],
    driverSeeds: [],
  },
  NAIROBI: {
    id: 'NAIROBI',
    name: 'Nairobi Metro',
    county: 'Nairobi County',
    country: 'Kenya',
    status: 'UPCOMING',
    center: {
      latitude: -1.286389,
      longitude: 36.817223,
    },
    defaultDelta: {
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    },
    landmarks: [],
    driverSeeds: [],
  },
};

export const ACTIVE_REGION_ID = 'WEST_POKOT';

export function getActiveRegion(): RegionConfig {
  return REGIONS[ACTIVE_REGION_ID];
}

export const WEST_POKOT_STAGES = REGIONS.WEST_POKOT.landmarks;
