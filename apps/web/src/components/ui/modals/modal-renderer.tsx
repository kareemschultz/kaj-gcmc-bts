"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { X } from "lucide-react";
import React, { memo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "./hooks/use-focus-trap";
import { useKeyboard } from "./hooks/use-keyboard";
import { type ModalConfig, useModal } from "./modal-context";

const modalVariants: Record<string, Variants> = {
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
	blur: {
		initial: { opacity: 0, backdropFilter: "blur(0px)" },
		animate: { opacity: 1, backdropFilter: "blur(8px)" },
		exit: { opacity: 0, backdropFilter: "blur(0px)" },
	},
	bounce: {
		initial: { opacity: 0, scale: 0.3 },
		animate: {
			opacity: 1,
			scale: 1,
			transition: {
				type: "spring",
				stiffness: 300,
				damping: 20,
			},
		},
		exit: { opacity: 0, scale: 0.3 },
	},
};

const overlayVariants: Variants = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
};

const sizeClasses = {
	xs: "max-w-xs",
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-xl",
	"2xl": "max-w-2xl",
	full: "w-full h-full max-w-none",
};

const positionClasses = {
	center: "items-center justify-center",
	top: "items-start justify-center pt-16",
	bottom: "items-end justify-center pb-16",
	left: "items-center justify-start pl-16",
	right: "items-center justify-end pr-16",
};

const backdropClasses = {
	blur: "backdrop-blur-sm bg-black/30",
	dark: "bg-black/50",
	transparent: "bg-black/20",
	none: "",
};

interface ModalProps {
	modal: ModalConfig;
	onClose: () => void;
}

const Modal = memo(function Modal({ modal, onClose }: ModalProps) {
	const {
		id,
		size = "md",
		position = "center",
		animation = "fade",
		backdrop = "blur",
		dismissible = true,
		autoClose,
		zIndex = 1000,
		className,
		overlayClassName,
	} = modal;

	const modalRef = React.useRef<HTMLDivElement>(null);

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
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === "Escape" && dismissible) {
				event.preventDefault();
				onClose();
			}
		},
		[dismissible, onClose],
	);

	useKeyboard(handleKeyDown);

	// Prevent body scroll
	useEffect(() => {
		const originalStyle = window.getComputedStyle(document.body).overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = originalStyle;
		};
	}, []);

	const handleOverlayClick = useCallback(
		(event: React.MouseEvent) => {
			if (event.target === event.currentTarget && dismissible) {
				onClose();
			}
		},
		[dismissible, onClose],
	);

	const variants = modalVariants[animation] || modalVariants.fade;

	return createPortal(
		<motion.div
			key={id}
			className={cn(
				"fixed inset-0 z-50 flex",
				positionClasses[position],
				backdropClasses[backdrop],
				overlayClassName,
			)}
			style={{ zIndex }}
			onClick={handleOverlayClick}
			variants={overlayVariants}
			initial="initial"
			animate="animate"
			exit="exit"
			transition={{ duration: 0.2 }}
		>
			<motion.div
				ref={modalRef}
				className={cn(
					"relative mx-4 my-8 w-full overflow-hidden rounded-lg bg-background shadow-2xl",
					sizeClasses[size],
					className,
				)}
				variants={variants}
				initial="initial"
				animate="animate"
				exit="exit"
				transition={{ duration: 0.3 }}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Close button */}
				{dismissible && (
					<button
						type="button"
						onClick={onClose}
						className="absolute top-4 right-4 z-10 rounded-full bg-background/80 p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
						aria-label="Close modal"
					>
						<X className="h-4 w-4" />
					</button>
				)}

				{/* Modal content */}
				<div className="relative">
					<ModalContent modal={modal} onClose={onClose} />
				</div>
			</motion.div>
		</motion.div>,
		document.body,
	);
});

interface ModalContentProps {
	modal: ModalConfig;
	onClose: () => void;
}

