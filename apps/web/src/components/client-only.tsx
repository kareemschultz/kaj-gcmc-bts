"use client";

import { useEffect, useState } from "react";

interface ClientOnlyProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

/**
 * ClientOnly Component
 *
 * Prevents hydration mismatches by only rendering children on the client-side
 * after the component has mounted. Shows fallback during SSR and initial hydration.
 *
 * Use this wrapper for components that:
 * - Use browser-only APIs (window, document, localStorage, etc.)
 * - Have dynamic content that differs between server/client
 * - Contain non-deterministic content (current time, random values, etc.)
 *
 * @param children - Component(s) to render only on client-side
 * @param fallback - Optional fallback to show during SSR/hydration (default: null)
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => {
		setHasMounted(true);
	}, []);

	if (!hasMounted) {
		return <>{fallback}</>;
	}

	return <>{children}</>;
}

/**
 * Hook to detect if we're on the client side after hydration
 * Useful for conditional rendering based on client-side state
 */
export function useIsClient() {
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	return isClient;
}
