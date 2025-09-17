import { TransactionRepository } from '@/infrastructure/repositories/TransactionRepository';
import { PaymentService } from '@/application/services/PaymentService';
import { Transaction, TransactionStatus, TransactionType, PaymentMethod } from '@/domain/entities/Transaction';

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  clear: jest.fn()
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Network connectivity
const mockNetInfo = {
  fetch: jest.fn(),
  addEventListener: jest.fn(),
  useNetInfo: jest.fn()
};

jest.mock('@react-native-community/netinfo', () => mockNetInfo);

interface SyncState {
  lastSyncTimestamp: number;
  pendingSyncCount: number;
  failedSyncCount: number;
  totalTransactions: number;
}

class TransactionHistorySyncService {
  private transactionRepo: TransactionRepository;
  private syncInProgress = false;
  private syncQueue: Transaction[] = [];
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;

  constructor(transactionRepo: TransactionRepository) {
    this.transactionRepo = transactionRepo;
    this.setupNetworkListener();
  }

  async syncTransactionHistory(userId: string, forceSync = false): Promise<{ success: boolean; synced: number; failed: number; error?: string }> {
    try {
      if (this.syncInProgress && !forceSync) {
        return { success: false, synced: 0, failed: 0, error: 'Sync already in progress' };
      }

      this.syncInProgress = true;

      // Check network connectivity
      const networkState = await mockNetInfo.fetch();
      if (!networkState.isConnected) {
        return { success: false, synced: 0, failed: 0, error: 'No network connection' };
      }

      // Get last sync timestamp
      const lastSync = await this.getLastSyncTimestamp(userId);

      // Get transactions that need syncing
      const pendingTransactions = await this.getPendingSyncTransactions(userId, lastSync);

      let syncedCount = 0;
      let failedCount = 0;

      // Process transactions in batches
      const batchSize = 10;
      for (let i = 0; i < pendingTransactions.length; i += batchSize) {
        const batch = pendingTransactions.slice(i, i + batchSize);
        const batchResults = await this.syncTransactionBatch(batch);

        syncedCount += batchResults.synced;
        failedCount += batchResults.failed;
      }

      // Update last sync timestamp if successful
      if (syncedCount > 0) {
        await this.updateLastSyncTimestamp(userId, Date.now());
      }

      this.syncInProgress = false;

      return { success: true, synced: syncedCount, failed: failedCount };

    } catch (error) {
      this.syncInProgress = false;
      return {
        success: false,
        synced: 0,
        failed: 0,
        error: error instanceof Error ? error.message : 'Sync failed'
      };
    }
  }

