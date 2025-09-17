import { PaymentService, ProcessPaymentRequest } from '@/application/services/PaymentService';
import { TipCalculationService } from '@/application/services/TipCalculationService';
import { IPaymentGatewayRepository } from '@/domain/repositories/IPaymentGatewayRepository';
import { ITransactionRepository } from '@/domain/repositories/ITransactionRepository';
import { PaymentGateway, PaymentGatewayType, PaymentResponse } from '@/domain/entities/PaymentGateway';
import { Transaction, TransactionStatus, TransactionType, PaymentMethod } from '@/domain/entities/Transaction';

// Mock implementations
const mockPaymentGatewayRepo: jest.Mocked<IPaymentGatewayRepository> = {
  processPayment: jest.fn(),
  refundPayment: jest.fn(),
  getPaymentStatus: jest.fn(),
  validateGateway: jest.fn()
};

const mockTransactionRepo: jest.Mocked<ITransactionRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByMerchantId: jest.fn(),
  findByCustomerId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByDateRange: jest.fn(),
  getTotalAmountByMerchant: jest.fn()
};

const mockTipCalculationService: jest.Mocked<TipCalculationService> = {
  calculateTip: jest.fn(),
  calculateTipFromTotal: jest.fn(),
  getTipPresets: jest.fn(),
  getCustomTipPresets: jest.fn(),
  calculateSplitTip: jest.fn(),
  validateTipAmount: jest.fn(),
  formatCurrency: jest.fn()
} as any;

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockGateway: PaymentGateway;
  let mockTransaction: Transaction;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    paymentService = new PaymentService(
      mockPaymentGatewayRepo,
      mockTransactionRepo,
      mockTipCalculationService
    );

    mockGateway = {
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

    mockTransaction = {
      id: 'txn_123',
      amount: 118.00,
      currency: 'USD',
      status: TransactionStatus.PENDING,
      type: TransactionType.TIP,
      paymentMethod: PaymentMethod.STRIPE_CARD,
      merchantId: 'merchant_123',
      customerId: 'customer_456',
      description: 'Test tip payment',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      // Arrange
      const request: ProcessPaymentRequest = {
        amount: 100.00,
        currency: 'USD',
        merchantId: 'merchant_123',
        customerId: 'customer_456',
        paymentMethod: PaymentMethod.STRIPE_CARD,
        description: 'Test payment',
        tipCalculation: {
          baseAmount: 100.00,
          tipPercentage: 18,
          currency: 'USD'
        }
      };

      const tipCalculationResult = {
        baseAmount: 100.00,
        tipPercentage: 18,
        tipAmount: 18.00,
        totalAmount: 118.00,
        currency: 'USD'
      };

      const successResponse: PaymentResponse = {
        transactionId: 'txn_123',
        status: 'success',
        gatewayTransactionId: 'pi_123'
      };

      // Mock implementations
      mockPaymentGatewayRepo.validateGateway.mockResolvedValue(true);
      mockTipCalculationService.calculateTip.mockReturnValue(tipCalculationResult);
      mockTransactionRepo.create.mockResolvedValue(mockTransaction);
      mockPaymentGatewayRepo.processPayment.mockResolvedValue(successResponse);
      mockTransactionRepo.update.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.COMPLETED,
        processedAt: new Date()
      });

      // Act
      const result = await paymentService.processPayment(mockGateway, request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(mockTipCalculationService.calculateTip).toHaveBeenCalledWith(request.tipCalculation);
      expect(mockTransactionRepo.create).toHaveBeenCalled();
      expect(mockPaymentGatewayRepo.processPayment).toHaveBeenCalled();
      expect(mockTransactionRepo.update).toHaveBeenCalledWith(
        mockTransaction.id,
        expect.objectContaining({
          status: TransactionStatus.COMPLETED,
          processedAt: expect.any(Date)
        })
      );
    });

    it('should handle invalid gateway', async () => {
      // Arrange
      const request: ProcessPaymentRequest = {
        amount: 100.00,
        currency: 'USD',
        merchantId: 'merchant_123',
        paymentMethod: PaymentMethod.STRIPE_CARD
      };

      mockPaymentGatewayRepo.validateGateway.mockResolvedValue(false);

      // Act
      const result = await paymentService.processPayment(mockGateway, request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment gateway configuration is invalid');
      expect(result.errorCode).toBe('INVALID_GATEWAY');
    });

    it('should handle payment failure', async () => {
      // Arrange
      const request: ProcessPaymentRequest = {
        amount: 100.00,
        currency: 'USD',
        merchantId: 'merchant_123',
        paymentMethod: PaymentMethod.STRIPE_CARD
      };

      const failureResponse: PaymentResponse = {
        transactionId: 'txn_123',
        status: 'failed',
        errorCode: 'card_declined',
        errorMessage: 'Your card was declined'
      };

      mockPaymentGatewayRepo.validateGateway.mockResolvedValue(true);
      mockTransactionRepo.create.mockResolvedValue(mockTransaction);
      mockPaymentGatewayRepo.processPayment.mockResolvedValue(failureResponse);
      mockTransactionRepo.update.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.FAILED,
        failureReason: 'Your card was declined'
      });

      // Act
      const result = await paymentService.processPayment(mockGateway, request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Your card was declined');
      expect(result.errorCode).toBe('card_declined');
      expect(mockTransactionRepo.update).toHaveBeenCalledWith(
        mockTransaction.id,
        expect.objectContaining({
          status: TransactionStatus.FAILED,
          failureReason: 'Your card was declined'
        })
      );
    });

    it('should handle pending payment status', async () => {
      // Arrange
      const request: ProcessPaymentRequest = {
        amount: 100.00,
        currency: 'USD',
        merchantId: 'merchant_123',
        paymentMethod: PaymentMethod.STRIPE_CARD
      };

      const pendingResponse: PaymentResponse = {
        transactionId: 'txn_123',
        status: 'pending',
        gatewayTransactionId: 'pi_123'
      };

      mockPaymentGatewayRepo.validateGateway.mockResolvedValue(true);
      mockTransactionRepo.create.mockResolvedValue(mockTransaction);
      mockPaymentGatewayRepo.processPayment.mockResolvedValue(pendingResponse);
      mockTransactionRepo.update.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.PENDING
      });

      // Act
      const result = await paymentService.processPayment(mockGateway, request);

      // Assert
      expect(result.success).toBe(false); // Pending is not considered success
      expect(result.transaction?.status).toBe(TransactionStatus.PENDING);
    });

    it('should handle exceptions gracefully', async () => {
      // Arrange
      const request: ProcessPaymentRequest = {
        amount: 100.00,
        currency: 'USD',
        merchantId: 'merchant_123',
        paymentMethod: PaymentMethod.STRIPE_CARD
      };

      mockPaymentGatewayRepo.validateGateway.mockRejectedValue(new Error('Network error'));

      // Act
      const result = await paymentService.processPayment(mockGateway, request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.errorCode).toBe('PROCESSING_ERROR');
    });

    it('should process payment without tip calculation', async () => {
      // Arrange
      const request: ProcessPaymentRequest = {
        amount: 100.00,
        currency: 'USD',
        merchantId: 'merchant_123',
        paymentMethod: PaymentMethod.STRIPE_CARD
      };

      const successResponse: PaymentResponse = {
        transactionId: 'txn_123',
        status: 'success'
      };

      mockPaymentGatewayRepo.validateGateway.mockResolvedValue(true);
      mockTransactionRepo.create.mockResolvedValue(mockTransaction);
      mockPaymentGatewayRepo.processPayment.mockResolvedValue(successResponse);
      mockTransactionRepo.update.mockResolvedValue({
        ...mockTransaction,
        status: TransactionStatus.COMPLETED
      });

      // Act
      const result = await paymentService.processPayment(mockGateway, request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockTipCalculationService.calculateTip).not.toHaveBeenCalled();
    });
  });

  describe('refundPayment', () => {
    it('should process refund successfully', async () => {
      // Arrange
      const transactionId = 'txn_123';
      const completedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.COMPLETED
      };

      const refundResponse: PaymentResponse = {
        transactionId: 'refund_123',
        status: 'success',
        gatewayTransactionId: 're_123'
      };

      const refundTransaction = {
        ...mockTransaction,
        id: 'refund_123',
        amount: -118.00,
        type: TransactionType.REFUND,
        status: TransactionStatus.COMPLETED
      };

      mockTransactionRepo.findById.mockResolvedValue(completedTransaction);
      mockPaymentGatewayRepo.refundPayment.mockResolvedValue(refundResponse);
      mockTransactionRepo.create.mockResolvedValue(refundTransaction);
      mockTransactionRepo.update.mockResolvedValue({
        ...completedTransaction,
        status: TransactionStatus.REFUNDED
      });

      // Act
      const result = await paymentService.refundPayment(mockGateway, transactionId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.transaction?.amount).toBe(-118.00);
      expect(result.transaction?.type).toBe(TransactionType.REFUND);
      expect(mockTransactionRepo.update).toHaveBeenCalledWith(
        transactionId,
        expect.objectContaining({
          status: TransactionStatus.REFUNDED
        })
      );
    });

    it('should handle partial refunds', async () => {
      // Arrange
      const transactionId = 'txn_123';
      const refundAmount = 50.00;
      const completedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.COMPLETED
      };

      const refundResponse: PaymentResponse = {
        transactionId: 'refund_123',
        status: 'success'
      };

      const refundTransaction = {
        ...mockTransaction,
        id: 'refund_123',
        amount: -50.00,
        type: TransactionType.REFUND
      };

      mockTransactionRepo.findById.mockResolvedValue(completedTransaction);
      mockPaymentGatewayRepo.refundPayment.mockResolvedValue(refundResponse);
      mockTransactionRepo.create.mockResolvedValue(refundTransaction);

      // Act
      const result = await paymentService.refundPayment(mockGateway, transactionId, refundAmount);

      // Assert
      expect(result.success).toBe(true);
      expect(result.transaction?.amount).toBe(-50.00);
      // Original transaction should not be marked as refunded for partial refund
      expect(mockTransactionRepo.update).not.toHaveBeenCalledWith(
        transactionId,
        expect.objectContaining({
          status: TransactionStatus.REFUNDED
        })
      );
    });

    it('should reject refund for non-existent transaction', async () => {
      // Arrange
      const transactionId = 'nonexistent_txn';
      mockTransactionRepo.findById.mockResolvedValue(null);

      // Act
      const result = await paymentService.refundPayment(mockGateway, transactionId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction not found');
      expect(result.errorCode).toBe('TRANSACTION_NOT_FOUND');
    });

    it('should reject refund for non-completed transaction', async () => {
      // Arrange
      const transactionId = 'txn_123';
      const pendingTransaction = {
        ...mockTransaction,
        status: TransactionStatus.PENDING
      };

      mockTransactionRepo.findById.mockResolvedValue(pendingTransaction);

      // Act
      const result = await paymentService.refundPayment(mockGateway, transactionId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Only completed transactions can be refunded');
      expect(result.errorCode).toBe('INVALID_TRANSACTION_STATUS');
    });

    it('should handle refund failure', async () => {
      // Arrange
      const transactionId = 'txn_123';
      const completedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.COMPLETED
      };

      const failureResponse: PaymentResponse = {
        transactionId: transactionId,
        status: 'failed',
        errorCode: 'refund_failed',
        errorMessage: 'Refund cannot be processed'
      };

      mockTransactionRepo.findById.mockResolvedValue(completedTransaction);
      mockPaymentGatewayRepo.refundPayment.mockResolvedValue(failureResponse);

      // Act
      const result = await paymentService.refundPayment(mockGateway, transactionId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Refund cannot be processed');
      expect(result.errorCode).toBe('refund_failed');
    });
  });

  describe('getPaymentStatus', () => {
    it('should retrieve payment status successfully', async () => {
      // Arrange
      const transactionId = 'txn_123';

      const statusResponse: PaymentResponse = {
        transactionId: transactionId,
        status: 'success'
      };

      mockTransactionRepo.findById.mockResolvedValue(mockTransaction);
      mockPaymentGatewayRepo.getPaymentStatus.mockResolvedValue(statusResponse);

      // Act
      const result = await paymentService.getPaymentStatus(mockGateway, transactionId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
    });

    it('should update transaction status if changed', async () => {
      // Arrange
      const transactionId = 'txn_123';
      const pendingTransaction = {
        ...mockTransaction,
        status: TransactionStatus.PENDING
      };

      const statusResponse: PaymentResponse = {
        transactionId: transactionId,
        status: 'success'
      };

      const completedTransaction = {
        ...pendingTransaction,
        status: TransactionStatus.COMPLETED,
        processedAt: new Date()
      };

      mockTransactionRepo.findById.mockResolvedValue(pendingTransaction);
      mockPaymentGatewayRepo.getPaymentStatus.mockResolvedValue(statusResponse);
      mockTransactionRepo.update.mockResolvedValue(completedTransaction);

      // Act
      const result = await paymentService.getPaymentStatus(mockGateway, transactionId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockTransactionRepo.update).toHaveBeenCalledWith(
        transactionId,
        expect.objectContaining({
          status: TransactionStatus.COMPLETED,
          processedAt: expect.any(Date)
        })
      );
    });

    it('should handle non-existent transaction', async () => {
      // Arrange
      const transactionId = 'nonexistent_txn';
      mockTransactionRepo.findById.mockResolvedValue(null);

      // Act
      const result = await paymentService.getPaymentStatus(mockGateway, transactionId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction not found');
      expect(result.errorCode).toBe('TRANSACTION_NOT_FOUND');
    });
  });

  describe('cancelPayment', () => {
    it('should cancel pending payment successfully', async () => {
      // Arrange
      const transactionId = 'txn_123';
      const pendingTransaction = {
        ...mockTransaction,
        status: TransactionStatus.PENDING
      };

      const cancelledTransaction = {
        ...pendingTransaction,
        status: TransactionStatus.CANCELLED
      };

      mockTransactionRepo.findById.mockResolvedValue(pendingTransaction);
      mockTransactionRepo.update.mockResolvedValue(cancelledTransaction);

      // Act
      const result = await paymentService.cancelPayment(transactionId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.transaction?.status).toBe(TransactionStatus.CANCELLED);
      expect(mockTransactionRepo.update).toHaveBeenCalledWith(
        transactionId,
        expect.objectContaining({
          status: TransactionStatus.CANCELLED
        })
      );
    });

    it('should reject cancellation of non-pending transaction', async () => {
      // Arrange
      const transactionId = 'txn_123';
      const completedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.COMPLETED
      };

      mockTransactionRepo.findById.mockResolvedValue(completedTransaction);

      // Act
      const result = await paymentService.cancelPayment(transactionId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Only pending transactions can be cancelled');
      expect(result.errorCode).toBe('INVALID_TRANSACTION_STATUS');
    });

    it('should handle non-existent transaction', async () => {
      // Arrange
      const transactionId = 'nonexistent_txn';
      mockTransactionRepo.findById.mockResolvedValue(null);

      // Act
      const result = await paymentService.cancelPayment(transactionId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction not found');
      expect(result.errorCode).toBe('TRANSACTION_NOT_FOUND');
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      // Arrange
      const request: ProcessPaymentRequest = {
        amount: 100.00,
        currency: 'USD',
        merchantId: 'merchant_123',
        paymentMethod: PaymentMethod.STRIPE_CARD
      };

      mockPaymentGatewayRepo.validateGateway.mockResolvedValue(true);
      mockTransactionRepo.create.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await paymentService.processPayment(mockGateway, request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(result.errorCode).toBe('PROCESSING_ERROR');
    });

    it('should handle tip calculation errors', async () => {
      // Arrange
      const request: ProcessPaymentRequest = {
        amount: 100.00,
        currency: 'USD',
        merchantId: 'merchant_123',
        paymentMethod: PaymentMethod.STRIPE_CARD,
        tipCalculation: {
          baseAmount: -100.00, // Invalid amount
          tipPercentage: 18,
          currency: 'USD'
        }
      };

      mockPaymentGatewayRepo.validateGateway.mockResolvedValue(true);
      mockTipCalculationService.calculateTip.mockImplementation(() => {
        throw new Error('Invalid base amount');
      });

      // Act
      const result = await paymentService.processPayment(mockGateway, request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid base amount');
    });
  });
});