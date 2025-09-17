import AsyncStorage from '@react-native-async-storage/async-storage';
import { ITransactionRepository } from '@/domain/repositories/ITransactionRepository';
import { Transaction } from '@/domain/entities/Transaction';

export class TransactionRepository implements ITransactionRepository {
  private readonly STORAGE_KEY = '@tiptap_transactions';
  private readonly MERCHANT_INDEX_KEY = '@tiptap_merchant_index';

  async create(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const id = this.generateId();
      const now = new Date();

      const transaction: Transaction = {
        ...transactionData,
        id,
        createdAt: now,
        updatedAt: now
      };

      const transactions = await this.getAllTransactions();
      transactions.push(transaction);

      await this.saveTransactions(transactions);
      await this.updateMerchantIndex(transaction.merchantId, id);

      return transaction;
    } catch (error: any) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }

  async findById(id: string): Promise<Transaction | null> {
    try {
      const transactions = await this.getAllTransactions();
      return transactions.find(t => t.id === id) || null;
    } catch (error: any) {
      throw new Error(`Failed to find transaction by ID: ${error.message}`);
    }
  }

  async findByMerchantId(merchantId: string, limit: number = 50, offset: number = 0): Promise<Transaction[]> {
    try {
      const transactions = await this.getAllTransactions();
      const merchantTransactions = transactions
        .filter(t => t.merchantId === merchantId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(offset, offset + limit);

      return merchantTransactions;
    } catch (error: any) {
      throw new Error(`Failed to find transactions by merchant ID: ${error.message}`);
    }
  }

  async findByCustomerId(customerId: string, limit: number = 50, offset: number = 0): Promise<Transaction[]> {
    try {
      const transactions = await this.getAllTransactions();
      const customerTransactions = transactions
        .filter(t => t.customerId === customerId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(offset, offset + limit);

      return customerTransactions;
    } catch (error: any) {
      throw new Error(`Failed to find transactions by customer ID: ${error.message}`);
    }
  }

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    try {
      const transactions = await this.getAllTransactions();
      const index = transactions.findIndex(t => t.id === id);

      if (index === -1) {
        return null;
      }

      const updatedTransaction = {
        ...transactions[index],
        ...updates,
        updatedAt: new Date()
      };

      transactions[index] = updatedTransaction;
      await this.saveTransactions(transactions);

      return updatedTransaction;
    } catch (error: any) {
      throw new Error(`Failed to update transaction: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const transactions = await this.getAllTransactions();
      const initialLength = transactions.length;
      const filteredTransactions = transactions.filter(t => t.id !== id);

      if (filteredTransactions.length === initialLength) {
        return false;
      }

      await this.saveTransactions(filteredTransactions);
      return true;
    } catch (error: any) {
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }
  }

  async findByDateRange(startDate: Date, endDate: Date, merchantId?: string): Promise<Transaction[]> {
    try {
      const transactions = await this.getAllTransactions();
      return transactions.filter(t => {
        const withinDateRange = t.createdAt >= startDate && t.createdAt <= endDate;
        const matchesMerchant = !merchantId || t.merchantId === merchantId;
        return withinDateRange && matchesMerchant;
      });
    } catch (error: any) {
      throw new Error(`Failed to find transactions by date range: ${error.message}`);
    }
  }

  async getTotalAmountByMerchant(merchantId: string, startDate?: Date, endDate?: Date): Promise<number> {
    try {
      const transactions = await this.getAllTransactions();
      return transactions
        .filter(t => {
          const matchesMerchant = t.merchantId === merchantId;
          const withinDateRange = !startDate || !endDate ||
            (t.createdAt >= startDate && t.createdAt <= endDate);
          return matchesMerchant && withinDateRange && t.status === 'completed';
        })
        .reduce((total, t) => total + t.amount, 0);
    } catch (error: any) {
      throw new Error(`Failed to get total amount by merchant: ${error.message}`);
    }
  }

  private async getAllTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);
      return parsed.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        processedAt: t.processedAt ? new Date(t.processedAt) : undefined
      }));
    } catch (error) {
      return [];
    }
  }

  private async saveTransactions(transactions: Transaction[]): Promise<void> {
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
  }

  private async updateMerchantIndex(merchantId: string, transactionId: string): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem(this.MERCHANT_INDEX_KEY);
      const index = indexData ? JSON.parse(indexData) : {};

      if (!index[merchantId]) {
        index[merchantId] = [];
      }

      index[merchantId].unshift(transactionId);

      // Keep only the last 1000 transactions per merchant
      if (index[merchantId].length > 1000) {
        index[merchantId] = index[merchantId].slice(0, 1000);
      }

      await AsyncStorage.setItem(this.MERCHANT_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      // Index update failure shouldn't break the main operation
      console.warn('Failed to update merchant index:', error);
    }
  }

  private generateId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}