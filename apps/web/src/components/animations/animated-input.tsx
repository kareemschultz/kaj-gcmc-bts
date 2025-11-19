/**
 * Animated Input Component
 * Enhanced input with focus states, validation feedback, and smooth transitions
 */

'use client';

import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimation, useReducedMotion } from '@/lib/animations/context';
import { Input, type InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface AnimatedInputProps extends InputProps {
  label?: string;
  error?: string;
  success?: boolean;
  loading?: boolean;
  floatingLabel?: boolean;
  animationType?: 'default' | 'business' | 'minimal' | 'enhanced';
  helpText?: string;
}

const containerVariants = {
  default: {
    transition: { staggerChildren: 0.1 },
  },
};

const labelVariants = {
  floating: {
    initial: { y: 0, scale: 1, color: '#6b7280' },
    focused: { y: -20, scale: 0.85, color: '#3b82f6' },
    filled: { y: -20, scale: 0.85, color: '#6b7280' },
    error: { y: -20, scale: 0.85, color: '#ef4444' },
    success: { y: -20, scale: 0.85, color: '#10b981' },
  },
  static: {
    initial: { opacity: 1 },
    focused: { color: '#3b82f6' },
    error: { color: '#ef4444' },
    success: { color: '#10b981' },
  },
};

const inputVariants = {
  default: {
    initial: { borderColor: '#d1d5db' },
    focused: {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
    error: {
      borderColor: '#ef4444',
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
    },
    success: {
      borderColor: '#10b981',
      boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)',
    },
  },
  business: {
    initial: { borderColor: '#d1d5db', backgroundColor: '#ffffff' },
    focused: {
      borderColor: '#3b82f6',
      backgroundColor: '#fafbff',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
      scale: 1.01,
    },
    error: {
      borderColor: '#ef4444',
      backgroundColor: '#fef7f7',
      x: [0, -5, 5, -5, 5, 0],
    },
    success: {
      borderColor: '#10b981',
      backgroundColor: '#f0fdf8',
      scale: [1, 1.02, 1],
    },
  },
  minimal: {
    initial: { borderBottomColor: '#d1d5db' },
    focused: { borderBottomColor: '#3b82f6', borderBottomWidth: 2 },
    error: { borderBottomColor: '#ef4444', borderBottomWidth: 2 },
    success: { borderBottomColor: '#10b981', borderBottomWidth: 2 },
  },
  enhanced: {
    initial: {
      borderColor: '#d1d5db',
      background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
    },
    focused: {
      borderColor: '#3b82f6',
      background: 'linear-gradient(135deg, #fafbff 0%, #f0f7ff 100%)',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
      y: -2,
    },
    error: {
      borderColor: '#ef4444',
      background: 'linear-gradient(135deg, #fef7f7 0%, #fee2e2 100%)',
      x: [0, -8, 8, -8, 8, 0],
    },
    success: {
      borderColor: '#10b981',
      background: 'linear-gradient(135deg, #f0fdf8 0%, #dcfce7 100%)',
      scale: [1, 1.02, 1],
    },
  },
};

const iconVariants = {
  initial: { opacity: 0, scale: 0, rotate: -90 },
  animate: { opacity: 1, scale: 1, rotate: 0 },
  exit: { opacity: 0, scale: 0, rotate: 90 },
};

const helpTextVariants = {
  initial: { opacity: 0, height: 0, y: -10 },
  animate: { opacity: 1, height: 'auto', y: 0 },
  exit: { opacity: 0, height: 0, y: -10 },
};

export const AnimatedInput = forwardRef<
  React.ElementRef<typeof Input>,
  AnimatedInputProps
>(({
  className,
  label,
  error,
  success = false,
  loading = false,
  floatingLabel = false,
  animationType = 'default',
  helpText,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);
  const { config } = useAnimation();
  const isReducedMotion = useReducedMotion();

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0);
    props.onChange?.(e);
  };

  const getInputState = () => {
    if (error) return 'error';
    if (success) return 'success';
    if (isFocused) return 'focused';
    return 'initial';
  };

  const getLabelState = () => {
    if (error) return 'error';
    if (success) return 'success';
    if (isFocused || hasValue) return floatingLabel ? 'focused' : 'focused';
    return 'initial';
  };

  const shouldAnimate = !isReducedMotion && config.enabled;

  const inputMotionProps = shouldAnimate
    ? {
        animate: inputVariants[animationType][getInputState()],
        transition: { duration: 0.2, ease: 'easeOut' },
      }
    : {};

  const labelMotionProps = shouldAnimate
    ? {
        animate: labelVariants[floatingLabel ? 'floating' : 'static'][getLabelState()],
        transition: { duration: 0.2, ease: 'easeOut' },
      }
    : {};

  return (
    <motion.div
      className="relative w-full"
      variants={containerVariants}
      initial="default"
      animate="default"
    >
      {label && !floatingLabel && (
        <motion.div className="mb-2" {...labelMotionProps}>
          <Label
            htmlFor={props.id}
            className={cn(
              'text-sm font-medium transition-colors',
              error && 'text-red-500',
              success && 'text-green-600'
            )}
          >
            {label}
          </Label>
        </motion.div>
      )}

      <div className="relative">
        <motion.div {...inputMotionProps}>
          <Input
            ref={ref}
            className={cn(
              'transition-all duration-200',
              floatingLabel && 'pt-6 pb-2',
              animationType === 'minimal' &&
                'border-0 border-b-2 rounded-none bg-transparent focus-visible:ring-0',
              error && 'border-red-500 focus-visible:ring-red-500/20',
              success && 'border-green-500 focus-visible:ring-green-500/20',
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
        </motion.div>

        {floatingLabel && label && (
          <motion.div
            className="absolute left-3 top-3 pointer-events-none origin-left"
            {...labelMotionProps}
          >
            <Label
              className={cn(
                'text-sm transition-colors',
                error && 'text-red-500',
                success && 'text-green-600'
              )}
            >
              {label}
            </Label>
          </motion.div>
        )}

        {/* Status Icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                variants={iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              </motion.div>
            )}
            {!loading && error && (
              <motion.div
                key="error"
                variants={iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <AlertCircle className="h-4 w-4 text-red-500" />
              </motion.div>
            )}
            {!loading && !error && success && (
              <motion.div
                key="success"
                variants={iconVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Help Text and Error Messages */}
      <AnimatePresence>
        {(error || helpText) && (
          <motion.div
            variants={helpTextVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="mt-2 text-sm"
          >
            {error ? (
              <p className="text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            ) : (
              <p className="text-gray-600">{helpText}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

AnimatedInput.displayName = 'AnimatedInput';