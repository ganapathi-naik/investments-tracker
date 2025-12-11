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
      return (investment.monthlyDeposit || 0) * (investment.tenure || 0);

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
      return investment.premiumAmount || 0;

    case 'POST_OFFICE_SCSS':
    case 'POST_OFFICE_TD':
    case 'POST_OFFICE_KVP':
    case 'POST_OFFICE_NSC':
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
      return investment.balance || 0;

    case 'FIXED_DEPOSIT':
      const fdPrincipal = investment.principal || 0;
      const fdRate = investment.interestRate || 0;
      const fdTenure = investment.tenure || 0;
      return fdPrincipal * (1 + (fdRate / 100) * (fdTenure / 12));

    case 'RECURRING_DEPOSIT':
      const rdMonthly = investment.monthlyDeposit || 0;
      const rdTenure = investment.tenure || 0;
      const rdRate = investment.interestRate || 0;
      return rdMonthly * rdTenure * (1 + (rdRate / 100));

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
      return investment.premiumAmount || 0;

    case 'POST_OFFICE_SCSS':
      const scssTenureYears = (new Date(investment.maturityDate) - new Date(investment.startDate)) / (1000 * 60 * 60 * 24 * 365.25);
      return (investment.principal || 0) * (1 + ((investment.interestRate || 0) / 100) * scssTenureYears);

    case 'POST_OFFICE_SAVINGS':
      return investment.balance || 0;

    case 'POST_OFFICE_MIS':
      const misTenureMonths = Math.round((new Date(investment.maturityDate) - new Date(investment.startDate)) / (1000 * 60 * 60 * 24 * 30.44));
      const misTotalIncome = (investment.monthlyIncome || 0) * misTenureMonths;
      return (investment.principal || 0) + misTotalIncome;

    case 'POST_OFFICE_KVP':
    case 'POST_OFFICE_NSC':
      return investment.maturityAmount || 0;

    case 'POST_OFFICE_TD':
      const n = 4; // quarters per year
      const r = (investment.interestRate || 0) / 100;
      const t = investment.tenure || 0;
      return (investment.principal || 0) * Math.pow((1 + r / n), n * t);

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
