/**
 * Enhanced Error Handling Middleware
 *
 * Centralized error handling with structured responses and monitoring
 */

import { TRPCError } from '@trpc/server';
import {
  DomainError,
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
  BusinessRuleViolationError
} from '../domains/shared/errors/DomainError';
import { logger } from '../infrastructure/logging/Logger';
import { metrics } from '../infrastructure/monitoring/MetricsCollector';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
    timestamp: string;
    correlationId?: string;
  };
}

export interface ErrorContext {
  tenantId?: number;
  userId?: string;
  requestId?: string;
  operation?: string;
  input?: any;
}

export class ErrorHandler {
  private static errorCounter = metrics.createCounter('api_errors_total', 'Total API errors');
  private static errorDurationHistogram = metrics.createHistogram('error_handling_duration_seconds', 'Error handling duration');

  static handleError(error: unknown, context: ErrorContext = {}): TRPCError {
    const start = Date.now();

    try {
      const { tenantId, userId, requestId, operation } = context;

      // Generate correlation ID if not provided
      const correlationId = requestId || this.generateCorrelationId();

      let trpcError: TRPCError;

      if (error instanceof DomainError) {
        trpcError = this.handleDomainError(error, correlationId);
      } else if (error instanceof TRPCError) {
        trpcError = this.handleTRPCError(error, correlationId);
      } else if (error instanceof Error) {
        trpcError = this.handleGenericError(error, correlationId);
      } else {
        trpcError = this.handleUnknownError(error, correlationId);
      }

      // Log error with context
      const logContext = {
        tenantId,
        userId,
        correlationId,
        operation,
        errorCode: trpcError.code,
        errorMessage: trpcError.message,
        input: context.input
      };

      if (this.isServerError(trpcError)) {
        logger.error('Server error occurred', error instanceof Error ? error : new Error(String(error)), logContext);
      } else {
        logger.warn('Client error occurred', logContext);
      }

      // Increment error metrics
      this.errorCounter.increment({
        code: trpcError.code,
        operation: operation || 'unknown',
        type: this.getErrorType(error)
      });

      return trpcError;
    } finally {
      const duration = Date.now() - start;
      this.errorDurationHistogram.observe(duration / 1000);
    }
  }

  private static handleDomainError(error: DomainError, correlationId: string): TRPCError {
    const code = this.mapDomainErrorToTRPCCode(error);

    const trpcError = new TRPCError({
      code,
      message: error.message,
      cause: error
    });

    // Add structured error data
    (trpcError as any).data = {
      code: error.code,
      field: error instanceof ValidationError ? error.field : undefined,
      rule: error instanceof BusinessRuleViolationError ? error.rule : undefined,
      correlationId
    };

    return trpcError;
  }

  private static handleTRPCError(error: TRPCError, correlationId: string): TRPCError {
    // Enhance existing TRPC error with correlation ID
    if (!(error as any).data) {
      (error as any).data = {};
    }
    (error as any).data.correlationId = correlationId;

    return error;
  }

