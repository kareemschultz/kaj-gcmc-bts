"use client";

// Business-specific modal examples
export * from "./examples/business-modals";
// Showcase component
export { ModalShowcase } from "./examples/modal-showcase";
// Utility hooks
export { useFocusTrap } from "./hooks/use-focus-trap";
export { useKeyboard } from "./hooks/use-keyboard";
export { useOutsideClick } from "./hooks/use-outside-click";
// Context and hooks
export {
	type ModalConfig,
	ModalProvider,
	useConfirmationModal,
	useLoadingModal,
	useModal,
	useToastModal,
} from "./modal-context";
// Provider setup
export {
	ModalDeveloperTools,
	ModalSystem,
	ModalSystemProvider,
	useModalSystemConfig,
	useModalSystemHealth,
} from "./modal-provider-setup";
// Main modal renderer
export { ModalRenderer } from "./modal-renderer";
// Modal utilities and shortcuts
export * from "./modal-utils";
// Optimized and responsive renderers
export {
	OptimizedModalRenderer,
	useModalPerformance,
	useModalPreloader,
} from "./optimized-modal";
export { ResponsiveModalRenderer } from "./responsive-modal";
// Modal variants
export { ConfirmationModal } from "./variants/confirmation-modal";
export { FormModal } from "./variants/form-modal";
export { GalleryModal } from "./variants/gallery-modal";
export { LoadingModal } from "./variants/loading-modal";
export { ToastModal } from "./variants/toast-modal";
export { WizardModal } from "./variants/wizard-modal";
