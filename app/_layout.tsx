import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/lib/auth';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

function InitialLayout() {
  const { session, loading, isAdmin, isGuide } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inDashboardGroup = segments[0] === '(dashboard)';

    // Only protect dashboard routes - require authentication
    if (inDashboardGroup && !session) {
      router.replace('/(auth)/login');
    }

    // Allow authenticated users to visit the public root
    // Only redirect if they are in the auth group (login/signup pages)
    if (inAuthGroup && session) {
      if (isAdmin || isGuide) {
        console.log('Redirecting admin to dashboard');
        router.replace('/(dashboard)');
      } else {
        console.log('Redirecting user to home');
        router.replace('/');
      }
    }
  }, [session, loading, segments, isAdmin, isGuide]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
