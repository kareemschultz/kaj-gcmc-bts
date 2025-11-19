'use client';

import React, { memo, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModalConfig } from '../modal-context';

interface ToastModalProps {
  modal: ModalConfig;
  onClose: () => void;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: {
    container: 'border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20',
    icon: 'text-green-500',
    title: 'text-green-800 dark:text-green-200',
    description: 'text-green-700 dark:text-green-300',
  },
  error: {
    container: 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20',
    icon: 'text-red-500',
    title: 'text-red-800 dark:text-red-200',
    description: 'text-red-700 dark:text-red-300',
  },
  warning: {
    container: 'border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
    icon: 'text-yellow-500',
    title: 'text-yellow-800 dark:text-yellow-200',
    description: 'text-yellow-700 dark:text-yellow-300',
  },
  info: {
    container: 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
    icon: 'text-blue-500',
    title: 'text-blue-800 dark:text-blue-200',
    description: 'text-blue-700 dark:text-blue-300',
  },
};

export const ToastModal = memo(function ToastModal({
  modal,
  onClose
}: ToastModalProps) {
  const { title, description, props = {}, autoClose } = modal;
  const {
    type = 'info' as keyof typeof toastStyles,
    action,
    persistent = false,
    showProgress = true,
  } = props;

  const [progress, setProgress] = React.useState(100);

  const Icon = toastIcons[type];
  const styles = toastStyles[type];

  // Auto-close progress
  useEffect(() => {
    if (!autoClose || persistent) return;

    const duration = autoClose;
    const interval = 50; // Update every 50ms
    const totalSteps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress((1 - currentStep / totalSteps) * 100);

      if (currentStep >= totalSteps) {
        clearInterval(timer);
        onClose();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [autoClose, persistent, onClose]);

  return (
    <div className={cn(
      'relative p-4 rounded-lg shadow-lg min-w-[320px] max-w-md',
      styles.container
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', styles.icon)} />

        <div className="flex-1 space-y-1">
          <h4 className={cn('font-medium text-sm', styles.title)}>
            {title}
          </h4>

          {description && (
            <p className={cn('text-sm', styles.description)}>
              {description}
            </p>
          )}

          {action && (
            <button
              type="button"
              onClick={() => {
                action.onClick();
                if (!persistent) onClose();
              }}
              className={cn(
                'text-sm font-medium underline hover:no-underline mt-2',
                styles.title
              )}
            >
              {action.label}
            </button>
          )}
        </div>

        {!persistent && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors',
              styles.icon
            )}
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      {showProgress && autoClose && !persistent && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 rounded-b-lg overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-75 ease-linear',
              type === 'success' && 'bg-green-500',
              type === 'error' && 'bg-red-500',
              type === 'warning' && 'bg-yellow-500',
              type === 'info' && 'bg-blue-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
});