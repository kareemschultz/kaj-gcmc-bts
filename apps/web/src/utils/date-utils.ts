/**
 * Utilities for consistent date formatting across SSR and client
 * These functions ensure hydration consistency by using explicit locale options
 */

export interface DateFormatOptions {
	year?: "numeric" | "2-digit";
	month?: "numeric" | "2-digit" | "long" | "short" | "narrow";
	day?: "numeric" | "2-digit";
	hour?: "numeric" | "2-digit";
	minute?: "numeric" | "2-digit";
	second?: "numeric" | "2-digit";
	timeZoneName?: "long" | "short";
	hour12?: boolean;
}

/**
 * Format date with explicit options to avoid hydration mismatches
 * Always uses 'en-US' locale for consistency between server and client
 */
export function formatDate(
	date: Date | string | number,
	options: DateFormatOptions = {},
): string {
	const dateObj = new Date(date);

	// Default options for consistent formatting
	const defaultOptions: DateFormatOptions = {
		year: "numeric",
		month: "short",
		day: "numeric",
		...options,
	};

	return dateObj.toLocaleDateString("en-US", defaultOptions);
}

/**
 * Format date and time with explicit options
 */
export function formatDateTime(
	date: Date | string | number,
	options: DateFormatOptions = {},
): string {
	const defaultOptions: DateFormatOptions = {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
		...options,
	};

	return new Date(date).toLocaleDateString("en-US", defaultOptions);
}

/**
 * Format time only with explicit options
 */
export function formatTime(
	date: Date | string | number,
	options: DateFormatOptions = {},
): string {
	const defaultOptions: DateFormatOptions = {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
		...options,
	};

	return new Date(date).toLocaleTimeString("en-US", defaultOptions);
}

/**
 * Get a relative time string (e.g., "2 days ago", "in 3 hours")
 * Uses Intl.RelativeTimeFormat for consistency
 */
export function formatRelativeTime(date: Date | string | number): string {
	const dateObj = new Date(date);
	const now = new Date();
	const diffInMs = dateObj.getTime() - now.getTime();
	const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

	const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

	if (Math.abs(diffInDays) >= 1) {
		return rtf.format(diffInDays, "day");
	}

	const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
	if (Math.abs(diffInHours) >= 1) {
		return rtf.format(diffInHours, "hour");
	}

	const diffInMinutes = Math.round(diffInMs / (1000 * 60));
	return rtf.format(diffInMinutes, "minute");
}

/**
 * Check if we're on the client side for hydration-safe date operations
 */
export function isClientSide(): boolean {
	return typeof window !== "undefined";
}

/**
 * Get current date in a hydration-safe way
 * Should be used with caution - prefer passing dates as props when possible
 */
export function getCurrentDate(): Date | null {
	if (!isClientSide()) {
		return null;
	}
	return new Date();
}
