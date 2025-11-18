/**
 * Structured Logging Infrastructure
 *
 * Enhanced logging with structured data and correlation IDs
 */

export enum LogLevel {
	DEBUG = "debug",
	INFO = "info",
	WARN = "warn",
	ERROR = "error",
	FATAL = "fatal",
}

export interface LogContext {
	tenantId?: number;
	userId?: string;
	requestId?: string;
	correlationId?: string;
	service?: string;
	operation?: string;
	[key: string]: any;
}

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context: LogContext;
	error?: {
		name: string;
		message: string;
		stack?: string;
		code?: string;
	};
}

export interface Logger {
	debug(message: string, context?: LogContext): void;
	info(message: string, context?: LogContext): void;
	warn(message: string, context?: LogContext): void;
	error(message: string, error?: Error, context?: LogContext): void;
	fatal(message: string, error?: Error, context?: LogContext): void;
}

export class StructuredLogger implements Logger {
	private serviceName: string;
	private defaultContext: LogContext;

	constructor(serviceName: string, defaultContext: LogContext = {}) {
		this.serviceName = serviceName;
		this.defaultContext = { service: serviceName, ...defaultContext };
	}

	debug(message: string, context: LogContext = {}): void {
		this.log(LogLevel.DEBUG, message, context);
	}

	info(message: string, context: LogContext = {}): void {
		this.log(LogLevel.INFO, message, context);
	}

	warn(message: string, context: LogContext = {}): void {
		this.log(LogLevel.WARN, message, context);
	}

	error(message: string, error?: Error, context: LogContext = {}): void {
		const errorContext = error
			? {
					error: {
						name: error.name,
						message: error.message,
						stack: error.stack,
						code: (error as any).code,
					},
				}
			: {};

		this.log(LogLevel.ERROR, message, { ...context, ...errorContext });
	}

	fatal(message: string, error?: Error, context: LogContext = {}): void {
		const errorContext = error
			? {
					error: {
						name: error.name,
						message: error.message,
						stack: error.stack,
						code: (error as any).code,
					},
				}
			: {};

		this.log(LogLevel.FATAL, message, { ...context, ...errorContext });
	}

	private log(level: LogLevel, message: string, context: LogContext): void {
		const logEntry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			context: { ...this.defaultContext, ...context },
		};

		// In production, you would send this to your logging service (e.g., Winston, Pino)
		console.log(JSON.stringify(logEntry));
	}

	child(additionalContext: LogContext): Logger {
		return new StructuredLogger(this.serviceName, {
			...this.defaultContext,
			...additionalContext,
		});
	}
}

// Global logger instance
export const logger = new StructuredLogger("gcmc-kaj-api");
