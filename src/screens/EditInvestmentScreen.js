import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getInvestmentById, updateInvestment } from '../utils/storage';
import { INVESTMENT_TYPES } from '../models/InvestmentTypes';

const EditInvestmentScreen = ({ route, navigation }) => {
  const { investmentId } = route.params;
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
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
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
                  keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                />
              ) : field.type === 'date' ? (
                <TextInput
                  style={styles.input}
                  value={formData[field.name] || ''}
                  onChangeText={(value) => handleInputChange(field.name, value)}
                  placeholder="YYYY-MM-DD"
                />
              ) : null}
            </View>
          ))}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="save" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Update Investment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  saveButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    gap: 8
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default EditInvestmentScreen;
