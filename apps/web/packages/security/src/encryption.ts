/**
 * Encryption and Hashing Utilities
 */

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
	if (!password || typeof password !== "string") {
		throw new Error("Invalid password provided");
	}

	if (password.length < 8) {
		throw new Error("Password must be at least 8 characters long");
	}

	return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
	password: string,
	hash: string,
): Promise<boolean> {
	if (
		!password ||
		!hash ||
		typeof password !== "string" ||
		typeof hash !== "string"
	) {
		return false;
	}

	try {
		return await bcrypt.compare(password, hash);
	} catch {
		return false;
	}
}

export function generateSecureToken(length = 32): string {
	const charset =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";

	for (let i = 0; i < length; i++) {
		result += charset.charAt(Math.floor(Math.random() * charset.length));
	}

	return result;
}

export function maskSensitiveData(data: string, visibleChars = 4): string {
	if (!data || typeof data !== "string") {
		return "";
	}

	if (data.length <= visibleChars) {
		return "*".repeat(data.length);
	}

	const masked = "*".repeat(data.length - visibleChars);
	return masked + data.slice(-visibleChars);
}
