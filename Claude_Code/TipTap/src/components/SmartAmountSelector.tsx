import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CategoryPresets {
  golf: number[];
  valet: number[];
  hotel: number[];
  restaurant: number[];
  service: number[];
  delivery: number[];
}

interface TipCalculatorData {
  billAmount: number;
  tipPercentage: number;
  splitCount: number;
}

interface SmartAmountSelectorProps {
  onAmountSelect: (amount: number, context?: any) => void;
  category?: keyof CategoryPresets;
  showCalculator?: boolean;
  recentAmounts?: number[];
}

const CATEGORY_PRESETS: CategoryPresets = {
  golf: [5, 10, 20, 50],
  valet: [2, 5, 10, 20],
  hotel: [5, 10, 15, 25],
  restaurant: [15, 20, 25, 30],
  service: [10, 15, 20, 25],
  delivery: [3, 5, 8, 12],
};

const CATEGORY_LABELS = {
  golf: 'Golf & Country Club',
  valet: 'Valet & Parking',
  hotel: 'Hotel & Concierge',
  restaurant: 'Restaurant & Dining',
  service: 'Personal Services',
  delivery: 'Delivery & Takeout',
};

const TIP_PERCENTAGES = [15, 18, 20, 22, 25];

const SmartAmountSelector: React.FC<SmartAmountSelectorProps> = ({
  onAmountSelect,
  category = 'service',
  showCalculator = false,
  recentAmounts = [],
}) => {
  const [selectedCategory, setSelectedCategory] = useState<keyof CategoryPresets>(category);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showTipCalculator, setShowTipCalculator] = useState(false);
  const [recentTipAmounts, setRecentTipAmounts] = useState<number[]>([]);

  // Tip calculator state
  const [calculatorData, setCalculatorData] = useState<TipCalculatorData>({
    billAmount: 0,
    tipPercentage: 18,
    splitCount: 1,
  });

  useEffect(() => {
    loadRecentAmounts();
  }, []);

  const loadRecentAmounts = async () => {
    try {
      const stored = await AsyncStorage.getItem('recentTipAmounts');
      if (stored) {
        const amounts = JSON.parse(stored);
        setRecentTipAmounts(amounts.slice(0, 6)); // Show last 6 amounts
      }
    } catch (error) {
      console.warn('Failed to load recent amounts:', error);
    }
  };

  const saveRecentAmount = async (amount: number) => {
    try {
      const stored = await AsyncStorage.getItem('recentTipAmounts');
      const existing = stored ? JSON.parse(stored) : [];

      // Remove if already exists and add to front
      const filtered = existing.filter((a: number) => a !== amount);
      const updated = [amount, ...filtered].slice(0, 10); // Keep last 10

      await AsyncStorage.setItem('recentTipAmounts', JSON.stringify(updated));
      setRecentTipAmounts(updated.slice(0, 6));
    } catch (error) {
      console.warn('Failed to save recent amount:', error);
    }
  };

  const handleCategorySelect = (cat: keyof CategoryPresets) => {
    setSelectedCategory(cat);
    setSelectedAmount(null);
    setCustomAmount('');
  };

  const handlePresetSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (text: string) => {
    setCustomAmount(text);
    setSelectedAmount(null);
  };

  const calculateTip = () => {
    const {billAmount, tipPercentage, splitCount} = calculatorData;
    const tipAmount = (billAmount * tipPercentage) / 100;
    const totalPerPerson = splitCount > 1 ? tipAmount / splitCount : tipAmount;
    return {
      tipAmount: Math.round(tipAmount * 100) / 100,
      totalPerPerson: Math.round(totalPerPerson * 100) / 100,
    };
  };

  const handleCalculatorConfirm = () => {
    const {totalPerPerson} = calculateTip();
    setSelectedAmount(totalPerPerson);
    setCustomAmount('');
    setShowTipCalculator(false);
  };

  const handleAmountConfirm = () => {
    const amount = selectedAmount || parseFloat(customAmount) || 0;

    if (amount <= 0) {
      Alert.alert('Invalid Amount', 'Please select or enter a valid tip amount');
      return;
    }

    saveRecentAmount(amount);
    onAmountSelect(amount, {
      category: selectedCategory,
      isFromCalculator: showTipCalculator,
    });
  };

  const getCurrentAmount = () => {
    return selectedAmount || parseFloat(customAmount) || 0;
  };

  const renderCategoryTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryTabs}
      contentContainerStyle={styles.categoryTabsContent}
    >
      {Object.keys(CATEGORY_PRESETS).map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[
            styles.categoryTab,
            selectedCategory === cat && styles.selectedCategoryTab,
          ]}
          onPress={() => handleCategorySelect(cat as keyof CategoryPresets)}
        >
          <Text
            style={[
              styles.categoryTabText,
              selectedCategory === cat && styles.selectedCategoryTabText,
            ]}
          >
            {CATEGORY_LABELS[cat as keyof CategoryPresets]}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderRecentAmounts = () => {
    if (recentTipAmounts.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Amounts</Text>
        <View style={styles.amountGrid}>
          {recentTipAmounts.map((amount, index) => (
            <TouchableOpacity
              key={`${amount}-${index}`}
              style={[
                styles.amountButton,
                styles.recentAmountButton,
                selectedAmount === amount && styles.selectedAmount,
              ]}
              onPress={() => handlePresetSelect(amount)}
            >
              <Icon name="history" size={16} color="#6b7280" style={styles.recentIcon} />
              <Text
                style={[
                  styles.amountText,
                  selectedAmount === amount && styles.selectedAmountText,
                ]}
              >
                ${amount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderTipCalculator = () => {
    if (!showTipCalculator) return null;

    const {tipAmount, totalPerPerson} = calculateTip();

    return (
      <View style={styles.calculatorContainer}>
        <View style={styles.calculatorHeader}>
          <Text style={styles.calculatorTitle}>Tip Calculator</Text>
          <TouchableOpacity
            onPress={() => setShowTipCalculator(false)}
            style={styles.closeButton}
          >
            <Icon name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.calculatorInputs}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bill Amount ($)</Text>
            <TextInput
              style={styles.calculatorInput}
              value={calculatorData.billAmount.toString()}
              onChangeText={(text) =>
                setCalculatorData(prev => ({
                  ...prev,
                  billAmount: parseFloat(text) || 0,
                }))
              }
              keyboardType="numeric"
              placeholder="0.00"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tip Percentage</Text>
            <View style={styles.percentageButtons}>
              {TIP_PERCENTAGES.map((percentage) => (
                <TouchableOpacity
                  key={percentage}
                  style={[
                    styles.percentageButton,
                    calculatorData.tipPercentage === percentage &&
                      styles.selectedPercentageButton,
                  ]}
                  onPress={() =>
                    setCalculatorData(prev => ({
                      ...prev,
                      tipPercentage: percentage,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.percentageButtonText,
                      calculatorData.tipPercentage === percentage &&
                        styles.selectedPercentageButtonText,
                    ]}
                  >
                    {percentage}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Split Between ({calculatorData.splitCount} {calculatorData.splitCount === 1 ? 'person' : 'people'})</Text>
            <View style={styles.splitControls}>
              <TouchableOpacity
                style={styles.splitButton}
                onPress={() =>
                  setCalculatorData(prev => ({
                    ...prev,
                    splitCount: Math.max(1, prev.splitCount - 1),
                  }))
                }
              >
                <Icon name="remove" size={20} color="#6b7280" />
              </TouchableOpacity>
              <Text style={styles.splitCount}>{calculatorData.splitCount}</Text>
              <TouchableOpacity
                style={styles.splitButton}
                onPress={() =>
                  setCalculatorData(prev => ({
                    ...prev,
                    splitCount: Math.min(10, prev.splitCount + 1),
                  }))
                }
              >
                <Icon name="add" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.calculatorResults}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Total Tip:</Text>
              <Text style={styles.resultValue}>${tipAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>
                {calculatorData.splitCount > 1 ? 'Tip per person:' : 'Tip amount:'}
              </Text>
              <Text style={[styles.resultValue, styles.finalAmount]}>
                ${totalPerPerson.toFixed(2)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.calculatorConfirmButton}
            onPress={handleCalculatorConfirm}
          >
            <Text style={styles.calculatorConfirmText}>
              Use ${totalPerPerson.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderCategoryTabs()}

      {renderRecentAmounts()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {CATEGORY_LABELS[selectedCategory]} Presets
        </Text>
        <View style={styles.amountGrid}>
          {CATEGORY_PRESETS[selectedCategory].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.amountButton,
                selectedAmount === amount && styles.selectedAmount,
              ]}
              onPress={() => handlePresetSelect(amount)}
            >
              <Text
                style={[
                  styles.amountText,
                  selectedAmount === amount && styles.selectedAmountText,
                ]}
              >
                ${amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.customAmountHeader}>
          <Text style={styles.sectionTitle}>Custom Amount</Text>
          {showCalculator && (
            <TouchableOpacity
              style={styles.calculatorButton}
              onPress={() => setShowTipCalculator(!showTipCalculator)}
            >
              <Icon name="calculate" size={20} color="#007AFF" />
              <Text style={styles.calculatorButtonText}>Calculator</Text>
            </TouchableOpacity>
          )}
        </View>

        {!showTipCalculator && (
          <View style={styles.customInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.customInput}
              placeholder="0.00"
              value={customAmount}
              onChangeText={handleCustomAmountChange}
              keyboardType="numeric"
              maxLength={8}
            />
          </View>
        )}

        {renderTipCalculator()}
      </View>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          getCurrentAmount() > 0 && styles.confirmButtonActive,
        ]}
        onPress={handleAmountConfirm}
        disabled={getCurrentAmount() <= 0}
      >
        <Text
          style={[
            styles.confirmText,
            getCurrentAmount() > 0 && styles.confirmTextActive,
          ]}
        >
          Continue with ${getCurrentAmount().toFixed(2)}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoryTabs: {
    marginBottom: 24,
  },
  categoryTabsContent: {
    paddingHorizontal: 4,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  selectedCategoryTab: {
    backgroundColor: '#007AFF',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  selectedCategoryTabText: {
    color: '#ffffff',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountButton: {
    flex: 1,
    minWidth: '22%',
    maxWidth: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 60,
  },
  recentAmountButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentIcon: {
    marginRight: 4,
  },
  selectedAmount: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedAmountText: {
    color: '#ffffff',
  },
  customAmountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calculatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  calculatorButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 4,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 8,
  },
  customInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    paddingVertical: 16,
  },
  calculatorContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
  },
  calculatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calculatorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  calculatorInputs: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  calculatorInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  percentageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  percentageButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  selectedPercentageButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  percentageButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  selectedPercentageButtonText: {
    color: '#ffffff',
  },
  splitControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  splitButton: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  splitCount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 40,
    textAlign: 'center',
  },
  calculatorResults: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  finalAmount: {
    fontSize: 24,
    color: '#10b981',
  },
  calculatorConfirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  calculatorConfirmText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  confirmButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  confirmButtonActive: {
    backgroundColor: '#007AFF',
  },
  confirmText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
  },
  confirmTextActive: {
    color: '#ffffff',
  },
});

export default SmartAmountSelector;