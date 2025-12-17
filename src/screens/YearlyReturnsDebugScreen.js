import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadInvestments } from '../utils/storage';
import { formatINR } from '../utils/calculations';
import { INVESTMENT_TYPES } from '../models/InvestmentTypes';

const YearlyReturnsDebugScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [investments, setInvestments] = useState([]);
  const [selectedYear, setSelectedYear] = useState(
    route.params?.selectedYear || new Date().getFullYear().toString()
  );
  const [breakdown, setBreakdown] = useState([]);
  const [totalReturns, setTotalReturns] = useState(0);

  const loadData = async () => {
    const data = await loadInvestments();
    setInvestments(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      // Update selected year from route params if available
      if (route.params?.selectedYear) {
        setSelectedYear(route.params.selectedYear);
      }
    }, [route.params?.selectedYear])
  );

  const calculateYearlyReturnsBreakdown = (year) => {
    const yearNum = parseInt(year);
    if (isNaN(yearNum)) return { breakdown: [], total: 0 };

    const yearStart = new Date(yearNum, 0, 1);
    const yearEnd = new Date(yearNum, 11, 31);
    const details = [];
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
      let calculationDetails = '';

      switch (investment.type) {
        case 'EPF':
        case 'PPF':
        case 'NPS':
          if (investment.startDate && investment.lastUpdated) {
            const startDate = new Date(investment.startDate);
            const lastUpdate = new Date(investment.lastUpdated);

            if (startDate <= yearEnd && lastUpdate >= yearStart) {
              isActiveInYear = true;
              const balance = investment.balance || 0;
              yearlyInterest = balance * (interestRate / 100);
              calculationDetails = `Balance: ${formatINR(balance)} × ${interestRate}%`;
            }
          }
          break;

        case 'POST_OFFICE_SAVINGS':
          if (investment.openingDate && investment.lastUpdated) {
            const opening = new Date(investment.openingDate);
            const lastUpdate = new Date(investment.lastUpdated);

            if (opening <= yearEnd && lastUpdate >= yearStart) {
              isActiveInYear = true;
              const balance = investment.balance || 0;
              yearlyInterest = balance * (interestRate / 100);
              calculationDetails = `Balance: ${formatINR(balance)} × ${interestRate}%`;
            }
          }
          break;

        case 'FIXED_DEPOSIT':
        case 'POST_OFFICE_TD':
          if (investment.startDate && investment.maturityDate) {
            const fdStart = new Date(investment.startDate);
            const fdMaturity = new Date(investment.maturityDate);

            if (fdStart <= yearEnd && fdMaturity >= yearStart) {
              isActiveInYear = true;
              const principal = investment.principal || 0;
              const payoutType = investment.interestPayoutType || 'cumulative';

              if (payoutType === 'non-cumulative') {
                yearlyInterest = principal * (interestRate / 100);
                calculationDetails = `Non-Cumulative: ${formatINR(principal)} × ${interestRate}%`;
              } else {
                const yearsFromStart = Math.max(0, (yearStart - fdStart) / (1000 * 60 * 60 * 24 * 365.25));
                const freq = (investment.compoundingFrequency || 'yearly').toLowerCase();
                let n;
                switch (freq) {
                  case 'monthly': n = 12; break;
                  case 'quarterly': n = 4; break;
                  case 'halfyearly':
                  case 'half-yearly':
                  case 'semi-annually': n = 2; break;
                  case 'yearly': n = 1; break;
                  case 'simple': n = 1; break;
                  default: n = 1;
                }

                if (freq === 'simple') {
                  yearlyInterest = principal * (interestRate / 100);
                  calculationDetails = `Simple Interest: ${formatINR(principal)} × ${interestRate}%`;
                } else {
                  const balanceAtYearStart = principal * Math.pow((1 + interestRate / (100 * n)), n * yearsFromStart);
                  const balanceAtYearEnd = principal * Math.pow((1 + interestRate / (100 * n)), n * (yearsFromStart + 1));
                  yearlyInterest = balanceAtYearEnd - balanceAtYearStart;
                  calculationDetails = `Cumulative (Year ${Math.floor(yearsFromStart) + 1}): ${formatINR(balanceAtYearStart)} → ${formatINR(balanceAtYearEnd)}`;
                }
              }
            }
          }
          break;

        case 'RECURRING_DEPOSIT':
        case 'POST_OFFICE_RD':
          if (investment.startDate && investment.maturityDate) {
            const rdStart = new Date(investment.startDate);
            const rdMaturity = new Date(investment.maturityDate);

            if (rdStart <= yearEnd && rdMaturity >= yearStart) {
              isActiveInYear = true;
              const rdMonthly = investment.monthlyDeposit || 0;
              const avgMonths = 6;
              yearlyInterest = (rdMonthly * avgMonths) * (interestRate / 100);
              calculationDetails = `Monthly: ${formatINR(rdMonthly)} × 6 months × ${interestRate}%`;
            }
          }
          break;

        case 'POST_OFFICE_SCSS':
          if (investment.startDate && investment.maturityDate) {
            const scssStart = new Date(investment.startDate);
            const scssMaturity = new Date(investment.maturityDate);

            if (scssStart <= yearEnd && scssMaturity >= yearStart) {
              isActiveInYear = true;
              const principal = investment.principal || 0;
              yearlyInterest = principal * (interestRate / 100);
              calculationDetails = `Principal: ${formatINR(principal)} × ${interestRate}%`;
            }
          }
          break;

        case 'POST_OFFICE_MIS':
          if (investment.startDate && investment.maturityDate) {
            const misStart = new Date(investment.startDate);
            const misMaturity = new Date(investment.maturityDate);

            if (misStart <= yearEnd && misMaturity >= yearStart) {
              isActiveInYear = true;
              const activeStart = misStart > yearStart ? misStart : yearStart;
              const activeEnd = misMaturity < yearEnd ? misMaturity : yearEnd;
              const monthsActive = Math.round((activeEnd - activeStart) / (1000 * 60 * 60 * 24 * 30.44));
              yearlyInterest = (investment.monthlyIncome || 0) * Math.min(monthsActive, 12);
              calculationDetails = `Monthly Income: ${formatINR(investment.monthlyIncome || 0)} × ${Math.min(monthsActive, 12)} months`;
            }
          }
          break;

        case 'POST_OFFICE_KVP':
        case 'POST_OFFICE_NSC':
          if (investment.purchaseDate && investment.maturityDate && investment.maturityAmount && investment.principal) {
            const kvpStart = new Date(investment.purchaseDate);
            const kvpMaturity = new Date(investment.maturityDate);

            if (kvpStart <= yearEnd && kvpMaturity >= yearStart) {
              isActiveInYear = true;
              const totalReturns = (investment.maturityAmount || 0) - (investment.principal || 0);
              const totalYears = (kvpMaturity - kvpStart) / (1000 * 60 * 60 * 24 * 365.25);
              if (totalYears > 0) {
                yearlyInterest = totalReturns / totalYears;
                calculationDetails = `Total Returns: ${formatINR(totalReturns)} ÷ ${totalYears.toFixed(1)} years`;
              }
            }
          }
          break;

        case 'BONDS':
          if (investment.issueDate && investment.maturityDate) {
            const bondIssue = new Date(investment.issueDate);
            const bondMaturity = new Date(investment.maturityDate);

            if (bondIssue <= yearEnd && bondMaturity >= yearStart) {
              isActiveInYear = true;
              const faceValue = investment.faceValue || 0;
              const couponRate = investment.couponRate || 0;
              yearlyInterest = faceValue * (couponRate / 100);
              calculationDetails = `Face Value: ${formatINR(faceValue)} × ${couponRate}%`;
            }
          }
          break;

        case 'SGB':
          if (investment.purchaseDate && investment.maturityDate) {
            const sgbPurchase = new Date(investment.purchaseDate);
            const sgbMaturity = new Date(investment.maturityDate);

            if (sgbPurchase <= yearEnd && sgbMaturity >= yearStart) {
              isActiveInYear = true;
              const units = investment.units || 0;
              const issuePrice = investment.issuePrice || 0;
              yearlyInterest = units * issuePrice * (interestRate / 100);
              calculationDetails = `${units} units × ${formatINR(issuePrice)} × ${interestRate}%`;
            }
          }
          break;

        case 'POST_OFFICE_MSSC':
          if (investment.depositDate && investment.maturityDate) {
            const msscStart = new Date(investment.depositDate);
            const msscMaturity = new Date(investment.maturityDate);

            if (msscStart <= yearEnd && msscMaturity >= yearStart) {
              isActiveInYear = true;
              const principal = investment.principal || 0;
              const yearsFromStart = Math.max(0, (yearStart - msscStart) / (1000 * 60 * 60 * 24 * 365.25));
              const n = 4; // Quarterly compounding
              const balanceAtYearStart = principal * Math.pow((1 + interestRate / (100 * n)), n * yearsFromStart);
              const balanceAtYearEnd = principal * Math.pow((1 + interestRate / (100 * n)), n * (yearsFromStart + 1));
              yearlyInterest = balanceAtYearEnd - balanceAtYearStart;
              calculationDetails = `Quarterly Compounding (Year ${Math.floor(yearsFromStart) + 1}): ${formatINR(balanceAtYearStart)} → ${formatINR(balanceAtYearEnd)}`;
            }
          }
          break;
      }

      if (isActiveInYear) {
        const typeName = INVESTMENT_TYPES[investment.type]?.name || investment.type;
        const investmentName = getInvestmentName(investment, typeName);

        details.push({
          name: investmentName,
          type: typeName,
          amount: yearlyInterest,
          calculation: calculationDetails,
          color: INVESTMENT_TYPES[investment.type]?.color || '#999'
        });
        totalYearlyReturns += yearlyInterest;
      }
    });

    return { breakdown: details, total: totalYearlyReturns };
  };

  const getInvestmentName = (investment, typeName) => {
    // First check if investmentName exists (newly added field for all types)
    if (investment.investmentName) {
      return investment.investmentName;
    }

    // Fallback to type-specific name fields for backwards compatibility
    switch (investment.type) {
      case 'EPF':
      case 'PPF':
      case 'NPS':
      case 'SGB':
        return typeName;
      case 'FIXED_DEPOSIT':
      case 'RECURRING_DEPOSIT':
        return investment.bankName || typeName;
      case 'POST_OFFICE_SCSS':
      case 'POST_OFFICE_SAVINGS':
      case 'POST_OFFICE_MIS':
      case 'POST_OFFICE_KVP':
      case 'POST_OFFICE_TD':
      case 'POST_OFFICE_NSC':
      case 'POST_OFFICE_RD':
      case 'POST_OFFICE_MSSC':
        return investment.accountNumber ? `${typeName} (${investment.accountNumber})` : typeName;
      case 'BONDS':
        return investment.bondName || typeName;
      default:
        return typeName;
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    if (year.length === 4 && !isNaN(year)) {
      const yearNum = parseInt(year);
      if (yearNum >= 1900 && yearNum <= 2100) {
        const result = calculateYearlyReturnsBreakdown(year);
        setBreakdown(result.breakdown);
        setTotalReturns(result.total);
      } else {
        setBreakdown([]);
        setTotalReturns(0);
      }
    } else {
      setBreakdown([]);
      setTotalReturns(0);
    }
  };

  // Calculate on load
  useFocusEffect(
    useCallback(() => {
      if (investments.length > 0) {
        const result = calculateYearlyReturnsBreakdown(selectedYear);
        setBreakdown(result.breakdown);
        setTotalReturns(result.total);
      }
    }, [investments, selectedYear])
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yearly Returns Debug</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollViewContent, { paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.yearInputCard}>
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
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Interest/Returns for {selectedYear}:</Text>
              <Text style={styles.totalValue}>{formatINR(totalReturns)}</Text>
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Breakdown by Investment:</Text>
              {breakdown.length > 0 ? (
                breakdown.map((item, index) => (
                  <View key={index} style={styles.breakdownItem}>
                    <View style={styles.breakdownHeader}>
                      <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                      <View style={styles.breakdownInfo}>
                        <Text style={styles.breakdownName}>{item.name}</Text>
                        <Text style={styles.breakdownType}>{item.type}</Text>
                      </View>
                      <Text style={styles.breakdownAmount}>{formatINR(item.amount)}</Text>
                    </View>
                    <Text style={styles.breakdownCalculation}>{item.calculation}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No interest-bearing investments active in {selectedYear}</Text>
              )}
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Please enter a valid year (YYYY)</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  scrollView: {
    flex: 1
  },
  scrollViewContent: {
  },
  yearInputCard: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center'
  },
  yearLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 15,
    fontWeight: '600'
  },
  yearInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: 100,
    backgroundColor: '#fff'
  },
  totalCard: {
    backgroundColor: '#27AE60',
    margin: 10,
    borderRadius: 10,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4
  },
  totalLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff'
  },
  breakdownCard: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  breakdownItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
    marginBottom: 8
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10
  },
  breakdownInfo: {
    flex: 1
  },
  breakdownName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  breakdownType: {
    fontSize: 12,
    color: '#666'
  },
  breakdownAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60'
  },
  breakdownCalculation: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 20
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20
  },
  emptyCard: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    padding: 40,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#999'
  }
});

export default YearlyReturnsDebugScreen;
