/**
 * Animation System Hooks
 * Custom React hooks for animation management and optimization
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAnimation } from './context';
import { performanceMonitor, ScrollAnimationObserver } from './performance-monitor';
import type { AnimationVariant, PerformanceMetrics } from './types';

// Hook for performance-aware animations
export function usePerformanceAnimation() {
  const { config } = useAnimation();
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>(() =>
    performanceMonitor.getMetrics()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceMetrics(performanceMonitor.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const shouldReduceAnimations = performanceMetrics.frameRate < 45 || performanceMetrics.animationCount > 15;

  return {
    performanceMetrics,
    shouldAnimate: config.enabled && performanceMetrics.frameRate > 30,
    shouldUseGPU: config.enableGPUAcceleration && performanceMetrics.frameRate > 45,
    shouldReduceComplexity: shouldReduceAnimations,
    adaptAnimation: useCallback((baseAnimation: AnimationVariant) => {
      if (!config.enabled || performanceMetrics.frameRate < 30) {
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.1 },
        };
      }

      if (shouldReduceAnimations) {
        return {
          ...baseAnimation,
          transition: {
            ...baseAnimation.transition,
            duration: Math.min(baseAnimation.transition?.duration || 0.3, 0.2),
          },
        };
      }

      return baseAnimation;
    }, [config.enabled, performanceMetrics.frameRate, shouldReduceAnimations]),
  };
}

// Hook for scroll-based animations
export function useScrollAnimation(
  threshold = 0.1,
  rootMargin = '0px 0px -10% 0px',
  triggerOnce = true
) {
  const [inView, setInView] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<ScrollAnimationObserver | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    observerRef.current = new ScrollAnimationObserver({
      threshold,
      rootMargin,
    });

    observerRef.current.observe(elementRef.current, () => {
      setInView(true);
      if (triggerOnce && observerRef.current) {
        observerRef.current.unobserve(elementRef.current!);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { elementRef, inView };
}

// Hook for animation orchestration
export function useAnimationOrchestration() {
  const [activeAnimations, setActiveAnimations] = useState<Set<string>>(new Set());
  const maxConcurrent = 10;

  const registerAnimation = useCallback((id: string) => {
    setActiveAnimations(prev => {
      if (prev.size >= maxConcurrent) {
        console.warn('Maximum concurrent animations reached');
        return prev;
      }
      return new Set([...prev, id]);
    });
  }, []);

  const unregisterAnimation = useCallback((id: string) => {
    setActiveAnimations(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const canAnimate = activeAnimations.size < maxConcurrent;

  return {
    registerAnimation,
    unregisterAnimation,
    activeCount: activeAnimations.size,
    canAnimate,
  };
}

// Hook for business-specific animations
export function useBusinessAnimation(
  context: 'tax-filing' | 'compliance' | 'document' | 'client' | 'dashboard',
  value?: number,
  previousValue?: number
) {
  const { config } = useAnimation();
  const [shouldTrigger, setShouldTrigger] = useState(false);

  useEffect(() => {
    if (value !== undefined && previousValue !== undefined && value !== previousValue) {
      setShouldTrigger(true);
      const timer = setTimeout(() => setShouldTrigger(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [value, previousValue]);

  const getContextAnimation = useCallback(() => {
    if (!config.enabled) return null;

    const contextConfigs = {
      'tax-filing': {
        color: '#3b82f6',
        duration: 0.6,
        scale: [1, 1.02, 1],
      },
      'compliance': {
        color: '#10b981',
        duration: 0.8,
        scale: [1, 1.05, 1],
      },
      'document': {
        color: '#f59e0b',
        duration: 0.5,
        scale: [1, 1.03, 1],
      },
      'client': {
        color: '#8b5cf6',
        duration: 0.4,
        scale: [1, 1.02, 1],
      },
      'dashboard': {
        color: '#6b7280',
        duration: 0.3,
        scale: [1, 1.01, 1],
      },
    };

    const contextConfig = contextConfigs[context];

    return {
      animate: shouldTrigger ? {
        scale: contextConfig.scale,
        backgroundColor: [
          'transparent',
          `${contextConfig.color}20`,
          'transparent',
        ],
      } : {},
      transition: {
        duration: contextConfig.duration,
        ease: 'easeOut',
      },
    };
  }, [config.enabled, context, shouldTrigger]);

  return {
    animationProps: getContextAnimation(),
    isAnimating: shouldTrigger,
  };
}

// Hook for form validation animations
export function useFormValidationAnimation() {
  const { config } = useAnimation();
  const [validationState, setValidationState] = useState<'idle' | 'error' | 'success'>('idle');

  const triggerError = useCallback(() => {
    if (!config.enableFormValidationAnimations) return;

    setValidationState('error');

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    setTimeout(() => setValidationState('idle'), 600);
  }, [config.enableFormValidationAnimations]);

  const triggerSuccess = useCallback(() => {
    if (!config.enableFormValidationAnimations) return;

    setValidationState('success');

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }

    setTimeout(() => setValidationState('idle'), 800);
  }, [config.enableFormValidationAnimations]);

  const getValidationAnimation = useCallback(() => {
    if (!config.enabled) return {};

    switch (validationState) {
      case 'error':
        return {
          animate: {
            x: [0, -10, 10, -10, 10, 0],
            borderColor: '#ef4444',
          },
          transition: { duration: 0.5 },
        };
      case 'success':
        return {
          animate: {
            scale: [1, 1.02, 1],
            borderColor: '#10b981',
          },
          transition: { duration: 0.6 },
        };
      default:
        return {};
    }
  }, [config.enabled, validationState]);

  return {
    validationState,
    triggerError,
    triggerSuccess,
    animationProps: getValidationAnimation(),
  };
}

// Hook for data visualization animations
export function useDataVisualizationAnimation(data: any[], animateOnChange = true) {
  const { config } = useAnimation();
  const [previousData, setPreviousData] = useState(data);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!config.enableDataVisualizationAnimations || !animateOnChange) return;

    const dataChanged = JSON.stringify(data) !== JSON.stringify(previousData);

    if (dataChanged) {
      setIsAnimating(true);
      setPreviousData(data);

      const timer = setTimeout(() => setIsAnimating(false), 800);
      return () => clearTimeout(timer);
    }
  }, [data, previousData, config.enableDataVisualizationAnimations, animateOnChange]);

  const getChartAnimation = useCallback((index: number = 0) => {
    if (!config.enabled) return {};

    return {
      initial: { opacity: 0, scale: 0.8 },
      animate: {
        opacity: 1,
        scale: isAnimating ? [1, 1.05, 1] : 1,
      },
      transition: {
        duration: 0.5,
        delay: index * 0.1,
        ease: 'easeOut',
      },
    };
  }, [config.enabled, isAnimating]);

  return {
    isAnimating,
    getChartAnimation,
    shouldAnimate: config.enableDataVisualizationAnimations,
  };
}

// Hook for mobile-optimized animations
export function useMobileOptimizedAnimation() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTouch('ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const optimizeForMobile = useCallback((baseAnimation: AnimationVariant) => {
    if (!isMobile) return baseAnimation;

    return {
      ...baseAnimation,
      transition: {
        ...baseAnimation.transition,
        duration: Math.min(baseAnimation.transition?.duration || 0.3, 0.2),
      },
    };
  }, [isMobile]);

  return {
    isMobile,
    isTouch,
    optimizeForMobile,
  };
}

// Hook for animation cleanup
export function useAnimationCleanup() {
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervalRefs = useRef<Set<NodeJS.Timeout>>(new Set());

  const addTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      callback();
      timeoutRefs.current.delete(timeoutId);
    }, delay);

    timeoutRefs.current.add(timeoutId);
    return timeoutId;
  }, []);

  const addInterval = useCallback((callback: () => void, interval: number) => {
    const intervalId = setInterval(callback, interval);
    intervalRefs.current.add(intervalId);
    return intervalId;
  }, []);

  const cleanup = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    intervalRefs.current.forEach(clearInterval);
    timeoutRefs.current.clear();
    intervalRefs.current.clear();
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { addTimeout, addInterval, cleanup };
}