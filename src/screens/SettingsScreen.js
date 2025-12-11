import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { loadSettings, saveSettings } from '../utils/storage';

const SettingsScreen = ({ navigation }) => {
  const [usdToInrRate, setUsdToInrRate] = useState('83.0');
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCurrentSettings();
    }, [])
  );

  const loadCurrentSettings = async () => {
    const settings = await loadSettings();
    setUsdToInrRate(settings.usdToInrRate.toString());
  };

  const handleSave = async () => {
    const rate = parseFloat(usdToInrRate);

    if (isNaN(rate) || rate <= 0) {
      Alert.alert('Invalid Rate', 'Please enter a valid exchange rate greater than 0');
      return;
    }

    setLoading(true);
    const success = await saveSettings({
      currency: 'INR',
      usdToInrRate: rate
    });

    setLoading(false);

    if (success) {
      Alert.alert(
        'Settings Saved',
        `USD to INR rate updated to ₹${rate.toFixed(2)}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency Settings</Text>
          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>USD to INR Exchange Rate</Text>
            <Text style={styles.settingDescription}>
              Enter the current USD to INR exchange rate. This will be used to convert
              US Stocks, RSU, ESPP, and Cryptocurrency values to INR.
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>₹</Text>
              <TextInput
                style={styles.input}
                value={usdToInrRate}
                onChangeText={setUsdToInrRate}
                keyboardType="decimal-pad"
                placeholder="83.0"
              />
              <Text style={styles.inputSuffix}>per $1</Text>
            </View>
            <Text style={styles.exampleText}>
              Example: If 1 USD = ₹83.50, enter 83.5
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Affected Investment Types</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
              <Text style={styles.infoText}>US Stocks</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
              <Text style={styles.infoText}>Restricted Stock Units (RSU)</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
              <Text style={styles.infoText}>Employee Stock Purchase Plan (ESPP)</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
              <Text style={styles.infoText}>Cryptocurrency</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#4A90E2',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    marginRight: 15
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  content: {
    flex: 1
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 15
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9'
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 12
  },
  inputSuffix: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8
  },
  exampleText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic'
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    padding: 16,
    margin: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  saveButtonDisabled: {
    backgroundColor: '#999'
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default SettingsScreen;