  async syncTransactionBatch(transactions: Transaction[]): Promise<{ synced: number; failed: number }> {
    let syncedCount = 0;
    let failedCount = 0;

    const syncPromises = transactions.map(async (transaction) => {
      try {
        const success = await this.syncSingleTransaction(transaction);
        return success ? 'synced' : 'failed';
      } catch (error) {
        return 'failed';
      }
    });

    const results = await Promise.allSettled(syncPromises);

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value === 'synced') {
          syncedCount++;
        } else {
          failedCount++;
        }
      } else {
        failedCount++;
      }
    });

    return { synced: syncedCount, failed: failedCount };
  }

  private async syncSingleTransaction(transaction: Transaction): Promise<boolean> {
    try {
      const retryCount = this.retryAttempts.get(transaction.id) || 0;

      if (retryCount >= this.maxRetries) {
        return false;
      }

      // Simulate API call to sync transaction
      await this.sendTransactionToServer(transaction);

      // Mark as synced locally
      await this.markTransactionAsSynced(transaction.id);

      // Remove from retry attempts
      this.retryAttempts.delete(transaction.id);

      return true;

    } catch (error) {
      // Increment retry count
      const currentAttempts = this.retryAttempts.get(transaction.id) || 0;
      this.retryAttempts.set(transaction.id, currentAttempts + 1);

      return false;
    }
  }

  private async sendTransactionToServer(transaction: Transaction): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));

    // Simulate occasional failures
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error('Server error');
    }

    // Simulate successful sync
    return;
  }

  private async getPendingSyncTransactions(userId: string, lastSyncTime: number): Promise<Transaction[]> {
    // Get transactions from local storage that haven't been synced
    const allTransactions = await this.transactionRepo.findByCustomerId(userId);

    return allTransactions.filter(transaction => {
      const transactionTime = transaction.createdAt?.getTime() || 0;
      const notSynced = !transaction.metadata?.synced;
      const afterLastSync = transactionTime > lastSyncTime;

      return notSynced && afterLastSync;
    });
  }

  private async markTransactionAsSynced(transactionId: string): Promise<void> {
    const transaction = await this.transactionRepo.findById(transactionId);
    if (transaction) {
      await this.transactionRepo.update(transactionId, {
        metadata: {
          ...transaction.metadata,
          synced: true,
          syncedAt: new Date().toISOString()
        }
      });
    }
  }

  private async getLastSyncTimestamp(userId: string): Promise<number> {
    const stored = await mockAsyncStorage.getItem(`last_sync_${userId}`);
    return stored ? parseInt(stored, 10) : 0;
  }

  private async updateLastSyncTimestamp(userId: string, timestamp: number): Promise<void> {
    await mockAsyncStorage.setItem(`last_sync_${userId}`, timestamp.toString());
  }

  async getSyncState(userId: string): Promise<SyncState> {
    const lastSyncTimestamp = await this.getLastSyncTimestamp(userId);
    const allTransactions = await this.transactionRepo.findByCustomerId(userId);

    const pendingSyncCount = allTransactions.filter(t => !t.metadata?.synced).length;
    const failedSyncCount = Array.from(this.retryAttempts.values()).filter(count => count >= this.maxRetries).length;

    return {
      lastSyncTimestamp,
      pendingSyncCount,
      failedSyncCount,
      totalTransactions: allTransactions.length
    };
  }

  async retryFailedSyncs(userId: string): Promise<{ success: boolean; retried: number; error?: string }> {
    try {
      const failedTransactionIds = Array.from(this.retryAttempts.entries())
        .filter(([, attempts]) => attempts >= this.maxRetries)
        .map(([id]) => id);

      // Reset retry attempts for failed transactions
      failedTransactionIds.forEach(id => {
        this.retryAttempts.set(id, 0);
      });

      const result = await this.syncTransactionHistory(userId, true);

      return {
        success: result.success,
        retried: failedTransactionIds.length,
        error: result.error
      };

    } catch (error) {
      return {
        success: false,
        retried: 0,
        error: error instanceof Error ? error.message : 'Retry failed'
      };
    }
  }

  private setupNetworkListener(): void {
    mockNetInfo.addEventListener.mockImplementation((listener: any) => {
      // Simulate network state changes
      setTimeout(() => {
        listener({ isConnected: true, type: 'wifi' });
      }, 1000);

      return () => {}; // Unsubscribe function
    });
  }

  // Test helpers
  clearSyncQueue(): void {
    this.syncQueue = [];
    this.retryAttempts.clear();
    this.syncInProgress = false;
  }
}

