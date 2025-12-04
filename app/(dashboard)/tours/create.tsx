import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../src/lib/auth';

export default function CreateTour() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  async function createTour() {
    if (!name || !description) {
      Alert.alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('tours').insert({
        name,
        description,
        created_by: user?.id,
        route_data: {}, // Placeholder for now
      });

      if (error) throw error;
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
});
