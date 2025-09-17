import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RootStackParamList, BankAccount} from '@/types';

type AccountSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AccountSelection'
>;

type AccountSelectionScreenRouteProp = RouteProp<
  RootStackParamList,
  'AccountSelection'
>;

interface Props {
  navigation: AccountSelectionScreenNavigationProp;
  route: AccountSelectionScreenRouteProp;
}

const AccountSelectionScreen: React.FC<Props> = ({navigation, route}) => {
  const {accounts} = route.params;
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  const handleContinue = () => {
    if (!selectedAccountId) {
      Alert.alert('Error', 'Please select an account');
      return;
    }

    // TODO: Save selected account
    navigation.navigate('PhoneVerification');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(balance);
  };

  const renderAccountItem = (account: BankAccount) => (
    <TouchableOpacity
      key={account.id}
      style={styles.accountItem}
      onPress={() => handleAccountSelect(account.id)}
    >
      <View style={styles.radioContainer}>
        <View style={styles.radioOuter}>
          {selectedAccountId === account.id && (
            <View style={styles.radioInner} />
          )}
        </View>
      </View>

      <View style={styles.accountInfo}>
        <View style={styles.accountHeader}>
          <Text style={styles.accountType}>
            {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}
          </Text>
        </View>
        <Text style={styles.accountNumber}>
          {account.bankName} {account.accountNumberMasked}
        </Text>
        <Text style={styles.accountBalance}>
          Balance: {account.balance ? formatBalance(account.balance) : 'N/A'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Account</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.questionContainer}>
          <Text style={styles.question}>Which account for</Text>
          <Text style={styles.question}>payments?</Text>
        </View>

        <View style={styles.accountsList}>
          {accounts.map(renderAccountItem)}
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedAccountId && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedAccountId}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  questionContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  accountsList: {
    flex: 1,
    marginBottom: 40,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  radioContainer: {
    marginRight: 16,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  accountInfo: {
    flex: 1,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  accountNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '500',
    color: '#10b981',
  },
  continueButton: {
    height: 56,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default AccountSelectionScreen;