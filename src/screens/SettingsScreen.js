import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Share,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { loadSettings, saveSettings, loadInvestments, saveInvestments } from '../utils/storage';

const SettingsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [usdToInrRate, setUsdToInrRate] = useState('83.0');
  const [loading, setLoading] = useState(false);

  // Suppress FileSystem deprecation warnings
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('expo-file-system')) {
      return;
    }
    originalWarn(...args);
  };

  useFocusEffect(
    useCallback(() => {
      loadCurrentSettings();
    }, [])
  );

  const loadCurrentSettings = async () => {
    const settings = await loadSettings();
    setUsdToInrRate(settings.usdToInrRate.toString());
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const [investments, settings] = await Promise.all([
        loadInvestments(),
        loadSettings()
      ]);

      const backupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        investments,
        settings
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const fileName = `investment-backup-${new Date().toISOString().split('T')[0]}.json`;

      // Write to cache directory
      const file = new FileSystem.File(FileSystem.Paths.cache, fileName);

      // Delete if exists, then create
      if (file.exists) {
        await file.delete();
      }
      await file.create();
      await file.write(jsonString);

      // Automatically share to save to Downloads
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Save Investment Backup to Downloads',
          UTI: 'public.json'
        });
      }

      Alert.alert(
        'Export Successful',
        `Backup file created: ${fileName}\n\nUse the share dialog to save the file to Downloads or another location.`
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', '*/*'],
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        return;
      }

      setLoading(true);

      console.log('Document picker result:', result);
      console.log('File URI:', result.assets[0].uri);

      // Use fetch to read the file (works with content:// URIs)
      const response = await fetch(result.assets[0].uri);
      const fileContent = await response.text();
      console.log('File content length:', fileContent.length);

      const backupData = JSON.parse(fileContent);
      console.log('Parsed backup data:', backupData);

      // Validate backup data structure
      if (!backupData.version || !backupData.investments) {
        throw new Error('Invalid backup file format');
      }

      // Show confirmation dialog
      Alert.alert(
        'Import Data',
        `This will replace all current data with the backup from ${new Date(backupData.exportDate).toLocaleDateString()}.\n\nInvestments: ${backupData.investments.length}\n\nAre you sure you want to continue?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setLoading(false)
          },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              try {
                await saveInvestments(backupData.investments);

                if (backupData.settings) {
                  await saveSettings(backupData.settings);
                  setUsdToInrRate(backupData.settings.usdToInrRate.toString());
                }

                Alert.alert(
                  'Import Successful',
                  `Successfully imported ${backupData.investments.length} investments!`,
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack()
                    }
                  ]
                );
              } catch (error) {
                console.error('Import error:', error);
                Alert.alert('Import Failed', 'Failed to import data. Please try again.');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Failed', `Failed to read backup file: ${error.message}\n\nPlease ensure it's a valid backup file.`);
      setLoading(false);
    }
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
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
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
                placeholderTextColor="#999"
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Backup & Restore</Text>
          <View style={styles.backupCard}>
            <View style={styles.backupInfo}>
              <Ionicons name="cloud-download-outline" size={24} color="#4A90E2" />
              <Text style={styles.backupText}>
                Export your investment data to a backup file that you can save and restore later.
              </Text>
            </View>
            <View style={styles.backupButtons}>
              <TouchableOpacity
                style={[styles.backupButton, loading && styles.backupButtonDisabled]}
                onPress={handleExportData}
                disabled={loading}
              >
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.backupButtonText}>Export Data</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.backupButton, styles.importButton, loading && styles.backupButtonDisabled]}
                onPress={handleImportData}
                disabled={loading}
              >
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.backupButtonText}>Import Data</Text>
              </TouchableOpacity>
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
  },
  backupCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  backupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  backupText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 12
  },
  backupButtons: {
    flexDirection: 'row',
    gap: 10
  },
  backupButton: {
    flex: 1,
    backgroundColor: '#27AE60',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  importButton: {
    backgroundColor: '#4A90E2'
  },
  backupButtonDisabled: {
    backgroundColor: '#999'
  },
  backupButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  }
});

export default SettingsScreen;
