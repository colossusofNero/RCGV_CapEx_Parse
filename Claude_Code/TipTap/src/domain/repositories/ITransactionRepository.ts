import { Transaction } from '../entities/Transaction';

export interface ITransactionRepository {
  create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  findByMerchantId(merchantId: string, limit?: number, offset?: number): Promise<Transaction[]>;
  findByCustomerId(customerId: string, limit?: number, offset?: number): Promise<Transaction[]>;
  update(id: string, updates: Partial<Transaction>): Promise<Transaction | null>;
  delete(id: string): Promise<boolean>;
  findByDateRange(startDate: Date, endDate: Date, merchantId?: string): Promise<Transaction[]>;
  getTotalAmountByMerchant(merchantId: string, startDate?: Date, endDate?: Date): Promise<number>;
}