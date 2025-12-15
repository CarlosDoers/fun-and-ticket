import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNMapView, { Marker, Polyline, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { RouteData, POI } from '../types';
import { colors } from '../lib/theme';
import { PlayCircleIcon, PauseCircleIcon } from 'lucide-react-native';
import { Icon } from '@gluestack-ui/themed'; // Just for the Icon wrapper if needed, or stick to native

// Full-screen Modal for POI Details with working carousel
function POIDetailModal({ poi, visible, onClose }: { poi: POI | null; visible: boolean; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const player = useAudioPlayer(poi?.audio_url ? { uri: poi.audio_url } : null);
  const status = useAudioPlayerStatus(player);

  // Reset state when POI changes or closes
  useEffect(() => {
    if (!visible) {
      player.pause();
      player.seekTo(0);
    }
    setCurrentIndex(0);
  }, [visible, poi]);

  // Update player source when poi changes
  useEffect(() => {
    if (poi?.audio_url) {
      player.replace({ uri: poi.audio_url });
    }
  }, [poi]);

  function togglePlayback() {
    if (!poi?.audio_url) return;

    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  }

  if (!poi) return null;

  const images = poi.images || [];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Image Carousel */}
            {images.length > 0 && (
              <View style={styles.imageCarouselContainer}>
                <Image 
                  source={{ uri: images[currentIndex] }}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
                
                {images.length > 1 && (
                  <>
                    <TouchableOpacity
                      style={[styles.carouselButton, styles.carouselButtonLeft]}
                      onPress={handlePrevious}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.carouselButtonText}>‹</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.carouselButton, styles.carouselButtonRight]}
                      onPress={handleNext}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.carouselButtonText}>›</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.imageCounter}>
                      <Text style={styles.imageCounterText}>
                        {currentIndex + 1} / {images.length}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* POI Info */}
            <View style={styles.poiInfo}>
              <Text style={styles.poiTitle}>{poi.title || 'Punto de Interés'}</Text>
              
              {/* Audio Player */}
              {poi.audio_url && (
                <View style={styles.audioContainer}>
                  <TouchableOpacity 
                    style={styles.playButton} 
                    onPress={togglePlayback}
                    disabled={!status.isLoaded && !status.isBuffering}
                  >
                    {status.isBuffering ? (
                      <ActivityIndicator color="white" />
                    ) : (
                       status.playing ? 
                       <PauseCircleIcon size={32} color="white" /> : 
                       <PlayCircleIcon size={32} color="white" />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.audioText}>
                    {status.playing ? 'Reproduciendo audio...' : 'Escuchar audio guía'}
                  </Text>
                </View>
              )}

              <Text style={styles.poiDescription}>{poi.description || 'Sin descripción'}</Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

interface MapViewProps {
  routeData?: RouteData;
  style?: any;
}


// Helper for distance calculation (Haversine formula)
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);  // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d * 1000; // Distance in meters
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export default function MapView({ routeData, style }: MapViewProps) {
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  // Keep track of visited POIs to avoid auto-opening them multiple times in a row
  const [visitedPoiIds, setVisitedPoiIds] = useState<Set<number | string>>(new Set());

  const waypoints = routeData?.waypoints || [];
  const pois = routeData?.pois || [];

  // Request location permissions and start tracking
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    async function startLocationTracking() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permiso de ubicación denegado');
          return;
        }

        // Get initial location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // Start watching location
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (location) => {
             const newLoc = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setUserLocation(newLoc);
          }
        );
      } catch (error) {
        console.error('Location error:', error);
        setLocationError('Error al obtener ubicación');
      }
    }

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Monitor proximity to POIs
  useEffect(() => {
    if (!userLocation || !pois) return;

    pois.forEach(poi => {
      // Assuming POI has an id. If not, we might need a fallback, but RouteData POIs should have ids typically.
      // If poi.id is missing in type, we might need to update type or use index (less reliable).
      // Based on previous files, RouteData is loosely typed but Supabase returns ids.
      // Let's assume poi.id exists or use coordinates as key if needed (but ID is better).
      const poiId = poi.id || `${poi.latitude}-${poi.longitude}`; 

      if (visitedPoiIds.has(poiId)) return;

      const dist = getDistanceFromLatLonInMeters(
        userLocation.latitude,
        userLocation.longitude,
        poi.latitude,
        poi.longitude
      );

      // Threshold: 5 meters
      if (dist < 5) {
        // Auto-open
        setSelectedPoi(poi);
        setModalVisible(true);
        setVisitedPoiIds(prev => {
          const newSet = new Set(prev);
          newSet.add(poiId);
          return newSet;
        });
      }
    });

  }, [userLocation, pois, visitedPoiIds]);

  const handleMarkerPress = (poi: POI) => {
    setSelectedPoi(poi);
    setModalVisible(true);
  };

  // Calculate region
  const allCoords = [...waypoints, ...pois];
  let region;

  if (allCoords.length > 0) {
    const latitudes = allCoords.map(c => c.latitude);
    const longitudes = allCoords.map(c => c.longitude);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) * 1.5;
    const lngDelta = (maxLng - minLng) * 1.5;

    region = {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  } else {
    region = {
      latitude: 40.416775,
      longitude: -3.703790,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  return (
    <>
      <RNMapView
        style={[styles.map, style]}
        provider={Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        <Polyline
          coordinates={waypoints.map(w => ({ latitude: w.latitude, longitude: w.longitude }))}
          strokeColor={colors.routeColor}
          strokeWidth={4}
        />

        {pois.map((poi, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
            pinColor="#f093fb"
            onPress={() => handleMarkerPress(poi)}
          />
        ))}

        {/* Debug Circle to visualize activation range during dev (optional) */}
        {/* {pois.map((poi, i) => (
           <Circle
             key={`circle-${i}`}
             center={{ latitude: poi.latitude, longitude: poi.longitude }}
             radius={20}
             strokeColor="rgba(0,122,255,0.5)"
             fillColor="rgba(0,122,255,0.2)"
           />
        ))} */}
      </RNMapView>

      <POIDetailModal
        poi={selectedPoi}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedPoi(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  imageCarouselContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#eee',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselButtonLeft: {
    left: 10,
  },
  carouselButtonRight: {
    right: 10,
  },
  carouselButtonText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  imageCounterText: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
    overflow: 'hidden',
  },
  poiInfo: {
    paddingTop: 10,
    paddingBottom: 40,
  },
  poiTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  poiDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  // Audio Player Styles
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary, // Orange
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  playButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});
