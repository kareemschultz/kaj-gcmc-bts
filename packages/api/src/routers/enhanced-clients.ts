/**
 * Enhanced Clients tRPC Router
 *
 * Demonstrates the new architecture with DDD, caching, monitoring, and error handling
 */

import { z } from "zod";
import type { ClientService } from "../application/services/ClientService";
import { User } from "../domains/auth/entities/User";
import { ClientType, RiskLevel } from "../domains/client/entities/Client";
import { rbacProcedure, router } from "../index";
import { getContainer } from "../infrastructure/bootstrap/ServiceRegistration";
import type { CacheService } from "../infrastructure/caching/CacheService";
import {
	CacheKeyBuilder,
	CacheTags,
} from "../infrastructure/caching/CacheService";
import { ServiceTokens } from "../infrastructure/di/Container";
import { logger } from "../infrastructure/logging/Logger";
import { metrics } from "../infrastructure/monitoring/MetricsCollector";
import { handleError, withRetry } from "../middleware/errorHandler";

// Input validation schemas
const createClientSchema = z.object({
	name: z.string().min(1).max(255),
	type: z.nativeEnum(ClientType),
	email: z.string().email().optional(),
	phone: z.string().max(20).optional(),
	address: z.string().max(500).optional(),
	tin: z.string().max(50).optional(),
	nisNumber: z.string().max(50).optional(),
	sector: z.string().max(100).optional(),
	notes: z.string().max(1000).optional(),
});

const updateClientSchema = createClientSchema.partial().extend({
	id: z.number(),
	riskLevel: z.nativeEnum(RiskLevel).optional(),
});

const listClientsSchema = z
	.object({
		type: z.nativeEnum(ClientType).optional(),
		riskLevel: z.nativeEnum(RiskLevel).optional(),
		sector: z.string().optional(),
		search: z.string().optional(),
		page: z.number().min(1).default(1),
		limit: z.number().min(1).max(100).default(50),
	})
	.optional();

// Performance metrics
const routerMetrics = {
	requestCounter: metrics.createCounter(
		"client_router_requests_total",
		"Total client router requests",
	),
	requestDuration: metrics.createTimer(
		"client_router_request_duration",
		"Client router request duration",
	),
	cacheHitCounter: metrics.createCounter(
		"client_router_cache_hits_total",
		"Client router cache hits",
	),
};

/**
 * Enhanced Clients Router
 */
