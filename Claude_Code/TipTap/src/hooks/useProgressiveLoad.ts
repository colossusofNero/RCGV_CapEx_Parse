import {useState, useEffect, useCallback, useRef} from 'react';
import {NetworkOptimizer} from '@/utils/networkOptimizer';

interface UseProgressiveLoadOptions<T> {
  loadFn: (page: number, limit: number) => Promise<{items: T[]; hasMore: boolean}>;
  initialLimit?: number;
  enabled?: boolean;
}

interface UseProgressiveLoadResult<T> {
  items: T[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export function useProgressiveLoad<T>({
  loadFn,
  initialLimit = 20,
  enabled = true,
}: UseProgressiveLoadOptions<T>): UseProgressiveLoadResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loaderRef = useRef(
    NetworkOptimizer.createProgressiveLoader(loadFn, initialLimit)
  );

  const loadMore = useCallback(async () => {
    if (!enabled || loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await loaderRef.current.loadMore();
      setItems(prev => [...prev, ...result.items]);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [enabled, loading, hasMore]);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);
    setItems([]);
    loaderRef.current.reset();

    try {
      const result = await loaderRef.current.loadMore();
      setItems(result.items);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const reset = useCallback(() => {
    setItems([]);
    setError(null);
    setHasMore(true);
    loaderRef.current.reset();
  }, []);

  useEffect(() => {
    if (enabled && items.length === 0) {
      loadMore();
    }
  }, [enabled]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    reset,
  };
}