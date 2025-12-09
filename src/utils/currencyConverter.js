// Currency conversion utilities

/**
 * Convert USD to INR
 */
export const convertUSDtoINR = (usdAmount, exchangeRate = 83.0) => {
  if (typeof usdAmount !== 'number' || typeof exchangeRate !== 'number') {
    return 0;
  }
  return usdAmount * exchangeRate;
};

/**
 * Convert INR to USD
 */
export const convertINRtoUSD = (inrAmount, exchangeRate = 83.0) => {
  if (typeof inrAmount !== 'number' || typeof exchangeRate !== 'number' || exchangeRate === 0) {
    return 0;
  }
  return inrAmount / exchangeRate;
};

/**
 * Get the investment value in INR
 * Converts USD-based investments to INR
 */
export const getValueInINR = (investment, exchangeRate = 83.0) => {
  if (!investment) return 0;

  const usdBasedTypes = ['US_STOCKS', 'RSU', 'ESPP', 'CRYPTOCURRENCY'];

  // For Physical Gold, handle the special case
  if (investment.type === 'PHYSICAL_GOLD') {
    const grams = investment.grams || 0;
    const currentPrice = investment.currentPrice || 0;
    return grams * currentPrice;
  }

  // Calculate the current value based on investment type
  let currentValue = 0;

  switch (investment.type) {
    case 'SGB':
      currentValue = (investment.units || 0) * (investment.currentPrice || 0);
      break;
    case 'STOCKS':
      currentValue = (investment.quantity || 0) * (investment.currentPrice || 0);
      break;
    case 'US_STOCKS':
      currentValue = (investment.quantity || 0) * (investment.currentPrice || 0);
      break;
    case 'RSU':
      currentValue = (investment.units || 0) * (investment.currentPrice || 0);
      break;
    case 'ESPP':
      currentValue = (investment.shares || 0) * (investment.currentPrice || 0);
      break;
    case 'CRYPTOCURRENCY':
      currentValue = (investment.quantity || 0) * (investment.currentPrice || 0);
      break;
    case 'MUTUAL_FUND':
      currentValue = (investment.units || 0) * (investment.currentNav || 0);
      break;
    case 'FIXED_DEPOSIT':
      const principal = investment.principal || 0;
      const rate = investment.interestRate || 0;
      const tenure = investment.tenure || 0;
      currentValue = principal * (1 + (rate / 100) * (tenure / 12));
      break;
    case 'RECURRING_DEPOSIT':
      const monthly = investment.monthlyDeposit || 0;
      const rdTenure = investment.tenure || 0;
      const rdRate = investment.interestRate || 0;
      currentValue = monthly * rdTenure * (1 + (rdRate / 100));
      break;
    case 'EPF':
    case 'PPF':
    case 'NPS':
      currentValue = investment.balance || 0;
      break;
    case 'REAL_ESTATE':
      currentValue = investment.currentValue || 0;
      break;
    case 'BONDS':
      currentValue = investment.currentValue || 0;
      break;
    case 'INSURANCE':
      currentValue = investment.premiumAmount || 0;
      break;
    case 'OTHER':
      currentValue = investment.currentValue || 0;
      break;
    default:
      currentValue = 0;
  }

  // Convert to INR if it's a USD-based investment
  if (usdBasedTypes.includes(investment.type)) {
    return convertUSDtoINR(currentValue, exchangeRate);
  }

  return currentValue;
};

/**
 * Get the invested amount in INR
 */
export const getInvestedAmountInINR = (investment, exchangeRate = 83.0) => {
  if (!investment) return 0;

  const usdBasedTypes = ['US_STOCKS', 'RSU', 'ESPP', 'CRYPTOCURRENCY'];

  // For Physical Gold
  if (investment.type === 'PHYSICAL_GOLD') {
    const grams = investment.grams || 0;
    const buyPrice = investment.buyPrice || 0;
    return grams * buyPrice;
  }

  let investedAmount = 0;

  switch (investment.type) {
    case 'SGB':
      investedAmount = (investment.units || 0) * (investment.issuePrice || 0);
      break;
    case 'STOCKS':
      investedAmount = (investment.quantity || 0) * (investment.buyPrice || 0);
      break;
    case 'US_STOCKS':
      investedAmount = (investment.quantity || 0) * (investment.buyPrice || 0);
      break;
    case 'RSU':
      investedAmount = (investment.units || 0) * (investment.vestingPrice || 0);
      break;
    case 'ESPP':
      investedAmount = (investment.shares || 0) * (investment.purchasePrice || 0);
      break;
    case 'CRYPTOCURRENCY':
      investedAmount = (investment.quantity || 0) * (investment.buyPrice || 0);
      break;
    case 'MUTUAL_FUND':
      investedAmount = (investment.units || 0) * (investment.buyNav || 0);
      break;
    case 'FIXED_DEPOSIT':
      investedAmount = investment.principal || 0;
      break;
    case 'RECURRING_DEPOSIT':
      investedAmount = (investment.monthlyDeposit || 0) * (investment.tenure || 0);
      break;
    case 'EPF':
    case 'PPF':
    case 'NPS':
      investedAmount = investment.balance || 0;
      break;
    case 'REAL_ESTATE':
      investedAmount = investment.purchasePrice || 0;
      break;
    case 'BONDS':
      investedAmount = investment.faceValue || 0;
      break;
    case 'INSURANCE':
      investedAmount = investment.premiumAmount || 0;
      break;
    case 'OTHER':
      investedAmount = investment.investedAmount || 0;
      break;
    default:
      investedAmount = 0;
  }

  // Convert to INR if it's a USD-based investment
  if (usdBasedTypes.includes(investment.type)) {
    return convertUSDtoINR(investedAmount, exchangeRate);
  }

  return investedAmount;
};

/**
 * Format amount based on currency
 */
export const formatCurrency = (amount, currency = 'INR') => {
  if (typeof amount !== 'number') return currency === 'INR' ? '₹0' : '$0';

  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
};