  private static handleGenericError(error: Error, correlationId: string): TRPCError {
    // Check for specific error types
    if (error.name === 'PrismaClientKnownRequestError') {
      return this.handlePrismaError(error, correlationId);
    }

    if (error.name === 'ZodError') {
      return this.handleZodError(error, correlationId);
    }

    // Generic server error
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      cause: error,
      // Don't leak sensitive error details in production
      ...(process.env.NODE_ENV !== 'production' && { data: { originalMessage: error.message, correlationId } })
    });
  }

  private static handleUnknownError(error: unknown, correlationId: string): TRPCError {
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unknown error occurred',
      cause: new Error(String(error)),
      data: { correlationId }
    });
  }

  private static handlePrismaError(error: Error, correlationId: string): TRPCError {
    const prismaError = error as any;

    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        return new TRPCError({
          code: 'CONFLICT',
          message: 'A record with this information already exists',
          cause: error,
          data: {
            code: 'DUPLICATE_RECORD',
            field: prismaError.meta?.target?.[0],
            correlationId
          }
        });

      case 'P2025': // Record not found
        return new TRPCError({
          code: 'NOT_FOUND',
          message: 'The requested record was not found',
          cause: error,
          data: { code: 'RECORD_NOT_FOUND', correlationId }
        });

      case 'P2003': // Foreign key constraint violation
        return new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot perform this operation due to related records',
          cause: error,
          data: { code: 'FOREIGN_KEY_CONSTRAINT', correlationId }
        });

      default:
        return new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database operation failed',
          cause: error,
          data: { code: 'DATABASE_ERROR', correlationId }
        });
    }
  }

  private static handleZodError(error: Error, correlationId: string): TRPCError {
    const zodError = error as any;

    const validationErrors = zodError.errors?.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    })) || [];

    return new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Validation failed',
      cause: error,
      data: {
        code: 'VALIDATION_ERROR',
        validationErrors,
        correlationId
      }
    });
  }

  private static mapDomainErrorToTRPCCode(error: DomainError): TRPCError['code'] {
    if (error instanceof ValidationError) return 'BAD_REQUEST';
    if (error instanceof NotFoundError) return 'NOT_FOUND';
    if (error instanceof ConflictError) return 'CONFLICT';
    if (error instanceof AuthorizationError) return 'FORBIDDEN';
    if (error instanceof BusinessRuleViolationError) return 'BAD_REQUEST';

    // Map by HTTP status
    if (error.httpStatus === 401) return 'UNAUTHORIZED';
    if (error.httpStatus === 403) return 'FORBIDDEN';
    if (error.httpStatus === 404) return 'NOT_FOUND';
    if (error.httpStatus === 409) return 'CONFLICT';
    if (error.httpStatus === 422) return 'BAD_REQUEST';
    if (error.httpStatus >= 500) return 'INTERNAL_SERVER_ERROR';

    return 'BAD_REQUEST';
  }

  private static getErrorType(error: unknown): string {
    if (error instanceof DomainError) return 'domain';
    if (error instanceof TRPCError) return 'trpc';
    if (error instanceof Error) {
      if (error.name.includes('Prisma')) return 'database';
      if (error.name === 'ZodError') return 'validation';
      return 'generic';
    }
    return 'unknown';
  }

  private static isServerError(error: TRPCError): boolean {
    return ['INTERNAL_SERVER_ERROR', 'TIMEOUT'].includes(error.code);
  }

  private static generateCorrelationId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Error recovery helpers
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      delayMs?: number;
      backoffMultiplier?: number;
      shouldRetry?: (error: unknown) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      delayMs = 1000,
      backoffMultiplier = 2,
      shouldRetry = (error) => this.isRetryableError(error)
    } = options;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (!shouldRetry(error) || attempt === maxRetries) {
          break;
        }

        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        logger.warn('Operation failed, retrying', {
          attempt,
          maxRetries,
          delay,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    throw lastError;
  }

  private static isRetryableError(error: unknown): boolean {
    if (error instanceof TRPCError) {
      return ['TIMEOUT', 'INTERNAL_SERVER_ERROR'].includes(error.code);
    }

    if (error instanceof Error) {
      // Check for network-related errors
      const networkErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'];
      return networkErrors.some(code => error.message.includes(code));
    }

    return false;
  }

  // Circuit breaker pattern for external service calls
  static createCircuitBreaker<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: {
      failureThreshold?: number;
      recoveryTimeout?: number;
      monitoringPeriod?: number;
    } = {}
  ): (...args: T) => Promise<R> {
    const { failureThreshold = 5, recoveryTimeout = 60000, monitoringPeriod = 10000 } = options;

    let state: 'closed' | 'open' | 'half-open' = 'closed';
    let failureCount = 0;
    let lastFailureTime = 0;
    let nextAttemptTime = 0;

    return async (...args: T): Promise<R> => {
      const now = Date.now();

      // Reset failure count if monitoring period has passed
      if (now - lastFailureTime > monitoringPeriod) {
        failureCount = 0;
      }

      if (state === 'open') {
        if (now < nextAttemptTime) {
          throw new TRPCError({
            code: 'SERVICE_UNAVAILABLE',
            message: 'Service temporarily unavailable (circuit breaker open)',
            data: { code: 'CIRCUIT_BREAKER_OPEN' }
          });
        }
        state = 'half-open';
      }

      try {
        const result = await fn(...args);

        // Success - reset circuit breaker
        if (state === 'half-open') {
          state = 'closed';
          failureCount = 0;
        }

        return result;
      } catch (error) {
        failureCount++;
        lastFailureTime = now;

        if (state === 'half-open' || failureCount >= failureThreshold) {
          state = 'open';
          nextAttemptTime = now + recoveryTimeout;

          logger.error('Circuit breaker opened', error instanceof Error ? error : new Error(String(error)), {
            failureCount,
            failureThreshold,
            recoveryTimeout
          });
        }

        throw error;
      }
    };
  }
}

// Export convenience functions
export const handleError = ErrorHandler.handleError.bind(ErrorHandler);
export const withRetry = ErrorHandler.withRetry.bind(ErrorHandler);
export const createCircuitBreaker = ErrorHandler.createCircuitBreaker.bind(ErrorHandler);