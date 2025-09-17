import { useState, useCallback } from 'react';
import { PaymentService, ProcessPaymentRequest, ProcessPaymentResult } from '@/application/services/PaymentService';
import { PaymentGateway } from '@/domain/entities/PaymentGateway';
import { Transaction } from '@/domain/entities/Transaction';
import { PaymentError } from '@/shared/errors/PaymentError';
import { ErrorHandler } from '@/shared/errors/ErrorHandler';

export interface PaymentState {
  isProcessing: boolean;
  transaction: Transaction | null;
  error: PaymentError | null;
  lastResult: ProcessPaymentResult | null;
}

export interface UsePaymentHook {
  state: PaymentState;
  processPayment: (gateway: PaymentGateway, request: ProcessPaymentRequest) => Promise<ProcessPaymentResult>;
  refundPayment: (gateway: PaymentGateway, transactionId: string, amount?: number) => Promise<ProcessPaymentResult>;
  cancelPayment: (transactionId: string) => Promise<ProcessPaymentResult>;
  getPaymentStatus: (gateway: PaymentGateway, transactionId: string) => Promise<ProcessPaymentResult>;
  clearError: () => void;
  reset: () => void;
}

const initialState: PaymentState = {
  isProcessing: false,
  transaction: null,
  error: null,
  lastResult: null
};

export const usePayment = (
  paymentService: PaymentService,
  errorHandler: ErrorHandler
): UsePaymentHook => {
  const [state, setState] = useState<PaymentState>(initialState);

  const processPayment = useCallback(async (
    gateway: PaymentGateway,
    request: ProcessPaymentRequest
  ): Promise<ProcessPaymentResult> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await errorHandler.executeWithRetry(
        () => paymentService.processPayment(gateway, request),
        { operation: 'processPayment', gateway: gateway.id, merchantId: request.merchantId }
      );

      setState(prev => ({
        ...prev,
        isProcessing: false,
        transaction: result.transaction || null,
        lastResult: result,
        error: result.success ? null : new PaymentError(
          result.errorCode as any || 'PROCESSING_ERROR',
          result.error || 'Payment processing failed'
        )
      }));

      return result;
    } catch (error) {
      const paymentError = errorHandler.handleError(error, {
        operation: 'processPayment',
        gateway: gateway.id,
        merchantId: request.merchantId
      });

      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: paymentError,
        lastResult: { success: false, error: paymentError.message }
      }));

      return { success: false, error: paymentError.message, errorCode: paymentError.code };
    }
  }, [paymentService, errorHandler]);

  const refundPayment = useCallback(async (
    gateway: PaymentGateway,
    transactionId: string,
    amount?: number
  ): Promise<ProcessPaymentResult> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await errorHandler.executeWithRetry(
        () => paymentService.refundPayment(gateway, transactionId, amount),
        { operation: 'refundPayment', gateway: gateway.id, transactionId }
      );

      setState(prev => ({
        ...prev,
        isProcessing: false,
        transaction: result.transaction || null,
        lastResult: result,
        error: result.success ? null : new PaymentError(
          result.errorCode as any || 'PROCESSING_ERROR',
          result.error || 'Refund processing failed'
        )
      }));

      return result;
    } catch (error) {
      const paymentError = errorHandler.handleError(error, {
        operation: 'refundPayment',
        gateway: gateway.id,
        transactionId
      });

      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: paymentError,
        lastResult: { success: false, error: paymentError.message }
      }));

      return { success: false, error: paymentError.message, errorCode: paymentError.code };
    }
  }, [paymentService, errorHandler]);

  const cancelPayment = useCallback(async (transactionId: string): Promise<ProcessPaymentResult> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await paymentService.cancelPayment(transactionId);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        transaction: result.transaction || null,
        lastResult: result,
        error: result.success ? null : new PaymentError(
          result.errorCode as any || 'PROCESSING_ERROR',
          result.error || 'Payment cancellation failed'
        )
      }));

      return result;
    } catch (error) {
      const paymentError = errorHandler.handleError(error, {
        operation: 'cancelPayment',
        transactionId
      });

      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: paymentError,
        lastResult: { success: false, error: paymentError.message }
      }));

      return { success: false, error: paymentError.message, errorCode: paymentError.code };
    }
  }, [paymentService, errorHandler]);

  const getPaymentStatus = useCallback(async (
    gateway: PaymentGateway,
    transactionId: string
  ): Promise<ProcessPaymentResult> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await paymentService.getPaymentStatus(gateway, transactionId);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        transaction: result.transaction || null,
        lastResult: result,
        error: result.success ? null : new PaymentError(
          result.errorCode as any || 'PROCESSING_ERROR',
          result.error || 'Failed to get payment status'
        )
      }));

      return result;
    } catch (error) {
      const paymentError = errorHandler.handleError(error, {
        operation: 'getPaymentStatus',
        gateway: gateway.id,
        transactionId
      });

      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: paymentError,
        lastResult: { success: false, error: paymentError.message }
      }));

      return { success: false, error: paymentError.message, errorCode: paymentError.code };
    }
  }, [paymentService, errorHandler]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    processPayment,
    refundPayment,
    cancelPayment,
    getPaymentStatus,
    clearError,
    reset
  };
};