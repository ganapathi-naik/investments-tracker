# Investment Tracker

A comprehensive mobile application built with React Native and Expo for tracking and managing diverse investment portfolios. Monitor 23+ types of investments including stocks, mutual funds, fixed deposits, gold, real estate, and more - all in one place.

## Features

### Core Functionality

- **23 Investment Types Supported**
  - Equities: Indian Stocks, US Stocks, RSU, ESPP
  - Mutual Funds
  - Gold: Physical Gold, Sovereign Gold Bonds (SGB)
  - Fixed Income: Fixed Deposits, Recurring Deposits, Bonds
  - Real Estate
  - Cryptocurrency
  - Insurance Policies
  - Retirement: EPF, PPF, NPS
  - Post Office Schemes: RD, SCSS, MIS, KVP, NSC, MSSC, TD, Savings Account
  - Others

### Portfolio Management

- **Dashboard Overview**
  - Total portfolio value at a glance
  - Total invested amount vs current value
  - Overall returns (amount & percentage)
  - Quick add investment button
  - Real-time portfolio calculations

- **Portfolio Screen**
  - Grouped investments by type with color-coded indicators
  - Collapse/expand functionality for each investment type
  - Search investments by name or type
  - Individual investment cards showing:
    - Investment name and quantity
    - Invested amount
    - Current value
    - Returns (amount & percentage)
  - Pull-to-refresh data
  - Alphabetically sorted investment types
  - Performance-optimized with React.memo and useMemo

### Advanced Analytics & Reports

- **Portfolio Summary**
  - Total invested, current value, and returns
  - Portfolio allocation by investment type

- **Yearly Interest Tracking**
  - Calculate yearly interest/returns for any year
  - Supports interest-bearing investments (FDs, RDs, EPF, PPF, Bonds, etc.)
  - Interactive year selection
  - Detailed breakdown screen showing investment-wise yearly interest

- **Year-over-Year Comparison**
  - Visual comparison of last 5 years' returns
  - Bar chart visualization
  - Highlights selected year

- **Monthly Interest Breakdown**
  - Month-by-month interest distribution for selected year
  - Visual bar chart with current month highlighting
  - Future months grayed out
  - Compact value display (K/L/C format)

- **Performance Highlights**
  - Top 3 performing investments
  - Bottom 3 investments needing attention
  - Percentage returns and absolute gains/losses

- **Type-wise Reports**
  - Detailed breakdown by investment type
  - Invested, current value, returns, and allocation percentage
  - Individual investment listings under each type
  - Collapse/expand functionality for better navigation
  - Visual allocation bar

### Investment Management

- **Add Investments**
  - Type-specific forms with relevant fields
  - Smart form validation
  - Customizable investment names
  - Support for different currencies (USD/INR)
  - Date pickers for purchase/maturity dates

- **Edit Investments**
  - Update any investment details
  - Maintains data integrity
  - Type-specific editing forms

- **View Investment Details**
  - Complete investment information
  - Purchase date and maturity information
  - Calculated returns and percentages
  - Type-specific details display

### Smart Calculations

- **Automatic Interest Calculations**
  - Fixed Deposits: Supports simple and compound interest with various compounding frequencies
  - Recurring Deposits: Quarterly compounding formula
  - EPF/PPF/NPS: Monthly interest on running balance with contributions
  - Post Office Schemes: Scheme-specific calculation formulas
  - Insurance: Premium-based calculations with bonus tracking for endowment policies
  - Bonds: Coupon rate-based interest
  - SGB: Interest rate on issue price

- **Real-time Valuation**
  - Stocks: Quantity × Current Price
  - Mutual Funds: Units × Current NAV
  - Gold: Grams × Current Price
  - Real Estate: Current market value tracking

- **Currency Conversion**
  - Automatic USD to INR conversion
  - Configurable exchange rate
  - Applied to US Stocks, RSU, ESPP, Cryptocurrency

