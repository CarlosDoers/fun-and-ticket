import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, TextInput } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { RouteData, Coordinate, POI } from '../types';

// Fix Leaflet marker icons using CDN URLs
let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Image Gallery Component
function ImageGallery({ images, onRemove }: { images: string[], onRemove?: (index: number) => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const goToPrevious = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div style={{ position: 'relative', marginBottom: 10 }}>
      {/* Compatibility for React Native Web env which might need explicit img styles to work inside div */}
      <img 
        src={images[currentIndex]} 
        alt={`POI image ${currentIndex + 1}`}
        style={{ 
          width: '100%', 
          height: 150, 
          objectFit: 'cover',
          borderRadius: 4,
          display: 'block'
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x150?text=Error+loading+image';
        }}
      />
      
      {images.length > 1 && (
        <>
          <div
            onClick={goToPrevious}
            style={{
              position: 'absolute',
              left: 5,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.5)',
              width: 30,
              height: 30,
              borderRadius: 15,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'white',
              fontWeight: 'bold',
              fontSize: 18,
              zIndex: 10
            }}
          >
            ‹
          </div>
          
          <div
            onClick={goToNext}
            style={{
              position: 'absolute',
              right: 5,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.5)',
              width: 30,
              height: 30,
              borderRadius: 15,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'white',
              fontWeight: 'bold',
              fontSize: 18,
              zIndex: 10
            }}
          >
           ›
          </div>
        </>
      )}
      
      {images.length > 1 && (
        <div style={{ 
          position: 'absolute', 
          bottom: 5, 
          left: 0, 
          right: 0, 
          display: 'flex',
          flexDirection: 'row', 
          justifyContent: 'center',
          gap: 4,
          zIndex: 10
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
      )}
      
      {onRemove && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onRemove(currentIndex);
          }}
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            backgroundColor: 'rgba(255,0,0,0.7)',
            width: 24,
            height: 24,
            borderRadius: 12,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            color: 'white',
            fontWeight: 'bold',
            fontSize: 14,
            zIndex: 11
          }}
        >
          ×
        </div>
      )}
    </div>
  );
}

interface WebMapEditorProps {
  initialRouteData?: RouteData;
  onRouteDataChange: (data: RouteData) => void;
  // New props for POI Mode
  mode?: 'route' | 'poi-only';
  onSavePoi?: (poi: Partial<POI> & { location: { lat: number, lng: number } }) => void;
  apiKey?: string; // Kept for compatibility
  onSaveRoute?: (route: any) => void; // Legacy
}

function MapEvents({ onMapClick }: { onMapClick: (e: L.LeafletMouseEvent) => void }) {
  useMapEvents({
    contextmenu: (e) => {
      e.originalEvent.preventDefault(); // Prevent default context menu
      onMapClick(e);
    },
  });
  return null;
}

