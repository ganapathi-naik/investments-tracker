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
import { scheduleMaturityNotifications } from '../services/notificationService';

const AddInvestmentFormScreen = ({ navigation, route }) => {
  const { investmentType } = route.params;
  const type = INVESTMENT_TYPES[investmentType];

  const [formData, setFormData] = useState({});

  const handleInputChange = (fieldName, value) => {
    setFormData({
      ...formData,
      [fieldName]: value
    });
  };

  const handleSave = async () => {
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
      type: investmentType,
      ...processedData
    };

    const result = await addInvestment(investment);

    if (result) {
      // Reschedule maturity notifications after adding investment
      await scheduleMaturityNotifications();

      Alert.alert('Success', 'Investment added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Error', 'Failed to add investment');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.section}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: type.color }]}>
              <Ionicons name="document-text" size={24} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>{type.name}</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Add your {type.name.toLowerCase()} details
          </Text>
        </View>

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
        </View>
      </ScrollView>

      <View style={styles.saveButtonContainer}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: type.color }]} onPress={handleSave}>
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Investment</Text>
        </TouchableOpacity>
      </View>
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
  scrollViewContent: {
    paddingBottom: 100
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
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
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  saveButton: {
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

export default AddInvestmentFormScreen;
