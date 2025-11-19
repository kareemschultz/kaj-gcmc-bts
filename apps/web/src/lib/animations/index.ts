/**
 * Animation System - Main Index
 * Comprehensive animation framework for GCMC-KAJ Business Tax Services Platform
 */

// Core animation system
export * from './types';
export * from './constants';
export * from './context';
export * from './performance-monitor';
export * from './hooks';

// Animation components
export { AnimatedButton } from '@/components/animations/animated-button';
export { AnimatedInput } from '@/components/animations/animated-input';
export { AnimatedCard } from '@/components/animations/animated-card';

// Page transitions
export {
  PageTransition,
  StaggeredList,
  ScrollReveal,
} from '@/components/animations/page-transitions';

// Loading states
export {
  LoadingSpinner,
  ProgressBar,
  Skeleton,
  LoadingOverlay,
} from '@/components/animations/loading-states';

// Business-specific animations
export {
  ComplianceScore,
  DeadlineWarning,
  DocumentUploadAnimation,
  MonetaryValue,
  StatusChangeAnimation,
} from '@/components/animations/business-animations';

// Mobile interactions
export {
  SwipeableCard,
  PullToRefresh,
  TouchFeedback,
  PinchZoom,
  useTouchGestures,
} from '@/components/animations/mobile-interactions';

// Accessibility
export {
  AccessibilityControls,
  AnimationAnnouncer,
  useKeyboardNavigation,
} from '@/components/animations/accessibility-controls';

// Animation presets and utilities
export const GCMC_ANIMATION_PRESETS = {
  // Page transitions for different sections
  dashboardEnter: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  clientPortalEnter: {
    initial: { opacity: 0, x: 30, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
    transition: { duration: 0.5, ease: 'easeOut' },
  },

  documentManagementEnter: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut', staggerChildren: 0.1 },
  },

  complianceTracking: {
    initial: { opacity: 0, rotate: -5 },
    animate: { opacity: 1, rotate: 0 },
    transition: { duration: 0.5, ease: 'easeOut' },
  },

  // Business interactions
  taxFilingSuccess: {
    animate: {
      scale: [1, 1.1, 1],
      backgroundColor: ['#10b981', '#059669', '#10b981'],
    },
    transition: { duration: 0.8, ease: 'easeOut' },
  },

  complianceUpdate: {
    animate: {
      scale: [1, 1.05, 1],
      boxShadow: [
        '0 0 0 0 rgba(16, 185, 129, 0.7)',
        '0 0 0 10px rgba(16, 185, 129, 0)',
      ],
    },
    transition: { duration: 1.2, ease: 'easeOut' },
  },

  deadlineUrgent: {
    animate: {
      backgroundColor: ['#fef2f2', '#fed7d7', '#fef2f2'],
      borderColor: ['#ef4444', '#dc2626', '#ef4444'],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },

  // Data visualization
  chartDataUpdate: {
    animate: { scale: [1, 1.02, 1] },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  kpiCardHighlight: {
    whileHover: {
      y: -4,
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
    },
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  // Form interactions
  formFieldFocus: {
    whileFocus: {
      scale: 1.02,
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  formSubmissionSuccess: {
    animate: {
      scale: [1, 1.05, 1],
      backgroundColor: ['#f0fdf4', '#dcfce7', '#f0fdf4'],
    },
    transition: { duration: 0.6, ease: 'easeOut' },
  },

  // Mobile-specific
  mobileCardSwipe: {
    whileTap: { scale: 0.98 },
    drag: 'x',
    dragConstraints: { left: -100, right: 100 },
    dragElastic: 0.7,
  },

  mobilePullToRefresh: {
    drag: 'y',
    dragConstraints: { top: 0, bottom: 100 },
    dragElastic: 0.3,
  },
};

// Utility functions for animation timing
export const calculateStaggerDelay = (index: number, baseDelay = 0.1): number => {
  return index * baseDelay;
};

export const createSequentialAnimation = (
  items: number,
  baseDelay = 0.1
): Record<string, any> => ({
  animate: {
    transition: {
      staggerChildren: baseDelay,
      delayChildren: baseDelay,
    },
  },
});

export const createBusinessMetricAnimation = (
  value: number,
  previousValue: number
): Record<string, any> => {
  const isPositive = value > previousValue;
  const change = Math.abs(value - previousValue);
  const significantChange = change > previousValue * 0.1; // 10% threshold

  if (!significantChange) {
    return {
      animate: { opacity: [0.8, 1] },
      transition: { duration: 0.3 },
    };
  }

  return {
    animate: {
      scale: [1, 1.1, 1],
      color: isPositive ? ['#000000', '#10b981', '#000000'] : ['#000000', '#ef4444', '#000000'],
    },
    transition: { duration: 0.8, ease: 'easeOut' },
  };
};

// Animation orchestration helpers
export class AnimationOrchestrator {
  private activeAnimations = new Set<string>();
  private maxConcurrent = 10;

  public canStartAnimation(id: string): boolean {
    return this.activeAnimations.size < this.maxConcurrent;
  }

  public startAnimation(id: string): void {
    this.activeAnimations.add(id);
  }

  public endAnimation(id: string): void {
    this.activeAnimations.delete(id);
  }

  public getActiveCount(): number {
    return this.activeAnimations.size;
  }

  public clearAll(): void {
    this.activeAnimations.clear();
  }
}

export const animationOrchestrator = new AnimationOrchestrator();

// Integration helpers for existing components
export const withAnimation = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  animationProps: Record<string, any> = {}
) => {
  return React.forwardRef<any, T>((props, ref) => {
    return (
      <motion.div {...animationProps}>
        <Component {...props} ref={ref} />
      </motion.div>
    );
  });
};

// Performance optimization utilities
export const optimizeForMobile = (baseConfig: Record<string, any>) => ({
  ...baseConfig,
  transition: {
    ...baseConfig.transition,
    duration: Math.min(baseConfig.transition?.duration || 0.3, 0.2),
  },
  willChange: 'transform',
});

export const optimizeForLowPower = (baseConfig: Record<string, any>) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.1 },
});

// Type-safe animation variant builders
export const buildTaxServiceAnimation = (
  context: 'filing' | 'compliance' | 'document' | 'client',
  action: 'enter' | 'update' | 'success' | 'error'
): Record<string, any> => {
  const contextConfig = {
    filing: { color: '#3b82f6', delay: 0.1 },
    compliance: { color: '#10b981', delay: 0.2 },
    document: { color: '#f59e0b', delay: 0.15 },
    client: { color: '#8b5cf6', delay: 0.1 },
  };

  const actionConfig = {
    enter: { scale: [0.9, 1], duration: 0.4 },
    update: { scale: [1, 1.05, 1], duration: 0.6 },
    success: { backgroundColor: ['transparent', contextConfig[context].color + '20', 'transparent'] },
    error: { x: [0, -10, 10, -10, 10, 0], duration: 0.5 },
  };

  return {
    animate: actionConfig[action],
    transition: {
      duration: actionConfig[action].duration || 0.3,
      delay: contextConfig[context].delay,
      ease: 'easeOut',
    },
  };
};