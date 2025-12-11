import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '../src/lib/auth';
import { supabase } from '../src/lib/supabase';
import { colors } from '../src/lib/theme';

import { 
  Box, 
  Text, 
  Heading, 
  Button, 
  ButtonText, 
  ButtonIcon, 
  VStack, 
  Center,
  Pressable,
  HStack,
  Icon
} from '@gluestack-ui/themed';
import { CompassIcon, ArrowRightIcon, MaximizeIcon } from 'lucide-react-native'; 

export default function WelcomeScreen() {
  const router = useRouter();
  const { session, isAdmin, isGuide } = useAuth();

  const handleAdminAccess = async () => {
    if (isAdmin || isGuide) {
      router.push('/(dashboard)');
    } else if (session) {
      await supabase.auth.signOut();
      router.push('/(auth)/login');
    } else {
      router.push('/(auth)/login');
    }
  };

  return (
    <Box flex={1} bg={colors.background} justifyContent="center" p="$6">
      <VStack space="4xl" alignItems="center">
        
        {/* Header */}
        <VStack alignItems="center" space="md">
          <Center 
            bg={colors.surface}
            p="$5" 
            rounded="$full" 
            borderWidth={1} 
            borderColor={colors.border}
          >
            <Icon as={CompassIcon} size="xl" color={colors.brand.orange} w={64} h={64} />
          </Center>
          
          <Heading size="3xl" color={colors.textPrimary} fontWeight="$bold" textAlign="center">
            Fun & Tickets
          </Heading>
          <Text color={colors.textSecondary} size="lg">
            Guided Tours & Adventures
          </Text>
        </VStack>

        {/* Feature Card */}
        <Box 
          bg={colors.surface}
          p="$7" 
          rounded="$2xl" 
          borderWidth={1} 
          borderColor={colors.border}
          alignItems="center"
        >
          <Heading size="xl" color={colors.textPrimary} mb="$3" textAlign="center">
            ¡Bienvenido!
          </Heading>
          <Text color={colors.textSecondary} textAlign="center" lineHeight="$xl">
            Descubre experiencias únicas escaneando códigos QR en nuestros tours guiados.
          </Text>
        </Box>

        {/* Actions */}
        <VStack space="lg" w="$full" alignItems="center">
          <Button 
            size="xl" 
            variant="solid" 
            action="primary" 
            bg={colors.primary}
            rounded="$xl"
            onPress={() => router.push('/scan')}
            w="$full"
            sx={{
              ':hover': { bg: colors.brand.orangeDark },
              ':active': { bg: colors.brand.orangeDark }
            }}
          >
            <ButtonIcon as={MaximizeIcon} color={colors.textOnPrimary} mr="$3" />
            <ButtonText color={colors.textOnPrimary} fontWeight="$bold" size="lg">Escanear Código QR</ButtonText>
          </Button>

          <Pressable onPress={handleAdminAccess}>
             <HStack space="sm" alignItems="center" p="$2">
               <Text color={colors.textMuted} size="sm">
                 {isAdmin || isGuide ? 'Ir al Dashboard' : 'Acceso Administradores'}
               </Text>
               <Icon as={ArrowRightIcon} color={colors.textMuted} size="sm" />
             </HStack>
          </Pressable>
        </VStack>

      </VStack>
    </Box>
  );
}
