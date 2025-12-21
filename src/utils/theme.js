// Theme colors and utilities
export const lightTheme = {
  // Backgrounds
  background: '#f5f5f5',
  cardBackground: '#fff',
  headerBackground: '#4A90E2',

  // Text colors
  textPrimary: '#333',
  textSecondary: '#666',
  textTertiary: '#999',
  textInverse: '#fff',

  // Border colors
  border: '#ddd',
  borderLight: '#f0f0f0',
  borderVeryLight: '#f8f8f8',

  // Status colors (same for both themes)
  positive: '#27AE60',
  negative: '#E74C3C',
  primary: '#4A90E2',

  // Special backgrounds
  emptyContainer: '#f9f9f9',
  inputBackground: '#fff',
  disabledBackground: '#E0E0E0',

  // Icon colors
  iconColor: '#fff',
  iconSecondary: '#666',

  // Button colors
  buttonText: '#fff',
  buttonIcon: '#fff',

  // Input colors
  inputText: '#333',

  // Tab bar colors
  tabActiveColor: '#4A90E2',
  tabInactiveColor: '#666',
};

export const darkTheme = {
  // Backgrounds
  background: '#121212',
  cardBackground: '#1E1E1E',
  headerBackground: '#1A1A2E',

  // Text colors
  textPrimary: '#E0E0E0',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  // Border colors
  border: '#333',
  borderLight: '#2A2A2A',
  borderVeryLight: '#252525',

  // Status colors (same for both themes)
  positive: '#27AE60',
  negative: '#E74C3C',
  primary: '#5BA3F5',

  // Special backgrounds
  emptyContainer: '#252525',
  inputBackground: '#2A2A2A',
  disabledBackground: '#333',

  // Icon colors
  iconColor: '#E0E0E0',
  iconSecondary: '#B0B0B0',

  // Button colors
  buttonText: '#FFFFFF',
  buttonIcon: '#FFFFFF',
  placeholderText: '#808080',

  // Input colors
  inputText: '#E0E0E0',

  // Tab bar colors
  tabActiveColor: '#5BA3F5',
  tabInactiveColor: '#B0B0B0',
};

export const getThemedStyles = (isDark) => {
  return isDark ? darkTheme : lightTheme;
};
