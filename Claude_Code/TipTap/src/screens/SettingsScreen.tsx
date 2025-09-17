import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAppContext} from '@/context/AppContext';
import {useTipLimits} from '@/hooks/useTipLimits';

const SettingsScreen = () => {
  const {state, dispatch} = useAppContext();
  const {getLimitStatus} = useTipLimits();
  const [editingLimits, setEditingLimits] = useState(false);
  const [tempLimits, setTempLimits] = useState({
    daily: state.settings.dailyLimit.toString(),
    weekly: state.settings.weeklyLimit.toString(),
    monthly: state.settings.monthlyLimit.toString(),
  });

  const limitStatus = getLimitStatus();

  const saveLimits = () => {
    const dailyLimit = parseFloat(tempLimits.daily) || 0;
    const weeklyLimit = parseFloat(tempLimits.weekly) || 0;
    const monthlyLimit = parseFloat(tempLimits.monthly) || 0;

    if (dailyLimit <= 0 || weeklyLimit <= 0 || monthlyLimit <= 0) {
      Alert.alert('Invalid Limits', 'All limits must be greater than 0');
      return;
    }

    if (dailyLimit > weeklyLimit || weeklyLimit > monthlyLimit) {
      Alert.alert(
        'Invalid Limits',
        'Monthly limit must be ≥ weekly limit ≥ daily limit'
      );
      return;
    }

    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        dailyLimit,
        weeklyLimit,
        monthlyLimit,
      },
    });

    setEditingLimits(false);
    Alert.alert('Settings Saved', 'Your transaction limits have been updated');
  };

  const cancelEdit = () => {
    setTempLimits({
      daily: state.settings.dailyLimit.toString(),
      weekly: state.settings.weeklyLimit.toString(),
      monthly: state.settings.monthlyLimit.toString(),
    });
    setEditingLimits(false);
  };

  const updateQuickAmount = (index: number, value: string) => {
    const amount = parseFloat(value) || 0;
    const newQuickAmounts = [...state.settings.quickTipAmounts];
    newQuickAmounts[index] = amount;

    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {quickTipAmounts: newQuickAmounts},
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Transaction Limits Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction Limits</Text>
            <TouchableOpacity
              onPress={() => setEditingLimits(!editingLimits)}
              style={styles.editButton}>
              <Icon
                name={editingLimits ? 'close' : 'edit'}
                size={20}
                color="#007AFF"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.limitsContainer}>
            {/* Daily Limit */}
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Daily Limit</Text>
              {editingLimits ? (
                <TextInput
                  style={styles.limitInput}
                  value={tempLimits.daily}
                  onChangeText={(text) =>
                    setTempLimits({...tempLimits, daily: text})
                  }
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              ) : (
                <View style={styles.limitInfo}>
                  <Text style={styles.limitValue}>
                    ${state.settings.dailyLimit}
                  </Text>
                  <Text style={styles.limitUsed}>
                    Used: ${limitStatus.daily.spent.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            {/* Weekly Limit */}
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Weekly Limit</Text>
              {editingLimits ? (
                <TextInput
                  style={styles.limitInput}
                  value={tempLimits.weekly}
                  onChangeText={(text) =>
                    setTempLimits({...tempLimits, weekly: text})
                  }
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              ) : (
                <View style={styles.limitInfo}>
                  <Text style={styles.limitValue}>
                    ${state.settings.weeklyLimit}
                  </Text>
                  <Text style={styles.limitUsed}>
                    Used: ${limitStatus.weekly.spent.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            {/* Monthly Limit */}
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Monthly Limit</Text>
              {editingLimits ? (
                <TextInput
                  style={styles.limitInput}
                  value={tempLimits.monthly}
                  onChangeText={(text) =>
                    setTempLimits({...tempLimits, monthly: text})
                  }
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              ) : (
                <View style={styles.limitInfo}>
                  <Text style={styles.limitValue}>
                    ${state.settings.monthlyLimit}
                  </Text>
                  <Text style={styles.limitUsed}>
                    Used: ${limitStatus.monthly.spent.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {editingLimits && (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveLimits}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Tip Amounts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tip Amounts</Text>
          <View style={styles.quickAmountsContainer}>
            {state.settings.quickTipAmounts.map((amount, index) => (
              <View key={index} style={styles.quickAmountRow}>
                <Text style={styles.quickAmountLabel}>Amount {index + 1}</Text>
                <TextInput
                  style={styles.quickAmountInput}
                  value={amount.toString()}
                  onChangeText={(text) => updateQuickAmount(index, text)}
                  keyboardType="numeric"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Currency Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency</Text>
          <View style={styles.currencyRow}>
            <Text style={styles.currencyLabel}>Current Currency</Text>
            <Text style={styles.currencyValue}>{state.settings.currency}</Text>
          </View>
        </View>

        {/* Usage Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Transactions</Text>
              <Text style={styles.statValue}>{state.transactions.length}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>This Month</Text>
              <Text style={styles.statValue}>
                ${limitStatus.monthly.spent.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    padding: 4,
  },
  limitsContainer: {
    gap: 16,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  limitInfo: {
    alignItems: 'flex-end',
  },
  limitValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  limitUsed: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  limitInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minWidth: 100,
    textAlign: 'right',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  quickAmountsContainer: {
    gap: 12,
  },
  quickAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickAmountLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  quickAmountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minWidth: 80,
    textAlign: 'right',
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currencyLabel: {
    fontSize: 16,
    color: '#333',
  },
  currencyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statsContainer: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    color: '#333',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default SettingsScreen;