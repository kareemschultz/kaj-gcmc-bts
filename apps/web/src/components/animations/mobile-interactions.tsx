/**
 * Mobile-Optimized Touch Interactions
 * Enhanced touch gestures and mobile-specific animations
 */

'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useGesture } from 'react-use-gesture';
import { useAnimation, useReducedMotion } from '@/lib/animations/context';
import { cn } from '@/lib/utils';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 100,
  className,
  disabled = false,
}: SwipeableCardProps) {
  const { config } = useAnimation();
  const isReducedMotion = useReducedMotion();
  const [isDragging, setIsDragging] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-200, 200], [5, -5]);
  const rotateY = useTransform(x, [-200, 200], [-5, 5]);
  const opacity = useTransform(
    x,
    [-threshold * 2, -threshold, 0, threshold, threshold * 2],
    [0.3, 0.8, 1, 0.8, 0.3]
  );

  const shouldAnimate = !isReducedMotion && config.enabled && !disabled;

  const handleDragStart = () => {
    setIsDragging(true);
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);

    const { offset, velocity } = info;
    const swipeThreshold = threshold;
    const swipeVelocityThreshold = 500;

    // Check for horizontal swipes
    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > swipeVelocityThreshold) {
      if (offset.x > 0 && onSwipeRight) {
        onSwipeRight();
        // Success haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]);
        }
      } else if (offset.x < 0 && onSwipeLeft) {
        onSwipeLeft();
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]);
        }
      }
    }

    // Check for vertical swipes
    if (Math.abs(offset.y) > swipeThreshold || Math.abs(velocity.y) > swipeVelocityThreshold) {
      if (offset.y > 0 && onSwipeDown) {
        onSwipeDown();
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]);
        }
      } else if (offset.y < 0 && onSwipeUp) {
        onSwipeUp();
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]);
        }
      }
    }

    // Reset position
    x.set(0);
    y.set(0);
  };

  const dragProps = shouldAnimate ? {
    drag: true,
    dragConstraints: { left: -threshold * 2, right: threshold * 2, top: -threshold, bottom: threshold },
    dragElastic: 0.7,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    style: { x, y, rotateX, rotateY, opacity },
  } : {};

  return (
    <motion.div
      className={cn(
        'touch-pan-y select-none',
        isDragging && 'cursor-grabbing',
        !isDragging && shouldAnimate && 'cursor-grab',
        className
      )}
      whileTap={shouldAnimate ? { scale: 0.98 } : {}}
      {...dragProps}
      style={{
        willChange: config.enableGPUAcceleration ? 'transform' : 'auto',
        ...dragProps.style,
      }}
    >
      {children}
    </motion.div>
  );
}

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const { config } = useAnimation();
  const isReducedMotion = useReducedMotion();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const y = useMotionValue(0);
  const refreshOpacity = useTransform(y, [0, threshold], [0, 1]);
  const refreshScale = useTransform(y, [0, threshold], [0.8, 1]);

  const shouldAnimate = !isReducedMotion && config.enabled && !disabled;

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const { offset, velocity } = info;

    if (offset.y > threshold || velocity.y > 300) {
      setIsRefreshing(true);

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 100, 20]);
      }

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        y.set(0);
        setPullDistance(0);
      }
    } else {
      // Reset position
      y.set(0);
      setPullDistance(0);
    }
  };

  const handleDrag = (event: any, info: PanInfo) => {
    const currentY = Math.max(0, info.offset.y);
    setPullDistance(currentY);

    // Light haptic feedback during drag
    if (currentY > threshold && 'vibrate' in navigator) {
      navigator.vibrate(5);
    }
  };

  const dragProps = shouldAnimate ? {
    drag: 'y',
    dragConstraints: { top: 0, bottom: threshold * 1.5 },
    dragElastic: 0.3,
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
    style: { y },
  } : {};

  return (
    <div className="relative overflow-hidden">
      {/* Pull to refresh indicator */}
      {shouldAnimate && (
        <motion.div
          className="absolute top-0 left-0 right-0 flex items-center justify-center h-16 -mt-16 bg-white z-10"
          style={{
            opacity: refreshOpacity,
            scale: refreshScale,
          }}
        >
          <div className="flex items-center space-x-2 text-gray-600">
            <motion.div
              className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full"
              animate={isRefreshing ? { rotate: 360 } : {}}
              transition={{
                duration: 1,
                repeat: isRefreshing ? Infinity : 0,
                ease: 'linear',
              }}
            />
            <span className="text-sm">
              {isRefreshing ? 'Refreshing...' : pullDistance > threshold ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <motion.div
        className="relative"
        {...dragProps}
      >
        {children}
      </motion.div>
    </div>
  );
}

interface TouchFeedbackProps {
  children: React.ReactNode;
  feedbackType?: 'scale' | 'opacity' | 'highlight' | 'ripple';
  intensity?: 'light' | 'medium' | 'strong';
  disabled?: boolean;
  onTouch?: () => void;
}

export function TouchFeedback({
  children,
  feedbackType = 'scale',
  intensity = 'medium',
  disabled = false,
  onTouch,
}: TouchFeedbackProps) {
  const { config } = useAnimation();
  const isReducedMotion = useReducedMotion();
  const [isTouching, setIsTouching] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const shouldAnimate = !isReducedMotion && config.enabled && !disabled;

  const intensityValues = {
    light: { scale: 0.98, opacity: 0.8 },
    medium: { scale: 0.95, opacity: 0.7 },
    strong: { scale: 0.9, opacity: 0.6 },
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    setIsTouching(true);
    onTouch?.();

    // Haptic feedback
    if ('vibrate' in navigator && intensity !== 'light') {
      navigator.vibrate(intensity === 'strong' ? 20 : 10);
    }

    // Create ripple effect
    if (feedbackType === 'ripple' && shouldAnimate) {
      const rect = event.currentTarget.getBoundingClientRect();
      const touch = event.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const newRipple = { id: Date.now(), x, y };
      setRipples(prev => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }
  };

  const handleTouchEnd = () => {
    setIsTouching(false);
  };

  const getFeedbackProps = () => {
    if (!shouldAnimate) return {};

    switch (feedbackType) {
      case 'scale':
        return {
          animate: isTouching ? { scale: intensityValues[intensity].scale } : { scale: 1 },
          transition: { duration: 0.1, ease: 'easeOut' },
        };

      case 'opacity':
        return {
          animate: isTouching ? { opacity: intensityValues[intensity].opacity } : { opacity: 1 },
          transition: { duration: 0.1, ease: 'easeOut' },
        };

      case 'highlight':
        return {
          animate: isTouching
            ? {
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                scale: intensityValues[intensity].scale,
              }
            : {
                backgroundColor: 'transparent',
                scale: 1,
              },
          transition: { duration: 0.15, ease: 'easeOut' },
        };

      case 'ripple':
        return {
          animate: isTouching ? { scale: intensityValues[intensity].scale } : { scale: 1 },
          transition: { duration: 0.1, ease: 'easeOut' },
        };

      default:
        return {};
    }
  };

  return (
    <motion.div
      className="relative overflow-hidden touch-manipulation"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      {...getFeedbackProps()}
      style={{
        willChange: config.enableGPUAcceleration ? 'transform' : 'auto',
      }}
    >
      {children}

      {/* Ripple effects */}
      {feedbackType === 'ripple' && shouldAnimate && (
        <div className="absolute inset-0 pointer-events-none">
          {ripples.map(ripple => (
            <motion.div
              key={ripple.id}
              className="absolute bg-blue-400 rounded-full opacity-30"
              initial={{
                width: 0,
                height: 0,
                x: ripple.x,
                y: ripple.y,
                opacity: 0.6,
              }}
              animate={{
                width: 200,
                height: 200,
                x: ripple.x - 100,
                y: ripple.y - 100,
                opacity: 0,
              }}
              transition={{
                duration: 0.6,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

interface PinchZoomProps {
  children: React.ReactNode;
  maxZoom?: number;
  minZoom?: number;
  initialZoom?: number;
  disabled?: boolean;
}

export function PinchZoom({
  children,
  maxZoom = 3,
  minZoom = 0.5,
  initialZoom = 1,
  disabled = false,
}: PinchZoomProps) {
  const { config } = useAnimation();
  const isReducedMotion = useReducedMotion();
  const scale = useSpring(initialZoom);
  const x = useSpring(0);
  const y = useSpring(0);

  const shouldAnimate = !isReducedMotion && config.enabled && !disabled;

  const bind = useGesture(
    {
      onPinch: ({ offset: [d], origin: [ox, oy], first, memo }) => {
        if (!shouldAnimate) return;

        if (first) {
          const { width, height, x: rx, y: ry } = memo || {
            width: 0,
            height: 0,
            x: 0,
            y: 0,
          };
          return { width, height, x: rx, y: ry };
        }

        const newScale = Math.max(minZoom, Math.min(maxZoom, d));
        scale.set(newScale);

        // Haptic feedback for zoom levels
        if ('vibrate' in navigator && Math.abs(newScale - 1) > 0.5) {
          navigator.vibrate(5);
        }

        return memo;
      },

      onDrag: ({ offset: [dx, dy], pinching }) => {
        if (!shouldAnimate || pinching) return;

        x.set(dx);
        y.set(dy);
      },

      onWheel: ({ offset: [, dy] }) => {
        if (!shouldAnimate) return;

        const newScale = Math.max(
          minZoom,
          Math.min(maxZoom, scale.get() - dy * 0.01)
        );
        scale.set(newScale);
      },
    },
    {
      drag: { filterTaps: true },
      pinch: { scaleBounds: { min: minZoom, max: maxZoom } },
      wheel: { preventDefault: true },
    }
  );

  if (!shouldAnimate) {
    return <div className="w-full h-full">{children}</div>;
  }

  return (
    <div className="w-full h-full overflow-hidden touch-none">
      <motion.div
        {...bind()}
        style={{
          scale,
          x,
          y,
          willChange: config.enableGPUAcceleration ? 'transform' : 'auto',
        }}
        className="w-full h-full origin-center cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
}

// Custom hook for touch gesture handling
export function useTouchGestures() {
  const { config } = useAnimation();
  const isReducedMotion = useReducedMotion();

  const createTouchHandler = useCallback(
    (callback: (type: string, data?: any) => void) => {
      if (!config.enabled || isReducedMotion) return {};

      return {
        onTouchStart: (e: TouchEvent) => {
          if ('vibrate' in navigator) {
            navigator.vibrate(10);
          }
          callback('touchStart', {
            touches: e.touches.length,
            timestamp: Date.now(),
          });
        },

        onTouchMove: (e: TouchEvent) => {
          callback('touchMove', {
            touches: e.touches.length,
            timestamp: Date.now(),
          });
        },

        onTouchEnd: (e: TouchEvent) => {
          callback('touchEnd', {
            touches: e.touches.length,
            timestamp: Date.now(),
          });
        },
      };
    },
    [config.enabled, isReducedMotion]
  );

  const isTouch = useCallback(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  const supportsPressure = useCallback(() => {
    return 'webkitForce' in TouchEvent.prototype;
  }, []);

  return {
    createTouchHandler,
    isTouch,
    supportsPressure,
    isGesturesEnabled: config.enabled && !isReducedMotion,
  };
}