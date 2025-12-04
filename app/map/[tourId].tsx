import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { Tour } from '../../src/types';

export default function PublicMapScreen() {
  const { tourId } = useLocalSearchParams();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tourId) {
      fetchTour(tourId as string);
    }
  }, [tourId]);

  async function fetchTour(id: string) {
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTour(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!tour) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Tour no encontrado.</Text>
      </View>
    );
  }

  // Mock route data if not present
  const routeCoordinates = tour.route_data?.coordinates || [
    { latitude: 37.78825, longitude: -122.4324 },
    { latitude: 37.78925, longitude: -122.4344 },
    { latitude: 37.79025, longitude: -122.4364 },
  ];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: routeCoordinates[0].latitude,
          longitude: routeCoordinates[0].longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker coordinate={routeCoordinates[0]} title="Inicio" pinColor="#667eea" />
        <Marker coordinate={routeCoordinates[routeCoordinates.length - 1]} title="Fin" pinColor="#f093fb" />
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#667eea"
          strokeWidth={4}
        />
      </MapView>
      <View style={styles.infoBox}>
        <Text style={styles.tourTitle}>{tour.name}</Text>
        <Text style={styles.tourDescription}>{tour.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  infoBox: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  tourTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  tourDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
});