### Notifications

- **Maturity Alerts**
  - 7-day advance notifications for maturing investments
  - Daily notifications at 9 AM and 4 PM
  - Supports FDs, RDs, Bonds, SGBs, Insurance, and all Post Office schemes

- **Payment Reminders**
  - Recurring Deposit payment reminders (15th of every month)
  - Insurance premium reminders (based on payment frequency)
  - 7-day advance notifications
  - Twice daily reminders (9 AM and 4 PM)

### Settings & Customization

- **USD to INR Exchange Rate**
  - Configurable exchange rate
  - Applies to all USD-denominated investments

- **Data Management**
  - Local storage using AsyncStorage
  - Data persistence across app restarts
  - Pull-to-refresh on all screens

### User Experience

- **Intuitive Navigation**
  - Bottom tab navigation
  - 4 main tabs: Dashboard, Portfolio, Reports, Settings
  - Smooth transitions and animations

- **Performance Optimizations**
  - Memoized components and calculations
  - Lazy loading of investment lists
  - Efficient re-rendering with React.memo
  - Optimized for 60+ investments

- **Visual Design**
  - Clean, modern interface
  - Color-coded investment types
  - Consistent design language
  - Status bar customization
  - Loading animations

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Bottom Tabs, Stack Navigator)
- **Storage**: AsyncStorage for local data persistence
- **Notifications**: expo-notifications
- **Icons**: Ionicons
- **UI Components**: React Native built-in components
- **State Management**: React Hooks (useState, useCallback, useMemo, useFocusEffect)
- **Date Handling**: JavaScript Date API
- **Platform**: Android (tested and optimized)

## Project Structure

```
Investment-Tracker/
├── src/
│   ├── models/
│   │   └── InvestmentTypes.js          # 23 investment type definitions
│   ├── navigation/
│   │   └── AppNavigator.js             # App navigation configuration
│   ├── screens/
│   │   ├── DashboardScreen.js          # Dashboard overview
│   │   ├── PortfolioScreen.js          # Portfolio with collapse/expand
│   │   ├── ReportsScreen.js            # Analytics and reports
│   │   ├── SettingsScreen.js           # App settings
│   │   ├── AddInvestmentScreen.js      # Investment type selection
│   │   ├── AddInvestmentFormScreen.js  # Generic investment form
│   │   ├── AddPostOfficeRDScreen.js    # Post Office RD specific form
│   │   ├── EditInvestmentScreen.js     # Edit investment
│   │   ├── InvestmentDetailScreen.js   # Investment details
│   │   └── YearlyReturnsBreakdownScreen.js  # Yearly interest breakdown
│   ├── services/
│   │   ├── notificationService.js      # Notification scheduling
│   │   └── documentService.js          # Document handling
│   ├── utils/
│   │   ├── calculations.js             # Investment calculations
│   │   ├── analytics.js                # Analytics calculations
│   │   └── storage.js                  # AsyncStorage wrapper
│   └── App.js                          # Root component
├── android/                            # Android-specific files
├── assets/                             # Images and static assets
├── package.json                        # Dependencies
└── README.md                           # This file
```

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Java JDK 17 (for building Android APK)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Investment-Tracker.git
   cd Investment-Tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on Android**
   ```bash
   npx expo start --android
   ```

### Building APK

To build a release APK:

```bash
cd android
export JAVA_HOME=/path/to/openjdk@17
./gradlew assembleRelease
```

The APK will be generated at: `android/app/build/outputs/apk/release/app-release.apk`

## Usage Guide

### Adding Your First Investment

1. Open the app and tap the "+" button on Dashboard or Portfolio screen
2. Select the investment type from the list
3. Fill in the required details (varies by type)
4. Tap "Add Investment"

### Tracking Returns

- **Dashboard**: See overall portfolio performance
- **Portfolio**: View individual investment returns grouped by type
- **Reports**: Analyze detailed yearly and monthly returns

