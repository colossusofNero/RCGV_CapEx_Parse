// Consolidated Loading State Hook - Eliminates duplicate state management
import { useState, useCallback } from 'react';

export interface LoadingState {
  loading: boolean;
  error: string | null;
  executeAsync: <T>(fn: () => Promise<T>) => Promise<T>;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useLoadingState = (): LoadingState => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAsync = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      return await fn();
    } catch (err: any) {
      const errorMessage = err?.message || 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    executeAsync,
    setError,
    clearError,
    reset
  };
};