import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../src/lib/auth';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { colors } from '../../src/lib/theme';

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
        {/* Header with gradient */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.logoContainer}>
            <Feather name="compass" size={40} color="white" />
          </View>
          <Text style={styles.headerTitle}>Fun & Tickets</Text>
          <Text style={styles.headerSubtitle}>
            {isAdmin ? 'Panel de Administración' : 'Panel de Guía'}
          </Text>
        </LinearGradient>

        {/* Stats Cards with glassmorphism effect */}
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
              <View style={[styles.menuIconContainer, { backgroundColor: '#e2e8f0' }]}>
                <Feather name="map" size={24} color={colors.primary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Gestionar Tours</Text>
                <Text style={styles.menuDescription}>
                  Crear, editar y eliminar tours turísticos
                </Text>
              </View>
              <Feather name="chevron-right" size={24} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/(dashboard)/pois')}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#fef3c7' }]}>
                <Feather name="map-pin" size={24} color={colors.warning} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Puntos de Interés</Text>
                <Text style={styles.menuDescription}>
                  Editar información de POIs de cada tour
                </Text>
              </View>
              <Feather name="chevron-right" size={24} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/(dashboard)/qrs')}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#dbeafe' }]}>
                <Feather name="smartphone" size={24} color={colors.info} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Gestionar QRs</Text>
                <Text style={styles.menuDescription}>
                  Generar y administrar códigos QR para tours
                </Text>
              </View>
              <Feather name="chevron-right" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBackToApp}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="arrow-left" size={20} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Volver a la App</Text>
            </View>
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
    backgroundColor: colors.background,
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
  logoContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
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
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  menuArrow: {
    opacity: 0.5,
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
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  userEmail: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 20,
    marginBottom: 40,
  },
});
