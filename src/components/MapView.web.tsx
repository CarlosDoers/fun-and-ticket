import React, { useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Text, TouchableOpacity } from 'react-native';
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

// Simple Image Carousel for POI Popup
function ImageCarousel({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div style={{ position: 'relative', marginBottom: 8 }}>
      <img 
        src={images[currentIndex]} 
        alt="POI"
        style={{ 
          width: '100%', 
          height: 120, 
          objectFit: 'cover',
          borderRadius: 4,
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x120?text=Error';
        }}
      />
      
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            style={{
              position: 'absolute',
              left: 5,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              width: 28,
              height: 28,
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ‹
          </button>
          
          <button
            onClick={goToNext}
            style={{
              position: 'absolute',
              right: 5,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              width: 28,
              height: 28,
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ›
          </button>
          
          <div style={{ 
            position: 'absolute', 
            bottom: 5, 
            left: 0, 
            right: 0, 
            display: 'flex',
            flexDirection: 'row', 
            justifyContent: 'center',
            gap: 4,
          }}>
            {images.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.5)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface MapViewProps {
  routeData?: RouteData;
  style?: StyleProp<ViewStyle>;
}

export default function MapView({ routeData, style }: MapViewProps) {
  const waypoints = routeData?.waypoints || routeData?.coordinates || [];
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
              <View style={{ minWidth: 200, maxWidth: 250 }}>
                {poi.images && poi.images.length > 0 && (
                  <ImageCarousel images={poi.images} />
                )}
                <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>{poi.title}</Text>
                <Text style={{ fontSize: 12, color: '#666' }}>{poi.description}</Text>
              </View>
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
