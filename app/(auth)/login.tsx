import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';
import { colors } from '../../src/lib/theme';
import { ArrowLeftIcon } from 'lucide-react-native';

import { 
  Box, 
  Text, 
  Heading, 
  Button, 
  ButtonText, 
  ButtonSpinner,
  VStack,
  HStack,
  Input, 
  InputField,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Pressable,
  Icon
} from '@gluestack-ui/themed';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos Incompletos', 'Por favor, ingresa tu correo electrónico y contraseña.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        Alert.alert('Error de Acceso', 'El correo o la contraseña son incorrectos.');
      } else {
        Alert.alert('Error', error.message);
      }
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      
      if (profile?.role === 'admin' || profile?.role === 'guide') {
        router.replace('/(dashboard)');
      } else {
        router.replace('/');
      }
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Box flex={1} justifyContent="center" p="$6" bg={colors.background}>
        <VStack space="4xl" alignItems="center">
          
          {/* Header */}
          <VStack alignItems="center" space="md" w="$full" maxWidth={500}>
            <Pressable 
              onPress={() => router.replace('/')} 
              alignSelf="flex-start" 
              mb="$4"
            >
               <HStack space="xs" alignItems="center">
                 <Icon as={ArrowLeftIcon} color={colors.primary} size="sm" />
                 <Text color={colors.primary} size="md" fontWeight="$bold">Volver a la App</Text>
               </HStack>
            </Pressable>
            
            <Heading size="3xl" color={colors.textPrimary} fontWeight="$bold" textAlign="center" width="$full">
              Bienvenido de nuevo
            </Heading>
            <Text color={colors.textSecondary} size="lg" textAlign="center">
              Accede al panel de administración para gestionar tours y contenidos.
            </Text>
          </VStack>

          {/* Form Container */}
          <Box 
            bg={colors.surface}
            p="$6" 
            rounded="$xl" 
            w="$full" 
            maxWidth={500}
            borderWidth={1}
            borderColor={colors.border}
          >
            <VStack space="xl">
              
              <FormControl>
                <FormControlLabel mb="$2">
                  <FormControlLabelText color={colors.textPrimary}>Email</FormControlLabelText>
                </FormControlLabel>
                <Input 
                  variant="outline" 
                  size="md" 
                  borderWidth={1}
                  borderColor={colors.border}
                  bg={colors.inputBackground}
                >
                  <InputField 
                     placeholder="ejemplo@correo.com" 
                     placeholderTextColor={colors.textMuted}
                     value={email}
                     onChangeText={setEmail}
                     autoCapitalize="none"
                     keyboardType="email-address"
                     color={colors.textPrimary}
                  />
                </Input>
              </FormControl>

              <FormControl>
                <FormControlLabel mb="$2">
                  <FormControlLabelText color={colors.textPrimary}>Contraseña</FormControlLabelText>
                </FormControlLabel>
                <Input 
                  variant="outline" 
                  size="md"
                  borderWidth={1}
                  borderColor={colors.border}
                  bg={colors.inputBackground}
                >
                  <InputField 
                     placeholder="Ingresa tu contraseña" 
                     placeholderTextColor={colors.textMuted}
                     value={password}
                     onChangeText={setPassword}
                     secureTextEntry={true}
                     autoCapitalize="none"
                     color={colors.textPrimary}
                  />
                </Input>
              </FormControl>

              <Button 
                size="xl" 
                variant="solid" 
                action="primary" 
                bg={colors.brand.orange}
                isDisabled={loading}
                onPress={signInWithEmail}
                mt="$4"
                sx={{
                  ':hover': { bg: colors.brand.orangeDark },
                  ':active': { bg: colors.brand.orangeDark }
                }}
              >
                {loading && <ButtonSpinner color={colors.textOnPrimary} mr="$2"/>}
                <ButtonText fontWeight="$bold" color={colors.textOnPrimary}>{loading ? 'Iniciando...' : 'Iniciar Sesión'}</ButtonText>
              </Button>

            </VStack>
          </Box>
        </VStack>
      </Box>
    </KeyboardAvoidingView>
  );
}
