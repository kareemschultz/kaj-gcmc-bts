"use client";

import type React from "react";
import { useModal } from "./modal-context";

// Re-export useModal for external use
export { useModal };
import { ConfirmationModal } from "./variants/confirmation-modal";
import { FormModal } from "./variants/form-modal";
import { GalleryModal } from "./variants/gallery-modal";
import { LoadingModal } from "./variants/loading-modal";
import { ToastModal } from "./variants/toast-modal";
import { WizardModal } from "./variants/wizard-modal";

/**
 * Quick utility functions for common modal operations
 */

// Confirmation modal utility
export function useConfirmDialog() {
	const { openModal } = useModal();

	return {
		confirm: (options: {
			title: string;
			description?: string;
			confirmText?: string;
			cancelText?: string;
			variant?: "danger" | "warning" | "success" | "info";
		}): Promise<boolean> => {
			return new Promise((resolve) => {
				openModal({
					type: "confirmation",
					component: ConfirmationModal,
					title: options.title,
					description: options.description,
					props: {
						variant: options.variant || "danger",
						confirmText: options.confirmText || "Confirm",
						cancelText: options.cancelText || "Cancel",
					},
					size: "sm",
					animation: "scale",
					backdrop: "blur",
					onConfirm: () => resolve(true),
					onCancel: () => resolve(false),
				});
			});
		},

		delete: (itemName?: string): Promise<boolean> => {
			return new Promise((resolve) => {
				openModal({
					type: "confirmation",
					component: ConfirmationModal,
					title: "Delete Item",
					description: itemName
						? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
						: "Are you sure you want to delete this item? This action cannot be undone.",
					props: {
						variant: "danger",
						confirmText: "Delete",
						cancelText: "Cancel",
					},
					size: "sm",
					animation: "scale",
					backdrop: "blur",
					onConfirm: () => resolve(true),
					onCancel: () => resolve(false),
				});
			});
		},
	};
}

// Form modal utility
export function useFormDialog() {
	const { openModal } = useModal();

	return {
		create: <T = Record<string, any>>(options: {
			title: string;
			description?: string;
			fields: Array<{
				name: string;
				label: string;
				type?: string;
				placeholder?: string;
				required?: boolean;
				options?: Array<{ label: string; value: string }>;
			}>;
			initialValues?: T;
			validationSchema?: Record<string, any>;
			submitText?: string;
			cancelText?: string;
		}): Promise<T | null> => {
			return new Promise((resolve) => {
				openModal({
					type: "form",
					component: FormModal,
					title: options.title,
					description: options.description,
					props: {
						fields: options.fields,
						initialValues: options.initialValues || {},
						validationSchema: options.validationSchema,
						submitText: options.submitText || "Create",
						cancelText: options.cancelText || "Cancel",
						onSubmit: (data: T) => resolve(data),
					},
					size: "md",
					animation: "slide",
					backdrop: "blur",
					onCancel: () => resolve(null),
				});
			});
		},

		edit: <T = Record<string, any>>(options: {
			title: string;
			description?: string;
			fields: Array<{
				name: string;
				label: string;
				type?: string;
				placeholder?: string;
				required?: boolean;
				options?: Array<{ label: string; value: string }>;
			}>;
			initialValues: T;
			validationSchema?: Record<string, any>;
			submitText?: string;
			cancelText?: string;
		}): Promise<T | null> => {
			return new Promise((resolve) => {
				openModal({
					type: "form",
					component: FormModal,
					title: options.title,
					description: options.description,
					props: {
						fields: options.fields,
						initialValues: options.initialValues,
						validationSchema: options.validationSchema,
						submitText: options.submitText || "Update",
						cancelText: options.cancelText || "Cancel",
						onSubmit: (data: T) => resolve(data),
					},
					size: "md",
					animation: "slide",
					backdrop: "blur",
					onCancel: () => resolve(null),
				});
			});
		},
	};
}

