import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types';
import {initDocutain, scanLabel, extractAddress, getRawText} from '../docutain';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({navigation}: Props) {
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    (async () => {
      const ready = await initDocutain();
      setSdkReady(ready);
      setLoading(false);
      if (!ready) {
        Alert.alert(
          'SDK Error',
          'Failed to initialize Docutain SDK. Check your license key.',
        );
      }
    })();
  }, []);

  const handleScan = async () => {
    if (!sdkReady || scanning) {
      return;
    }
    setScanning(true);
    try {
      await scanLabel();
      const [addressData, rawText] = await Promise.all([
        extractAddress(),
        getRawText(),
      ]);
      navigation.navigate('Results', {
        scanData: addressData || {
          Address: {
            Name1: '',
            Name2: '',
            Name3: '',
            Zipcode: '',
            City: '',
            Street: '',
            Phone: '',
            CustomerId: '',
          },
        },
        rawText,
      });
    } catch (error: any) {
      if (error?.code === 'CANCELED') {
        // User canceled - do nothing
      } else {
        Alert.alert('Scan Error', error?.message || 'Something went wrong.');
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>📦</Text>
        <Text style={styles.title}>Label Scanner</Text>
        <Text style={styles.subtitle}>
          Scan package labels to extract address information
        </Text>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color="#4a6cf7" />
            <Text style={styles.statusText}>Initializing SDK...</Text>
          </View>
        ) : sdkReady ? (
          <View style={styles.statusRow}>
            <View style={styles.readyDot} />
            <Text style={styles.statusText}>Ready to scan</Text>
          </View>
        ) : (
          <View style={styles.statusRow}>
            <View style={styles.errorDot} />
            <Text style={[styles.statusText, styles.errorText]}>
              SDK not available
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.scanButton, (!sdkReady || scanning) && styles.disabled]}
          onPress={handleScan}
          disabled={!sdkReady || scanning}>
          {scanning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.scanButtonText}>Scan Package Label</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by Docutain SDK{'\n'}All processing happens on-device
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  logo: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    color: '#e74c3c',
  },
  readyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#27ae60',
  },
  errorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e74c3c',
  },
  scanButton: {
    backgroundColor: '#4a6cf7',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 12,
    shadowColor: '#4a6cf7',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabled: {
    backgroundColor: '#a0aec0',
    shadowOpacity: 0,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});
