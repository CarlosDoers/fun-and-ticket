import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../src/lib/auth';
import { supabase } from '../src/lib/supabase';

export default function WelcomeScreen() {
  const router = useRouter();
  const { session, isAdmin, isGuide } = useAuth();

  const handleAdminAccess = async () => {
    if (isAdmin || isGuide) {
      router.push('/(dashboard)');
    } else if (session) {
      // If logged in as normal user, sign out first to allow admin login
      await supabase.auth.signOut();
      router.push('/(auth)/login');
    } else {
      router.push('/(auth)/login');
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🎫</Text>
          <Text style={styles.title}>Fun & Tickets</Text>
          <Text style={styles.subtitle}>Guided Tours & Adventures</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.welcomeText}>¡Bienvenido!</Text>
          <Text style={styles.description}>
            Descubre experiencias únicas escaneando códigos QR en nuestros tours guiados.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push('/scan')}
        >
          <Text style={styles.scanButtonIcon}>📱</Text>
          <Text style={styles.scanButtonText}>Escanear Código QR</Text>
        </TouchableOpacity>

        <Pressable
          style={styles.adminLink}
          onPress={handleAdminAccess}
        >
          <Text style={styles.adminLinkText}>
            {isAdmin || isGuide ? 'Ir al Dashboard →' : 'Acceso Administradores →'}
          </Text>
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
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 28,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 24,
  },
  scanButtonIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  scanButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
  },
  adminLink: {
    alignItems: 'center',
    padding: 12,
  },
  adminLinkText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
});
