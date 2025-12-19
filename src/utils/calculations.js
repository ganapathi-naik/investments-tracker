// Utility functions for investment calculations

/**
 * Calculate total invested amount from an array of investments
 * @param {Array} investments - Array of investment objects
 * @param {number} usdToInrRate - USD to INR exchange rate (default 83.0)
 */
export const calculateTotalInvested = (investments, usdToInrRate = 83.0) => {
  if (!investments || !Array.isArray(investments)) return 0;

  return investments.reduce((total, investment) => {
    const invested = getInvestedAmount(investment, usdToInrRate);
    return total + invested;
  }, 0);
};

/**
 * Calculate total current value from an array of investments
 * @param {Array} investments - Array of investment objects
 * @param {number} usdToInrRate - USD to INR exchange rate (default 83.0)
 */
export const calculateTotalCurrentValue = (investments, usdToInrRate = 83.0) => {
  if (!investments || !Array.isArray(investments)) return 0;

  return investments.reduce((total, investment) => {
    const current = getCurrentValue(investment, usdToInrRate);
    return total + current;
  }, 0);
};

/**
 * Calculate total returns from an array of investments
 * @param {Array} investments - Array of investment objects
 * @param {number} usdToInrRate - USD to INR exchange rate (default 83.0)
 */
export const calculateTotalReturns = (investments, usdToInrRate = 83.0) => {
  if (!investments || !Array.isArray(investments)) return 0;

  const invested = calculateTotalInvested(investments, usdToInrRate);
  const current = calculateTotalCurrentValue(investments, usdToInrRate);
  return current - invested;
};

/**
 * Calculate returns percentage
 * @param {Array} investments - Array of investment objects
 * @param {number} usdToInrRate - USD to INR exchange rate (default 83.0)
 */
export const calculateReturnsPercentage = (investments, usdToInrRate = 83.0) => {
  const invested = calculateTotalInvested(investments, usdToInrRate);
  if (invested === 0) return 0;

  const returns = calculateTotalReturns(investments, usdToInrRate);
  return (returns / invested) * 100;
};

/**
 * Get invested amount for a single investment
 * @param {Object} investment - The investment object
 * @param {number} usdToInrRate - USD to INR exchange rate (default 83.0)
 */
