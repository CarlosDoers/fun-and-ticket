import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteData } from '../types';

interface WebMapEditorProps {
  initialRouteData?: RouteData;
  onRouteDataChange: (data: RouteData) => void;
}

export default function WebMapEditor(props: WebMapEditorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map Editor is only available on the Web Dashboard.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    borderRadius: 8,
  },
  text: {
    color: '#666',
  },
});
