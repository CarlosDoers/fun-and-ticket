import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView from '../../src/components/MapView';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { Tour } from '../../src/types';
import { colors } from '../../src/lib/theme';
import { Feather } from '@expo/vector-icons';

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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!tour) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Tour no encontrado.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="arrow-left" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Volver</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  const routeData = tour.route_data || { waypoints: [], pois: [] };
  const waypoints = routeData.waypoints || [];
  const pois = routeData.pois || [];



  // If no route data, show error
  if (waypoints.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="map" size={64} color="#ccc" style={{ marginBottom: 20 }} />
          <Text style={styles.errorText}>Este tour no tiene una ruta definida</Text>
          <Text style={styles.helpText}>
            El administrador necesita editar este tour desde el dashboard y añadir waypoints y puntos de interés en el mapa.
          </Text>
          <Text style={styles.debugInfo}>Tour ID: {tour.id}</Text>
          <Text style={styles.debugInfo}>Nombre: {tour.name}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="arrow-left" size={20} color="#fff" />
                <Text style={styles.backButtonText}>Escanear otro QR</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="home" size={20} color="#fff" />
                <Text style={styles.homeButtonText}>Volver al inicio</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
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
      <View style={styles.topButtonsContainer}>
        <TouchableOpacity 
          style={styles.circleButton} 
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.circleButton} 
          onPress={() => router.replace('/')}
        >
          <Feather name="home" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.tourTitle}>{tour.name}</Text>
        <Text style={styles.tourDescription}>{tour.description}</Text>
        {pois.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Feather name="map-pin" size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.poiCount}>{pois.length} puntos de interés</Text>
          </View>
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
    color: colors.primary,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 30,
    maxWidth: 400,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  debugInfo: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topButtonsContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonIcon: {
    fontSize: 24,
    color: colors.primary,
  },
});
