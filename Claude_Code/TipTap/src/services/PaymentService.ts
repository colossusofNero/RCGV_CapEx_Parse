import {Transaction} from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SecurityManager from '../security/SecurityManager';

const TRANSACTIONS_KEY = 'tiptap_transactions';

export class PaymentService {
  static async processPayment(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    try {
      // Generate unique transaction ID
      const transactionId = `${transaction.method}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Security check: Authenticate payment with fraud detection and biometrics
      const securityCheck = await SecurityManager.authenticateForPayment(
        transactionId,
        transaction.amount,
        transaction.merchantId
      );

      if (!securityCheck.overallApproved) {
        let errorMessage = 'Payment authentication failed';

        if (!securityCheck.sessionValid) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (!securityCheck.fraudRiskAcceptable && securityCheck.riskScore) {
          errorMessage = `Payment blocked due to security risk: ${securityCheck.riskScore.reasons.join(', ')}`;
        } else if (!securityCheck.biometricsPassed) {
          errorMessage = 'Biometric authentication required for payment';
        }

        throw new Error(errorMessage);
      }

      // Additional authentication required for high-risk transactions
      if (securityCheck.requiresAdditionalAuth && securityCheck.riskScore) {
        console.warn('High-risk transaction detected:', securityCheck.riskScore.reasons);
        // In a real app, you might show additional verification steps here
      }

      // Update last activity for session management
      SecurityManager.updateLastActivity();

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const completedTransaction: Transaction = {
        ...transaction,
        id: transactionId,
        status: 'completed',
        riskScore: securityCheck.riskScore?.score,
        securityFlags: securityCheck.riskScore?.reasons
      };

      // Save transaction securely with encryption
      await this.saveTransactionSecurely(completedTransaction);

      return completedTransaction;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error instanceof Error ? error : new Error('Payment processing failed');
    }
  }

  static async saveTransactionSecurely(transaction: Transaction): Promise<void> {
    try {
      const existingTransactions = await this.getStoredTransactionsSecurely();
      const updatedTransactions = [transaction, ...existingTransactions];

      // Encrypt and store transaction data securely
      const deviceId = await this.getDeviceId();
      const success = await SecurityManager.storeSecureData(
        TRANSACTIONS_KEY,
        updatedTransactions,
        deviceId
      );

      if (!success) {
        throw new Error('Failed to store transaction securely');
      }
    } catch (error) {
      console.error('Failed to save transaction securely:', error);
      // Fallback to regular storage if secure storage fails
      await this.saveTransaction(transaction);
    }
  }

  static async saveTransaction(transaction: Transaction): Promise<void> {
    try {
      const existingTransactions = await this.getStoredTransactions();
      const updatedTransactions = [transaction, ...existingTransactions];

      await AsyncStorage.setItem(
        TRANSACTIONS_KEY,
        JSON.stringify(updatedTransactions)
      );
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  }

  static async getStoredTransactionsSecurely(): Promise<Transaction[]> {
    try {
      const deviceId = await this.getDeviceId();
      const transactions = await SecurityManager.retrieveSecureData<Transaction[]>(
        TRANSACTIONS_KEY,
        deviceId
      );

      return transactions || [];
    } catch (error) {
      console.error('Failed to get stored transactions securely:', error);
      // Fallback to regular storage
      return this.getStoredTransactions();
    }
  }

  static async getStoredTransactions(): Promise<Transaction[]> {
    try {
      const stored = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored transactions:', error);
      return [];
    }
  }

  static async validateTransactionLimits(
    amount: number,
    currentTransactions: Transaction[],
    limits: {daily: number; weekly: number; monthly: number}
  ): Promise<{valid: boolean; reason?: string}> {
    const now = new Date();

    // Calculate spending for different periods
    const dailySpent = this.getSpentInPeriod(currentTransactions, 'daily', now);
    const weeklySpent = this.getSpentInPeriod(currentTransactions, 'weekly', now);
    const monthlySpent = this.getSpentInPeriod(currentTransactions, 'monthly', now);

    if (dailySpent + amount > limits.daily) {
      return {
        valid: false,
        reason: `Daily limit exceeded. Remaining: $${(limits.daily - dailySpent).toFixed(2)}`,
      };
    }

    if (weeklySpent + amount > limits.weekly) {
      return {
        valid: false,
        reason: `Weekly limit exceeded. Remaining: $${(limits.weekly - weeklySpent).toFixed(2)}`,
      };
    }

    if (monthlySpent + amount > limits.monthly) {
      return {
        valid: false,
        reason: `Monthly limit exceeded. Remaining: $${(limits.monthly - monthlySpent).toFixed(2)}`,
      };
    }

    return {valid: true};
  }

  private static getSpentInPeriod(
    transactions: Transaction[],
    period: 'daily' | 'weekly' | 'monthly',
    referenceDate: Date
  ): number {
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          referenceDate.getDate()
        );
        break;
      case 'weekly':
        const dayOfWeek = referenceDate.getDay();
        startDate = new Date(referenceDate);
        startDate.setDate(referenceDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          1
        );
        break;
      default:
        startDate = new Date(
          referenceDate.getFullYear(),
          referenceDate.getMonth(),
          referenceDate.getDate()
        );
    }

    return transactions
      .filter(
        transaction =>
          transaction.status === 'completed' &&
          new Date(transaction.timestamp) >= startDate &&
          new Date(transaction.timestamp) <= referenceDate
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
  }

  static async clearTransactionHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TRANSACTIONS_KEY);
    } catch (error) {
      console.error('Failed to clear transaction history:', error);
    }
  }

  static async exportTransactions(): Promise<string> {
    try {
      const transactions = await this.getStoredTransactionsSecurely();

      // Remove sensitive security data from export
      const sanitizedTransactions = transactions.map(transaction => {
        const { riskScore, securityFlags, ...publicData } = transaction;
        return publicData;
      });

      return JSON.stringify(sanitizedTransactions, null, 2);
    } catch (error) {
      console.error('Failed to export transactions:', error);
      throw new Error('Export failed');
    }
  }

  private static async getDeviceId(): Promise<string> {
    try {
      const DeviceInfo = require('react-native-device-info');
      return await DeviceInfo.getUniqueId();
    } catch (error) {
      console.warn('Could not get device ID, using fallback');
      return 'fallback_device_id';
    }
  }
}