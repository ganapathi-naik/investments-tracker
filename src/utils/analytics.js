// Utility functions for investment analytics

/**
 * Calculate yearly returns for multiple years
 * @param {Array} investments - Array of investment objects
 * @param {Array} years - Array of years to calculate for
 * @returns {Array} Array of {year, returns} objects
 */
export const calculateYearlyReturnsComparison = (investments, years) => {
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
          if (investment.startDate && investment.lastUpdated) {
            const startDate = new Date(investment.startDate);
            const lastUpdate = new Date(investment.lastUpdated);

            if (startDate <= yearEnd && lastUpdate >= yearStart) {
              isActiveInYear = true;
              yearlyInterest = (investment.balance || 0) * (interestRate / 100);
            }
          }
          break;

        case 'POST_OFFICE_SAVINGS':
          if (investment.openingDate && investment.lastUpdated) {
            const opening = new Date(investment.openingDate);
            const lastUpdate = new Date(investment.lastUpdated);

            if (opening <= yearEnd && lastUpdate >= yearStart) {
              isActiveInYear = true;
              yearlyInterest = (investment.balance || 0) * (interestRate / 100);
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
                } else {
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
          if (investment.startDate && investment.maturityDate) {
            const rdStart = new Date(investment.startDate);
            const rdMaturity = new Date(investment.maturityDate);

            if (rdStart <= yearEnd && rdMaturity >= yearStart) {
              isActiveInYear = true;
              const rdMonthly = investment.monthlyDeposit || 0;
              const avgMonths = 6;
              yearlyInterest = (rdMonthly * avgMonths) * (interestRate / 100);
            }
          }
          break;

        case 'POST_OFFICE_SCSS':
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
          if (investment.startDate && investment.maturityDate) {
            const misStart = new Date(investment.startDate);
            const misMaturity = new Date(investment.maturityDate);

            if (misStart <= yearEnd && misMaturity >= yearStart) {
              isActiveInYear = true;
              const activeStart = misStart > yearStart ? misStart : yearStart;
              const activeEnd = misMaturity < yearEnd ? misMaturity : yearEnd;
              const monthsActive = Math.round((activeEnd - activeStart) / (1000 * 60 * 60 * 24 * 30.44));
              yearlyInterest = (investment.monthlyIncome || 0) * Math.min(monthsActive, 12);
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
              yearlyInterest = (investment.faceValue || 0) * ((investment.couponRate || 0) / 100);
            }
          }
          break;

        case 'SGB':
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
          if (investment.depositDate && investment.maturityDate) {
            const msscStart = new Date(investment.depositDate);
            const msscMaturity = new Date(investment.maturityDate);

            if (msscStart <= yearEnd && msscMaturity >= yearStart) {
              isActiveInYear = true;
              const principal = investment.principal || 0;
              const yearsFromStart = Math.max(0, (yearStart - msscStart) / (1000 * 60 * 60 * 24 * 365.25));
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

  return years.map(year => ({
    year: year.toString(),
    returns: calculateYearlyReturns(year)
  }));
};

/**
 * Get last N years including current year
 * @param {number} n - Number of years
 * @returns {Array} Array of years
 */
export const getLastNYears = (n = 5) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = n - 1; i >= 0; i--) {
    years.push(currentYear - i);
  }
  return years;
};

/**
 * Get best and worst performing investments
 * @param {Array} investments - Array of investment objects
 * @param {number} usdToInrRate - USD to INR exchange rate
 * @returns {Object} Object with topPerformers and bottomPerformers arrays
 */
export const getPerformanceHighlights = (investments, usdToInrRate = 83.0) => {
  if (!investments || investments.length === 0) {
    return { topPerformers: [], bottomPerformers: [] };
  }

  // Import calculation functions (will be used at runtime)
  const { getReturns, getReturnsPercentage, getInvestedAmount, getCurrentValue } = require('./calculations');

  // Calculate returns percentage for each investment
  const investmentsWithReturns = investments.map(investment => {
    const invested = getInvestedAmount(investment, usdToInrRate);
    const current = getCurrentValue(investment, usdToInrRate);
    const returns = getReturns(investment, usdToInrRate);
    const returnsPercentage = getReturnsPercentage(investment, usdToInrRate);

    return {
      investment,
      invested,
      current,
      returns,
      returnsPercentage
    };
  }).filter(item => item.invested > 0); // Filter out investments with no invested amount

  if (investmentsWithReturns.length === 0) {
    return { topPerformers: [], bottomPerformers: [] };
  }

  // Sort by returns percentage
  const sorted = [...investmentsWithReturns].sort((a, b) => b.returnsPercentage - a.returnsPercentage);

  // Only show performance highlights if there are at least 4 investments
  // This prevents the same investment from appearing in both top and bottom
  if (sorted.length < 4) {
    // If less than 4 investments, only show top performers
    return {
      topPerformers: sorted.slice(0, Math.min(3, sorted.length)),
      bottomPerformers: []
    };
  }

  // Get top 3 and bottom 3 (ensuring no overlap)
  const topPerformers = sorted.slice(0, 3);
  const bottomPerformers = sorted.slice(-3).reverse();

  return {
    topPerformers,
    bottomPerformers
  };
};

/**
 * Calculate monthly returns for the current year
 * @param {Array} investments - Array of investment objects
 * @param {number} year - Year to calculate for (defaults to current year)
 * @returns {Array} Array of {month, monthName, returns} objects
 */
export const calculateMonthlyReturns = (investments, year = new Date().getFullYear()) => {
  if (!investments || investments.length === 0) {
    return [];
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = [];

  // Calculate returns for each month
  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0); // Last day of the month
    let monthlyReturns = 0;

    investments.forEach(investment => {
      const interestRate = investment.interestRate || 0;

      // Only calculate for interest-bearing investment types
      if (!['EPF', 'PPF', 'FIXED_DEPOSIT', 'RECURRING_DEPOSIT', 'NPS',
           'POST_OFFICE_SCSS', 'POST_OFFICE_SAVINGS', 'POST_OFFICE_MIS',
           'POST_OFFICE_KVP', 'POST_OFFICE_TD', 'POST_OFFICE_NSC',
           'POST_OFFICE_RD', 'POST_OFFICE_MSSC', 'BONDS', 'SGB'].includes(investment.type)) {
        return;
      }

      let monthlyInterest = 0;
      let isActiveInMonth = false;

      switch (investment.type) {
        case 'EPF':
        case 'PPF':
        case 'NPS':
          if (investment.startDate && investment.lastUpdated) {
            const startDate = new Date(investment.startDate);
            const lastUpdate = new Date(investment.lastUpdated);

            if (startDate <= monthEnd && lastUpdate >= monthStart) {
              isActiveInMonth = true;
              // Monthly interest = (annual interest rate / 12)
              monthlyInterest = (investment.balance || 0) * (interestRate / 100) / 12;
            }
          }
          break;

        case 'POST_OFFICE_SAVINGS':
          if (investment.openingDate && investment.lastUpdated) {
            const opening = new Date(investment.openingDate);
            const lastUpdate = new Date(investment.lastUpdated);

            if (opening <= monthEnd && lastUpdate >= monthStart) {
              isActiveInMonth = true;
              monthlyInterest = (investment.balance || 0) * (interestRate / 100) / 12;
            }
          }
          break;

        case 'FIXED_DEPOSIT':
        case 'POST_OFFICE_TD':
          if (investment.startDate && investment.maturityDate) {
            const fdStart = new Date(investment.startDate);
            const fdMaturity = new Date(investment.maturityDate);

            if (fdStart <= monthEnd && fdMaturity >= monthStart) {
              isActiveInMonth = true;
              const principal = investment.principal || 0;
              const payoutType = investment.interestPayoutType || 'cumulative';

              if (payoutType === 'non-cumulative') {
                monthlyInterest = principal * (interestRate / 100) / 12;
              } else {
                // For cumulative, approximate monthly interest
                monthlyInterest = principal * (interestRate / 100) / 12;
              }
            }
          }
          break;

        case 'RECURRING_DEPOSIT':
        case 'POST_OFFICE_RD':
          if (investment.startDate && investment.maturityDate) {
            const rdStart = new Date(investment.startDate);
            const rdMaturity = new Date(investment.maturityDate);

            if (rdStart <= monthEnd && rdMaturity >= monthStart) {
              isActiveInMonth = true;
              const rdMonthly = investment.monthlyDeposit || 0;
              // Simple approximation of monthly interest
              monthlyInterest = rdMonthly * (interestRate / 100) / 12;
            }
          }
          break;

        case 'POST_OFFICE_SCSS':
          if (investment.startDate && investment.maturityDate) {
            const scssStart = new Date(investment.startDate);
            const scssMaturity = new Date(investment.maturityDate);

            if (scssStart <= monthEnd && scssMaturity >= monthStart) {
              isActiveInMonth = true;
              // SCSS pays quarterly, so monthly = annual / 12
              monthlyInterest = (investment.principal || 0) * (interestRate / 100) / 12;
            }
          }
          break;

        case 'POST_OFFICE_MIS':
          if (investment.startDate && investment.maturityDate) {
            const misStart = new Date(investment.startDate);
            const misMaturity = new Date(investment.maturityDate);

            if (misStart <= monthEnd && misMaturity >= monthStart) {
              isActiveInMonth = true;
              // MIS pays monthly income directly
              monthlyInterest = investment.monthlyIncome || 0;
            }
          }
          break;

        case 'POST_OFFICE_KVP':
        case 'POST_OFFICE_NSC':
          if (investment.purchaseDate && investment.maturityDate && investment.maturityAmount && investment.principal) {
            const kvpStart = new Date(investment.purchaseDate);
            const kvpMaturity = new Date(investment.maturityDate);

            if (kvpStart <= monthEnd && kvpMaturity >= monthStart) {
              isActiveInMonth = true;
              const totalReturns = (investment.maturityAmount || 0) - (investment.principal || 0);
              const totalMonths = (kvpMaturity - kvpStart) / (1000 * 60 * 60 * 24 * 30.44);
              if (totalMonths > 0) {
                monthlyInterest = totalReturns / totalMonths;
              }
            }
          }
          break;

        case 'BONDS':
          if (investment.issueDate && investment.maturityDate) {
            const bondIssue = new Date(investment.issueDate);
            const bondMaturity = new Date(investment.maturityDate);

            if (bondIssue <= monthEnd && bondMaturity >= monthStart) {
              isActiveInMonth = true;
              monthlyInterest = (investment.faceValue || 0) * ((investment.couponRate || 0) / 100) / 12;
            }
          }
          break;

        case 'SGB':
          if (investment.purchaseDate && investment.maturityDate) {
            const sgbPurchase = new Date(investment.purchaseDate);
            const sgbMaturity = new Date(investment.maturityDate);

            if (sgbPurchase <= monthEnd && sgbMaturity >= monthStart) {
              isActiveInMonth = true;
              monthlyInterest = (investment.units || 0) * (investment.issuePrice || 0) * (interestRate / 100) / 12;
            }
          }
          break;

        case 'POST_OFFICE_MSSC':
          if (investment.depositDate && investment.maturityDate) {
            const msscStart = new Date(investment.depositDate);
            const msscMaturity = new Date(investment.maturityDate);

            if (msscStart <= monthEnd && msscMaturity >= monthStart) {
              isActiveInMonth = true;
              const principal = investment.principal || 0;
              // Approximate monthly interest for quarterly compounding
              monthlyInterest = principal * (interestRate / 100) / 12;
            }
          }
          break;
      }

      if (isActiveInMonth) {
        monthlyReturns += monthlyInterest;
      }
    });

    monthlyData.push({
      month: month + 1,
      monthName: monthNames[month],
      returns: monthlyReturns
    });
  }

  return monthlyData;
};
