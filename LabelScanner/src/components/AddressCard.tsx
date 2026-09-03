import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {DocutainAddress} from '../types';

interface Props {
  title: string;
  address: DocutainAddress;
}

export default function AddressCard({title, address}: Props) {
  const lines = [
    address.Name1,
    address.Name2,
    address.Name3,
    address.Street,
    `${address.Zipcode} ${address.City}`.trim(),
    address.Phone ? `Ph: ${address.Phone}` : '',
    address.CustomerId ? `Customer ID: ${address.CustomerId}` : '',
  ].filter(Boolean);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {lines.length > 0 ? (
        lines.map((line, i) => (
          <Text key={i} style={styles.line}>
            {line}
          </Text>
        ))
      ) : (
        <Text style={styles.noData}>No address detected</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  line: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  noData: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
