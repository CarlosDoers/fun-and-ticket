import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../../src/lib/auth';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/lib/theme';

import { 
  Box, 
  Text, 
  Heading, 
  VStack, 
  HStack,
  Pressable,
  Icon,
  ScrollView,
  Center
} from '@gluestack-ui/themed';
import { 
  CompassIcon, 
  MapIcon, 
  MapPinIcon, 
  SmartphoneIcon, 
  ChevronRightIcon, 
  ArrowLeftIcon,
  LogOutIcon
} from 'lucide-react-native';

export default function DashboardScreen() {
  const { isAdmin, isGuide, signOut, user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ tours: 0, qrs: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [toursResult, qrsResult] = await Promise.all([
        supabase.from('tours').select('id', { count: 'exact', head: true }),
        supabase.from('qrs').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        tours: toursResult.count || 0,
        qrs: qrsResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  const handleSignOut = async () => {
    await signOut();
    if (Platform.OS === 'web') {
      window.location.href = '/';
    } else {
      router.replace('/');
    }
  };

  const handleBackToApp = () => {
    if (Platform.OS === 'web') {
      window.location.href = '/';
    } else {
      router.navigate('/');
    }
  };

  return (
    <Box flex={1} bg={colors.background}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Box alignItems="center">
          {/* Header */}
          <Box 
            w="$full" 
            pt="$16" 
            pb="$10" 
            bg={colors.surface}
            alignItems="center"
            borderBottomWidth={1}
            borderBottomColor={colors.border}
          >
            <Box 
              bg={colors.background} 
              p="$3" 
              rounded="$full" 
              mb="$4" 
              borderWidth={1} 
              borderColor={colors.border}
            >
              <Icon as={CompassIcon} size="xl" color={colors.brand.orange} />
            </Box>
            <Heading size="2xl" color={colors.textPrimary} mb="$1">Fun & Tickets</Heading>
            <Text color={colors.textSecondary}>
              {isAdmin ? 'Panel de Administración' : 'Panel de Guía'}
            </Text>
          </Box>

          {/* Stats Cards */}
          <HStack space="md" px="$5" mt="$-8" width="$full" maxWidth={600}>
            <Box 
              flex={1} 
              bg={colors.surface} 
              p="$6" 
              rounded="$2xl" 
              alignItems="center"
              borderWidth={1}
              borderColor={colors.border}
            >
              <Text size="4xl" fontWeight="$bold" color={colors.brand.orange}>{stats.tours}</Text>
              <Text color={colors.textSecondary} size="sm" mt="$1">Tours</Text>
            </Box>
            <Box 
              flex={1} 
              bg={colors.surface} 
              p="$6" 
              rounded="$2xl" 
              alignItems="center"
              borderWidth={1}
              borderColor={colors.border}
            >
              <Text size="4xl" fontWeight="$bold" color={colors.brand.orange}>{stats.qrs}</Text>
              <Text color={colors.textSecondary} size="sm" mt="$1">Códigos QR</Text>
            </Box>
          </HStack>

          {/* Menu Cards */}
          {(isAdmin || isGuide) && (
            <VStack space="md" w="$full" px="$5" mt="$8" maxWidth={600}>
              <MenuCard 
                icon={MapIcon} 
                color={colors.brand.orange} 
                title="Gestionar Tours" 
                desc="Crear, editar y eliminar tours" 
                onPress={() => router.push('/(dashboard)/tours')} 
              />
              <MenuCard 
                icon={MapPinIcon} 
                color={colors.warning} 
                title="Puntos de Interés" 
                desc="Editar información de POIs" 
                onPress={() => router.push('/(dashboard)/pois')} 
              />
              <MenuCard 
                icon={SmartphoneIcon} 
                color={colors.info} 
                title="Gestionar QRs" 
                desc="Generar y administrar códigos" 
                onPress={() => router.push('/(dashboard)/qrs')} 
              />
            </VStack>
          )}

          {/* Actions */}
          <VStack space="md" mt="$10" mb="$10" px="$5" w="$full" maxWidth={400}>
            <Pressable 
              onPress={handleBackToApp}
              borderWidth={1}
              borderColor={colors.brand.orange}
              rounded="$xl"
              p="$4"
              alignItems="center"
              sx={{ ':hover': { bg: colors.surfaceHighlight } }}
            >
              <HStack space="sm" alignItems="center">
                <Icon as={ArrowLeftIcon} color={colors.brand.orange} />
                <Text color={colors.brand.orange} fontWeight="$semibold">Volver a la App</Text>
              </HStack>
            </Pressable>

            <Pressable onPress={handleSignOut} p="$4" alignItems="center">
              <HStack space="sm" alignItems="center">
                <Icon as={LogOutIcon} color={colors.textMuted} size="sm" />
                <Text color={colors.textMuted} size="sm">Cerrar Sesión</Text>
              </HStack>
            </Pressable>
          </VStack>

          <Text color={colors.textMuted} size="xs" mb="$10">{user?.email}</Text>
        </Box>
      </ScrollView>
    </Box>
  );
}

function MenuCard({ icon, color, title, desc, onPress }: any) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <HStack 
          bg={colors.surface} 
          p="$5" 
          rounded="$2xl" 
          alignItems="center" 
          borderWidth={1}
          borderColor={pressed ? colors.primary : colors.border}
        >
          <Center 
            w="$12" 
            h="$12" 
            rounded="$xl" 
            bg={colors.background} 
            mr="$4"
            borderWidth={1}
            borderColor={colors.border}
          >
            <Icon as={icon} size="md" color={color} />
          </Center>
          <VStack flex={1}>
            <Text size="lg" fontWeight="$bold" color={colors.textPrimary}>{title}</Text>
            <Text size="sm" color={colors.textSecondary}>{desc}</Text>
          </VStack>
          <Icon as={ChevronRightIcon} color={colors.textMuted} />
        </HStack>
      )}
    </Pressable>
  );
}
