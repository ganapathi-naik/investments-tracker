// Investment Types Configuration
// Defines all 23 supported investment types with their properties and display configurations

export const INVESTMENT_TYPES = {
  PHYSICAL_GOLD: {
    id: 'PHYSICAL_GOLD',
    name: 'Physical Gold',
    icon: 'gold',
    color: '#FFD700',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: false },
      {
        name: 'purity',
        label: 'Purity',
        type: 'select',
        required: false,
        options: [
          { label: '24K (99.9%)', value: '24K' },
          { label: '22K (91.6%)', value: '22K' },
          { label: '18K (75%)', value: '18K' },
          { label: '14K (58.5%)', value: '14K' }
        ]
      },
      { name: 'grams', label: 'Quantity (grams)', type: 'number', required: true },
      { name: 'buyPrice', label: 'Buy Price (per gram)', type: 'number', required: true },
      { name: 'currentPrice', label: 'Current Price (per gram)', type: 'number', required: true },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: `${investment.grams || 0} grams`,
      invested: investment.grams * investment.buyPrice,
      current: investment.grams * investment.currentPrice,
      returns: (investment.grams * investment.currentPrice) - (investment.grams * investment.buyPrice)
    })
  },

  SGB: {
    id: 'SGB',
    name: 'Sovereign Gold Bonds',
    icon: 'certificate',
    color: '#DAA520',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: false },
      { name: 'units', label: 'Number of Units', type: 'number', required: true },
      { name: 'issuePrice', label: 'Issue Price (per unit)', type: 'number', required: true },
      { name: 'currentPrice', label: 'Current Price (per unit)', type: 'number', required: true },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { name: 'maturityDate', label: 'Maturity Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: `${investment.units || 0} units`,
      invested: investment.units * investment.issuePrice,
      current: investment.units * investment.currentPrice,
      returns: (investment.units * investment.currentPrice) - (investment.units * investment.issuePrice)
    })
  },

  EPF: {
    id: 'EPF',
    name: 'Employee Provident Fund',
    icon: 'briefcase',
    color: '#4A90E2',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: false },
      { name: 'balance', label: 'Current Balance', type: 'number', required: true },
      { name: 'monthlyContribution', label: 'Monthly Contribution', type: 'number', required: true },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true },
      {
        name: 'compoundingFrequency',
        label: 'Compounding Frequency',
        type: 'select',
        required: false,
        options: [
          { label: 'Quarterly (Default)', value: 'quarterly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Half-Yearly', value: 'half-yearly' },
          { label: 'Yearly', value: 'yearly' }
        ]
      },
      { name: 'lastUpdated', label: 'Last Updated', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: 'EPF Account',
      invested: investment.balance,
      current: investment.balance,
      returns: 0
    })
  },

  PPF: {
    id: 'PPF',
    name: 'Public Provident Fund',
    icon: 'piggy-bank',
    color: '#27AE60',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: false },
      { name: 'balance', label: 'Current Balance', type: 'number', required: true },
      { name: 'yearlyContribution', label: 'Yearly Contribution', type: 'number', required: true },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true },
      { name: 'startDate', label: 'Account Start Date', type: 'date', required: true },
      { name: 'maturityDate', label: 'Maturity Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: 'PPF Account',
      invested: investment.balance,
      current: investment.balance,
      returns: 0
    })
  },

  FIXED_DEPOSIT: {
    id: 'FIXED_DEPOSIT',
    name: 'Fixed Deposit',
    icon: 'bank',
    color: '#E74C3C',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: false },
      { name: 'principal', label: 'Principal Amount', type: 'number', required: true },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true },
      {
        name: 'compoundingFrequency',
        label: 'Compounding Frequency',
        type: 'select',
        required: false,
        options: [
          { label: 'Quarterly (Default)', value: 'quarterly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Half-Yearly', value: 'half-yearly' },
          { label: 'Yearly', value: 'yearly' },
          { label: 'Simple Interest', value: 'simple' }
        ]
      },
      {
        name: 'interestPayoutType',
        label: 'Interest Payout Type',
        type: 'select',
        required: false,
        options: [
          { label: 'Cumulative (Reinvested)', value: 'cumulative' },
          { label: 'Non-Cumulative (Paid Out)', value: 'non-cumulative' }
        ]
      },
      { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'maturityDate', label: 'Maturity Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => {
      // Calculate tenure in months from start and maturity dates
      const start = new Date(investment.startDate);
      const maturity = new Date(investment.maturityDate);
      const tenureMonths = Math.round((maturity - start) / (1000 * 60 * 60 * 24 * 30.44));
      const tenureYears = tenureMonths / 12;

      return {
        quantity: `${tenureMonths} months`,
        invested: investment.principal,
        current: investment.principal * (1 + (investment.interestRate / 100) * tenureYears),
        returns: (investment.principal * (1 + (investment.interestRate / 100) * tenureYears)) - investment.principal
      };
    }
  },

  RECURRING_DEPOSIT: {
    id: 'RECURRING_DEPOSIT',
    name: 'Recurring Deposit',
    icon: 'calendar-repeat',
    color: '#9B59B6',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: false },
      { name: 'monthlyDeposit', label: 'Monthly Deposit', type: 'number', required: true },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true },
      {
        name: 'compoundingFrequency',
        label: 'Compounding Frequency',
        type: 'select',
        required: false,
        options: [
          { label: 'Quarterly (Default)', value: 'quarterly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Half-Yearly', value: 'half-yearly' },
          { label: 'Yearly', value: 'yearly' }
        ]
      },
      { name: 'tenure', label: 'Tenure (months)', type: 'number', required: true },
      { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'maturityDate', label: 'Maturity Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: `${investment.tenure} months`,
      invested: investment.monthlyDeposit * investment.tenure,
      current: investment.monthlyDeposit * investment.tenure * (1 + (investment.interestRate / 100)),
      returns: (investment.monthlyDeposit * investment.tenure * (1 + (investment.interestRate / 100))) - (investment.monthlyDeposit * investment.tenure)
    })
  },

  MUTUAL_FUND: {
    id: 'MUTUAL_FUND',
    name: 'Mutual Fund',
    icon: 'chart-line',
    color: '#3498DB',
    fields: [
      { name: 'fundName', label: 'Fund Name', type: 'text', required: true },
      { name: 'units', label: 'Number of Units', type: 'number', required: true },
      { name: 'buyNav', label: 'Buy NAV', type: 'number', required: true },
      { name: 'currentNav', label: 'Current NAV', type: 'number', required: true },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { name: 'folioNumber', label: 'Folio Number', type: 'text', required: false },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: `${investment.units || 0} units`,
      invested: investment.units * investment.buyNav,
      current: investment.units * investment.currentNav,
      returns: (investment.units * investment.currentNav) - (investment.units * investment.buyNav)
    })
  },

  STOCKS: {
    id: 'STOCKS',
    name: 'Indian Stocks',
    icon: 'chart-candlestick',
    color: '#E67E22',
    fields: [
      { name: 'stockName', label: 'Stock Name', type: 'text', required: true },
      { name: 'symbol', label: 'Symbol', type: 'text', required: true },
      { name: 'quantity', label: 'Quantity', type: 'number', required: true },
      { name: 'buyPrice', label: 'Buy Price', type: 'number', required: true },
      { name: 'currentPrice', label: 'Current Price', type: 'number', required: true },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: `${investment.quantity || 0} shares`,
      invested: investment.quantity * investment.buyPrice,
      current: investment.quantity * investment.currentPrice,
      returns: (investment.quantity * investment.currentPrice) - (investment.quantity * investment.buyPrice)
    })
  },

  US_STOCKS: {
    id: 'US_STOCKS',
    name: 'US Stocks',
    icon: 'chart-line-up',
    color: '#1ABC9C',
    fields: [
      { name: 'stockName', label: 'Stock Name', type: 'text', required: true },
      { name: 'symbol', label: 'Symbol', type: 'text', required: true },
      { name: 'quantity', label: 'Quantity', type: 'number', required: true },
      { name: 'buyPrice', label: 'Buy Price (USD)', type: 'number', required: true },
      { name: 'currentPrice', label: 'Current Price (USD)', type: 'number', required: true },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: `${investment.quantity || 0} shares`,
      invested: investment.quantity * investment.buyPrice,
      current: investment.quantity * investment.currentPrice,
      returns: (investment.quantity * investment.currentPrice) - (investment.quantity * investment.buyPrice)
    })
  },

  RSU: {
    id: 'RSU',
    name: 'Restricted Stock Units',
    icon: 'award',
    color: '#F39C12',
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', required: true },
      { name: 'units', label: 'Number of Units', type: 'number', required: true },
      { name: 'vestingPrice', label: 'Vesting Price (USD)', type: 'number', required: true },
      { name: 'currentPrice', label: 'Current Price (USD)', type: 'number', required: true },
      { name: 'vestingDate', label: 'Vesting Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: `${investment.units || 0} units`,
      invested: investment.units * investment.vestingPrice,
      current: investment.units * investment.currentPrice,
      returns: (investment.units * investment.currentPrice) - (investment.units * investment.vestingPrice)
    })
  },

  ESPP: {
    id: 'ESPP',
    name: 'Employee Stock Purchase Plan',
    icon: 'briefcase-check',
    color: '#16A085',
    fields: [
      { name: 'companyName', label: 'Company Name', type: 'text', required: true },
      { name: 'shares', label: 'Number of Shares', type: 'number', required: true },
      { name: 'purchasePrice', label: 'Purchase Price (USD)', type: 'number', required: true },
      { name: 'currentPrice', label: 'Current Price (USD)', type: 'number', required: true },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: `${investment.shares || 0} shares`,
      invested: investment.shares * investment.purchasePrice,
      current: investment.shares * investment.currentPrice,
      returns: (investment.shares * investment.currentPrice) - (investment.shares * investment.purchasePrice)
    })
  },

  NPS: {
    id: 'NPS',
    name: 'National Pension System',
    icon: 'shield',
    color: '#8E44AD',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: false },
      { name: 'balance', label: 'Current Balance', type: 'number', required: true },
      { name: 'monthlyContribution', label: 'Monthly Contribution', type: 'number', required: true },
      { name: 'pranNumber', label: 'PRAN Number', type: 'text', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: 'NPS Account',
      invested: investment.balance,
      current: investment.balance,
      returns: 0
    })
  },

  REAL_ESTATE: {
    id: 'REAL_ESTATE',
    name: 'Real Estate',
    icon: 'home',
    color: '#C0392B',
    fields: [
      { name: 'propertyName', label: 'Property Name/Location', type: 'text', required: true },
      { name: 'purchasePrice', label: 'Purchase Price', type: 'number', required: true },
      { name: 'currentValue', label: 'Current Value', type: 'number', required: true },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { name: 'propertyType', label: 'Property Type', type: 'text', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: investment.propertyType || 'Property',
      invested: investment.purchasePrice,
      current: investment.currentValue,
      returns: investment.currentValue - investment.purchasePrice
    })
  },

  CRYPTOCURRENCY: {
    id: 'CRYPTOCURRENCY',
    name: 'Cryptocurrency',
    icon: 'bitcoin',
    color: '#F7931A',
    fields: [
      { name: 'coinName', label: 'Coin Name', type: 'text', required: true },
      { name: 'symbol', label: 'Symbol', type: 'text', required: true },
      { name: 'quantity', label: 'Quantity', type: 'number', required: true },
      { name: 'buyPrice', label: 'Buy Price (USD)', type: 'number', required: true },
      { name: 'currentPrice', label: 'Current Price (USD)', type: 'number', required: true },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: `${investment.quantity || 0} ${investment.symbol}`,
      invested: investment.quantity * investment.buyPrice,
      current: investment.quantity * investment.currentPrice,
      returns: (investment.quantity * investment.currentPrice) - (investment.quantity * investment.buyPrice)
    })
  },

  BONDS: {
    id: 'BONDS',
    name: 'Bonds',
    icon: 'document-text',
    color: '#34495E',
    fields: [
      { name: 'bondName', label: 'Bond Name', type: 'text', required: true },
      { name: 'faceValue', label: 'Face Value', type: 'number', required: true },
      { name: 'couponRate', label: 'Coupon Rate (%)', type: 'number', required: true },
      { name: 'currentValue', label: 'Current Value', type: 'number', required: true },
      { name: 'issueDate', label: 'Issue Date', type: 'date', required: true },
      { name: 'maturityDate', label: 'Maturity Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: 'Bond',
      invested: investment.faceValue,
      current: investment.currentValue,
      returns: investment.currentValue - investment.faceValue
    })
  },

  INSURANCE: {
    id: 'INSURANCE',
    name: 'Insurance',
    icon: 'shield-checkmark',
    color: '#7F8C8D',
    fields: [
      { name: 'policyName', label: 'Policy Name', type: 'text', required: true },
      { name: 'policyNumber', label: 'Policy Number', type: 'text', required: true },
      { name: 'premiumAmount', label: 'Premium Amount', type: 'number', required: true },
      { name: 'coverageAmount', label: 'Coverage Amount', type: 'number', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'maturityDate', label: 'Maturity Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: 'Policy',
      invested: investment.premiumAmount,
      current: investment.premiumAmount,
      returns: 0
    })
  },

  POST_OFFICE_RD: {
    id: 'POST_OFFICE_RD',
    name: 'Post Office RD',
    icon: 'mail',
    color: '#D35400',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: false },
      { name: 'monthlyDeposit', label: 'Monthly Deposit', type: 'number', required: true },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true },
      {
        name: 'compoundingFrequency',
        label: 'Compounding Frequency',
        type: 'select',
        required: false,
        options: [
          { label: 'Quarterly (Default)', value: 'quarterly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Half-Yearly', value: 'half-yearly' },
          { label: 'Yearly', value: 'yearly' }
        ]
      },
      { name: 'tenure', label: 'Tenure (months)', type: 'number', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'maturityDate', label: 'Maturity Date', type: 'date', required: true },
      { name: 'accountNumber', label: 'Account Number', type: 'text', required: false },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => {
      const totalDeposited = investment.monthlyDeposit * investment.tenure;
      // Simple RD maturity calculation: M = P * n * (n+1) * (2n+1) / (6 * 12) * r/100 + P*n
      const n = investment.tenure;
      const P = investment.monthlyDeposit;
      const r = investment.interestRate;
      const interest = (P * n * (n + 1) * (2 * n + 1)) / (6 * 12) * (r / 100);
      const maturityAmount = totalDeposited + interest;

      return {
        quantity: `${investment.tenure} months`,
        invested: totalDeposited,
        current: maturityAmount,
        returns: interest
      };
    }
  },

  POST_OFFICE_SCSS: {
    id: 'POST_OFFICE_SCSS',
    name: 'Post Office SCSS',
    icon: 'people',
    color: '#EC7063',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: false },
      { name: 'principal', label: 'Principal Amount', type: 'number', required: true },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true },
      {
        name: 'compoundingFrequency',
        label: 'Interest Payment Frequency',
        type: 'select',
        required: false,
        options: [
          { label: 'Quarterly (Default)', value: 'quarterly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Half-Yearly', value: 'half-yearly' },
          { label: 'Yearly', value: 'yearly' }
        ]
      },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'maturityDate', label: 'Maturity Date', type: 'date', required: true },
      { name: 'accountNumber', label: 'Account Number', type: 'text', required: false },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => {
      const start = new Date(investment.startDate);
      const maturity = new Date(investment.maturityDate);
      const tenureYears = (maturity - start) / (1000 * 60 * 60 * 24 * 365.25);
      const maturityAmount = investment.principal * (1 + (investment.interestRate / 100) * tenureYears);

      return {
        quantity: `${Math.round(tenureYears * 4)} quarters`,
        invested: investment.principal,
        current: maturityAmount,
        returns: maturityAmount - investment.principal
      };
    }
  },

  POST_OFFICE_SAVINGS: {
    id: 'POST_OFFICE_SAVINGS',
    name: 'Post Office Savings Account',
    icon: 'wallet',
    color: '#F8B739',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: false },
      { name: 'balance', label: 'Current Balance', type: 'number', required: true },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true },
      { name: 'accountNumber', label: 'Account Number', type: 'text', required: false },
      { name: 'openingDate', label: 'Account Opening Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: 'Savings Account',
      invested: investment.balance,
      current: investment.balance,
      returns: 0
    })
  },

  POST_OFFICE_MIS: {
    id: 'POST_OFFICE_MIS',
    name: 'Post Office MIS',
    icon: 'calendar',
    color: '#5DADE2',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: false },
      { name: 'principal', label: 'Principal Amount', type: 'number', required: true },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true },
      { name: 'monthlyIncome', label: 'Monthly Income', type: 'number', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'maturityDate', label: 'Maturity Date', type: 'date', required: true },
      { name: 'accountNumber', label: 'Account Number', type: 'text', required: false },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => {
      const start = new Date(investment.startDate);
      const maturity = new Date(investment.maturityDate);
      const tenureMonths = Math.round((maturity - start) / (1000 * 60 * 60 * 24 * 30.44));
      const totalIncome = investment.monthlyIncome * tenureMonths;
      const maturityAmount = investment.principal + totalIncome;

      return {
        quantity: `${tenureMonths} months`,
        invested: investment.principal,
        current: maturityAmount,
        returns: totalIncome
      };
    }
  },

  POST_OFFICE_KVP: {
    id: 'POST_OFFICE_KVP',
    name: 'Post Office KVP',
    icon: 'leaf',
    color: '#58D68D',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: false },
      { name: 'principal', label: 'Principal Amount', type: 'number', required: true },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true },
      { name: 'maturityAmount', label: 'Maturity Amount', type: 'number', required: true },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { name: 'maturityDate', label: 'Maturity Date', type: 'date', required: true },
      { name: 'certificateNumber', label: 'Certificate Number', type: 'text', required: false },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => {
      const start = new Date(investment.purchaseDate);
      const maturity = new Date(investment.maturityDate);
      const now = new Date();
      const tenureYears = (maturity - start) / (1000 * 60 * 60 * 24 * 365.25);

      // Calculate current value based on time elapsed
      let currentValue;
      if (now >= maturity) {
        // If maturity date has passed, current value = maturity amount
        currentValue = investment.maturityAmount;
      } else if (now <= start) {
        // If before purchase date, current value = principal
        currentValue = investment.principal;
      } else {
        // Calculate proportional value based on time elapsed
        const totalDays = (maturity - start) / (1000 * 60 * 60 * 24);
        const daysPassed = (now - start) / (1000 * 60 * 60 * 24);
        const proportionElapsed = daysPassed / totalDays;

        // Linear interpolation between principal and maturity amount
        const totalGrowth = investment.maturityAmount - investment.principal;
        currentValue = investment.principal + (totalGrowth * proportionElapsed);
      }

      return {
        quantity: `${Math.round(tenureYears * 12)} months`,
        invested: investment.principal,
        current: currentValue,
        returns: currentValue - investment.principal
      };
    }
  },

  POST_OFFICE_TD: {
    id: 'POST_OFFICE_TD',
    name: 'Post Office Time Deposit',
    icon: 'time',
    color: '#AF7AC5',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: false },
      { name: 'principal', label: 'Principal Amount', type: 'number', required: true },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true },
      {
        name: 'compoundingFrequency',
        label: 'Compounding Frequency',
        type: 'select',
        required: false,
        options: [
          { label: 'Quarterly (Default)', value: 'quarterly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Half-Yearly', value: 'half-yearly' },
          { label: 'Yearly', value: 'yearly' }
        ]
      },
      { name: 'tenure', label: 'Tenure (years)', type: 'number', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'maturityDate', label: 'Maturity Date', type: 'date', required: true },
      { name: 'accountNumber', label: 'Account Number', type: 'text', required: false },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => {
      // Quarterly compounding
      const n = 4; // quarters per year
      const r = investment.interestRate / 100;
      const t = investment.tenure;
      const maturityAmount = investment.principal * Math.pow((1 + r / n), n * t);

      return {
        quantity: `${investment.tenure} years`,
        invested: investment.principal,
        current: maturityAmount,
        returns: maturityAmount - investment.principal
      };
    }
  },

  POST_OFFICE_NSC: {
    id: 'POST_OFFICE_NSC',
    name: 'National Savings Certificate',
    icon: 'ribbon',
    color: '#85929E',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: false },
      { name: 'principal', label: 'Principal Amount', type: 'number', required: true },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true },
      { name: 'maturityAmount', label: 'Maturity Amount', type: 'number', required: true },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { name: 'maturityDate', label: 'Maturity Date', type: 'date', required: true },
      { name: 'certificateNumber', label: 'Certificate Number', type: 'text', required: false },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: 'NSC Certificate',
      invested: investment.principal,
      current: investment.maturityAmount,
      returns: investment.maturityAmount - investment.principal
    })
  },

  POST_OFFICE_MSSC: {
    id: 'POST_OFFICE_MSSC',
    name: 'Post Office MSSC',
    icon: 'woman',
    color: '#E91E63',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: false },
      { name: 'principal', label: 'Principal Amount', type: 'number', required: true },
      { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true },
      {
        name: 'compoundingFrequency',
        label: 'Compounding Frequency',
        type: 'select',
        required: false,
        options: [
          { label: 'Quarterly (Default)', value: 'quarterly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Half-Yearly', value: 'half-yearly' },
          { label: 'Yearly', value: 'yearly' }
        ]
      },
      { name: 'depositDate', label: 'Deposit Date', type: 'date', required: true },
      { name: 'maturityDate', label: 'Maturity Date', type: 'date', required: true },
      { name: 'accountNumber', label: 'Account Number', type: 'text', required: false },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => {
      const start = new Date(investment.depositDate);
      const maturity = new Date(investment.maturityDate);
      const tenureYears = (maturity - start) / (1000 * 60 * 60 * 24 * 365.25);

      // Quarterly compounding (default)
      const n = 4; // quarters per year
      const r = investment.interestRate / 100;
      const maturityAmount = investment.principal * Math.pow((1 + r / n), n * tenureYears);

      return {
        quantity: `${Math.round(tenureYears * 12)} months`,
        invested: investment.principal,
        current: maturityAmount,
        returns: maturityAmount - investment.principal
      };
    }
  },

  OTHER: {
    id: 'OTHER',
    name: 'Other Investments',
    icon: 'ellipsis-horizontal',
    color: '#95A5A6',
    fields: [
      { name: 'investmentName', label: 'Investment Name', type: 'text', required: true },
      { name: 'investedAmount', label: 'Invested Amount', type: 'number', required: true },
      { name: 'currentValue', label: 'Current Value', type: 'number', required: true },
      { name: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
      { name: 'notes', label: 'Notes', type: 'text', required: false }
    ],
    displayFormat: (investment) => ({
      quantity: 'Investment',
      invested: investment.investedAmount,
      current: investment.currentValue,
      returns: investment.currentValue - investment.investedAmount
    })
  }
};

// Helper function to get all investment type IDs
export const getAllInvestmentTypeIds = () => {
  return Object.keys(INVESTMENT_TYPES);
};

// Helper function to get investment type by ID
export const getInvestmentType = (typeId) => {
  return INVESTMENT_TYPES[typeId];
};

// Helper function to format investment display
export const formatInvestmentDisplay = (investment) => {
  const type = INVESTMENT_TYPES[investment.type];
  if (!type) return null;

  return type.displayFormat(investment);
};
