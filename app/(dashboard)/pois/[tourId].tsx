import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Alert,
  TouchableOpacity, ActivityIndicator, Image, TextInput, ScrollView, Modal, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { Tour, POI, RouteData } from '../../../src/types';
import { colors } from '../../../src/lib/theme';
import { Feather } from '@expo/vector-icons';

export default function TourPOIsScreen() {
  const { tourId } = useLocalSearchParams<{ tourId: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (tourId) {
      fetchTour();
    }
  }, [tourId]);

  async function fetchTour() {
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('id', tourId)
        .single();

      if (error) throw error;
      
      setTour(data);
      setPois(data?.route_data?.pois || []);
    } catch (error) {
      console.error('Error fetching tour:', error);
      Alert.alert('Error', 'No se pudo cargar el tour');
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(index: number) {
    const poi = pois[index];
    setEditingIndex(index);
    setEditTitle(poi.title || '');
    setEditDescription(poi.description || '');
    setEditImages(poi.images || []);
    setEditModalVisible(true);
  }

  // Handle file upload for web
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${tourId}_poi_${Date.now()}.${fileExt}`;
      const filePath = `poi-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        // Try to create bucket if it doesn't exist
        if (uploadError.message.includes('not found')) {
          Alert.alert('Error', 'El bucket de imágenes no existe. Contacta al administrador.');
          return;
        }
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        setEditImages([...editImages, data.publicUrl]);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error al subir', error.message);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function removeImage(index: number) {
    setEditImages(editImages.filter((_, i) => i !== index));
  }

  function addImageUrl() {
    if (newImageUrl.trim()) {
      setEditImages([...editImages, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  }

  async function savePoi() {
    if (editingIndex === null || !tour) return;

    setSaving(true);
    try {
      const updatedPois = [...pois];
      updatedPois[editingIndex] = {
        ...updatedPois[editingIndex],
        title: editTitle,
        description: editDescription,
        images: editImages,
      };

      const newRouteData: RouteData = {
        ...tour.route_data,
        pois: updatedPois,
      };

      const { error } = await supabase
        .from('tours')
        .update({ route_data: newRouteData })
        .eq('id', tourId);

      if (error) throw error;

      setPois(updatedPois);
      // Update tour state too
      setTour({ ...tour, route_data: newRouteData });
      setEditModalVisible(false);
      Alert.alert('Éxito', 'Punto de interés actualizado');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deletePoi(index: number) {
    if (!tour) return;

    Alert.alert(
      'Eliminar POI',
      `¿Estás seguro de que quieres eliminar "${pois[index].title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedPois = pois.filter((_, i) => i !== index);
              const newRouteData: RouteData = {
                ...tour.route_data,
                pois: updatedPois,
              };

              const { error } = await supabase
                .from('tours')
                .update({ route_data: newRouteData })
                .eq('id', tourId);

              if (error) throw error;
              setPois(updatedPois);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.push('/(dashboard)/pois')}
          style={{ marginBottom: 8 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="arrow-left" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>Volver a Tours</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>{tour?.name}</Text>
        <Text style={styles.subtitle}>{pois.length} puntos de interés</Text>
      </View>

      {/* POIs List */}
      <FlatList
        data={pois}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <View style={styles.poiNumber}>
              <Text style={styles.poiNumberText}>{index + 1}</Text>
            </View>
            
            {item.images && item.images.length > 0 && (
              <Image 
                source={{ uri: item.images[0] }} 
                style={styles.poiImage}
              />
            )}
            
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title || 'Sin título'}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {item.description || 'Sin descripción'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Feather name="map-pin" size={12} color="#999" style={{ marginRight: 4 }} />
                <Text style={styles.cardCoords}>
                  {item.latitude?.toFixed(5)}, {item.longitude?.toFixed(5)}
                </Text>
              </View>
              {item.images && item.images.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Feather name="image" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.imageCount}>{item.images.length} imagen(es)</Text>
                </View>
              )}
            </View>
            
            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => openEditModal(index)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="edit-2" size={14} color={colors.primary} />
                  <Text style={styles.editButtonText}>Editar</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deletePoi(index)}
              >
                <Feather name="trash-2" size={18} color="#f44336" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="map-pin" size={64} color="#ccc" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>No hay POIs</Text>
            <Text style={styles.emptyDescription}>
              Añade puntos de interés desde el editor de mapa del tour
            </Text>
            <TouchableOpacity
              style={styles.goToEditorButton}
              onPress={() => router.push(`/(dashboard)/tours/${tourId}`)}
            >
              <Text style={styles.goToEditorButtonText}>Ir al Editor de Mapa</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Editar Punto de Interés</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Título</Text>
                <TextInput
                  style={styles.input}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Nombre del punto de interés"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="Describe este lugar..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Imágenes ({editImages.length})</Text>
                
                {/* Image list */}
                {editImages.map((img, idx) => (
                  <View key={idx} style={styles.imageRow}>
                    <Image source={{ uri: img }} style={styles.thumbnailImage} />
                    <Text style={styles.imageUrl} numberOfLines={1}>{img.split('/').pop()}</Text>
                    <TouchableOpacity onPress={() => removeImage(idx)} style={{ padding: 4 }}>
                      <Feather name="x" size={16} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {/* Upload button - Web only */}
                {Platform.OS === 'web' && (
                  <View style={styles.uploadContainer}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <TouchableOpacity 
                      style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                      onPress={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Feather name="camera" size={18} color="#fff" />
                          <Text style={styles.uploadButtonText}>Subir Imagen</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    
                    <Text style={styles.orDivider}>— o añadir URL —</Text>
                    
                    <View style={styles.urlInputRow}>
                      <TextInput
                        style={[styles.input, styles.urlInput]}
                        value={newImageUrl}
                        onChangeText={setNewImageUrl}
                        placeholder="https://ejemplo.com/imagen.jpg"
                      />
                      <TouchableOpacity 
                        style={[styles.addUrlButton, !newImageUrl.trim() && styles.addUrlButtonDisabled]} 
                        onPress={addImageUrl}
                        disabled={!newImageUrl.trim()}
                      >
                        <Feather name="plus" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary, saving && styles.modalButtonDisabled]}
                  onPress={savePoi}
                  disabled={saving}
                >
                  <Text style={styles.modalButtonPrimaryText}>
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  poiNumber: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  poiNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  poiImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardContent: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardCoords: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  imageCount: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f0f0ff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fff0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  goToEditorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goToEditorButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
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
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  thumbnailImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  imageUrl: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  removeImageText: {
    color: '#f44336',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  uploadContainer: {
    marginTop: 8,
  },
  uploadButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  modalActions: {
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
  },
  modalButtonSecondaryText: {
    color: '#666',
    fontSize: 16,
  },
  orDivider: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginVertical: 12,
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    marginBottom: 0,
  },
  addUrlButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addUrlButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addUrlButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
