// Storage utility using AsyncStorage for persisting investments data

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@investment_tracker:investments';
const SETTINGS_KEY = '@investment_tracker:settings';

/**
 * Save investments to AsyncStorage
 */
export const saveInvestments = async (investments) => {
  try {
    const jsonValue = JSON.stringify(investments);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    return true;
  } catch (error) {
    console.error('Error saving investments:', error);
    return false;
  }
};

/**
 * Load investments from AsyncStorage
 */
export const loadInvestments = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading investments:', error);
    return [];
  }
};

/**
 * Add a new investment
 */
export const addInvestment = async (investment) => {
  try {
    const investments = await loadInvestments();
    const newInvestment = {
      ...investment,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    investments.push(newInvestment);
    await saveInvestments(investments);
    return newInvestment;
  } catch (error) {
    console.error('Error adding investment:', error);
    return null;
  }
};

/**
 * Update an existing investment
 */
export const updateInvestment = async (id, updatedData) => {
  try {
    const investments = await loadInvestments();
    const index = investments.findIndex(inv => inv.id === id);

    if (index === -1) {
      return null;
    }

    investments[index] = {
      ...investments[index],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    await saveInvestments(investments);
    return investments[index];
  } catch (error) {
    console.error('Error updating investment:', error);
    return null;
  }
};

/**
 * Delete an investment
 */
export const deleteInvestment = async (id) => {
  try {
    const investments = await loadInvestments();
    const filteredInvestments = investments.filter(inv => inv.id !== id);
    await saveInvestments(filteredInvestments);
    return true;
  } catch (error) {
    console.error('Error deleting investment:', error);
    return false;
  }
};

/**
 * Get a single investment by ID
 */
export const getInvestmentById = async (id) => {
  try {
    const investments = await loadInvestments();
    return investments.find(inv => inv.id === id) || null;
  } catch (error) {
    console.error('Error getting investment:', error);
    return null;
  }
};

/**
 * Get investments by type
 */
export const getInvestmentsByType = async (type) => {
  try {
    const investments = await loadInvestments();
    return investments.filter(inv => inv.type === type);
  } catch (error) {
    console.error('Error getting investments by type:', error);
    return [];
  }
};

/**
 * Save app settings
 */
export const saveSettings = async (settings) => {
  try {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

/**
 * Load app settings
 */
export const loadSettings = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : {
      currency: 'INR',
      usdToInrRate: 83.0
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      currency: 'INR',
      usdToInrRate: 83.0
    };
  }
};

/**
 * Clear all data (use with caution)
 */
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY, SETTINGS_KEY]);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

/**
 * Generate unique ID for investments
 */
const generateId = () => {
  return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Export data as JSON string (for backup)
 */
export const exportData = async () => {
  try {
    const investments = await loadInvestments();
    const settings = await loadSettings();
    const exportData = {
      investments,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
};

/**
 * Import data from JSON string (for restore)
 */
export const importData = async (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (data.investments) {
      await saveInvestments(data.investments);
    }
    if (data.settings) {
      await saveSettings(data.settings);
    }
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};
