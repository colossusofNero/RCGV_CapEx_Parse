export enum PaymentErrorCode {
  // Gateway errors
  INVALID_GATEWAY = 'INVALID_GATEWAY',
  GATEWAY_UNAVAILABLE = 'GATEWAY_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',

  // Payment errors
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_PAYMENT_METHOD = 'INVALID_PAYMENT_METHOD',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  EXPIRED_CARD = 'EXPIRED_CARD',
  INVALID_CVV = 'INVALID_CVV',

  // Transaction errors
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  INVALID_TRANSACTION_STATUS = 'INVALID_TRANSACTION_STATUS',
  DUPLICATE_TRANSACTION = 'DUPLICATE_TRANSACTION',

  // Amount errors
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  AMOUNT_TOO_LARGE = 'AMOUNT_TOO_LARGE',
  AMOUNT_TOO_SMALL = 'AMOUNT_TOO_SMALL',

  // Currency errors
  UNSUPPORTED_CURRENCY = 'UNSUPPORTED_CURRENCY',
  INVALID_CURRENCY = 'INVALID_CURRENCY',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',

  // Generic errors
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class PaymentError extends Error {
  public readonly code: PaymentErrorCode;
  public readonly isRetryable: boolean;
  public readonly metadata?: Record<string, any>;

  constructor(
    code: PaymentErrorCode,
    message: string,
    isRetryable: boolean = false,
    metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.isRetryable = isRetryable;
    this.metadata = metadata;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PaymentError);
    }
  }

  static fromGatewayError(gatewayError: any): PaymentError {
    // Map common gateway error codes to our error system
    const errorMapping: Record<string, { code: PaymentErrorCode; isRetryable: boolean }> = {
      'card_declined': { code: PaymentErrorCode.PAYMENT_DECLINED, isRetryable: false },
      'insufficient_funds': { code: PaymentErrorCode.INSUFFICIENT_FUNDS, isRetryable: false },
      'expired_card': { code: PaymentErrorCode.EXPIRED_CARD, isRetryable: false },
      'invalid_cvc': { code: PaymentErrorCode.INVALID_CVV, isRetryable: false },
      'processing_error': { code: PaymentErrorCode.PROCESSING_ERROR, isRetryable: true },
      'rate_limit': { code: PaymentErrorCode.API_ERROR, isRetryable: true },
      'api_connection_error': { code: PaymentErrorCode.NETWORK_ERROR, isRetryable: true },
      'api_error': { code: PaymentErrorCode.API_ERROR, isRetryable: true }
    };

    const gatewayErrorCode = gatewayError.code || gatewayError.type;
    const mapped = errorMapping[gatewayErrorCode];

    if (mapped) {
      return new PaymentError(
        mapped.code,
        gatewayError.message || 'Payment processing failed',
        mapped.isRetryable,
        { originalError: gatewayError }
      );
    }

    return new PaymentError(
      PaymentErrorCode.UNKNOWN_ERROR,
      gatewayError.message || 'Unknown payment error occurred',
      false,
      { originalError: gatewayError }
    );
  }

  getUserFriendlyMessage(): string {
    switch (this.code) {
      case PaymentErrorCode.INSUFFICIENT_FUNDS:
        return 'Your payment method has insufficient funds. Please try a different payment method.';

      case PaymentErrorCode.PAYMENT_DECLINED:
        return 'Your payment was declined. Please contact your bank or try a different payment method.';

      case PaymentErrorCode.EXPIRED_CARD:
        return 'Your card has expired. Please use a different payment method.';

      case PaymentErrorCode.INVALID_CVV:
        return 'The security code (CVV) you entered is invalid. Please check and try again.';

      case PaymentErrorCode.INVALID_PAYMENT_METHOD:
        return 'The payment method is invalid. Please check your details and try again.';

      case PaymentErrorCode.NETWORK_ERROR:
        return 'Unable to connect to payment services. Please check your internet connection and try again.';

      case PaymentErrorCode.GATEWAY_TIMEOUT:
        return 'Payment processing timed out. Please try again.';

      case PaymentErrorCode.AMOUNT_TOO_LARGE:
        return 'The payment amount exceeds the maximum allowed limit.';

      case PaymentErrorCode.AMOUNT_TOO_SMALL:
        return 'The payment amount is below the minimum required amount.';

      case PaymentErrorCode.UNSUPPORTED_CURRENCY:
        return 'This currency is not supported. Please use a different currency.';

      case PaymentErrorCode.DUPLICATE_TRANSACTION:
        return 'This transaction has already been processed.';

      default:
        return 'Payment processing failed. Please try again or contact support if the problem persists.';
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      isRetryable: this.isRetryable,
      metadata: this.metadata,
      stack: this.stack
    };
  }
}