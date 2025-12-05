import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
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
    // Validate required fields
    if (!name.trim()) {
      Alert.alert('Required Field', 'Tour Name is required');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Required Field', 'Description is required');
      return;
    }

    // Warn if no route data
    if (routeData.pois.length === 0) {
      Alert.alert(
        'No Points of Interest',
        'You haven\'t added any points of interest. Do you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => saveTour() }
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
      Alert.alert('Success', 'Tour created successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error creating tour', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Tour</Text>
      
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

      <Button title="Create Tour" onPress={createTour} disabled={loading} />
    </View>
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
