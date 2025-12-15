import React, { useEffect, useState, useRef } from 'react';
import { 
  Alert, Image, Dimensions, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { POI } from '../../../src/types';
import { colors } from '../../../src/lib/theme';
import WebMapEditor from '../../../src/components/WebMapEditor';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioPlayer } from 'expo-audio';
import { generateSpeech } from '../../../src/lib/elevenlabs';

import { 
  Box, 
  Text, 
  Heading, 
  Button, 
  ButtonText, 
  ButtonIcon,
  HStack, 
  VStack, 
  Spinner,
  Pressable,
  Icon,
  Input,
  InputField,
  Textarea,
  TextareaInput,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FlatList
} from '@gluestack-ui/themed';

import { 
  ArrowLeftIcon, 
  MapIcon, 
  ListIcon, 
  Edit2Icon, 
  TrashIcon, 
  MapPinIcon, 
  UploadIcon, 
  XIcon,
  PlayCircleIcon,
  Wand2Icon
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Helper to upload image to Supabase
async function uploadImageToSupabase(uri: string): Promise<string | null> {
  try {
    let fileData: ArrayBuffer | Blob;
    let fileName = '';
    let contentType = 'image/jpeg'; 

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      fileData = blob; 
      fileName = `poi_${Date.now()}.jpg`; 
      contentType = blob.type;
    } else {
      return null; 
    }

    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, fileData, {
        contentType,
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
}

async function uploadAudioToSupabase(uri: string): Promise<string | null> {
  try {
    let fileData: ArrayBuffer | Blob;
    let fileName = '';
    let contentType = 'audio/mpeg';

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      fileData = blob;
      fileName = `audio_${Date.now()}.mp3`; 
      contentType = blob.type || 'audio/mpeg';
    } else {
       return null;
    }

    const { data, error } = await supabase.storage
      .from('audios')
      .upload(fileName, fileData, {
        contentType,
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('audios')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Audio upload error:', error);
    return null;
  }
}

async function uploadAudioDataToSupabase(audioData: ArrayBuffer): Promise<string | null> {
  try {
    const fileName = `audio_gen_${Date.now()}.mp3`;
    const { data, error } = await supabase.storage
      .from('audios')
      .upload(fileName, audioData, {
        contentType: 'audio/mpeg',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('audios')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Audio upload error:', error);
    return null;
  }
}


function Tabs({ activeTab, onTabChange }) {
  return (
    <HStack bg={colors.background} borderBottomWidth={1} borderBottomColor={colors.border}>
      <Pressable 
        flex={1} 
        py="$4" 
        alignItems="center" 
        borderBottomWidth={2} 
        bg={colors.surface}
        borderBottomColor={activeTab === 'map' ? colors.primary : 'transparent'}
        onPress={() => onTabChange('map')}
      >
        <HStack space="xs" alignItems="center">
          <Icon as={MapIcon} color={activeTab === 'map' ? colors.primary : colors.textSecondary} size="sm" />
          <Text color={activeTab === 'map' ? colors.primary : colors.textSecondary} fontWeight={activeTab === 'map' ? '$bold' : '$medium'}>Crear en Mapa</Text>
        </HStack>
      </Pressable>
      
      <Pressable 
        flex={1} 
        py="$4" 
        alignItems="center" 
        borderBottomWidth={2} 
        bg={colors.surface}
        borderBottomColor={activeTab === 'list' ? colors.primary : 'transparent'}
        onPress={() => onTabChange('list')}
      >
        <HStack space="xs" alignItems="center">
           <Icon as={ListIcon} color={activeTab === 'list' ? colors.primary : colors.textSecondary} size="sm" />
           <Text color={activeTab === 'list' ? colors.primary : colors.textSecondary} fontWeight={activeTab === 'list' ? '$bold' : '$medium'}>Ver Listado</Text>
        </HStack>
      </Pressable>
    </HStack>
  );
}

export default function POIManagementScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit State
  const [editingPoi, setEditingPoi] = useState<POI | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editAudio, setEditAudio] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const inputRef = useRef<any>(null);
  
  const player = useAudioPlayer(null);

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
      setActiveTab('list'); 
    }
    setLoading(false);
  }

  async function handleDeletePoi(id: string) {
     if (Platform.OS === 'web') {
        const confirm = window.confirm('¿Estás seguro de eliminar este POI? Se quitará de todos los tours.');
        if (!confirm) return;
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
        images: editImages,
        audio_url: editAudio
      })
      .eq('id', editingPoi.id);

    if (error) {
       Alert.alert('Error', 'No se pudo actualizar el POI: ' + error.message);
    } else {
       Alert.alert('Éxito', 'Punto de interés actualizado.');

       // Sync with tours
       const updatedPoiData = {
         ...editingPoi,
         title: editTitle,
         description: editDesc,
         images: editImages,
         audio_url: editAudio
       };
       await updateToursWithPoi(updatedPoiData);

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
    setEditAudio(poi.audio_url || null);
    setShowEditModal(true);
  };

  async function playSound(url: string) {
    try {
      player.replace({ uri: url });
      player.play();
    } catch (error) {
      console.error('Error playing sound', error);
      Alert.alert('Error', 'No se pudo reproducir el audio');
    }
  }

  async function updateToursWithPoi(updatedPoi: POI) {
    try {
      const { data: tours, error } = await supabase.from('tours').select('*');
      if (error) throw error;

      const toursToUpdate = tours.filter((tour: any) => 
        tour.route_data?.pois?.some((p: any) => p.id === updatedPoi.id)
      );

      if (toursToUpdate.length > 0) {
        const updates = toursToUpdate.map(tour => {
          const newPois = tour.route_data.pois.map((p: any) => 
            p.id === updatedPoi.id ? updatedPoi : p
          );
          
          return supabase
            .from('tours')
            .update({
              route_data: {
                ...tour.route_data,
                pois: newPois
              }
            })
            .eq('id', tour.id);
        });

        await Promise.all(updates);
      }
    } catch (err) {
      console.error('Error syncing tours:', err);
    }
  }

  return (
    <Box flex={1} bg={colors.background}>
      {/* Header */}
      <Box 
        pt="$16" 
        pb="$5" 
        px="$5" 
        bg={colors.surface} 
        borderBottomWidth={1}
        borderBottomColor={colors.border}
      >
        <Pressable onPress={() => router.push('/(dashboard)')} mb="$4">
          <HStack alignItems="center" space="xs">
            <Icon as={ArrowLeftIcon} size="sm" color={colors.primary} />
            <Text color={colors.primary} fontWeight="$semibold" size="sm">Volver</Text>
          </HStack>
        </Pressable>
        <Heading size="xl" color={colors.textPrimary}>Gestión de Puntos de Interés</Heading>
      </Box>

      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'map' ? (
        <Box flex={1}>
          <Box bg={colors.surface} p="$2" alignItems="center" borderBottomWidth={1} borderColor={colors.border}>
            <Text color={colors.brand.orange} size="sm">Haz clic en el mapa para situar un nuevo POI y guárdalo.</Text>
          </Box>
           <WebMapEditor 
             initialRouteData={{ waypoints: [], pois: [] }} 
             onRouteDataChange={() => {}}
             onSaveRoute={() => {}} 
             onSavePoi={(poi) => handleCreatePoi(poi)} 
             mode="poi-only" 
           />
        </Box>
      ) : (
        <Box flex={1}>
          {loading ? (
             <Box flex={1} justifyContent="center" alignItems="center">
                <Spinner size="large" color={colors.primary} />
             </Box>
          ) : (
            <FlatList
              data={pois}
              keyExtractor={(item: any) => item.id}
              contentContainerStyle={{ padding: 20, gap: 12 }}
              renderItem={({ item }: { item: any }) => (
                <Box
                  bg={colors.surface}
                  p="$4"
                  rounded="$xl"
                  borderWidth={1}
                  borderColor={colors.border}
                >
                  <HStack justifyContent="space-between" alignItems="flex-start">
                    <VStack flex={1} mr="$3">
                      <Heading size="sm" color={colors.textPrimary} mb="$1">{item.title}</Heading>
                      <Text color={colors.textSecondary} size="sm" numberOfLines={2} mb="$2">{item.description}</Text>
                      {item.audio_url && (
                        <HStack alignItems="center" space="xs" mb="$2">
                          <Icon as={PlayCircleIcon} size="xs" color={colors.brand.orange} />
                          <Text color={colors.brand.orange} size="xs">Audio disponible</Text>
                        </HStack>
                      )}
                      <HStack bg={colors.background} px="$2" py="$1" rounded="$md" alignSelf="flex-start" alignItems="center" space="xs" borderWidth={1} borderColor={colors.border}>
                        <Icon as={MapPinIcon} size="xs" color={colors.textMuted} />
                        <Text size="xs" color={colors.textMuted}>
                          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                        </Text>
                      </HStack>
                    </VStack>

                    <HStack alignItems="center">
                      <Button variant="link" size="sm" onPress={() => openEditModal(item)} p="$2">
                        <Icon as={Edit2Icon} color={colors.primary} size="sm" />
                      </Button>
                      <Button variant="link" size="sm" onPress={() => handleDeletePoi(item.id)} p="$2">
                        <Icon as={TrashIcon} color="$red500" size="sm" />
                      </Button>
                    </HStack>
                  </HStack>
                </Box>
              )}
              ListEmptyComponent={
                <Box py="$10" alignItems="center">
                  <Text color={colors.textMuted}>No hay puntos de interés creados todavía.</Text>
                </Box>
              }
            />
          )}

          {/* Edit Modal */}
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            finalFocusRef={null}
          >
            <ModalBackdrop bg="$backgroundDark900" opacity={0.8} />
            <ModalContent 
              width="90%" 
              maxWidth={500}
              bg={colors.surface}
              borderWidth={1}
              borderColor={colors.border}
            >
               <ModalHeader>
                 <Heading size="lg" color={colors.textPrimary}>Editar Punto de Interés</Heading>
                 <ModalCloseButton>
                   <Icon as={XIcon} color={colors.textSecondary} />
                 </ModalCloseButton>
               </ModalHeader>
               <ModalBody>
                 <VStack space="md">
                    <FormControl>
                      <FormControlLabel mb="$1"><FormControlLabelText color={colors.textSecondary}>Título</FormControlLabelText></FormControlLabel>
                      <Input variant="outline" borderWidth={1} borderColor={colors.border} bg={colors.inputBackground}>
                        <InputField value={editTitle} onChangeText={setEditTitle} color={colors.textPrimary}/>
                      </Input>
                    </FormControl>

                    <FormControl>
                      <FormControlLabel mb="$1"><FormControlLabelText color={colors.textSecondary}>Descripción</FormControlLabelText></FormControlLabel>
                      <Textarea variant="default" borderWidth={1} borderColor={colors.border} bg={colors.inputBackground}>
                         <TextareaInput value={editDesc} onChangeText={setEditDesc} color={colors.textPrimary} />
                      </Textarea>
                    </FormControl>

                    <FormControl>
                      <FormControlLabel mb="$1"><FormControlLabelText color={colors.textSecondary}>Audio Guía</FormControlLabelText></FormControlLabel>
                      <HStack space="sm" alignItems="center" flexWrap="wrap">
                         {editAudio ? (
                           <HStack space="sm" alignItems="center" bg={colors.background} p="$2" rounded="$md" borderWidth={1} borderColor={colors.border} mb="$2">
                             <Button size="xs" variant="link" onPress={() => playSound(editAudio)}>
                               <Icon as={PlayCircleIcon} size="sm" color={colors.brand.orange} />
                               <ButtonText ml="$1" color={colors.textPrimary}>Escuchar</ButtonText>
                             </Button>
                             <Pressable onPress={() => setEditAudio(null)}>
                               <Icon as={XIcon} size="xs" color="$red500" />
                             </Pressable>
                           </HStack>
                         ) : (
                           <Text color={colors.textMuted} size="sm" mb="$2" mr="$2">Sin audio</Text>
                         )}
                         
                         <Button 
                            size="sm"
                            variant="outline"
                            borderColor={colors.border}
                            onPress={async () => {
                              try {
                                const result = await DocumentPicker.getDocumentAsync({
                                  type: 'audio/*',
                                  copyToCacheDirectory: true,
                                });
                                if (result.canceled) return;
                                setUploading(true);
                                const asset = result.assets[0];
                                const uploadedUrl = await uploadAudioToSupabase(asset.uri);
                                if (uploadedUrl) {
                                  setEditAudio(uploadedUrl);
                                } else {
                                  Alert.alert('Error', 'Error subiendo el audio');
                                }
                              } catch (err) {
                                Alert.alert('Error', 'Error seleccionando audio');
                              } finally {
                                setUploading(false);
                              }
                            }}
                         >
                            <ButtonText color={colors.textPrimary}>Subir Audio</ButtonText>
                            <ButtonIcon as={UploadIcon} ml="$2" color={colors.textPrimary}/>
                         </Button>

                         <Button 
                            size="sm"
                            variant="outline"
                            borderColor={colors.brand.orange}
                            isDisabled={!editDesc || generatingAudio}
                            onPress={async () => {
                              if (!editDesc) {
                                Alert.alert('Error', 'Debes escribir una descripción primero.');
                                return;
                              }
                              try {
                                setGeneratingAudio(true);
                                const audioBuffer = await generateSpeech(editDesc);
                                const uploadedUrl = await uploadAudioDataToSupabase(audioBuffer);
                                
                                if (uploadedUrl) {
                                  setEditAudio(uploadedUrl);
                                  Alert.alert('Éxito', 'Audio generado y guardado correctamente.');
                                } else {
                                  Alert.alert('Error', 'No se pudo guardar el audio generado.');
                                }
                              } catch (err: any) {
                                console.error(err);
                                Alert.alert('Error generando audio', err.message);
                              } finally {
                                setGeneratingAudio(false);
                              }
                            }}
                         >
                            {generatingAudio ? (
                              <Spinner size="small" color={colors.brand.orange} />
                            ) : (
                              <HStack alignItems="center" space="xs">
                                <ButtonText color={colors.brand.orange}>Generar Audio IA</ButtonText>
                                <ButtonIcon as={Wand2Icon} ml="$1" color={colors.brand.orange} />
                              </HStack>
                            )}
                         </Button>

                      </HStack>
                    </FormControl>

                    <FormControl>
                      <FormControlLabel mb="$1"><FormControlLabelText color={colors.textSecondary}>Imágenes</FormControlLabelText></FormControlLabel>
                      <HStack space="sm" mb="$2">
                         <Input flex={1} variant="outline" borderWidth={1} borderColor={colors.border} bg={colors.inputBackground}>
                            <InputField 
                              ref={inputRef}
                              placeholder="https://..." 
                              placeholderTextColor={colors.textMuted}
                              color={colors.textPrimary}
                              onSubmitEditing={(e) => {
                                if(e.nativeEvent.text) setEditImages([...editImages, e.nativeEvent.text]);
                                inputRef.current?.clear();
                              }}
                            />
                         </Input>
                         <Button 
                            onPress={async () => {
                              try {
                                const result = await DocumentPicker.getDocumentAsync({
                                  type: 'image/*',
                                  copyToCacheDirectory: true,
                                });
                                if (result.canceled) return;
                                setUploading(true);
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
                                setUploading(false);
                              }
                            }}
                            bg={colors.brand.orange}
                         >
                            {uploading ? <Spinner color={colors.textOnPrimary} /> : <ButtonIcon as={UploadIcon} color={colors.textOnPrimary} />}
                         </Button>
                      </HStack>

                      <HStack space="md" flexWrap="wrap">
                        {editImages.map((img, idx) => (
                           <Box key={idx} position="relative">
                             <Image source={{uri: img}} style={{width: 60, height: 60, borderRadius: 4}} />
                             <Pressable 
                               position="absolute" top={-5} right={-5} bg="$red500" rounded="$full" p="$1"
                               onPress={() => setEditImages(editImages.filter((_, i) => i !== idx))}
                             >
                                <Icon as={XIcon} size="xs" color="$white" />
                             </Pressable>
                           </Box>
                        ))}
                      </HStack>
                    </FormControl>
                 </VStack>
               </ModalBody>
               <ModalFooter>
                 <Button variant="outline" action="secondary" onPress={() => setShowEditModal(false)} mr="$3" borderColor={colors.border}>
                   <ButtonText color={colors.textSecondary}>Cancelar</ButtonText>
                 </Button>
                 <Button action="primary" onPress={handleUpdatePoi} bg={colors.brand.orange}>
                   <ButtonText color={colors.textOnPrimary}>Guardar</ButtonText>
                 </Button>
               </ModalFooter>
            </ModalContent>
          </Modal>

        </Box>
      )}
    </Box>
  );
}
