import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
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
      Alert.alert('Error fetching tours', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTour(id: string) {
    try {
      const { error } = await supabase.from('tours').delete().eq('id', id);
      if (error) throw error;
      setTours(tours.filter((t) => t.id !== id));
    } catch (error: any) {
      Alert.alert('Error deleting tour', error.message);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tours</Text>
        <Link href="/(dashboard)/tours/create" asChild>
          <Button title="Create New Tour" />
        </Link>
      </View>

      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <TouchableOpacity 
              style={styles.itemContent}
              onPress={() => router.push(`/(dashboard)/tours/${item.id}`)}
            >
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text>{item.description}</Text>
            </TouchableOpacity>
            <Button title="Delete" color="red" onPress={() => deleteTour(item.id)} />
          </View>
        )}
        ListEmptyComponent={<Text>No tours found.</Text>}
      />
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
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemContent: {
    flex: 1,
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
