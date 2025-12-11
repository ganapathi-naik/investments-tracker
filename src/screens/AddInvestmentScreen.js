import React, { useState } from 'react';
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
import { addInvestment } from '../utils/storage';
import { INVESTMENT_TYPES } from '../models/InvestmentTypes';

const AddInvestmentScreen = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});

  const handleTypeSelect = (typeId) => {
    // Navigate to dedicated screen for Post Office RD
    if (typeId === 'POST_OFFICE_RD') {
      navigation.navigate('AddPostOfficeRD');
      return;
    }

    setSelectedType(typeId);
    setFormData({});
  };

  const handleInputChange = (fieldName, value) => {
    setFormData({
      ...formData,
      [fieldName]: value
    });
  };

  const handleSave = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select an investment type');
      return;
    }

    const type = INVESTMENT_TYPES[selectedType];

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

    // Add investment
    const investment = {
      type: selectedType,
      ...processedData
    };

    const result = await addInvestment(investment);

    if (result) {
      Alert.alert('Success', 'Investment added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Error', 'Failed to add investment');
    }
  };

  const renderTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Investment Type</Text>
      <ScrollView style={styles.typeGrid}>
        {Object.entries(INVESTMENT_TYPES)
          .sort(([, typeA], [, typeB]) => typeA.name.localeCompare(typeB.name))
          .map(([typeId, type]) => (
          <TouchableOpacity
            key={typeId}
            style={[
              styles.typeCard,
              selectedType === typeId && styles.typeCardSelected,
              { borderLeftColor: type.color }
            ]}
            onPress={() => handleTypeSelect(typeId)}
          >
            <View style={styles.typeCardContent}>
              <Text style={[
                styles.typeName,
                selectedType === typeId && styles.typeNameSelected
              ]}>
                {type.name}
              </Text>
              {selectedType === typeId && (
                <Ionicons name="checkmark-circle" size={24} color="#4A90E2" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderForm = () => {
    if (!selectedType) return null;

    const type = INVESTMENT_TYPES[selectedType];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Investment Details</Text>
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
          <Text style={styles.saveButtonText}>Save Investment</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {renderTypeSelector()}
        {renderForm()}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333'
  },
  typeGrid: {
    maxHeight: 300
  },
  typeCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderLeftWidth: 6,
    backgroundColor: '#fff'
  },
  typeCardSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#f0f7ff'
  },
  typeCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  typeName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  typeNameSelected: {
    color: '#4A90E2',
    fontWeight: '600'
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

export default AddInvestmentScreen;
