/**
 * Animation Performance Monitor
 * Tracks animation performance and provides optimization recommendations
 */

import type { PerformanceMetrics } from './types';

export class AnimationPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observer: PerformanceObserver | null = null;
  private frameCount = 0;
  private lastFrameTime = 0;
  private animationFrameId = 0;
  private isMonitoring = false;

  constructor() {
    this.startPerformanceTracking();
  }

  private startPerformanceTracking() {
    if (typeof window === 'undefined' || this.isMonitoring) return;

    this.isMonitoring = true;

    // Frame rate monitoring
    this.measureFrameRate();

    // Performance observer for animation events
    if ('PerformanceObserver' in window) {
      try {
        this.observer = new PerformanceObserver((list) => {
          this.processPerformanceEntries(list.getEntries());
        });

        this.observer.observe({
          entryTypes: ['measure', 'navigation', 'paint'],
        });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }

    // Memory monitoring
    if ('memory' in performance) {
      setInterval(() => {
        this.updateMemoryMetrics();
      }, 5000); // Check every 5 seconds
    }
  }

  private measureFrameRate() {
    const measureFrame = (timestamp: number) => {
      if (this.lastFrameTime) {
        const delta = timestamp - this.lastFrameTime;
        const fps = 1000 / delta;
        this.updateFrameRate(fps);
      }

      this.lastFrameTime = timestamp;
      this.frameCount++;

      if (this.isMonitoring) {
        this.animationFrameId = requestAnimationFrame(measureFrame);
      }
    };

    this.animationFrameId = requestAnimationFrame(measureFrame);
  }

  private processPerformanceEntries(entries: PerformanceEntry[]) {
    const animationEntries = entries.filter(
      (entry) =>
        entry.name.includes('animation') ||
        entry.name.includes('transition') ||
        entry.entryType === 'measure'
    );

    if (animationEntries.length > 0) {
      this.updateAnimationCount(animationEntries.length);
    }
  }

  private updateFrameRate(fps: number) {
    const currentMetrics = this.getCurrentMetrics();
    currentMetrics.frameRate = fps;

    // Detect dropped frames
    if (fps < 55) {
      currentMetrics.droppedFrames++;
    }

    this.addMetrics(currentMetrics);
  }

  private updateMemoryMetrics() {
    const memory = (performance as any).memory;
    if (memory) {
      const currentMetrics = this.getCurrentMetrics();
      currentMetrics.memoryUsage = memory.usedJSHeapSize;
      this.addMetrics(currentMetrics);
    }
  }

  private updateAnimationCount(count: number) {
    const currentMetrics = this.getCurrentMetrics();
    currentMetrics.animationCount = count;
    this.addMetrics(currentMetrics);
  }

  private getCurrentMetrics(): PerformanceMetrics {
    const latest = this.metrics[this.metrics.length - 1];
    return {
      frameRate: latest?.frameRate || 60,
      animationCount: latest?.animationCount || 0,
      memoryUsage: latest?.memoryUsage || 0,
      cpuUsage: 0, // Would need additional API
      droppedFrames: latest?.droppedFrames || 0,
      timestamp: Date.now(),
    };
  }

  private addMetrics(metrics: PerformanceMetrics) {
    this.metrics.push(metrics);

    // Keep only last 100 measurements
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  public getMetrics(): PerformanceMetrics {
    return this.getCurrentMetrics();
  }

  public getAverageFrameRate(sampleSize = 10): number {
    const recentMetrics = this.metrics.slice(-sampleSize);
    if (recentMetrics.length === 0) return 60;

    const totalFrameRate = recentMetrics.reduce(
      (sum, metric) => sum + metric.frameRate,
      0
    );
    return totalFrameRate / recentMetrics.length;
  }

  public isPerformanceGood(): boolean {
    const avgFrameRate = this.getAverageFrameRate();
    const currentMetrics = this.getCurrentMetrics();

    return (
      avgFrameRate >= 45 &&
      currentMetrics.droppedFrames < 5 &&
      currentMetrics.animationCount < 20
    );
  }

  public getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const avgFrameRate = this.getAverageFrameRate();
    const currentMetrics = this.getCurrentMetrics();

    if (avgFrameRate < 30) {
      recommendations.push(
        'Frame rate is critically low. Consider reducing animation complexity.'
      );
    } else if (avgFrameRate < 45) {
      recommendations.push(
        'Frame rate is below optimal. Consider using CSS transforms instead of layout properties.'
      );
    }

    if (currentMetrics.animationCount > 15) {
      recommendations.push(
        'Too many concurrent animations. Consider staggering or reducing animations.'
      );
    }

    if (currentMetrics.droppedFrames > 10) {
      recommendations.push(
        'Frequent frame drops detected. Enable GPU acceleration or reduce visual effects.'
      );
    }

    if (currentMetrics.memoryUsage > 100 * 1024 * 1024) {
      // 100MB
      recommendations.push(
        'High memory usage detected. Check for animation memory leaks.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Animation performance is optimal.');
    }

    return recommendations;
  }

  public enablePerformanceMode(): void {
    // Dispatch custom event to notify animation components
    window.dispatchEvent(
      new CustomEvent('animationPerformanceModeChange', {
        detail: { enabled: true },
      })
    );
  }

  public disablePerformanceMode(): void {
    window.dispatchEvent(
      new CustomEvent('animationPerformanceModeChange', {
        detail: { enabled: false },
      })
    );
  }

  public stop(): void {
    this.isMonitoring = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.observer) {
      this.observer.disconnect();
    }
  }

  public reset(): void {
    this.metrics = [];
    this.frameCount = 0;
    this.lastFrameTime = 0;
  }

  // Utility method to measure specific animation performance
  public measureAnimationDuration<T>(
    name: string,
    animationFunction: () => T
  ): T {
    const startTime = performance.now();
    const result = animationFunction();
    const endTime = performance.now();

    performance.mark(`${name}-start`);
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);

    return result;
  }
}

// Intersection Observer utility for scroll-based animations
export class ScrollAnimationObserver {
  private observer: IntersectionObserver;
  private callbacks: Map<Element, () => void> = new Map();

  constructor(options: IntersectionObserverInit = {}) {
    const defaultOptions: IntersectionObserverInit = {
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      rootMargin: '0px 0px -10% 0px',
      ...options,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const callback = this.callbacks.get(entry.target);
          if (callback) {
            callback();
          }
        }
      });
    }, defaultOptions);
  }

  public observe(element: Element, callback: () => void): void {
    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  public unobserve(element: Element): void {
    this.callbacks.delete(element);
    this.observer.unobserve(element);
  }

  public disconnect(): void {
    this.observer.disconnect();
    this.callbacks.clear();
  }
}

// GPU acceleration detector
export function supportsGPUAcceleration(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for WebGL support
  const canvas = document.createElement('canvas');
  const gl =
    canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) return false;

  // Check for specific GPU features
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    // Basic check for dedicated GPU vs integrated
    return !renderer.includes('Intel') || renderer.includes('Iris');
  }

  return true;
}

// Battery API check for mobile optimization
export function isBatteryOptimizationNeeded(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
    return Promise.resolve(false);
  }

  return (navigator as any)
    .getBattery()
    .then((battery: any) => {
      // Reduce animations if battery is low or charging is slow
      return battery.level < 0.2 || (!battery.charging && battery.level < 0.5);
    })
    .catch(() => false);
}

// Create singleton instance
export const performanceMonitor = new AnimationPerformanceMonitor();