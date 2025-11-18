/**
 * Tenant Isolation Security
 *
 * Ensures complete data isolation between tenants in multi-tenant architecture
 * Prevents data leakage and unauthorized cross-tenant access
 */
var __assign =
	(this && this.__assign) ||
	function () {
		__assign =
			Object.assign ||
			function (t) {
				for (var s, i = 1, n = arguments.length; i < n; i++) {
					s = arguments[i];
					for (var p in s) if (Object.hasOwn(s, p)) t[p] = s[p];
				}
				return t;
			};
		return __assign.apply(this, arguments);
	};
var __awaiter =
	(this && this.__awaiter) ||
	((thisArg, _arguments, P, generator) => {
		function adopt(value) {
			return value instanceof P
				? value
				: new P((resolve) => {
						resolve(value);
					});
		}
		return new (P || (P = Promise))((resolve, reject) => {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator.throw(value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done
					? resolve(result.value)
					: adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	});
var __generator =
	(this && this.__generator) ||
	((thisArg, body) => {
		var _ = {
			label: 0,
			sent: () => {
				if (t[0] & 1) throw t[1];
				return t[1];
			},
			trys: [],
			ops: [],
		};
		var f;
		var y;
		var t;
		var g = Object.create(
			(typeof Iterator === "function" ? Iterator : Object).prototype,
		);
		return (
			(g.next = verb(0)),
			(g.throw = verb(1)),
			(g.return = verb(2)),
			typeof Symbol === "function" &&
				(g[Symbol.iterator] = function () {
					return this;
				}),
			g
		);
		function verb(n) {
			return (v) => step([n, v]);
		}
		function step(op) {
			if (f) throw new TypeError("Generator is already executing.");
			while ((g && ((g = 0), op[0] && (_ = 0)), _))
				try {
					if (
						((f = 1),
						y &&
							(t =
								op[0] & 2
									? y.return
									: op[0]
										? y.throw || ((t = y.return) && t.call(y), 0)
										: y.next) &&
							!(t = t.call(y, op[1])).done)
					)
						return t;
					if (((y = 0), t)) op = [op[0] & 2, t.value];
					switch (op[0]) {
						case 0:
						case 1:
							t = op;
							break;
						case 4:
							_.label++;
							return { value: op[1], done: false };
						case 5:
							_.label++;
							y = op[1];
							op = [0];
							continue;
						case 7:
							op = _.ops.pop();
							_.trys.pop();
							continue;
						default:
							if (
								!((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
								(op[0] === 6 || op[0] === 2)
							) {
								_ = 0;
								continue;
							}
							if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
								_.label = op[1];
								break;
							}
							if (op[0] === 6 && _.label < t[1]) {
								_.label = t[1];
								t = op;
								break;
							}
							if (t && _.label < t[2]) {
								_.label = t[2];
								_.ops.push(op);
								break;
							}
							if (t[2]) _.ops.pop();
							_.trys.pop();
							continue;
					}
					op = body.call(thisArg, _);
				} catch (e) {
					op = [6, e];
					y = 0;
				} finally {
					f = t = 0;
				}
			if (op[0] & 5) throw op[1];
			return { value: op[0] ? op[1] : void 0, done: true };
		}
	});
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTenantAccess = validateTenantAccess;
exports.getUserTenantInfo = getUserTenantInfo;
exports.withTenantIsolation = withTenantIsolation;
exports.createTenantPrismaClient = createTenantPrismaClient;
exports.validateResourceTenantAccess = validateResourceTenantAccess;
exports.auditTenantAccess = auditTenantAccess;
exports.getTenantConfig = getTenantConfig;
exports.requireTenantAccess = requireTenantAccess;
exports.getTenantCacheKey = getTenantCacheKey;
exports.getTenantEncryptionKey = getTenantEncryptionKey;
var db_1 = require("@GCMC-KAJ/db");
/**
 * Validate that a user has access to a specific tenant
 */
function validateTenantAccess(userId, tenantId) {
	return __awaiter(this, void 0, void 0, function () {
		var tenantUser;
		var error_1;
		return __generator(this, (_a) => {
			switch (_a.label) {
				case 0:
					_a.trys.push([0, 2, undefined, 3]);
					return [
						4 /*yield*/,
						db_1.default.tenantUser.findFirst({
							where: {
								userId: userId,
								tenantId: tenantId,
							},
							include: {
								role: true,
							},
						}),
					];
				case 1:
					tenantUser = _a.sent();
					// Super Admin can access any tenant
					if (
						(tenantUser === null || tenantUser === void 0
							? void 0
							: tenantUser.role.name) === "Super Admin"
					) {
						return [2 /*return*/, true];
					}
					return [2 /*return*/, tenantUser !== null];
				case 2:
					error_1 = _a.sent();
					console.error("Error validating tenant access:", error_1);
					return [2 /*return*/, false];
				case 3:
					return [2 /*return*/];
			}
		});
	});
}
/**
 * Get user's tenant information
 */
function getUserTenantInfo(userId) {
	return __awaiter(this, void 0, void 0, function () {
		var tenantUser;
		var error_2;
		return __generator(this, (_a) => {
			switch (_a.label) {
				case 0:
					_a.trys.push([0, 2, undefined, 3]);
					return [
						4 /*yield*/,
						db_1.default.tenantUser.findFirst({
							where: { userId: userId },
							include: {
								tenant: true,
								role: true,
							},
						}),
					];
				case 1:
					tenantUser = _a.sent();
					if (!tenantUser) return [2 /*return*/, null];
					return [
						2 /*return*/,
						{
							tenantId: tenantUser.tenantId,
							tenantCode: tenantUser.tenant.code,
							role: tenantUser.role.name,
						},
					];
				case 2:
					error_2 = _a.sent();
					console.error("Error getting user tenant info:", error_2);
					return [2 /*return*/, null];
				case 3:
					return [2 /*return*/];
			}
		});
	});
}
/**
 * Middleware to ensure tenant isolation in database queries
 */
function withTenantIsolation(tenantId, query) {
	// Add tenant filter to where clause
	if (query.where) {
		if (Array.isArray(query.where)) {
			query.where.push({ tenantId: tenantId });
		} else if (typeof query.where === "object") {
			query.where.tenantId = tenantId;
		}
	} else {
		query.where = { tenantId: tenantId };
	}
	return query;
}
/**
 * Create a tenant-scoped Prisma client
 */
function createTenantPrismaClient(tenantId) {
	return {
		client: {
			findMany: (args) =>
				db_1.default.client.findMany(withTenantIsolation(tenantId, args || {})),
			findFirst: (args) =>
				db_1.default.client.findFirst(
					withTenantIsolation(tenantId, args || {}),
				),
			findUnique: (args) => {
				// For unique queries, we need to verify tenant ownership after finding
				return db_1.default.client.findUnique(args).then((result) =>
					__awaiter(this, void 0, void 0, function () {
						return __generator(this, (_a) => {
							if (result && result.tenantId !== tenantId) {
								return [2 /*return*/, null]; // Hide result if it belongs to different tenant
							}
							return [2 /*return*/, result];
						});
					}),
				);
			},
			create: (args) => {
				if (!args.data) args.data = {};
				args.data.tenantId = tenantId;
				return db_1.default.client.create(args);
			},
			update: (args) =>
				db_1.default.client.update(withTenantIsolation(tenantId, args)),
			delete: (args) =>
				db_1.default.client.delete(withTenantIsolation(tenantId, args)),
			count: (args) =>
				db_1.default.client.count(withTenantIsolation(tenantId, args || {})),
		},
		document: {
			findMany: (args) =>
				db_1.default.document.findMany(
					__assign(__assign({}, args), {
						where: __assign(
							__assign(
								{},
								args === null || args === void 0 ? void 0 : args.where,
							),
							{
								client: {
									tenantId: tenantId,
								},
							},
						),
					}),
				),
			findFirst: (args) =>
				db_1.default.document.findFirst(
					__assign(__assign({}, args), {
						where: __assign(
							__assign(
								{},
								args === null || args === void 0 ? void 0 : args.where,
							),
							{
								client: {
									tenantId: tenantId,
								},
							},
						),
					}),
				),
			findUnique: (args) =>
				db_1.default.document
					.findUnique(
						__assign(__assign({}, args), {
							include: __assign(__assign({}, args.include), { client: true }),
						}),
					)
					.then((result) => {
						if (result && result.client.tenantId !== tenantId) {
							return null;
						}
						return result;
					}),
			create: (args) => {
				// Documents are created through clients, so tenant isolation is maintained
				return db_1.default.document.create(args);
			},
			update: (args) =>
				db_1.default.document.update(
					__assign(__assign({}, args), {
						where: __assign(__assign({}, args.where), {
							client: {
								tenantId: tenantId,
							},
						}),
					}),
				),
			delete: (args) =>
				db_1.default.document.delete(
					__assign(__assign({}, args), {
						where: __assign(__assign({}, args.where), {
							client: {
								tenantId: tenantId,
							},
						}),
					}),
				),
		},
		filing: {
			findMany: (args) =>
				db_1.default.filing.findMany(
					__assign(__assign({}, args), {
						where: __assign(
							__assign(
								{},
								args === null || args === void 0 ? void 0 : args.where,
							),
							{
								client: {
									tenantId: tenantId,
								},
							},
						),
					}),
				),
			findFirst: (args) =>
				db_1.default.filing.findFirst(
					__assign(__assign({}, args), {
						where: __assign(
							__assign(
								{},
								args === null || args === void 0 ? void 0 : args.where,
							),
							{
								client: {
									tenantId: tenantId,
								},
							},
						),
					}),
				),
			findUnique: (args) =>
				db_1.default.filing
					.findUnique(
						__assign(__assign({}, args), {
							include: __assign(__assign({}, args.include), { client: true }),
						}),
					)
					.then((result) => {
						if (result && result.client.tenantId !== tenantId) {
							return null;
						}
						return result;
					}),
			create: (args) => db_1.default.filing.create(args),
			update: (args) =>
				db_1.default.filing.update(
					__assign(__assign({}, args), {
						where: __assign(__assign({}, args.where), {
							client: {
								tenantId: tenantId,
							},
						}),
					}),
				),
			delete: (args) =>
				db_1.default.filing.delete(
					__assign(__assign({}, args), {
						where: __assign(__assign({}, args.where), {
							client: {
								tenantId: tenantId,
							},
						}),
					}),
				),
		},
	};
}
/**
 * Validate tenant isolation for a specific resource
 */
function validateResourceTenantAccess(resourceType, resourceId, tenantId) {
	return __awaiter(this, void 0, void 0, function () {
		var _a;
		var client;
		var document_1;
		var filing;
		var service;
		var error_3;
		return __generator(this, (_b) => {
			switch (_b.label) {
				case 0:
					_b.trys.push([0, 11, undefined, 12]);
					_a = resourceType;
					switch (_a) {
						case "client":
							return [3 /*break*/, 1];
						case "document":
							return [3 /*break*/, 3];
						case "filing":
							return [3 /*break*/, 5];
						case "service":
							return [3 /*break*/, 7];
					}
					return [3 /*break*/, 9];
				case 1:
					return [
						4 /*yield*/,
						db_1.default.client.findFirst({
							where: {
								id: Number(resourceId),
								tenantId: tenantId,
							},
						}),
					];
				case 2:
					client = _b.sent();
					return [2 /*return*/, client !== null];
				case 3:
					return [
						4 /*yield*/,
						db_1.default.document.findFirst({
							where: {
								id: Number(resourceId),
								client: {
									tenantId: tenantId,
								},
							},
						}),
					];
				case 4:
					document_1 = _b.sent();
					return [2 /*return*/, document_1 !== null];
				case 5:
					return [
						4 /*yield*/,
						db_1.default.filing.findFirst({
							where: {
								id: Number(resourceId),
								client: {
									tenantId: tenantId,
								},
							},
						}),
					];
				case 6:
					filing = _b.sent();
					return [2 /*return*/, filing !== null];
				case 7:
					return [
						4 /*yield*/,
						db_1.default.serviceType.findFirst({
							where: {
								id: Number(resourceId),
								tenantId: tenantId,
							},
						}),
					];
				case 8:
					service = _b.sent();
					return [2 /*return*/, service !== null];
				case 9:
					return [2 /*return*/, false];
				case 10:
					return [3 /*break*/, 12];
				case 11:
					error_3 = _b.sent();
					console.error(
						"Error validating ".concat(resourceType, " tenant access:"),
						error_3,
					);
					return [2 /*return*/, false];
				case 12:
					return [2 /*return*/];
			}
		});
	});
}
/**
 * Audit tenant access attempts
 */
function auditTenantAccess(
	userId,
	requestedTenantId,
	actualTenantId,
	resource,
	action,
	success,
) {
	return __awaiter(this, void 0, void 0, function () {
		var auditData;
		return __generator(this, (_a) => {
			auditData = {
				timestamp: new Date().toISOString(),
				userId: userId,
				requestedTenantId: requestedTenantId,
				actualTenantId: actualTenantId,
				resource: resource,
				action: action,
				success: success,
				crossTenantAttempt: requestedTenantId !== actualTenantId,
			};
			console.log("🔒 Tenant Access Audit:", auditData);
			// Log security incidents (cross-tenant access attempts)
			if (requestedTenantId !== actualTenantId && !success) {
				console.warn(
					"🚨 SECURITY INCIDENT: Cross-tenant access attempt detected!",
					auditData,
				);
				// In production, send alert to security monitoring system
			}
			return [2 /*return*/];
		});
	});
}
/**
 * Get tenant-specific configuration
 */
function getTenantConfig(tenantId) {
	return __awaiter(this, void 0, void 0, function () {
		var tenant;
		var error_4;
		return __generator(this, (_a) => {
			switch (_a.label) {
				case 0:
					_a.trys.push([0, 2, undefined, 3]);
					return [
						4 /*yield*/,
						db_1.default.tenant.findUnique({
							where: { id: tenantId },
							select: {
								settings: true,
								// Add any other tenant-specific configuration fields
							},
						}),
					];
				case 1:
					tenant = _a.sent();
					if (!tenant) return [2 /*return*/, null];
					return [
						2 /*return*/,
						{
							settings: tenant.settings || {},
							features: [], // Define tenant-specific features
							limits: {}, // Define tenant-specific limits
						},
					];
				case 2:
					error_4 = _a.sent();
					console.error("Error getting tenant config:", error_4);
					return [2 /*return*/, null];
				case 3:
					return [2 /*return*/];
			}
		});
	});
}
/**
 * Middleware function to ensure tenant isolation in API routes
 */
function requireTenantAccess(allowedRoles) {
	if (allowedRoles === void 0) {
		allowedRoles = [];
	}
	return (context, targetTenantId) =>
		__awaiter(this, void 0, void 0, function () {
			var checkTenantId;
			var hasAccess;
			return __generator(this, (_a) => {
				switch (_a.label) {
					case 0:
						checkTenantId = targetTenantId || context.tenantId;
						// Super Admin can access any tenant
						if (context.role === "Super Admin") {
							return [2 /*return*/, true];
						}
						return [
							4 /*yield*/,
							validateTenantAccess(context.userId, checkTenantId),
						];
					case 1:
						hasAccess = _a.sent();
						if (hasAccess) return [3 /*break*/, 3];
						return [
							4 /*yield*/,
							auditTenantAccess(
								context.userId,
								checkTenantId,
								context.tenantId,
								"api_access",
								"tenant_validation",
								false,
							),
						];
					case 2:
						_a.sent();
						throw new Error("Access denied: insufficient tenant permissions");
					case 3:
						// Check role restrictions if specified
						if (
							allowedRoles.length > 0 &&
							!allowedRoles.includes(context.role)
						) {
							throw new Error("Access denied: insufficient role permissions");
						}
						return [2 /*return*/, true];
				}
			});
		});
}
/**
 * Generate tenant-scoped cache keys
 */
function getTenantCacheKey(tenantId, key) {
	return "tenant:".concat(tenantId, ":").concat(key);
}
/**
 * Tenant data encryption key derivation
 */
function getTenantEncryptionKey(tenantId, baseKey) {
	var crypto = require("node:crypto");
	return crypto
		.createHmac("sha256", baseKey)
		.update("tenant:".concat(tenantId))
		.digest("hex");
}
