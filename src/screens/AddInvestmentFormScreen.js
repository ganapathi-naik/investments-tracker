import React, { useState, useMemo, useCallback } from 'react';
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
import { addInvestment } from '../utils/storage';
import { INVESTMENT_TYPES } from '../models/InvestmentTypes';
import { useTheme } from '../utils/useTheme';
import { scheduleMaturityNotifications } from '../services/notificationService';

const AddInvestmentFormScreen = ({ navigation, route }) => {
    const { isDark, colors } = useTheme();
  const styles = getStyles(colors);
const { investmentType } = route.params;
  const type = useMemo(() => INVESTMENT_TYPES[investmentType], [investmentType]);
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({});

  const handleInputChange = useCallback((fieldName, value) => {
    setFormData(prevData => ({
      ...prevData,
      [fieldName]: value
    }));
  }, []);

  const handleSave = useCallback(async () => {
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
  }, [formData, investmentType, navigation, type]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollViewContent, { paddingBottom: insets.bottom + 92 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: type.color }]}>
              <Ionicons name="document-text" size={24} color={colors.cardBackground} />
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
                  placeholderTextColor={colors.textTertiary}
                  keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                />
              ) : field.type === 'date' ? (
                <TextInput
                  style={styles.input}
                  value={formData[field.name] || ''}
                  onChangeText={(value) => handleInputChange(field.name, value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                />
              ) : field.type === 'select' ? (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData[field.name] || field.options[0].value}
                    onValueChange={(value) => handleInputChange(field.name, value)}
                    style={styles.picker}
                    dropdownIconColor={colors.textPrimary}
                    mode="dropdown"
                  >
                    {field.options.map((option) => (
                      <Picker.Item
                        key={option.value}
                        label={option.label}
                        value={option.value}
                        color={colors.textPrimary}
                        style={{ backgroundColor: colors.cardBackground }}
                      />
                    ))}
                  </Picker>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.saveButtonContainer, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: type.color }]} onPress={handleSave}>
          <Ionicons name="save" size={20} color={colors.buttonIcon} />
          <Text style={styles.saveButtonText}>Save Investment</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollView: {
    flex: 1
  },
  scrollViewContent: {
  },
  section: {
    backgroundColor: colors.cardBackground,
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
    color: colors.textPrimary,
    flex: 1
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 5
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.textPrimary
  },
  formGroup: {
    marginBottom: 20
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8
  },
  required: {
    color: '#E74C3C'
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.cardBackground,
    color: colors.inputText
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
    overflow: 'hidden',
    justifyContent: 'center'
  },
  picker: {
    height: 56,
    color: colors.textPrimary
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.cardBackground,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
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
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600'
  }
});

export default AddInvestmentFormScreen;
