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
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { loadSettings, saveSettings, loadInvestments, saveInvestments } from '../utils/storage';
import {
  exportAllDocuments,
  importDocuments,
  getTotalDocumentCount
} from '../services/documentService';

import { useTheme } from '../utils/useTheme';

const SettingsScreen = ({ navigation }) => {
    const { isDark, colors } = useTheme();
  const styles = getStyles(colors);
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

      const [investments, settings, documentCount] = await Promise.all([
        loadInvestments(),
        loadSettings(),
        getTotalDocumentCount()
      ]);

      const backupData = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        investments,
        settings,
        hasDocuments: documentCount > 0
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const fileName = `investment-backup-${new Date().toISOString().split('T')[0]}.json`;

      // Write JSON to cache directory
      const fileUri = `${FileSystemLegacy.cacheDirectory}${fileName}`;
      await FileSystemLegacy.writeAsStringAsync(fileUri, jsonString);

      let shareUri = fileUri;
      let shareFileName = fileName;
      let shareMimeType = 'application/json';

      // If there are documents, export them as ZIP and include with backup
      if (documentCount > 0) {
        const documentsZipPath = await exportAllDocuments();

        if (documentsZipPath) {
          // Create a composite backup that includes both JSON and ZIP
          shareFileName = `investment-backup-${new Date().toISOString().split('T')[0]}.zip`;
          const compositeZipPath = `${FileSystemLegacy.cacheDirectory}${shareFileName}`;

          // Create a temporary directory for the backup
          const tempBackupDir = `${FileSystemLegacy.cacheDirectory}backup_temp/`;
          const tempBackupDirInfo = await FileSystemLegacy.getInfoAsync(tempBackupDir);

          if (tempBackupDirInfo.exists) {
            await FileSystemLegacy.deleteAsync(tempBackupDir, { idempotent: true });
          }
          await FileSystemLegacy.makeDirectoryAsync(tempBackupDir, { intermediates: true });

          // Copy files to temp directory
          await FileSystemLegacy.copyAsync({
            from: fileUri,
            to: `${tempBackupDir}data.json`
          });
          await FileSystemLegacy.copyAsync({
            from: documentsZipPath,
            to: `${tempBackupDir}documents.zip`
          });

          // Create final ZIP containing both files
          const { zip } = require('react-native-zip-archive');
          await zip(tempBackupDir, compositeZipPath);

          shareUri = compositeZipPath;
          shareMimeType = 'application/zip';

          // Cleanup temp directory
          await FileSystemLegacy.deleteAsync(tempBackupDir, { idempotent: true });
        }
      }

      // For Android, use sharing which allows saving to Downloads
      // The user can choose "Save to Downloads" from the share menu
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUri, {
          mimeType: shareMimeType,
          dialogTitle: 'Save Backup to Downloads',
          UTI: shareMimeType === 'application/zip' ? 'public.zip-archive' : 'public.json'
        });
      }

      Alert.alert(
        'Export Successful',
        `Backup created successfully!\n\n` +
        `File: ${shareFileName}\n` +
        `Investments: ${investments.length}\n` +
        `Documents: ${documentCount}\n\n` +
        `Use the share dialog to save to Downloads or share with other apps.`
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', `Failed to export data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'application/zip', '*/*'],
        copyToCacheDirectory: true
      });

      if (result.canceled) {
        return;
      }

      setLoading(true);

      console.log('Document picker result:', result);
      console.log('File URI:', result.assets[0].uri);
      console.log('File name:', result.assets[0].name);

      let backupData;
      let hasDocuments = false;
      const fileName = result.assets[0].name;
      const isZip = fileName.endsWith('.zip');

      if (isZip) {
        // Extract ZIP backup
        const { unzip } = require('react-native-zip-archive');
        const extractPath = `${FileSystemLegacy.cacheDirectory}import_temp/`;

        // Clean up extract directory
        const extractDirInfo = await FileSystemLegacy.getInfoAsync(extractPath);
        if (extractDirInfo.exists) {
          await FileSystemLegacy.deleteAsync(extractPath, { idempotent: true });
        }
        await FileSystemLegacy.makeDirectoryAsync(extractPath, { intermediates: true });

        // Unzip backup file
        await unzip(result.assets[0].uri, extractPath);

        // Read data.json
        const dataJsonUri = `${extractPath}data.json`;
        const dataResponse = await fetch(dataJsonUri);
        const dataContent = await dataResponse.text();
        backupData = JSON.parse(dataContent);

        // Check if documents.zip exists
        const documentsZipUri = `${extractPath}documents.zip`;
        const documentsZipInfo = await FileSystemLegacy.getInfoAsync(documentsZipUri);
        hasDocuments = documentsZipInfo.exists;

        if (hasDocuments) {
          // Store documents.zip path for later import
          backupData.documentsZipPath = documentsZipUri;
        }
      } else {
        // JSON backup (old format)
        const response = await fetch(result.assets[0].uri);
        const fileContent = await response.text();
        backupData = JSON.parse(fileContent);
      }

      console.log('Parsed backup data:', backupData);

      // Validate backup data structure
      if (!backupData.version || !backupData.investments) {
        throw new Error('Invalid backup file format');
      }

      // Show confirmation dialog
      const documentMessage = hasDocuments || backupData.hasDocuments
        ? '\nDocuments: Will be restored'
        : '\nDocuments: None';

      Alert.alert(
        'Import Data',
        `This will replace all current data with the backup from ${new Date(backupData.exportDate).toLocaleDateString()}.\n\nInvestments: ${backupData.investments.length}${documentMessage}\n\nAre you sure you want to continue?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: async () => {
              // Cleanup temp directory if exists
              if (isZip) {
                const extractPath = `${FileSystemLegacy.cacheDirectory}import_temp/`;
                await FileSystemLegacy.deleteAsync(extractPath, { idempotent: true });
              }
              setLoading(false);
            }
          },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              try {
                // Import documents first if they exist
                if (backupData.documentsZipPath) {
                  await importDocuments(backupData.documentsZipPath);
                }

                // Import investment data
                await saveInvestments(backupData.investments);

                if (backupData.settings) {
                  await saveSettings(backupData.settings);
                  setUsdToInrRate(backupData.settings.usdToInrRate.toString());
                }

                // Cleanup temp directory if exists
                if (isZip) {
                  const extractPath = `${FileSystemLegacy.cacheDirectory}import_temp/`;
                  await FileSystemLegacy.deleteAsync(extractPath, { idempotent: true });
                }

                Alert.alert(
                  'Import Successful',
                  `Successfully imported ${backupData.investments.length} investments${hasDocuments ? ' and documents' : ''}!`,
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack()
                    }
                  ]
                );
              } catch (error) {
                console.error('Import error:', error);
                Alert.alert('Import Failed', `Failed to import data: ${error.message}`);
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
          <Ionicons name="arrow-back" size={24} color={colors.iconColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 8 }}
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
                placeholderTextColor={colors.textTertiary}
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
              <Ionicons name="cloud-download-outline" size={24} color={colors.textPrimary} />
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
                <Ionicons name="download-outline" size={20} color={colors.buttonIcon} />
                <Text style={styles.backupButtonText}>Export Data</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.backupButton, styles.importButton, loading && styles.backupButtonDisabled]}
                onPress={handleImportData}
                disabled={loading}
              >
                <Ionicons name="cloud-upload-outline" size={20} color={colors.buttonIcon} />
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

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    backgroundColor: colors.headerBackground,
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
    color: colors.iconColor
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
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  settingCard: {
    backgroundColor: colors.cardBackground,
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
    color: colors.textPrimary,
    marginBottom: 8
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: colors.emptyContainer
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: 8
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingVertical: 12
  },
  inputSuffix: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8
  },
  exampleText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
    fontStyle: 'italic'
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
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
    color: colors.textPrimary,
    marginLeft: 10
  },
  saveButton: {
    backgroundColor: colors.headerBackground,
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
    backgroundColor: colors.textTertiary
  },
  saveButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600'
  },
  backupCard: {
    backgroundColor: colors.cardBackground,
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
    color: colors.textSecondary,
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
    backgroundColor: colors.headerBackground
  },
  backupButtonDisabled: {
    backgroundColor: colors.textTertiary
  },
  backupButtonText: {
    color: colors.buttonText,
    fontSize: 14,
    fontWeight: '600'
  }
});

export default SettingsScreen;
