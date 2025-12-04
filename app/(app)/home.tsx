import { View, Text, Button, StyleSheet } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth';

export default function HomeScreen() {
  const router = useRouter();
  const { isAdmin, isGuide } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome User!</Text>
      
      <Button title="Scan QR Code" onPress={() => router.push('/(app)/scan')} />
      
      <View style={{ height: 20 }} />

      {(isAdmin || isGuide) && (
        <>
          <Button 
            title="Go to Dashboard" 
            color="purple"
            onPress={() => router.push('/(dashboard)')} 
          />
          <View style={{ height: 20 }} />
        </>
      )}

      <Button title="Sign Out" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});
