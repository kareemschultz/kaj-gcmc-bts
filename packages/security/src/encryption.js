"use strict";
/**
 * Encryption and Cryptographic Utilities
 *
 * Provides secure encryption, hashing, and cryptographic functions
 * Implements industry-standard algorithms and best practices
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSecretKey = generateSecretKey;
exports.generateIV = generateIV;
exports.generateSalt = generateSalt;
exports.deriveKeyFromPassword = deriveKeyFromPassword;
exports.encryptData = encryptData;
exports.decryptData = decryptData;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.createHmacSignature = createHmacSignature;
exports.verifyHmacSignature = verifyHmacSignature;
exports.generateSecureToken = generateSecureToken;
exports.hashSensitiveData = hashSensitiveData;
exports.verifySensitiveData = verifySensitiveData;
exports.encryptPII = encryptPII;
exports.decryptPII = decryptPII;
exports.generateApiKey = generateApiKey;
exports.validateApiKeyFormat = validateApiKeyFormat;
exports.signDocument = signDocument;
exports.verifyDocumentSignature = verifyDocumentSignature;
exports.generateKeyPair = generateKeyPair;
exports.generateSecureRandomNumber = generateSecureRandomNumber;
var crypto_1 = require("crypto");
// Encryption configuration
var ALGORITHM = "aes-256-gcm";
var KEY_LENGTH = 32; // 256 bits
var IV_LENGTH = 16; // 128 bits
var _TAG_LENGTH = 16; // 128 bits
var SALT_LENGTH = 32; // 256 bits
/**
 * Generate a cryptographically secure random key
 */
function generateSecretKey() {
    return crypto_1.default.randomBytes(KEY_LENGTH).toString("hex");
}
/**
 * Generate a cryptographically secure random IV
 */
function generateIV() {
    return crypto_1.default.randomBytes(IV_LENGTH);
}
/**
 * Generate a cryptographically secure salt
 */
function generateSalt() {
    return crypto_1.default.randomBytes(SALT_LENGTH);
}
/**
 * Derive encryption key from password using PBKDF2
 */
function deriveKeyFromPassword(password, salt, iterations) {
    if (iterations === void 0) { iterations = 100000; }
    return crypto_1.default.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, "sha512");
}
/**
 * Encrypt data using AES-256-GCM
 */
function encryptData(data, key) {
    var keyBuffer = typeof key === "string" ? Buffer.from(key, "hex") : key;
    var iv = generateIV();
    var cipher = crypto_1.default.createCipher(ALGORITHM, keyBuffer);
    cipher.setAutoPadding(true);
    var encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    var tag = cipher.getAuthTag();
    return {
        encrypted: encrypted,
        iv: iv.toString("hex"),
        tag: tag.toString("hex"),
    };
}
/**
 * Decrypt data using AES-256-GCM
 */
function decryptData(encryptedData, key) {
    var keyBuffer = typeof key === "string" ? Buffer.from(key, "hex") : key;
    var _iv = Buffer.from(encryptedData.iv, "hex");
    var tag = Buffer.from(encryptedData.tag, "hex");
    var decipher = crypto_1.default.createDecipher(ALGORITHM, keyBuffer);
    decipher.setAuthTag(tag);
    var decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
/**
 * Hash password using bcrypt-style algorithm
 */
function hashPassword(password) {
    return __awaiter(this, void 0, void 0, function () {
        var bcrypt, saltRounds;
        return __generator(this, function (_a) {
            bcrypt = require("bcryptjs");
            saltRounds = 12;
            return [2 /*return*/, bcrypt.hash(password, saltRounds)];
        });
    });
}
/**
 * Verify password against hash
 */
function verifyPassword(password, hash) {
    return __awaiter(this, void 0, void 0, function () {
        var bcrypt;
        return __generator(this, function (_a) {
            bcrypt = require("bcryptjs");
            return [2 /*return*/, bcrypt.compare(password, hash)];
        });
    });
}
/**
 * Create HMAC signature for data integrity
 */
function createHmacSignature(data, secret) {
    var hmac = crypto_1.default.createHmac("sha256", secret);
    hmac.update(data);
    return hmac.digest("hex");
}
/**
 * Verify HMAC signature
 */
function verifyHmacSignature(data, signature, secret) {
    var expectedSignature = createHmacSignature(data, secret);
    // Use constant-time comparison to prevent timing attacks
    return crypto_1.default.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSignature, "hex"));
}
/**
 * Generate secure random token for various purposes
 */
