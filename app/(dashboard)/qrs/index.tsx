import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert, Image, Modal, TextInput } from 'react-native';
import { supabase } from '../../../src/lib/supabase';
import { QR, Tour } from '../../../src/types';

export default function QRsList() {
  const [qrs, setQrs] = useState<QR[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState('');

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
      Alert.alert('Error fetching QRs', error.message);
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
      Alert.alert('Please select a tour');
      return;
    }

    try {
      const code = `TOUR-${Math.random().toString(36).substring(7).toUpperCase()}`;
      const { error } = await supabase.from('qrs').insert({
        code,
        tour_id: selectedTourId,
        is_active: true,
      });

      if (error) throw error;
      setModalVisible(false);
      fetchQRs();
    } catch (error: any) {
      Alert.alert('Error creating QR', error.message);
    }
  }

  async function deleteQR(id: string) {
    try {
      const { error } = await supabase.from('qrs').delete().eq('id', id);
      if (error) throw error;
      setQrs(qrs.filter((q) => q.id !== id));
    } catch (error: any) {
      Alert.alert('Error deleting QR', error.message);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>QR Codes</Text>
        <Button title="Generate New QR" onPress={() => setModalVisible(true)} />
      </View>

      <FlatList
        data={qrs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View>
              <Text style={styles.code}>{item.code}</Text>
              <Text>Tour: {(item as any).tours?.name}</Text>
              <Image
                style={{ width: 100, height: 100, marginTop: 10 }}
                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${item.code}` }}
              />
            </View>
            <Button title="Delete" color="red" onPress={() => deleteQR(item.id)} />
          </View>
        )}
        ListEmptyComponent={<Text>No QRs found.</Text>}
      />

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Select Tour for QR</Text>
          <FlatList
            data={tours}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Button
                title={item.name}
                onPress={() => {
                  setSelectedTourId(item.id);
                  // createQR(); // Optional: auto create on select
                }}
                color={selectedTourId === item.id ? 'blue' : 'gray'}
              />
            )}
          />
          <View style={{ marginTop: 20 }}>
            <Button title="Create QR" onPress={createQR} />
            <Button title="Cancel" color="red" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  code: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    padding: 40,
    justifyContent: 'center',
  },
});
