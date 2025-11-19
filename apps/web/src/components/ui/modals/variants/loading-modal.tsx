'use client';

import React, { memo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModalConfig } from '../modal-context';

interface LoadingModalProps {
  modal: ModalConfig;
  onClose: () => void;
}

export const LoadingModal = memo(function LoadingModal({
  modal,
  onClose
}: LoadingModalProps) {
  const { title, description, props = {}, onCancel } = modal;
  const {
    progress,
    cancelable = false,
    showPercentage = true,
    animation = 'spin',
    size = 'md',
  } = props;

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const renderSpinner = () => {
    switch (animation) {
      case 'pulse':
        return (
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
        );

      case 'bounce':
        return (
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        );

      case 'bars':
        return (
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-6 bg-primary animate-pulse"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s',
                }}
              />
            ))}
          </div>
        );

      default:
        return (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        );
    }
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="p-8 text-center">
      {/* Cancel button for cancelable modals */}
      {cancelable && (
        <button
          type="button"
          onClick={handleCancel}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-accent transition-colors"
          aria-label="Cancel loading"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Loading spinner */}
      <div className="flex justify-center mb-6">
        {renderSpinner()}
      </div>

      {/* Title */}
      {title && (
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
      )}

      {/* Description */}
      {description && (
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      )}

      {/* Progress bar */}
      {typeof progress === 'number' && (
        <div className="space-y-2">
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>

          {showPercentage && (
            <div className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </div>
          )}
        </div>
      )}

      {/* Indeterminate progress */}
      {progress === undefined && (
        <div className="w-full bg-secondary rounded-full h-1 overflow-hidden">
          <div className="h-full bg-primary animate-pulse"></div>
        </div>
      )}

      {/* Cancel button at bottom for better UX */}
      {cancelable && (
        <div className="mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm border border-border rounded hover:bg-accent transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
});