import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView from '../../src/components/MapView';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { Tour } from '../../src/types';
import { colors } from '../../src/lib/theme';
import { ArrowLeft, Home, MapPin } from 'lucide-react-native';

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
            <ArrowLeft size={20} color="#fff" />
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
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.circleButton} 
          onPress={() => router.replace('/')}
        >
          <Home size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.tourTitle}>{tour.name}</Text>
        <Text style={styles.tourDescription}>{tour.description}</Text>
        {pois.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <MapPin size={14} color={colors.primary} style={{ marginRight: 4 }} />
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
  toastContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  toast: {
    backgroundColor: 'rgba(50, 50, 50, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Restore styles for "Tour not found" state
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
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
