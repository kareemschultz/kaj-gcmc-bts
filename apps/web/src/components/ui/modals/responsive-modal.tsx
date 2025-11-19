'use client';

import React, { memo, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModal, type ModalConfig } from './modal-context';
import { useFocusTrap } from './hooks/use-focus-trap';
import { useKeyboard } from './hooks/use-keyboard';

interface ResponsiveModalProps {
  modal: ModalConfig;
  onClose: () => void;
}

// Hook to detect mobile/touch devices
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Enhanced modal animations for mobile
const mobileVariants = {
  slideUp: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
  },
  slideDown: {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 },
  },
  slideLeft: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
  },
  slideRight: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
  },
  fade: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
};

const desktopVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slide: {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
  },
};

export const ResponsiveModal = memo(function ResponsiveModal({
  modal,
  onClose
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();
  const {
    id,
    size = 'md',
    position = 'center',
    animation = 'fade',
    backdrop = 'blur',
    dismissible = true,
    autoClose,
    zIndex = 1000,
    className,
    overlayClassName,
    type,
  } = modal;

  const modalRef = React.useRef<HTMLDivElement>(null);
  const [dragProgress, setDragProgress] = React.useState(0);

  // Auto close functionality
  useEffect(() => {
    if (autoClose && autoClose > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoClose);

      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  // Focus trap
  useFocusTrap(modalRef, true);

  // Keyboard handling
  const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && dismissible) {
      event.preventDefault();
      onClose();
    }
  }, [dismissible, onClose]);

  useKeyboard(handleKeyDown);

  // Prevent body scroll
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Responsive size classes
  const responsiveSizeClasses = useMemo(() => {
    const baseClasses = {
      xs: isMobile ? 'w-full max-w-sm mx-4' : 'max-w-xs',
      sm: isMobile ? 'w-full max-w-md mx-4' : 'max-w-sm',
      md: isMobile ? 'w-full max-w-lg mx-4' : 'max-w-md',
      lg: isMobile ? 'w-full max-w-xl mx-4' : 'max-w-lg',
      xl: isMobile ? 'w-full max-w-2xl mx-4' : 'max-w-xl',
      '2xl': isMobile ? 'w-full max-w-4xl mx-4' : 'max-w-2xl',
      full: 'w-full h-full max-w-none',
    };

    return baseClasses[size];
  }, [size, isMobile]);

  // Responsive position classes
  const responsivePositionClasses = useMemo(() => {
    if (isMobile) {
      // On mobile, most modals should be bottom-aligned for better UX
      const mobilePositions = {
        center: 'items-end justify-center',
        top: 'items-start justify-center pt-4',
        bottom: 'items-end justify-center',
        left: 'items-end justify-center',
        right: 'items-end justify-center',
      };
      return mobilePositions[position];
    }

    const desktopPositions = {
      center: 'items-center justify-center',
      top: 'items-start justify-center pt-16',
      bottom: 'items-end justify-center pb-16',
      left: 'items-center justify-start pl-16',
      right: 'items-center justify-end pr-16',
    };

    return desktopPositions[position];
  }, [position, isMobile]);

  // Choose animation variants based on device and modal type
  const variants = useMemo(() => {
    if (isMobile) {
      // Use mobile-specific animations
      if (type === 'toast') return mobileVariants.slideDown;
      if (position === 'bottom' || position === 'center') return mobileVariants.slideUp;
      if (position === 'top') return mobileVariants.slideDown;
      if (position === 'left') return mobileVariants.slideLeft;
      if (position === 'right') return mobileVariants.slideRight;
      return mobileVariants.fade;
    }

    return desktopVariants[animation] || desktopVariants.fade;
  }, [isMobile, animation, position, type]);

  // Handle swipe to dismiss on mobile
  const handleDrag = React.useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isMobile || !dismissible) return;

    const { offset } = info;
    const progress = Math.abs(offset.y) / 200; // 200px swipe distance
    setDragProgress(Math.min(progress, 1));
  }, [isMobile, dismissible]);

  const handleDragEnd = React.useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isMobile || !dismissible) return;

    const { offset, velocity } = info;
    const swipeThreshold = 100;
    const velocityThreshold = 500;

    if (
      Math.abs(offset.y) > swipeThreshold ||
      Math.abs(velocity.y) > velocityThreshold
    ) {
      onClose();
    } else {
      setDragProgress(0);
    }
  }, [isMobile, dismissible, onClose]);

  const handleOverlayClick = React.useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && dismissible) {
      onClose();
    }
  }, [dismissible, onClose]);

  const backdropClasses = {
    blur: 'backdrop-blur-sm bg-black/30',
    dark: 'bg-black/50',
    transparent: 'bg-black/20',
    none: '',
  };

  return createPortal(
    <motion.div
      key={id}
      className={cn(
        'fixed inset-0 z-50 flex',
        responsivePositionClasses,
        backdropClasses[backdrop],
        overlayClassName
      )}
      style={{ zIndex }}
      onClick={handleOverlayClick}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
    >
      <motion.div
        ref={modalRef}
        className={cn(
          'relative bg-background shadow-2xl overflow-hidden',
          // Responsive sizing and spacing
          responsiveSizeClasses,
          // Mobile-specific styles
          isMobile && 'mx-0 mb-0',
          // Rounded corners - less on mobile
          isMobile ? 'rounded-t-xl' : 'rounded-lg',
          // Full screen on mobile for certain modal types
          (isMobile && (type === 'gallery' || type === 'wizard' || size === 'full')) &&
            'w-full h-full max-w-none rounded-none',
          className
        )}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth animation
        }}
        drag={isMobile && dismissible ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClick={(e) => e.stopPropagation()}
        style={{
          opacity: 1 - dragProgress * 0.5,
          transform: `translateY(${dragProgress * 50}px)`,
        }}
      >
        {/* Mobile drag indicator */}
        {isMobile && dismissible && (
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Close button */}
        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'absolute z-10 p-2 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors',
              isMobile ? 'top-2 right-2' : 'top-4 right-4'
            )}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Modal content container */}
        <div
          className={cn(
            'relative h-full',
            // Add padding for mobile drag indicator
            isMobile && dismissible && 'pt-1'
          )}
        >
          {modal.content || modal.component ? (
            modal.component ? (
              <modal.component {...modal.props} onClose={onClose} modal={modal} />
            ) : (
              modal.content
            )
          ) : (
            <div className="p-6">
              <div className="text-center text-muted-foreground">
                Modal content not found
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
});

// Enhanced modal renderer that uses ResponsiveModal
export function ResponsiveModalRenderer() {
  const { state, closeModal } = useModal();

  return (
    <AnimatePresence mode="multiple">
      {state.modals.map((modal) => (
        <ResponsiveModal
          key={modal.id}
          modal={modal}
          onClose={() => closeModal(modal.id)}
        />
      ))}
    </AnimatePresence>
  );
}