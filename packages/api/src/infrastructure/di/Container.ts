/**
 * Dependency Injection Container
 *
 * Simple IoC container for managing dependencies and service lifecycles
 */

type ServiceFactory<T = any> = (...args: any[]) => T;
type ServiceInstance<T = any> = T;

interface ServiceDefinition<T = any> {
	factory: ServiceFactory<T>;
	singleton: boolean;
	instance?: ServiceInstance<T>;
}

export class Container {
	private services: Map<string, ServiceDefinition> = new Map();

	/**
	 * Register a singleton service
	 */
	singleton<T>(token: string, factory: ServiceFactory<T>): this {
		this.services.set(token, {
			factory,
			singleton: true,
		});
		return this;
	}

	/**
	 * Register a transient service (new instance each time)
	 */
	transient<T>(token: string, factory: ServiceFactory<T>): this {
		this.services.set(token, {
			factory,
			singleton: false,
		});
		return this;
	}

	/**
	 * Register a service instance
	 */
	instance<T>(token: string, instance: T): this {
		this.services.set(token, {
			factory: () => instance,
			singleton: true,
			instance,
		});
		return this;
	}

	/**
	 * Resolve a service by token
	 */
	resolve<T>(token: string): T {
		const service = this.services.get(token);

		if (!service) {
			throw new Error(`Service '${token}' not registered`);
		}

		if (service.singleton) {
			if (!service.instance) {
				service.instance = service.factory();
			}
			return service.instance;
		}

		return service.factory();
	}

	/**
	 * Check if service is registered
	 */
	has(token: string): boolean {
		return this.services.has(token);
	}

	/**
	 * Clear all services (useful for testing)
	 */
	clear(): void {
		this.services.clear();
	}

	/**
	 * Create a child container with inherited services
	 */
	createChild(): Container {
		const child = new Container();
		// Copy parent services
		for (const [token, service] of this.services) {
			child.services.set(token, { ...service });
		}
		return child;
	}
}

// Global container instance
export const container = new Container();

// Service tokens (constants to avoid magic strings)
export const ServiceTokens = {
	// Repositories
	CLIENT_REPOSITORY: "ClientRepository",
	DOCUMENT_REPOSITORY: "DocumentRepository",
	FILING_REPOSITORY: "FilingRepository",

	// Services
	CLIENT_SERVICE: "ClientService",
	DOCUMENT_SERVICE: "DocumentService",
	COMPLIANCE_SERVICE: "ComplianceService",
	NOTIFICATION_SERVICE: "NotificationService",

	// Infrastructure
	CACHE_SERVICE: "CacheService",
	EVENT_DISPATCHER: "EventDispatcher",
	LOGGER: "Logger",
	DATABASE: "Database",

	// External Services
	EMAIL_SERVICE: "EmailService",
	STORAGE_SERVICE: "StorageService",
	AUDIT_SERVICE: "AuditService",
} as const;

/**
 * Decorator for automatic dependency injection
 */
export function Injectable<T extends new (...args: any[]) => {}>(
	constructor: T,
) {
	return class extends constructor {};
}

/**
 * Decorator for injecting dependencies
 */
export function Inject(token: string) {
	return (
		target: any,
		_propertyKey: string | symbol | undefined,
		parameterIndex: number,
	) => {
		// Store metadata for dependency injection
		const existingTokens = Reflect.getMetadata("design:inject", target) || [];
		existingTokens[parameterIndex] = token;
		Reflect.defineMetadata("design:inject", existingTokens, target);
	};
}