export const enhancedClientsRouter = router({
	/**
	 * List clients with enhanced caching and monitoring
	 */
	list: rbacProcedure("clients", "view")
		.input(listClientsSchema)
		.query(async ({ ctx, input }) => {
			return routerMetrics.requestDuration.timeAsync(
				async () => {
					routerMetrics.requestCounter.increment({
						operation: "list",
						tenantId: ctx.tenantId.toString(),
					});

					try {
						const container = getContainer();
						const clientService = container.resolve<ClientService>(
							ServiceTokens.CLIENT_SERVICE,
						);
						const cacheService = container.resolve<CacheService>(
							ServiceTokens.CACHE_SERVICE,
						);

						const query = input || {};
						const cacheKey = CacheKeyBuilder.clientList(
							ctx.tenantId,
							JSON.stringify(query),
						);

						// Try cache first
						const cachedResult = await cacheService.get(cacheKey, {
							namespace: "clients",
							ttl: 300, // 5 minutes
						});

						if (cachedResult) {
							routerMetrics.cacheHitCounter.increment({ operation: "list" });
							logger.info("Client list served from cache", {
								tenantId: ctx.tenantId,
								cacheKey,
								query,
							});
							return cachedResult;
						}

						// Fetch from service with retry logic
						const result = await withRetry(
							() => clientService.listClients(query, ctx.tenantId),
							{
								maxRetries: 3,
								delayMs: 1000,
							},
						);

						// Cache the result
						await cacheService.set(cacheKey, result, {
							namespace: "clients",
							ttl: 300,
							tags: [CacheTags.client(ctx.tenantId)],
						});

						logger.info("Client list fetched and cached", {
							tenantId: ctx.tenantId,
							count: result.clients.length,
							total: result.total,
							query,
						});

						return result;
					} catch (error) {
						throw handleError(error, {
							tenantId: ctx.tenantId,
							userId: ctx.user.id,
							operation: "list_clients",
							input,
						});
					}
				},
				{ operation: "list", tenantId: ctx.tenantId.toString() },
			);
		}),

	/**
	 * Get single client with caching
	 */
	get: rbacProcedure("clients", "view")
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			return routerMetrics.requestDuration.timeAsync(
				async () => {
					routerMetrics.requestCounter.increment({
						operation: "get",
						tenantId: ctx.tenantId.toString(),
					});

					try {
						const container = getContainer();
						const clientService = container.resolve<ClientService>(
							ServiceTokens.CLIENT_SERVICE,
						);
						const cacheService = container.resolve<CacheService>(
							ServiceTokens.CACHE_SERVICE,
						);

						const cacheKey = CacheKeyBuilder.client(ctx.tenantId, input.id);

						// Try cache first
						const cachedClient = await cacheService.get(cacheKey, {
							namespace: "clients",
							ttl: 600, // 10 minutes
						});

						if (cachedClient) {
							routerMetrics.cacheHitCounter.increment({ operation: "get" });
							logger.debug("Client served from cache", {
								tenantId: ctx.tenantId,
								clientId: input.id,
							});
							return cachedClient;
						}

						// Fetch from service
						const client = await clientService.getClient(
							input.id,
							ctx.tenantId,
						);

						// Cache the result
						await cacheService.set(cacheKey, client.toJSON(), {
							namespace: "clients",
							ttl: 600,
							tags: [CacheTags.client(ctx.tenantId, input.id)],
						});

						logger.info("Client fetched and cached", {
							tenantId: ctx.tenantId,
							clientId: input.id,
							clientName: client.name,
						});

						return client.toJSON();
					} catch (error) {
						throw handleError(error, {
							tenantId: ctx.tenantId,
							userId: ctx.user.id,
							operation: "get_client",
							input,
						});
					}
				},
				{ operation: "get", tenantId: ctx.tenantId.toString() },
			);
		}),

	/**
	 * Create client with domain events and cache invalidation
	 */
	create: rbacProcedure("clients", "create")
		.input(createClientSchema)
		.mutation(async ({ ctx, input }) => {
			return routerMetrics.requestDuration.timeAsync(
				async () => {
					routerMetrics.requestCounter.increment({
						operation: "create",
						tenantId: ctx.tenantId.toString(),
					});

					try {
						const container = getContainer();
						const clientService = container.resolve<ClientService>(
							ServiceTokens.CLIENT_SERVICE,
						);

						// Convert context user to domain user
						const user = new User({
							id: ctx.user.id,
							name: ctx.user.name,
							email: ctx.user.email,
							emailVerified: true, // Simplified
							createdAt: new Date(),
							updatedAt: new Date(),
						});

						const client = await clientService.createClient(
							input,
							ctx.tenantId,
							user,
						);

						logger.info("Client created successfully", {
							tenantId: ctx.tenantId,
							clientId: client.id,
							clientName: client.name,
							createdBy: ctx.user.id,
						});

						return client.toJSON();
					} catch (error) {
						throw handleError(error, {
							tenantId: ctx.tenantId,
							userId: ctx.user.id,
							operation: "create_client",
							input,
						});
					}
				},
				{ operation: "create", tenantId: ctx.tenantId.toString() },
			);
		}),

	/**
	 * Update client with optimistic locking and cache invalidation
	 */
	update: rbacProcedure("clients", "edit")
		.input(updateClientSchema)
		.mutation(async ({ ctx, input }) => {
			return routerMetrics.requestDuration.timeAsync(
				async () => {
					routerMetrics.requestCounter.increment({
						operation: "update",
						tenantId: ctx.tenantId.toString(),
					});

					try {
						const container = getContainer();
						const clientService = container.resolve<ClientService>(
							ServiceTokens.CLIENT_SERVICE,
						);

						const { id, ...updateData } = input;

						// Convert context user to domain user
						const user = new User({
							id: ctx.user.id,
							name: ctx.user.name,
							email: ctx.user.email,
							emailVerified: true,
							createdAt: new Date(),
							updatedAt: new Date(),
						});

						const updatedClient = await clientService.updateClient(
							id,
							updateData,
							ctx.tenantId,
							user,
						);

						logger.info("Client updated successfully", {
							tenantId: ctx.tenantId,
							clientId: id,
							updatedBy: ctx.user.id,
							changes: Object.keys(updateData),
						});

						return updatedClient.toJSON();
					} catch (error) {
						throw handleError(error, {
							tenantId: ctx.tenantId,
							userId: ctx.user.id,
							operation: "update_client",
							input,
						});
					}
				},
				{ operation: "update", tenantId: ctx.tenantId.toString() },
			);
		}),

	/**
	 * Delete client with business rule validation
	 */
	delete: rbacProcedure("clients", "delete")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return routerMetrics.requestDuration.timeAsync(
				async () => {
					routerMetrics.requestCounter.increment({
						operation: "delete",
						tenantId: ctx.tenantId.toString(),
					});

					try {
						const container = getContainer();
						const clientService = container.resolve<ClientService>(
							ServiceTokens.CLIENT_SERVICE,
						);

						const user = new User({
							id: ctx.user.id,
							name: ctx.user.name,
							email: ctx.user.email,
							emailVerified: true,
							createdAt: new Date(),
							updatedAt: new Date(),
						});

						await clientService.deleteClient(input.id, ctx.tenantId, user);

						logger.info("Client deleted successfully", {
							tenantId: ctx.tenantId,
							clientId: input.id,
							deletedBy: ctx.user.id,
						});

						return { success: true };
					} catch (error) {
						throw handleError(error, {
							tenantId: ctx.tenantId,
							userId: ctx.user.id,
							operation: "delete_client",
							input,
						});
					}
				},
				{ operation: "delete", tenantId: ctx.tenantId.toString() },
			);
		}),

	/**
	 * Assess client risk level
	 */
	assessRisk: rbacProcedure("clients", "edit")
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return routerMetrics.requestDuration.timeAsync(
				async () => {
					routerMetrics.requestCounter.increment({
						operation: "assess_risk",
						tenantId: ctx.tenantId.toString(),
					});

					try {
						const container = getContainer();
						const clientService = container.resolve<ClientService>(
							ServiceTokens.CLIENT_SERVICE,
						);

						const user = new User({
							id: ctx.user.id,
							name: ctx.user.name,
							email: ctx.user.email,
							emailVerified: true,
							createdAt: new Date(),
							updatedAt: new Date(),
						});

						const riskLevel = await clientService.assessClientRisk(
							input.id,
							ctx.tenantId,
							user,
						);

						logger.info("Client risk assessed", {
							tenantId: ctx.tenantId,
							clientId: input.id,
							riskLevel,
							assessedBy: ctx.user.id,
						});

						return { riskLevel };
					} catch (error) {
						throw handleError(error, {
							tenantId: ctx.tenantId,
							userId: ctx.user.id,
							operation: "assess_client_risk",
							input,
						});
					}
				},
				{ operation: "assess_risk", tenantId: ctx.tenantId.toString() },
			);
		}),

	/**
	 * Get client statistics with caching
	 */
	stats: rbacProcedure("clients", "view").query(async ({ ctx }) => {
		return routerMetrics.requestDuration.timeAsync(
			async () => {
				routerMetrics.requestCounter.increment({
					operation: "stats",
					tenantId: ctx.tenantId.toString(),
				});

				try {
					const container = getContainer();
					const cacheService = container.resolve<CacheService>(
						ServiceTokens.CACHE_SERVICE,
					);

					const cacheKey = `client_stats:${ctx.tenantId}`;

					// Try cache first
					const cachedStats = await cacheService.get(cacheKey, {
						namespace: "clients",
						ttl: 900, // 15 minutes
					});

					if (cachedStats) {
						routerMetrics.cacheHitCounter.increment({ operation: "stats" });
						return cachedStats;
					}

					// Calculate stats - in a real implementation, this would use the service layer
					// For demonstration, using simplified direct queries
					const _clientService = container.resolve<ClientService>(
						ServiceTokens.CLIENT_SERVICE,
					);

					// This is a simplified stats calculation
					const stats = {
						total: 0, // Would calculate actual stats
						byType: {},
						byRiskLevel: {},
						recentlyCreated: 0,
					};

					// Cache the result
					await cacheService.set(cacheKey, stats, {
						namespace: "clients",
						ttl: 900,
						tags: [CacheTags.client(ctx.tenantId)],
					});

					return stats;
				} catch (error) {
					throw handleError(error, {
						tenantId: ctx.tenantId,
						userId: ctx.user.id,
						operation: "get_client_stats",
					});
				}
			},
			{ operation: "stats", tenantId: ctx.tenantId.toString() },
		);
	}),
});
