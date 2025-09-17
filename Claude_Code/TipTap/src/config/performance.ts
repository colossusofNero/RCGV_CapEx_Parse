import {performanceMonitor} from '@/utils/performanceMonitor';

export const PerformanceConfig = {
  RENDER_WARNING_THRESHOLD: 16,
  SLOW_RENDER_THRESHOLD: 50,
  CACHE_TTL: 5 * 60 * 1000,
  PREFETCH_DELAY: 1000,
  IMAGE_COMPRESSION_QUALITY: 0.8,
  MAX_CONCURRENT_REQUESTS: 3,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,

  enablePerformanceLogging: __DEV__,
  enableRenderTracking: __DEV__,

  monitoring: {
    trackScreenTransitions: true,
    trackApiCalls: true,
    trackImageLoading: true,
    trackUserInteractions: true,
  },

  init() {
    if (__DEV__) {
      setInterval(() => {
        performanceMonitor.logPerformanceReport();
      }, 30000);
    }
  },
};

export const performanceTips = {
  screens: [
    'Use React.lazy for code splitting',
    'Implement useMemo for expensive calculations',
    'Use useCallback for event handlers',
    'Wrap components with React.memo when appropriate',
  ],

  images: [
    'Use OptimizedImage component for all images',
    'Implement lazy loading for non-critical images',
    'Compress images before uploading',
    'Use FastImage for better performance',
  ],

  network: [
    'Implement RTK Query for API caching',
    'Use offline queue for failed requests',
    'Compress API payloads when possible',
    'Implement progressive loading for large datasets',
  ],

  state: [
    'Use Redux Toolkit for complex state',
    'Implement Redux Persist for offline capability',
    'Use selectors to avoid unnecessary re-renders',
    'Normalize state shape when dealing with lists',
  ],
};