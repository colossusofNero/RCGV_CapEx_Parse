import {useEffect, useCallback, useRef} from 'react';
import {useNavigation} from '@react-navigation/native';
import {monitoringService} from '../services/MonitoringService';
import {useSelector} from 'react-redux';
import {RootState} from '../store';

interface UseMonitoringOptions {
  screenName?: string;
  trackScreenViews?: boolean;
  trackUserActivity?: boolean;
  trackPerformance?: boolean;
}

export const useMonitoring = (options: UseMonitoringOptions = {}) => {
  const {
    screenName,
    trackScreenViews = true,
    trackUserActivity = true,
    trackPerformance = true,
  } = options;

  const navigation = useNavigation();
  const startTimeRef = useRef<number>(Date.now());
  const user = useSelector((state: RootState) => state.user);

  // Track screen views
  useEffect(() => {
    if (trackScreenViews && screenName && user.id) {
      monitoringService.recordUserActivity(
        user.id,
        'view',
        screenName,
        {
          timestamp: Date.now(),
          navigation_state: navigation.getState(),
        }
      );

      startTimeRef.current = Date.now();

      // Track screen exit time when component unmounts
      return () => {
        const timeSpent = Date.now() - startTimeRef.current;
        monitoringService.recordPerformanceMetric(
          'screen_time_spent',
          timeSpent,
          screenName || 'unknown',
          {
            user_id: user.id,
            screen_name: screenName,
          }
        );
      };
    }
  }, [screenName, trackScreenViews, user.id, navigation]);

  // Track user interactions
  const trackInteraction = useCallback((
    action: string,
    target?: string,
    metadata?: Record<string, any>
  ) => {
    if (trackUserActivity && user.id) {
      monitoringService.recordUserActivity(
        user.id,
        'interaction',
        screenName,
        {
          action,
          target,
          timestamp: Date.now(),
          ...metadata,
        }
      );
    }
  }, [trackUserActivity, user.id, screenName]);

  // Track errors
  const trackError = useCallback((
    error: Error | string,
    feature?: string,
    level: 'error' | 'warning' | 'info' = 'error',
    metadata?: Record<string, any>
  ) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : undefined;
    const featureName = feature || screenName || 'unknown';

    monitoringService.recordError(
      featureName,
      errorMessage,
      level,
      stackTrace,
      {
        user_id: user.id,
        screen_name: screenName,
        timestamp: Date.now(),
        ...metadata,
      }
    );
  }, [user.id, screenName]);

  // Track custom metrics
  const trackCustomMetric = useCallback((
    name: string,
    value: number,
    tags?: Record<string, string>,
    metadata?: Record<string, any>
  ) => {
    monitoringService.recordCustomMetric(
      name,
      value,
      {
        screen_name: screenName,
        user_id: user.id,
        ...tags,
      },
      {
        timestamp: Date.now(),
        ...metadata,
      }
    );
  }, [user.id, screenName]);

  // Track performance with timing
  const trackTiming = useCallback(<T>(
    operationName: string,
    operation: () => T | Promise<T>,
    metadata?: Record<string, any>
  ): T | Promise<T> => {
    if (!trackPerformance) {
      return operation();
    }

    const startTime = Date.now();
    const featureName = screenName || 'unknown';

    const recordTiming = (duration: number, success: boolean, error?: Error) => {
      monitoringService.recordPerformanceMetric(
        'operation_duration',
        duration,
        featureName,
        {
          operation: operationName,
          user_id: user.id,
          screen_name: screenName,
          success,
          error_message: error?.message,
          timestamp: Date.now(),
          ...metadata,
        }
      );
    };

    try {
      const result = operation();

      // Handle both sync and async operations
      if (result instanceof Promise) {
        return result
          .then((value) => {
            const duration = Date.now() - startTime;
            recordTiming(duration, true);
            return value;
          })
          .catch((error) => {
            const duration = Date.now() - startTime;
            recordTiming(duration, false, error);
            throw error;
          });
      } else {
        const duration = Date.now() - startTime;
        recordTiming(duration, true);
        return result;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      recordTiming(duration, false, error as Error);
      throw error;
    }
  }, [trackPerformance, screenName, user.id]);

  // Track payment events
  const trackPayment = useCallback((
    event: 'attempt' | 'success' | 'failure',
    method: 'nfc' | 'qr' | 'card' | 'ach',
    amount: number,
    metadata?: Record<string, any>
  ) => {
    const baseMetadata = {
      user_id: user.id,
      screen_name: screenName,
      timestamp: Date.now(),
      ...metadata,
    };

    switch (event) {
      case 'attempt':
        monitoringService.recordPaymentAttempt(method, amount, baseMetadata);
        break;
      case 'success':
        monitoringService.recordPaymentSuccess(
          method,
          amount,
          metadata?.duration || 0,
          baseMetadata
        );
        break;
      case 'failure':
        monitoringService.recordPaymentFailure(
          method,
          amount,
          metadata?.reason || 'unknown',
          baseMetadata
        );
        break;
    }
  }, [user.id, screenName]);

  // Track transaction events
  const trackTransaction = useCallback((
    amount: number,
    status: 'success' | 'failed' | 'pending',
    type: 'tip' | 'payment' = 'tip',
    metadata?: Record<string, any>
  ) => {
    monitoringService.recordTransactionComplete({
      transaction_duration_seconds: metadata?.duration || 0,
      transaction_amount: amount,
      transaction_status: status,
      transaction_type: type,
      geo_region: metadata?.geo_region,
    });
  }, []);

  // Track authentication events
  const trackAuth = useCallback((
    success: boolean,
    method: string = 'standard',
    metadata?: Record<string, any>
  ) => {
    if (user.id) {
      monitoringService.recordAuthAttempt(
        user.id,
        success,
        method,
        {
          screen_name: screenName,
          timestamp: Date.now(),
          ...metadata,
        }
      );
    }
  }, [user.id, screenName]);

  return {
    trackInteraction,
    trackError,
    trackCustomMetric,
    trackTiming,
    trackPayment,
    trackTransaction,
    trackAuth,
  };
};

