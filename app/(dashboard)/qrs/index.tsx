import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, Alert, Image, Modal, 
  TouchableOpacity, ActivityIndicator, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { QR, Tour } from '../../../src/types';
import { colors } from '../../../src/lib/theme';
import { Feather } from '@expo/vector-icons';

export default function QRsList() {
  const router = useRouter();
  const [qrs, setQrs] = useState<QR[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchQRs();
    fetchTours();
  }, []);

  async function fetchQRs() {
    try {
      const { data, error } = await supabase
        .from('qrs')
        .select('*, tours(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQrs(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  async function fetchTours() {
    try {
      const { data, error } = await supabase.from('tours').select('*');
      if (error) throw error;
      setTours(data || []);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function createQR() {
    if (!selectedTourId) {
      Alert.alert('Error', 'Por favor selecciona un tour');
      return;
    }

    setCreating(true);
    try {
      const code = `TOUR-${Math.random().toString(36).substring(7).toUpperCase()}`;
      const { error } = await supabase.from('qrs').insert({
        code,
        tour_id: selectedTourId,
        is_active: true,
      });

      if (error) throw error;
      setModalVisible(false);
      setSelectedTourId('');
      fetchQRs();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setCreating(false);
    }
  }

  async function deleteQR(id: string, code: string) {
    Alert.alert(
      'Eliminar QR',
      `¿Eliminar el código "${code}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('qrs').delete().eq('id', id);
              if (error) throw error;
              setQrs(qrs.filter((q) => q.id !== id));
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  }

  const copyToClipboard = async (text: string) => {
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(text);
      Alert.alert('Copiado', 'Código copiado al portapapeles');
    } else {
      Alert.alert('Código', text);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Feather name="arrow-left" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>Volver al Dashboard</Text>
          </View>
          </TouchableOpacity>
          <Text style={styles.title}>Códigos QR</Text>
          <Text style={styles.subtitle}>{qrs.length} códigos generados</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Generar</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* QR List */}
      <FlatList
        data={qrs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        numColumns={Platform.OS === 'web' ? 2 : 1}
        key={Platform.OS === 'web' ? 'web' : 'mobile'}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.qrImageContainer}>
              <Image
                style={styles.qrImage}
                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${item.code}` }}
              />
            </View>
            
            <View style={styles.cardContent}>
              <TouchableOpacity onPress={() => copyToClipboard(item.code)}>
                <Text style={styles.codeText}>{item.code}</Text>
                <Text style={styles.copyHint}>Toca para copiar</Text>
              </TouchableOpacity>
              
              <View style={styles.tourBadge}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="map" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.tourBadgeText}>
                    {(item as any).tours?.name || 'Tour desconocido'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, item.is_active && styles.statusActive]} />
                <Text style={styles.statusText}>
                  {item.is_active ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.deleteIconButton}
              onPress={() => deleteQR(item.id, item.code)}
            >
              <Feather name="trash-2" size={18} color="#f44336" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={{ marginBottom: 16 }}>
              <Feather name="smartphone" size={64} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>No hay códigos QR</Text>
            <Text style={styles.emptyDescription}>
              Genera tu primer código QR para un tour
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.emptyButtonText}>Generar QR</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Create QR Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Generar Código QR</Text>
            <Text style={styles.modalSubtitle}>Selecciona un tour para generar su código QR</Text>
            
            {tours.length === 0 ? (
              <View style={styles.noToursContainer}>
                <Text style={styles.noToursText}>
                  No hay tours disponibles. Crea un tour primero.
                </Text>
              </View>
            ) : (
              <FlatList
                data={tours}
                keyExtractor={(item) => item.id}
                style={styles.tourList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.tourOption,
                      selectedTourId === item.id && styles.tourOptionSelected,
                    ]}
                    onPress={() => setSelectedTourId(item.id)}
                  >
                    <Text style={[
                      styles.tourOptionText,
                      selectedTourId === item.id && styles.tourOptionTextSelected,
                    ]}>
                      {item.name}
                    </Text>
                    {selectedTourId === item.id && (
                      <Feather name="check" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, !selectedTourId && styles.modalButtonDisabled]}
                onPress={createQR}
                disabled={!selectedTourId || creating}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {creating ? 'Generando...' : 'Generar QR'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedTourId('');
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.primary,
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
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    maxWidth: Platform.OS === 'web' ? '48%' : '100%',
  },
  qrImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
  },
  cardContent: {
    alignItems: 'center',
  },
  codeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  copyHint: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
  },
  tourBadge: {
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
  },
  tourBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginRight: 6,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  deleteIconButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  deleteIcon: {
    fontSize: 18,
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
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  tourList: {
    maxHeight: 300,
  },
  tourOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  tourOptionSelected: {
    backgroundColor: '#f0f0ff',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  tourOptionText: {
    fontSize: 16,
    color: '#333',
  },
  tourOptionTextSelected: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  checkmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
  noToursContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noToursText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalActions: {
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
  },
  modalButtonSecondaryText: {
    color: '#666',
    fontSize: 16,
  },
  modalButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
