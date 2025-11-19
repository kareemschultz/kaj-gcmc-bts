/**
 * Animation Context Provider
 * Global animation state management and configuration
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import type {
  AnimationContext,
  AnimationConfig,
  AnimationPresets,
  MicroInteraction,
  BusinessAnimation,
  PerformanceMetrics
} from './types';
import { DEFAULT_ANIMATION_CONFIG, DEFAULT_ANIMATION_PRESETS } from './constants';

interface AnimationState {
  config: AnimationConfig;
  presets: AnimationPresets;
  microInteractions: Map<string, MicroInteraction>;
  businessAnimations: Map<string, BusinessAnimation>;
  performanceMetrics: PerformanceMetrics;
  isPerformanceMode: boolean;
}

type AnimationAction =
  | { type: 'UPDATE_CONFIG'; payload: Partial<AnimationConfig> }
  | { type: 'REGISTER_MICRO_INTERACTION'; payload: MicroInteraction }
  | { type: 'REGISTER_BUSINESS_ANIMATION'; payload: BusinessAnimation }
  | { type: 'UPDATE_PERFORMANCE_METRICS'; payload: PerformanceMetrics }
  | { type: 'TOGGLE_PERFORMANCE_MODE'; payload: boolean }
  | { type: 'RESET_ANIMATIONS' };

const initialState: AnimationState = {
  config: DEFAULT_ANIMATION_CONFIG,
  presets: DEFAULT_ANIMATION_PRESETS,
  microInteractions: new Map(),
  businessAnimations: new Map(),
  performanceMetrics: {
    frameRate: 60,
    animationCount: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    droppedFrames: 0,
    timestamp: Date.now(),
  },
  isPerformanceMode: false,
};

function animationReducer(state: AnimationState, action: AnimationAction): AnimationState {
  switch (action.type) {
    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };

    case 'REGISTER_MICRO_INTERACTION':
      const newMicroInteractions = new Map(state.microInteractions);
      newMicroInteractions.set(action.payload.id, action.payload);
      return {
        ...state,
        microInteractions: newMicroInteractions,
      };

    case 'REGISTER_BUSINESS_ANIMATION':
      const newBusinessAnimations = new Map(state.businessAnimations);
      newBusinessAnimations.set(action.payload.id, action.payload);
      return {
        ...state,
        businessAnimations: newBusinessAnimations,
      };

    case 'UPDATE_PERFORMANCE_METRICS':
      return {
        ...state,
        performanceMetrics: action.payload,
      };

    case 'TOGGLE_PERFORMANCE_MODE':
      return {
        ...state,
        isPerformanceMode: action.payload,
        config: {
          ...state.config,
          enabled: !action.payload,
          enableGPUAcceleration: !action.payload,
        },
      };

    case 'RESET_ANIMATIONS':
      return {
        ...state,
        microInteractions: new Map(),
        businessAnimations: new Map(),
      };

    default:
      return state;
  }
}

const AnimationContextValue = createContext<AnimationContext | null>(null);

interface AnimationProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<AnimationConfig>;
}

export function AnimationProvider({ children, initialConfig = {} }: AnimationProviderProps) {
  const { theme } = useTheme();
  const [state, dispatch] = useReducer(animationReducer, {
    ...initialState,
    config: { ...initialState.config, ...initialConfig },
  });

  // Performance monitoring
  useEffect(() => {
    if (!state.config.enabled) return;

    const performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const animationEntries = entries.filter(entry =>
        entry.name.includes('animation') || entry.entryType === 'measure'
      );

      if (animationEntries.length > 0) {
        const currentMetrics = {
          frameRate: 1000 / (animationEntries[0]?.duration || 16.67), // Estimate FPS
          animationCount: animationEntries.length,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          cpuUsage: 0, // Would need additional API
          droppedFrames: 0, // Would need additional tracking
          timestamp: Date.now(),
        };

        dispatch({ type: 'UPDATE_PERFORMANCE_METRICS', payload: currentMetrics });

        // Auto-enable performance mode if metrics indicate poor performance
        if (currentMetrics.frameRate < 30 || currentMetrics.animationCount > 20) {
          dispatch({ type: 'TOGGLE_PERFORMANCE_MODE', payload: true });
        }
      }
    });

    performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });

    return () => performanceObserver.disconnect();
  }, [state.config.enabled]);

  // Reduced motion detection
  useEffect(() => {
    if (!state.config.respectMotionPreference) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleMediaChange = (e: MediaQueryListEvent) => {
      dispatch({
        type: 'UPDATE_CONFIG',
        payload: { reduceMotion: e.matches },
      });
    };

    mediaQuery.addEventListener('change', handleMediaChange);

    // Set initial value
    dispatch({
      type: 'UPDATE_CONFIG',
      payload: { reduceMotion: mediaQuery.matches },
    });

    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [state.config.respectMotionPreference]);

  // Theme-based animation adjustments
  useEffect(() => {
    if (theme === 'dark') {
      dispatch({
        type: 'UPDATE_CONFIG',
        payload: {
          defaultEasing: 'easeOut',
          enableGPUAcceleration: true,
        },
      });
    } else {
      dispatch({
        type: 'UPDATE_CONFIG',
        payload: {
          defaultEasing: 'easeInOut',
          enableGPUAcceleration: true,
        },
      });
    }
  }, [theme]);

  // Context methods
  const updateConfig = useCallback((updates: Partial<AnimationConfig>) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: updates });
  }, []);

  const registerMicroInteraction = useCallback((interaction: MicroInteraction) => {
    dispatch({ type: 'REGISTER_MICRO_INTERACTION', payload: interaction });
  }, []);

  const registerBusinessAnimation = useCallback((animation: BusinessAnimation) => {
    dispatch({ type: 'REGISTER_BUSINESS_ANIMATION', payload: animation });
  }, []);

  const getPerformanceMetrics = useCallback(() => {
    return state.performanceMetrics;
  }, [state.performanceMetrics]);

  const resetAnimations = useCallback(() => {
    dispatch({ type: 'RESET_ANIMATIONS' });
  }, []);

  const contextValue: AnimationContext = {
    config: state.config,
    presets: state.presets,
    updateConfig,
    registerMicroInteraction,
    registerBusinessAnimation,
    getPerformanceMetrics,
    resetAnimations,
  };

  return (
    <AnimationContextValue.Provider value={contextValue}>
      {children}
    </AnimationContextValue.Provider>
  );
}

export function useAnimation() {
  const context = useContext(AnimationContextValue);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
}

// Custom hooks for specific animation types
export function useReducedMotion() {
  const { config } = useAnimation();
  return config.reduceMotion || !config.enabled;
}

export function usePerfOptimizedAnimation() {
  const { config, getPerformanceMetrics } = useAnimation();
  const metrics = getPerformanceMetrics();

  return {
    shouldAnimate: config.enabled && metrics.frameRate > 30,
    shouldUseGPU: config.enableGPUAcceleration && metrics.frameRate > 45,
    shouldReduceComplexity: metrics.animationCount > 10,
  };
}

export function useBusinessAnimation(context: BusinessAnimation['context']) {
  const { config } = useAnimation();

  return {
    enabled: config.enabled,
    showProgress: config.showProgressAnimations,
    enableDataViz: config.enableDataVisualizationAnimations,
    enableFormValidation: config.enableFormValidationAnimations,
    isBusinessContext: true,
  };
}