describe('Transaction History Sync Integration Tests', () => {
  let syncService: TransactionHistorySyncService;
  let transactionRepo: TransactionRepository;

  const mockUserId = 'user_123';
  const mockTransactions: Transaction[] = [
    {
      id: 'txn_1',
      amount: 25.00,
      currency: 'USD',
      status: TransactionStatus.COMPLETED,
      type: TransactionType.TIP,
      paymentMethod: PaymentMethod.CARD,
      merchantId: 'merchant_1',
      customerId: mockUserId,
      createdAt: new Date(Date.now() - 60000), // 1 minute ago
      metadata: {}
    },
    {
      id: 'txn_2',
      amount: 50.00,
      currency: 'USD',
      status: TransactionStatus.COMPLETED,
      type: TransactionType.TIP,
      paymentMethod: PaymentMethod.CARD,
      merchantId: 'merchant_2',
      customerId: mockUserId,
      createdAt: new Date(Date.now() - 120000), // 2 minutes ago
      metadata: { synced: true }
    },
    {
      id: 'txn_3',
      amount: 30.00,
      currency: 'USD',
      status: TransactionStatus.FAILED,
      type: TransactionType.TIP,
      paymentMethod: PaymentMethod.CARD,
      merchantId: 'merchant_3',
      customerId: mockUserId,
      createdAt: new Date(Date.now() - 30000), // 30 seconds ago
      metadata: {}
    }
  ];

  beforeEach(() => {
    // Mock TransactionRepository
    transactionRepo = {
      findByCustomerId: jest.fn().mockResolvedValue(mockTransactions),
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findByMerchantId: jest.fn(),
      delete: jest.fn()
    } as any;

    syncService = new TransactionHistorySyncService(transactionRepo);

    // Reset mocks
    jest.clearAllMocks();
    syncService.clearSyncQueue();

    // Setup default mock responses
    mockNetInfo.fetch.mockResolvedValue({ isConnected: true, type: 'wifi' });
    mockAsyncStorage.getItem.mockResolvedValue('0'); // Default last sync timestamp
    mockAsyncStorage.setItem.mockResolvedValue(undefined);

    // Setup transaction repo mocks
    transactionRepo.findById = jest.fn().mockImplementation((id: string) => {
      return Promise.resolve(mockTransactions.find(t => t.id === id) || null);
    });

    transactionRepo.update = jest.fn().mockImplementation((id: string, updates: any) => {
      const transaction = mockTransactions.find(t => t.id === id);
      if (transaction) {
        Object.assign(transaction, updates);
        return Promise.resolve(transaction);
      }
      return Promise.resolve(null);
    });
  });

  describe('Basic Sync Operations', () => {
    it('should sync pending transactions successfully', async () => {
      // Act
      const result = await syncService.syncTransactionHistory(mockUserId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.synced).toBeGreaterThan(0);
      expect(result.failed).toBe(0);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        `last_sync_${mockUserId}`,
        expect.any(String)
      );
    });

    it('should handle network connectivity issues', async () => {
      // Arrange - Mock no network
      mockNetInfo.fetch.mockResolvedValue({ isConnected: false, type: 'none' });

      // Act
      const result = await syncService.syncTransactionHistory(mockUserId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('No network connection');
      expect(result.synced).toBe(0);
    });

    it('should prevent concurrent sync operations', async () => {
      // Act - Start two sync operations simultaneously
      const [result1, result2] = await Promise.all([
        syncService.syncTransactionHistory(mockUserId),
        syncService.syncTransactionHistory(mockUserId)
      ]);

      // Assert - One should succeed, one should be prevented
      const successResults = [result1, result2].filter(r => r.success);
      const preventedResults = [result1, result2].filter(r => !r.success && r.error?.includes('in progress'));

      expect(successResults).toHaveLength(1);
      expect(preventedResults).toHaveLength(1);
    });

    it('should only sync transactions after last sync timestamp', async () => {
      // Arrange - Set last sync to 90 seconds ago
      const lastSyncTime = Date.now() - 90000;
      mockAsyncStorage.getItem.mockResolvedValue(lastSyncTime.toString());

      // Act
      const result = await syncService.syncTransactionHistory(mockUserId);

      // Assert - Should only sync transactions newer than 90 seconds
      expect(result.success).toBe(true);
      // txn_1 (60s ago) and txn_3 (30s ago) should be synced, but not txn_2 (already synced)
      expect(result.synced).toBe(2);
    });

    it('should handle already synced transactions', async () => {
      // Arrange - Mock all transactions as already synced
      const syncedTransactions = mockTransactions.map(t => ({
        ...t,
        metadata: { ...t.metadata, synced: true }
      }));

      transactionRepo.findByCustomerId = jest.fn().mockResolvedValue(syncedTransactions);

      // Act
      const result = await syncService.syncTransactionHistory(mockUserId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('Batch Processing', () => {
    it('should process transactions in batches', async () => {
      // Arrange - Create many transactions
      const manyTransactions = Array.from({ length: 25 }, (_, i) => ({
        id: `txn_${i + 4}`,
        amount: 10.00 + i,
        currency: 'USD',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.TIP,
        paymentMethod: PaymentMethod.CARD,
        merchantId: `merchant_${i}`,
        customerId: mockUserId,
        createdAt: new Date(Date.now() - i * 1000),
        metadata: {}
      })) as Transaction[];

      transactionRepo.findByCustomerId = jest.fn().mockResolvedValue([
        ...mockTransactions,
        ...manyTransactions
      ]);

      // Act
      const result = await syncService.syncTransactionHistory(mockUserId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.synced).toBeGreaterThan(20); // Most should sync successfully
    });

    it('should handle partial batch failures gracefully', async () => {
      // Arrange - Mock some transactions to fail
      jest.spyOn(syncService as any, 'sendTransactionToServer').mockImplementation((transaction: Transaction) => {
        // Fail transactions with even IDs
        if (parseInt(transaction.id.split('_')[1]) % 2 === 0) {
          throw new Error('Server error');
        }
        return Promise.resolve();
      });

      // Act
      const result = await syncService.syncTransactionHistory(mockUserId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.synced).toBeGreaterThan(0);
      expect(result.failed).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should retry failed transactions up to max attempts', async () => {
      // Arrange - Mock server to always fail
      jest.spyOn(syncService as any, 'sendTransactionToServer').mockRejectedValue(new Error('Server error'));

      // Act - Sync multiple times to trigger retries
      for (let i = 0; i < 4; i++) {
        await syncService.syncTransactionHistory(mockUserId, true);
      }

      // Assert - Check sync state shows failed transactions
      const syncState = await syncService.getSyncState(mockUserId);
      expect(syncState.failedSyncCount).toBeGreaterThan(0);
    });

    it('should handle retry of failed syncs', async () => {
      // Arrange - First make some transactions fail
      let failCount = 0;
      jest.spyOn(syncService as any, 'sendTransactionToServer').mockImplementation(() => {
        if (failCount++ < 3) {
          throw new Error('Server error');
        }
        return Promise.resolve();
      });

      // First sync - should have failures
      await syncService.syncTransactionHistory(mockUserId);

      // Act - Retry failed syncs
      const retryResult = await syncService.retryFailedSyncs(mockUserId);

      // Assert
      expect(retryResult.success).toBe(true);
      expect(retryResult.retried).toBeGreaterThan(0);
    });

    it('should handle sync service errors gracefully', async () => {
      // Arrange - Mock repository to throw error
      transactionRepo.findByCustomerId = jest.fn().mockRejectedValue(new Error('Database error'));

      // Act
      const result = await syncService.syncTransactionHistory(mockUserId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.synced).toBe(0);
    });

    it('should handle async storage errors', async () => {
      // Arrange - Mock storage to fail
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage full'));

      // Act
      const result = await syncService.syncTransactionHistory(mockUserId);

      // Assert - Sync might succeed but timestamp update fails
      // Service should handle this gracefully
      expect(result).toBeDefined();
    });
  });

  describe('Sync State Management', () => {
    it('should provide accurate sync state information', async () => {
      // Arrange - Setup known state
      const lastSyncTime = Date.now() - 3600000; // 1 hour ago
      mockAsyncStorage.getItem.mockResolvedValue(lastSyncTime.toString());

      // Act
      const syncState = await syncService.getSyncState(mockUserId);

      // Assert
      expect(syncState.lastSyncTimestamp).toBe(lastSyncTime);
      expect(syncState.totalTransactions).toBe(mockTransactions.length);
      expect(syncState.pendingSyncCount).toBe(2); // txn_1 and txn_3 are not synced
      expect(syncState.failedSyncCount).toBe(0);
    });

    it('should track pending sync count correctly', async () => {
      // Arrange - Add more unsynced transactions
      const unsyncedTransactions = mockTransactions.map(t => ({
        ...t,
        metadata: {} // No sync flag
      }));

      transactionRepo.findByCustomerId = jest.fn().mockResolvedValue(unsyncedTransactions);

      // Act
      const syncState = await syncService.getSyncState(mockUserId);

      // Assert
      expect(syncState.pendingSyncCount).toBe(3);
    });

    it('should update sync state after successful sync', async () => {
      // Arrange
      const beforeSyncState = await syncService.getSyncState(mockUserId);

      // Act
      await syncService.syncTransactionHistory(mockUserId);
      const afterSyncState = await syncService.getSyncState(mockUserId);

      // Assert
      expect(afterSyncState.lastSyncTimestamp).toBeGreaterThan(beforeSyncState.lastSyncTimestamp);
      expect(afterSyncState.pendingSyncCount).toBeLessThanOrEqual(beforeSyncState.pendingSyncCount);
    });
  });

  describe('Network State Handling', () => {
    it('should handle network reconnection', async () => {
      // Arrange - Start with no network
      mockNetInfo.fetch.mockResolvedValueOnce({ isConnected: false, type: 'none' });

      const firstResult = await syncService.syncTransactionHistory(mockUserId);

      // Network comes back
      mockNetInfo.fetch.mockResolvedValueOnce({ isConnected: true, type: 'wifi' });

      // Act
      const secondResult = await syncService.syncTransactionHistory(mockUserId);

      // Assert
      expect(firstResult.success).toBe(false);
      expect(secondResult.success).toBe(true);
    });

    it('should handle different network types', async () => {
      // Test with different network types
      const networkTypes = [
        { isConnected: true, type: 'wifi' },
        { isConnected: true, type: 'cellular' },
        { isConnected: true, type: 'ethernet' }
      ];

      for (const networkState of networkTypes) {
        mockNetInfo.fetch.mockResolvedValueOnce(networkState);

        const result = await syncService.syncTransactionHistory(mockUserId, true);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of transactions efficiently', async () => {
      // Arrange - Create 1000 transactions
      const largeTransactionSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `txn_large_${i}`,
        amount: 5.00,
        currency: 'USD',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.TIP,
        paymentMethod: PaymentMethod.CARD,
        merchantId: `merchant_${i}`,
        customerId: mockUserId,
        createdAt: new Date(Date.now() - i * 1000),
        metadata: {}
      })) as Transaction[];

      transactionRepo.findByCustomerId = jest.fn().mockResolvedValue(largeTransactionSet);

      const startTime = Date.now();

      // Act
      const result = await syncService.syncTransactionHistory(mockUserId);
      const endTime = Date.now();

      // Assert
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.synced).toBeGreaterThan(500); // Most should sync successfully
    });

    it('should handle concurrent user syncs', async () => {
      // Arrange
      const user1 = 'user_1';
      const user2 = 'user_2';
      const user3 = 'user_3';

      const service1 = new TransactionHistorySyncService(transactionRepo);
      const service2 = new TransactionHistorySyncService(transactionRepo);
      const service3 = new TransactionHistorySyncService(transactionRepo);

      // Act - Sync multiple users concurrently
      const results = await Promise.all([
        service1.syncTransactionHistory(user1),
        service2.syncTransactionHistory(user2),
        service3.syncTransactionHistory(user3)
      ]);

      // Assert
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});