import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getInvestmentById, deleteInvestment } from '../utils/storage';
import {
  getInvestedAmount,
  getCurrentValue,
  getReturns,
  getReturnsPercentage,
  formatINR,
  formatPercentage
} from '../utils/calculations';
import { INVESTMENT_TYPES } from '../models/InvestmentTypes';

const InvestmentDetailScreen = ({ route, navigation }) => {
  const { investmentId } = route.params;
  const [investment, setInvestment] = useState(null);
  const insets = useSafeAreaInsets();

  const loadData = async () => {
    const data = await getInvestmentById(investmentId);
    setInvestment(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [investmentId])
  );

  const handleEdit = () => {
    navigation.navigate('EditInvestment', { investmentId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Investment',
      'Are you sure you want to delete this investment? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteInvestment(investmentId);
            if (success) {
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to delete investment');
            }
          }
        }
      ]
    );
  };

  if (!investment) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const type = INVESTMENT_TYPES[investment.type];
  const invested = getInvestedAmount(investment);
  const current = getCurrentValue(investment);
  const returns = getReturns(investment);
  const returnsPercentage = getReturnsPercentage(investment);

  // Format display data
  const displayData = type?.displayFormat(investment);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Header Card */}
        <View style={[styles.headerCard, { borderLeftColor: type?.color || '#999' }]}>
          <Text style={styles.typeName}>{type?.name || investment.type}</Text>
          <Text style={styles.quantity}>
            {typeof displayData?.quantity === 'string'
              ? displayData.quantity
              : String(displayData?.quantity || 'N/A')}
          </Text>
        </View>

        {/* Financial Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Invested Amount</Text>
            <Text style={styles.summaryValue}>{formatINR(invested)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current Value</Text>
            <Text style={styles.summaryValue}>{formatINR(current)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Returns</Text>
            <View style={styles.returnsContainer}>
              <Text style={[
                styles.returnsValue,
                returns >= 0 ? styles.positiveReturns : styles.negativeReturns
              ]}>
                {formatINR(returns)}
              </Text>
              <Text style={[
                styles.returnsPercentage,
                returns >= 0 ? styles.positiveReturns : styles.negativeReturns
              ]}>
                {formatPercentage(returnsPercentage)}
              </Text>
            </View>
          </View>
        </View>

        {/* Investment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment Details</Text>
          {type?.fields.map((field) => {
            const value = investment[field.name];
            // Skip fields that have no value and are not required
            if (!value && !field.required) return null;

            let displayValue = value;
            if (field.type === 'date' && value) {
              displayValue = new Date(value).toLocaleDateString();
            } else if (field.type === 'select' && value) {
              // For select fields, find the label that matches the value
              const selectedOption = field.options?.find(opt => opt.value === value);
              displayValue = selectedOption?.label || value;
            }

            return (
              <View key={field.name} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{field.label}</Text>
                <Text style={styles.detailValue}>{displayValue || 'N/A'}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Actions - Fixed at Bottom */}
      <View style={[styles.actionsContainer, { paddingBottom: insets.bottom + 15 }]}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Ionicons name="pencil" size={20} color="#fff" />
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.buttonText}>Delete</Text>
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
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999'
  },
  headerCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  typeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  quantity: {
    fontSize: 16,
    color: '#666'
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 20,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666'
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  returnsContainer: {
    alignItems: 'flex-end'
  },
  returnsValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  returnsPercentage: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2
  },
  positiveReturns: {
    color: '#27AE60'
  },
  negativeReturns: {
    color: '#E74C3C'
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right'
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 10
  },
  editButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#E74C3C',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default InvestmentDetailScreen;
