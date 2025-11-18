/**
 * Role-Based Access Control (RBAC) Guard
 *
 * Implements comprehensive RBAC with tenant isolation
 * Provides fine-grained permission checking and enforcement
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
exports.PERMISSION_MATRIX = void 0;
exports.hasPermission = hasPermission;
exports.requirePermission = requirePermission;
exports.hasAllPermissions = hasAllPermissions;
exports.hasAnyPermission = hasAnyPermission;
exports.getRolePermissions = getRolePermissions;
exports.validateTenantAccess = validateTenantAccess;
exports.getTenantFilteredData = getTenantFilteredData;
exports.logPermissionCheck = logPermissionCheck;
var db_1 = require("@GCMC-KAJ/db");
/**
 * Permission matrix for all roles
 * This defines what each role can do within their tenant
 */
exports.PERMISSION_MATRIX = {
	"Super Admin": {
		global: true, // Can access all tenants
		modules: {
			"*": ["*"], // All actions on all modules
		},
	},
	"Tenant Admin": {
		modules: {
			clients: ["view", "create", "edit", "delete"],
			documents: ["view", "create", "edit", "delete"],
			filings: ["view", "create", "edit", "delete"],
			services: ["view", "create", "edit", "delete"],
			users: ["view", "create", "edit", "delete"],
			settings: ["view", "edit"],
			analytics: ["view", "export"],
			compliance: ["view", "create", "edit"],
			tasks: ["view", "create", "edit", "delete"],
			notifications: ["view", "create", "edit", "delete"],
			profile: ["view", "edit"],
			dashboard: ["view"],
			reports: ["view", "create", "export"],
		},
	},
	Manager: {
		modules: {
			clients: ["view", "create", "edit"],
			documents: ["view", "create", "edit"],
			filings: ["view", "create", "edit"],
			services: ["view", "create", "edit"],
			users: ["view"],
			settings: ["view"],
			analytics: ["view"],
			compliance: ["view", "create", "edit"],
			tasks: ["view", "create", "edit"],
			notifications: ["view", "create"],
			profile: ["view", "edit"],
			dashboard: ["view"],
			reports: ["view", "create"],
		},
	},
	Supervisor: {
		modules: {
			clients: ["view", "create", "edit"],
			documents: ["view", "create", "edit"],
			filings: ["view", "create", "edit"],
			services: ["view", "create"],
			users: ["view"],
			analytics: ["view"],
			compliance: ["view", "create"],
			tasks: ["view", "create", "edit"],
			notifications: ["view"],
			profile: ["view", "edit"],
			dashboard: ["view"],
			reports: ["view"],
		},
	},
	"Senior Staff": {
		modules: {
			clients: ["view", "create", "edit"],
			documents: ["view", "create", "edit"],
			filings: ["view", "create", "edit"],
			services: ["view"],
			analytics: ["view"],
			compliance: ["view"],
			tasks: ["view", "create", "edit"],
			notifications: ["view"],
			profile: ["view", "edit"],
			dashboard: ["view"],
			reports: ["view"],
		},
	},
	Staff: {
		modules: {
			clients: ["view", "create", "edit"],
			documents: ["view", "create"],
			filings: ["view", "create"],
			services: ["view"],
			compliance: ["view"],
			tasks: ["view", "create"],
			notifications: ["view"],
			profile: ["view", "edit"],
			dashboard: ["view"],
			reports: ["view"],
		},
	},
	"Junior Staff": {
		modules: {
			clients: ["view"],
			documents: ["view"],
			filings: ["view"],
			services: ["view"],
			tasks: ["view", "create"],
			notifications: ["view"],
			profile: ["view", "edit"],
			dashboard: ["view"],
		},
	},
	Viewer: {
		modules: {
			clients: ["view"],
			documents: ["view"],
			filings: ["view"],
			services: ["view"],
			analytics: ["view"],
			compliance: ["view"],
			tasks: ["view"],
			notifications: ["view"],
			profile: ["view", "edit"],
			dashboard: ["view"],
		},
	},
};
/**
 * Check if a user has a specific permission
 */