export const getInvestedAmount = (investment, usdToInrRate = 83.0) => {
  if (!investment) return 0;

  switch (investment.type) {
    case 'PHYSICAL_GOLD':
      return (investment.grams || 0) * (investment.buyPrice || 0);

    case 'SGB':
      return (investment.units || 0) * (investment.issuePrice || 0);

    case 'EPF':
    case 'PPF':
    case 'NPS':
      return investment.balance || 0;

    case 'FIXED_DEPOSIT':
      return investment.principal || 0;

    case 'RECURRING_DEPOSIT':
    case 'POST_OFFICE_RD':
      // Calculate actual deposits made so far, not the planned total
      const rdStartDate = new Date(investment.startDate);
      const rdMaturityDate = new Date(investment.maturityDate);
      const rdToday = new Date();

      // Use the earlier of today or maturity date
      const rdEndDate = rdToday < rdMaturityDate ? rdToday : rdMaturityDate;

      // Calculate months elapsed
      const rdMonthsElapsed = Math.max(0, Math.round((rdEndDate - rdStartDate) / (1000 * 60 * 60 * 24 * 30.44)));

      // Return actual deposits made (not planned total)
      return (investment.monthlyDeposit || 0) * rdMonthsElapsed;

    case 'MUTUAL_FUND':
      return (investment.units || 0) * (investment.buyNav || 0);

    case 'STOCKS':
      return (investment.quantity || 0) * (investment.buyPrice || 0);

    case 'US_STOCKS':
      return (investment.quantity || 0) * (investment.buyPrice || 0) * usdToInrRate;

    case 'RSU':
      return (investment.units || 0) * (investment.vestingPrice || 0) * usdToInrRate;

    case 'ESPP':
      return (investment.shares || 0) * (investment.purchasePrice || 0) * usdToInrRate;

    case 'REAL_ESTATE':
      return investment.purchasePrice || 0;

    case 'CRYPTOCURRENCY':
      return (investment.quantity || 0) * (investment.buyPrice || 0) * usdToInrRate;

    case 'BONDS':
      return investment.faceValue || 0;

    case 'INSURANCE':
      // Calculate total premiums paid based on frequency and time elapsed
      const insPremium = investment.premiumAmount || 0;
      const insStartDate = new Date(investment.startDate);
      const insMaturityDate = new Date(investment.maturityDate);
      const insToday = new Date();

      // Use the earlier of today or maturity date
      const insEndDate = insToday < insMaturityDate ? insToday : insMaturityDate;

      // Get premium frequency (default to monthly)
      const insFreq = (investment.premiumFrequency || 'monthly').toLowerCase();

      let totalPremiumsPaid = 0;

      if (insFreq === 'monthly') {
        // Calculate months elapsed
        const monthsElapsed = Math.max(0, Math.round((insEndDate - insStartDate) / (1000 * 60 * 60 * 24 * 30.44)));
        totalPremiumsPaid = insPremium * monthsElapsed;
      } else if (insFreq === 'quarterly') {
        // Calculate quarters elapsed
        const quartersElapsed = Math.max(0, Math.floor((insEndDate - insStartDate) / (1000 * 60 * 60 * 24 * 91.25)));
        totalPremiumsPaid = insPremium * quartersElapsed;
      } else if (insFreq === 'half-yearly' || insFreq === 'halfyearly') {
        // Calculate half-years elapsed
        const halfYearsElapsed = Math.max(0, Math.floor((insEndDate - insStartDate) / (1000 * 60 * 60 * 24 * 182.5)));
        totalPremiumsPaid = insPremium * halfYearsElapsed;
      } else if (insFreq === 'yearly' || insFreq === 'annually') {
        // Calculate years elapsed
        const yearsElapsed = Math.max(0, Math.floor((insEndDate - insStartDate) / (1000 * 60 * 60 * 24 * 365.25)));
        totalPremiumsPaid = insPremium * yearsElapsed;
      } else {
        // Default to monthly
        const monthsElapsed = Math.max(0, Math.round((insEndDate - insStartDate) / (1000 * 60 * 60 * 24 * 30.44)));
        totalPremiumsPaid = insPremium * monthsElapsed;
      }

      return totalPremiumsPaid;

    case 'POST_OFFICE_SCSS':
    case 'POST_OFFICE_TD':
    case 'POST_OFFICE_KVP':
    case 'POST_OFFICE_NSC':
    case 'POST_OFFICE_MSSC':
      return investment.principal || 0;

    case 'POST_OFFICE_SAVINGS':
      return investment.balance || 0;

    case 'POST_OFFICE_MIS':
      return investment.principal || 0;

    case 'OTHER':
      return investment.investedAmount || 0;

    default:
      return 0;
  }
};

/**
 * Get current value for a single investment
 * @param {Object} investment - The investment object
 * @param {number} usdToInrRate - USD to INR exchange rate (default 83.0)
 */
