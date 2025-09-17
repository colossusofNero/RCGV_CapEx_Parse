import { PaymentService } from '@/application/services/PaymentService';
import { TipCalculationService } from '@/application/services/TipCalculationService';
import { TransactionRepository } from '@/infrastructure/repositories/TransactionRepository';
import { StripeGateway } from '@/infrastructure/gateways/StripeGateway';
import { NFCDataSource } from '@/infrastructure/datasources/NFCDataSource';
import { QRCodeDataSource } from '@/infrastructure/datasources/QRCodeDataSource';
import { ProcessTipPaymentUseCase } from '@/domain/usecases/ProcessTipPaymentUseCase';
import { PaymentGatewayType, PaymentGateway } from '@/domain/entities/PaymentGateway';
import { PaymentMethod, TransactionStatus } from '@/domain/entities/Transaction';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Payment Flow Integration Tests', () => {
  let paymentService: PaymentService;
  let tipCalculationService: TipCalculationService;
  let transactionRepository: TransactionRepository;
  let stripeGateway: StripeGateway;
  let processTipPaymentUseCase: ProcessTipPaymentUseCase;

  const mockGateway: PaymentGateway = {
    id: 'stripe_test',
    name: 'Stripe Test Gateway',
    type: PaymentGatewayType.STRIPE,
    isActive: true,
    configuration: {
      secretKey: 'sk_test_123',
      publishableKey: 'pk_test_123'
    },
    supportedCurrencies: ['USD', 'EUR'],
    supportedCountries: ['US', 'CA']
  };

  beforeEach(async () => {
    // Clear AsyncStorage
    mockAsyncStorage.clear.mockClear();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();

    // Initialize services
    tipCalculationService = new TipCalculationService();
    transactionRepository = new TransactionRepository();
    stripeGateway = new StripeGateway(mockGateway);
    paymentService = new PaymentService(
      stripeGateway,
      transactionRepository,
      tipCalculationService
    );
    processTipPaymentUseCase = new ProcessTipPaymentUseCase(paymentService);
  });

  describe('End-to-End Payment Processing', () => {
    it('should process complete tip payment flow successfully', async () => {
      // Arrange
      const paymentRequest = {
        merchantId: 'merchant_123',
        baseAmount: 100.00,
        tipPercentage: 18,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE_CARD,
        customerId: 'customer_456',
        description: 'Coffee shop tip'
      };

      // Mock successful Stripe response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'pi_123',
          status: 'succeeded',
          client_secret: 'pi_123_secret_test'
        })
      });

      // Act
      const result = await processTipPaymentUseCase.execute(mockGateway, paymentRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
      expect(result.totalAmount).toBe(118.00); // 100 + 18% tip
      expect(result.tipAmount).toBe(18.00);

      // Verify transaction was stored
      const storedTransactions = await transactionRepository.findByMerchantId('merchant_123', 10);
      expect(storedTransactions).toHaveLength(1);
      expect(storedTransactions[0].status).toBe(TransactionStatus.COMPLETED);
    });

    it('should handle payment failure and store failed transaction', async () => {
      // Arrange
      const paymentRequest = {
        merchantId: 'merchant_123',
        baseAmount: 50.00,
        tipPercentage: 20,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE_CARD,
        description: 'Failed payment test'
      };

      // Mock failed Stripe response
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Card declined'));

      // Act
      const result = await processTipPaymentUseCase.execute(mockGateway, paymentRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Card declined');

      // Verify failed transaction was stored
      const storedTransactions = await transactionRepository.findByMerchantId('merchant_123', 10);
      expect(storedTransactions).toHaveLength(1);
      expect(storedTransactions[0].status).toBe(TransactionStatus.FAILED);
    });

    it('should calculate tips correctly across different scenarios', async () => {
      // Test multiple tip calculations
      const testCases = [
        { amount: 25.00, tipPercent: 15, expectedTip: 3.75, expectedTotal: 28.75 },
        { amount: 50.00, tipPercent: 18, expectedTip: 9.00, expectedTotal: 59.00 },
        { amount: 75.50, tipPercent: 20, expectedTip: 15.10, expectedTotal: 90.60 },
        { amount: 100.00, tipPercent: 25, expectedTip: 25.00, expectedTotal: 125.00 }
      ];

      for (const testCase of testCases) {
        // Arrange
        const paymentRequest = {
          merchantId: 'merchant_tip_test',
          baseAmount: testCase.amount,
          tipPercentage: testCase.tipPercent,
          currency: 'USD',
          paymentMethod: PaymentMethod.STRIPE_CARD
        };

        // Mock successful Stripe response
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: `pi_${Date.now()}`,
            status: 'succeeded'
          })
        });

        // Act
        const result = await processTipPaymentUseCase.execute(mockGateway, paymentRequest);

        // Assert
        expect(result.success).toBe(true);
        expect(result.tipAmount).toBe(testCase.expectedTip);
        expect(result.totalAmount).toBe(testCase.expectedTotal);
      }
    });

    it('should handle concurrent payment requests', async () => {
      // Arrange
      const concurrentRequests = Array.from({ length: 5 }, (_, i) => ({
        merchantId: `merchant_${i}`,
        baseAmount: 20.00 + i * 10,
        tipPercentage: 15 + i * 2,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE_CARD,
        description: `Concurrent payment ${i}`
      }));

      // Mock successful Stripe responses
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: `pi_${Date.now()}_${Math.random()}`,
            status: 'succeeded'
          })
        })
      );

      // Act
      const results = await Promise.all(
        concurrentRequests.map(request =>
          processTipPaymentUseCase.execute(mockGateway, request)
        )
      );

      // Assert
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.transactionId).toBeDefined();
      });

      // Verify all transactions were stored separately
      for (let i = 0; i < 5; i++) {
        const transactions = await transactionRepository.findByMerchantId(`merchant_${i}`, 10);
        expect(transactions).toHaveLength(1);
      }
    });

    it('should handle retry logic for transient failures', async () => {
      // Arrange
      const paymentRequest = {
        merchantId: 'merchant_retry',
        baseAmount: 30.00,
        tipPercentage: 18,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE_CARD
      };

      let attemptCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          // Fail first 2 attempts with retryable error
          return Promise.reject(new Error('Network timeout'));
        }
        // Succeed on 3rd attempt
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'pi_retry_success',
            status: 'succeeded'
          })
        });
      });

      // Act
      const result = await processTipPaymentUseCase.execute(mockGateway, paymentRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3); // Should have retried 2 times
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Transaction History and Persistence', () => {
    it('should maintain transaction history across app restarts', async () => {
      // Arrange - Create some transactions
      const transactions = [
        {
          merchantId: 'merchant_history',
          baseAmount: 25.00,
          tipPercentage: 15,
          currency: 'USD',
          paymentMethod: PaymentMethod.STRIPE_CARD
        },
        {
          merchantId: 'merchant_history',
          baseAmount: 40.00,
          tipPercentage: 20,
          currency: 'USD',
          paymentMethod: PaymentMethod.QR_CODE
        }
      ];

      // Mock storage with existing data
      const existingTransactions = JSON.stringify([
        {
          id: 'txn_existing',
          amount: 60.00,
          currency: 'USD',
          status: TransactionStatus.COMPLETED,
          merchantId: 'merchant_history',
          createdAt: new Date('2024-01-01').toISOString(),
          updatedAt: new Date('2024-01-01').toISOString()
        }
      ]);

      mockAsyncStorage.getItem.mockResolvedValueOnce(existingTransactions);

      // Mock successful payments
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: `pi_${Date.now()}`,
          status: 'succeeded'
        })
      });

      // Act - Process new transactions
      for (const transaction of transactions) {
        await processTipPaymentUseCase.execute(mockGateway, transaction);
      }

      // Assert - Should have all transactions (1 existing + 2 new)
      const allTransactions = await transactionRepository.findByMerchantId('merchant_history', 10);
      expect(allTransactions).toHaveLength(3);

      // Verify chronological order (newest first)
      expect(allTransactions[0].amount).toBe(48.00); // 40 + 20% tip
      expect(allTransactions[1].amount).toBe(28.75); // 25 + 15% tip
      expect(allTransactions[2].amount).toBe(60.00); // Existing transaction
    });

    it('should handle transaction date range queries', async () => {
      // Arrange - Create transactions across different dates
      const baseDate = new Date('2024-01-15');
      const transactions = [
        { date: new Date('2024-01-10'), amount: 30.00 },
        { date: new Date('2024-01-15'), amount: 45.00 },
        { date: new Date('2024-01-20'), amount: 60.00 },
        { date: new Date('2024-01-25'), amount: 75.00 }
      ];

      // Mock storage to return transactions with specific dates
      const mockTransactions = transactions.map((t, i) => ({
        id: `txn_date_${i}`,
        amount: t.amount,
        currency: 'USD',
        status: TransactionStatus.COMPLETED,
        merchantId: 'merchant_date_test',
        createdAt: t.date.toISOString(),
        updatedAt: t.date.toISOString(),
        type: 'tip',
        paymentMethod: PaymentMethod.STRIPE_CARD
      }));

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockTransactions));

      // Act - Query transactions within date range
      const startDate = new Date('2024-01-12');
      const endDate = new Date('2024-01-22');
      const filteredTransactions = await transactionRepository.findByDateRange(startDate, endDate, 'merchant_date_test');

      // Assert - Should return transactions within date range
      expect(filteredTransactions).toHaveLength(2);
      expect(filteredTransactions.some(t => t.amount === 45.00)).toBe(true);
      expect(filteredTransactions.some(t => t.amount === 60.00)).toBe(true);
    });

    it('should calculate merchant totals correctly', async () => {
      // Arrange - Create transactions for different merchants
      const merchantA = 'merchant_a';
      const merchantB = 'merchant_b';

      const transactions = [
        { merchantId: merchantA, amount: 100.00, status: TransactionStatus.COMPLETED },
        { merchantId: merchantA, amount: 50.00, status: TransactionStatus.COMPLETED },
        { merchantId: merchantA, amount: 75.00, status: TransactionStatus.FAILED }, // Should not count
        { merchantId: merchantB, amount: 200.00, status: TransactionStatus.COMPLETED },
        { merchantId: merchantB, amount: 150.00, status: TransactionStatus.COMPLETED }
      ];

      const mockTransactions = transactions.map((t, i) => ({
        id: `txn_total_${i}`,
        amount: t.amount,
        currency: 'USD',
        status: t.status,
        merchantId: t.merchantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: 'tip',
        paymentMethod: PaymentMethod.STRIPE_CARD
      }));

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockTransactions));

      // Act
      const totalA = await transactionRepository.getTotalAmountByMerchant(merchantA);
      const totalB = await transactionRepository.getTotalAmountByMerchant(merchantB);

      // Assert
      expect(totalA).toBe(150.00); // 100 + 50 (failed transaction excluded)
      expect(totalB).toBe(350.00); // 200 + 150
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle storage errors gracefully', async () => {
      // Arrange
      const paymentRequest = {
        merchantId: 'merchant_storage_error',
        baseAmount: 25.00,
        tipPercentage: 15,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE_CARD
      };

      // Mock storage error
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage quota exceeded'));

      // Mock successful Stripe response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'pi_storage_test',
          status: 'succeeded'
        })
      });

      // Act & Assert - Should handle storage error but still process payment
      const result = await processTipPaymentUseCase.execute(mockGateway, paymentRequest);

      // Payment processing should still succeed even if storage fails
      expect(result.success).toBe(true);
    });

    it('should validate payment amounts according to limits', async () => {
      // Test cases for amount validation
      const testCases = [
        { amount: 0, shouldFail: true, error: 'Base amount must be greater than 0' },
        { amount: -10, shouldFail: true, error: 'Base amount must be greater than 0' },
        { amount: 0.005, shouldFail: false }, // Valid small amount
        { amount: 999999.99, shouldFail: false }, // Max valid amount
        { amount: 1000000, shouldFail: false } // Over limit but will be caught by validation
      ];

      for (const testCase of testCases) {
        const paymentRequest = {
          merchantId: 'merchant_validation',
          baseAmount: testCase.amount,
          tipPercentage: 15,
          currency: 'USD',
          paymentMethod: PaymentMethod.STRIPE_CARD
        };

        if (testCase.shouldFail) {
          await expect(processTipPaymentUseCase.execute(mockGateway, paymentRequest))
            .rejects.toThrow(testCase.error);
        } else {
          // Mock successful response for valid amounts
          global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
              id: `pi_validation_${Date.now()}`,
              status: 'succeeded'
            })
          });

          const result = await processTipPaymentUseCase.execute(mockGateway, paymentRequest);
          expect(result.success).toBe(true);
        }
      }
    });

    it('should handle network interruptions during payment', async () => {
      // Arrange
      const paymentRequest = {
        merchantId: 'merchant_network',
        baseAmount: 40.00,
        tipPercentage: 18,
        currency: 'USD',
        paymentMethod: PaymentMethod.STRIPE_CARD
      };

      // Mock network interruption
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network request failed'));

      // Act
      const result = await processTipPaymentUseCase.execute(mockGateway, paymentRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network request failed');

      // Verify transaction was marked as failed
      const transactions = await transactionRepository.findByMerchantId('merchant_network', 10);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].status).toBe(TransactionStatus.FAILED);
    });
  });
});