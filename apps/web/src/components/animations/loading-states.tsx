/**
 * Loading State Components
 * Engaging loading animations and progress indicators
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAnimation, useReducedMotion } from '@/lib/animations/context';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'business' | 'bars';
  color?: 'primary' | 'secondary' | 'accent';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const colorClasses = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  accent: 'text-green-600',
};

export function LoadingSpinner({
  size = 'md',
  variant = 'spinner',
  color = 'primary'
}: LoadingSpinnerProps) {
  const { config } = useAnimation();
  const isReducedMotion = useReducedMotion();

  if (variant === 'spinner') {
    return (
      <motion.div
        className={cn(
          'inline-block border-2 border-current border-r-transparent rounded-full',
          sizeClasses[size],
          colorClasses[color]
        )}
        animate={isReducedMotion || !config.enabled ? {} : { rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          willChange: config.enableGPUAcceleration ? 'transform' : 'auto',
        }}
      />
    );
  }

  if (variant === 'dots') {
    return (
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn(
              'rounded-full bg-current',
              size === 'sm' && 'w-1 h-1',
              size === 'md' && 'w-2 h-2',
              size === 'lg' && 'w-3 h-3',
              size === 'xl' && 'w-4 h-4',
              colorClasses[color]
            )}
            animate={isReducedMotion || !config.enabled ? {} : {
              y: [0, -8, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={cn(
          'rounded-full bg-current',
          sizeClasses[size],
          colorClasses[color]
        )}
        animate={isReducedMotion || !config.enabled ? {} : {
          scale: [1, 1.2, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    );
  }

  if (variant === 'business') {
    return (
      <div className="flex items-center space-x-2">
        <motion.div
          className={cn(
            'rounded-full bg-current',
            size === 'sm' && 'w-2 h-2',
            size === 'md' && 'w-3 h-3',
            size === 'lg' && 'w-4 h-4',
            size === 'xl' && 'w-5 h-5',
            colorClasses[color]
          )}
          animate={isReducedMotion || !config.enabled ? {} : {
            x: [0, 20, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className={cn(
            'rounded-full bg-current opacity-60',
            size === 'sm' && 'w-2 h-2',
            size === 'md' && 'w-3 h-3',
            size === 'lg' && 'w-4 h-4',
            size === 'xl' && 'w-5 h-5',
            colorClasses[color]
          )}
          animate={isReducedMotion || !config.enabled ? {} : {
            x: [0, 20, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: 0.3,
            ease: 'easeInOut',
          }}
        />
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className="flex space-x-1">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            className={cn(
              'bg-current rounded-sm',
              size === 'sm' && 'w-1 h-4',
              size === 'md' && 'w-1.5 h-6',
              size === 'lg' && 'w-2 h-8',
              size === 'xl' && 'w-3 h-10',
              colorClasses[color]
            )}
            animate={isReducedMotion || !config.enabled ? {} : {
              scaleY: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}

interface ProgressBarProps {
  progress: number;
  animated?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'business' | 'gradient';
  label?: string;
}

export function ProgressBar({
  progress,
  animated = true,
  showPercentage = false,
  size = 'md',
  variant = 'default',
  label,
}: ProgressBarProps) {
  const { config } = useAnimation();
  const isReducedMotion = useReducedMotion();

  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const shouldAnimate = animated && !isReducedMotion && config.enabled;

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <motion.span
              className="text-sm text-gray-600"
              animate={shouldAnimate ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {Math.round(progress)}%
            </motion.span>
          )}
        </div>
      )}

      <div
        className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          heightClasses[size]
        )}
      >
        <motion.div
          className={cn(
            'rounded-full transition-all duration-300',
            variant === 'default' && 'bg-blue-600',
            variant === 'business' && 'bg-gradient-to-r from-blue-600 to-blue-700',
            variant === 'gradient' && 'bg-gradient-to-r from-green-400 via-blue-500 to-purple-600',
            heightClasses[size]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          transition={{
            duration: shouldAnimate ? 0.5 : 0.1,
            ease: 'easeOut',
          }}
          style={{
            willChange: config.enableGPUAcceleration ? 'width' : 'auto',
          }}
        >
          {variant === 'business' && shouldAnimate && (
            <motion.div
              className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
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
        </motion.div>
      </div>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  lines?: number;
  animated?: boolean;
}

export function Skeleton({
  className,
  lines = 1,
  animated = true,
}: SkeletonProps) {
  const { config } = useAnimation();
  const isReducedMotion = useReducedMotion();

  const shouldAnimate = animated && !isReducedMotion && config.enabled;

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <motion.div
            key={i}
            className={cn(
              'h-4 bg-gray-200 rounded',
              i === lines - 1 && 'w-3/4',
              className
            )}
            animate={shouldAnimate ? {
              backgroundColor: [
                '#e5e7eb',
                '#f3f4f6',
                '#e5e7eb',
              ],
            } : {}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={cn('h-4 bg-gray-200 rounded', className)}
      animate={shouldAnimate ? {
        backgroundColor: [
          '#e5e7eb',
          '#f3f4f6',
          '#e5e7eb',
        ],
      } : {}}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  variant?: 'default' | 'blur' | 'business';
}

export function LoadingOverlay({
  isLoading,
  children,
  message = 'Loading...',
  variant = 'default',
}: LoadingOverlayProps) {
  const { config } = useAnimation();
  const isReducedMotion = useReducedMotion();

  return (
    <div className="relative">
      {children}
      {isLoading && (
        <motion.div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            variant === 'default' && 'bg-white/80',
            variant === 'blur' && 'bg-white/60 backdrop-blur-sm',
            variant === 'business' && 'bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-sm'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: isReducedMotion ? 0.1 : 0.2,
          }}
        >
          <div className="text-center">
            <LoadingSpinner variant="business" size="lg" />
            {message && (
              <motion.p
                className="mt-4 text-sm text-gray-600"
                animate={!isReducedMotion && config.enabled ? {
                  opacity: [0.5, 1, 0.5],
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {message}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}