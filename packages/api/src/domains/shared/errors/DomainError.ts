/**
 * Domain Error Classes
 *
 * Structured error handling for domain-specific business rule violations
 */

export class DomainError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;

  constructor(
    message: string,
    code: string,
    httpStatus: number = 400
  ) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.httpStatus = httpStatus;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DomainError);
    }
  }
}

export class ClientDomainError extends DomainError {
  constructor(message: string, code: string) {
    super(message, `CLIENT_${code}`, 400);
    this.name = 'ClientDomainError';
  }
}

export class DocumentDomainError extends DomainError {
  constructor(message: string, code: string) {
    super(message, `DOCUMENT_${code}`, 400);
    this.name = 'DocumentDomainError';
  }
}

export class FilingDomainError extends DomainError {
  constructor(message: string, code: string) {
    super(message, `FILING_${code}`, 400);
    this.name = 'FilingDomainError';
  }
}

export class ComplianceDomainError extends DomainError {
  constructor(message: string, code: string) {
    super(message, `COMPLIANCE_${code}`, 400);
    this.name = 'ComplianceDomainError';
  }
}

export class ServiceDomainError extends DomainError {
  constructor(message: string, code: string) {
    super(message, `SERVICE_${code}`, 400);
    this.name = 'ServiceDomainError';
  }
}

export class AuthorizationError extends DomainError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_DENIED', 403);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends DomainError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_FAILED', 422);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string | number) {
    super(`${resource} with id ${id} not found`, 'RESOURCE_NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, code: string = 'CONFLICT') {
    super(message, code, 409);
    this.name = 'ConflictError';
  }
}

export class BusinessRuleViolationError extends DomainError {
  public readonly rule: string;

  constructor(message: string, rule: string) {
    super(message, 'BUSINESS_RULE_VIOLATION', 422);
    this.name = 'BusinessRuleViolationError';
    this.rule = rule;
  }
}