/**
 * Enhanced Database Service
 *
 * Database connection pooling, health monitoring, and optimization
 */

import { PrismaClient } from '@GCMC-KAJ/db';
import { logger } from '../logging/Logger';
import { metrics } from '../monitoring/MetricsCollector';

export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  enableLogging: boolean;
  enableMetrics: boolean;
}

export interface DatabaseStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
  queriesExecuted: number;
  avgQueryDuration: number;
  isHealthy: boolean;
}

export class DatabaseService {
  private prisma: PrismaClient;
  private config: DatabaseConfig;
  private stats: DatabaseStats;

  // Metrics
  private queryCounter = metrics.createCounter('database_queries_total', 'Total database queries executed');
  private queryDurationHistogram = metrics.createHistogram('database_query_duration_seconds', 'Database query duration');
  private connectionGauge = metrics.createGauge('database_connections_active', 'Active database connections');
  private errorCounter = metrics.createCounter('database_errors_total', 'Total database errors');

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingConnections: 0,
      queriesExecuted: 0,
      avgQueryDuration: 0,
      isHealthy: false
    };

    this.initializePrisma();
  }

  private initializePrisma(): void {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.config.url
        }
      },
      log: this.config.enableLogging ? [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' }
      ] : [],
    });

    // Query logging and metrics
    if (this.config.enableLogging) {
      this.prisma.$on('query', (e) => {
        logger.debug('Database query executed', {
          query: e.query,
          params: e.params,
          duration: e.duration,
          target: e.target
        });

        if (this.config.enableMetrics) {
          this.queryCounter.increment({ operation: 'query' });
          this.queryDurationHistogram.observe(e.duration / 1000); // Convert to seconds
        }
      });

      this.prisma.$on('error', (e) => {
        logger.error('Database error', undefined, {
          target: e.target,
          message: e.message
        });

        if (this.config.enableMetrics) {
          this.errorCounter.increment({ type: 'query_error' });
        }
      });

      this.prisma.$on('warn', (e) => {
        logger.warn('Database warning', {
          target: e.target,
          message: e.message
        });
      });
    }

    // Connection monitoring
    this.setupConnectionMonitoring();
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.stats.isHealthy = true;
      logger.info('Database connected successfully', {
        maxConnections: this.config.maxConnections
      });
    } catch (error) {
      this.stats.isHealthy = false;
      logger.error('Database connection failed', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.stats.isHealthy = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Database disconnection failed', error);
      throw error;
    }
  }

  get client(): PrismaClient {
    return this.prisma;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.stats.isHealthy = true;
      return true;
    } catch (error) {
      this.stats.isHealthy = false;
      logger.error('Database health check failed', error);
      return false;
    }
  }

  async getStats(): Promise<DatabaseStats> {
    // In a real implementation, you would query the database for actual connection stats
    // This is a simplified version
    return { ...this.stats };
  }

  // Transaction wrapper with metrics and error handling
  async executeTransaction<T>(
    operation: (tx: PrismaClient) => Promise<T>,
    options: { timeout?: number; maxRetries?: number } = {}
  ): Promise<T> {
    const { timeout = 30000, maxRetries = 3 } = options;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          this.prisma.$transaction(operation),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Transaction timeout')), timeout)
          )
        ]);

        this.queryCounter.increment({ operation: 'transaction', status: 'success' });
        return result;
      } catch (error) {
        lastError = error as Error;

        this.errorCounter.increment({ type: 'transaction_error', attempt: attempt.toString() });

        logger.warn('Transaction failed', lastError, {
          attempt,
          maxRetries,
          willRetry: attempt < maxRetries
        });

        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    this.queryCounter.increment({ operation: 'transaction', status: 'failed' });
    throw lastError;
  }

  // Query wrapper with metrics and optimization hints
  async executeQuery<T>(
    query: () => Promise<T>,
    options: {
      cacheKey?: string;
      ttl?: number;
      tags?: string[];
      optimization?: 'read_replica' | 'write_primary';
    } = {}
  ): Promise<T> {
    const start = Date.now();

    try {
      // In a more advanced setup, you could route read queries to read replicas
      const result = await query();

      const duration = Date.now() - start;
      this.stats.queriesExecuted++;
      this.stats.avgQueryDuration =
        (this.stats.avgQueryDuration * (this.stats.queriesExecuted - 1) + duration) / this.stats.queriesExecuted;

      if (this.config.enableMetrics) {
        this.queryCounter.increment({ operation: 'query', status: 'success' });
        this.queryDurationHistogram.observe(duration / 1000);
      }

      return result;
    } catch (error) {
      if (this.config.enableMetrics) {
        this.errorCounter.increment({ type: 'query_error' });
      }

      logger.error('Query execution failed', error as Error, {
        duration: Date.now() - start,
        optimization: options.optimization
      });

      throw error;
    }
  }

  private setupConnectionMonitoring(): void {
    // Periodic connection monitoring
    setInterval(async () => {
      try {
        const isHealthy = await this.healthCheck();

        if (this.config.enableMetrics) {
          // In a real implementation, you would get actual connection pool stats
          this.connectionGauge.set(this.stats.activeConnections);
        }

        if (!isHealthy && this.stats.isHealthy) {
          logger.error('Database connection lost');
          // Could trigger alerts or failover logic here
        }
      } catch (error) {
        logger.error('Connection monitoring failed', error as Error);
      }
    }, 30000); // Every 30 seconds
  }

  // Query optimization helpers
  async executeWithQueryPlan<T>(
    query: () => Promise<T>,
    queryName: string
  ): Promise<T> {
    // For query analysis and optimization
    const start = Date.now();

    try {
      const result = await query();

      const duration = Date.now() - start;
      if (duration > 5000) { // Log slow queries
        logger.warn('Slow query detected', {
          queryName,
          duration,
          threshold: 5000
        });
      }

      return result;
    } catch (error) {
      logger.error('Query execution failed', error as Error, { queryName });
      throw error;
    }
  }

  // Database migration and schema management helpers
  async validateSchema(): Promise<boolean> {
    try {
      // Run basic schema validation queries
      await this.prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1`;
      return true;
    } catch (error) {
      logger.error('Schema validation failed', error as Error);
      return false;
    }
  }

  async getConnectionPoolInfo(): Promise<any> {
    // In a production environment, you would implement actual connection pool monitoring
    return {
      maxConnections: this.config.maxConnections,
      activeConnections: this.stats.activeConnections,
      idleConnections: this.stats.idleConnections,
      waitingConnections: this.stats.waitingConnections
    };
  }
}

// Global database service instance
let databaseService: DatabaseService;

export function initializeDatabaseService(config: DatabaseConfig): DatabaseService {
  databaseService = new DatabaseService(config);
  return databaseService;
}

export function getDatabaseService(): DatabaseService {
  if (!databaseService) {
    throw new Error('Database service not initialized. Call initializeDatabaseService first.');
  }
  return databaseService;
}