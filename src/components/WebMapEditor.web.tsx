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

interface WebMapEditorProps {
  initialRouteData?: RouteData;
  onRouteDataChange: (data: RouteData) => void;
}

function MapEvents({ onMapClick }: { onMapClick: (e: L.LeafletMouseEvent) => void }) {
  useMapEvents({
    click: onMapClick,
  });
  return null;
}

export default function WebMapEditor({ initialRouteData, onRouteDataChange }: WebMapEditorProps) {
  const [waypoints, setWaypoints] = useState<Coordinate[]>(initialRouteData?.waypoints || []);
  const [pois, setPois] = useState<POI[]>(initialRouteData?.pois || []);
  const [selectedPoiIndex, setSelectedPoiIndex] = useState<number | null>(null);
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);

  // Update parent whenever state changes
  const updateParent = (newWaypoints: Coordinate[], newPois: POI[]) => {
    onRouteDataChange({ waypoints: newWaypoints, pois: newPois });
  };

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    // Add POI on click
    const newPoi: POI = {
      latitude: e.latlng.lat,
      longitude: e.latlng.lng,
      title: `Point ${pois.length + 1}`,
      description: 'Description here',
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

  const center = pois.length > 0 
    ? [pois[0].latitude, pois[0].longitude] 
    : waypoints.length > 0
    ? [waypoints[0].latitude, waypoints[0].longitude]
    : [40.416775, -3.703790]; // Default to Madrid

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <Text style={styles.instructions}>
          Click to add POIs. Use arrows to reorder, or click "Optimize & Generate" to auto-optimize.
        </Text>
        <View style={styles.buttonGroup}>
          <Button 
            title={isGeneratingRoute ? "Generating..." : "Generate Route"} 
            onPress={() => generateRoute(false)} 
            disabled={pois.length < 2 || isGeneratingRoute}
          />
          <View style={{ width: 10 }} />
          <Button 
            title="Optimize & Generate" 
            onPress={() => generateRoute(true)} 
            disabled={pois.length < 2 || isGeneratingRoute}
            color="#2196F3"
          />
          <View style={{ width: 10 }} />
          <Button title="Clear All" onPress={clearAll} color="red" />
        </View>
        
        {pois.length > 0 && (
          <View style={styles.poiList}>
            <Text style={styles.poiListTitle}>Points ({pois.length}):</Text>
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
      </View>

      <View style={styles.mapContainer}>
        {/* @ts-ignore: Leaflet types mismatch with React Native Web */}
        <MapContainer center={center as L.LatLngExpression} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onMapClick={handleMapClick} />
          
          <Polyline positions={waypoints.map(w => [w.latitude, w.longitude])} />

          {pois.map((poi, index) => (
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
                <View style={{ minWidth: 200 }}>
                  <TextInput
                    value={poi.title}
                    onChangeText={(text) => updatePoiDetails(index, 'title', text)}
                    style={{ width: '100%', marginBottom: 5, fontWeight: 'bold', borderBottomWidth: 1, borderColor: '#ccc', padding: 2 }}
                  />
                  <TextInput
                    value={poi.description}
                    onChangeText={(text) => updatePoiDetails(index, 'description', text)}
                    multiline
                    style={{ width: '100%', height: 60, marginBottom: 5, borderWidth: 1, borderColor: '#eee', padding: 5 }}
                  />
                  <Button title="Delete POI" onPress={() => deletePoi(index)} color="red" />
                </View>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 500,
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
    maxHeight: 250,
  },
  instructions: {
    marginBottom: 10,
    fontSize: 14,
    color: '#666',
  },
  buttonGroup: {
    flexDirection: 'row',
    marginBottom: 10,
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
  mapContainer: {
    flex: 1,
  },
});
