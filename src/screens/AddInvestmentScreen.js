import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INVESTMENT_TYPES } from '../models/InvestmentTypes';
import { useTheme } from '../utils/useTheme';

const AddInvestmentScreen = ({ navigation }) => {
    const { isDark, colors } = useTheme();
  const styles = getStyles(colors);
const insets = useSafeAreaInsets();

  const handleTypeSelect = (typeId) => {
    // Navigate to dedicated full-screen form for all investment types
    navigation.navigate('AddInvestmentForm', { investmentType: typeId });
  };

  // Memoize sorted investment types to avoid re-sorting on every render
  const sortedInvestmentTypes = useMemo(() => {
    return Object.entries(INVESTMENT_TYPES)
      .sort(([, typeA], [, typeB]) => typeA.name.localeCompare(typeB.name));
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Investment Type</Text>
          <View style={styles.typeGrid}>
            {sortedInvestmentTypes.map(([typeId, type]) => (
              <TouchableOpacity
                key={typeId}
                style={[
                  styles.typeCard,
                  { borderLeftColor: type.color }
                ]}
                onPress={() => handleTypeSelect(typeId)}
              >
                <View style={styles.typeCardContent}>
                  <Text style={styles.typeName}>
                    {type.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollView: {
    flex: 1
  },
  section: {
    backgroundColor: colors.cardBackground,
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.textPrimary
  },
  typeGrid: {
    flex: 1
  },
  typeCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderLeftWidth: 6,
    backgroundColor: colors.cardBackground
  },
  typeCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  typeName: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500'
  }
});

export default AddInvestmentScreen;
