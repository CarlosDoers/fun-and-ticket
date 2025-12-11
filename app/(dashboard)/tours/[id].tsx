import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, 
  TouchableOpacity, ScrollView, ActivityIndicator, Modal, FlatList 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import WebMapEditor from '../../../src/components/WebMapEditor';
import { RouteData, POI } from '../../../src/types';
import { colors } from '../../../src/lib/theme';
import { Feather } from '@expo/vector-icons';

export default function EditTour() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [routeData, setRouteData] = useState<RouteData>({ waypoints: [], pois: [] }); // Route data for the path
  const [selectedPois, setSelectedPois] = useState<POI[]>([]); // Separately track selected POIs
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // POI Selector State
  const [globalPois, setGlobalPois] = useState<POI[]>([]);
  const [showPoiSelector, setShowPoiSelector] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchGlobalPois();
    if (id) {
      fetchTour();
    }
  }, [id]);

  async function fetchGlobalPois() {
    const { data, error } = await supabase.from('pois').select('*').order('title');
    if (error) console.error('Error fetching global POIs:', error);
    else setGlobalPois(data || []);
  }

  async function fetchTour() {
    try {
      // 1. Fetch Tour Data
      const { data: tourData, error: tourError } = await supabase
        .from('tours')
        .select('*')
        .eq('id', id)
        .single();

      if (tourError) throw tourError;
      
      if (tourData) {
        setName(tourData.name);
        setDescription(tourData.description);
        // We initialize routeData mainly for the waypoints (path)
        setRouteData(tourData.route_data || { waypoints: [], pois: [] });
      }

      // 2. Fetch Linked POIs
      const { data: tourPoisData, error: poisError } = await supabase
        .from('tour_pois')
        .select('*, poi:pois(*)')
        .eq('tour_id', id)
        .order('order');

      if (poisError) throw poisError;

      if (tourPoisData) {
        // Map the relation back to simple POI objects
        const resolvedPois = tourPoisData.map((tp: any) => tp.poi).filter(Boolean);
        setSelectedPois(resolvedPois);
      }

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setFetching(false);
    }
  }

  const togglePoiSelection = (poi: POI) => {
    if (selectedPois.find(p => p.id === poi.id)) {
      setSelectedPois(selectedPois.filter(p => p.id !== poi.id));
    } else {
      setSelectedPois([...selectedPois, poi]);
    }
  };

  async function updateTour() {
    if (!name.trim()) {
      Alert.alert('Campo requerido', 'El nombre del tour es obligatorio');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Campo requerido', 'La descripción es obligatoria');
      return;
    }

    setLoading(true);
    try {
      // 1. Update Tour Info & Route Snapshot
      // Update routeData with the latest selected POIs
      const updatedRouteData: RouteData = {
        waypoints: routeData.waypoints, // Keep existing path
        pois: selectedPois // Update POIs snapshot
      };
      
      const { error: updateError } = await supabase
        .from('tours')
        .update({
          name,
          description,
          route_data: updatedRouteData,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. Update POI Relations (Delete All + Re-insert)
      // First, delete existing
      const { error: deleteError } = await supabase
        .from('tour_pois')
        .delete()
        .eq('tour_id', id);
        
      if (deleteError) throw deleteError;

      // Then insert new ones
      if (selectedPois.length > 0) {
        const tourPoisInserts = selectedPois.map((poi, index) => ({
          tour_id: id,
          poi_id: poi.id,
          order: index,
        }));

        const { error: insertError } = await supabase
          .from('tour_pois')
          .insert(tourPoisInserts);

         if (insertError) throw insertError;
      }

      Alert.alert('Éxito', 'Tour actualizado correctamente');
      router.push('/(dashboard)/tours');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Combine for visualisation
  const mapRouteData: RouteData = {
     waypoints: routeData.waypoints,
     pois: selectedPois
  };

  const hasRoute = (routeData.waypoints?.length || 0) > 0;

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando tour...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(dashboard)/tours')} style={styles.backButton}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="arrow-left" size={16} color={colors.primary} />
            <Text style={styles.backButtonText}>Volver</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Tour</Text>
        <Text style={styles.tourId}>ID: {id}</Text>
      </View>

      <View style={styles.container}>
        {/* Form Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Básica</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Tour *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Tour Histórico del Centro"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe el tour, qué verán los visitantes, duración estimada..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* POI Selection Section (New) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Puntos de Interés</Text>
             <TouchableOpacity 
              style={styles.addPoiButton}
              onPress={() => setShowPoiSelector(true)}
             >
               <Feather name="plus" size={16} color="#fff" />
               <Text style={styles.addPoiButtonText}>Seleccionar POIs</Text>
             </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionDescription}>
            Gestiona los puntos de interés que componen este tour.
          </Text>

          {selectedPois.length === 0 ? (
             <View style={styles.emptyPois}>
               <Text style={styles.emptyPoisText}>No hay POIs seleccionados.</Text>
             </View>
          ) : (
             <View style={styles.selectedPoisList}>
               {selectedPois.map((poi, index) => (
                 <View key={poi.id} style={styles.selectedPoiItem}>
                   <Text style={{fontWeight: 'bold', marginRight: 8}}>{index + 1}.</Text>
                   <Text style={{flex: 1}}>{poi.title}</Text>
                   <TouchableOpacity onPress={() => togglePoiSelection(poi)}>
                     <Feather name="x" size={16} color="#ff4444" />
                   </TouchableOpacity>
                 </View>
               ))}
             </View>
          )}
        </View>

        {/* Map Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ruta Visual</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
             Edita la ruta (camino azul). Los POIs se actualizan automáticamente según tu selección arriba.
          </Text>

          {hasRoute && (
            <View style={styles.routeInfo}>
              <Feather name="map" size={18} color="#2e7d32" style={{ marginRight: 8 }} />
              <Text style={styles.routeInfoText}>Ruta guardada con {routeData.waypoints?.length} puntos</Text>
            </View>
          )}

          <WebMapEditor 
            initialRouteData={mapRouteData}
            onRouteDataChange={(newData) => {
               // Only update waypoints dynamics from map (if user edits path)
               setRouteData(prev => ({...prev, waypoints: newData.waypoints}));
            }}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={updateTour}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.push('/(dashboard)/tours')}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* POI Selector Modal */}
       <Modal visible={showPoiSelector} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Puntos de Interés</Text>
              <TouchableOpacity onPress={() => setShowPoiSelector(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={globalPois}
              keyExtractor={item => item.id}
              contentContainerStyle={{padding: 20}}
              renderItem={({item}) => {
                const isSelected = selectedPois.find(p => p.id === item.id);
                return (
                  <TouchableOpacity 
                    style={[styles.poiOption, isSelected && styles.poiOptionSelected]}
                    onPress={() => togglePoiSelection(item)}
                  >
                    <View style={{flex: 1}}>
                      <Text style={[styles.poiOptionTitle, isSelected && {color: colors.primary, fontWeight: 'bold'}]}>
                        {item.title}
                      </Text>
                      <Text numberOfLines={1} style={{fontSize: 12, color: '#666'}}>
                        {item.description}
                      </Text>
                    </View>
                    {isSelected && <Feather name="check" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20}}>No hay POIs globales disponibles.</Text>}
            />
            
            <TouchableOpacity 
              style={styles.modalDoneButton}
              onPress={() => setShowPoiSelector(false)}
            >
              <Text style={styles.modalDoneButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  tourId: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  container: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  badge: {
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  routeInfoText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
  },
  actions: {
    gap: 12,
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  // New Styles
  addPoiButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  addPoiButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  emptyPois: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center'
  },
  emptyPoisText: {
    color: '#999'
  },
  selectedPoisList: {
    gap: 8
  },
  selectedPoiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0e0ff'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  poiOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  poiOptionSelected: {
    backgroundColor: '#f0f9ff'
  },
  poiOptionTitle: {
    fontSize: 16,
    marginBottom: 4
  },
  modalDoneButton: {
    padding: 20,
    backgroundColor: colors.primary,
    alignItems: 'center'
  },
  modalDoneButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  }
});