// Higher-order component for automatic monitoring
export const withMonitoringHOC = <P extends object>(
  Component: React.ComponentType<P>,
  screenName: string,
  options: UseMonitoringOptions = {}
) => {
  return (props: P) => {
    const monitoring = useMonitoring({ screenName, ...options });

    // Automatically track component render errors
    const trackRenderError = (error: Error, errorInfo: any) => {
      monitoring.trackError(
        error,
        `${screenName}_render`,
        'error',
        {
          component_stack: errorInfo.componentStack,
          error_boundary: true,
        }
      );
    };

    // In a real implementation, you'd wrap this with an error boundary
    // For now, we'll just pass the monitoring functions as props
    return (
      <Component
        {...props}
        monitoring={monitoring}
      />
    );
  };
};

// Hook for monitoring network requests
export const useNetworkMonitoring = () => {
  const user = useSelector((state: RootState) => state.user);

  const trackRequest = useCallback((
    method: string,
    url: string,
    status: number,
    duration: number,
    metadata?: Record<string, any>
  ) => {
    const tags = {
      method: method.toUpperCase(),
      status_code: status.toString(),
      endpoint: url.replace(/\/\d+/g, '/:id'), // Replace IDs with placeholders
    };

    // Track HTTP request metrics
    monitoringService.recordCustomMetric(
      'http_requests_total',
      1,
      tags,
      {
        user_id: user.id,
        duration,
        timestamp: Date.now(),
        ...metadata,
      }
    );

    // Track request duration
    monitoringService.recordCustomMetric(
      'http_request_duration_seconds',
      duration / 1000,
      tags,
      {
        user_id: user.id,
        timestamp: Date.now(),
        ...metadata,
      }
    );

    // Track errors specifically
    if (status >= 400) {
      monitoringService.recordError(
        'api_request',
        `HTTP ${status} for ${method} ${url}`,
        status >= 500 ? 'error' : 'warning',
        undefined,
        {
          user_id: user.id,
          method,
          url,
          status,
          duration,
          timestamp: Date.now(),
          ...metadata,
        }
      );
    }
  }, [user.id]);

  return { trackRequest };
};

// Hook for monitoring app lifecycle events
export const useAppLifecycleMonitoring = () => {
  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (user.id) {
        monitoringService.recordUserActivity(
          user.id,
          nextAppState === 'active' ? 'login' : 'interaction',
          undefined,
          {
            app_state: nextAppState,
            timestamp: Date.now(),
          }
        );
      }
    };

    // Note: In a real React Native app, you'd use AppState from 'react-native'
    // AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // AppState.removeEventListener('change', handleAppStateChange);
    };
  }, [user.id]);
};

export default useMonitoring;