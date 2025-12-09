import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadInvestments } from '../utils/storage';
import {
  groupInvestmentsByType,
  calculateTotalInvested,
  calculateTotalCurrentValue,
  calculateTotalReturns,
  formatINR,
  formatPercentage
} from '../utils/calculations';
import { INVESTMENT_TYPES } from '../models/InvestmentTypes';

const { width } = Dimensions.get('window');

const ReportsScreen = () => {
  const [investments, setInvestments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState([]);

  const loadData = async () => {
    const data = await loadInvestments();
    setInvestments(data);

    // Generate report data by investment type
    const grouped = groupInvestmentsByType(data);
    const totalCurrentValue = calculateTotalCurrentValue(data);

    const reports = Object.entries(grouped).map(([typeId, typeInvestments]) => {
      const invested = calculateTotalInvested(typeInvestments);
      const current = calculateTotalCurrentValue(typeInvestments);
      const returns = calculateTotalReturns(typeInvestments);
      const returnsPercentage = invested > 0 ? ((returns / invested) * 100) : 0;
      const allocationPercentage = totalCurrentValue > 0 ? ((current / totalCurrentValue) * 100) : 0;

      return {
        typeId,
        type: INVESTMENT_TYPES[typeId],
        count: typeInvestments.length,
        invested,
        current,
        returns,
        returnsPercentage,
        allocationPercentage,
        investments: typeInvestments
      };
    });

    // Sort by current value (descending)
    reports.sort((a, b) => b.current - a.current);
    setReportData(reports);
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

  const totalInvested = calculateTotalInvested(investments);
  const totalCurrent = calculateTotalCurrentValue(investments);
  const totalReturns = calculateTotalReturns(investments);
  const totalReturnsPercentage = totalInvested > 0 ? ((totalReturns / totalInvested) * 100) : 0;

  // Helper function to get investment details for display (fixing Physical Gold bug)
  const getInvestmentDetails = (investment) => {
    const type = INVESTMENT_TYPES[investment.type];
    if (!type) return { name: 'Unknown', quantity: 'N/A' };

    let name = type.name;
    let quantity = '';

    // Special handling for Physical Gold to fix the "[object Object]" bug
    if (investment.type === 'PHYSICAL_GOLD') {
      const grams = investment.grams || 0;
      quantity = `${grams} grams`;
    } else {
      // For other types, use the displayFormat function
      const displayData = type.displayFormat(investment);
      quantity = typeof displayData.quantity === 'string'
        ? displayData.quantity
        : String(displayData.quantity || 'N/A');
    }

    // Get specific name for the investment
    switch (investment.type) {
      case 'MUTUAL_FUND':
        name = investment.fundName || name;
        break;
      case 'STOCKS':
      case 'US_STOCKS':
        name = investment.stockName || investment.symbol || name;
        break;
      case 'RSU':
      case 'ESPP':
        name = investment.companyName || name;
        break;
      case 'CRYPTOCURRENCY':
        name = investment.coinName || investment.symbol || name;
        break;
      case 'FIXED_DEPOSIT':
      case 'RECURRING_DEPOSIT':
        name = investment.bankName || name;
        break;
      case 'REAL_ESTATE':
        name = investment.propertyName || name;
        break;
      case 'BONDS':
        name = investment.bondName || name;
        break;
      case 'INSURANCE':
        name = investment.policyName || name;
        break;
      case 'OTHER':
        name = investment.investmentName || name;
        break;
    }

    return { name, quantity };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overall Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Portfolio Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Invested:</Text>
            <Text style={styles.summaryValue}>{formatINR(totalInvested)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current Value:</Text>
            <Text style={styles.summaryValue}>{formatINR(totalCurrent)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Returns:</Text>
            <Text style={[
              styles.summaryValue,
              totalReturns >= 0 ? styles.positiveReturns : styles.negativeReturns
            ]}>
              {formatINR(totalReturns)} ({formatPercentage(totalReturnsPercentage)})
            </Text>
          </View>
        </View>

        {/* Type-wise Reports */}
        {reportData.map((report) => (
          <View key={report.typeId} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View
                style={[
                  styles.typeIndicator,
                  { backgroundColor: report.type?.color || '#999' }
                ]}
              />
              <View style={styles.reportHeaderText}>
                <Text style={styles.reportTitle}>{report.type?.name || report.typeId}</Text>
                <Text style={styles.reportSubtitle}>
                  {report.count} investment{report.count !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <View style={styles.reportStats}>
              <View style={styles.statColumn}>
                <Text style={styles.statLabel}>Invested</Text>
                <Text style={styles.statValue}>{formatINR(report.invested)}</Text>
              </View>
              <View style={styles.statColumn}>
                <Text style={styles.statLabel}>Current</Text>
                <Text style={styles.statValue}>{formatINR(report.current)}</Text>
              </View>
            </View>

            <View style={styles.reportStats}>
              <View style={styles.statColumn}>
                <Text style={styles.statLabel}>Returns</Text>
                <Text style={[
                  styles.statValue,
                  report.returns >= 0 ? styles.positiveReturns : styles.negativeReturns
                ]}>
                  {formatINR(report.returns)}
                </Text>
                <Text style={[
                  styles.percentageText,
                  report.returns >= 0 ? styles.positiveReturns : styles.negativeReturns
                ]}>
                  {formatPercentage(report.returnsPercentage)}
                </Text>
              </View>
              <View style={styles.statColumn}>
                <Text style={styles.statLabel}>Allocation</Text>
                <Text style={styles.statValue}>
                  {report.allocationPercentage.toFixed(1)}%
                </Text>
              </View>
            </View>

            {/* Allocation Bar */}
            <View style={styles.allocationBarContainer}>
              <View
                style={[
                  styles.allocationBar,
                  {
                    width: `${report.allocationPercentage}%`,
                    backgroundColor: report.type?.color || '#999'
                  }
                ]}
              />
            </View>

            {/* Investment List for this type */}
            <View style={styles.investmentList}>
              <Text style={styles.investmentListTitle}>Investments:</Text>
              {report.investments.map((investment) => {
                const details = getInvestmentDetails(investment);
                const invested = calculateTotalInvested([investment]);
                const current = calculateTotalCurrentValue([investment]);
                const returns = calculateTotalReturns([investment]);

                return (
                  <View key={investment.id} style={styles.investmentItem}>
                    <View style={styles.investmentItemLeft}>
                      <Text style={styles.investmentItemName}>{details.name}</Text>
                      <Text style={styles.investmentItemQuantity}>{details.quantity}</Text>
                    </View>
                    <View style={styles.investmentItemRight}>
                      <Text style={styles.investmentItemValue}>{formatINR(current)}</Text>
                      <Text style={[
                        styles.investmentItemReturns,
                        returns >= 0 ? styles.positiveReturns : styles.negativeReturns
                      ]}>
                        {formatINR(returns)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {reportData.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No data to display</Text>
            <Text style={styles.emptySubtext}>Add investments to see reports</Text>
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
  scrollView: {
    flex: 1
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666'
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  typeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12
  },
  reportHeaderText: {
    flex: 1
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  reportSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  statColumn: {
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
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  positiveReturns: {
    color: '#27AE60'
  },
  negativeReturns: {
    color: '#E74C3C'
  },
  allocationBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 15
  },
  allocationBar: {
    height: '100%',
    borderRadius: 4
  },
  investmentList: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10
  },
  investmentListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10
  },
  investmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8'
  },
  investmentItemLeft: {
    flex: 1
  },
  investmentItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  investmentItemQuantity: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },
  investmentItemRight: {
    alignItems: 'flex-end'
  },
  investmentItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  investmentItemReturns: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 16,
    color: '#999'
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8
  }
});

export default ReportsScreen;
