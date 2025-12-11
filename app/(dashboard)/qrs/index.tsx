import React, { useEffect, useState } from 'react';
import { 
  Alert, Platform, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { QR, Tour } from '../../../src/types';
import { colors } from '../../../src/lib/theme';
import { Feather } from '@expo/vector-icons';

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
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Image,
  Badge,
  BadgeText,
  BadgeIcon,
  FlatList
} from '@gluestack-ui/themed';

import { 
  ArrowLeftIcon, 
  PlusIcon, 
  SmartphoneIcon,
  TrashIcon,
  CopyIcon,
  MapIcon,
  CheckIcon,
  XIcon
} from 'lucide-react-native';

export default function QRsList() {
  const router = useRouter();
  const [qrs, setQrs] = useState<QR[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [expirationHours, setExpirationHours] = useState<24 | 48 | 72>(24);

  useEffect(() => {
    fetchQRs();
    fetchTours();
  }, [activeTab]);

  async function fetchQRs() {
    try {
      const { data, error } = await supabase
        .from('qrs')
        .select('*, tours(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQrs(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  async function fetchTours() {
    try {
      const { data, error } = await supabase.from('tours').select('*');
      if (error) throw error;
      setTours(data || []);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function createQR() {
    if (!selectedTourId) {
      Alert.alert('Error', 'Por favor selecciona un tour');
      return;
    }

    setCreating(true);
    try {
      const code = `TOUR-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      const { error } = await supabase.from('qrs').insert({
        code,
        tour_id: selectedTourId,
        is_active: true,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;
      setModalVisible(false);
      setSelectedTourId('');
      setExpirationHours(24); 
      fetchQRs();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setCreating(false);
    }
  }

  async function deleteQR(id: string, code: string) {
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Eliminar el código "${code}"?`)) {
        try {
          const { error } = await supabase.from('qrs').delete().eq('id', id);
          if (error) throw error;
          setQrs(qrs.filter((q) => q.id !== id));
        } catch (error: any) {
          alert(`Error: ${error.message}`);
        }
      }
      return;
    }

    Alert.alert(
      'Eliminar QR',
      `¿Eliminar el código "${code}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
             // ... duplicate logic handling ...
             try {
              const { error } = await supabase.from('qrs').delete().eq('id', id);
              if (error) throw error;
              setQrs(qrs.filter((q) => q.id !== id));
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  }

  const copyToClipboard = async (text: string) => {
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(text);
      Alert.alert('Copiado', 'Código copiado al portapapeles');
    } else {
      Alert.alert('Código', text);
    }
  };

  const isExpired = (qr: QR) => {
    if (!qr.expires_at) return false;
    return new Date(qr.expires_at) < new Date();
  };

  const filteredQRs = qrs.filter(qr => {
    const expired = isExpired(qr);
    if (activeTab === 'active') {
      return qr.is_active && !expired;
    } else {
      return !qr.is_active || expired;
    }
  });

  const getExpirationLabel = (qr: QR) => {
    if (!qr.expires_at) return 'Sin caducidad';
    const date = new Date(qr.expires_at);
    return `Caduca: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg={colors.background}>
        <Spinner size="large" color={colors.primary} />
      </Box>
    );
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
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
             <Pressable onPress={() => router.push('/(dashboard)')} mb="$2">
              <HStack alignItems="center" space="xs">
                <Icon as={ArrowLeftIcon} size="sm" color={colors.primary} />
                <Text color={colors.primary} fontWeight="$semibold" size="sm">Volver al Dashboard</Text>
              </HStack>
            </Pressable>
            <Heading size="2xl" color={colors.textPrimary}>Códigos QR</Heading>
            <Text color={colors.textSecondary} size="sm" mt="$1">{filteredQRs.length} códigos en esta lista</Text>
          </VStack>

          <Button 
            size="md" 
            variant="solid" 
            action="primary" 
            onPress={() => setModalVisible(true)} 
            rounded="$xl"
            bg={colors.brand.orange}
          >
             <ButtonIcon as={PlusIcon} mr="$2" color={colors.textOnPrimary} />
             <ButtonText fontWeight="$bold" color={colors.textOnPrimary}>Generar</ButtonText>
          </Button>
        </HStack>
      </Box>

      {/* Tabs */}
      <HStack bg={colors.surface} px="$5" borderBottomWidth={1} borderBottomColor={colors.border}>
         <Pressable 
           py="$3" mr="$6" 
           borderBottomWidth={2} 
           borderBottomColor={activeTab === 'active' ? colors.primary : 'transparent'}
           onPress={() => setActiveTab('active')}
         >
           <Text color={activeTab === 'active' ? colors.primary : colors.textSecondary} fontWeight={activeTab === 'active' ? '$bold' : '$medium'}>Activos</Text>
         </Pressable>
         <Pressable 
           py="$3" 
           borderBottomWidth={2} 
           borderBottomColor={activeTab === 'inactive' ? colors.primary : 'transparent'}
           onPress={() => setActiveTab('inactive')}
         >
           <Text color={activeTab === 'inactive' ? colors.primary : colors.textSecondary} fontWeight={activeTab === 'inactive' ? '$bold' : '$medium'}>Inactivos / Caducados</Text>
         </Pressable>
      </HStack>

      {/* QR List */}
      <FlatList
        data={filteredQRs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        numColumns={Platform.OS === 'web' ? 2 : 1}
        key={Platform.OS === 'web' ? 'web' : 'mobile'}
        renderItem={({ item }) => (
           <Box 
             flex={1} 
             bg={colors.surface} 
             p="$4" 
             rounded="$2xl" 
             m="$2"
             borderWidth={1}
             borderColor={colors.border}
             maxWidth={Platform.OS === 'web' ? '48%' : '100%'}
           >
             <Box alignItems="center" mb="$4" position="relative">
               {/* QR Image Logic - Using URI still as Gluestack Image supports it */}
               <Image 
                  source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${item.code}` }}
                  alt="QR Code"
                  size="xl"
                  rounded="$lg"
                  opacity={isExpired(item) ? 0.5 : 1}
               />
               {isExpired(item) && (
                 <Badge action="error" variant="solid" position="absolute" top="40%" transform={[{ rotate: '-15deg' }]}>
                   <BadgeText>CADUCADO</BadgeText>
                 </Badge>
               )}
             </Box>

             <Box alignItems="center" mb="$4">
               <Pressable onPress={() => copyToClipboard(item.code)}>
                 <Heading size="md" color={colors.textPrimary} textAlign="center">{item.code}</Heading>
                 <HStack alignItems="center" justifyContent="center" space="xs" mt="$1">
                   <Icon as={CopyIcon} size="xs" color={colors.textMuted} />
                   <Text size="xs" color={colors.textMuted}>Toca para copiar</Text>
                 </HStack>
               </Pressable>

               <HStack bg={colors.background} px="$2" py="$1" rounded="$md" mt="$3" alignItems="center" space="xs" borderWidth={1} borderColor={colors.border}>
                 <Icon as={MapIcon} size="xs" color={colors.primary} />
                 <Text size="xs" color={colors.primary} fontWeight="$medium">{(item as any).tours?.name || 'Tour desconocido'}</Text>
               </HStack>

               <HStack mt="$3" alignItems="center" space="sm">
                 <Box w={8} h={8} rounded="$full" bg={item.is_active && !isExpired(item) ? '$green500' : colors.textMuted} />
                 <VStack>
                    <Text size="sm" fontWeight="$bold" color={colors.textPrimary}>{item.is_active ? (isExpired(item) ? 'Caducado' : 'Activo') : 'Inactivo'}</Text>
                    <Text size="xs" color={colors.textSecondary}>{getExpirationLabel(item)}</Text>
                 </VStack>
               </HStack>
             </Box>

             <Pressable position="absolute" top={12} right={12} onPress={() => deleteQR(item.id, item.code)}>
                <Icon as={TrashIcon} color="$red500" size="sm" />
             </Pressable>
           </Box>
        )}
        ListEmptyComponent={
          <Box alignItems="center" py="$16">
            <Icon as={SmartphoneIcon} size="4xl" color={colors.textMuted} mb="$4" />
            <Heading size="lg" color={colors.textPrimary} mb="$2">No hay códigos QR {activeTab === 'active' ? 'activos' : 'inactivos'}</Heading>
            <Text color={colors.textSecondary} mb="$6" textAlign="center">
              {activeTab === 'active' 
                ? 'Genera un nuevo código para empezar' 
                : 'Los códigos caducados o desactivados aparecerán aquí'}
            </Text>
            {activeTab === 'active' && (
              <Button size="lg" variant="solid" action="primary" onPress={() => setModalVisible(true)} bg={colors.brand.orange}>
                <ButtonText color={colors.textOnPrimary}>Generar QR</ButtonText>
              </Button>
            )}
          </Box>
        }
      />

      {/* Create QR Modal */}
      <Modal
        isOpen={modalVisible}
        onClose={() => setModalVisible(false)}
        finalFocusRef={null}
      >
        <ModalBackdrop bg="$backgroundDark900" opacity={0.8} />
        <ModalContent 
           width="90%" 
           maxWidth={400}
           bg={colors.surface}
           borderWidth={1}
           borderColor={colors.border}
        >
           <ModalHeader>
             <Heading size="lg" color={colors.textPrimary}>Generar Código QR</Heading>
             <ModalCloseButton>
               <Icon as={XIcon} color={colors.textSecondary} />
             </ModalCloseButton>
           </ModalHeader>
           <ModalBody>
             <Text size="sm" color={colors.textSecondary} mb="$4">Configura la validez y el tour asociado.</Text>
             
             <VStack space="lg">
                <Box>
                   <Text fontWeight="$bold" mb="$2" color={colors.textPrimary}>Validez:</Text>
                   <HStack space="md">
                      {[24, 48, 72].map((hours) => (
                        <Pressable 
                          key={hours} 
                          flex={1} 
                          py="$2" 
                          borderWidth={1} 
                          borderColor={expirationHours === hours ? colors.borderFocus : colors.border}
                          bg={expirationHours === hours ? colors.brand.orangeDark : colors.background}
                          rounded="$md"
                          alignItems="center"
                          onPress={() => setExpirationHours(hours as 24 | 48 | 72)}
                        >
                           <Text color={expirationHours === hours ? colors.textOnPrimary : colors.textSecondary} fontWeight="$bold">{hours}h</Text>
                        </Pressable>
                      ))}
                   </HStack>
                </Box>

                <Box>
                  <Text fontWeight="$bold" mb="$2" color={colors.textPrimary}>Tour:</Text>
                   {tours.length === 0 ? (
                      <Box bg="$amber900" p="$3" rounded="$md" borderColor="$amber700" borderWidth={1}>
                        <Text color="$amber100" size="sm">No hay tours disponibles. Crea un tour primero.</Text>
                      </Box>
                   ) : (
                      <Box h={200} borderWidth={1} borderColor={colors.border} rounded="$md" bg={colors.background}>
                        <FlatList 
                          data={tours}
                          keyExtractor={(item) => item.id}
                          renderItem={({item}) => (
                             <Pressable 
                               p="$3" 
                               borderBottomWidth={1} 
                               borderBottomColor={colors.border}
                               bg={selectedTourId === item.id ? colors.brand.orangeDark : colors.background}
                               onPress={() => setSelectedTourId(item.id)}
                               flexDirection="row"
                               justifyContent="space-between"
                               alignItems="center"
                             >
                                <Text color={selectedTourId === item.id ? colors.textOnPrimary : colors.textPrimary} fontWeight={selectedTourId === item.id ? '$bold' : '$normal'}>{item.name}</Text>
                                {selectedTourId === item.id && <Icon as={CheckIcon} color={colors.textOnPrimary} size="sm" />}
                             </Pressable>
                          )}
                        />
                      </Box>
                   )}
                </Box>
             </VStack>
           </ModalBody>
           <ModalFooter>
             <Button variant="outline" action="secondary" onPress={() => setModalVisible(false)} mr="$3" borderColor={colors.border}>
               <ButtonText color={colors.textSecondary}>Cancelar</ButtonText>
             </Button>
             <Button action="primary" onPress={createQR} isDisabled={!selectedTourId || creating} bg={colors.brand.orange}>
               <ButtonText color={colors.textOnPrimary}>{creating ? 'Generando...' : 'Generar QR'}</ButtonText>
             </Button>
           </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
