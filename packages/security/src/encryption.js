/**
 * Encryption and Cryptographic Utilities
 *
 * Provides secure encryption, hashing, and cryptographic functions
 * Implements industry-standard algorithms and best practices
 */
import crypto from "node:crypto";

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const _TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits
/**
 * Generate a cryptographically secure random key
 */
export function generateSecretKey() {
	return crypto.randomBytes(KEY_LENGTH).toString("hex");
}
/**
 * Generate a cryptographically secure random IV
 */
export function generateIV() {
	return crypto.randomBytes(IV_LENGTH);
}
/**
 * Generate a cryptographically secure salt
 */
export function generateSalt() {
	return crypto.randomBytes(SALT_LENGTH);
}
/**
 * Derive encryption key from password using PBKDF2
 */
export function deriveKeyFromPassword(password, salt, iterations = 100000) {
	return crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, "sha512");
}
/**
 * Encrypt data using AES-256-GCM
 */
export function encryptData(data, key) {
	const keyBuffer = typeof key === "string" ? Buffer.from(key, "hex") : key;
	const iv = generateIV();
	const cipher = crypto.createCipher(ALGORITHM, keyBuffer);
	cipher.setAutoPadding(true);
	let encrypted = cipher.update(data, "utf8", "hex");
	encrypted += cipher.final("hex");
	const tag = cipher.getAuthTag();
	return {
		encrypted,
		iv: iv.toString("hex"),
		tag: tag.toString("hex"),
	};
}
/**
 * Decrypt data using AES-256-GCM
 */
export function decryptData(encryptedData, key) {
	const keyBuffer = typeof key === "string" ? Buffer.from(key, "hex") : key;
	const _iv = Buffer.from(encryptedData.iv, "hex");
	const tag = Buffer.from(encryptedData.tag, "hex");
	const decipher = crypto.createDecipher(ALGORITHM, keyBuffer);
	decipher.setAuthTag(tag);
	let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
}
/**
 * Hash password using bcrypt-style algorithm
 */
export async function hashPassword(password) {
	const bcrypt = require("bcryptjs");
	const saltRounds = 12; // High security level
	return bcrypt.hash(password, saltRounds);
}
/**
 * Verify password against hash
 */
export async function verifyPassword(password, hash) {
	const bcrypt = require("bcryptjs");
	return bcrypt.compare(password, hash);
}
/**
 * Create HMAC signature for data integrity
 */
export function createHmacSignature(data, secret) {
	const hmac = crypto.createHmac("sha256", secret);
	hmac.update(data);
	return hmac.digest("hex");
}
/**
 * Verify HMAC signature
 */
export function verifyHmacSignature(data, signature, secret) {
	const expectedSignature = createHmacSignature(data, secret);
	// Use constant-time comparison to prevent timing attacks
	return crypto.timingSafeEqual(
		Buffer.from(signature, "hex"),
		Buffer.from(expectedSignature, "hex"),
	);
}
/**
 * Generate secure random token for various purposes
 */
export function generateSecureToken(length = 32) {
	return crypto.randomBytes(length).toString("hex");
}
/**
 * Hash sensitive data for storage (one-way)
 */
export function hashSensitiveData(data, salt) {
	const saltBuffer = salt ? Buffer.from(salt, "hex") : generateSalt();
	const hash = crypto.pbkdf2Sync(data, saltBuffer, 100000, 32, "sha512");
	return {
		hash: hash.toString("hex"),
		salt: saltBuffer.toString("hex"),
	};
}
/**
 * Verify hashed sensitive data
 */
export function verifySensitiveData(data, hash, salt) {
	const computedHash = crypto.pbkdf2Sync(
		data,
		Buffer.from(salt, "hex"),
		100000,
		32,
		"sha512",
	);
	const expectedHash = Buffer.from(hash, "hex");
	return crypto.timingSafeEqual(computedHash, expectedHash);
}
/**
 * Encrypt PII data for database storage
 */
export function encryptPII(data) {
	const key = process.env.PII_ENCRYPTION_KEY;
	if (!key) {
		throw new Error("PII_ENCRYPTION_KEY environment variable is required");
	}
	return encryptData(data, key);
}
/**
 * Decrypt PII data from database
 */
export function decryptPII(encryptedData) {
	const key = process.env.PII_ENCRYPTION_KEY;
	if (!key) {
		throw new Error("PII_ENCRYPTION_KEY environment variable is required");
	}
	return decryptData(encryptedData, key);
}
/**
 * Generate API key with specific format
 */
export function generateApiKey(prefix = "gkaj") {
	const randomPart = crypto.randomBytes(20).toString("hex");
	return `${prefix}_${randomPart}`;
}
/**
 * Validate API key format
 */
export function validateApiKeyFormat(apiKey, expectedPrefix = "gkaj") {
	const pattern = new RegExp(`^${expectedPrefix}_[a-f0-9]{40}$`);
	return pattern.test(apiKey);
}
/**
 * Create digital signature for documents
 */
export function signDocument(document, privateKey) {
	const sign = crypto.createSign("RSA-SHA256");
	sign.update(document);
	return sign.sign(privateKey, "hex");
}
/**
 * Verify digital signature
 */
export function verifyDocumentSignature(document, signature, publicKey) {
	const verify = crypto.createVerify("RSA-SHA256");
	verify.update(document);
	return verify.verify(publicKey, signature, "hex");
}
/**
 * Generate key pair for document signing
 */
export function generateKeyPair() {
	const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
		modulusLength: 2048,
		publicKeyEncoding: {
			type: "spki",
			format: "pem",
		},
		privateKeyEncoding: {
			type: "pkcs8",
			format: "pem",
		},
	});
	return { publicKey, privateKey };
}
/**
 * Secure random number generation for various purposes
 */
export function generateSecureRandomNumber(min, max) {
	const range = max - min + 1;
	const bytesNeeded = Math.ceil(Math.log2(range) / 8);
	const maxValidValue = Math.floor(256 ** bytesNeeded / range) * range - 1;
	let randomValue;
	do {
		const randomBytes = crypto.randomBytes(bytesNeeded);
		randomValue = 0;
		for (let i = 0; i < bytesNeeded; i++) {
			randomValue = randomValue * 256 + randomBytes[i];
		}
	} while (randomValue > maxValidValue);
	return min + (randomValue % range);
}
