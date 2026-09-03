import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../types';
import AddressCard from '../components/AddressCard';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Results'>;
  route: RouteProp<RootStackParamList, 'Results'>;
};

export default function ResultsScreen({navigation, route}: Props) {
  const {scanData, rawText} = route.params;
  const [showRawText, setShowRawText] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Extracted Information</Text>

      <AddressCard title="Sender Address" address={scanData.Address} />

      {scanData.Date && (
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Date</Text>
          <Text style={styles.fieldValue}>{scanData.Date}</Text>
        </View>
      )}

      {scanData.Amount && (
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Amount</Text>
          <Text style={styles.fieldValue}>{scanData.Amount}</Text>
        </View>
      )}

      {scanData.InvoiceId && (
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Invoice ID</Text>
          <Text style={styles.fieldValue}>{scanData.InvoiceId}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.rawToggleButton}
        onPress={() => setShowRawText(!showRawText)}>
        <Text style={styles.rawToggleText}>
          {showRawText ? 'Hide Raw Text' : 'Show Raw OCR Text'}
        </Text>
      </TouchableOpacity>

      {showRawText && (
        <View style={styles.rawTextBox}>
          <Text style={styles.rawText}>
            {rawText || 'No text detected'}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.scanAgainButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.scanAgainText}>Scan Another Label</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  fieldCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    color: '#333',
  },
  rawToggleButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#e8ecf1',
    borderRadius: 8,
  },
  rawToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a6cf7',
  },
  rawTextBox: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rawText: {
    fontSize: 13,
    color: '#555',
    fontFamily: 'Courier',
    lineHeight: 20,
  },
  scanAgainButton: {
    marginTop: 24,
    backgroundColor: '#4a6cf7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
