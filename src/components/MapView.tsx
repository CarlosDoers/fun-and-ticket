import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import RNMapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { RouteData } from '../types';

interface MapViewProps {
  routeData?: RouteData;
  style?: any;
}

export default function MapView({ routeData, style }: MapViewProps) {
  const waypoints = routeData?.waypoints || [];
  const pois = routeData?.pois || [];

  console.log('MapView rendering with:', { 
    waypointsCount: waypoints.length, 
    poisCount: pois.length,
    firstWaypoint: waypoints[0]
  });

  if (waypoints.length === 0) {
    return (
      <View style={[styles.map, style, styles.errorContainer]}>
        <Text>No route data available</Text>
      </View>
    );
  }

  // Calculate region to fit all points
  const allCoords = [...waypoints, ...pois];
  const latitudes = allCoords.map(c => c.latitude);
  const longitudes = allCoords.map(c => c.longitude);
  
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const latDelta = (maxLat - minLat) * 1.5; // Add padding
  const lngDelta = (maxLng - minLng) * 1.5;

  return (
    <RNMapView
      style={[styles.map, style]}
      provider={PROVIDER_GOOGLE}
      initialRegion={{
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.01),
      }}
    >
      {/* Route polyline */}
      <Polyline
        coordinates={waypoints.map(w => ({ latitude: w.latitude, longitude: w.longitude }))}
        strokeColor="#667eea"
        strokeWidth={4}
      />

      {/* POI markers */}
      {pois.map((poi, index) => (
        <Marker
          key={index}
          coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
          title={poi.title}
          description={poi.description}
          pinColor="#f093fb"
        />
      ))}
    </RNMapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
});
