import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  FlatList, Alert, Image, Dimensions, TextInput, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { POI } from '../../../src/types';
import { colors } from '../../../src/lib/theme';
import { Feather } from '@expo/vector-icons';
import WebMapEditor from '../../../src/components/WebMapEditor';
import * as DocumentPicker from 'expo-document-picker';
import { Buffer } from 'buffer';

const { width } = Dimensions.get('window');

// Helper to upload image to Supabase
async function uploadImageToSupabase(uri: string): Promise<string | null> {
  try {
    // 1. Read file logic (Web vs Native)
    let fileData: ArrayBuffer | Buffer;
    let fileName = '';
    let contentType = 'image/jpeg'; // Default

    if (Platform.OS === 'web') {
      // On web, uri is a blob url or base64. 
      // Ideally we get the File object directly from DocumentPicker if available, 
      // but expo-document-picker on web returns a File object in `output`. 
      // However, here we might need to fetch the blob if we only have URI.
      // Let's rely on standard fetch for blob.
      const response = await fetch(uri);
      const blob = await response.blob();
      fileData = await blob.arrayBuffer();
      fileName = `poi_${Date.now()}.jpg`; 
      contentType = blob.type;
    } else {
      // Native (Not implemented fully in this snippet, assuming Web focus based on user activity)
      // Standard ReadAsStringAsync with base64 could work for small files.
      // But for now let's focus on the Web logic as per current running context.
      return null; 
    }

    // 2. Upload
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, fileData, {
        contentType,
        upsert: false
      });

    if (error) throw error;

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

// --- TABS COMPONENT ---
function Tabs({ activeTab, onTabChange }) {
  return (
    <View style={styles.tabsContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'map' && styles.activeTab]} 
        onPress={() => onTabChange('map')}
      >
        <Feather name="map" size={18} color={activeTab === 'map' ? colors.primary : '#666'} />
        <Text style={[styles.tabText, activeTab === 'map' && styles.activeTabText]}>Crear en Mapa</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'list' && styles.activeTab]} 
        onPress={() => onTabChange('list')}
      >
        <Feather name="list" size={18} color={activeTab === 'list' ? colors.primary : '#666'} />
        <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>Ver Listado</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function POIManagementScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(false);

  // Map Editor State (for creating new POI)
  const [newPoiLocation, setNewPoiLocation] = useState<{lat: number, lng: number} | null>(null);

  // Edit State
  const [editingPoi, setEditingPoi] = useState<POI | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchPois();
    }
  }, [activeTab]);

  async function fetchPois() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pois')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) Alert.alert('Error', error.message);
    else setPois(data || []);
    setLoading(false);
  }

  // Handle saving a new POI from the Map
  async function handleCreatePoi(poiData: any) {
    if (!poiData || !poiData.location) return;
    
    setLoading(true);
    const { error } = await supabase.from('pois').insert({
      title: poiData.title || 'Nuevo Punto de Interés',
      description: poiData.description || 'Sin descripción',
      latitude: poiData.location.lat,
      longitude: poiData.location.lng,
      images: poiData.images || []
    });

    if (error) {
      Alert.alert('Error', 'No se pudo crear el POI: ' + error.message);
    } else {
      Alert.alert('Éxito', 'Punto de interés creado correctamente.');
      setActiveTab('list'); // Switch to list view to see it
    }
    setLoading(false);
  }

  async function handleDeletePoi(id: string) {
     if (Platform.OS === 'web') {
        const confirm = window.confirm('¿Estás seguro de eliminar este POI? Se quitará de todos los tours.');
        if (!confirm) return;
     } else {
       // Native alert logic if needed
     }

     const { error } = await supabase.from('pois').delete().eq('id', id);
     if (error) Alert.alert('Error', error.message);
     else fetchPois();
  }

  async function handleUpdatePoi() {
    if (!editingPoi) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('pois')
      .update({
        title: editTitle,
        description: editDesc,
        images: editImages
      })
      .eq('id', editingPoi.id);

    if (error) {
       Alert.alert('Error', 'No se pudo actualizar el POI: ' + error.message);
    } else {
       Alert.alert('Éxito', 'Punto de interés actualizado.');
       setShowEditModal(false);
       setEditingPoi(null);
       fetchPois();
    }
    setLoading(false);
  }

  const openEditModal = (poi: POI) => {
    setEditingPoi(poi);
    setEditTitle(poi.title);
    setEditDesc(poi.description);
    setEditImages(poi.images || []);
    setShowEditModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/(dashboard)')}
          style={{ marginBottom: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="arrow-left" size={20} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Volver</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>Gestión de Puntos de Interés</Text>
      </View>

      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'map' ? (
        <View style={styles.mapContainer}>
          <Text style={styles.hint}>
            Haz clic en el mapa para situar un nuevo POI y guárdalo.
          </Text>
           <WebMapEditor 
             apiKey="" 
             initialRoute={{ waypoints: [], pois: [] }} // Empty initial state
             onSaveRoute={() => {}} // We don't save routes here
             onSavePoi={(poi) => handleCreatePoi(poi)} // This is what we need
             mode="poi-only" // We might need to implement this prop in WebMapEditor if it implies hiding route tools
           />
        </View>
      ) : (
        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={pois}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                    <View style={styles.coordsBadge}>
                      <Feather name="map-pin" size={10} color="#666" />
                      <Text style={styles.coordsText}>
                        {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                      </Text>
                    </View>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => openEditModal(item)}
                    >
                      <Feather name="edit-2" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDeletePoi(item.id)}
                    >
                      <Feather name="trash-2" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No hay puntos de interés creados todavía.</Text>
                </View>
              }
            />
          )}

          {/* Edit Modal */}
          {showEditModal && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Editar Punto de Interés</Text>
                
                <Text style={styles.label}>Título</Text>
                <TextInput 
                  value={editTitle}
                  onChangeText={setEditTitle}
                  style={styles.input}
                />

                <Text style={styles.label}>Descripción</Text>
                <TextInput 
                  value={editDesc}
                  onChangeText={setEditDesc}
                  multiline
                  style={[styles.input, styles.textArea]}
                />

                 <Text style={styles.label}>Añadir Imagen (URL)</Text>
                 <View style={{flexDirection: 'row', gap: 8, marginBottom: 16}}>
                    <TextInput 
                        placeholder="https://..."
                        onSubmitEditing={(e) => {
                          if(e.nativeEvent.text) setEditImages([...editImages, e.nativeEvent.text]);
                          e.currentTarget.clear();
                        }}
                        style={[styles.input, {flex: 1, marginBottom: 0}]}
                     />
                     <TouchableOpacity 
                       style={styles.uploadButton}
                       onPress={async () => {
                         try {
                           const result = await DocumentPicker.getDocumentAsync({
                             type: 'image/*',
                             copyToCacheDirectory: true,
                           });
                           
                           if (result.canceled) return;
                           
                           setLoading(true);
                           const asset = result.assets[0];
                           const uploadedUrl = await uploadImageToSupabase(asset.uri);
                           
                           if (uploadedUrl) {
                             setEditImages([...editImages, uploadedUrl]);
                           } else {
                             Alert.alert('Error', 'Error subiendo la imagen');
                           }
                         } catch (err) {
                           Alert.alert('Error', 'Error seleccionando imagen');
                         } finally {
                           setLoading(false);
                         }
                       }}
                     >
                        <Feather name="upload" size={20} color="#fff" />
                     </TouchableOpacity>
                 </View>

                 <View style={{flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16}}>
                    {editImages.map((img, idx) => (
                      <View key={idx} style={{position: 'relative'}}>
                        <Image source={{uri: img}} style={{width: 50, height: 50, borderRadius: 4}} />
                        <TouchableOpacity 
                          style={styles.removeImage}
                          onPress={() => setEditImages(editImages.filter((_, i) => i !== idx))}
                        >
                          <Feather name="x" size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                 </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setShowEditModal(false)}
                  >
                    <Text style={styles.buttonTextCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]}
                    onPress={handleUpdatePoi}
                  >
                    <Text style={styles.buttonTextSave}>Guardar Cambios</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
  },
  hint: {
    padding: 10,
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    textAlign: 'center',
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coordsText: {
    fontSize: 10,
    color: '#666',
  },
  deleteButton: {
    padding: 10,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16, // Default marginBottom
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#f1f3f5',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  buttonTextCancel: {
    color: '#666',
    fontWeight: '600',
  },
  buttonTextSave: {
    color: '#fff',
    fontWeight: '600',
  },
  removeImage: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 1,
  },
});
