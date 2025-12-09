import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../src/lib/auth';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/lib/supabase';

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
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.logo}>🎫</Text>
          <Text style={styles.headerTitle}>Fun & Tickets</Text>
          <Text style={styles.headerSubtitle}>
            {isAdmin ? 'Panel de Administración' : 'Panel de Guía'}
          </Text>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.tours}</Text>
            <Text style={styles.statLabel}>Tours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.qrs}</Text>
            <Text style={styles.statLabel}>Códigos QR</Text>
          </View>
        </View>

        {/* Menu Cards */}
        {(isAdmin || isGuide) && (
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/(dashboard)/tours')}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconContainer}>
                <Text style={styles.menuIcon}>🗺️</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Gestionar Tours</Text>
                <Text style={styles.menuDescription}>
                  Crear, editar y eliminar tours turísticos
                </Text>
              </View>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/(dashboard)/pois')}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#fff5f0' }]}>
                <Text style={styles.menuIcon}>📍</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Puntos de Interés</Text>
                <Text style={styles.menuDescription}>
                  Editar información de POIs de cada tour
                </Text>
              </View>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/(dashboard)/qrs')}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconContainer}>
                <Text style={styles.menuIcon}>📱</Text>
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Gestionar QRs</Text>
                <Text style={styles.menuDescription}>
                  Generar y administrar códigos QR para tours
                </Text>
              </View>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBackToApp}
          >
            <Text style={styles.secondaryButtonText}>← Volver a la App</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: -30,
    paddingHorizontal: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  menuContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 16,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIcon: {
    fontSize: 28,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
  },
  menuArrow: {
    fontSize: 24,
    color: '#667eea',
    fontWeight: 'bold',
  },
  actionsContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 32,
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#999',
    fontSize: 14,
  },
  userEmail: {
    color: '#999',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 40,
  },
});
