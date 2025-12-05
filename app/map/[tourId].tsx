import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView from '../../src/components/MapView';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { Tour } from '../../src/types';

export default function PublicMapScreen() {
  const { tourId } = useLocalSearchParams();
  const router = useRouter();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        console.error('Error fetching tour:', error);
      } finally {
        setLoading(false);
      }
    }

    if (tourId) {
      fetchTour(tourId as string);
    } else {
      setLoading(false);
    }
  }, [tourId]);

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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // const routeData = tour.route_data;
  const routeData = tour.route_data;
  const waypoints = routeData?.waypoints || [];
  const pois = routeData?.pois || [];

  // If no route data, show error
  if (waypoints.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Este tour no tiene una ruta definida.</Text>
        <Text style={styles.helpText}>Por favor, edita el tour en el dashboard y genera una ruta.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        routeData={routeData}
        style={styles.map}
      />
      
      {/* Back button overlay */}
      <TouchableOpacity 
        style={styles.backButtonOverlay} 
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonOverlayText}>← Volver</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.tourTitle}>{tour.name}</Text>
        <Text style={styles.tourDescription}>{tour.description}</Text>
        {pois.length > 0 && (
          <Text style={styles.poiCount}>📍 {pois.length} puntos de interés</Text>
        )}
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
  poiCount: {
    fontSize: 14,
    color: '#667eea',
    marginTop: 8,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  backButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  backButtonOverlayText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
