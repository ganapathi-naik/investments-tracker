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

const AddPostOfficeRDScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    monthlyDeposit: '',
    interestRate: '',
    tenure: '',
    startDate: '',
    maturityDate: '',
    accountNumber: '',
    notes: ''
  });

  const handleInputChange = (fieldName, value) => {
    setFormData({
      ...formData,
      [fieldName]: value
    });

    // Auto-calculate maturity date when start date and tenure are provided
    if (fieldName === 'startDate' || fieldName === 'tenure') {
      const startDate = fieldName === 'startDate' ? value : formData.startDate;
      const tenure = fieldName === 'tenure' ? value : formData.tenure;

      if (startDate && tenure && tenure > 0) {
        calculateMaturityDate(startDate, parseInt(tenure));
      }
    }
  };

  const calculateMaturityDate = (startDate, tenureMonths) => {
    try {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) return;

      const maturity = new Date(start);
      maturity.setMonth(maturity.getMonth() + tenureMonths);

      const year = maturity.getFullYear();
      const month = String(maturity.getMonth() + 1).padStart(2, '0');
      const day = String(maturity.getDate()).padStart(2, '0');
      const maturityDateStr = `${year}-${month}-${day}`;

      setFormData(prev => ({
        ...prev,
        maturityDate: maturityDateStr
      }));
    } catch (error) {
      console.error('Error calculating maturity date:', error);
    }
  };

  const calculateProjectedReturns = () => {
    const { monthlyDeposit, tenure, interestRate } = formData;

    if (!monthlyDeposit || !tenure || !interestRate) {
      return null;
    }

    const P = parseFloat(monthlyDeposit);
    const n = parseInt(tenure);
    const r = parseFloat(interestRate);

    if (isNaN(P) || isNaN(n) || isNaN(r) || P <= 0 || n <= 0 || r <= 0) {
      return null;
    }

    const totalDeposited = P * n;
    // RD maturity calculation: Interest = P * n * (n+1) * (2n+1) / (6 * 12) * r/100
    const interest = (P * n * (n + 1) * (2 * n + 1)) / (6 * 12) * (r / 100);
    const maturityAmount = totalDeposited + interest;

    return {
      totalDeposited,
      interest,
      maturityAmount,
      returnPercentage: ((interest / totalDeposited) * 100).toFixed(2)
    };
  };

  const handleSave = async () => {
    // Validate required fields
    const requiredFields = [
      { field: 'monthlyDeposit', label: 'Monthly Deposit' },
      { field: 'interestRate', label: 'Interest Rate' },
      { field: 'tenure', label: 'Tenure' },
      { field: 'startDate', label: 'Start Date' },
      { field: 'maturityDate', label: 'Maturity Date' }
    ];

    const missingFields = requiredFields
      .filter(({ field }) => !formData[field])
      .map(({ label }) => label);

    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Fields',
        `Please fill in the following required fields:\n${missingFields.join(', ')}`
      );
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.startDate) || !dateRegex.test(formData.maturityDate)) {
      Alert.alert('Invalid Date', 'Please use YYYY-MM-DD format for dates');
      return;
    }

    // Convert number fields
    const investment = {
      type: 'POST_OFFICE_RD',
      monthlyDeposit: parseFloat(formData.monthlyDeposit) || 0,
      interestRate: parseFloat(formData.interestRate) || 0,
      tenure: parseInt(formData.tenure) || 0,
      startDate: formData.startDate,
      maturityDate: formData.maturityDate,
      accountNumber: formData.accountNumber || '',
      notes: formData.notes || ''
    };

    const result = await addInvestment(investment);

    if (result) {
      Alert.alert('Success', 'Post Office RD added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Error', 'Failed to add investment');
    }
  };

  const projectedReturns = calculateProjectedReturns();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.section}>
          <View style={styles.header}>
            <Ionicons name="mail" size={32} color="#D35400" />
            <Text style={styles.headerTitle}>Post Office RD</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Add your Post Office Recurring Deposit details
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>
              Monthly Deposit <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.monthlyDeposit}
              onChangeText={(value) => handleInputChange('monthlyDeposit', value)}
              placeholder="Enter monthly deposit amount"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>
              Interest Rate (%) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.interestRate}
              onChangeText={(value) => handleInputChange('interestRate', value)}
              placeholder="Enter interest rate"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>
              Tenure (months) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.tenure}
              onChangeText={(value) => handleInputChange('tenure', value)}
              placeholder="Enter tenure in months"
              keyboardType="numeric"
            />
            <Text style={styles.fieldHint}>
              Common tenures: 12, 24, 36, 60 months
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>
              Start Date <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.startDate}
              onChangeText={(value) => handleInputChange('startDate', value)}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>
              Maturity Date <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.inputAutoFilled]}
              value={formData.maturityDate}
              onChangeText={(value) => handleInputChange('maturityDate', value)}
              placeholder="YYYY-MM-DD (auto-calculated)"
              editable={true}
            />
            <Text style={styles.fieldHint}>
              Auto-calculated based on start date and tenure
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Account Number</Text>
            <TextInput
              style={styles.input}
              value={formData.accountNumber}
              onChangeText={(value) => handleInputChange('accountNumber', value)}
              placeholder="Enter account number (optional)"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              placeholder="Add any notes (optional)"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {projectedReturns && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projected Returns</Text>
            <View style={styles.projectionCard}>
              <View style={styles.projectionRow}>
                <Text style={styles.projectionLabel}>Total Deposited:</Text>
                <Text style={styles.projectionValue}>
                  ₹{projectedReturns.totalDeposited.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.projectionRow}>
                <Text style={styles.projectionLabel}>Interest Earned:</Text>
                <Text style={[styles.projectionValue, styles.interestValue]}>
                  ₹{projectedReturns.interest.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={[styles.projectionRow, styles.projectionRowTotal]}>
                <Text style={styles.projectionLabelTotal}>Maturity Amount:</Text>
                <Text style={styles.projectionValueTotal}>
                  ₹{projectedReturns.maturityAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.returnPercentageRow}>
                <Ionicons name="trending-up" size={16} color="#27AE60" />
                <Text style={styles.returnPercentage}>
                  {projectedReturns.returnPercentage}% returns
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.saveButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="save" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Post Office RD</Text>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12
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
  inputAutoFilled: {
    backgroundColor: '#f0f7ff'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  fieldHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic'
  },
  projectionCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  projectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  projectionRowTotal: {
    borderTopWidth: 2,
    borderTopColor: '#D35400',
    paddingTop: 10,
    marginTop: 5
  },
  projectionLabel: {
    fontSize: 14,
    color: '#666'
  },
  projectionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  projectionLabelTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  projectionValueTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D35400'
  },
  interestValue: {
    color: '#27AE60'
  },
  returnPercentageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  returnPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27AE60',
    marginLeft: 5
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
    backgroundColor: '#D35400',
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

export default AddPostOfficeRDScreen;
