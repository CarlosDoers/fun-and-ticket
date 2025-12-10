import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { colors } from '../src/lib/theme';

export default function PublicScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const isProcessing = React.useRef(false);
  const router = useRouter();

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  // Reset state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      setScanned(false);
      setVerifying(false);
      isProcessing.current = false;
      setIsReady(true);

      return () => {
        setIsReady(false);
      };
    }, [])
  );

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (!isReady || scanned || isProcessing.current) return;
    
    console.log('Scanned:', { type, data });

    if (!data) return;

    isProcessing.current = true;
    setScanned(true);
    setVerifying(true);
    
    try {
      const { data: qrData, error } = await supabase
        .from('qrs')
        .select('tour_id')
        .eq('code', data)
        .single();

      if (error || !qrData) {
        console.log('QR Lookup Error:', error);
        Alert.alert('Código QR Inválido', `El código escaneado no es válido.`);
        setScanned(false);
        setVerifying(false); // Stop loading
        isProcessing.current = false;
        return;
      }

      router.push(`/map/${qrData.tour_id}`);
      // Note: We don't setVerifying(false) here to keep loader while screen transitions
    } catch (error) {
      console.error('Scan Error:', error);
      Alert.alert('Error', 'Algo salió mal al escanear el QR.');
      setScanned(false);
      setVerifying(false);
      isProcessing.current = false;
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Solicitando permiso de cámara...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No hay acceso a la cámara</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        facing="back"
        onBarcodeScanned={(scanned || !isReady) ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.overlay}>
        <View style={styles.topOverlay}>
          <Text style={styles.instructionText}>
            Apunta la cámara al código QR
          </Text>
        </View>
        
        <View style={styles.scanArea}>
          {verifying && (
            <View style={styles.verifyOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.verifyText}>Verificando...</Text>
            </View>
          )}
        </View>
        
        <View style={styles.bottomOverlay}>
          {scanned && !verifying && (
            <TouchableOpacity 
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanButtonText}>Escanear de nuevo</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scanArea: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: colors.accent,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  rescanButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  verifyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  verifyText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
});
