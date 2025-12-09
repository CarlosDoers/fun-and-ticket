import React, { useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, Alert, 
  TouchableOpacity, ScrollView, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/lib/auth';
import WebMapEditor from '../../../src/components/WebMapEditor';
import { RouteData } from '../../../src/types';

export default function CreateTour() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [routeData, setRouteData] = useState<RouteData>({ waypoints: [], pois: [] });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  async function createTour() {
    if (!name.trim()) {
      Alert.alert('Campo requerido', 'El nombre del tour es obligatorio');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Campo requerido', 'La descripción es obligatoria');
      return;
    }

    if (routeData.pois.length === 0) {
      Alert.alert(
        'Sin puntos de interés',
        'No has añadido ningún punto de interés. ¿Deseas continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => saveTour() }
        ]
      );
      return;
    }

    saveTour();
  }

  async function saveTour() {
    setLoading(true);
    try {
      const { error } = await supabase.from('tours').insert({
        name,
        description,
        created_by: user?.id,
        route_data: routeData,
      });

      if (error) throw error;
      Alert.alert('Éxito', 'Tour creado correctamente');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  const poiCount = routeData.pois?.length || 0;
  const hasRoute = (routeData.waypoints?.length || 0) > 0;

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(dashboard)/tours')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Nuevo Tour</Text>
      </View>

      <View style={styles.container}>
        {/* Form Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Básica</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Tour *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Tour Histórico del Centro"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe el tour, qué verán los visitantes, duración estimada..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Map Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Puntos de Interés</Text>
            {poiCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{poiCount} POIs</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.sectionDescription}>
            Haz clic derecho en el mapa para añadir puntos de interés. 
            La generación de ruta es opcional.
          </Text>

          {hasRoute && (
            <View style={styles.routeInfo}>
              <Text style={styles.routeInfoIcon}>🛤️</Text>
              <Text style={styles.routeInfoText}>Ruta generada con {routeData.waypoints?.length} puntos</Text>
            </View>
          )}

          <WebMapEditor 
            onRouteDataChange={setRouteData}
            initialRouteData={routeData}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={createTour}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Crear Tour</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.push('/(dashboard)/tours')}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
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
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  badge: {
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  routeInfoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  routeInfoText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
  },
  actions: {
    gap: 12,
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
