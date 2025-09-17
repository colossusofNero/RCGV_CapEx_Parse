import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAppContext} from '@/context/AppContext';
import {useTipLimits} from '@/hooks/useTipLimits';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TipCategory = 'restaurant' | 'golf' | 'valet' | 'hotel' | 'general';

interface CategoryPreset {
  category: TipCategory;
  name: string;
  amounts: number[];
  icon: string;
  description: string;
}

interface RecentAmount {
  amount: number;
  timestamp: number;
  category?: TipCategory;
}

const TipAmountScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {method, category} = route.params as {method: 'nfc' | 'qr', category?: TipCategory};
  const {state} = useAppContext();
  const {canTip, getRemainingLimit} = useTipLimits();
  const [customAmount, setCustomAmount] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TipCategory>(category || 'general');
  const [recentAmounts, setRecentAmounts] = useState<RecentAmount[]>([]);
  const [showNumberPad, setShowNumberPad] = useState(false);
  const [showTipCalculator, setShowTipCalculator] = useState(false);
  const [billAmount, setBillAmount] = useState('');
  const [tipPercentage, setTipPercentage] = useState(18);

  const categoryPresets: CategoryPreset[] = [
    {
      category: 'restaurant',
      name: 'Restaurant',
      amounts: [5, 10, 15, 20],
      icon: 'restaurant',
      description: 'Dining & Food Service'
    },
    {
      category: 'golf',
      name: 'Golf',
      amounts: [10, 20, 25, 30],
      icon: 'golf-course',
      description: 'Golf Course Services'
    },
    {
      category: 'valet',
      name: 'Valet',
      amounts: [5, 10, 15, 20],
      icon: 'local-parking',
      description: 'Parking & Valet'
    },
    {
      category: 'hotel',
      name: 'Hotel',
      amounts: [5, 10, 15, 25],
      icon: 'hotel',
      description: 'Hotel Services'
    },
    {
      category: 'general',
      name: 'General',
      amounts: [5, 10, 15, 20],
      icon: 'payment',
      description: 'General Services'
    }
  ];

  useEffect(() => {
    loadRecentAmounts();
  }, []);

  const loadRecentAmounts = async () => {
    try {
      const stored = await AsyncStorage.getItem('recentTipAmounts');
      if (stored) {
        const amounts: RecentAmount[] = JSON.parse(stored);
        // Keep only last 10 amounts from last 30 days
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const filtered = amounts
          .filter(item => item.timestamp > thirtyDaysAgo)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
        setRecentAmounts(filtered);
      }
    } catch (error) {
      console.warn('Failed to load recent amounts:', error);
    }
  };

  const saveRecentAmount = async (amount: number) => {
    try {
      const newAmount: RecentAmount = {
        amount,
        timestamp: Date.now(),
        category: selectedCategory
      };
      const updated = [newAmount, ...recentAmounts]
        .filter((item, index, arr) =>
          arr.findIndex(i => i.amount === item.amount) === index
        )
        .slice(0, 10);
      setRecentAmounts(updated);
      await AsyncStorage.setItem('recentTipAmounts', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save recent amount:', error);
    }
  };

  const handleQuickTip = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setShowNumberPad(false);
  };

  const handleCustomAmountChange = (text: string) => {
    setCustomAmount(text);
    setSelectedAmount(null);
  };

  const handleNumberPadPress = (value: string) => {
    if (value === 'clear') {
      setCustomAmount('');
      setSelectedAmount(null);
    } else if (value === 'backspace') {
      setCustomAmount(prev => prev.slice(0, -1));
      setSelectedAmount(null);
    } else {
      const newAmount = customAmount + value;
      if (parseFloat(newAmount) <= 9999) {
        setCustomAmount(newAmount);
        setSelectedAmount(null);
      }
    }
  };

  const calculateTip = () => {
    const bill = parseFloat(billAmount) || 0;
    if (bill > 0) {
      const tipAmount = Math.round((bill * tipPercentage / 100) * 100) / 100;
      setSelectedAmount(tipAmount);
      setCustomAmount('');
      setShowTipCalculator(false);
    }
  };

  const getCurrentAmount = (): number => {
    if (selectedAmount !== null) return selectedAmount;
    return parseFloat(customAmount) || 0;
  };

  const handleProceed = () => {
    const amount = getCurrentAmount();

    if (amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid tip amount');
      return;
    }

    if (!canTip(amount)) {
      const remaining = getRemainingLimit('daily');
      Alert.alert(
        'Limit Exceeded',
        `This amount exceeds your daily limit. Remaining: $${remaining}`
      );
      return;
    }

    saveRecentAmount(amount);
    navigation.navigate('Payment', {method, amount, category: selectedCategory});
  };

  const getCurrentPreset = () => {
    return categoryPresets.find(p => p.category === selectedCategory) || categoryPresets[4];
  };

  const getUniqueRecentAmounts = () => {
    const seen = new Set();
    return recentAmounts.filter(item => {
      if (seen.has(item.amount)) {
        return false;
      }
      seen.add(item.amount);
      return true;
    }).slice(0, 6);
  };

  const remainingDaily = getRemainingLimit('daily');
  const currentPreset = getCurrentPreset();
  const uniqueRecentAmounts = getUniqueRecentAmounts();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Tip Amount</Text>
        <TouchableOpacity onPress={() => setShowTipCalculator(true)}>
          <Icon name="calculate" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.methodTitle}>
          {method === 'nfc' ? 'NFC Payment' : 'QR Code Payment'}
        </Text>

        {/* Category Selection */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Service Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categoryPresets.map((preset) => (
              <TouchableOpacity
                key={preset.category}
                style={[
                  styles.categoryCard,
                  selectedCategory === preset.category && styles.selectedCategoryCard,
                ]}
                onPress={() => setSelectedCategory(preset.category)}
              >
                <Icon
                  name={preset.icon}
                  size={24}
                  color={selectedCategory === preset.category ? '#007AFF' : '#666'}
                />
                <Text style={[
                  styles.categoryName,
                  selectedCategory === preset.category && styles.selectedCategoryName,
                ]}>
                  {preset.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Amounts for Selected Category */}
        <View style={styles.quickAmounts}>
          <Text style={styles.sectionTitle}>{currentPreset.name} Quick Tips</Text>
          <View style={styles.amountGrid}>
            {currentPreset.amounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.amountButton,
                  selectedAmount === amount && styles.selectedAmount,
                ]}
                onPress={() => handleQuickTip(amount)}>
                <Text
                  style={[
                    styles.amountText,
                    selectedAmount === amount && styles.selectedAmountText,
                  ]}>
                  ${amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Amounts */}
        {uniqueRecentAmounts.length > 0 && (
          <View style={styles.recentAmounts}>
            <Text style={styles.sectionTitle}>Recent Tips</Text>
            <View style={styles.recentGrid}>
              {uniqueRecentAmounts.map((recent, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.recentButton,
                    selectedAmount === recent.amount && styles.selectedAmount,
                  ]}
                  onPress={() => handleQuickTip(recent.amount)}>
                  <Text
                    style={[
                      styles.recentText,
                      selectedAmount === recent.amount && styles.selectedAmountText,
                    ]}>
                    ${recent.amount}
                  </Text>
                  {recent.category && (
                    <Text style={styles.recentCategory}>
                      {categoryPresets.find(p => p.category === recent.category)?.name}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Custom Amount */}
        <View style={styles.customAmount}>
          <View style={styles.customHeader}>
            <Text style={styles.sectionTitle}>Custom Amount</Text>
            <TouchableOpacity
              style={styles.numberPadButton}
              onPress={() => setShowNumberPad(true)}
            >
              <Icon name="dialpad" size={20} color="#007AFF" />
              <Text style={styles.numberPadButtonText}>Number Pad</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[
              styles.input,
              customAmount && styles.inputSelected,
            ]}
            placeholder="Enter amount"
            value={customAmount}
            onChangeText={handleCustomAmountChange}
            keyboardType="numeric"
            maxLength={6}
          />
        </View>

        <View style={styles.limitInfo}>
          <Text style={styles.limitText}>
            Daily limit remaining: ${remainingDaily} {state.settings.currency}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.proceedButton,
            getCurrentAmount() > 0 && styles.proceedButtonActive,
          ]}
          onPress={handleProceed}
          disabled={getCurrentAmount() <= 0}>
          <Text style={styles.proceedText}>
            Proceed with ${getCurrentAmount().toFixed(2)}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Number Pad Modal */}
      <Modal
        visible={showNumberPad}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNumberPad(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.numberPadModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Amount</Text>
              <TouchableOpacity onPress={() => setShowNumberPad(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.amountDisplay}>
              <Text style={styles.amountDisplayText}>
                ${customAmount || '0.00'}
              </Text>
            </View>

            <View style={styles.numberPadGrid}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.numberPadKey}
                  onPress={() => handleNumberPadPress(key)}
                >
                  {key === 'backspace' ? (
                    <Icon name="backspace" size={24} color="#333" />
                  ) : (
                    <Text style={styles.numberPadKeyText}>{key}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.numberPadActions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => handleNumberPadPress('clear')}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowNumberPad(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tip Calculator Modal */}
      <Modal
        visible={showTipCalculator}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTipCalculator(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calculatorModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tip Calculator</Text>
              <TouchableOpacity onPress={() => setShowTipCalculator(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.calculatorContent}>
              <View style={styles.billInputSection}>
                <Text style={styles.calculatorLabel}>Bill Amount</Text>
                <TextInput
                  style={styles.calculatorInput}
                  placeholder="0.00"
                  value={billAmount}
                  onChangeText={setBillAmount}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.tipPercentageSection}>
                <Text style={styles.calculatorLabel}>Tip Percentage</Text>
                <View style={styles.percentageButtons}>
                  {[15, 18, 20, 25].map((percent) => (
                    <TouchableOpacity
                      key={percent}
                      style={[
                        styles.percentageButton,
                        tipPercentage === percent && styles.selectedPercentageButton,
                      ]}
                      onPress={() => setTipPercentage(percent)}
                    >
                      <Text style={[
                        styles.percentageButtonText,
                        tipPercentage === percent && styles.selectedPercentageButtonText,
                      ]}>
                        {percent}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.tipResultSection}>
                <Text style={styles.calculatorLabel}>Tip Amount</Text>
                <Text style={styles.tipResult}>
                  ${((parseFloat(billAmount) || 0) * tipPercentage / 100).toFixed(2)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.useTipButton}
                onPress={calculateTip}
                disabled={!billAmount || parseFloat(billAmount) <= 0}
              >
                <Text style={styles.useTipButtonText}>Use This Tip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  methodTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  categorySection: {
    marginBottom: 30,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryCard: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  selectedCategoryCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  categoryName: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  selectedCategoryName: {
    color: '#007AFF',
    fontWeight: '600',
  },
  quickAmounts: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAmount: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  selectedAmountText: {
    color: '#fff',
  },
  recentAmounts: {
    marginBottom: 30,
  },
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  recentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  recentCategory: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  customAmount: {
    marginBottom: 30,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  numberPadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
  },
  numberPadButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    backgroundColor: '#f8f9fa',
  },
  inputSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  limitInfo: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 30,
  },
  limitText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  proceedButton: {
    backgroundColor: '#e9ecef',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  proceedButtonActive: {
    backgroundColor: '#007AFF',
  },
  proceedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#adb5bd',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  numberPadModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  calculatorModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  amountDisplay: {
    padding: 20,
    alignItems: 'center',
  },
  amountDisplayText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  numberPadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  numberPadKey: {
    width: '33.33%',
    aspectRatio: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  numberPadKeyText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#333',
  },
  numberPadActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  doneButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Calculator Modal Styles
  calculatorContent: {
    padding: 20,
  },
  billInputSection: {
    marginBottom: 24,
  },
  calculatorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  calculatorInput: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    backgroundColor: '#f8f9fa',
    textAlign: 'center',
  },
  tipPercentageSection: {
    marginBottom: 24,
  },
  percentageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  percentageButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPercentageButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  percentageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedPercentageButtonText: {
    color: '#fff',
  },
  tipResultSection: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  tipResult: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  useTipButton: {
    backgroundColor: '#34c759',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  useTipButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TipAmountScreen;