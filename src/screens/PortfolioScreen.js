import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { loadInvestments, loadSettings } from '../utils/storage';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [usdToInrRate, setUsdToInrRate] = useState(83.0);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (typeId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [typeId]: prev[typeId] === undefined ? false : !prev[typeId]
    }));
  };

  const loadData = async () => {
    const [data, settings] = await Promise.all([
      loadInvestments(),
      loadSettings()
    ]);
    setInvestments(data);
    setUsdToInrRate(settings.usdToInrRate);
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
    // First check if investmentName exists (newly added field for all types)
    if (investment.investmentName) {
      return investment.investmentName;
    }

    // Fallback to type-specific name fields for backwards compatibility
    switch (investment.type) {
      case 'PHYSICAL_GOLD':
        return investment.itemName || 'Physical Gold';
      case 'SGB':
        return 'Sovereign Gold Bonds';
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
        return 'Employee Provident Fund';
      case 'PPF':
        return 'Public Provident Fund';
      case 'NPS':
        return 'National Pension System';
      case 'OTHER':
        return 'Other';
      default:
        return INVESTMENT_TYPES[investment.type]?.name || 'Investment';
    }
  };

  // Filter investments based on search query
  const filteredInvestments = investments.filter((investment) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const name = getInvestmentName(investment).toLowerCase();
    const typeName = INVESTMENT_TYPES[investment.type]?.name.toLowerCase() || '';

    return name.includes(query) || typeName.includes(query);
  });

  // Group investments by type
  const groupedInvestments = filteredInvestments.reduce((groups, investment) => {
    const typeId = investment.type;
    if (!groups[typeId]) {
      groups[typeId] = [];
    }
    groups[typeId].push(investment);
    return groups;
  }, {});

  // Sort groups by type name
  const sortedGroups = Object.keys(groupedInvestments).sort((a, b) => {
    const nameA = INVESTMENT_TYPES[a]?.name || '';
    const nameB = INVESTMENT_TYPES[b]?.name || '';
    return nameA.localeCompare(nameB);
  });

  const renderInvestmentCard = (investment) => {
    const type = INVESTMENT_TYPES[investment.type];
    const invested = getInvestedAmount(investment, usdToInrRate);
    const current = getCurrentValue(investment, usdToInrRate);
    const returns = getReturns(investment, usdToInrRate);
    const returnsPercentage = getReturnsPercentage(investment, usdToInrRate);

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
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('AddInvestment')}
          >
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Box */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search investments..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredInvestments.length > 0 ? (
          sortedGroups.map((typeId) => {
            const type = INVESTMENT_TYPES[typeId];
            const typeInvestments = groupedInvestments[typeId];

            // Calculate group totals
            const groupInvested = typeInvestments.reduce((sum, inv) =>
              sum + getInvestedAmount(inv, usdToInrRate), 0
            );
            const groupCurrent = typeInvestments.reduce((sum, inv) =>
              sum + getCurrentValue(inv, usdToInrRate), 0
            );
            const groupReturns = groupCurrent - groupInvested;
            const groupReturnsPercentage = groupInvested > 0
              ? (groupReturns / groupInvested) * 100
              : 0;

            const isExpanded = expandedGroups[typeId] === undefined ? true : expandedGroups[typeId]; // Default to expanded

            return (
              <View key={typeId} style={styles.groupContainer}>
                {/* Group Header */}
                <TouchableOpacity
                  style={[
                    styles.groupHeader,
                    { borderLeftColor: type?.color || '#4A90E2' }
                  ]}
                  onPress={() => toggleGroup(typeId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.groupTitleRow}>
                    <Ionicons
                      name={isExpanded ? "chevron-down" : "chevron-forward"}
                      size={20}
                      color="#666"
                      style={styles.chevronIcon}
                    />
                    <View
                      style={[
                        styles.groupIndicator,
                        { backgroundColor: type?.color || '#999' }
                      ]}
                    />
                    <Text style={styles.groupTitle}>
                      {type?.name || typeId} ({typeInvestments.length})
                    </Text>
                  </View>
                  <View style={styles.groupStats}>
                    <Text style={styles.groupStatsText}>
                      {formatINR(groupCurrent)}
                    </Text>
                    <Text style={[
                      styles.groupReturnsText,
                      groupReturns >= 0 ? styles.positiveReturns : styles.negativeReturns
                    ]}>
                      {formatPercentage(groupReturnsPercentage)}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Group Investments */}
                {isExpanded && typeInvestments.map(renderInvestmentCard)}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No investments match your search' : 'No investments found'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddInvestment')}
              >
                <Text style={styles.addButtonText}>Add Your First Investment</Text>
              </TouchableOpacity>
            )}
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
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  headerButton: {
    padding: 5
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0
  },
  scrollView: {
    flex: 1
  },
  scrollViewContent: {
    paddingBottom: 20
  },
  groupContainer: {
    marginTop: 10,
    marginBottom: 5
  },
  groupHeader: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  chevronIcon: {
    marginRight: 8
  },
  groupIndicator: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  groupStats: {
    alignItems: 'flex-end',
    flexShrink: 0
  },
  groupStatsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333'
  },
  groupReturnsText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  investmentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 10,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  typeIndicator: {
    width: 3,
    height: 30,
    borderRadius: 1.5,
    marginRight: 12
  },
  investmentName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3
  },
  investmentQuantity: {
    fontSize: 12,
    color: '#999'
  },
  cardBody: {
    gap: 8
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  stat: {
    flex: 1
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 3
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  returnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  returnsLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 6
  },
  returnsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4
  },
  returnsPercentage: {
    fontSize: 13,
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
