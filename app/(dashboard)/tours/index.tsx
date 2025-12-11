import React, { useEffect, useState } from 'react';
import { FlatList, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { Tour } from '../../../src/types';
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
  Badge,
  BadgeText,
  BadgeIcon
} from '@gluestack-ui/themed';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  MapPinIcon, 
  NavigationIcon, 
  Edit2Icon, 
  TrashIcon, 
  MapIcon 
} from 'lucide-react-native';

export default function ToursList() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTours();
  }, []);

  async function fetchTours() {
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTours(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTour(id: string, name: string) {
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Estás seguro de que quieres eliminar "${name}"?`)) {
        try {
          const { error } = await supabase.from('tours').delete().eq('id', id);
          if (error) throw error;
          setTours(tours.filter((t) => t.id !== id));
        } catch (error: any) {
          alert(`Error: ${error.message}`);
        }
      }
      return;
    }

    Alert.alert(
      'Eliminar Tour',
      `¿Estás seguro de que quieres eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('tours').delete().eq('id', id);
              if (error) throw error;
              setTours(tours.filter((t) => t.id !== id));
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  }

  const getPoiCount = (tour: Tour) => {
    return tour.route_data?.pois?.length || 0;
  };

  const getWaypointCount = (tour: Tour) => {
    return tour.route_data?.waypoints?.length || 0;
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
            <Heading size="2xl" color={colors.textPrimary}>Tours</Heading>
            <Text color={colors.textSecondary} size="sm" mt="$1">{tours.length} tours creados</Text>
          </VStack>

          <Button 
            size="md" 
            variant="solid" 
            action="primary" 
            bg={colors.brand.orange} 
            rounded="$xl"
            onPress={() => router.push('/(dashboard)/tours/create')}
          >
            <ButtonIcon as={PlusIcon} color={colors.textOnPrimary} mr="$2" />
            <ButtonText fontWeight="$bold" color={colors.textOnPrimary}>Nuevo</ButtonText>
          </Button>
        </HStack>
      </Box>

      {/* Tours List */}
      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(dashboard)/tours/${item.id}`)}
          >
            {({ pressed }) => (
              <Box
                bg={colors.surface}
                p="$5"
                rounded="$2xl"
                borderWidth={1}
                borderColor={pressed ? colors.primary : colors.border}
                style={{ opacity: pressed ? 0.9 : 1 }}
              >
                <HStack justifyContent="space-between" alignItems="flex-start" mb="$2">
                  <Heading size="md" color={colors.textPrimary} numberOfLines={1} flex={1} mr="$3">
                    {item.name}
                  </Heading>
                  
                  <HStack space="sm">
                    {getPoiCount(item) > 0 && (
                      <Badge size="md" variant="solid" bg="$blue900" borderRadius="$lg" borderColor="$blue700" borderWidth={1}>
                        <BadgeIcon as={MapPinIcon} color="$blue400" mr="$1" />
                        <BadgeText color="$blue100">{getPoiCount(item)} POIs</BadgeText>
                      </Badge>
                    )}
                    {getWaypointCount(item) > 0 && (
                      <Badge size="md" variant="solid" bg="$purple900" borderRadius="$lg" borderColor="$purple700" borderWidth={1}>
                        <BadgeIcon as={NavigationIcon} color="$purple400" mr="$1" />
                        <BadgeText color="$purple100">{getWaypointCount(item)} pts</BadgeText>
                      </Badge>
                    )}
                  </HStack>
                </HStack>

                <Text color={colors.textSecondary} numberOfLines={2} mb="$4" lineHeight="$sm">
                  {item.description || 'Sin descripción'}
                </Text>

                <HStack 
                  borderTopWidth={1} 
                  borderTopColor={colors.border} 
                  pt="$4" 
                  gap="$3"
                >
                  <Button 
                    variant="outline" 
                    action="primary" 
                    size="sm" 
                    flex={1} 
                    borderColor={colors.border}
                    onPress={() => router.push(`/(dashboard)/tours/${item.id}`)}
                  >
                    <ButtonIcon as={Edit2Icon} color={colors.primary} mr="$2" />
                    <ButtonText color={colors.primary}>Editar</ButtonText>
                  </Button>

                  <Button 
                    variant="outline" 
                    action="negative" 
                    size="sm" 
                    flex={1} 
                    borderColor={colors.border}
                    onPress={() => deleteTour(item.id, item.name)}
                  >
                    <ButtonIcon as={TrashIcon} color="$red500" mr="$2" />
                    <ButtonText color="$red500">Eliminar</ButtonText>
                  </Button>
                </HStack>
              </Box>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <Box alignItems="center" py="$16">
            <Icon as={MapIcon} size="4xl" color={colors.textMuted} mb="$4" />
            <Heading size="lg" color={colors.textPrimary} mb="$2">No hay tours</Heading>
            <Text color={colors.textSecondary} mb="$6">Crea tu primer tour para empezar</Text>
            <Button 
              size="lg" 
              variant="solid" 
              action="primary" 
              bg={colors.brand.orange}
              onPress={() => router.push('/(dashboard)/tours/create')}
            >
              <ButtonText fontWeight="$bold" color={colors.textOnPrimary}>Crear Tour</ButtonText>
            </Button>
          </Box>
        }
      />
    </Box>
  );
}
