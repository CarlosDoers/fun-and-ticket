import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, Pressable, Dimensions, ScrollView } from 'react-native';
import RNMapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { RouteData } from '../types';

// Image Carousel Component for POI - Simplified for Callout compatibility
function POIImageCarousel({ images }: { images?: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <View style={styles.carouselContainer}>
      <Image 
        source={{ uri: images[currentIndex] }}
        style={styles.carouselImage}
        resizeMode="cover"
      />
      
      {images.length > 1 && (
        <>
          {/* Using Pressable with larger hitSlop for better touch detection in Callouts */}
          <Pressable
            onPress={handlePrevious}
            style={({ pressed }) => [
              styles.carouselButton, 
              styles.carouselButtonLeft,
              pressed && { opacity: 0.7 }
            ]}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={styles.carouselButtonText}>‹</Text>
          </Pressable>
          
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.carouselButton, 
              styles.carouselButtonRight,
              pressed && { opacity: 0.7 }
            ]}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={styles.carouselButtonText}>›</Text>
          </Pressable>
          
          {/* Image counter */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

interface MapViewProps {
  routeData?: RouteData;
  style?: any;
}

export default function MapView({ routeData, style }: MapViewProps) {
  const waypoints = routeData?.waypoints || routeData?.coordinates || [];
  const pois = routeData?.pois || [];



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
          pinColor="#f093fb"
        >
          <Callout tooltip>
            <View style={styles.calloutContainer}>
              {poi.images && poi.images.length > 0 && (
                <POIImageCarousel images={poi.images} />
              )}
              <Text style={styles.calloutTitle}>{poi.title}</Text>
              <Text style={styles.calloutDescription}>{poi.description}</Text>
            </View>
          </Callout>
        </Marker>
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
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    minWidth: 200,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  calloutDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  carouselContainer: {
    position: 'relative',
    marginBottom: 8,
    width: '100%',
    height: 120,
  },
  carouselImage: {
    width: '100%',
    height: 120,
    borderRadius: 6,
  },
  carouselButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -15 }],
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselButtonLeft: {
    left: 5,
  },
  carouselButtonRight: {
    right: 5,
  },
  carouselButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  carouselIndicators: {
    position: 'absolute',
    bottom: 5,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  carouselDotActive: {
    backgroundColor: 'white',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 5,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  imageCounterText: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 12,
    overflow: 'hidden',
  },
});