function generateSecureToken(length) {
    if (length === void 0) { length = 32; }
    return crypto_1.default.randomBytes(length).toString("hex");
}
/**
 * Hash sensitive data for storage (one-way)
 */
function hashSensitiveData(data, salt) {
    var saltBuffer = salt ? Buffer.from(salt, "hex") : generateSalt();
    var hash = crypto_1.default.pbkdf2Sync(data, saltBuffer, 100000, 32, "sha512");
    return {
        hash: hash.toString("hex"),
        salt: saltBuffer.toString("hex"),
    };
}
/**
 * Verify hashed sensitive data
 */
function verifySensitiveData(data, hash, salt) {
    var computedHash = crypto_1.default.pbkdf2Sync(data, Buffer.from(salt, "hex"), 100000, 32, "sha512");
    var expectedHash = Buffer.from(hash, "hex");
    return crypto_1.default.timingSafeEqual(computedHash, expectedHash);
}
/**
 * Encrypt PII data for database storage
 */
function encryptPII(data) {
    var key = process.env.PII_ENCRYPTION_KEY;
    if (!key) {
        throw new Error("PII_ENCRYPTION_KEY environment variable is required");
    }
    return encryptData(data, key);
}
/**
 * Decrypt PII data from database
 */
function decryptPII(encryptedData) {
    var key = process.env.PII_ENCRYPTION_KEY;
    if (!key) {
        throw new Error("PII_ENCRYPTION_KEY environment variable is required");
    }
    return decryptData(encryptedData, key);
}
/**
 * Generate API key with specific format
 */
function generateApiKey(prefix) {
    if (prefix === void 0) { prefix = "gkaj"; }
    var randomPart = crypto_1.default.randomBytes(20).toString("hex");
    return "".concat(prefix, "_").concat(randomPart);
}
/**
 * Validate API key format
 */
function validateApiKeyFormat(apiKey, expectedPrefix) {
    if (expectedPrefix === void 0) { expectedPrefix = "gkaj"; }
    var pattern = new RegExp("^".concat(expectedPrefix, "_[a-f0-9]{40}$"));
    return pattern.test(apiKey);
}
/**
 * Create digital signature for documents
 */
function signDocument(document, privateKey) {
    var sign = crypto_1.default.createSign("RSA-SHA256");
    sign.update(document);
    return sign.sign(privateKey, "hex");
}
/**
 * Verify digital signature
 */
function verifyDocumentSignature(document, signature, publicKey) {
    var verify = crypto_1.default.createVerify("RSA-SHA256");
    verify.update(document);
    return verify.verify(publicKey, signature, "hex");
}
/**
 * Generate key pair for document signing
 */
function generateKeyPair() {
    var _a = crypto_1.default.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: "spki",
            format: "pem",
        },
        privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
        },
    }), publicKey = _a.publicKey, privateKey = _a.privateKey;
    return { publicKey: publicKey, privateKey: privateKey };
}
/**
 * Secure random number generation for various purposes
 */
function generateSecureRandomNumber(min, max) {
    var range = max - min + 1;
    var bytesNeeded = Math.ceil(Math.log2(range) / 8);
    var maxValidValue = Math.floor(Math.pow(256, bytesNeeded) / range) * range - 1;
    var randomValue;
    do {
        var randomBytes = crypto_1.default.randomBytes(bytesNeeded);
        randomValue = 0;
        for (var i = 0; i < bytesNeeded; i++) {
            randomValue = randomValue * 256 + randomBytes[i];
        }
    } while (randomValue > maxValidValue);
    return min + (randomValue % range);
}