function hasPermission(context, permission) {
	return __awaiter(this, void 0, void 0, function () {
		var rolePermissions;
		var modulePermissions;
		var hasModuleAccess;
		var _i;
		var _a;
		var inheritedRole;
		var inheritedContext;
		return __generator(this, (_b) => {
			switch (_b.label) {
				case 0:
					// Super Admin has all permissions globally
					if (context.role === "Super Admin") {
						return [2 /*return*/, true];
					}
					rolePermissions = exports.PERMISSION_MATRIX[context.role];
					if (!rolePermissions) {
						return [2 /*return*/, false];
					}
					// Check if role has global access (shouldn't apply to non-super-admin)
					if (rolePermissions.global && context.role !== "Super Admin") {
						return [2 /*return*/, false]; // Security: only Super Admin should have global access
					}
					modulePermissions = rolePermissions.modules[permission.module] || [];
					hasModuleAccess =
						modulePermissions.includes(permission.action) ||
						modulePermissions.includes("*");
					if (hasModuleAccess) return [3 /*break*/, 5];
					if (!rolePermissions.inherits) return [3 /*break*/, 4];
					(_i = 0), (_a = rolePermissions.inherits);
					_b.label = 1;
				case 1:
					if (!(_i < _a.length)) return [3 /*break*/, 4];
					inheritedRole = _a[_i];
					inheritedContext = __assign(__assign({}, context), {
						role: inheritedRole,
					});
					return [4 /*yield*/, hasPermission(inheritedContext, permission)];
				case 2:
					if (_b.sent()) {
						return [2 /*return*/, true];
					}
					_b.label = 3;
				case 3:
					_i++;
					return [3 /*break*/, 1];
				case 4:
					return [2 /*return*/, false];
				case 5:
					if (!permission.resourceId) return [3 /*break*/, 7];
					return [4 /*yield*/, hasResourcePermission(context, permission)];
				case 6:
					return [2 /*return*/, _b.sent()];
				case 7:
					return [2 /*return*/, true];
			}
		});
	});
}
/**
 * Check resource-specific permissions (e.g., user can only edit their own records)
 */
function hasResourcePermission(context, permission) {
	return __awaiter(this, void 0, void 0, function () {
		var _a;
		var client;
		var document_1;
		var filing;
		var targetUser;
		var error_1;
		return __generator(this, (_b) => {
			switch (_b.label) {
				case 0:
					if (!permission.resourceId) return [2 /*return*/, true];
					_b.label = 1;
				case 1:
					_b.trys.push([1, 12, undefined, 13]);
					_a = permission.module;
					switch (_a) {
						case "clients":
							return [3 /*break*/, 2];
						case "documents":
							return [3 /*break*/, 4];
						case "filings":
							return [3 /*break*/, 6];
						case "users":
							return [3 /*break*/, 8];
					}
					return [3 /*break*/, 10];
				case 2:
					return [
						4 /*yield*/,
						db_1.default.client.findFirst({
							where: {
								id: Number(permission.resourceId),
								tenantId: context.tenantId, // Tenant isolation
							},
						}),
					];
				case 3:
					client = _b.sent();
					return [2 /*return*/, client !== null];
				case 4:
					return [
						4 /*yield*/,
						db_1.default.document.findFirst({
							where: {
								id: Number(permission.resourceId),
								client: {
									tenantId: context.tenantId, // Tenant isolation
								},
							},
							include: { client: true },
						}),
					];
				case 5:
					document_1 = _b.sent();
					return [2 /*return*/, document_1 !== null];
				case 6:
					return [
						4 /*yield*/,
						db_1.default.filing.findFirst({
							where: {
								id: Number(permission.resourceId),
								client: {
									tenantId: context.tenantId, // Tenant isolation
								},
							},
							include: { client: true },
						}),
					];
				case 7:
					filing = _b.sent();
					return [2 /*return*/, filing !== null];
				case 8:
					// Users can edit their own profile, admins can edit tenant users
					if (permission.resourceId === context.userId) {
						return [2 /*return*/, true]; // Users can always edit their own profile
					}
					return [
						4 /*yield*/,
						db_1.default.tenantUser.findFirst({
							where: {
								userId: String(permission.resourceId),
								tenantId: context.tenantId,
							},
						}),
					];
				case 9:
					targetUser = _b.sent();
					return [
						2 /*return*/,
						targetUser !== null &&
							["Tenant Admin", "Manager"].includes(context.role),
					];
				case 10:
					return [2 /*return*/, true];
				case 11:
					return [3 /*break*/, 13];
				case 12:
					error_1 = _b.sent();
					console.error("Error checking resource permission:", error_1);
					return [2 /*return*/, false]; // Fail secure
				case 13:
					return [2 /*return*/];
			}
		});
	});
}
/**
 * Middleware function to check permissions in API routes
 */
function requirePermission(permission) {
	return (context) =>
		__awaiter(this, void 0, void 0, function () {
			var allowed;
			return __generator(this, (_a) => {
				switch (_a.label) {
					case 0:
						return [4 /*yield*/, hasPermission(context, permission)];
					case 1:
						allowed = _a.sent();
						if (!allowed) {
							throw new Error(
								"Access denied: insufficient permissions for "
									.concat(permission.module, ".")
									.concat(permission.action),
							);
						}
						return [2 /*return*/, true];
				}
			});
		});
}
/**
 * Check multiple permissions (ALL must be granted)
 */
