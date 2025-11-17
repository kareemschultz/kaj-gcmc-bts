/**
 * Health Check and Monitoring Router
 *
 * Provides health checks, metrics, and system status endpoints
 */

import { router, publicProcedure } from "../index";
import { z } from "zod";
import { getContainer } from "../infrastructure/bootstrap/ServiceRegistration";
import { ServiceTokens } from "../infrastructure/di/Container";
import { metrics } from "../infrastructure/monitoring/MetricsCollector";
import { config } from "../config";
import type { DatabaseService } from "../infrastructure/database/DatabaseService";
import type { CacheService } from "../infrastructure/caching/CacheService";

export const healthRouter = router({
  /**
   * Basic health check endpoint
   */
  check: publicProcedure
    .query(async () => {
      try {
        const container = getContainer();
        const databaseService = container.resolve<DatabaseService>(ServiceTokens.DATABASE);
        const cacheService = container.resolve<CacheService>(ServiceTokens.CACHE_SERVICE);

        // Check database connectivity
        const dbHealthy = await databaseService.healthCheck();

        // Check cache connectivity
        const cacheHealthy = await cacheService.set('health-check', 'ok', { ttl: 60 })
          .then(() => true)
          .catch(() => false);

        const isHealthy = dbHealthy && cacheHealthy;

        return {
          status: isHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
          environment: config.environment,
          checks: {
            database: dbHealthy ? 'healthy' : 'unhealthy',
            cache: cacheHealthy ? 'healthy' : 'unhealthy'
          }
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }),

  /**
   * Detailed system status
   */
  status: publicProcedure
    .query(async () => {
      try {
        const container = getContainer();
        const databaseService = container.resolve<DatabaseService>(ServiceTokens.DATABASE);
        const cacheService = container.resolve<CacheService>(ServiceTokens.CACHE_SERVICE);

        const [dbStats, cacheStats] = await Promise.all([
          databaseService.getStats(),
          cacheService.getStats()
        ]);

        return {
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          version: process.env.npm_package_version || '1.0.0',
          environment: config.environment,
          services: {
            database: {
              status: dbStats.isHealthy ? 'healthy' : 'unhealthy',
              stats: dbStats
            },
            cache: {
              status: 'healthy', // Simplified
              stats: cacheStats
            },
            redis: {
              status: 'connected' // Simplified - would check actual Redis connection
            }
          },
          features: config.features
        };
      } catch (error) {
        return {
          timestamp: new Date().toISOString(),
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }),

  /**
   * Prometheus metrics endpoint
   */
  metrics: publicProcedure
    .query(async () => {
      try {
        const metricsOutput = metrics.getMetrics();

        return {
          contentType: 'text/plain',
          body: metricsOutput
        };
      } catch (error) {
        throw new Error(`Failed to generate metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }),

  /**
   * System information endpoint
   */
  info: publicProcedure
    .query(async () => {
      return {
        service: 'GCMC-KAJ API',
        version: process.env.npm_package_version || '1.0.0',
        environment: config.environment,
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        timestamp: new Date().toISOString(),
        config: {
          database: {
            maxConnections: config.database.maxConnections,
            enableMetrics: config.database.enableMetrics
          },
          cache: {
            defaultTtl: config.cache.defaultTtl,
            l1MaxSize: config.cache.l1MaxSize
          },
          features: config.features
        }
      };
    }),

  /**
   * Readiness probe
   */
  ready: publicProcedure
    .query(async () => {
      try {
        const container = getContainer();
        const databaseService = container.resolve<DatabaseService>(ServiceTokens.DATABASE);

        // Check if all critical services are ready
        const dbReady = await databaseService.healthCheck();

        if (!dbReady) {
          throw new Error('Database not ready');
        }

        return {
          status: 'ready',
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }),

  /**
   * Liveness probe
   */
  live: publicProcedure
    .query(async () => {
      return {
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };
    })
});