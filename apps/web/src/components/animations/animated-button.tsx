/**
 * Animated Button Component
 * Enhanced button with sophisticated micro-interactions
 */

'use client';

import React, { forwardRef } from 'react';
import { motion, type MotionProps } from 'framer-motion';
import { useAnimation, useReducedMotion } from '@/lib/animations/context';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends Omit<ButtonProps, 'asChild'>, Omit<MotionProps, 'children'> {
  animationType?: 'default' | 'bounce' | 'pulse' | 'glow' | 'slide' | 'business';
  loadingAnimation?: boolean;
  successAnimation?: boolean;
  errorAnimation?: boolean;
  children: React.ReactNode;
}

const animationVariants = {
  default: {
    whileHover: { scale: 1.02, y: -2 },
    whileTap: { scale: 0.98, y: 0 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },
  bounce: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { type: 'spring', stiffness: 600, damping: 10, bounce: 0.4 },
  },
  pulse: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    animate: {
      boxShadow: [
        '0 0 0 0 rgba(59, 130, 246, 0.7)',
        '0 0 0 10px rgba(59, 130, 246, 0)',
        '0 0 0 0 rgba(59, 130, 246, 0)',
      ],
    },
    transition: {
      boxShadow: { duration: 2, repeat: Infinity },
      scale: { type: 'spring', stiffness: 400, damping: 17 },
    },
  },
  glow: {
    whileHover: {
      scale: 1.02,
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)',
      filter: 'brightness(1.1)',
    },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.2 },
  },
  slide: {
    whileHover: { x: 5 },
    whileTap: { x: 0 },
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },
  business: {
    whileHover: {
      scale: 1.02,
      y: -1,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    whileTap: { scale: 0.98, y: 0 },
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

const loadingVariants = {
  animate: {
    opacity: [1, 0.6, 1],
    scale: [1, 0.98, 1],
  },
  transition: {
    duration: 1.2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

const successVariants = {
  animate: {
    scale: [1, 1.05, 1],
    backgroundColor: ['#10b981', '#059669', '#10b981'],
  },
  transition: {
    duration: 0.6,
    ease: 'easeOut',
  },
};

const errorVariants = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    backgroundColor: ['#ef4444', '#dc2626', '#ef4444'],
  },
  transition: {
    duration: 0.5,
    ease: 'easeInOut',
  },
};

export const AnimatedButton = forwardRef<
  React.ElementRef<typeof Button>,
  AnimatedButtonProps
>(({
  className,
  animationType = 'default',
  loadingAnimation = false,
  successAnimation = false,
  errorAnimation = false,
  children,
  ...props
}, ref) => {
  const { config } = useAnimation();
  const isReducedMotion = useReducedMotion();

  const getAnimationProps = () => {
    if (isReducedMotion || !config.enabled) {
      return {};
    }

    const baseVariants = animationVariants[animationType];
    let additionalProps = {};

    if (loadingAnimation) {
      additionalProps = { ...additionalProps, ...loadingVariants };
    }

    if (successAnimation) {
      additionalProps = { ...additionalProps, ...successVariants };
    }

    if (errorAnimation) {
      additionalProps = { ...additionalProps, ...errorVariants };
    }

    return { ...baseVariants, ...additionalProps };
  };

  const animationProps = getAnimationProps();

  return (
    <motion.div
      {...animationProps}
      style={{
        display: 'inline-block',
        willChange: config.enableGPUAcceleration ? 'transform' : 'auto',
      }}
    >
      <Button
        ref={ref}
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          loadingAnimation && 'cursor-not-allowed',
          className
        )}
        disabled={loadingAnimation || props.disabled}
        {...props}
      >
        {loadingAnimation && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}
        <span className={cn(
          'relative z-10',
          loadingAnimation && 'opacity-70'
        )}>
          {children}
        </span>
      </Button>
    </motion.div>
  );
});

AnimatedButton.displayName = 'AnimatedButton';