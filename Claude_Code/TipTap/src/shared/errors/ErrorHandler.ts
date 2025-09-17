import { PaymentError, PaymentErrorCode } from './PaymentError';

export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: PaymentError;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface ErrorHandlerOptions {
  enableLogging?: boolean;
  enableReporting?: boolean;
  maxRetryAttempts?: number;
  retryDelayMs?: number;
}

export class ErrorHandler {
  private options: Required<ErrorHandlerOptions>;
  private errorReports: ErrorReport[] = [];

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      enableLogging: options.enableLogging ?? true,
      enableReporting: options.enableReporting ?? false,
      maxRetryAttempts: options.maxRetryAttempts ?? 3,
      retryDelayMs: options.retryDelayMs ?? 1000
    };
  }

  handleError(
    error: unknown,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string
  ): PaymentError {
    const paymentError = this.normalizeError(error);

    if (this.options.enableLogging) {
      this.logError(paymentError, context);
    }

    if (this.options.enableReporting) {
      this.reportError(paymentError, context, userId, sessionId);
    }

    return paymentError;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: PaymentError | null = null;

    for (let attempt = 1; attempt <= this.options.maxRetryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const paymentError = this.normalizeError(error);
        lastError = paymentError;

        // Don't retry if error is not retryable or we've reached max attempts
        if (!paymentError.isRetryable || attempt === this.options.maxRetryAttempts) {
          break;
        }

        if (this.options.enableLogging) {
          console.warn(`Retrying operation (attempt ${attempt}/${this.options.maxRetryAttempts}):`, {
            error: paymentError.message,
            context,
            attempt
          });
        }

        // Wait before retrying with exponential backoff
        const delay = this.options.retryDelayMs * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }

    throw lastError || new PaymentError(
      PaymentErrorCode.UNKNOWN_ERROR,
      'Operation failed after all retry attempts'
    );
  }

  getErrorReports(limit: number = 50): ErrorReport[] {
    return this.errorReports
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  clearErrorReports(): void {
    this.errorReports = [];
  }

  private normalizeError(error: unknown): PaymentError {
    if (error instanceof PaymentError) {
      return error;
    }

    if (error instanceof Error) {
      // Try to map common error patterns
      if (error.message.toLowerCase().includes('network')) {
        return new PaymentError(
          PaymentErrorCode.NETWORK_ERROR,
          error.message,
          true,
          { originalError: error }
        );
      }

      if (error.message.toLowerCase().includes('timeout')) {
        return new PaymentError(
          PaymentErrorCode.GATEWAY_TIMEOUT,
          error.message,
          true,
          { originalError: error }
        );
      }

      return new PaymentError(
        PaymentErrorCode.PROCESSING_ERROR,
        error.message,
        false,
        { originalError: error }
      );
    }

    // Handle string errors
    if (typeof error === 'string') {
      return new PaymentError(
        PaymentErrorCode.PROCESSING_ERROR,
        error,
        false
      );
    }

    // Handle unknown error types
    return new PaymentError(
      PaymentErrorCode.UNKNOWN_ERROR,
      'An unknown error occurred',
      false,
      { originalError: error }
    );
  }

  private logError(error: PaymentError, context?: Record<string, any>): void {
    const logData = {
      timestamp: new Date().toISOString(),
      error: {
        code: error.code,
        message: error.message,
        isRetryable: error.isRetryable,
        stack: error.stack
      },
      context
    };

    if (error.isRetryable) {
      console.warn('[PaymentError - Retryable]', logData);
    } else {
      console.error('[PaymentError - Non-retryable]', logData);
    }
  }

  private reportError(
    error: PaymentError,
    context?: Record<string, any>,
    userId?: string,
    sessionId?: string
  ): void {
    const report: ErrorReport = {
      id: this.generateReportId(),
      timestamp: new Date(),
      error,
      context,
      userId,
      sessionId
    };

    this.errorReports.push(report);

    // Keep only the last 1000 error reports in memory
    if (this.errorReports.length > 1000) {
      this.errorReports = this.errorReports.slice(-1000);
    }

    // In a production app, you would send this to an error reporting service
    // like Sentry, Bugsnag, or a custom logging endpoint
    if (__DEV__) {
      console.log('[Error Report Generated]', report);
    }
  }

  private generateReportId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper method for creating user-friendly error messages
  static getUserFriendlyMessage(error: unknown): string {
    if (error instanceof PaymentError) {
      return error.getUserFriendlyMessage();
    }

    if (error instanceof Error) {
      return 'An unexpected error occurred. Please try again.';
    }

    return 'Something went wrong. Please try again.';
  }
}