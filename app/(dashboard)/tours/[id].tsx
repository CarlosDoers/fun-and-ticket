import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import WebMapEditor from '../../../src/components/WebMapEditor';
import { RouteData } from '../../../src/types';

export default function EditTour() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [routeData, setRouteData] = useState<RouteData>({ waypoints: [], pois: [] });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      fetchTour();
    }
  }, [id]);

  async function fetchTour() {
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        setName(data.name);
        setDescription(data.description);
        setRouteData(data.route_data || { waypoints: [], pois: [] });
      }
    } catch (error: any) {
      Alert.alert('Error fetching tour', error.message);
    } finally {
      setFetching(false);
    }
  }

  async function updateTour() {
    // Validate required fields
    if (!name.trim()) {
      Alert.alert('Required Field', 'Tour Name is required');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Required Field', 'Description is required');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tours')
        .update({
          name,
          description,
          route_data: routeData,
        })
        .eq('id', id);

      if (error) throw error;
      Alert.alert('Success', 'Tour updated successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error updating tour', error.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Tour</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Tour Name"
        value={name}
        onChangeText={setName}
      />
      
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Route & Points of Interest</Text>
      <WebMapEditor 
        onRouteDataChange={setRouteData}
        initialRouteData={routeData}
      />
      <View style={{ height: 20 }} />

      <Button title="Update Tour" onPress={updateTour} disabled={loading} />
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
});
