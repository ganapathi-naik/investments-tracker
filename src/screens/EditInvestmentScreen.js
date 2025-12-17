import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getInvestmentById, updateInvestment } from '../utils/storage';
import { INVESTMENT_TYPES } from '../models/InvestmentTypes';

const EditInvestmentScreen = ({ route, navigation }) => {
  const { investmentId } = route.params;
  const insets = useSafeAreaInsets();
  const [investment, setInvestment] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, [investmentId]);

  const loadData = async () => {
    const data = await getInvestmentById(investmentId);
    if (data) {
      setInvestment(data);

      // Initialize form data with current values
      const type = INVESTMENT_TYPES[data.type];
      const initialFormData = {};

      type.fields.forEach(field => {
        if (data[field.name] !== undefined) {
          // Convert dates to string format for editing
          if (field.type === 'date' && data[field.name]) {
            initialFormData[field.name] = data[field.name].split('T')[0];
          } else {
            initialFormData[field.name] = String(data[field.name]);
          }
        }
      });

      setFormData(initialFormData);
    }
  };

  const handleInputChange = (fieldName, value) => {
    setFormData({
      ...formData,
      [fieldName]: value
    });
  };

  const handleSave = async () => {
    if (!investment) return;

    const type = INVESTMENT_TYPES[investment.type];

    // Validate required fields
    const missingFields = type.fields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Fields',
        `Please fill in the following required fields:\n${missingFields.join(', ')}`
      );
      return;
    }

    // Convert number fields
    const processedData = { ...formData };
    type.fields.forEach(field => {
      if (field.type === 'number' && processedData[field.name]) {
        processedData[field.name] = parseFloat(processedData[field.name]) || 0;
      }
    });

    // Update investment
    const result = await updateInvestment(investmentId, processedData);

    if (result) {
      Alert.alert('Success', 'Investment updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Error', 'Failed to update investment');
    }
  };

  if (!investment) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const type = INVESTMENT_TYPES[investment.type];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <View style={[styles.typeHeader, { borderLeftColor: type?.color || '#999' }]}>
            <Text style={styles.typeName}>{type?.name || investment.type}</Text>
          </View>

          {type.fields.map((field) => (
            <View key={field.name} style={styles.formGroup}>
              <Text style={styles.fieldLabel}>
                {field.label}
                {field.required && <Text style={styles.required}> *</Text>}
              </Text>
              {field.type === 'text' || field.type === 'number' ? (
                <TextInput
                  style={styles.input}
                  value={formData[field.name] || ''}
                  onChangeText={(value) => handleInputChange(field.name, value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  placeholderTextColor="#999"
                  keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                />
              ) : field.type === 'date' ? (
                <TextInput
                  style={styles.input}
                  value={formData[field.name] || ''}
                  onChangeText={(value) => handleInputChange(field.name, value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                />
              ) : field.type === 'select' ? (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData[field.name] || field.options[0].value}
                    onValueChange={(value) => handleInputChange(field.name, value)}
                    style={styles.picker}
                    dropdownIconColor="#333"
                    mode="dropdown"
                  >
                    {field.options.map((option) => (
                      <Picker.Item
                        key={option.value}
                        label={option.label}
                        value={option.value}
                        color="#000000"
                        style={{ backgroundColor: '#FFFFFF' }}
                      />
                    ))}
                  </Picker>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Update Button - Fixed at Bottom */}
      <View style={[styles.saveButtonContainer, { paddingBottom: insets.bottom + 15 }]}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Update Investment</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollView: {
    flex: 1
  },
  scrollViewContent: {
    paddingBottom: 100
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999'
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  typeHeader: {
    paddingBottom: 15,
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
    borderLeftWidth: 6,
    paddingLeft: 10
  },
  typeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  formGroup: {
    marginBottom: 20
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  required: {
    color: '#E74C3C'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
    justifyContent: 'center'
  },
  picker: {
    height: 56,
    color: '#333'
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default EditInvestmentScreen;
