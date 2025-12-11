import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, 
  TouchableOpacity, ScrollView, ActivityIndicator, Modal, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/lib/auth';
import WebMapEditor from '../../../src/components/WebMapEditor';
import { RouteData, POI } from '../../../src/types';
import { colors } from '../../../src/lib/theme';
import { Feather } from '@expo/vector-icons';

export default function CreateTour() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // We keep waypoints for the path, but track selected POIs separately
  const [routeWaypoints, setRouteWaypoints] = useState<any[]>([]); 
  const [selectedPois, setSelectedPois] = useState<POI[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [globalPois, setGlobalPois] = useState<POI[]>([]);
  const [showPoiSelector, setShowPoiSelector] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchGlobalPois();
  }, []);

  async function fetchGlobalPois() {
    const { data, error } = await supabase.from('pois').select('*').order('title');
    if (error) console.error('Error fetching global POIs:', error);
    else setGlobalPois(data || []);
  }

  const togglePoiSelection = (poi: POI) => {
    if (selectedPois.find(p => p.id === poi.id)) {
      setSelectedPois(selectedPois.filter(p => p.id !== poi.id));
    } else {
      setSelectedPois([...selectedPois, poi]);
    }
  };

  async function createTour() {
    if (!name.trim()) {
      Alert.alert('Campo requerido', 'El nombre del tour es obligatorio');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Campo requerido', 'La descripción es obligatoria');
      return;
    }

    if (selectedPois.length === 0) {
      Alert.alert(
        'Sin puntos de interés',
        'No has seleccionado ningún punto de interés. ¿Deseas continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => saveTour() }
        ]
      );
      return;
    }

    saveTour();
  }

  async function saveTour() {
    setLoading(true);
    try {
      // 1. Create Tour
      // We still save route_data JSON for compatibility with the map viewer (for now)
      // containing the waypoints and the selected POIs (as a snapshot)
      const routeDataSnapshot: RouteData = {
        waypoints: routeWaypoints,
        pois: selectedPois, 
      };

      const { data: tourData, error: tourError } = await supabase
        .from('tours')
        .insert({
          name,
          description,
          created_by: user?.id,
          route_data: routeDataSnapshot,
        })
        .select()
        .single();

      if (tourError) throw tourError;

      // 2. Link POIs in tour_pois table
      if (selectedPois.length > 0 && tourData) {
        const tourPoisInserts = selectedPois.map((poi, index) => ({
          tour_id: tourData.id,
          poi_id: poi.id,
          order: index, // Simple ordering based on selection/list order
        }));

        const { error: linkError } = await supabase
          .from('tour_pois')
          .insert(tourPoisInserts);

        if (linkError) throw linkError;
      }

      Alert.alert('Éxito', 'Tour creado correctamente');
      router.back();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Combined data for MapEditor visualization
  const mapRouteData: RouteData = {
    waypoints: routeWaypoints,
    pois: selectedPois
  };

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
        <Text style={styles.headerTitle}>Crear Nuevo Tour</Text>
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
              placeholder="Describe el tour..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* POI Selection Section */}
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
            Selecciona los puntos de interés de la lista global para añadirlos a este tour.
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
           <Text style={styles.sectionTitle}>Vista Previa y Ruta</Text>
           <Text style={styles.sectionDescription}>
             Dibuja la ruta, la generación automática usará los POIs seleccionados.
           </Text>
           
           <WebMapEditor 
             initialRouteData={mapRouteData}
             onRouteDataChange={(newData) => setRouteWaypoints(newData.waypoints)}
             // We pass 'route' mode but since we control POIs via logic, 
             // we rely on the editor correctly displaying passed `pois` without allowing new ones via click effectively?
             // Actually, regular route mode adds POIs on click. We might want to DISABLE that or ignore it.
             // But existing WebMapEditor adds POI on click in 'route' mode.
             // We should strictly ignore new POIs from the map if we want to enforce selection only.
             // For now, let's strictly use the 'routeWaypoints' from the map callback and ignore 'pois' it returns.
           />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={createTour}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Crear Tour</Text>
            )}
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
