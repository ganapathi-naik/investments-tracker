import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { loadInvestments } from '../utils/storage';
import {
  getInvestedAmount,
  getCurrentValue,
  getReturns,
  getReturnsPercentage,
  formatINR,
  formatPercentage
} from '../utils/calculations';
import { INVESTMENT_TYPES } from '../models/InvestmentTypes';

const PortfolioScreen = ({ navigation }) => {
  const [investments, setInvestments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const loadData = async () => {
    const data = await loadInvestments();
    setInvestments(data);
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

  // Helper function to safely get display text for Physical Gold and other investments
  const getInvestmentDisplayText = (investment) => {
    const type = INVESTMENT_TYPES[investment.type];
    if (!type) return 'Unknown';

    // Special handling for Physical Gold to fix the "[object Object]" bug
    if (investment.type === 'PHYSICAL_GOLD') {
      const grams = investment.grams || 0;
      return `${grams} grams`;
    }

    // For other investment types, use the displayFormat function
    const displayData = type.displayFormat(investment);

    // Return the quantity as a string (not an object)
    if (typeof displayData.quantity === 'string') {
      return displayData.quantity;
    }

    // Fallback for any unexpected format
    return String(displayData.quantity || 'N/A');
  };

  // Helper function to get investment name
  const getInvestmentName = (investment) => {
    switch (investment.type) {
      case 'PHYSICAL_GOLD':
        return 'Physical Gold';
      case 'SGB':
        return 'SGB';
      case 'MUTUAL_FUND':
        return investment.fundName || 'Mutual Fund';
      case 'STOCKS':
        return investment.stockName || investment.symbol || 'Stock';
      case 'US_STOCKS':
        return investment.stockName || investment.symbol || 'US Stock';
      case 'RSU':
        return investment.companyName || 'RSU';
      case 'ESPP':
        return investment.companyName || 'ESPP';
      case 'CRYPTOCURRENCY':
        return investment.coinName || investment.symbol || 'Crypto';
      case 'FIXED_DEPOSIT':
        return investment.bankName || 'Fixed Deposit';
      case 'RECURRING_DEPOSIT':
        return investment.bankName || 'Recurring Deposit';
      case 'REAL_ESTATE':
        return investment.propertyName || 'Real Estate';
      case 'BONDS':
        return investment.bondName || 'Bond';
      case 'INSURANCE':
        return investment.policyName || 'Insurance';
      case 'EPF':
        return 'EPF';
      case 'PPF':
        return 'PPF';
      case 'NPS':
        return 'NPS';
      case 'OTHER':
        return investment.investmentName || 'Other';
      default:
        return 'Investment';
    }
  };

  const filteredInvestments = filter === 'ALL'
    ? investments
    : investments.filter(inv => inv.type === filter);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portfolio</Text>
      </View>

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterPill, filter === 'ALL' && styles.filterPillActive]}
          onPress={() => setFilter('ALL')}
        >
          <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {Object.keys(INVESTMENT_TYPES).map((typeId) => {
          const type = INVESTMENT_TYPES[typeId];
          const count = investments.filter(inv => inv.type === typeId).length;
          if (count === 0) return null;

          return (
            <TouchableOpacity
              key={typeId}
              style={[styles.filterPill, filter === typeId && styles.filterPillActive]}
              onPress={() => setFilter(typeId)}
            >
              <Text style={[styles.filterText, filter === typeId && styles.filterTextActive]}>
                {type.name} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredInvestments.length > 0 ? (
          filteredInvestments.map((investment) => {
            const type = INVESTMENT_TYPES[investment.type];
            const invested = getInvestedAmount(investment);
            const current = getCurrentValue(investment);
            const returns = getReturns(investment);
            const returnsPercentage = getReturnsPercentage(investment);

            return (
              <TouchableOpacity
                key={investment.id}
                style={styles.investmentCard}
                onPress={() => navigation.navigate('InvestmentDetail', { investmentId: investment.id })}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <View
                      style={[
                        styles.typeIndicator,
                        { backgroundColor: type?.color || '#999' }
                      ]}
                    />
                    <View>
                      <Text style={styles.investmentName}>
                        {getInvestmentName(investment)}
                      </Text>
                      <Text style={styles.investmentType}>
                        {type?.name || investment.type}
                      </Text>
                      <Text style={styles.investmentQuantity}>
                        {getInvestmentDisplayText(investment)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.statRow}>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Invested</Text>
                      <Text style={styles.statValue}>{formatINR(invested)}</Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Current</Text>
                      <Text style={styles.statValue}>{formatINR(current)}</Text>
                    </View>
                  </View>

                  <View style={styles.returnsRow}>
                    <Text style={styles.returnsLabel}>Returns:</Text>
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
                      ({formatPercentage(returnsPercentage)})
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No investments found</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddInvestment')}
            >
              <Text style={styles.addButtonText}>Add Your First Investment</Text>
            </TouchableOpacity>
          </View>
        )}
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
    padding: 20,
    paddingTop: 50
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8
  },
  filterPillActive: {
    backgroundColor: '#4A90E2'
  },
  filterText: {
    fontSize: 14,
    color: '#666'
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  scrollView: {
    flex: 1
  },
  investmentCard: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  typeIndicator: {
    width: 4,
    height: 50,
    borderRadius: 2,
    marginRight: 12
  },
  investmentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2
  },
  investmentType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2
  },
  investmentQuantity: {
    fontSize: 12,
    color: '#999'
  },
  cardBody: {
    gap: 10
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  stat: {
    flex: 1
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  returnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  returnsLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8
  },
  returnsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4
  },
  returnsPercentage: {
    fontSize: 14,
    fontWeight: '600'
  },
  positiveReturns: {
    color: '#27AE60'
  },
  negativeReturns: {
    color: '#E74C3C'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24
  },
  addButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default PortfolioScreen;
