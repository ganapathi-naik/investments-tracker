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
import { calculateYearlyReturnsComparison, getLastNYears, getPerformanceHighlights, calculateMonthlyReturns } from '../utils/analytics';

const { width } = Dimensions.get('window');

const ReportsScreen = () => {
  const navigation = useNavigation();
  const [investments, setInvestments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [usdToInrRate, setUsdToInrRate] = useState(83.0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [yearlyReturns, setYearlyReturns] = useState(0);
  const [yearComparison, setYearComparison] = useState([]);
  const [performanceHighlights, setPerformanceHighlights] = useState({ topPerformers: [], bottomPerformers: [] });
  const [monthlyReturns, setMonthlyReturns] = useState([]);
  const [expandedTypes, setExpandedTypes] = useState({});

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

  const toggleType = useCallback((typeId) => {
    setExpandedTypes(prev => ({
      ...prev,
      [typeId]: prev[typeId] === undefined ? false : !prev[typeId]
    }));
  }, []);

  const collapseAll = useCallback(() => {
    const allCollapsed = {};
    reportData.forEach(report => {
      allCollapsed[report.typeId] = false;
    });
    setExpandedTypes(allCollapsed);
  }, [reportData]);

  const expandAll = useCallback(() => {
    const allExpanded = {};
    reportData.forEach(report => {
      allExpanded[report.typeId] = true;
    });
    setExpandedTypes(allExpanded);
  }, [reportData]);

  const areAllCollapsed = useCallback(() => {
    if (reportData.length === 0) return false;
    return reportData.every(report => expandedTypes[report.typeId] === false);
  }, [reportData, expandedTypes]);

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

  // Calculate initial yearly returns, year comparison, and performance highlights
  useFocusEffect(
    useCallback(() => {
      const returns = calculateYearlyReturns(selectedYear);
      setYearlyReturns(returns);

      // Calculate year-over-year comparison for last 5 years
      const years = getLastNYears(5);
      const comparison = calculateYearlyReturnsComparison(investments, years);
      setYearComparison(comparison);

      // Calculate performance highlights
      const highlights = getPerformanceHighlights(investments, usdToInrRate);
      setPerformanceHighlights(highlights);

      // Calculate monthly returns for current year
      const monthly = calculateMonthlyReturns(investments, parseInt(selectedYear));
      setMonthlyReturns(monthly);
    }, [investments, selectedYear, usdToInrRate])
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
              onPress={() => navigation.navigate('YearlyReturnsBreakdown', { selectedYear })}
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

        {/* Year-over-Year Comparison */}
        {yearComparison.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryTitle, { marginBottom: 15 }]}>Year-over-Year Comparison</Text>
            <Text style={styles.comparisonSubtitle}>
              Interest earned over the last 5 years
            </Text>
            {yearComparison.map((yearData, index) => {
              const maxReturns = Math.max(...yearComparison.map(y => y.returns), 1);
              const barWidth = (yearData.returns / maxReturns) * 100;

              return (
                <View key={yearData.year} style={styles.comparisonRow}>
                  <Text style={styles.comparisonYear}>{yearData.year}</Text>
                  <View style={styles.comparisonBarContainer}>
                    <View
                      style={[
                        styles.comparisonBar,
                        {
                          width: `${barWidth}%`,
                          backgroundColor: yearData.year === selectedYear ? '#4A90E2' : '#27AE60'
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.comparisonValue}>
                    {formatINR(yearData.returns)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Monthly Returns Breakdown */}
        {monthlyReturns.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryTitle, { marginBottom: 15 }]}>Monthly Interest Breakdown</Text>
            <Text style={styles.comparisonSubtitle}>
              Month-by-month interest earned in {selectedYear}
            </Text>
            <View style={styles.monthlyGrid}>
              {monthlyReturns.map((monthData, index) => {
                const maxMonthlyReturns = Math.max(...monthlyReturns.map(m => m.returns), 1);
                const barHeight = (monthData.returns / maxMonthlyReturns) * 100;
                const currentMonth = new Date().getMonth() + 1;
                const currentYear = new Date().getFullYear();
                const isCurrentMonth = monthData.month === currentMonth && parseInt(selectedYear) === currentYear;
                const isFutureMonth = (parseInt(selectedYear) === currentYear && monthData.month > currentMonth) ||
                                     (parseInt(selectedYear) > currentYear);

                // Format value compactly for display
                const formatCompactValue = (value) => {
                  if (value === 0) return '-';
                  if (value >= 10000000) {
                    // Show in crores: ₹12C
                    return `₹${Math.round(value / 10000000)}C`;
                  } else if (value >= 100000) {
                    // Show in lakhs: ₹12L
                    return `₹${Math.round(value / 100000)}L`;
                  } else if (value >= 1000) {
                    // Show in thousands: ₹12K
                    return `₹${Math.round(value / 1000)}K`;
                  } else {
                    // Show full amount for small values
                    return `₹${Math.round(value)}`;
                  }
                };

                return (
                  <View key={monthData.month} style={styles.monthlyItem}>
                    <View style={styles.monthlyBarContainer}>
                      <View
                        style={[
                          styles.monthlyBar,
                          {
                            height: isFutureMonth ? '5%' : `${Math.max(barHeight, 5)}%`,
                            backgroundColor: isCurrentMonth ? '#4A90E2' :
                                           isFutureMonth ? '#E0E0E0' : '#27AE60',
                            opacity: isFutureMonth ? 0.3 : 1
                          }
                        ]}
                      />
                    </View>
                    <Text style={[
                      styles.monthlyLabel,
                      isCurrentMonth && styles.currentMonthLabel
                    ]}>
                      {monthData.monthName}
                    </Text>
                    {!isFutureMonth && (
                      <Text style={styles.monthlyValue}>
                        {formatCompactValue(monthData.returns)}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
            <Text style={styles.yearlyReturnsNote}>
              * Shows estimated monthly interest distribution for the selected year
            </Text>
          </View>
        )}

        {/* Performance Highlights */}
        {(performanceHighlights.topPerformers.length > 0 || performanceHighlights.bottomPerformers.length > 0) && (
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryTitle, { marginBottom: 15 }]}>Performance Highlights</Text>

            {/* Top Performers */}
            {performanceHighlights.topPerformers.length > 0 && (
              <View style={styles.performanceSection}>
                <View style={styles.performanceHeader}>
                  <Ionicons name="trending-up" size={20} color="#27AE60" />
                  <Text style={styles.performanceSectionTitle}>Top Performers</Text>
                </View>
                {performanceHighlights.topPerformers.map((item, index) => {
                  const details = getInvestmentDetails(item.investment);
                  return (
                    <View key={item.investment.id} style={styles.performanceItem}>
                      <View style={styles.performanceRank}>
                        <Text style={styles.performanceRankText}>{index + 1}</Text>
                      </View>
                      <View style={styles.performanceInfo}>
                        <Text style={styles.performanceName}>{details.name}</Text>
                        <Text style={styles.performanceQuantity}>{details.quantity}</Text>
                      </View>
                      <View style={styles.performanceStats}>
                        <Text style={[styles.performanceReturn, styles.positiveReturns]}>
                          {formatPercentage(item.returnsPercentage)}
                        </Text>
                        <Text style={[styles.performanceAmount, styles.positiveReturns]}>
                          {formatINR(item.returns)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Bottom Performers */}
            {performanceHighlights.bottomPerformers.length > 0 && (
              <View style={[styles.performanceSection, { marginTop: 20 }]}>
                <View style={styles.performanceHeader}>
                  <Ionicons name="trending-down" size={20} color="#E74C3C" />
                  <Text style={styles.performanceSectionTitle}>Needs Attention</Text>
                </View>
                {performanceHighlights.bottomPerformers.map((item, index) => {
                  const details = getInvestmentDetails(item.investment);
                  return (
                    <View key={item.investment.id} style={styles.performanceItem}>
                      <View style={[styles.performanceRank, { backgroundColor: '#FFE5E5' }]}>
                        <Text style={[styles.performanceRankText, { color: '#E74C3C' }]}>{index + 1}</Text>
                      </View>
                      <View style={styles.performanceInfo}>
                        <Text style={styles.performanceName}>{details.name}</Text>
                        <Text style={styles.performanceQuantity}>{details.quantity}</Text>
                      </View>
                      <View style={styles.performanceStats}>
                        <Text style={[styles.performanceReturn, item.returns >= 0 ? styles.positiveReturns : styles.negativeReturns]}>
                          {formatPercentage(item.returnsPercentage)}
                        </Text>
                        <Text style={[styles.performanceAmount, item.returns >= 0 ? styles.positiveReturns : styles.negativeReturns]}>
                          {formatINR(item.returns)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Type-wise Reports */}
        {reportData.length > 0 && (
          <View style={styles.typeReportsHeader}>
            <Text style={styles.typeReportsTitle}>Type-wise Reports</Text>
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
          </View>
        )}

        {reportData.map((report) => {
          const isExpanded = expandedTypes[report.typeId] === undefined ? true : expandedTypes[report.typeId];

          return (
            <View key={report.typeId} style={styles.reportCard}>
              <TouchableOpacity
                style={styles.reportHeader}
                onPress={() => toggleType(report.typeId)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isExpanded ? "chevron-down" : "chevron-forward"}
                  size={20}
                  color="#666"
                  style={styles.chevronIcon}
                />
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
              </TouchableOpacity>

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
            {isExpanded && (
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
            )}
          </View>
          );
        })}

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
  typeReportsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginHorizontal: 10,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  typeReportsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  collapseButton: {
    padding: 5
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
  chevronIcon: {
    marginRight: 8
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
  },
  comparisonSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
    fontStyle: 'italic'
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  comparisonYear: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 50
  },
  comparisonBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden'
  },
  comparisonBar: {
    height: '100%',
    borderRadius: 4,
    minWidth: 2
  },
  comparisonValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    width: 80,
    textAlign: 'right'
  },
  performanceSection: {
    marginBottom: 10
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  performanceSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 10
  },
  performanceRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  performanceRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#27AE60'
  },
  performanceInfo: {
    flex: 1
  },
  performanceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2
  },
  performanceQuantity: {
    fontSize: 12,
    color: '#999'
  },
  performanceStats: {
    alignItems: 'flex-end'
  },
  performanceReturn: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2
  },
  performanceAmount: {
    fontSize: 12,
    fontWeight: '600'
  },
  monthlyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 15,
    paddingHorizontal: 5,
    marginBottom: 10
  },
  monthlyItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2
  },
  monthlyBarContainer: {
    height: 120,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8
  },
  monthlyBar: {
    width: '80%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 5
  },
  monthlyLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textAlign: 'center'
  },
  currentMonthLabel: {
    color: '#4A90E2',
    fontWeight: 'bold'
  },
  monthlyValue: {
    fontSize: 8,
    color: '#27AE60',
    fontWeight: '600',
    textAlign: 'center'
  }
});

export default ReportsScreen;