// Gallery modal utility
export function useGalleryDialog() {
	const { openModal } = useModal();

	return {
		show: (options: {
			items: Array<{
				id: string;
				src: string;
				alt?: string;
				title?: string;
				description?: string;
				downloadUrl?: string;
			}>;
			initialIndex?: number;
			showThumbnails?: boolean;
			allowDownload?: boolean;
			allowZoom?: boolean;
			allowRotate?: boolean;
		}) => {
			return openModal({
				type: "gallery",
				component: GalleryModal,
				props: options,
				size: "full",
				animation: "fade",
				backdrop: "dark",
			});
		},
	};
}

// Loading modal utility
export function useLoadingDialog() {
	const { openModal, closeModal, updateModal } = useModal();

	return {
		show: (options: {
			title?: string;
			description?: string;
			cancelable?: boolean;
			progress?: number;
		}) => {
			return openModal({
				type: "loading",
				component: LoadingModal,
				title: options.title || "Loading...",
				description: options.description,
				props: {
					progress: options.progress,
					cancelable: options.cancelable || false,
				},
				size: "sm",
				animation: "fade",
				backdrop: "blur",
				dismissible: false,
				persistent: true,
			});
		},

		updateProgress: (id: string, progress: number, description?: string) => {
			updateModal(id, {
				props: { progress },
				...(description && { description }),
			});
		},

		hide: closeModal,
	};
}

// Toast notification utility
export function useNotification() {
	const { openModal } = useModal();

	const showToast = (
		type: "success" | "error" | "warning" | "info",
		title: string,
		description?: string,
		action?: { label: string; onClick: () => void },
	) => {
		return openModal({
			type: "toast",
			component: ToastModal,
			title,
			description,
			props: { type, action },
			size: "sm",
			position: "top",
			animation: "slide",
			backdrop: "none",
			autoClose: 5000,
			dismissible: true,
		});
	};

	return {
		success: (
			title: string,
			description?: string,
			action?: { label: string; onClick: () => void },
		) => showToast("success", title, description, action),

		error: (
			title: string,
			description?: string,
			action?: { label: string; onClick: () => void },
		) => showToast("error", title, description, action),

		warning: (
			title: string,
			description?: string,
			action?: { label: string; onClick: () => void },
		) => showToast("warning", title, description, action),

		info: (
			title: string,
			description?: string,
			action?: { label: string; onClick: () => void },
		) => showToast("info", title, description, action),
	};
}

// Wizard modal utility
export function useWizardDialog() {
	const { openModal } = useModal();

	return {
		show: (options: {
			title: string;
			steps: Array<{
				id: string;
				title: string;
				description?: string;
				component?: React.ComponentType<any>;
				content?: React.ReactNode;
				isOptional?: boolean;
			}>;
			allowStepNavigation?: boolean;
			showProgress?: boolean;
			onComplete?: (data: Record<string, any>) => void | Promise<void>;
		}) => {
			return openModal({
				type: "wizard",
				component: WizardModal,
				title: options.title,
				props: {
					steps: options.steps,
					allowStepNavigation: options.allowStepNavigation || false,
					showProgress: options.showProgress !== false,
					onComplete: options.onComplete,
				},
				size: "lg",
				animation: "slide",
				backdrop: "blur",
			});
		},
	};
}

// Quick action utilities
export const modalUtils = {
	// Quick confirmation
	confirmDelete: async (itemName?: string): Promise<boolean> => {
		const { confirm } = useConfirmDialog();
		return confirm({
			title: "Delete Item",
			description: itemName
				? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
				: "Are you sure you want to delete this item? This action cannot be undone.",
			variant: "danger",
			confirmText: "Delete",
			cancelText: "Cancel",
		});
	},

	// Quick form
	quickForm: async (
		fields: Array<{
			name: string;
			label: string;
			type?: string;
			required?: boolean;
		}>,
	): Promise<Record<string, any> | null> => {
		const { create } = useFormDialog();
		return create({
			title: "Form",
			fields,
		});
	},

	// Quick notification
	notify: {
		success: (message: string) => {
			const { success } = useNotification();
			return success(message);
		},
		error: (message: string) => {
			const { error } = useNotification();
			return error(message);
		},
		warning: (message: string) => {
			const { warning } = useNotification();
			return warning(message);
		},
		info: (message: string) => {
			const { info } = useNotification();
			return info(message);
		},
	},
};
