import { headers } from "next/headers";

/**
 * CSP Nonce Utility Hook
 *
 * Provides access to the dynamically generated CSP nonce for inline scripts and styles.
 * This hook should be used in server components and layouts to ensure proper CSP compliance.
 *
 * Security Benefits:
 * - Prevents XSS attacks by allowing only nonce-authenticated inline content
 * - Replaces unsafe-inline directive with secure nonce-based approach
 * - Supports dynamic content while maintaining security
 *
 * Usage:
 * - Server Components: const nonce = await getCSPNonce()
 * - Client Components: Use the nonce prop passed down from server components
 */

/**
 * Get the CSP nonce for the current request
 * This should be called in server components only
 */
export async function getCSPNonce(): Promise<string | null> {
	try {
		const headersList = await headers();
		return headersList.get("x-nonce") || null;
	} catch (error) {
		// In development or if headers are not available, return null
		// The CSP will fallback to 'unsafe-inline' for development
		console.warn("Failed to get CSP nonce:", error);
		return null;
	}
}

/**
 * CSP Nonce Context for client components
 * This allows passing the nonce down the component tree
 */
export interface CSPNonceProps {
	nonce?: string | null;
}

/**
 * Helper function to create nonce attributes for inline scripts
 */
export function createNonceAttribute(nonce: string | null): { nonce?: string } {
	return nonce ? { nonce } : {};
}

/**
 * Helper function to create CSP-compliant inline style props
 */
export function createSecureStyleProps(
	nonce: string | null,
	styles: React.CSSProperties
): {
	style: React.CSSProperties;
	nonce?: string;
} {
	return {
		style: styles,
		...createNonceAttribute(nonce),
	};
}