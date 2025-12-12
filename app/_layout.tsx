import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/lib/auth';
import { useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { setAudioModeAsync } from 'expo-audio';

function InitialLayout() {
  const { session, loading, isAdmin, isGuide } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Configure global audio mode for background playback
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    }).catch(err => console.log('Failed to set audio mode', err));

    if (Platform.OS === 'web') {
      const linkId = 'leaflet-css';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inDashboardGroup = segments[0] === '(dashboard)';

    // Only protect dashboard routes - require authentication
    if (inDashboardGroup && !session) {
      router.replace('/(auth)/login');
    }



    // Check if we are in the auth group
    const isAuthPage = segments[0] === '(auth)';

    // Allow authenticated users to visit the public root
    // Only redirect if they are in the auth group (login/signup pages)
    if (isAuthPage && session) {
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

import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "@gluestack-ui/config";

export default function RootLayout() {
  return (
    <AuthProvider>
      <GluestackUIProvider config={config}>
        <InitialLayout />
      </GluestackUIProvider>
    </AuthProvider>
  );
}
