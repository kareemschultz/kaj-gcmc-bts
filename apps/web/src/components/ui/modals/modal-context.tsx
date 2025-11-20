"use client";

import type { ReactNode } from "react";
import React, {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
} from "react";

export interface ModalConfig {
	id: string;
	type:
		| "confirmation"
		| "form"
		| "gallery"
		| "wizard"
		| "fullscreen"
		| "toast"
		| "loading"
		| "custom";
	title?: string;
	description?: string;
	content?: ReactNode;
	component?: React.ComponentType<any>;
	props?: Record<string, any>;
	size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
	position?: "center" | "top" | "bottom" | "left" | "right";
	animation?: "fade" | "slide" | "scale" | "blur" | "bounce";
	backdrop?: "blur" | "dark" | "transparent" | "none";
	dismissible?: boolean;
	autoClose?: number;
	persistent?: boolean;
	zIndex?: number;
	onConfirm?: () => void | Promise<void>;
	onCancel?: () => void;
	onClose?: () => void;
	className?: string;
	overlayClassName?: string;
}

interface ModalState {
	modals: ModalConfig[];
	activeModalId: string | null;
}

interface ModalContextValue {
	state: ModalState;
	openModal: (config: Omit<ModalConfig, "id">) => string;
	closeModal: (id: string) => void;
	closeAllModals: () => void;
	updateModal: (id: string, updates: Partial<ModalConfig>) => void;
	getModal: (id: string) => ModalConfig | undefined;
	isModalOpen: (id: string) => boolean;
}

const ModalContext = createContext<ModalContextValue | null>(null);

interface ModalProviderProps {
	children: ReactNode;
	maxModals?: number;
}

export function ModalProvider({ children, maxModals = 5 }: ModalProviderProps) {
	const [state, setState] = React.useState<ModalState>({
		modals: [],
		activeModalId: null,
	});

	const modalIdCounter = useRef(0);

	const openModal = useCallback(
		(config: Omit<ModalConfig, "id">) => {
			const id = `modal-${modalIdCounter.current++}-${Date.now()}`;

			setState((prev) => {
				const newModals = [...prev.modals, { ...config, id }];

				// Limit the number of modals to prevent memory issues
				if (newModals.length > maxModals) {
					newModals.shift();
				}

				return {
					modals: newModals,
					activeModalId: id,
				};
			});

			return id;
		},
		[maxModals],
	);

	const closeModal = useCallback((id: string) => {
		setState((prev) => {
			const newModals = prev.modals.filter((modal) => modal.id !== id);
			const newActiveModalId =
				newModals.length > 0 ? newModals[newModals.length - 1].id : null;

			return {
				modals: newModals,
				activeModalId: newActiveModalId,
			};
		});
	}, []);

	const closeAllModals = useCallback(() => {
		setState({
			modals: [],
			activeModalId: null,
		});
	}, []);

	const updateModal = useCallback(
		(id: string, updates: Partial<ModalConfig>) => {
			setState((prev) => ({
				...prev,
				modals: prev.modals.map((modal) =>
					modal.id === id ? { ...modal, ...updates } : modal,
				),
			}));
		},
		[],
	);

	const getModal = useCallback(
		(id: string) => {
			return state.modals.find((modal) => modal.id === id);
		},
		[state.modals],
	);

	const isModalOpen = useCallback(
		(id: string) => {
			return state.modals.some((modal) => modal.id === id);
		},
		[state.modals],
	);

	const contextValue = useMemo(
		(): ModalContextValue => ({
			state,
			openModal,
			closeModal,
			closeAllModals,
			updateModal,
			getModal,
			isModalOpen,
		}),
		[
			state,
			openModal,
			closeModal,
			closeAllModals,
			updateModal,
			getModal,
			isModalOpen,
		],
	);

	return (
		<ModalContext.Provider value={contextValue}>
			{children}
		</ModalContext.Provider>
	);
}

export function useModal() {
	const context = useContext(ModalContext);
	if (!context) {
		throw new Error("useModal must be used within a ModalProvider");
	}
	return context;
}

// Convenience hooks for specific modal types
export function useConfirmationModal() {
	const { openModal, closeModal } = useModal();

	return useCallback(
		(config: {
			title: string;
			description?: string;
			confirmText?: string;
			cancelText?: string;
			variant?: "danger" | "warning" | "success";
			onConfirm: () => void | Promise<void>;
			onCancel?: () => void;
		}) => {
			return openModal({
				type: "confirmation",
				title: config.title,
				description: config.description,
				props: {
					confirmText: config.confirmText || "Confirm",
					cancelText: config.cancelText || "Cancel",
					variant: config.variant || "danger",
				},
				onConfirm: config.onConfirm,
				onCancel: config.onCancel,
				size: "sm",
				animation: "scale",
				backdrop: "blur",
			});
		},
		[openModal],
	);
}

export function useLoadingModal() {
	const { openModal, closeModal, updateModal } = useModal();

	return {
		show: useCallback(
			(config: {
				title?: string;
				description?: string;
				progress?: number;
				cancelable?: boolean;
				onCancel?: () => void;
			}) => {
				return openModal({
					type: "loading",
					title: config.title || "Loading...",
					description: config.description,
					props: {
						progress: config.progress,
						cancelable: config.cancelable || false,
					},
					onCancel: config.onCancel,
					size: "sm",
					animation: "fade",
					backdrop: "dark",
					dismissible: false,
					persistent: true,
				});
			},
			[openModal],
		),

		updateProgress: useCallback(
			(id: string, progress: number, description?: string) => {
				updateModal(id, {
					props: { progress },
					...(description && { description }),
				});
			},
			[updateModal],
		),

		hide: closeModal,
	};
}

export function useToastModal() {
	const { openModal } = useModal();

	return useCallback(
		(config: {
			title: string;
			description?: string;
			type: "success" | "error" | "warning" | "info";
			duration?: number;
			action?: { label: string; onClick: () => void };
		}) => {
			return openModal({
				type: "toast",
				title: config.title,
				description: config.description,
				props: {
					type: config.type,
					action: config.action,
				},
				size: "sm",
				position: "top",
				animation: "slide",
				backdrop: "none",
				autoClose: config.duration || 5000,
				dismissible: true,
			});
		},
		[openModal],
	);
}