### Setting Up Notifications

1. Go to Settings tab
2. The app will request notification permissions
3. Notifications are automatically scheduled for:
   - Investments maturing in next 7 days
   - RD payments due in next 7 days
   - Insurance premiums due in next 7 days

### Customizing Exchange Rate

1. Go to Settings tab
2. Update "USD to INR Exchange Rate"
3. This affects all USD-denominated investments (US Stocks, RSU, ESPP, Crypto)

## Key Features Explained

### Collapse/Expand Functionality

Both Portfolio and Reports screens support collapsing/expanding investment type groups:
- Tap on group header to toggle individual group
- Use the expand/collapse all button to toggle all groups at once
- Default: All groups start expanded

### Yearly Interest Calculation

The app calculates yearly interest for interest-bearing investments:
- Fixed Deposits: Based on compounding frequency
- Recurring Deposits: Quarterly compounding formula
- EPF/PPF: Monthly interest with contributions
- Post Office Schemes: Scheme-specific formulas
- Bonds: Coupon-based interest
- Insurance: Premium-based with bonus tracking

### Performance Optimization

For portfolios with 60+ investments:
- React.memo prevents unnecessary re-renders
- useMemo caches expensive calculations
- useCallback memoizes function references
- Lazy loading of investment lists when expanded

## Data Model

### Investment Object Structure

Each investment contains:
- `id`: Unique identifier
- `type`: Investment type (one of 23 types)
- `investmentName`: Optional custom name
- Type-specific fields (e.g., quantity, buyPrice, currentPrice)
- Date fields (purchaseDate, maturityDate, etc.)
- Notes field for additional information

## Supported Investment Types

1. **PHYSICAL_GOLD** - Physical gold jewelry/coins/bars
2. **SGB** - Sovereign Gold Bonds
3. **EPF** - Employee Provident Fund
4. **PPF** - Public Provident Fund
5. **FIXED_DEPOSIT** - Bank Fixed Deposits
6. **RECURRING_DEPOSIT** - Bank Recurring Deposits
7. **MUTUAL_FUND** - Mutual Funds
8. **STOCKS** - Indian Stock Market
9. **US_STOCKS** - US Stock Market
10. **RSU** - Restricted Stock Units
11. **ESPP** - Employee Stock Purchase Plan
12. **NPS** - National Pension System
13. **REAL_ESTATE** - Property investments
14. **CRYPTOCURRENCY** - Digital currencies
15. **BONDS** - Corporate/Government bonds
16. **INSURANCE** - Life insurance policies
17. **POST_OFFICE_RD** - Post Office Recurring Deposit
18. **POST_OFFICE_SCSS** - Senior Citizen Savings Scheme
19. **POST_OFFICE_SAVINGS** - Post Office Savings Account
20. **POST_OFFICE_MIS** - Monthly Income Scheme
21. **POST_OFFICE_KVP** - Kisan Vikas Patra
22. **POST_OFFICE_NSC** - National Savings Certificate
23. **POST_OFFICE_MSSC** - Mahila Samman Savings Certificate
24. **POST_OFFICE_TD** - Post Office Time Deposit
25. **OTHER** - Custom investments

## Known Limitations

- Currently Android-only (iOS support can be added)
- Offline-first (no cloud sync)
- Manual price updates required for stocks/mutual funds
- Notification permissions required for alerts

## Future Enhancements

- Cloud backup and sync
- Multiple portfolios support
- Auto-update stock prices via API
- Tax calculation and reporting
- Goal-based investment tracking
- Family member portfolios
- Export data to CSV/Excel
- Dark mode
- iOS support

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [Your Email]

## Acknowledgments

- Built with React Native and Expo
- Icons from Ionicons
- Inspired by the need for comprehensive investment tracking

---

**Note**: This app is for personal investment tracking only. It does not provide financial advice. Always consult with a qualified financial advisor for investment decisions.