export default function WebMapEditor({ 
  initialRouteData, 
  onRouteDataChange,
  mode = 'route', // Default to route mode
  onSavePoi
}: WebMapEditorProps) {
  const [waypoints, setWaypoints] = useState<Coordinate[]>(initialRouteData?.waypoints || []);
  const [pois, setPois] = useState<POI[]>(initialRouteData?.pois || []);
  // For POI-only mode, we track a single temporary marker
  const [tempPoi, setTempPoi] = useState<Partial<POI> & { location: { lat: number, lng: number } } | null>(null);

  const [selectedPoiIndex, setSelectedPoiIndex] = useState<number | null>(null);
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);

  // Sync state with props when they change
  React.useEffect(() => {
    if (initialRouteData) {
      setWaypoints(initialRouteData.waypoints || []);
      // If we are in route mode, we want to respect the passed POIs which might come from external selection
      if (initialRouteData.pois) {
        setPois(initialRouteData.pois);
      }
    }
  }, [initialRouteData]);

  // Update parent whenever state changes (Only in route mode)
  const updateParent = (newWaypoints: Coordinate[], newPois: POI[]) => {
    if (mode === 'route') {
      onRouteDataChange({ waypoints: newWaypoints, pois: newPois });
    }
  };

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (mode === 'poi-only') {
      // restricted to single point creation
      setTempPoi({
        title: '',
        description: '',
        images: [],
        location: { lat: e.latlng.lat, lng: e.latlng.lng }
      });
      return;
    }

    // Add POI on click (Route Mode)
    const newPoi: POI = {
      latitude: e.latlng.lat,
      longitude: e.latlng.lng,
      title: `Point ${pois.length + 1}`,
      description: 'Description here',
      images: [],
    };
    const newPois = [...pois, newPoi];
    setPois(newPois);
    updateParent(waypoints, newPois);
  };

  const generateRoute = async (optimize: boolean = false) => {
    if (pois.length < 2) {
      alert('You need at least 2 points of interest to generate a route');
      return;
    }

    setIsGeneratingRoute(true);
    try {
      // Build coordinates string for OSRM API (lon,lat format)
      const coordinates = pois.map(poi => `${poi.longitude},${poi.latitude}`).join(';');
      
      let data;
      
      
      if (optimize) {
        // Use OSRM trip service to find optimal order
        // Keep first point fixed as starting point, optimize the rest
        const response = await fetch(
          `https://router.project-osrm.org/trip/v1/foot/${coordinates}?source=first&roundtrip=false&geometries=geojson`
        );
        data = await response.json();
        
        if (data.code === 'Ok' && data.trips && data.trips[0]) {
          // Reorder POIs based on waypoint_index from the optimized trip
          const waypointOrder = data.waypoints.map((wp: any) => wp.waypoint_index);
          const reorderedPois = waypointOrder.map((index: number) => pois[index]);
          setPois(reorderedPois);
          
          // Extract route geometry
          const routeCoordinates = data.trips[0].geometry.coordinates;
          const newWaypoints = routeCoordinates.map((coord: [number, number]) => ({
            longitude: coord[0],
            latitude: coord[1],
          }));
          
          setWaypoints(newWaypoints);
          updateParent(newWaypoints, reorderedPois);
          
          const distance = (data.trips[0].distance / 1000).toFixed(2);
          const duration = Math.round(data.trips[0].duration / 60);
          alert(`Optimized route generated!\nDistance: ${distance} km\nEstimated time: ${duration} min walking\nPOIs have been reordered for optimal route.`);
        } else {
          throw new Error('Could not optimize route');
        }
      } else {
        // Use regular route service with current order
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/foot/${coordinates}?overview=full&geometries=geojson`
        );
        data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes[0]) {
          // Extract waypoints from the route geometry
          const routeCoordinates = data.routes[0].geometry.coordinates;
          const newWaypoints = routeCoordinates.map((coord: [number, number]) => ({
            longitude: coord[0],
            latitude: coord[1],
          }));
          
          setWaypoints(newWaypoints);
          updateParent(newWaypoints, pois);
          
          const distance = (data.routes[0].distance / 1000).toFixed(2);
          const duration = Math.round(data.routes[0].duration / 60);
          alert(`Route generated!\nDistance: ${distance} km\nEstimated time: ${duration} min walking`);
        } else {
          throw new Error('Could not generate route');
        }
      }
    } catch (error) {
      console.error('Error generating route:', error);
      alert('Error generating route. Please try again.');
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  const movePoi = (index: number, direction: 'up' | 'down') => {
    const newPois = [...pois];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= pois.length) return;
    
    // Swap POIs
    [newPois[index], newPois[targetIndex]] = [newPois[targetIndex], newPois[index]];
    setPois(newPois);
    updateParent(waypoints, newPois);
  };

  const handlePoiDragEnd = (index: number, e: L.DragEndEvent) => {
    const marker = e.target;
    const position = marker.getLatLng();
    const updatedPois = [...pois];
    updatedPois[index] = {
      ...updatedPois[index],
      latitude: position.lat,
      longitude: position.lng,
    };
    setPois(updatedPois);
    updateParent(waypoints, updatedPois);
  };

  const updatePoiDetails = (index: number, field: 'title' | 'description', value: string) => {
    const updatedPois = [...pois];
    updatedPois[index] = { ...updatedPois[index], [field]: value };
    setPois(updatedPois);
    updateParent(waypoints, updatedPois);
  };

  const addImageToPoi = (index: number, imageUrl: string) => {
    if (!imageUrl.trim()) return;
    const updatedPois = [...pois];
    const currentImages = updatedPois[index].images || [];
    updatedPois[index] = { ...updatedPois[index], images: [...currentImages, imageUrl.trim()] };
    setPois(updatedPois);
    updateParent(waypoints, updatedPois);
  };

  const removeImageFromPoi = (poiIndex: number, imageIndex: number) => {
    const updatedPois = [...pois];
    const currentImages = updatedPois[poiIndex].images || [];
    updatedPois[poiIndex] = { 
      ...updatedPois[poiIndex], 
      images: currentImages.filter((_, i) => i !== imageIndex) 
    };
    setPois(updatedPois);
    updateParent(waypoints, updatedPois);
  };

  const deletePoi = (index: number) => {
    const updatedPois = pois.filter((_, i) => i !== index);
    setPois(updatedPois);
    updateParent(waypoints, updatedPois);
    setSelectedPoiIndex(null);
  };

  const clearAll = () => {
    setWaypoints([]);
    setPois([]);
    updateParent([], []);
  };

  const center = tempPoi 
    ? [tempPoi.location.lat, tempPoi.location.lng]
    : pois.length > 0 
      ? [pois[0].latitude, pois[0].longitude] 
      : waypoints.length > 0
      ? [waypoints[0].latitude, waypoints[0].longitude]
      : [40.416775, -3.703790];

  return (
    <View style={styles.container}>
      {/* Controls only for route mode */}
      {mode === 'route' && (
        <View style={styles.controls}>
          <Text style={styles.instructions}>
            📍 Clic derecho en el mapa para añadir puntos de interés (POIs).
          </Text>
          
          {/* POI List */}
          {pois.length > 0 && (
            <View style={styles.poiList}>
              <Text style={styles.poiListTitle}>Puntos de Interés ({pois.length}):</Text>
              {pois.map((poi, index) => (
                <View key={index} style={styles.poiItem}>
                  <Text style={styles.poiNumber}>{index + 1}</Text>
                  <Text style={styles.poiTitle} numberOfLines={1}>{poi.title}</Text>
                  <View style={styles.poiButtons}>
                    <TouchableOpacity 
                      onPress={() => movePoi(index, 'up')} 
                      disabled={index === 0}
                      style={{ marginRight: 5 }}
                    >
                      <Text style={{ fontSize: 16, color: index === 0 ? '#ccc' : '#000' }}>↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => movePoi(index, 'down')} 
                      disabled={index === pois.length - 1}
                    >
                     <Text style={{ fontSize: 16, color: index === pois.length - 1 ? '#ccc' : '#000' }}>↓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Route Generation - Optional */}
          {pois.length >= 2 && (
            <View style={styles.routeSection}>
              <Text style={styles.routeSectionTitle}>🛤️ Generación de Ruta (Opcional)</Text>
              <Text style={styles.routeSectionDescription}>
                Si deseas conectar los POIs con una ruta de navegación:
              </Text>
              <View style={styles.buttonGroup}>
                <Button 
                  title={isGeneratingRoute ? "Generando..." : "Generar Ruta"} 
                  onPress={() => generateRoute(false)} 
                  disabled={isGeneratingRoute}
                />
                <View style={{ width: 10 }} />
                <Button 
                  title="Optimizar y Generar" 
                  onPress={() => generateRoute(true)} 
                  disabled={isGeneratingRoute}
                  color="#2196F3"
                />
              </View>
            </View>
          )}

          {/* Clear Button */}
          <View style={styles.clearSection}>
            <Button title="🗑️ Limpiar Todo" onPress={clearAll} color="#f44336" />
          </View>
        </View>
      )}

      <View style={styles.mapContainer}>
        {/* @ts-ignore: Leaflet types mismatch with React Native Web */}
        <MapContainer center={center as L.LatLngExpression} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onMapClick={handleMapClick} />
          
          {mode === 'route' && <Polyline positions={waypoints.map(w => [w.latitude, w.longitude])} />}

          {/* Route Mode Markers */}
          {mode === 'route' && pois.map((poi, index) => (
            <Marker
              key={index}
              position={[poi.latitude, poi.longitude]}
              draggable={true}
              eventHandlers={{
                dragend: (e) => handlePoiDragEnd(index, e),
                click: () => setSelectedPoiIndex(index),
              }}
            >
              <Popup>
                <View style={{ minWidth: 250, maxWidth: 300 }}>
                  {/* Image gallery */}
                  {poi.images && poi.images.length > 0 && (
                    <View style={{ marginBottom: 10 }}>
                      <ImageGallery 
                        images={poi.images} 
                        onRemove={(imgIndex) => removeImageFromPoi(index, imgIndex)}
                      />
                    </View>
                  )}
                  
                  <TextInput
                    value={poi.title}
                    onChangeText={(text) => updatePoiDetails(index, 'title', text)}
                    style={{ width: '100%', marginBottom: 5, fontWeight: 'bold', borderBottomWidth: 1, borderColor: '#ccc', padding: 2 }}
                    placeholder="Título"
                  />
                  <TextInput
                    value={poi.description}
                    onChangeText={(text) => updatePoiDetails(index, 'description', text)}
                    multiline
                    style={{ width: '100%', height: 60, marginBottom: 5, borderWidth: 1, borderColor: '#eee', padding: 5 }}
                    placeholder="Descripción"
                  />
                  
                  {/* Add image URL */}
                  <View style={{ marginBottom: 5 }}>
                    <TextInput
                      placeholder="URL de imagen"
                      style={{ width: '100%', borderWidth: 1, borderColor: '#ddd', padding: 5, marginBottom: 5 }}
                      onSubmitEditing={(e) => {
                        addImageToPoi(index, e.nativeEvent.text);
                        e.currentTarget.clear();
                      }}
                    />
                    <Text style={{ fontSize: 11, color: '#666' }}>
                      Presiona Enter para añadir
                    </Text>
                  </View>
                  
                  <Button title="Delete POI" onPress={() => deletePoi(index)} color="red" />
                </View>
              </Popup>
            </Marker>
          ))}

          {/* POI Only Mode Marker */}
          {mode === 'poi-only' && tempPoi && (
             <Marker
                position={[tempPoi.location.lat, tempPoi.location.lng]}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    setTempPoi({ ...tempPoi, location: { lat: pos.lat, lng: pos.lng } });
                  }
                }}
             >
                <Popup>
                   <View style={{ minWidth: 250 }}>
                      <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Nuevo Punto de Interés</Text>
                      
                       <TextInput
                        value={tempPoi.title}
                        onChangeText={(text) => setTempPoi({...tempPoi, title: text})}
                        style={{ width: '100%', marginBottom: 8, borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 4 }}
                        placeholder="Título del POI"
                      />
                      
                      <TextInput
                        value={tempPoi.description}
                        onChangeText={(text) => setTempPoi({...tempPoi, description: text})}
                        multiline
                        style={{ width: '100%', height: 80, marginBottom: 8, borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 4 }}
                        placeholder="Descripción corta"
                      />

                       {/* Image URL for new POI */}
                       <View style={{ marginBottom: 10 }}>
                        <TextInput
                          placeholder="URL de Imagen (Opcional)"
                          style={{ width: '100%', borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 4, marginBottom: 5 }}
                          onSubmitEditing={(e) => {
                             const url = e.nativeEvent.text;
                             if(url) setTempPoi({...tempPoi, images: [...(tempPoi.images || []), url]});
                             e.currentTarget.clear();
                          }}
                        />
                        {/* Preview images */}
                        <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap' }}>
                           {tempPoi.images?.map((img, i) => (
                              <img key={i} src={img} style={{ width: 40, height: 40, objectFit: 'cover' }} />
                           ))}
                        </View>
                      </View>

                      <Button 
                        title="Guardar POI" 
                        onPress={() => {
                           if(onSavePoi) {
                              onSavePoi(tempPoi);
                              setTempPoi(null); // Clear after save
                           }
                        }} 
                      />
                   </View>
                </Popup>
             </Marker>
          )}

        </MapContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 650,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  controls: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    maxHeight: 320,
  },
  instructions: {
    marginBottom: 10,
    fontSize: 14,
    color: '#666',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  poiList: {
    marginTop: 10,
    maxHeight: 150,
  },
  poiListTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 12,
  },
  poiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    backgroundColor: '#fff',
    marginBottom: 3,
    borderRadius: 4,
  },
  poiNumber: {
    width: 25,
    fontWeight: 'bold',
    fontSize: 12,
  },
  poiTitle: {
    flex: 1,
    fontSize: 12,
  },
  poiButtons: {
    flexDirection: 'row',
  },
  routeSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b3d4fc',
  },
  routeSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  routeSectionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  clearSection: {
    marginTop: 12,
  },
  mapContainer: {
    flex: 1,
  },
});
