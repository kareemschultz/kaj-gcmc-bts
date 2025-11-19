'use client';

// Context and hooks
export {
  ModalProvider,
  useModal,
  useConfirmationModal,
  useLoadingModal,
  useToastModal,
  type ModalConfig
} from './modal-context';

// Main modal renderer
export { ModalRenderer } from './modal-renderer';

// Optimized and responsive renderers
export {
  OptimizedModalRenderer,
  useModalPreloader,
  useModalPerformance
} from './optimized-modal';
export { ResponsiveModalRenderer } from './responsive-modal';

// Provider setup
export {
  ModalSystem,
  ModalSystemProvider,
  useModalSystemConfig,
  useModalSystemHealth,
  ModalDeveloperTools
} from './modal-provider-setup';

// Modal variants
export { ConfirmationModal } from './variants/confirmation-modal';
export { FormModal } from './variants/form-modal';
export { GalleryModal } from './variants/gallery-modal';
export { WizardModal } from './variants/wizard-modal';
export { LoadingModal } from './variants/loading-modal';
export { ToastModal } from './variants/toast-modal';

// Utility hooks
export { useFocusTrap } from './hooks/use-focus-trap';
export { useKeyboard } from './hooks/use-keyboard';
export { useOutsideClick } from './hooks/use-outside-click';

// Modal utilities and shortcuts
export * from './modal-utils';

// Business-specific modal examples
export * from './examples/business-modals';

// Showcase component
export { ModalShowcase } from './examples/modal-showcase';