/**
 * Service Registration & Bootstrap
 *
 * Configures dependency injection and initializes all services
 */

import { Container, ServiceTokens } from '../di/Container';
import { PrismaClientRepository } from '../repositories/PrismaClientRepository';
import { ClientService } from '../../application/services/ClientService';
import { MultiLevelCacheService } from '../caching/CacheService';
import { StructuredLogger } from '../logging/Logger';
import { MetricsCollector } from '../monitoring/MetricsCollector';
import { DatabaseService, initializeDatabaseService } from '../database/DatabaseService';
import { domainEventDispatcher } from '../../domains/shared/events/DomainEvent';
import {
  ClientCreatedEventHandler,
  ClientUpdatedEventHandler,
  ClientRiskLevelChangedEventHandler
} from '../../application/events/ClientEventHandlers';
import Redis from 'ioredis';

export interface ServiceConfiguration {
  database: {
    url: string;
    maxConnections: number;
    connectionTimeout: number;
    idleTimeout: number;
    enableLogging: boolean;
    enableMetrics: boolean;
  };
  redis: {
    url: string;
    maxRetriesPerRequest: number;
  };
  cache: {
    defaultTtl: number;
    l1MaxSize: number;
  };
  logging: {
    level: string;
    enableStructured: boolean;
  };
  metrics: {
    enabled: boolean;
    collectInterval: number;
  };
}

export class ServiceRegistry {
  private container: Container;
  private config: ServiceConfiguration;
  private isInitialized = false;

  constructor(config: ServiceConfiguration) {
    this.container = new Container();
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Services already initialized');
    }

    try {
      // Register infrastructure services
      await this.registerInfrastructure();

      // Register repositories
      this.registerRepositories();

      // Register application services
      this.registerApplicationServices();

      // Register event handlers
      this.registerEventHandlers();

      // Initialize services that need startup
      await this.initializeServices();

      this.isInitialized = true;

      console.log('✅ All services registered and initialized successfully');
    } catch (error) {
      console.error('❌ Service initialization failed:', error);
      throw error;
    }
  }

  private async registerInfrastructure(): Promise<void> {
    // Database Service
    const databaseService = initializeDatabaseService(this.config.database);
    this.container.instance(ServiceTokens.DATABASE, databaseService);

    // Redis Client
    const redisClient = new Redis(this.config.redis.url, {
      maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest
    });
    this.container.instance('RedisClient', redisClient);

    // Cache Service
    this.container.singleton(ServiceTokens.CACHE_SERVICE, () => {
      const redisClient = this.container.resolve<Redis>('RedisClient');
      return new MultiLevelCacheService(redisClient, this.config.cache.defaultTtl);
    });

    // Logger
    this.container.singleton(ServiceTokens.LOGGER, () => {
      return new StructuredLogger('gcmc-kaj-api', {
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Metrics
    this.container.singleton('MetricsCollector', () => {
      return new MetricsCollector();
    });

    // Event Dispatcher
    this.container.instance(ServiceTokens.EVENT_DISPATCHER, domainEventDispatcher);
  }

  private registerRepositories(): void {
    // Client Repository
    this.container.singleton(ServiceTokens.CLIENT_REPOSITORY, () => {
      return new PrismaClientRepository();
    });

    // Additional repositories would be registered here
    // this.container.singleton(ServiceTokens.DOCUMENT_REPOSITORY, () => new PrismaDocumentRepository());
    // this.container.singleton(ServiceTokens.FILING_REPOSITORY, () => new PrismaFilingRepository());
  }

  private registerApplicationServices(): void {
    // Audit Service (simple implementation)
    this.container.singleton(ServiceTokens.AUDIT_SERVICE, () => {
      const databaseService = this.container.resolve<DatabaseService>(ServiceTokens.DATABASE);
      return {
        async log(entry: any): Promise<void> {
          await databaseService.client.auditLog.create({
            data: {
              tenantId: entry.tenantId,
              actorUserId: entry.actorUserId,
              entityType: entry.entityType,
              entityId: entry.entityId,
              action: entry.action,
              changes: entry.changes,
              ipAddress: entry.ipAddress,
              userAgent: entry.userAgent
            }
          });
        }
      };
    });

    // Client Service
    this.container.singleton(ServiceTokens.CLIENT_SERVICE, () => {
      const clientRepository = this.container.resolve(ServiceTokens.CLIENT_REPOSITORY);
      const auditService = this.container.resolve(ServiceTokens.AUDIT_SERVICE);
      return new ClientService(clientRepository, auditService);
    });

    // Additional services would be registered here
  }

  private registerEventHandlers(): void {
    const cacheService = this.container.resolve(ServiceTokens.CACHE_SERVICE);
    const auditService = this.container.resolve(ServiceTokens.AUDIT_SERVICE);

    // Client event handlers
    const clientCreatedHandler = new ClientCreatedEventHandler(cacheService, auditService);
    const clientUpdatedHandler = new ClientUpdatedEventHandler(cacheService, auditService);
    const clientRiskChangedHandler = new ClientRiskLevelChangedEventHandler(cacheService);

    // Subscribe to events
    domainEventDispatcher.subscribe('client.created', clientCreatedHandler);
    domainEventDispatcher.subscribe('client.updated', clientUpdatedHandler);
    domainEventDispatcher.subscribe('client.risk_level_changed', clientRiskChangedHandler);
  }

  private async initializeServices(): Promise<void> {
    // Connect to database
    const databaseService = this.container.resolve<DatabaseService>(ServiceTokens.DATABASE);
    await databaseService.connect();

    // Test Redis connection
    const redisClient = this.container.resolve<Redis>('RedisClient');
    await redisClient.ping();

    // Validate cache service
    const cacheService = this.container.resolve<MultiLevelCacheService>(ServiceTokens.CACHE_SERVICE);
    await cacheService.set('health-check', { status: 'ok' }, { ttl: 60 });

    console.log('✅ Infrastructure services connected successfully');
  }

  getContainer(): Container {
    if (!this.isInitialized) {
      throw new Error('Services not initialized. Call initialize() first.');
    }
    return this.container;
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Graceful shutdown of services
      const databaseService = this.container.resolve<DatabaseService>(ServiceTokens.DATABASE);
      await databaseService.disconnect();

      const redisClient = this.container.resolve<Redis>('RedisClient');
      redisClient.disconnect();

      console.log('✅ All services shut down gracefully');
    } catch (error) {
      console.error('❌ Error during service shutdown:', error);
      throw error;
    }
  }
}

// Global service registry
let serviceRegistry: ServiceRegistry;

export function initializeServices(config: ServiceConfiguration): Promise<void> {
  serviceRegistry = new ServiceRegistry(config);
  return serviceRegistry.initialize();
}

export function getServiceRegistry(): ServiceRegistry {
  if (!serviceRegistry) {
    throw new Error('Service registry not initialized. Call initializeServices() first.');
  }
  return serviceRegistry;
}

export function getContainer(): Container {
  return getServiceRegistry().getContainer();
}