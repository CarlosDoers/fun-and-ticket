import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { RouteData } from '../types';

// Fix Leaflet marker icons using CDN URLs
let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  routeData?: RouteData;
  style?: StyleProp<ViewStyle>;
}

export default function MapView({ routeData, style }: MapViewProps) {
  const waypoints = routeData?.waypoints || [];
  const pois = routeData?.pois || [];

  const center = waypoints.length > 0 
    ? [waypoints[0].latitude, waypoints[0].longitude] 
    : [40.416775, -3.703790]; // Default to Madrid

  return (
    <View style={[styles.container, style]}>
      {/* @ts-ignore: Leaflet types mismatch */}
      <MapContainer center={center as L.LatLngExpression} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Polyline positions={waypoints.map(w => [w.latitude, w.longitude])} />

        {pois.map((poi, index) => (
          <Marker
            key={index}
            position={[poi.latitude, poi.longitude]}
          >
            <Popup>
              <strong>{poi.title}</strong><br />
              {poi.description}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
});
