// Centralized Retry Service - Eliminates duplicate retry logic across services
export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export class RetryService {
  private static instance: RetryService;

  public static getInstance(): RetryService {
    if (!RetryService.instance) {
      RetryService.instance = new RetryService();
    }
    return RetryService.instance;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    const {
      maxAttempts,
      baseDelay,
      maxDelay = 30000,
      backoffMultiplier = 2,
      shouldRetry = () => true,
      onRetry
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Don't retry on last attempt
        if (attempt === maxAttempts) {
          break;
        }

        // Check if error is retryable
        if (!shouldRetry(error)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, attempt - 1) + Math.random() * 1000,
          maxDelay
        );

        // Notify retry callback
        if (onRetry) {
          onRetry(attempt, error);
        }

        // Wait before retrying
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}