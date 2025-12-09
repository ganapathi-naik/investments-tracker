import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { loadInvestments } from '../utils/storage';
import {
  calculateTotalInvested,
  calculateTotalCurrentValue,
  calculateTotalReturns,
  calculateReturnsPercentage,
  formatINR,
  formatPercentage,
  calculatePortfolioAllocation
} from '../utils/calculations';
import { INVESTMENT_TYPES } from '../models/InvestmentTypes';

const DashboardScreen = ({ navigation }) => {
  const [investments, setInvestments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalInvested: 0,
    currentValue: 0,
    totalReturns: 0,
    returnsPercentage: 0
  });

  const loadData = async () => {
    const data = await loadInvestments();
    setInvestments(data);

    // Calculate stats
    const totalInvested = calculateTotalInvested(data);
    const currentValue = calculateTotalCurrentValue(data);
    const totalReturns = calculateTotalReturns(data);
    const returnsPercentage = calculateReturnsPercentage(data);

    setStats({
      totalInvested,
      currentValue,
      totalReturns,
      returnsPercentage
    });
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const portfolioAllocation = calculatePortfolioAllocation(investments);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Investment Tracker</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.investedCard]}>
            <Text style={styles.summaryLabel}>Total Invested</Text>
            <Text style={styles.summaryValue}>{formatINR(stats.totalInvested)}</Text>
          </View>

          <View style={[styles.summaryCard, styles.currentCard]}>
            <Text style={styles.summaryLabel}>Current Value</Text>
            <Text style={styles.summaryValue}>{formatINR(stats.currentValue)}</Text>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.returnsCard]}>
            <Text style={styles.summaryLabel}>Total Returns</Text>
            <Text style={[
              styles.summaryValue,
              stats.totalReturns >= 0 ? styles.positiveReturns : styles.negativeReturns
            ]}>
              {formatINR(stats.totalReturns)}
            </Text>
            <Text style={[
              styles.percentageText,
              stats.totalReturns >= 0 ? styles.positiveReturns : styles.negativeReturns
            ]}>
              {formatPercentage(stats.returnsPercentage)}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.countCard]}>
            <Text style={styles.summaryLabel}>Investments</Text>
            <Text style={styles.summaryValue}>{investments.length}</Text>
            <Text style={styles.percentageText}>Total Count</Text>
          </View>
        </View>

        {/* Portfolio Allocation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio Allocation</Text>
          {portfolioAllocation.length > 0 ? (
            portfolioAllocation.map((allocation, index) => {
              const type = INVESTMENT_TYPES[allocation.type];
              return (
                <View key={index} style={styles.allocationItem}>
                  <View style={styles.allocationLeft}>
                    <View
                      style={[
                        styles.allocationColor,
                        { backgroundColor: type?.color || '#999' }
                      ]}
                    />
                    <View>
                      <Text style={styles.allocationName}>{type?.name || allocation.type}</Text>
                      <Text style={styles.allocationCount}>{allocation.count} investments</Text>
                    </View>
                  </View>
                  <View style={styles.allocationRight}>
                    <Text style={styles.allocationValue}>{formatINR(allocation.value)}</Text>
                    <Text style={styles.allocationPercentage}>
                      {allocation.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No investments yet</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddInvestment')}
          >
            <Ionicons name="add-circle" size={24} color="#4A90E2" />
            <Text style={styles.actionButtonText}>Add New Investment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddInvestment')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
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
    padding: 20,
    paddingTop: 50
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  scrollView: {
    flex: 1
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 10
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  investedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB'
  },
  currentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#27AE60'
  },
  returnsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F39C12'
  },
  countCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#9B59B6'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  percentageText: {
    fontSize: 14,
    marginTop: 5,
    fontWeight: '600'
  },
  positiveReturns: {
    color: '#27AE60'
  },
  negativeReturns: {
    color: '#E74C3C'
  },
  section: {
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
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
  allocationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  allocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  allocationColor: {
    width: 4,
    height: 40,
    marginRight: 10,
    borderRadius: 2
  },
  allocationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  allocationCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  allocationRight: {
    alignItems: 'flex-end'
  },
  allocationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  allocationPercentage: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  actionButtonText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#4A90E2',
    fontWeight: '600'
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  }
});

export default DashboardScreen;
