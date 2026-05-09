import { logger } from '@/utils/logger';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // Keep only last 100 metrics

  startTimer(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.addMetric(name, duration);
    };
  }

  private addMetric(name: string, duration: number) {
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now()
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      logger.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getAverageTime(name: string): number {
    const nameMetrics = this.metrics.filter(m => m.name === name);
    if (nameMetrics.length === 0) return 0;
    
    const total = nameMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / nameMetrics.length;
  }

  clear() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();
