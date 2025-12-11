import React, { useState, useEffect } from 'react';
import { Alert, FlatList, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import WebMapEditor from '../../../src/components/WebMapEditor';
import { RouteData, POI } from '../../../src/types';
import { colors } from '../../../src/lib/theme';
import { Feather } from '@expo/vector-icons';

import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Input,
  InputField,
  Textarea,
  TextareaInput,
  Button,
  ButtonText,
  ButtonIcon,
  ButtonSpinner,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  ScrollView,
  Pressable,
  Icon,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Spinner
} from '@gluestack-ui/themed';
import { 
  ArrowLeftIcon, 
  MapPinIcon, 
  PlusIcon, 
  XIcon, 
  CheckIcon,
  MapIcon
} from 'lucide-react-native';

export default function EditTour() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [routeData, setRouteData] = useState<RouteData>({ waypoints: [], pois: [] });
  const [selectedPois, setSelectedPois] = useState<POI[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
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
      const { data: tourData, error: tourError } = await supabase
        .from('tours')
        .select('*')
        .eq('id', id)
        .single();

      if (tourError) throw tourError;
      
      if (tourData) {
        setName(tourData.name);
        setDescription(tourData.description);
        setRouteData(tourData.route_data || { waypoints: [], pois: [] });
      }

      const { data: tourPoisData, error: poisError } = await supabase
        .from('tour_pois')
        .select('*, poi:pois(*)')
        .eq('tour_id', id)
        .order('order');

      if (poisError) throw poisError;

      if (tourPoisData) {
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
      const updatedRouteData: RouteData = {
        waypoints: routeData.waypoints,
        pois: selectedPois 
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

      const { error: deleteError } = await supabase
        .from('tour_pois')
        .delete()
        .eq('tour_id', id);
        
      if (deleteError) throw deleteError;

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

  const mapRouteData: RouteData = {
     waypoints: routeData.waypoints,
     pois: selectedPois
  };

  const hasRoute = (routeData.waypoints?.length || 0) > 0;

  if (fetching) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg={colors.background}>
        <Spinner size="large" color={colors.primary} />
        <Text mt="$4" color={colors.textSecondary}>Cargando tour...</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg={colors.background}>
      <ScrollView>
        {/* Header */}
        <Box 
          pt="$16" 
          pb="$5" 
          px="$5" 
          bg={colors.surface} 
          borderBottomWidth={1} 
          borderBottomColor={colors.border}
        >
          <HStack justifyContent="space-between" alignItems="flex-start">
             <VStack flex={1}>
                <Pressable onPress={() => router.push('/(dashboard)/tours')} mb="$2">
                  <HStack alignItems="center" space="xs">
                    <Icon as={ArrowLeftIcon} size="sm" color={colors.primary} />
                    <Text color={colors.primary} fontWeight="$semibold" size="sm">Volver</Text>
                  </HStack>
                </Pressable>
                <Heading size="2xl" color={colors.textPrimary}>Editar Tour</Heading>
             </VStack>
             <Box bg={colors.background} px="$2" py="$1" rounded="$md" mt="$8" borderWidth={1} borderColor={colors.border}>
                <Text size="xs" color={colors.textMuted} fontFamily="monospace">ID: {id}</Text>
             </Box>
          </HStack>
        </Box>

        <VStack space="xl" p="$5" pb="$20">

          {/* Basic Info */}
          <Box 
             bg={colors.surface} 
             p="$5" 
             rounded="$2xl" 
             borderWidth={1}
             borderColor={colors.border}
          >
            <Heading size="md" mb="$4" color={colors.textPrimary}>Información Básica</Heading>
            
            <VStack space="md">
              <FormControl>
                <FormControlLabel mb="$1">
                  <FormControlLabelText color={colors.textSecondary}>Nombre del Tour *</FormControlLabelText>
                </FormControlLabel>
                <Input variant="outline" size="md" borderWidth={1} borderColor={colors.border} bg={colors.inputBackground}>
                  <InputField 
                    placeholder="Ej: Tour Histórico del Centro" 
                    value={name} 
                    onChangeText={setName} 
                    color={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                  />
                </Input>
              </FormControl>

              <FormControl>
                <FormControlLabel mb="$1">
                  <FormControlLabelText color={colors.textSecondary}>Descripción *</FormControlLabelText>
                </FormControlLabel>
                <Textarea size="md" borderWidth={1} borderColor={colors.border} bg={colors.inputBackground}>
                  <TextareaInput 
                    placeholder="Describe el tour..." 
                    value={description} 
                    onChangeText={setDescription} 
                    color={colors.textPrimary}
                    placeholderTextColor={colors.textMuted}
                  />
                </Textarea>
              </FormControl>
            </VStack>
          </Box>

          {/* POI Selection Section */}
          <Box 
            bg={colors.surface} 
            p="$5" 
            rounded="$2xl" 
            borderWidth={1}
            borderColor={colors.border}
          >
             <HStack justifyContent="space-between" alignItems="center" mb="$4">
               <Heading size="md" color={colors.textPrimary}>Puntos de Interés</Heading>
               <Button 
                size="xs" 
                variant="solid" 
                action="primary" 
                onPress={() => setShowPoiSelector(true)} 
                rounded="$lg"
                bg={colors.brand.orange}
               >
                 <ButtonIcon as={PlusIcon} mr="$1" color={colors.textOnPrimary} />
                 <ButtonText color={colors.textOnPrimary}>Seleccionar</ButtonText>
               </Button>
             </HStack>
             
             <Text size="sm" color={colors.textSecondary} mb="$4">
               Gestiona los puntos de interés que componen este tour.
             </Text>

             {selectedPois.length === 0 ? (
               <Box bg={colors.background} p="$4" rounded="$lg" alignItems="center" borderWidth={1} borderColor={colors.border}>
                 <Text color={colors.textMuted} size="sm">No hay POIs seleccionados.</Text>
               </Box>
             ) : (
               <VStack space="sm">
                 {selectedPois.map((poi, index) => (
                   <HStack 
                    key={poi.id} 
                    bg={colors.background} 
                    p="$3" 
                    rounded="$lg" 
                    alignItems="center" 
                    justifyContent="space-between" 
                    borderWidth={1} 
                    borderColor={colors.border}
                   >
                      <HStack space="md" alignItems="center" flex={1}>
                        <Text fontWeight="$bold" color={colors.primary}>{index + 1}.</Text>
                        <Text color={colors.textPrimary} numberOfLines={1}>{poi.title}</Text>
                      </HStack>
                      <Pressable onPress={() => togglePoiSelection(poi)}>
                        <Icon as={XIcon} color="$red500" size="sm" />
                      </Pressable>
                   </HStack>
                 ))}
               </VStack>
             )}
          </Box>

          {/* Map Section */}
          <Box 
            bg={colors.surface} 
            p="$5" 
            rounded="$2xl" 
            borderWidth={1}
            borderColor={colors.border}
          >
            <Heading size="md" mb="$2" color={colors.textPrimary}>Ruta Visual</Heading>
            <Text size="sm" color={colors.textSecondary} mb="$4">
               Edita la ruta (camino azul). Los POIs se actualizan automáticamente.
            </Text>

            {hasRoute && (
               <HStack bg="$green900" p="$3" rounded="$lg" mb="$4" alignItems="center" space="sm" borderColor="$green700" borderWidth={1}>
                  <Icon as={MapIcon} color="$green400" size="sm" />
                  <Text color="$green100" size="sm" fontWeight="$medium">Ruta guardada con {routeData.waypoints?.length} puntos</Text>
               </HStack>
            )}

            <Box h={400} rounded="$xl" overflow="hidden" borderWidth={1} borderColor={colors.border}>
               <WebMapEditor 
                 initialRouteData={mapRouteData}
                 onRouteDataChange={(newData) => {
                    setRouteData(prev => ({...prev, waypoints: newData.waypoints}));
                 }}
               />
            </Box>
          </Box>

          {/* Actions */}
          <VStack space="md" mb="$10">
            <Button 
                size="xl" 
                variant="solid" 
                action="primary" 
                onPress={updateTour} 
                isDisabled={loading} 
                rounded="$xl"
                bg={colors.brand.orange}
                sx={{
                  ':hover': { bg: colors.brand.orangeDark },
                  ':active': { bg: colors.brand.orangeDark }
                }}
            >
              {loading && <ButtonSpinner color={colors.textOnPrimary} mr="$2" />}
              <ButtonText fontWeight="$bold" color={colors.textOnPrimary}>Guardar Cambios</ButtonText>
            </Button>

            <Button size="lg" variant="link" action="secondary" onPress={() => router.push('/(dashboard)/tours')}>
              <ButtonText color={colors.textSecondary}>Cancelar</ButtonText>
            </Button>
          </VStack>

        </VStack>
      </ScrollView>

      {/* POI Selector Modal */}
      <Modal
        isOpen={showPoiSelector}
        onClose={() => setShowPoiSelector(false)}
        finalFocusRef={null}
      >
        <ModalBackdrop bg="$backgroundDark900" opacity={0.8} />
        <ModalContent 
          maxHeight="80%" 
          width="90%" 
          maxWidth={500}
          bg={colors.surface}
          borderWidth={1}
          borderColor={colors.border}
        >
          <ModalHeader>
            <Heading size="lg" color={colors.textPrimary}>Seleccionar POIs</Heading>
            <ModalCloseButton>
              <Icon as={XIcon} color={colors.textSecondary} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <Box h={400}> 
              <FlatList
                data={globalPois}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingVertical: 10 }}
                renderItem={({item}) => {
                  const isSelected = selectedPois.find(p => p.id === item.id);
                  return (
                    <Pressable
                       onPress={() => togglePoiSelection(item)}
                       mb="$2"
                    >
                      <HStack 
                        p="$3" 
                        rounded="$lg" 
                        bg={isSelected ? colors.brand.orangeDark : colors.background} 
                        borderWidth={1} 
                        borderColor={isSelected ? colors.borderFocus : colors.border}
                        alignItems="center"
                        justifyContent="space-between"
                      >
                         <VStack flex={1} mr="$2">
                           <Text fontWeight={isSelected ? '$bold' : '$normal'} color={colors.textPrimary}>{item.title}</Text>
                           <Text size="xs" color={isSelected ? colors.textOnPrimary : colors.textSecondary} numberOfLines={1}>{item.description}</Text>
                         </VStack>
                         {isSelected && <Icon as={CheckIcon} color={colors.textOnPrimary} />}
                      </HStack>
                    </Pressable>
                  );
                }}
                ListEmptyComponent={<Text textAlign="center" mt="$4" color={colors.textMuted}>No hay POIs disponibles.</Text>}
              />
            </Box>
          </ModalBody>
          <ModalFooter>
             <Button
              size="sm"
              action="primary"
              bg={colors.brand.orange}
              onPress={() => setShowPoiSelector(false)}
            >
               <ButtonText color={colors.textOnPrimary}>Listo</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
}
