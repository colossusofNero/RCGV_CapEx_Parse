import CryptoJS from 'crypto-js';

export class NetworkOptimizer {
  static compressPayload(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      const compressed = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(jsonString));
      return compressed;
    } catch (error) {
      console.warn('Payload compression failed:', error);
      return JSON.stringify(data);
    }
  }

  static decompressPayload(compressed: string): any {
    try {
      const decompressed = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(compressed));
      return JSON.parse(decompressed);
    } catch (error) {
      console.warn('Payload decompression failed:', error);
      return JSON.parse(compressed);
    }
  }

  static optimizeApiPayload(data: any): any {
    const optimized = {...data};

    if (typeof optimized === 'object' && optimized !== null) {
      Object.keys(optimized).forEach(key => {
        if (optimized[key] === null || optimized[key] === undefined) {
          delete optimized[key];
        }

        if (typeof optimized[key] === 'string' && optimized[key].trim() === '') {
          delete optimized[key];
        }

        if (Array.isArray(optimized[key]) && optimized[key].length === 0) {
          delete optimized[key];
        }
      });
    }

    return optimized;
  }

  static batchRequests<T>(
    requests: (() => Promise<T>)[],
    batchSize: number = 5
  ): Promise<T[]> {
    return new Promise(async (resolve, reject) => {
      const results: T[] = [];
      const errors: Error[] = [];

      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);

        try {
          const batchResults = await Promise.all(batch.map(request => request()));
          results.push(...batchResults);
        } catch (error) {
          errors.push(error as Error);
        }
      }

      if (errors.length > 0) {
        reject(errors);
      } else {
        resolve(results);
      }
    });
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  }

  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static createProgressiveLoader<T>(
    loadFn: (page: number, limit: number) => Promise<{items: T[]; hasMore: boolean}>,
    initialLimit: number = 20
  ) {
    let currentPage = 1;
    let hasMore = true;
    let loading = false;

    return {
      async loadMore(): Promise<{items: T[]; hasMore: boolean}> {
        if (loading || !hasMore) {
          return {items: [], hasMore: false};
        }

        loading = true;

        try {
          const result = await loadFn(currentPage, initialLimit);
          currentPage++;
          hasMore = result.hasMore;
          return result;
        } finally {
          loading = false;
        }
      },

      reset() {
        currentPage = 1;
        hasMore = true;
        loading = false;
      },

      get isLoading() {
        return loading;
      },

      get canLoadMore() {
        return hasMore && !loading;
      }
    };
  }
}