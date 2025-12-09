import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '../src/lib/auth';
import { supabase } from '../src/lib/supabase';
import { colors } from '../src/lib/theme';

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
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Feather name="compass" size={64} color="white" />
          </View>
          <Text style={styles.title}>Fun & Tickets</Text>
          <Text style={styles.subtitle}>Guided Tours & Adventures</Text>
        </View>

        {/* Glassmorphism info box */}
        <View style={styles.glassCard}>
          <Text style={styles.welcomeText}>¡Bienvenido!</Text>
          <Text style={styles.description}>
            Descubre experiencias únicas escaneando códigos QR en nuestros tours guiados.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push('/scan')}
        >
          <Feather name="maximize" size={24} color={colors.primary} style={styles.scanButtonIcon} />
          <Text style={styles.scanButtonText}>Escanear Código QR</Text>
        </TouchableOpacity>

        <Pressable
          style={styles.adminLink}
          onPress={handleAdminAccess}
        >
          <Text style={styles.adminLinkText}>
            {isAdmin || isGuide ? 'Ir al Dashboard' : 'Acceso Administradores'}
          </Text>
          <Feather name="arrow-right" size={16} color="rgba(255, 255, 255, 0.8)" style={{ marginLeft: 8 }} />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 20,
    borderRadius: 50,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
  },
  // Glassmorphism card
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 28,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)' } : {}),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 24,
  },
  scanButtonIcon: {
    marginRight: 12,
  },
  scanButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  adminLinkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
});
