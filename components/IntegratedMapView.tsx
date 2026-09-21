import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GeoLocation, Trip, VehicleCategory } from '../shared/types';
import { useTheme } from '../context/ThemeContext';

// Conditionally require react-native-maps and react-native-webview
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let UrlTile: any = null;
let WebView: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    Marker = Maps.Marker || (Maps.default && Maps.default.Marker);
    Polyline = Maps.Polyline || (Maps.default && Maps.default.Polyline);
    UrlTile = Maps.UrlTile || (Maps.default && Maps.default.UrlTile);
  } catch (e) {
    console.warn('react-native-maps could not be loaded.');
  }

  try {
    const rnw = require('react-native-webview');
    WebView = rnw.WebView || rnw.default || rnw;
  } catch (e) {
    console.warn('react-native-webview could not be loaded.');
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
  const webViewRef = useRef<any>(null);

  const { theme } = useTheme();

  // Free Map Layer Selection: 'OSM_DARK' | 'OSM_STANDARD' | 'VECTOR_RADAR'
  const [mapLayer, setMapLayer] = React.useState<'OSM_DARK' | 'OSM_STANDARD' | 'VECTOR_RADAR'>(
    theme.isDark ? 'OSM_DARK' : 'OSM_STANDARD'
  );

  React.useEffect(() => {
    setMapLayer(theme.isDark ? 'OSM_DARK' : 'OSM_STANDARD');
  }, [theme.isDark]);

  const [currentRegion, setCurrentRegion] = React.useState({
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.035,
    longitudeDelta: 0.035,
  });

  const handleRecenter = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`if(window.handleAction){window.handleAction('recenter');} true;`);
    }
    if (mapRef.current && userLocation) {
      try {
        const targetRegion = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.035,
          longitudeDelta: 0.035,
        };
        setCurrentRegion(targetRegion);
        mapRef.current.animateToRegion(targetRegion, 800);
      } catch (e) {
        // Safe fallback
      }
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`if(window.handleAction){window.handleAction('${direction === 'in' ? 'zoomIn' : 'zoomOut'}');} true;`);
    }
    if (mapRef.current) {
      try {
        const factor = direction === 'in' ? 0.5 : 2;
        const newLatDelta = Math.max(0.002, Math.min(1.5, currentRegion.latitudeDelta * factor));
        const newLngDelta = Math.max(0.002, Math.min(1.5, currentRegion.longitudeDelta * factor));
        const nextRegion = {
          ...currentRegion,
          latitudeDelta: newLatDelta,
          longitudeDelta: newLngDelta,
        };
        setCurrentRegion(nextRegion);
        mapRef.current.animateToRegion(nextRegion, 300);
      } catch (e) {
        // Fallback
      }
    }
  };

  // Generate interactive, self-contained Leaflet OpenStreetMap HTML
  const leafletHtml = React.useMemo(() => {
    const isDark = mapLayer === 'OSM_DARK';
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const userLat = userLocation.latitude;
    const userLng = userLocation.longitude;
    const destLat = destinationLocation?.latitude;
    const destLng = destinationLocation?.longitude;
    const destName = destinationLocation?.placeName || 'Destination';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    html, body, #map { width: 100%; height: 100%; background: ${isDark ? '#090D16' : '#F1F5F9'}; overflow: hidden; }
    .leaflet-control-attribution, .leaflet-control-zoom { display: none !important; }
    .pulse-pin {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #10B981;
      border: 3px solid #FFFFFF;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
    }
    .dest-pin {
      background: #F59E0B;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      font-size: 15px;
    }
    .boda-pin {
      background: #1E293B;
      color: #10B981;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #10B981;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${userLat}, ${userLng}], 15);

    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      subdomains: ${isDark ? "'abcd'" : "'abc'"}
    }).addTo(map);

    // User Pickup Pin
    var userIcon = L.divIcon({
      className: 'custom-div-icon',
      html: '<div class="pulse-pin"></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    L.marker([${userLat}, ${userLng}], { icon: userIcon }).addTo(map).bindPopup("Your Pickup Point");

    // Destination Pin
    ${destLat && destLng ? `
      var destIcon = L.divIcon({
        className: 'custom-div-icon',
        html: '<div class="dest-pin">🏁</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      L.marker([${destLat}, ${destLng}], { icon: destIcon }).addTo(map).bindPopup("${destName}");
      
      // Polyline route
      L.polyline([[${userLat}, ${userLng}], [${destLat}, ${destLng}]], {
        color: '#10B981',
        weight: 4.5,
        opacity: 0.95
      }).addTo(map);

      map.fitBounds([[${userLat}, ${userLng}], [${destLat}, ${destLng}]], { padding: [50, 50] });
    ` : ''}

    // Nearby Boda Drivers
    var drivers = ${JSON.stringify(nearbyDrivers || [])};
    drivers.forEach(function(d) {
      if (d && d.location) {
        var bIcon = L.divIcon({
          className: 'custom-div-icon',
          html: '<div class="boda-pin">🛵</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        L.marker([d.location.latitude, d.location.longitude], { icon: bIcon }).addTo(map).bindPopup(d.name || "Available Boda");
      }
    });

    window.handleAction = function(action) {
      if (action === 'zoomIn') map.zoomIn();
      if (action === 'zoomOut') map.zoomOut();
      if (action === 'recenter') map.setView([${userLat}, ${userLng}], 15);
    };
  </script>
</body>
</html>
    `;
  }, [userLocation.latitude, userLocation.longitude, destinationLocation?.latitude, destinationLocation?.longitude, nearbyDrivers, mapLayer]);

  const showWebViewMap = WebView !== null && Platform.OS !== 'web' && mapLayer !== 'VECTOR_RADAR';

  return (
    <View style={[styles.mapContainer, { height: height || Dimensions.get('window').height * 0.42 }]}>
      {showWebViewMap ? (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: leafletHtml }}
          style={StyleSheet.absoluteFillObject}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={false}
          scrollEnabled={false}
          onError={() => setMapLayer('VECTOR_RADAR')}
        />
      ) : (
        /* Smooth Vector Road Network Canvas Fallback */
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
        <View style={[styles.floatingEtaPill, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Ionicons
            name={activeTrip?.status === 'SEARCHING_DRIVER' ? 'radio' : 'flash'}
            size={13}
            color={theme.primary}
          />
          <Text style={[styles.floatingEtaText, { color: theme.textPrimary }]}>
            {activeTrip?.status === 'SEARCHING_DRIVER'
              ? 'Scanning nearby bodas...'
              : activeTrip
              ? 'Live ride active'
              : '4 Bodas around you'}
          </Text>
        </View>

        {/* Free Map API Mode Indicator */}
        <View style={[styles.floatingApiBadge, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.floatingApiText, { color: theme.textSecondary }]}>
            {mapLayer === 'OSM_DARK'
              ? '🌙 CartoDB OSM'
              : mapLayer === 'OSM_STANDARD'
              ? '🗺️ OpenStreetMap'
              : '⚡ Vector Radar'}
          </Text>
        </View>

        <TouchableOpacity style={[styles.recenterMapBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]} onPress={handleRecenter}>
          <Ionicons name="locate" size={18} color={theme.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mapToggleBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
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
            color={theme.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.zoomInBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]} onPress={() => handleZoom('in')} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color={theme.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.zoomOutBtn, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]} onPress={() => handleZoom('out')} activeOpacity={0.8}>
          <Ionicons name="remove" size={18} color={theme.textPrimary} />
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
  zoomInBtn: {
    position: 'absolute',
    top: 102,
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
  zoomOutBtn: {
    position: 'absolute',
    top: 146,
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
