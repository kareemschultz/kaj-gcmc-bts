'use client';

import React, { memo } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModalConfig } from '../modal-context';

interface ConfirmationModalProps {
  modal: ModalConfig;
  onClose: () => void;
}

const iconMap = {
  danger: AlertTriangle,
  warning: AlertCircle,
  success: CheckCircle,
  info: Info,
};

const iconColorMap = {
  danger: 'text-red-500',
  warning: 'text-yellow-500',
  success: 'text-green-500',
  info: 'text-blue-500',
};

const buttonColorMap = {
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  success: 'bg-green-500 hover:bg-green-600 text-white',
  info: 'bg-blue-500 hover:bg-blue-600 text-white',
};

export const ConfirmationModal = memo(function ConfirmationModal({
  modal,
  onClose
}: ConfirmationModalProps) {
  const { title, description, onConfirm, onCancel, props = {} } = modal;
  const {
    variant = 'danger',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    showIcon = true,
    loading = false,
  } = props;

  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    if (loading || isLoading) return;

    try {
      setIsLoading(true);
      if (onConfirm) {
        await onConfirm();
      }
      onClose();
    } catch (error) {
      console.error('Error in confirmation modal:', error);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading || isLoading) return;

    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const Icon = iconMap[variant];

  return (
    <div className="p-6">
      {showIcon && (
        <div className="flex justify-center mb-4">
          <div className={cn(
            'rounded-full p-3 bg-gray-100 dark:bg-gray-800',
            iconColorMap[variant]
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      )}

      {title && (
        <h3 className="text-lg font-semibold text-center mb-2">{title}</h3>
      )}

      {description && (
        <p className="text-muted-foreground text-center mb-6 text-sm leading-relaxed">
          {description}
        </p>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading || isLoading}
          className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || isLoading}
          className={cn(
            'px-4 py-2 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2',
            buttonColorMap[variant]
          )}
        >
          {(loading || isLoading) && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          )}
          {confirmText}
        </button>
      </div>
    </div>
  );
});