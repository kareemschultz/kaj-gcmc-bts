"use client";

import React, { memo, useEffect } from "react";
import { ModalProvider, ModalRenderer } from "./modal-context";
import { OptimizedModalRenderer, useModalPreloader } from "./optimized-modal";
import { ResponsiveModalRenderer } from "./responsive-modal";

interface ModalSystemProps {
	children: React.ReactNode;
	maxModals?: number;
	useOptimized?: boolean;
	useResponsive?: boolean;
	preloadCritical?: boolean;
}

// Main modal system setup component
export const ModalSystem = memo(function ModalSystem({
	children,
	maxModals = 5,
	useOptimized = true,
	useResponsive = true,
	preloadCritical = true,
}: ModalSystemProps) {
	const { preloadCriticalModals } = useModalPreloader();

	// Preload critical modals on mount
	useEffect(() => {
		if (preloadCritical) {
			preloadCriticalModals();
		}
	}, [preloadCritical, preloadCriticalModals]);

	// Choose the appropriate renderer based on props
	const ModalRendererComponent = useResponsive
		? ResponsiveModalRenderer
		: useOptimized
			? OptimizedModalRenderer
			: ModalRenderer;

	return (
		<ModalProvider maxModals={maxModals}>
			{children}
			<ModalRendererComponent />
		</ModalProvider>
	);
});

// Provider component for integrating with existing app structure
export const ModalSystemProvider = memo(function ModalSystemProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ModalSystem
			useOptimized={true}
			useResponsive={true}
			preloadCritical={true}
			maxModals={10}
		>
			{children}
		</ModalSystem>
	);
});

// Hook for modal system configuration
export function useModalSystemConfig() {
	return {
		// Performance settings
		performance: {
			lazyLoading: true,
			memoization: true,
			preloading: true,
			maxConcurrentModals: 5,
		},

		// Animation settings
		animations: {
			duration: 300,
			easing: [0.25, 0.46, 0.45, 0.94],
			enableReducedMotion: true,
		},

		// Accessibility settings
		accessibility: {
			focusTrap: true,
			keyboardNavigation: true,
			screenReaderSupport: true,
			autoFocus: true,
		},

		// Mobile settings
		mobile: {
			responsiveBreakpoint: 768,
			swipeToClose: true,
			bottomSheet: true,
			hapticFeedback: false,
		},

		// Default modal settings
		defaults: {
			backdrop: "blur" as const,
			animation: "fade" as const,
			size: "md" as const,
			position: "center" as const,
			dismissible: true,
			persistent: false,
		},
	};
}

// Modal system health monitoring
export function useModalSystemHealth() {
	const [health, setHealth] = React.useState({
		activeModals: 0,
		memoryUsage: 0,
		renderPerformance: 0,
		errors: [] as string[],
		warnings: [] as string[],
	});

	React.useEffect(() => {
		// Monitor performance and memory usage
		const checkHealth = () => {
			try {
				// Check memory usage (if supported)
				if ("memory" in performance) {
					const memoryInfo = (performance as any).memory;
					setHealth((prev) => ({
						...prev,
						memoryUsage: memoryInfo.usedJSHeapSize / (1024 * 1024), // MB
					}));
				}

				// Check for too many active modals
				const modalCount = document.querySelectorAll('[role="dialog"]').length;
				if (modalCount > 5) {
					setHealth((prev) => ({
						...prev,
						warnings: [...prev.warnings, `High modal count: ${modalCount}`],
					}));
				}

				setHealth((prev) => ({ ...prev, activeModals: modalCount }));
			} catch (error) {
				setHealth((prev) => ({
					...prev,
					errors: [...prev.errors, `Health check error: ${error}`],
				}));
			}
		};

		const interval = setInterval(checkHealth, 5000); // Check every 5 seconds
		checkHealth(); // Initial check

		return () => clearInterval(interval);
	}, []);

	return health;
}

// Development tools for modal system
export function ModalDeveloperTools() {
	const health = useModalSystemHealth();
	const [showDevTools, setShowDevTools] = React.useState(false);

	// Show dev tools in development environment
	React.useEffect(() => {
		setShowDevTools(process.env.NODE_ENV === "development");
	}, []);

	if (!showDevTools) return null;

	return (
		<div className="fixed right-4 bottom-4 z-[9999] max-w-xs rounded-lg border border-border bg-background p-4 shadow-lg">
			<h3 className="mb-2 font-semibold text-sm">Modal System Status</h3>
			<div className="space-y-1 text-xs">
				<div>Active Modals: {health.activeModals}</div>
				<div>Memory: {health.memoryUsage.toFixed(1)} MB</div>
				<div>Performance: {health.renderPerformance.toFixed(1)}ms</div>
				{health.warnings.length > 0 && (
					<div className="text-yellow-600">
						Warnings: {health.warnings.length}
					</div>
				)}
				{health.errors.length > 0 && (
					<div className="text-red-600">Errors: {health.errors.length}</div>
				)}
			</div>
		</div>
	);
}

export default ModalSystemProvider;
