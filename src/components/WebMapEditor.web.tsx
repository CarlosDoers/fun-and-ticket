import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity, TextInput } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
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

function MapEvents({ onMapClick, onMapRightClick }: { onMapClick: (e: L.LeafletMouseEvent) => void, onMapRightClick: (e: L.LeafletMouseEvent) => void }) {
  useMapEvents({
    click: onMapClick,
    contextmenu: onMapRightClick,
  });
  return null;
}

export default function WebMapEditor({ initialRouteData, onRouteDataChange }: WebMapEditorProps) {
  const [waypoints, setWaypoints] = useState<Coordinate[]>(initialRouteData?.waypoints || []);
  const [pois, setPois] = useState<POI[]>(initialRouteData?.pois || []);
  const [selectedPoiIndex, setSelectedPoiIndex] = useState<number | null>(null);

  // Update parent whenever state changes
  const updateParent = (newWaypoints: Coordinate[], newPois: POI[]) => {
    onRouteDataChange({ waypoints: newWaypoints, pois: newPois });
  };

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    const newWaypoint = { latitude: e.latlng.lat, longitude: e.latlng.lng };
    const newWaypoints = [...waypoints, newWaypoint];
    setWaypoints(newWaypoints);
    updateParent(newWaypoints, pois);
  };

  const handleMapRightClick = (e: L.LeafletMouseEvent) => {
    const newPoi: POI = {
      latitude: e.latlng.lat,
      longitude: e.latlng.lng,
      title: 'New Point of Interest',
      description: 'Description here',
    };
    const newPois = [...pois, newPoi];
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

  const undoLastWaypoint = () => {
    const newWaypoints = waypoints.slice(0, -1);
    setWaypoints(newWaypoints);
    updateParent(newWaypoints, pois);
  };

  const clearRoute = () => {
    setWaypoints([]);
    setPois([]);
    updateParent([], []);
  };

  const center = waypoints.length > 0 
    ? [waypoints[0].latitude, waypoints[0].longitude] 
    : [40.416775, -3.703790]; // Default to Madrid

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <Text style={styles.instructions}>
          Left click to add route points. Right click to add POIs. Drag POIs to move.
        </Text>
        <View style={styles.buttonGroup}>
          <Button title="Undo Last Point" onPress={undoLastWaypoint} disabled={waypoints.length === 0} />
          <View style={{ width: 10 }} />
          <Button title="Clear All" onPress={clearRoute} color="red" />
        </View>
      </View>

      <View style={styles.mapContainer}>
        {/* @ts-ignore: Leaflet types mismatch with React Native Web */}
        <MapContainer center={center as L.LatLngExpression} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onMapClick={handleMapClick} onMapRightClick={handleMapRightClick} />
          
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
                <div style={{ minWidth: '200px' }}>
                  <input
                    type="text"
                    value={poi.title}
                    onChange={(e) => updatePoiDetails(index, 'title', e.target.value)}
                    style={{ width: '100%', marginBottom: '5px', fontWeight: 'bold' }}
                  />
                  <textarea
                    value={poi.description}
                    onChange={(e) => updatePoiDetails(index, 'description', e.target.value)}
                    style={{ width: '100%', height: '60px', marginBottom: '5px' }}
                  />
                  <button onClick={() => deletePoi(index)} style={{ color: 'red' }}>Delete POI</button>
                </div>
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
  },
  instructions: {
    marginBottom: 10,
    fontSize: 14,
    color: '#666',
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  mapContainer: {
    flex: 1,
  },
});
