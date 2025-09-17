import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, FlatList } from 'react-native';
import PlaidService, { BankAccount, LinkTokenRequest } from '@/services/PlaidService';

interface PlaidPaymentProps {
  amount: number;
  currency: string;
  description?: string;
  userId: string;
  onPaymentSuccess: (paymentId: string, accountId: string) => void;
  onPaymentError: (error: string) => void;
  onPaymentCancel: () => void;
}

const PlaidPayment: React.FC<PlaidPaymentProps> = ({
  amount,
  currency,
  description,
  userId,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [linkingBank, setLinkingBank] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [sufficientBalance, setSufficientBalance] = useState<boolean>(true);

  const plaidService = PlaidService.getInstance();

  useEffect(() => {
    loadExistingAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      checkAccountBalance();
    }
  }, [selectedAccount, amount]);

  const loadExistingAccounts = async () => {
    try {
      // In a real implementation, you'd load accounts based on stored item IDs
      // For now, we'll show an empty state that prompts bank linking
      setBankAccounts([]);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    }
  };

  const checkAccountBalance = async () => {
    if (!selectedAccount) return;

    try {
      const hasBalance = await plaidService.checkSufficientBalance(
        selectedAccount.accountId,
        amount
      );
      setSufficientBalance(hasBalance);
    } catch (error) {
      console.error('Error checking balance:', error);
      setSufficientBalance(false);
    }
  };

  const linkBankAccount = async () => {
    try {
      setLinkingBank(true);

      const linkTokenRequest: LinkTokenRequest = {
        userId,
        clientName: 'TipTap',
        products: ['auth', 'transactions'],
        countryCodes: ['US'],
        language: 'en',
      };

      // Create link token
      const linkTokenResponse = await plaidService.createLinkToken(linkTokenRequest);

      // Open Plaid Link
      const linkSuccess = await plaidService.openPlaidLink(linkTokenResponse.linkToken);

      // Exchange public token for access token
      const exchangeResult = await plaidService.exchangePublicToken({
        publicToken: linkSuccess.public_token,
        institutionId: linkSuccess.metadata.institution?.institution_id || '',
        institutionName: linkSuccess.metadata.institution?.name || 'Unknown Bank',
      });

      // Get bank accounts
      const accounts = await plaidService.getBankAccounts(exchangeResult.itemId);
      setBankAccounts(accounts);

      if (accounts.length > 0) {
        setSelectedAccount(accounts[0]); // Auto-select first account
      }

    } catch (error: any) {
      onPaymentError(error.message || 'Failed to link bank account');
    } finally {
      setLinkingBank(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedAccount) {
      Alert.alert('Error', 'Please select a bank account');
      return;
    }

    if (!sufficientBalance) {
      Alert.alert('Error', 'Insufficient funds in the selected account');
      return;
    }

    try {
      setLoading(true);

      // Generate idempotency key
      const idempotencyKey = `ach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Initiate ACH payment
      const paymentResult = await plaidService.initiateACHPayment({
        accountId: selectedAccount.accountId,
        amount,
        currency,
        description,
      }, idempotencyKey);

      if (paymentResult.success) {
        onPaymentSuccess(paymentResult.paymentId || '', selectedAccount.accountId);
      } else {
        onPaymentError(paymentResult.error || 'ACH payment failed');
      }

    } catch (error: any) {
      onPaymentError(error.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const renderBankAccount = ({ item }: { item: BankAccount }) => (
    <TouchableOpacity
      style={[
        styles.accountItem,
        selectedAccount?.accountId === item.accountId && styles.accountItemSelected
      ]}
      onPress={() => setSelectedAccount(item)}
    >
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{item.accountName}</Text>
        <Text style={styles.institutionName}>{item.institutionName}</Text>
        <Text style={styles.accountDetails}>
          {item.accountType.charAt(0).toUpperCase() + item.accountType.slice(1)} •••• {item.mask}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (bankAccounts.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Bank Payment</Text>
        <Text style={styles.amount}>
          {currency.toUpperCase()} {(amount / 100).toFixed(2)}
        </Text>

        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Connect your bank account to pay with ACH transfer
          </Text>

          <TouchableOpacity
            style={[styles.linkButton, linkingBank && styles.linkButtonDisabled]}
            onPress={linkBankAccount}
            disabled={linkingBank}
          >
            <Text style={styles.linkButtonText}>
              {linkingBank ? 'Connecting...' : 'Connect Bank Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={onPaymentCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bank Payment</Text>
      <Text style={styles.amount}>
        {currency.toUpperCase()} {(amount / 100).toFixed(2)}
      </Text>

      <View style={styles.accountsSection}>
        <Text style={styles.sectionTitle}>Select Account</Text>
        <FlatList
          data={bankAccounts}
          renderItem={renderBankAccount}
          keyExtractor={(item) => item.accountId}
          style={styles.accountsList}
        />
      </View>

      {selectedAccount && !sufficientBalance && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Insufficient funds in selected account
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.payButton,
          (!selectedAccount || !sufficientBalance || loading) && styles.payButtonDisabled
        ]}
        onPress={handlePayment}
        disabled={!selectedAccount || !sufficientBalance || loading}
      >
        <Text style={styles.payButtonText}>
          {loading ? 'Processing...' : `Pay ${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.addAccountButton}
        onPress={linkBankAccount}
        disabled={linkingBank}
      >
        <Text style={styles.addAccountButtonText}>
          {linkingBank ? 'Connecting...' : '+ Add Another Account'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={onPaymentCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#007AFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  linkButton: {
    backgroundColor: '#00D924',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  linkButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  linkButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  accountsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  accountsList: {
    maxHeight: 200,
  },
  accountItem: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 10,
  },
  accountItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  accountInfo: {},
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  institutionName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  accountDetails: {
    fontSize: 12,
    color: '#999',
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  warningText: {
    color: '#856404',
    textAlign: 'center',
    fontSize: 14,
  },
  payButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  payButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  payButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addAccountButton: {
    paddingVertical: 15,
    marginBottom: 10,
  },
  addAccountButtonText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 15,
  },
  cancelButtonText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default PlaidPayment;