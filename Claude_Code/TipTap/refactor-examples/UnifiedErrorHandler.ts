// Unified Error Handler - Consolidates all error handling patterns
import { PaymentError, PaymentErrorCode } from '@/shared/errors/PaymentError';

export interface ErrorResult {
  success: false;
  error: PaymentError;
  userFriendlyMessage: string;
  shouldRetry: boolean;
  logData?: Record<string, any>;
}

export interface SuccessResult<T> {
  success: true;
  data: T;
}

export type Result<T> = SuccessResult<T> | ErrorResult;

export class UnifiedErrorHandler {
  private static instance: UnifiedErrorHandler;

  public static getInstance(): UnifiedErrorHandler {
    if (!UnifiedErrorHandler.instance) {
      UnifiedErrorHandler.instance = new UnifiedErrorHandler();
    }
    return UnifiedErrorHandler.instance;
  }

  // Payment-specific error handling
  handlePaymentError(error: any): ErrorResult {
    const paymentError = this.normalizeError(error);

    return {
      success: false,
      error: paymentError,
      userFriendlyMessage: this.getUserFriendlyMessage(paymentError),
      shouldRetry: this.isRetryable(paymentError),
      logData: {
        originalError: error,
        timestamp: new Date().toISOString(),
        errorCode: paymentError.code
      }
    };
  }

  // Generic error handling with type safety
  handleGenericError<T>(operation: () => Promise<T>): Promise<Result<T>> {
    return operation()
      .then((data): SuccessResult<T> => ({
        success: true,
        data
      }))
      .catch((error): ErrorResult => this.handlePaymentError(error));
  }

  // Network error handling
  handleNetworkError(error: any, endpoint: string): ErrorResult {
    let errorCode: PaymentErrorCode;
    let message: string;

    if (error.name === 'TimeoutError') {
      errorCode = PaymentErrorCode.NETWORK_TIMEOUT;
      message = 'Request timed out. Please try again.';
    } else if (error.status >= 500) {
      errorCode = PaymentErrorCode.SERVER_ERROR;
      message = 'Server is temporarily unavailable. Please try again later.';
    } else if (error.status === 401) {
      errorCode = PaymentErrorCode.UNAUTHORIZED;
      message = 'Authentication required. Please log in again.';
    } else if (error.status >= 400) {
      errorCode = PaymentErrorCode.INVALID_REQUEST;
      message = 'Invalid request. Please check your input.';
    } else {
      errorCode = PaymentErrorCode.NETWORK_ERROR;
      message = 'Network error. Please check your connection.';
    }

    return {
      success: false,
      error: new PaymentError(errorCode, message),
      userFriendlyMessage: message,
      shouldRetry: this.isNetworkErrorRetryable(error),
      logData: {
        endpoint,
        status: error.status,
        originalError: error.message
      }
    };
  }

  private normalizeError(error: any): PaymentError {
    // If already a PaymentError, return as-is
    if (error instanceof PaymentError) {
      return error;
    }

    // Handle common error patterns
    if (error.code === 'card_declined') {
      return new PaymentError(PaymentErrorCode.CARD_DECLINED, 'Your card was declined');
    }

    if (error.code === 'insufficient_funds') {
      return new PaymentError(PaymentErrorCode.INSUFFICIENT_FUNDS, 'Insufficient funds');
    }

    if (error.message?.includes('cancelled')) {
      return new PaymentError(PaymentErrorCode.USER_CANCELLED, 'Payment was cancelled');
    }

    if (error.message?.includes('timeout')) {
      return new PaymentError(PaymentErrorCode.NETWORK_TIMEOUT, 'Request timed out');
    }

    // Default error
    return new PaymentError(
      PaymentErrorCode.UNKNOWN_ERROR,
      error.message || 'An unexpected error occurred'
    );
  }

  private getUserFriendlyMessage(error: PaymentError): string {
    const messages: Record<PaymentErrorCode, string> = {
      [PaymentErrorCode.CARD_DECLINED]: 'Your card was declined. Please try a different payment method.',
      [PaymentErrorCode.INSUFFICIENT_FUNDS]: 'Insufficient funds. Please check your account balance.',
      [PaymentErrorCode.NETWORK_ERROR]: 'Connection error. Please check your internet and try again.',
      [PaymentErrorCode.SERVER_ERROR]: 'Our servers are temporarily unavailable. Please try again in a few minutes.',
      [PaymentErrorCode.USER_CANCELLED]: 'Payment was cancelled.',
      [PaymentErrorCode.SECURITY_CHECK_FAILED]: 'Security verification failed. Please try again.',
      [PaymentErrorCode.INVALID_REQUEST]: 'Invalid payment details. Please check and try again.',
      [PaymentErrorCode.UNAUTHORIZED]: 'Please log in to continue.',
      [PaymentErrorCode.NETWORK_TIMEOUT]: 'Request timed out. Please try again.',
      [PaymentErrorCode.UNKNOWN_ERROR]: 'Something went wrong. Please try again.',
    };

    return messages[error.code] || error.message || 'An unexpected error occurred.';
  }

  private isRetryable(error: PaymentError): boolean {
    const retryableCodes = [
      PaymentErrorCode.NETWORK_ERROR,
      PaymentErrorCode.NETWORK_TIMEOUT,
      PaymentErrorCode.SERVER_ERROR,
    ];

    return retryableCodes.includes(error.code);
  }

  private isNetworkErrorRetryable(error: any): boolean {
    // Retry on 5xx errors and timeouts
    return error.status >= 500 || error.name === 'TimeoutError';
  }

  // Logging integration
  async logError(error: ErrorResult, context?: Record<string, any>): Promise<void> {
    const logData = {
      ...error.logData,
      ...context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      timestamp: new Date().toISOString()
    };

    // Log to monitoring service
    console.error('Payment Error:', {
      code: error.error.code,
      message: error.error.message,
      context: logData
    });

    // In production, send to monitoring service like Sentry
    // await MonitoringService.logError(error.error, logData);
  }
}