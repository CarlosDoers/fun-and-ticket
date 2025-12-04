import { View, Text, Button, StyleSheet, Platform } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/lib/auth';
import { Link, useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { isAdmin, isGuide, signOut } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isAdmin ? 'Admin Dashboard' : isGuide ? 'Guide Dashboard' : 'Dashboard'}
      </Text>
      
      {(isAdmin || isGuide) && (
        <View style={styles.menu}>
          <Link href="/(dashboard)/tours" asChild>
            <Button title="Manage Tours" />
          </Link>
          <View style={{ height: 10 }} />
          <Link href="/(dashboard)/qrs" asChild>
            <Button title="Manage QRs" />
          </Link>
          <View style={{ height: 20 }} />
          <Button 
            title="Back to App" 
            color="gray" 
            onPress={() => {
              console.log('Back to App pressed');
              if (Platform.OS === 'web') {
                window.location.href = '/';
              } else {
                // Use navigate instead of replace/push to find the existing route or go to root
                router.navigate('/');
              }
            }}
          />
        </View>
      )}

      <View style={{ height: 20 }} />
      <Button 
        title="Sign Out" 
        onPress={async () => {
          await signOut();
          if (Platform.OS === 'web') {
            window.location.href = '/';
          } else {
            router.replace('/');
          }
        }} 
      />
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
  menu: {
    width: '100%',
    maxWidth: 300,
  },
});