function hasAllPermissions(context, permissions) {
	return __awaiter(this, void 0, void 0, function () {
		var _i;
		var permissions_1;
		var permission;
		return __generator(this, (_a) => {
			switch (_a.label) {
				case 0:
					(_i = 0), (permissions_1 = permissions);
					_a.label = 1;
				case 1:
					if (!(_i < permissions_1.length)) return [3 /*break*/, 4];
					permission = permissions_1[_i];
					return [4 /*yield*/, hasPermission(context, permission)];
				case 2:
					if (!_a.sent()) {
						return [2 /*return*/, false];
					}
					_a.label = 3;
				case 3:
					_i++;
					return [3 /*break*/, 1];
				case 4:
					return [2 /*return*/, true];
			}
		});
	});
}
/**
 * Check multiple permissions (ANY can be granted)
 */
function hasAnyPermission(context, permissions) {
	return __awaiter(this, void 0, void 0, function () {
		var _i;
		var permissions_2;
		var permission;
		return __generator(this, (_a) => {
			switch (_a.label) {
				case 0:
					(_i = 0), (permissions_2 = permissions);
					_a.label = 1;
				case 1:
					if (!(_i < permissions_2.length)) return [3 /*break*/, 4];
					permission = permissions_2[_i];
					return [4 /*yield*/, hasPermission(context, permission)];
				case 2:
					if (_a.sent()) {
						return [2 /*return*/, true];
					}
					_a.label = 3;
				case 3:
					_i++;
					return [3 /*break*/, 1];
				case 4:
					return [2 /*return*/, false];
			}
		});
	});
}
/**
 * Get all permissions for a role
 */
function getRolePermissions(role) {
	var roleData = exports.PERMISSION_MATRIX[role];
	if (!roleData) return [];
	var permissions = [];
	for (
		var _i = 0, _a = Object.entries(roleData.modules);
		_i < _a.length;
		_i++
	) {
		var _b = _a[_i];
		var module_1 = _b[0];
		var actions = _b[1];
		for (var _c = 0, actions_1 = actions; _c < actions_1.length; _c++) {
			var action = actions_1[_c];
			permissions.push({ module: module_1, action: action });
		}
	}
	return permissions;
}
/**
 * Ensure tenant isolation - verify user belongs to tenant
 */
function validateTenantAccess(userId, tenantId) {
	return __awaiter(this, void 0, void 0, function () {
		var userTenant;
		var tenantUser;
		var error_2;
		return __generator(this, (_a) => {
			switch (_a.label) {
				case 0:
					_a.trys.push([0, 3, undefined, 4]);
					return [
						4 /*yield*/,
						db_1.default.tenantUser.findFirst({
							where: { userId: userId },
							include: { role: true },
						}),
					];
				case 1:
					userTenant = _a.sent();
					if (
						(userTenant === null || userTenant === void 0
							? void 0
							: userTenant.role.name) === "Super Admin"
					) {
						return [2 /*return*/, true];
					}
					return [
						4 /*yield*/,
						db_1.default.tenantUser.findFirst({
							where: {
								userId: userId,
								tenantId: tenantId,
							},
						}),
					];
				case 2:
					tenantUser = _a.sent();
					return [2 /*return*/, tenantUser !== null];
				case 3:
					error_2 = _a.sent();
					console.error("Error validating tenant access:", error_2);
					return [2 /*return*/, false]; // Fail secure
				case 4:
					return [2 /*return*/];
			}
		});
	});
}
/**
 * Get filtered data based on user's tenant and permissions
 */
function getTenantFilteredData(context, query) {
	return __awaiter(this, void 0, void 0, function () {
		var error_3;
		return __generator(this, (_a) => {
			switch (_a.label) {
				case 0:
					_a.trys.push([0, 4, undefined, 5]);
					if (!(context.role === "Super Admin")) return [3 /*break*/, 2];
					return [4 /*yield*/, query()];
				case 1:
					return [2 /*return*/, _a.sent()];
				case 2:
					return [4 /*yield*/, query()];
				case 3:
					// Other users see only their tenant data
					// The query should already include tenant filtering
					return [2 /*return*/, _a.sent()];
				case 4:
					error_3 = _a.sent();
					console.error("Error in tenant-filtered data query:", error_3);
					return [2 /*return*/, []]; // Fail secure
				case 5:
					return [2 /*return*/];
			}
		});
	});
}
/**
 * Audit log for permission checks
 */
function logPermissionCheck(context, permission, granted, resourceDetails) {
	return __awaiter(this, void 0, void 0, function () {
		var logEntry;
		return __generator(this, (_a) => {
			try {
				logEntry = {
					timestamp: new Date().toISOString(),
					userId: context.userId,
					tenantId: context.tenantId,
					role: context.role,
					module: permission.module,
					action: permission.action,
					resourceId: permission.resourceId,
					granted: granted,
					resourceDetails: resourceDetails,
				};
				console.log("🔒 Permission Check:", logEntry);
				// TODO: Send to audit logging service
				// await auditLogger.log('PERMISSION_CHECK', logEntry);
			} catch (error) {
				console.error("Error logging permission check:", error);
			}
			return [2 /*return*/];
		});
	});
}
