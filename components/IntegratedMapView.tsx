import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GeoLocation, Trip, VehicleCategory } from '../shared/types';

// Conditionally require react-native-maps only on native platforms
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let UrlTile: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
    UrlTile = Maps.UrlTile;
  } catch (e) {
    console.warn('react-native-maps could not be loaded, using fallback vector map.');
  }
}

// Authentic Uber Pitch-Black & Charcoal Map Style
const UBER_DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#090D16' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#748296' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#090D16' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1B2436' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#CBD5E1' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748B' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0B171A' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#10B981' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#141D2D' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#090D16' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8A99AD' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#1A263B' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#24324F' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#10B981' }, { weight: 0.5 }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#2B3B5C' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#617185' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#05070B' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3E506B' }] },
];

interface IntegratedMapViewProps {
  userLocation: GeoLocation;
  destinationLocation: GeoLocation | null;
  nearbyDrivers: { id: string; name: string; location: GeoLocation; category: VehicleCategory }[];
  simulatedDriverPos: GeoLocation | null;
  activeTrip: Trip | null;
  height?: number;
}

export const IntegratedMapView: React.FC<IntegratedMapViewProps> = ({
  userLocation,
  destinationLocation,
  nearbyDrivers,
  simulatedDriverPos,
  activeTrip,
  height,
}) => {
  const mapRef = useRef<any>(null);

  // Auto-fit camera when destination is chosen or updated
  useEffect(() => {
    if (mapRef.current && destinationLocation && userLocation) {
      try {
        mapRef.current.fitToCoordinates(
          [
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            { latitude: destinationLocation.latitude, longitude: destinationLocation.longitude },
            ...(simulatedDriverPos ? [{ latitude: simulatedDriverPos.latitude, longitude: simulatedDriverPos.longitude }] : []),
          ],
          {
            edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
            animated: true,
          }
        );
      } catch (e) {
        // Safe fallback
      }
    }
  }, [destinationLocation, simulatedDriverPos]);

  const handleRecenter = () => {
    if (mapRef.current && userLocation) {
      try {
        mapRef.current.animateToRegion(
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.035,
            longitudeDelta: 0.035,
          },
          800
        );
      } catch (e) {
        // Safe fallback
      }
    }
  };

  // Free Map Layer Selection: 'OSM_DARK' | 'OSM_STANDARD' | 'VECTOR_RADAR'
  const [mapLayer, setMapLayer] = React.useState<'OSM_DARK' | 'OSM_STANDARD' | 'VECTOR_RADAR'>('OSM_DARK');
  const [routeCoordinates, setRouteCoordinates] = React.useState<{ latitude: number; longitude: number }[]>([]);

  // Fetch real free driving route geometry via Open Source Routing Machine (OSRM)
  useEffect(() => {
    if (!destinationLocation || !userLocation) {
      setRouteCoordinates([]);
      return;
    }

    let isMounted = true;
    const fetchFreeRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.longitude},${userLocation.latitude};${destinationLocation.longitude},${destinationLocation.latitude}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('OSRM route failed');
        const data = await res.json();
        if (data.routes && data.routes[0]?.geometry?.coordinates?.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => ({
            latitude: c[1],
            longitude: c[0],
          }));
          if (isMounted) setRouteCoordinates(coords);
          return;
        }
      } catch (err) {
        // Fallback to direct path with midpoint curvature
        if (isMounted) {
          setRouteCoordinates([
            { latitude: userLocation.latitude, longitude: userLocation.longitude },
            {
              latitude: (userLocation.latitude + destinationLocation.latitude) / 2 + 0.002,
              longitude: (userLocation.longitude + destinationLocation.longitude) / 2 - 0.001,
            },
            { latitude: destinationLocation.latitude, longitude: destinationLocation.longitude },
          ]);
        }
      }
    };

    fetchFreeRoute();
    return () => {
      isMounted = false;
    };
  }, [destinationLocation?.latitude, destinationLocation?.longitude, userLocation?.latitude, userLocation?.longitude]);

  const isNativeMapAvailable = MapView !== null && Platform.OS !== 'web' && mapLayer !== 'VECTOR_RADAR';

  return (
    <View style={[styles.mapContainer, { height: height || Dimensions.get('window').height * 0.42 }]}>
      {isNativeMapAvailable ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.035,
            longitudeDelta: 0.035,
          }}
          customMapStyle={mapLayer === 'OSM_DARK' ? UBER_DARK_MAP_STYLE : []}
          showsUserLocation={false}
          showsCompass={false}
          showsTraffic={true}
          rotateEnabled={true}
          pitchEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          onError={(e: any) => {
            console.warn('Native MapView error, switching to Vector Radar:', e);
            setMapLayer('VECTOR_RADAR');
          }}
        >
          {/* Free Open-Source Map Tile Layer (CartoDB Dark or Standard OpenStreetMap) */}
          {UrlTile && mapLayer === 'OSM_DARK' && (
            <UrlTile
              urlTemplate="https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
              maximumZ={19}
              zIndex={-1}
            />
          )}
          {UrlTile && mapLayer === 'OSM_STANDARD' && (
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              zIndex={-1}
            />
          )}

          {/* 1. Rider User Marker */}
          <Marker
            coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            title="Your Pickup Point"
            description={userLocation.address || 'Pickup Point • West Pokot'}
          >
            <View style={styles.riderMarkerWrapper}>
              <View style={styles.riderMarkerPulse} />
              <View style={styles.riderMarkerCore} />
            </View>
          </Marker>

          {/* 2. Destination Marker */}
          {destinationLocation && (
            <Marker
              coordinate={{ latitude: destinationLocation.latitude, longitude: destinationLocation.longitude }}
              anchor={{ x: 0.5, y: 0.9 }}
              title={destinationLocation.placeName || 'Destination'}
              description={destinationLocation.address}
            >
              <View style={styles.destMarkerBadge}>
                <Ionicons name="flag" size={14} color="#FFF" />
              </View>
            </Marker>
          )}

          {/* 3. Nearby Idle Driver Markers */}
          {!simulatedDriverPos &&
            nearbyDrivers.map((drv) => (
              <Marker
                key={drv.id}
                coordinate={{ latitude: drv.location.latitude, longitude: drv.location.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
                rotation={drv.location.heading || 0}
                title={drv.name}
                description="Available Boda"
              >
                <View style={styles.idleDriverPin}>
                  <Ionicons name="bicycle" size={14} color="#FFF" />
                </View>
              </Marker>
            ))}

          {/* 4. Active En-Route Driver Marker */}
          {simulatedDriverPos && (
            <Marker
              coordinate={{ latitude: simulatedDriverPos.latitude, longitude: simulatedDriverPos.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              title="Driver En Route"
              description="Speed: 32 km/h"
            >
              <View style={styles.enRouteDriverBubble}>
                <Ionicons name="bicycle" size={16} color="#10B981" />
                <Text style={styles.enRouteSpeedText}>32 km/h</Text>
              </View>
            </Marker>
          )}

          {/* 5. Glowing Route Polyline (OSRM Free Real-World Navigation) */}
          {destinationLocation && Polyline && (
            <Polyline
              coordinates={
                routeCoordinates.length > 0
                  ? routeCoordinates
                  : [
                      { latitude: userLocation.latitude, longitude: userLocation.longitude },
                      {
                        latitude: (userLocation.latitude + destinationLocation.latitude) / 2 + 0.002,
                        longitude: (userLocation.longitude + destinationLocation.longitude) / 2 - 0.001,
                      },
                      { latitude: destinationLocation.latitude, longitude: destinationLocation.longitude },
                    ]
              }
              strokeColor="#10B981"
              strokeWidth={4.5}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </MapView>
      ) : (
        /* Smooth Vector Road Network Canvas Fallback (for Web / non-native preview) */
        <View style={styles.fallbackCanvas}>
          <View style={[styles.fallbackHighway, { top: '24%', left: 0, right: 0, transform: [{ rotate: '-8deg' }] }]} />
          <View style={[styles.fallbackHighway, { top: '64%', left: 0, right: 0, transform: [{ rotate: '12deg' }] }]} />
          <View style={[styles.fallbackHighway, { top: 0, bottom: 0, left: '30%', width: 5 }]} />
          <View style={[styles.fallbackHighway, { top: 0, bottom: 0, left: '68%', width: 4 }]} />

          <Text style={[styles.fallbackStreetLabel, { top: '21%', left: '12%' }]}>UHURU HIGHWAY</Text>
          <Text style={[styles.fallbackStreetLabel, { top: '46%', left: '36%' }]}>KENYATTA AVENUE</Text>
          <Text style={[styles.fallbackStreetLabel, { top: '67%', right: '10%' }]}>HAILE SELASSIE AVE</Text>

          {/* User Marker */}
          <View style={[styles.fallbackMarker, { left: '46%', top: '44%' }]}>
            <View style={styles.riderMarkerPulse} />
            <View style={styles.riderMarkerCore} />
            <View style={styles.calloutPill}>
              <Text style={styles.calloutText}>You are here</Text>
            </View>
          </View>

          {/* Destination Marker */}
          {destinationLocation && (
            <View style={[styles.fallbackMarker, { left: '72%', top: '28%' }]}>
              <View style={styles.destMarkerBadge}>
                <Ionicons name="flag" size={14} color="#FFF" />
              </View>
              <View style={styles.calloutPill}>
                <Text style={styles.calloutText}>{destinationLocation.placeName || 'Destination'}</Text>
              </View>
            </View>
          )}

          {/* En-Route Driver */}
          {simulatedDriverPos ? (
            <View
              style={[
                styles.fallbackMarker,
                {
                  left: `${Math.min(80, Math.max(15, 45 + (simulatedDriverPos.longitude - 36.8172) * 2200))}%`,
                  top: `${Math.min(75, Math.max(15, 40 + (simulatedDriverPos.latitude + 1.2863) * 2200))}%`,
                },
              ]}
            >
              <View style={styles.enRouteDriverBubble}>
                <Ionicons name="bicycle" size={15} color="#10B981" />
                <Text style={styles.enRouteSpeedText}>32 km/h</Text>
              </View>
            </View>
          ) : (
            nearbyDrivers.map((drv, idx) => (
              <View
                key={drv.id}
                style={[styles.fallbackMarker, { left: `${20 + idx * 18}%`, top: `${25 + (idx % 2) * 35}%` }]}
              >
                <View style={styles.idleDriverPin}>
                  <Ionicons name="bicycle" size={12} color="#FFF" />
                </View>
              </View>
            ))
          )}

          {destinationLocation && <View style={styles.fallbackRouteLine} />}
        </View>
      )}

      {/* Floating Uber Map HUD: Status Pill & Free Map Mode Controls */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
        <View style={styles.floatingEtaPill}>
          <Ionicons
            name={activeTrip?.status === 'SEARCHING_DRIVER' ? 'radio' : 'flash'}
            size={13}
            color="#10B981"
          />
          <Text style={styles.floatingEtaText}>
            {activeTrip?.status === 'SEARCHING_DRIVER'
              ? 'Scanning nearby bodas...'
              : activeTrip
              ? 'Live ride active'
              : '4 Bodas around you'}
          </Text>
        </View>

        {/* Free Map API Mode Indicator */}
        <View style={styles.floatingApiBadge}>
          <Text style={styles.floatingApiText}>
            {mapLayer === 'OSM_DARK'
              ? '🌙 CartoDB OSM'
              : mapLayer === 'OSM_STANDARD'
              ? '🗺️ OpenStreetMap'
              : '⚡ Vector Radar'}
          </Text>
        </View>

        <TouchableOpacity style={styles.recenterMapBtn} onPress={handleRecenter}>
          <Ionicons name="locate" size={18} color="#F8FAFC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mapToggleBtn}
          onPress={() => {
            setMapLayer((current) => {
              if (current === 'OSM_DARK') return 'OSM_STANDARD';
              if (current === 'OSM_STANDARD') return 'VECTOR_RADAR';
              return 'OSM_DARK';
            });
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={mapLayer === 'VECTOR_RADAR' ? 'cellular' : mapLayer === 'OSM_STANDARD' ? 'map' : 'layers'}
            size={18}
            color="#10B981"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    backgroundColor: '#070A0F',
    position: 'relative',
    overflow: 'hidden',
  },

  // Rider Marker
  riderMarkerWrapper: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  riderMarkerPulse: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  riderMarkerCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2.5,
    borderColor: '#FFF',
    elevation: 6,
  },

  // Destination Marker
  destMarkerBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 8,
  },

  // Idle Driver Marker
  idleDriverPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    elevation: 5,
  },

  // En Route Driver Bubble
  enRouteDriverBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0E141F',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#10B981',
    elevation: 8,
  },
  enRouteSpeedText: { color: '#10B981', fontSize: 10, fontWeight: '800' },

  // Floating HUD Elements
  floatingEtaPill: {
    position: 'absolute',
    top: 14,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0E141F',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    elevation: 10,
    zIndex: 10,
  },
  floatingEtaText: { color: '#F8FAFC', fontSize: 11, fontWeight: '700' },

  floatingApiBadge: {
    position: 'absolute',
    top: 14,
    left: 175,
    backgroundColor: 'rgba(14, 20, 31, 0.85)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
    zIndex: 10,
  },
  floatingApiText: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },

  recenterMapBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0E141F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    elevation: 10,
    zIndex: 10,
  },
  mapToggleBtn: {
    position: 'absolute',
    top: 58,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0E141F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    elevation: 10,
    zIndex: 10,
  },

  // Fallback Canvas (Web / Non-native)
  fallbackCanvas: { flex: 1, backgroundColor: '#0A0F1D', position: 'relative' },
  fallbackHighway: {
    position: 'absolute',
    height: 8,
    backgroundColor: '#161F33',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
  },
  fallbackStreetLabel: {
    position: 'absolute',
    color: '#334155',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
  },
  fallbackMarker: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  calloutPill: {
    position: 'absolute',
    top: 22,
    backgroundColor: '#0E141F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  calloutText: { color: '#F8FAFC', fontSize: 10, fontWeight: '700' },
  fallbackRouteLine: {
    position: 'absolute',
    top: '32%',
    left: '48%',
    width: '28%',
    height: 3,
    backgroundColor: '#10B981',
    transform: [{ rotate: '-25deg' }],
  },
});
