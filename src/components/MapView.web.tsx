import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Mock MapView for Web until we implement a proper web map (e.g. Leaflet or Google Maps JS)
// react-native-maps does not support web out of the box without complex config
export default function MapView(props: any) {
  return (
    <View style={[styles.container, props.style]}>
      <Text>Map View (Web Placeholder)</Text>
      <Text>Maps are currently only supported on Mobile.</Text>
    </View>
  );
}

export const Marker = (props: any) => null;
export const Polyline = (props: any) => null;
export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
