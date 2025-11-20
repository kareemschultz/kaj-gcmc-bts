"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { lazy, memo, Suspense, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { type ModalConfig, useModal } from "./modal-context";

// Lazy load modal variants for better performance
const LazyConfirmationModal = lazy(() =>
	import("./variants/confirmation-modal").then((module) => ({
		default: module.ConfirmationModal,
	})),
);

const LazyFormModal = lazy(() =>
	import("./variants/form-modal").then((module) => ({
		default: module.FormModal,
	})),
);

const LazyGalleryModal = lazy(() =>
	import("./variants/gallery-modal").then((module) => ({
		default: module.GalleryModal,
	})),
);

const LazyWizardModal = lazy(() =>
	import("./variants/wizard-modal").then((module) => ({
		default: module.WizardModal,
	})),
);

const LazyLoadingModal = lazy(() =>
	import("./variants/loading-modal").then((module) => ({
		default: module.LoadingModal,
	})),
);

const LazyToastModal = lazy(() =>
	import("./variants/toast-modal").then((module) => ({
		default: module.ToastModal,
	})),
);

// Loading fallback component
const ModalLoadingFallback = memo(function ModalLoadingFallback() {
	return (
		<div className="flex items-center justify-center p-8">
			<div className="h-6 w-6 animate-spin rounded-full border-primary border-b-2" />
		</div>
	);
});

// Memoized overlay component
const ModalOverlay = memo(function ModalOverlay({
	onClick,
	backdrop,
	className,
	zIndex,
	children,
}: {
	onClick: (e: React.MouseEvent) => void;
	backdrop: string;
	className?: string;
	zIndex: number;
	children: React.ReactNode;
}) {
	const backdropClasses = useMemo(
		() => ({
			blur: "backdrop-blur-sm bg-black/30",
			dark: "bg-black/50",
			transparent: "bg-black/20",
			none: "",
		}),
		[],
	);

	return (
		<motion.div
			className={cn(
				"fixed inset-0 z-50 flex items-center justify-center",
				backdropClasses[backdrop as keyof typeof backdropClasses],
				className,
			)}
			style={{ zIndex }}
			onClick={onClick}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
		>
			{children}
		</motion.div>
	);
});

// Memoized modal container
const ModalContainer = memo(function ModalContainer({
	modal,
	onClose,
	children,
}: {
	modal: ModalConfig;
	onClose: () => void;
	children: React.ReactNode;
}) {
	const { size = "md", animation = "fade", className } = modal;

	const sizeClasses = useMemo(
		() => ({
			xs: "max-w-xs",
			sm: "max-w-sm",
			md: "max-w-md",
			lg: "max-w-lg",
			xl: "max-w-xl",
			"2xl": "max-w-2xl",
			full: "w-full h-full max-w-none",
		}),
		[],
	);

	const variants = useMemo(
		() => ({
			fade: {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
			},
			slide: {
				initial: { opacity: 0, y: -50 },
				animate: { opacity: 1, y: 0 },
				exit: { opacity: 0, y: -50 },
			},
			scale: {
				initial: { opacity: 0, scale: 0.95 },
				animate: { opacity: 1, scale: 1 },
				exit: { opacity: 0, scale: 0.95 },
			},
		}),
		[],
	);

	const currentVariant =
		variants[animation as keyof typeof variants] || variants.fade;

	return (
		<motion.div
			className={cn(
				"relative mx-4 my-8 w-full overflow-hidden rounded-lg bg-background shadow-2xl",
				sizeClasses[size],
				className,
			)}
			variants={currentVariant}
			initial="initial"
			animate="animate"
			exit="exit"
			transition={{ duration: 0.3 }}
			onClick={(e) => e.stopPropagation()}
		>
			{children}
		</motion.div>
	);
});

// Performance-optimized modal component selector
const ModalComponentSelector = memo(function ModalComponentSelector({
	modal,
	onClose,
}: {
	modal: ModalConfig;
	onClose: () => void;
}) {
	const { type, component: CustomComponent, content } = modal;

	// Return custom component if provided
	if (CustomComponent) {
		return <CustomComponent {...modal.props} onClose={onClose} modal={modal} />;
	}

	// Return content if provided
	if (content) {
		return <>{content}</>;
	}

	// Return lazy-loaded built-in components
	switch (type) {
		case "confirmation":
			return (
				<Suspense fallback={<ModalLoadingFallback />}>
					<LazyConfirmationModal modal={modal} onClose={onClose} />
				</Suspense>
			);

		case "form":
			return (
				<Suspense fallback={<ModalLoadingFallback />}>
					<LazyFormModal modal={modal} onClose={onClose} />
				</Suspense>
			);

		case "gallery":
			return (
				<Suspense fallback={<ModalLoadingFallback />}>
					<LazyGalleryModal modal={modal} onClose={onClose} />
				</Suspense>
			);

		case "wizard":
			return (
				<Suspense fallback={<ModalLoadingFallback />}>
					<LazyWizardModal modal={modal} onClose={onClose} />
				</Suspense>
			);

		case "loading":
			return (
				<Suspense fallback={<ModalLoadingFallback />}>
					<LazyLoadingModal modal={modal} onClose={onClose} />
				</Suspense>
			);

		case "toast":
			return (
				<Suspense fallback={<ModalLoadingFallback />}>
					<LazyToastModal modal={modal} onClose={onClose} />
				</Suspense>
			);

		default:
			return (
				<div className="p-6">
					<div className="text-center text-muted-foreground">
						Modal type "{type}" not found
					</div>
				</div>
			);
	}
});