export const getCurrentValue = (investment, usdToInrRate = 83.0) => {
  if (!investment) return 0;

  switch (investment.type) {
    case 'PHYSICAL_GOLD':
      return (investment.grams || 0) * (investment.currentPrice || 0);

    case 'SGB':
      return (investment.units || 0) * (investment.currentPrice || 0);

    case 'EPF':
    case 'PPF':
    case 'NPS':
      const epfBalance = investment.balance || 0;
      const epfMonthlyContribution = investment.monthlyContribution || 0;
      const epfAnnualRate = investment.interestRate || 0;
      const epfMonthlyRate = epfAnnualRate / 12 / 100; // Monthly interest rate
      const epfLastUpdated = investment.lastUpdated ? new Date(investment.lastUpdated) : new Date();
      const epfToday = new Date();

      // Calculate months elapsed since last update
      const epfMonthsElapsed = Math.max(0, Math.round((epfToday - epfLastUpdated) / (1000 * 60 * 60 * 24 * 30.44)));

      if (epfMonthsElapsed === 0) {
        // No time has passed, return current balance
        return epfBalance;
      }

      // EPF calculation: Interest calculated monthly on running balance
      // Month-by-month calculation with contributions added at start of each month
      let runningBalance = epfBalance;
      let totalInterest = 0;

      for (let month = 0; month < epfMonthsElapsed; month++) {
        // Add monthly contribution at the start of the month
        runningBalance += epfMonthlyContribution;

        // Calculate interest for this month on the running balance
        const monthlyInterest = runningBalance * epfMonthlyRate;
        totalInterest += monthlyInterest;
      }

      // Return balance + contributions + interest
      return runningBalance + totalInterest;

    case 'FIXED_DEPOSIT':
      const fdPrincipal = investment.principal || 0;
      const fdRate = investment.interestRate || 0;
      const fdStartDate = new Date(investment.startDate);
      const fdMaturityDate = new Date(investment.maturityDate);
      const fdToday = new Date();

      // Use the earlier of today or maturity date for calculation
      const fdEndDate = fdToday < fdMaturityDate ? fdToday : fdMaturityDate;

      // Calculate years elapsed
      const fdYearsElapsed = Math.max(0, (fdEndDate - fdStartDate) / (1000 * 60 * 60 * 24 * 365.25));

      // Determine compounding frequency (default to quarterly if not specified)
      const fdFreq = (investment.compoundingFrequency || 'quarterly').toLowerCase();

      let fdFinalAmount;
      if (fdFreq === 'simple' || fdFreq === 'simple interest') {
        // Simple Interest: P + (P × R × T) / 100
        fdFinalAmount = fdPrincipal + (fdPrincipal * fdRate * fdYearsElapsed / 100);
      } else {
        // Compound Interest: P × (1 + R/100n)^(nt)
        let n; // compounding frequency per year
        switch (fdFreq) {
          case 'monthly':
            n = 12;
            break;
          case 'quarterly':
            n = 4;
            break;
          case 'halfyearly':
          case 'half-yearly':
          case 'semi-annually':
            n = 2;
            break;
          case 'yearly':
          case 'annually':
            n = 1;
            break;
          default:
            n = 4; // default to quarterly
        }
        fdFinalAmount = fdPrincipal * Math.pow((1 + fdRate / (100 * n)), n * fdYearsElapsed);
      }

      return fdFinalAmount;

    case 'RECURRING_DEPOSIT':
      const rdMonthly = investment.monthlyDeposit || 0;
      const rdRate = investment.interestRate || 0;
      const rdStartDate = new Date(investment.startDate);
      const rdMaturityDate = new Date(investment.maturityDate);
      const rdToday = new Date();

      // Use the earlier of today or maturity date
      const rdEndDate = rdToday < rdMaturityDate ? rdToday : rdMaturityDate;

      // Calculate months elapsed
      const rdMonthsElapsed = Math.max(0, Math.round((rdEndDate - rdStartDate) / (1000 * 60 * 60 * 24 * 30.44)));

      if (rdMonthsElapsed === 0) {
        return 0;
      }

      // Total deposits made so far
      const rdTotalDeposits = rdMonthly * rdMonthsElapsed;

      // Post Office RD formula with quarterly compounding:
      // M = R × [(1 + i)^n - 1] / [1 - (1 + i)^(-1/3)]
      // Where:
      // R = Monthly deposit amount
      // i = Quarterly interest rate = (Annual Rate / 4) / 100
      // n = Total number of quarters

      const rdAnnualRate = rdRate / 100; // Convert to decimal
      const rdQuarterlyRate = rdAnnualRate / 4; // i in the formula
      const rdQuarters = rdMonthsElapsed / 3; // Number of quarters elapsed

      if (rdQuarterlyRate === 0) {
        // No interest, just return deposits
        return rdTotalDeposits;
      }

      // Calculate using the Post Office RD formula
      const numerator = Math.pow(1 + rdQuarterlyRate, rdQuarters) - 1;
      const denominator = 1 - Math.pow(1 + rdQuarterlyRate, -1/3);
      const rdMaturityAmount = rdMonthly * (numerator / denominator);

      return rdMaturityAmount;

    case 'POST_OFFICE_RD':
      const pordMonthly = investment.monthlyDeposit || 0;
      const pordRate = investment.interestRate || 0;
      const pordStartDate = new Date(investment.startDate);
      const pordMaturityDate = new Date(investment.maturityDate);
      const pordToday = new Date();

      // Use the earlier of today or maturity date
      const pordEndDate = pordToday < pordMaturityDate ? pordToday : pordMaturityDate;

      // Calculate months elapsed
      const pordMonthsElapsed = Math.max(0, Math.round((pordEndDate - pordStartDate) / (1000 * 60 * 60 * 24 * 30.44)));

      if (pordMonthsElapsed === 0) {
        return 0;
      }

      // Total deposits made so far
      const pordTotalDeposits = pordMonthly * pordMonthsElapsed;

      // Post Office RD formula with quarterly compounding:
      // M = R × [(1 + i)^n - 1] / [1 - (1 + i)^(-1/3)]
      // Where:
      // R = Monthly deposit amount
      // i = Quarterly interest rate = (Annual Rate / 4) / 100
      // n = Total number of quarters

      const pordAnnualRate = pordRate / 100; // Convert to decimal
      const pordQuarterlyRate = pordAnnualRate / 4; // i in the formula
      const pordQuarters = pordMonthsElapsed / 3; // Number of quarters elapsed

      if (pordQuarterlyRate === 0) {
        // No interest, just return deposits
        return pordTotalDeposits;
      }

      // Calculate using the Post Office RD formula
      const pordNumerator = Math.pow(1 + pordQuarterlyRate, pordQuarters) - 1;
      const pordDenominator = 1 - Math.pow(1 + pordQuarterlyRate, -1/3);
      const pordMaturityAmount = pordMonthly * (pordNumerator / pordDenominator);

      return pordMaturityAmount;

    case 'MUTUAL_FUND':
      return (investment.units || 0) * (investment.currentNav || 0);

    case 'STOCKS':
      return (investment.quantity || 0) * (investment.currentPrice || 0);

    case 'US_STOCKS':
      return (investment.quantity || 0) * (investment.currentPrice || 0) * usdToInrRate;

    case 'RSU':
      return (investment.units || 0) * (investment.currentPrice || 0) * usdToInrRate;

    case 'ESPP':
      return (investment.shares || 0) * (investment.currentPrice || 0) * usdToInrRate;

    case 'REAL_ESTATE':
      return investment.currentValue || 0;

    case 'CRYPTOCURRENCY':
      return (investment.quantity || 0) * (investment.currentPrice || 0) * usdToInrRate;

    case 'BONDS':
      return investment.currentValue || 0;

    case 'INSURANCE':
      // For insurance, calculate based on policy type
      const policyType = (investment.policyType || 'term').toLowerCase();

      if (policyType === 'endowment' || policyType === 'moneyback') {
        // For endowment policies, calculate with bonuses
        const sumAssured = investment.sumAssured || investment.coverageAmount || 0;
        const bonusRate = investment.bonusRate || 0;
        const finalBonus = investment.finalBonus || 0;
        const insStartDate = new Date(investment.startDate);
        const insMaturityDate = new Date(investment.maturityDate);
        const insToday = new Date();

        // Calculate years completed (full years only for bonus)
        const yearsCompleted = Math.floor((insToday - insStartDate) / (1000 * 60 * 60 * 24 * 365.25));

        // Calculate accumulated bonuses: Bonus Rate × (Sum Assured / 1000) × Years Completed
        const accumulatedBonus = bonusRate * (sumAssured / 1000) * yearsCompleted;

        // Current value = Sum Assured + Accumulated Bonuses
        let currentValue = sumAssured + accumulatedBonus;

        // At maturity, add final bonus
        if (insToday >= insMaturityDate) {
          currentValue += finalBonus;
        }

        return currentValue;
      } else {
        // For term insurance, use coverage amount
        return investment.coverageAmount || 0;
      }

    case 'POST_OFFICE_SCSS':
      const scssPrincipal = investment.principal || 0;
      const scssRate = investment.interestRate || 0;
      const scssStartDate = new Date(investment.startDate);
      const scssMaturityDate = new Date(investment.maturityDate);
      const scssToday = new Date();

      // Use the earlier of today or maturity date
      const scssEndDate = scssToday < scssMaturityDate ? scssToday : scssMaturityDate;

      // Calculate years elapsed
      const scssYearsElapsed = Math.max(0, (scssEndDate - scssStartDate) / (1000 * 60 * 60 * 24 * 365.25));

      // SCSS pays quarterly interest (simple interest on principal)
      const scssInterest = scssPrincipal * (scssRate / 100) * scssYearsElapsed;

      return scssPrincipal + scssInterest;

    case 'POST_OFFICE_SAVINGS':
      return investment.balance || 0;

    case 'POST_OFFICE_MIS':
      const misPrincipal = investment.principal || 0;
      const misMonthlyIncome = investment.monthlyIncome || 0;
      const misStartDate = new Date(investment.startDate);
      const misMaturityDate = new Date(investment.maturityDate);
      const misToday = new Date();

      // Use the earlier of today or maturity date
      const misEndDate = misToday < misMaturityDate ? misToday : misMaturityDate;

      // Calculate months elapsed
      const misMonthsElapsed = Math.max(0, Math.round((misEndDate - misStartDate) / (1000 * 60 * 60 * 24 * 30.44)));

      // Total income received so far
      const misTotalIncome = misMonthlyIncome * misMonthsElapsed;

      return misPrincipal + misTotalIncome;

    case 'POST_OFFICE_KVP':
      const kvpPrincipal = investment.principal || 0;
      const kvpRate = (investment.interestRate || 0) / 100;
      const kvpPurchaseDate = new Date(investment.purchaseDate);
      const kvpMaturityDate = new Date(investment.maturityDate);
      const kvpToday = new Date();

      // Use the earlier of today or maturity date
      const kvpEndDate = kvpToday < kvpMaturityDate ? kvpToday : kvpMaturityDate;

      // Calculate years elapsed
      const kvpYearsElapsed = Math.max(0, (kvpEndDate - kvpPurchaseDate) / (1000 * 60 * 60 * 24 * 365.25));

      // KVP uses annual compounding: A = P × (1 + r)^t
      const kvpCurrentValue = kvpPrincipal * Math.pow((1 + kvpRate), kvpYearsElapsed);

      return kvpCurrentValue;

    case 'POST_OFFICE_NSC':
      return investment.maturityAmount || 0;

    case 'POST_OFFICE_MSSC':
      const msscPrincipal = investment.principal || 0;
      const msscRate = (investment.interestRate || 0) / 100;
      const msscStartDate = new Date(investment.depositDate);
      const msscMaturityDate = new Date(investment.maturityDate);
      const msscToday = new Date();

      // Use the earlier of today or maturity date
      const msscEndDate = msscToday < msscMaturityDate ? msscToday : msscMaturityDate;

      // Calculate years elapsed
      const msscYearsElapsed = Math.max(0, (msscEndDate - msscStartDate) / (1000 * 60 * 60 * 24 * 365.25));

      // Determine compounding frequency (default to quarterly if not specified)
      const msscFreq = (investment.compoundingFrequency || 'quarterly').toLowerCase();
      let msscN;
      switch (msscFreq) {
        case 'monthly':
          msscN = 12;
          break;
        case 'quarterly':
          msscN = 4;
          break;
        case 'halfyearly':
        case 'half-yearly':
        case 'semi-annually':
          msscN = 2;
          break;
        case 'yearly':
        case 'annually':
          msscN = 1;
          break;
        default:
          msscN = 4; // default to quarterly
      }

      return msscPrincipal * Math.pow((1 + msscRate / msscN), msscN * msscYearsElapsed);

    case 'POST_OFFICE_TD':
      const tdPrincipal = investment.principal || 0;
      const tdRate = (investment.interestRate || 0) / 100;
      const tdStartDate = new Date(investment.startDate);
      const tdMaturityDate = new Date(investment.maturityDate);
      const tdToday = new Date();

      // Use the earlier of today or maturity date
      const tdEndDate = tdToday < tdMaturityDate ? tdToday : tdMaturityDate;

      // Calculate years elapsed
      const tdYearsElapsed = Math.max(0, (tdEndDate - tdStartDate) / (1000 * 60 * 60 * 24 * 365.25));

      // Determine compounding frequency (default to quarterly if not specified)
      const tdFreq = (investment.compoundingFrequency || 'quarterly').toLowerCase();
      let tdN;
      switch (tdFreq) {
        case 'monthly':
          tdN = 12;
          break;
        case 'quarterly':
          tdN = 4;
          break;
        case 'halfyearly':
        case 'half-yearly':
        case 'semi-annually':
          tdN = 2;
          break;
        case 'yearly':
        case 'annually':
          tdN = 1;
          break;
        default:
          tdN = 4; // default to quarterly
      }

      return tdPrincipal * Math.pow((1 + tdRate / tdN), tdN * tdYearsElapsed);

    case 'OTHER':
      return investment.currentValue || 0;

    default:
      return 0;
  }
};

