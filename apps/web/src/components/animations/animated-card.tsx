/**
 * Animated Card Component
 * Enhanced card with hover effects, loading states, and smooth transitions
 */

'use client';

import React, { forwardRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useAnimation, useReducedMotion } from '@/lib/animations/context';
import { Card, type CardProps } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends CardProps {
  animationType?: 'default' | 'hover' | 'tilt' | 'glow' | 'business' | 'minimal';
  loading?: boolean;
  interactive?: boolean;
  staggerDelay?: number;
  elevation?: 'none' | 'low' | 'medium' | 'high';
  children: React.ReactNode;
}

const cardVariants = {
  default: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    whileHover: { y: -4, scale: 1.02 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  hover: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    whileHover: {
      scale: 1.05,
      rotate: [0, 1, -1, 0],
      transition: { duration: 0.2 },
    },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  tilt: {
    initial: { opacity: 0, rotateY: -15 },
    animate: { opacity: 1, rotateY: 0 },
    whileHover: { rotateY: 5, scale: 1.02 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  glow: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    whileHover: {
      y: -8,
      boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)',
      transition: { duration: 0.2 },
    },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  business: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    whileHover: {
      y: -2,
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  minimal: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    whileHover: { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
    transition: { duration: 0.2 },
  },
};

const loadingVariants = {
  animate: {
    background: [
      'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
      'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
      'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
    ],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear',
  },
};

const elevationStyles = {
  none: '',
  low: 'shadow-sm',
  medium: 'shadow-md',
  high: 'shadow-lg',
};

export const AnimatedCard = forwardRef<
  React.ElementRef<typeof Card>,
  AnimatedCardProps
>(({
  className,
  animationType = 'default',
  loading = false,
  interactive = false,
  staggerDelay = 0,
  elevation = 'low',
  children,
  ...props
}, ref) => {
  const { config } = useAnimation();
  const isReducedMotion = useReducedMotion();

  // Mouse tracking for tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || animationType !== 'tilt') return;

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    if (!interactive || animationType !== 'tilt') return;
    mouseX.set(0);
    mouseY.set(0);
  };

  const getAnimationProps = () => {
    if (isReducedMotion || !config.enabled) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.1 },
      };
    }

    const baseVariants = cardVariants[animationType];

    if (animationType === 'tilt' && interactive) {
      return {
        ...baseVariants,
        style: { rotateX, rotateY },
        transition: { ...baseVariants.transition, delay: staggerDelay },
      };
    }

    return {
      ...baseVariants,
      transition: { ...baseVariants.transition, delay: staggerDelay },
    };
  };

  const animationProps = getAnimationProps();

  if (loading) {
    return (
      <motion.div
        className={cn(
          'rounded-lg border bg-card text-card-foreground',
          elevationStyles[elevation],
          className
        )}
        {...loadingVariants}
        style={{
          willChange: config.enableGPUAcceleration ? 'background' : 'auto',
        }}
      >
        <div className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded-md animate-pulse" />
            <div className="h-4 bg-gray-300 rounded-md w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-300 rounded-md w-1/2 animate-pulse" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      {...animationProps}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        willChange: config.enableGPUAcceleration ? 'transform' : 'auto',
        perspective: 1000,
        ...animationProps.style,
      }}
    >
      <Card
        ref={ref}
        className={cn(
          'transition-all duration-200',
          elevationStyles[elevation],
          interactive && 'cursor-pointer',
          animationType === 'tilt' && 'transform-gpu',
          className
        )}
        {...props}
      >
        {children}
      </Card>
    </motion.div>
  );
});

AnimatedCard.displayName = 'AnimatedCard';