import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator
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

// Memoized Investment Card Component for better performance
const InvestmentCard = React.memo(({ investment, usdToInrRate, onPress }) => {
  const type = INVESTMENT_TYPES[investment.type];
  const invested = getInvestedAmount(investment, usdToInrRate);
  const current = getCurrentValue(investment, usdToInrRate);
  const returns = getReturns(investment, usdToInrRate);
  const returnsPercentage = getReturnsPercentage(investment, usdToInrRate);

  // Helper function to get investment name
  const getInvestmentName = (investment) => {
    if (investment.investmentName) {
      return investment.investmentName;
    }

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

  // Helper function to get display text
  const getInvestmentDisplayText = (investment) => {
    const type = INVESTMENT_TYPES[investment.type];
    if (!type) return 'Unknown';

    if (investment.type === 'PHYSICAL_GOLD') {
      const grams = investment.grams || 0;
      return `${grams} grams`;
    }

    const displayData = type.displayFormat(investment);
    if (typeof displayData.quantity === 'string') {
      return displayData.quantity;
    }

    return String(displayData.quantity || 'N/A');
  };

  return (
    <TouchableOpacity
      style={styles.investmentCard}
      onPress={onPress}
      activeOpacity={0.7}
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
});

InvestmentCard.displayName = 'InvestmentCard';

const PortfolioScreen = ({ navigation }) => {
  const [investments, setInvestments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [usdToInrRate, setUsdToInrRate] = useState(83.0);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = useCallback((typeId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [typeId]: prev[typeId] === undefined ? false : !prev[typeId]
    }));
  }, []);

  const loadData = async () => {
    try {
      const [data, settings] = await Promise.all([
        loadInvestments(),
        loadSettings()
      ]);
      setInvestments(data);
      setUsdToInrRate(settings.usdToInrRate);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Memoized filtered investments
  const filteredInvestments = useMemo(() => {
    if (!searchQuery) return investments;

    const query = searchQuery.toLowerCase();
    return investments.filter((investment) => {
      const type = INVESTMENT_TYPES[investment.type];
      const name = (investment.investmentName ||
        investment.fundName ||
        investment.stockName ||
        investment.bankName ||
        investment.propertyName ||
        investment.policyName ||
        type?.name || ''
      ).toLowerCase();
      const typeName = type?.name.toLowerCase() || '';

      return name.includes(query) || typeName.includes(query);
    });
  }, [investments, searchQuery]);

  // Memoized grouped investments with calculated totals
  const groupedInvestmentsWithTotals = useMemo(() => {
    const grouped = filteredInvestments.reduce((groups, investment) => {
      const typeId = investment.type;
      if (!groups[typeId]) {
        groups[typeId] = {
          investments: [],
          invested: 0,
          current: 0,
          returns: 0,
          returnsPercentage: 0
        };
      }
      groups[typeId].investments.push(investment);

      // Calculate totals as we group
      const invested = getInvestedAmount(investment, usdToInrRate);
      const current = getCurrentValue(investment, usdToInrRate);
      groups[typeId].invested += invested;
      groups[typeId].current += current;

      return groups;
    }, {});

    // Calculate returns and percentage for each group
    Object.keys(grouped).forEach(typeId => {
      const group = grouped[typeId];
      group.returns = group.current - group.invested;
      group.returnsPercentage = group.invested > 0
        ? (group.returns / group.invested) * 100
        : 0;
    });

    return grouped;
  }, [filteredInvestments, usdToInrRate]);

  // Memoized sorted groups
  const sortedGroups = useMemo(() => {
    return Object.keys(groupedInvestmentsWithTotals).sort((a, b) => {
      const nameA = INVESTMENT_TYPES[a]?.name || '';
      const nameB = INVESTMENT_TYPES[b]?.name || '';
      return nameA.localeCompare(nameB);
    });
  }, [groupedInvestmentsWithTotals]);

  const collapseAll = useCallback(() => {
    const allCollapsed = {};
    sortedGroups.forEach(typeId => {
      allCollapsed[typeId] = false;
    });
    setExpandedGroups(allCollapsed);
  }, [sortedGroups]);

  const expandAll = useCallback(() => {
    const allExpanded = {};
    sortedGroups.forEach(typeId => {
      allExpanded[typeId] = true;
    });
    setExpandedGroups(allExpanded);
  }, [sortedGroups]);

  const areAllCollapsed = useCallback(() => {
    if (sortedGroups.length === 0) return false;
    return sortedGroups.every(typeId => expandedGroups[typeId] === false);
  }, [sortedGroups, expandedGroups]);

  // Show loading spinner during initial load
  if (loading) {
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

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading your investments...</Text>
        </View>
      </View>
    );
  }

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
        {filteredInvestments.length > 0 && (
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={areAllCollapsed() ? expandAll : collapseAll}
          >
            <Ionicons
              name={areAllCollapsed() ? "expand-outline" : "contract-outline"}
              size={20}
              color="#4A90E2"
            />
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
            const groupData = groupedInvestmentsWithTotals[typeId];
            const typeInvestments = groupData.investments;
            const isExpanded = expandedGroups[typeId] === undefined ? true : expandedGroups[typeId];

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
                      {formatINR(groupData.current)}
                    </Text>
                    <Text style={[
                      styles.groupReturnsText,
                      groupData.returns >= 0 ? styles.positiveReturns : styles.negativeReturns
                    ]}>
                      {formatPercentage(groupData.returnsPercentage)}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Group Investments */}
                {isExpanded && typeInvestments.map(investment => (
                  <InvestmentCard
                    key={investment.id}
                    investment={investment}
                    usdToInrRate={usdToInrRate}
                    onPress={() => navigation.navigate('InvestmentDetail', { investmentId: investment.id })}
                  />
                ))}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500'
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
  collapseButton: {
    marginLeft: 10,
    padding: 5
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
