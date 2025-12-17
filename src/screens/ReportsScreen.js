import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { loadInvestments, loadSettings } from '../utils/storage';
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
  const navigation = useNavigation();
  const [investments, setInvestments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [usdToInrRate, setUsdToInrRate] = useState(83.0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [yearlyReturns, setYearlyReturns] = useState(0);

  const loadData = async () => {
    const [data, settings] = await Promise.all([
      loadInvestments(),
      loadSettings()
    ]);
    setInvestments(data);
    setUsdToInrRate(settings.usdToInrRate);

    // Generate report data by investment type
    const grouped = groupInvestmentsByType(data);
    const totalCurrentValue = calculateTotalCurrentValue(data, settings.usdToInrRate);

    const reports = Object.entries(grouped).map(([typeId, typeInvestments]) => {
      const invested = calculateTotalInvested(typeInvestments, settings.usdToInrRate);
      const current = calculateTotalCurrentValue(typeInvestments, settings.usdToInrRate);
      const returns = calculateTotalReturns(typeInvestments, settings.usdToInrRate);
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

  const totalInvested = calculateTotalInvested(investments, usdToInrRate);
  const totalCurrent = calculateTotalCurrentValue(investments, usdToInrRate);
  const totalReturns = calculateTotalReturns(investments, usdToInrRate);
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

    // First check if investmentName exists (newly added field for all types)
    if (investment.investmentName) {
      name = investment.investmentName;
    } else {
      // Get specific name for the investment from type-specific fields
      switch (investment.type) {
        case 'PHYSICAL_GOLD':
          name = investment.itemName || name;
          break;
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
      }
    }

    return { name, quantity };
  };

  // Calculate returns for a specific year based on interest-bearing investments
  const calculateYearlyReturns = (year) => {
    const yearNum = parseInt(year);
    if (isNaN(yearNum)) return 0;

    const yearStart = new Date(yearNum, 0, 1);
    const yearEnd = new Date(yearNum, 11, 31);
    let totalYearlyReturns = 0;

    investments.forEach(investment => {
      const interestRate = investment.interestRate || 0;

      // Only calculate for interest-bearing investment types
      if (!['EPF', 'PPF', 'FIXED_DEPOSIT', 'RECURRING_DEPOSIT', 'NPS',
           'POST_OFFICE_SCSS', 'POST_OFFICE_SAVINGS', 'POST_OFFICE_MIS',
           'POST_OFFICE_KVP', 'POST_OFFICE_TD', 'POST_OFFICE_NSC',
           'POST_OFFICE_RD', 'POST_OFFICE_MSSC', 'BONDS', 'SGB'].includes(investment.type)) {
        return;
      }

      let yearlyInterest = 0;
      let isActiveInYear = false;

      switch (investment.type) {
        case 'EPF':
        case 'PPF':
        case 'NPS':
          // Check if investment existed in this year
          // Investment must have started before/during the year AND have evidence of being active
          if (investment.startDate && investment.lastUpdated) {
            const startDate = new Date(investment.startDate);
            const lastUpdate = new Date(investment.lastUpdated);

            // Investment is active in the year if:
            // 1. It started on or before the year end
            // 2. It was last updated on or after the year start (proving it was active during/after the year)
            if (startDate <= yearEnd && lastUpdate >= yearStart) {
              isActiveInYear = true;
              yearlyInterest = (investment.balance || 0) * (interestRate / 100);
            }
          }
          break;

        case 'POST_OFFICE_SAVINGS':
          // Check if account was active in this year
          // Account must be opened before/during the year AND have evidence of being active
          if (investment.openingDate && investment.lastUpdated) {
            const opening = new Date(investment.openingDate);
            const lastUpdate = new Date(investment.lastUpdated);

            // Account is active in the year if:
            // 1. It was opened on or before the year end
            // 2. It was last updated on or after the year start (proving it was active during/after the year)
            if (opening <= yearEnd && lastUpdate >= yearStart) {
              isActiveInYear = true;
              yearlyInterest = (investment.balance || 0) * (interestRate / 100);
            }
          }
          break;

        case 'FIXED_DEPOSIT':
        case 'POST_OFFICE_TD':
          // Check if FD was active during the year
          if (investment.startDate && investment.maturityDate) {
            const fdStart = new Date(investment.startDate);
            const fdMaturity = new Date(investment.maturityDate);

            if (fdStart <= yearEnd && fdMaturity >= yearStart) {
              isActiveInYear = true;
              const principal = investment.principal || 0;
              const payoutType = investment.interestPayoutType || 'cumulative'; // Default to cumulative

              if (payoutType === 'non-cumulative') {
                // Non-cumulative: Interest paid out, principal stays same
                yearlyInterest = principal * (interestRate / 100);
              } else {
                // Cumulative: Interest compounds, need to calculate based on compounded balance
                // Calculate years elapsed from start to beginning of this year
                const yearsFromStart = Math.max(0, (yearStart - fdStart) / (1000 * 60 * 60 * 24 * 365.25));

                // Determine compounding frequency
                const freq = (investment.compoundingFrequency || 'yearly').toLowerCase();
                let n; // compounding periods per year
                switch (freq) {
                  case 'monthly': n = 12; break;
                  case 'quarterly': n = 4; break;
                  case 'halfyearly':
                  case 'half-yearly':
                  case 'semi-annually': n = 2; break;
                  case 'yearly': n = 1; break;
                  case 'simple': n = 1; break; // For simple interest
                  default: n = 1;
                }

                if (freq === 'simple') {
                  // Simple interest doesn't compound
                  yearlyInterest = principal * (interestRate / 100);
                } else {
                  // Compound interest: Calculate balance at start and end of year
                  const balanceAtYearStart = principal * Math.pow((1 + interestRate / (100 * n)), n * yearsFromStart);
                  const balanceAtYearEnd = principal * Math.pow((1 + interestRate / (100 * n)), n * (yearsFromStart + 1));
                  yearlyInterest = balanceAtYearEnd - balanceAtYearStart;
                }
              }
            }
          }
          break;

        case 'RECURRING_DEPOSIT':
        case 'POST_OFFICE_RD':
          // Check if RD was active during the year
          if (investment.startDate && investment.maturityDate) {
            const rdStart = new Date(investment.startDate);
            const rdMaturity = new Date(investment.maturityDate);

            if (rdStart <= yearEnd && rdMaturity >= yearStart) {
              isActiveInYear = true;
              // Calculate interest on average balance for the year
              const rdMonthly = investment.monthlyDeposit || 0;
              const avgMonths = 6; // Average months in the year
              yearlyInterest = (rdMonthly * avgMonths) * (interestRate / 100);
            }
          }
          break;

        case 'POST_OFFICE_SCSS':
          // SCSS pays quarterly interest
          if (investment.startDate && investment.maturityDate) {
            const scssStart = new Date(investment.startDate);
            const scssMaturity = new Date(investment.maturityDate);

            if (scssStart <= yearEnd && scssMaturity >= yearStart) {
              isActiveInYear = true;
              yearlyInterest = (investment.principal || 0) * (interestRate / 100);
            }
          }
          break;

        case 'POST_OFFICE_MIS':
          // MIS pays monthly income
          if (investment.startDate && investment.maturityDate) {
            const misStart = new Date(investment.startDate);
            const misMaturity = new Date(investment.maturityDate);

            if (misStart <= yearEnd && misMaturity >= yearStart) {
              isActiveInYear = true;
              // Count actual months active in this year
              const activeStart = misStart > yearStart ? misStart : yearStart;
              const activeEnd = misMaturity < yearEnd ? misMaturity : yearEnd;
              const monthsActive = Math.round((activeEnd - activeStart) / (1000 * 60 * 60 * 24 * 30.44));
              yearlyInterest = (investment.monthlyIncome || 0) * Math.min(monthsActive, 12);
            }
          }
          break;

        case 'POST_OFFICE_KVP':
        case 'POST_OFFICE_NSC':
          // These have fixed maturity, calculate proportional interest
          if (investment.purchaseDate && investment.maturityDate && investment.maturityAmount && investment.principal) {
            const kvpStart = new Date(investment.purchaseDate);
            const kvpMaturity = new Date(investment.maturityDate);

            if (kvpStart <= yearEnd && kvpMaturity >= yearStart) {
              isActiveInYear = true;
              const totalReturns = (investment.maturityAmount || 0) - (investment.principal || 0);
              const totalYears = (kvpMaturity - kvpStart) / (1000 * 60 * 60 * 24 * 365.25);
              if (totalYears > 0) {
                yearlyInterest = totalReturns / totalYears;
              }
            }
          }
          break;

        case 'BONDS':
          // Coupon payment - check if bond was held in this year
          if (investment.issueDate && investment.maturityDate) {
            const bondIssue = new Date(investment.issueDate);
            const bondMaturity = new Date(investment.maturityDate);

            if (bondIssue <= yearEnd && bondMaturity >= yearStart) {
              isActiveInYear = true;
              yearlyInterest = (investment.faceValue || 0) * ((investment.couponRate || 0) / 100);
            }
          }
          break;

        case 'SGB':
          // SGB interest - check if SGB was held in this year
          if (investment.purchaseDate && investment.maturityDate) {
            const sgbPurchase = new Date(investment.purchaseDate);
            const sgbMaturity = new Date(investment.maturityDate);

            if (sgbPurchase <= yearEnd && sgbMaturity >= yearStart) {
              isActiveInYear = true;
              yearlyInterest = (investment.units || 0) * (investment.issuePrice || 0) * (interestRate / 100);
            }
          }
          break;

        case 'POST_OFFICE_MSSC':
          // MSSC has quarterly compounding
          if (investment.depositDate && investment.maturityDate) {
            const msscStart = new Date(investment.depositDate);
            const msscMaturity = new Date(investment.maturityDate);

            if (msscStart <= yearEnd && msscMaturity >= yearStart) {
              isActiveInYear = true;
              const principal = investment.principal || 0;

              // Calculate years from deposit to beginning of this year
              const yearsFromStart = Math.max(0, (yearStart - msscStart) / (1000 * 60 * 60 * 24 * 365.25));

              // Quarterly compounding
              const n = 4;
              const balanceAtYearStart = principal * Math.pow((1 + interestRate / (100 * n)), n * yearsFromStart);
              const balanceAtYearEnd = principal * Math.pow((1 + interestRate / (100 * n)), n * (yearsFromStart + 1));
              yearlyInterest = balanceAtYearEnd - balanceAtYearStart;
            }
          }
          break;
      }

      if (isActiveInYear) {
        totalYearlyReturns += yearlyInterest;
      }
    });

    return totalYearlyReturns;
  };

  // Update yearly returns when year or investments change
  const handleYearChange = (year) => {
    setSelectedYear(year);
    // Only calculate if year is valid (4 digits and reasonable range)
    if (year.length === 4 && !isNaN(year)) {
      const yearNum = parseInt(year);
      if (yearNum >= 1900 && yearNum <= 2100) {
        const returns = calculateYearlyReturns(year);
        setYearlyReturns(returns);
      } else {
        setYearlyReturns(0);
      }
    } else {
      setYearlyReturns(0);
    }
  };

  // Calculate initial yearly returns
  useFocusEffect(
    useCallback(() => {
      const returns = calculateYearlyReturns(selectedYear);
      setYearlyReturns(returns);
    }, [investments, selectedYear])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overall Summary */}
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { marginBottom: 15 }]}>Portfolio Summary</Text>
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

        {/* Yearly Interest/Returns Card */}
        <View style={styles.summaryCard}>
          <View style={styles.yearlyTitleRow}>
            <Text style={styles.summaryTitle}>Yearly Interest Earned</Text>
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => navigation.navigate('YearlyReturnsDebug', { selectedYear })}
            >
              <Ionicons name="information-circle-outline" size={24} color="#4A90E2" />
            </TouchableOpacity>
          </View>
          <View style={styles.yearInputContainer}>
            <Text style={styles.yearLabel}>Select Year:</Text>
            <TextInput
              style={styles.yearInput}
              value={selectedYear}
              onChangeText={handleYearChange}
              keyboardType="numeric"
              maxLength={4}
              placeholder="YYYY"
              placeholderTextColor="#999"
            />
          </View>
          {selectedYear.length === 4 && !isNaN(selectedYear) && parseInt(selectedYear) >= 1900 && parseInt(selectedYear) <= 2100 ? (
            <>
              <View style={styles.yearlyReturnsRow}>
                <Text style={styles.yearlyReturnsLabel}>Interest/Returns for {selectedYear}:</Text>
                <Text style={[styles.yearlyReturnsValue, styles.positiveReturns]}>
                  {formatINR(yearlyReturns)}
                </Text>
              </View>
              <Text style={styles.yearlyReturnsNote}>
                * Calculated for interest-bearing investments (EPF, PPF, FDs, Bonds, etc.)
              </Text>
            </>
          ) : (
            <Text style={styles.yearlyReturnsNote}>
              Please enter a valid year (YYYY)
            </Text>
          )}
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
                const invested = calculateTotalInvested([investment], usdToInrRate);
                const current = calculateTotalCurrentValue([investment], usdToInrRate);
                const returns = calculateTotalReturns([investment], usdToInrRate);

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
  scrollView: {
    flex: 1
  },
  scrollViewContent: {
    paddingBottom: 20
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
    color: '#333'
  },
  yearlyTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  debugButton: {
    padding: 4
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
  yearInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5
  },
  yearLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10
  },
  yearInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    width: 100,
    backgroundColor: '#fff'
  },
  yearlyReturnsRow: {
    marginBottom: 10
  },
  yearlyReturnsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  yearlyReturnsValue: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  yearlyReturnsNote: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5
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