const ModalContent = memo(function ModalContent({
	modal,
	onClose,
}: ModalContentProps) {
	const { type, component: Component, content, props } = modal;

	if (Component) {
		return <Component {...props} onClose={onClose} modal={modal} />;
	}

	if (content) {
		return <>{content}</>;
	}

	// Fallback content based on type
	switch (type) {
		case "loading":
			return <LoadingModalContent modal={modal} onClose={onClose} />;
		case "confirmation":
			return <ConfirmationModalContent modal={modal} onClose={onClose} />;
		case "toast":
			return <ToastModalContent modal={modal} onClose={onClose} />;
		default:
			return (
				<div className="p-6">
					<div className="text-center text-muted-foreground">
						Modal content not found
					</div>
				</div>
			);
	}
});

// Built-in modal content components
const LoadingModalContent = memo(function LoadingModalContent({
	modal,
	onClose,
}: ModalContentProps) {
	const { title, description, props = {} } = modal;
	const { progress, cancelable } = props;

	return (
		<div className="p-6 text-center">
			<div className="mb-4">
				<div className="inline-block h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
			</div>

			{title && <h3 className="mb-2 font-semibold text-lg">{title}</h3>}

			{description && (
				<p className="mb-4 text-muted-foreground">{description}</p>
			)}

			{typeof progress === "number" && (
				<div className="mb-4 h-2 w-full rounded-full bg-secondary">
					<div
						className="h-2 rounded-full bg-primary transition-all duration-300"
						style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
					/>
				</div>
			)}

			{cancelable && (
				<button
					type="button"
					onClick={onClose}
					className="rounded border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
				>
					Cancel
				</button>
			)}
		</div>
	);
});

const ConfirmationModalContent = memo(function ConfirmationModalContent({
	modal,
	onClose,
}: ModalContentProps) {
	const { title, description, props = {}, onConfirm, onCancel } = modal;
	const {
		confirmText = "Confirm",
		cancelText = "Cancel",
		variant = "danger",
	} = props;

	const handleConfirm = async () => {
		if (onConfirm) {
			await onConfirm();
		}
		onClose();
	};

	const handleCancel = () => {
		if (onCancel) {
			onCancel();
		}
		onClose();
	};

	const confirmButtonClasses = {
		danger:
			"bg-destructive text-destructive-foreground hover:bg-destructive/90",
		warning: "bg-yellow-500 text-white hover:bg-yellow-600",
		success: "bg-green-500 text-white hover:bg-green-600",
	};

	return (
		<div className="p-6">
			{title && <h3 className="mb-2 font-semibold text-lg">{title}</h3>}

			{description && (
				<p className="mb-6 text-muted-foreground">{description}</p>
			)}

			<div className="flex justify-end gap-3">
				<button
					type="button"
					onClick={handleCancel}
					className="rounded border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
				>
					{cancelText}
				</button>
				<button
					type="button"
					onClick={handleConfirm}
					className={cn(
						"rounded px-4 py-2 text-sm transition-colors",
						confirmButtonClasses[variant],
					)}
				>
					{confirmText}
				</button>
			</div>
		</div>
	);
});

const ToastModalContent = memo(function ToastModalContent({
	modal,
	onClose,
}: ModalContentProps) {
	const { title, description, props = {} } = modal;
	const { type = "info", action } = props;

	const iconClasses = {
		success: "text-green-500",
		error: "text-red-500",
		warning: "text-yellow-500",
		info: "text-blue-500",
	};

	return (
		<div className="flex items-start gap-3 p-4">
			<div className={cn("mt-2 h-2 w-2 rounded-full", iconClasses[type])} />

			<div className="flex-1">
				<h4 className="font-medium text-sm">{title}</h4>
				{description && (
					<p className="mt-1 text-muted-foreground text-xs">{description}</p>
				)}

				{action && (
					<button
						type="button"
						onClick={() => {
							action.onClick();
							onClose();
						}}
						className="mt-2 text-primary text-xs hover:underline"
					>
						{action.label}
					</button>
				)}
			</div>
		</div>
	);
});

export function ModalRenderer() {
	const { state, closeModal } = useModal();

	return (
		<AnimatePresence mode="multiple">
			{state.modals.map((modal) => (
				<Modal
					key={modal.id}
					modal={modal}
					onClose={() => closeModal(modal.id)}
				/>
			))}
		</AnimatePresence>
	);
}

export default ModalRenderer;
