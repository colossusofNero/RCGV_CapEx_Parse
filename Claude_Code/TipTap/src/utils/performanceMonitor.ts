import {InteractionManager, Alert} from 'react-native';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private renderMetrics: Map<string, number[]> = new Map();

  startTiming(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  endTiming(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`No timing started for: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    this.metrics.set(name, {
      ...metric,
      endTime,
      duration,
    });

    return duration;
  }

  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startTiming(name);
    return fn()
      .then(result => {
        this.endTiming(name);
        return result;
      })
      .catch(error => {
        this.endTiming(name);
        throw error;
      });
  }

  measureSync<T>(name: string, fn: () => T): T {
    this.startTiming(name);
    try {
      const result = fn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }

  recordRenderTime(componentName: string, renderTime: number): void {
    if (!this.renderMetrics.has(componentName)) {
      this.renderMetrics.set(componentName, []);
    }

    const times = this.renderMetrics.get(componentName)!;
    times.push(renderTime);

    if (times.length > 100) {
      times.shift();
    }
  }

  getAverageRenderTime(componentName: string): number {
    const times = this.renderMetrics.get(componentName);
    if (!times || times.length === 0) return 0;

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getSlowComponents(threshold: number = 16): Array<{name: string; avgTime: number}> {
    const slowComponents: Array<{name: string; avgTime: number}> = [];

    this.renderMetrics.forEach((times, name) => {
      const avgTime = this.getAverageRenderTime(name);
      if (avgTime > threshold) {
        slowComponents.push({name, avgTime});
      }
    });

    return slowComponents.sort((a, b) => b.avgTime - a.avgTime);
  }

  logPerformanceReport(): void {
    console.group('🚀 Performance Report');

    console.group('⏱️ Timing Metrics');
    this.metrics.forEach((metric, name) => {
      if (metric.duration) {
        console.log(`${name}: ${metric.duration.toFixed(2)}ms`);
        if (metric.metadata) {
          console.log(`  Metadata:`, metric.metadata);
        }
      }
    });
    console.groupEnd();

    console.group('🎨 Render Metrics');
    const slowComponents = this.getSlowComponents();
    if (slowComponents.length > 0) {
      console.warn('Slow components (>16ms average):');
      slowComponents.forEach(({name, avgTime}) => {
        console.log(`${name}: ${avgTime.toFixed(2)}ms`);
      });
    } else {
      console.log('✅ All components rendering within 16ms threshold');
    }
    console.groupEnd();

    console.groupEnd();
  }

  clear(): void {
    this.metrics.clear();
    this.renderMetrics.clear();
  }

  scheduleAfterInteractions(callback: () => void): void {
    InteractionManager.runAfterInteractions(callback);
  }

  wrapComponentRender<P extends object>(
    Component: React.ComponentType<P>,
    componentName: string
  ): React.ComponentType<P> {
    return (props: P) => {
      const startTime = performance.now();

      React.useEffect(() => {
        const renderTime = performance.now() - startTime;
        this.recordRenderTime(componentName, renderTime);

        if (renderTime > 50) {
          console.warn(
            `⚠️ Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`
          );
        }
      });

      return React.createElement(Component, props);
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const name = componentName || Component.displayName || Component.name;
  return performanceMonitor.wrapComponentRender(Component, name);
};

export const measureFn = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  return ((...args: any[]) => {
    return performanceMonitor.measureSync(name, () => fn(...args));
  }) as T;
};

export const measureAsyncFn = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T => {
  return ((...args: any[]) => {
    return performanceMonitor.measureAsync(name, () => fn(...args));
  }) as T;
};