/**
 * Get returns for a single investment
 * @param {Object} investment - The investment object
 * @param {number} usdToInrRate - USD to INR exchange rate (default 83.0)
 */
export const getReturns = (investment, usdToInrRate = 83.0) => {
  const invested = getInvestedAmount(investment, usdToInrRate);
  const current = getCurrentValue(investment, usdToInrRate);
  return current - invested;
};

/**
 * Get returns percentage for a single investment
 * @param {Object} investment - The investment object
 * @param {number} usdToInrRate - USD to INR exchange rate (default 83.0)
 */
export const getReturnsPercentage = (investment, usdToInrRate = 83.0) => {
  const invested = getInvestedAmount(investment, usdToInrRate);
  if (invested === 0) return 0;

  const returns = getReturns(investment, usdToInrRate);
  return (returns / invested) * 100;
};

/**
 * Format currency to Indian Rupees
 */
export const formatINR = (amount) => {
  if (typeof amount !== 'number') return '₹0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format currency to US Dollars
 */
export const formatUSD = (amount) => {
  if (typeof amount !== 'number') return '$0';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format percentage
 */
export const formatPercentage = (percentage) => {
  if (typeof percentage !== 'number') return '0%';

  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
};

/**
 * Group investments by type
 */
export const groupInvestmentsByType = (investments) => {
  if (!investments || !Array.isArray(investments)) return {};

  return investments.reduce((groups, investment) => {
    const type = investment.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(investment);
    return groups;
  }, {});
};

/**
 * Calculate portfolio allocation by type
 * @param {Array} investments - Array of investment objects
 * @param {number} usdToInrRate - USD to INR exchange rate (default 83.0)
 */
export const calculatePortfolioAllocation = (investments, usdToInrRate = 83.0) => {
  if (!investments || !Array.isArray(investments)) return [];

  const totalValue = calculateTotalCurrentValue(investments, usdToInrRate);
  if (totalValue === 0) return [];

  const grouped = groupInvestmentsByType(investments);

  return Object.entries(grouped).map(([type, typeInvestments]) => {
    const typeValue = calculateTotalCurrentValue(typeInvestments, usdToInrRate);
    return {
      type,
      value: typeValue,
      percentage: (typeValue / totalValue) * 100,
      count: typeInvestments.length
    };
  }).sort((a, b) => b.value - a.value);
};