// Main optimized modal component
interface OptimizedModalProps {
	modal: ModalConfig;
	onClose: () => void;
}

const OptimizedModal = memo(function OptimizedModal({
	modal,
	onClose,
}: OptimizedModalProps) {
	const {
		id,
		backdrop = "blur",
		dismissible = true,
		zIndex = 1000,
		overlayClassName,
	} = modal;

	// Memoized click handler
	const handleOverlayClick = useCallback(
		(event: React.MouseEvent) => {
			if (event.target === event.currentTarget && dismissible) {
				onClose();
			}
		},
		[dismissible, onClose],
	);

	// Prevent unnecessary re-renders by checking if modal should be shown
	if (!modal) return null;

	return createPortal(
		<ModalOverlay
			onClick={handleOverlayClick}
			backdrop={backdrop}
			className={overlayClassName}
			zIndex={zIndex}
		>
			<ModalContainer modal={modal} onClose={onClose}>
				<ModalComponentSelector modal={modal} onClose={onClose} />
			</ModalContainer>
		</ModalOverlay>,
		document.body,
	);
});

// Optimized modal renderer with performance improvements
export function OptimizedModalRenderer() {
	const { state, closeModal } = useModal();

	// Memoize modal close handlers to prevent unnecessary re-renders
	const memoizedCloseHandlers = useMemo(() => {
		const handlers: Record<string, () => void> = {};
		state.modals.forEach((modal) => {
			handlers[modal.id] = () => closeModal(modal.id);
		});
		return handlers;
	}, [state.modals.map((m) => m.id).join(","), closeModal]);

	// Filter and memoize visible modals
	const visibleModals = useMemo(() => {
		return state.modals.filter((modal) => {
			// Additional filtering logic can be added here
			return true;
		});
	}, [state.modals]);

	return (
		<AnimatePresence mode="multiple">
			{visibleModals.map((modal) => (
				<OptimizedModal
					key={modal.id}
					modal={modal}
					onClose={memoizedCloseHandlers[modal.id]}
				/>
			))}
		</AnimatePresence>
	);
}

// Performance monitoring hook for modals
export function useModalPerformance() {
	const { state } = useModal();
	const [performanceMetrics, setPerformanceMetrics] = React.useState({
		renderTime: 0,
		modalCount: 0,
		memoryUsage: 0,
	});

	React.useEffect(() => {
		const startTime = performance.now();

		// Measure render time
		const endTime = performance.now();
		setPerformanceMetrics((prev) => ({
			...prev,
			renderTime: endTime - startTime,
			modalCount: state.modals.length,
		}));

		// Memory usage monitoring (if supported)
		if ("memory" in performance) {
			const memoryInfo = (performance as any).memory;
			setPerformanceMetrics((prev) => ({
				...prev,
				memoryUsage: memoryInfo.usedJSHeapSize / (1024 * 1024), // MB
			}));
		}
	}, [state.modals.length]);

	return performanceMetrics;
}

// Modal preloader for critical modals
export function useModalPreloader() {
	const preloadedComponents = React.useRef(new Set<string>());

	const preloadModal = useCallback(async (type: string) => {
		if (preloadedComponents.current.has(type)) return;

		try {
			switch (type) {
				case "confirmation":
					await import("./variants/confirmation-modal");
					break;
				case "form":
					await import("./variants/form-modal");
					break;
				case "gallery":
					await import("./variants/gallery-modal");
					break;
				case "wizard":
					await import("./variants/wizard-modal");
					break;
				case "loading":
					await import("./variants/loading-modal");
					break;
				case "toast":
					await import("./variants/toast-modal");
					break;
			}

			preloadedComponents.current.add(type);
		} catch (error) {
			console.warn(`Failed to preload modal type: ${type}`, error);
		}
	}, []);

	const preloadCriticalModals = useCallback(() => {
		// Preload commonly used modal types
		preloadModal("confirmation");
		preloadModal("loading");
		preloadModal("toast");
	}, [preloadModal]);

	return { preloadModal, preloadCriticalModals };
}

export default OptimizedModal;
