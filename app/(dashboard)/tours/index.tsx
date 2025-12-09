import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { Tour } from '../../../src/types';

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <TouchableOpacity 
            onPress={() => router.push('/(dashboard)')}
            style={{ marginBottom: 8 }}
          >
            <Text style={{ color: '#667eea', fontSize: 14, fontWeight: '600' }}>← Volver al Dashboard</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Tours</Text>
          <Text style={styles.subtitle}>{tours.length} tours creados</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(dashboard)/tours/create')}
        >
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Tours List */}
      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(dashboard)/tours/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
              <View style={styles.badges}>
                {getPoiCount(item) > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>📍 {getPoiCount(item)} POIs</Text>
                  </View>
                )}
                {getWaypointCount(item) > 0 && (
                  <View style={[styles.badge, styles.badgeSecondary]}>
                    <Text style={styles.badgeTextSecondary}>🛤️ {getWaypointCount(item)} puntos</Text>
                  </View>
                )}
              </View>
            </View>
            
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description || 'Sin descripción'}
            </Text>
            
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push(`/(dashboard)/tours/${item.id}`)}
              >
                <Text style={styles.editButtonText}>✏️ Editar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteTour(item.id, item.name)}
              >
                <Text style={styles.deleteButtonText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>No hay tours</Text>
            <Text style={styles.emptyDescription}>
              Crea tu primer tour para empezar
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(dashboard)/tours/create')}
            >
              <Text style={styles.emptyButtonText}>Crear Tour</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  badgeSecondary: {
    backgroundColor: '#fff0f5',
  },
  badgeTextSecondary: {
    fontSize: 12,
    color: '#f093fb',
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f0f0ff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#fff0f0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#f44336',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
