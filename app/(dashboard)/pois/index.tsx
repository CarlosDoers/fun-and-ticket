import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, 
  TouchableOpacity, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { Tour } from '../../../src/types';

export default function POIsToursListScreen() {
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
    } catch (error) {
      console.error('Error fetching tours:', error);
    } finally {
      setLoading(false);
    }
  }

  const getPoiCount = (tour: Tour) => tour.route_data?.pois?.length || 0;

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
        <TouchableOpacity 
          onPress={() => router.push('/(dashboard)')}
          style={{ marginBottom: 8 }}
        >
          <Text style={{ color: '#667eea', fontSize: 14, fontWeight: '600' }}>← Volver al Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Puntos de Interés</Text>
        <Text style={styles.subtitle}>Selecciona un tour para editar sus POIs</Text>
      </View>

      {/* Tours List */}
      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(dashboard)/pois/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {item.description || 'Sin descripción'}
              </Text>
            </View>
            <View style={styles.cardRight}>
              <View style={styles.poiBadge}>
                <Text style={styles.poiBadgeText}>📍 {getPoiCount(item)}</Text>
              </View>
              <Text style={styles.cardArrow}>→</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>No hay tours</Text>
            <Text style={styles.emptyDescription}>
              Primero crea un tour desde "Gestionar Tours"
            </Text>
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
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
    marginTop: 4,
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  card: {
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
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  cardRight: {
    alignItems: 'center',
    gap: 8,
  },
  poiBadge: {
    backgroundColor: '#fff5f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  poiBadgeText: {
    fontSize: 14,
    color: '#e65100',
    fontWeight: '600',
  },
  cardArrow: {
    fontSize: 20,
    color: '#667eea',
    fontWeight: 'bold',
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
  },
});
