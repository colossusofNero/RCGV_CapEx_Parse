import { PaymentService, ProcessPaymentRequest } from '@/application/services/PaymentService';
import { PaymentGateway } from '@/domain/entities/PaymentGateway';
import { PaymentMethod } from '@/domain/entities/Transaction';
import { TipCalculationOptions } from '@/application/services/TipCalculationService';

export interface ProcessTipPaymentInput {
  merchantId: string;
  baseAmount: number;
  tipPercentage: number;
  currency: string;
  paymentMethod: PaymentMethod;
  customerId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ProcessTipPaymentOutput {
  success: boolean;
  transactionId?: string;
  totalAmount?: number;
  tipAmount?: number;
  error?: string;
  errorCode?: string;
}

export class ProcessTipPaymentUseCase {
  constructor(
    private paymentService: PaymentService
  ) {}

  async execute(
    gateway: PaymentGateway,
    input: ProcessTipPaymentInput
  ): Promise<ProcessTipPaymentOutput> {
    try {
      // Validate input
      this.validateInput(input);

      // Prepare tip calculation
      const tipCalculation: TipCalculationOptions = {
        baseAmount: input.baseAmount,
        tipPercentage: input.tipPercentage,
        currency: input.currency,
        roundingMode: 'nearest'
      };

      // Prepare payment request
      const paymentRequest: ProcessPaymentRequest = {
        amount: input.baseAmount,
        currency: input.currency,
        merchantId: input.merchantId,
        customerId: input.customerId,
        paymentMethod: input.paymentMethod,
        description: input.description || `Tip payment - ${input.tipPercentage}%`,
        tipCalculation,
        metadata: {
          ...input.metadata,
          useCase: 'ProcessTipPayment',
          tipPercentage: input.tipPercentage
        }
      };

      // Process payment
      const result = await this.paymentService.processPayment(gateway, paymentRequest);

      if (result.success && result.transaction) {
        const tipCalculationResult = result.transaction.metadata?.tipCalculation;

        return {
          success: true,
          transactionId: result.transaction.id,
          totalAmount: result.transaction.amount,
          tipAmount: tipCalculationResult?.tipAmount,
        };
      } else {
        return {
          success: false,
          error: result.error,
          errorCode: result.errorCode
        };
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to process tip payment',
        errorCode: 'USE_CASE_ERROR'
      };
    }
  }

  private validateInput(input: ProcessTipPaymentInput): void {
    if (!input.merchantId) {
      throw new Error('Merchant ID is required');
    }

    if (!input.baseAmount || input.baseAmount <= 0) {
      throw new Error('Base amount must be greater than 0');
    }

    if (input.tipPercentage < 0) {
      throw new Error('Tip percentage cannot be negative');
    }

    if (!input.currency || input.currency.length !== 3) {
      throw new Error('Valid currency code is required');
    }

    if (!Object.values(PaymentMethod).includes(input.paymentMethod)) {
      throw new Error('Valid payment method is required');
    }
  }
}