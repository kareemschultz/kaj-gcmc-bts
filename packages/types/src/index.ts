// Core type definitions for GCMC-KAJ Multi-tenant SaaS Platform

export type UserRole =
	| "SuperAdmin"
	| "FirmAdmin"
	| "Admin"
	| "ComplianceManager"
	| "ComplianceOfficer"
	| "DocumentOfficer"
	| "FilingClerk"
	| "Viewer"
	| "ClientPortalUser";

export type ClientType = "individual" | "company" | "partnership";

export type RiskLevel = "low" | "medium" | "high";

export type DocumentStatus =
	| "valid"
	| "expired"
	| "pending_review"
	| "rejected";

export type FilingStatus =
	| "draft"
	| "prepared"
	| "submitted"
	| "approved"
	| "rejected"
	| "overdue"
	| "archived";

export type FilingFrequency =
	| "monthly"
	| "quarterly"
	| "semi_annual"
	| "annual"
	| "biennial" // Every 2 years
	| "triennial" // Every 3 years
	| "one_off" // One-time filing
	| "as_required" // Filed when specific conditions are met
	| "continuous"; // Ongoing submissions

export type ServiceRequestStatus =
	| "new"
	| "in_progress"
	| "awaiting_client"
	| "awaiting_authority"
	| "under_review" // Authority is reviewing submission
	| "pending_approval" // Awaiting final authority approval
	| "approved" // Approved by authority
	| "rejected" // Rejected by authority
	| "requires_amendment" // Needs changes before resubmission
	| "completed"
	| "cancelled";

export type ServiceStepStatus =
	| "not_started"
	| "in_progress"
	| "done"
	| "blocked";

export type TaskStatus = "open" | "in_progress" | "blocked" | "completed";

export type ClientTaskStatus =
	| "pending"
	| "in_progress"
	| "completed"
	| "cancelled";

export type ComplianceLevel = "green" | "amber" | "red";

export type AgencyCategory =
	| "tax_revenue" // Tax and revenue agencies
	| "registration" // Business registration and licensing
	| "compliance" // Regulatory compliance and monitoring
	| "permits_licenses" // Permits and licensing authorities
	| "immigration" // Immigration and citizenship
	| "environmental" // Environmental and safety
	| "financial" // Financial services regulation
	| "utilities" // Public utilities
	| "natural_resources" // Mining, forestry, agriculture
	| "transport" // Transportation and logistics
	| "health_safety" // Health and safety regulation
	| "education" // Educational services
	| "social_services" // Social and human services
	| "gaming_tourism"; // Gaming and tourism regulation

export type DocumentCategory =
	| "incorporation" // Business formation documents
	| "tax_filing" // Tax returns and related documents
	| "compliance_certificate" // Compliance and good standing certificates
	| "permit_license" // Permits, licenses, and authorizations
	| "financial_statement" // Financial reports and statements
	| "regulatory_filing" // Regulatory submissions and reports
	| "identification" // Identity and verification documents
	| "operational_document" // Day-to-day operational documents
	| "legal_document" // Contracts, agreements, legal papers
	| "correspondence" // Official communications
	| "application_form" // Application and request forms
	| "renewal_document" // Renewal and update documents
	| "amendment_document" // Changes and amendments
	| "termination_document" // Closure and termination papers
	| "inspection_report" // Inspection and audit reports
	| "other"; // Other document types

export type NotificationType = "email" | "in_app" | "sms";

export type NotificationChannelStatus = "pending" | "sent" | "failed";

// Enhanced Guyanese Regulatory Authority System
export type Authority =
	| "GRA" // Guyana Revenue Authority
	| "NIS" // National Insurance Scheme
	| "DCRA" // Deeds and Commercial Registry Authority
	| "Immigration" // Department of Citizenship and Immigration Services
	| "MOL" // Ministry of Labour
	| "EPA" // Environmental Protection Agency
	| "GSB" // Guyana Standards Bureau
	| "BOG" // Bank of Guyana
	| "MOH" // Ministry of Health
	| "NDIA" // National Drainage and Irrigation Authority
	| "GWI" // Guyana Water Inc
	| "GPL" // Guyana Power and Light
	| "GuyOil" // GuyOil Company Limited
	| "GGMC" // Guyana Geology and Mines Commission
	| "MARAD" // Maritime Administration Department
	| "GCAA" // Guyana Civil Aviation Authority
	| "CFU" // Cooperative Financial Union
	| "GoInvest" // Guyana Office for Investment
	| "GGB" // Guyana Gaming Board
	| "GPF" // Guyana Police Force
	| "CARICOM" // Caribbean Community Secretariat
	| "CUSTOMS" // Guyana Revenue Authority - Customs Division
	| "FORESTRY" // Guyana Forestry Commission
	| "LANDS" // Lands and Surveys Commission
	| "TRANSPORT" // Transport and Harbours Department
	| "TOURISM" // Guyana Tourism Authority
	| "AGRICULTURE" // Ministry of Agriculture
	| "EDUCATION" // Ministry of Education
	| "SOCIAL_SERVICES"; // Ministry of Human Services and Social Security

export interface TenantContext {
	tenantId: number;
	tenantCode: string;
	tenantName: string;
}

export interface UserContext {
	userId: string;
	email: string;
	name: string;
	role: UserRole;
	tenantId: number;
}

export type DocumentMetadata = Record<string, unknown>;
export type ServiceRequestMetadata = Record<string, unknown>;
export type ComplianceBreakdown = Record<string, unknown>;

// Client Profile Enhanced Types
export type ClientProfileStatus =
	| "active"
	| "inactive"
	| "suspended"
	| "archived";

export type ClientCommunicationType =
	| "email"
	| "phone"
	| "meeting"
	| "video_call"
	| "sms"
	| "letter"
	| "portal_message";

export type ClientHistoryEventType =
	| "client_created"
	| "client_updated"
	| "document_uploaded"
	| "document_expired"
	| "filing_submitted"
	| "filing_completed"
	| "service_requested"
	| "service_completed"
	| "payment_received"
	| "compliance_updated"
	| "communication_logged"
	| "note_added"
	| "contact_added"
	| "contact_updated"
	| "relationship_established"
	| "tag_added"
	| "tag_removed"
	| "custom_field_updated";

export type ClientRelationshipType =
	| "subsidiary"
	| "parent_company"
	| "partner"
	| "referral_source"
	| "referred_by"
	| "competitor"
	| "vendor"
	| "customer"
	| "other";

export type ClientDocumentCategory =
	| "incorporation"
	| "tax_documents"
	| "compliance_certificates"
	| "financial_statements"
	| "contracts"
	| "correspondence"
	| "identification"
	| "licenses"
	| "permits"
	| "other";

export type ContactRole =
	| "primary"
	| "billing"
	| "technical"
	| "compliance"
	| "decision_maker"
	| "authorized_representative"
	| "other";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type ExportFormat = "pdf" | "excel" | "csv" | "json";

export type SearchFilterType =
	| "text"
	| "select"
	| "multiselect"
	| "date_range"
	| "number_range"
	| "boolean";

// Client Profile Interfaces
export interface ClientContact {
	id: string;
	clientId: number;
	name: string;
	email: string;
	phone?: string;
	role: ContactRole;
	department?: string;
	title?: string;
	isPrimary: boolean;
	isActive: boolean;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface ClientRelationship {
	id: string;
	clientId: number;
	relatedClientId?: number;
	relatedEntityName?: string;
	relationshipType: ClientRelationshipType;
	description?: string;
	startDate?: Date;
	endDate?: Date;
	isActive: boolean;
	metadata?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

export interface ClientCommunication {
	id: string;
	clientId: number;
	contactId?: string;
	userId: string;
	type: ClientCommunicationType;
	subject: string;
	content: string;
	direction: "inbound" | "outbound";
	isInternal: boolean;
	attachments?: string[];
	metadata?: Record<string, unknown>;
	communicatedAt: Date;
	createdAt: Date;
}

export interface ClientNote {
	id: string;
	clientId: number;
	userId: string;
	title?: string;
	content: string;
	isPrivate: boolean;
	isPinned: boolean;
	tags: string[];
	metadata?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

export interface ClientTask {
	id: string;
	clientId: number;
	userId: string;
	assignedToId?: string;
	title: string;
	description?: string;
	status: ClientTaskStatus;
	priority: TaskPriority;
	dueDate?: Date;
	completedAt?: Date;
	tags: string[];
	metadata?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

export interface ClientHistoryEvent {
	id: string;
	clientId: number;
	userId?: string;
	eventType: ClientHistoryEventType;
	title: string;
	description: string;
	entityId?: string;
	entityType?: string;
	oldValue?: unknown;
	newValue?: unknown;
	metadata?: Record<string, unknown>;
	occurredAt: Date;
	createdAt: Date;
}

export interface ClientComplianceHistory {
	id: string;
	clientId: number;
	score: number;
	level: ComplianceLevel;
	breakdown: ComplianceBreakdown;
	alerts: string[];
	outstandingItems: number;
	assessmentDate: Date;
	assessedBy: string;
	notes?: string;
	createdAt: Date;
}

export interface ClientCustomField {
	id: string;
	name: string;
	label: string;
	type:
		| "text"
		| "number"
		| "date"
		| "select"
		| "multiselect"
		| "boolean"
		| "textarea";
	options?: string[];
	isRequired: boolean;
	isActive: boolean;
	order: number;
	section?: string;
	metadata?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

export interface ClientCustomFieldValue {
	id: string;
	clientId: number;
	fieldId: string;
	value: unknown;
	createdAt: Date;
	updatedAt: Date;
}

export interface ClientTag {
	id: string;
	name: string;
	color: string;
	description?: string;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface ClientProfile {
	id: number;
	tenantId: number;
	name: string;
	email: string;
	phone?: string;
	type: ClientType;
	status: ClientProfileStatus;
	sector?: string;
	website?: string;
	address?: {
		street?: string;
		city?: string;
		state?: string;
		postalCode?: string;
		country?: string;
	};
	taxId?: string;
	registrationNumber?: string;
	incorporationDate?: Date;
	annualRevenue?: number;
	employeeCount?: number;
	riskLevel: RiskLevel;
	preferredCommunication?: ClientCommunicationType[];
	billingContact?: string;
	technicalContact?: string;
	complianceContact?: string;
	notes?: string;
	tags: ClientTag[];
	customFields: ClientCustomFieldValue[];
	contacts: ClientContact[];
	relationships: ClientRelationship[];
	communications: ClientCommunication[];
	clientNotes: ClientNote[];
	tasks: ClientTask[];
	history: ClientHistoryEvent[];
	complianceHistory: ClientComplianceHistory[];
	documents: ClientDocument[];
	createdAt: Date;
	updatedAt: Date;
	lastActivity?: Date;
	assignedUserId?: string;
	metadata?: Record<string, unknown>;
}

export interface ClientDocument {
	id: string;
	clientId: number;
	name: string;
	originalName: string;
	category: ClientDocumentCategory;
	type: string;
	size: number;
	mimeType: string;
	url: string;
	description?: string;
	tags: string[];
	isConfidential: boolean;
	expiryDate?: Date;
	version: number;
	uploadedBy: string;
	metadata?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

export interface ClientAnalytics {
	clientId: number;
	totalDocuments: number;
	totalFilings: number;
	totalServiceRequests: number;
	complianceScore: number;
	outstandingFees: number;
	lastActivity?: Date;
	revenueGenerated: number;
	averageResponseTime: number;
	satisfactionScore?: number;
	communicationFrequency: number;
	riskAssessment: {
		score: number;
		factors: string[];
		lastAssessed: Date;
	};
	performance: {
		onTimeFilings: number;
		overdueItems: number;
		responseTime: number;
		serviceQuality: number;
	};
}

export interface ClientSearchFilter {
	id: string;
	name: string;
	type: SearchFilterType;
	field: string;
	label: string;
	options?: string[];
	placeholder?: string;
	isActive: boolean;
	order: number;
}

export interface ClientSearchParams {
	query?: string;
	filters?: Record<string, unknown>;
	sort?: string;
	order?: "asc" | "desc";
	page?: number;
	limit?: number;
	includeInactive?: boolean;
}

export interface ClientBulkOperation {
	type: "update" | "delete" | "archive" | "tag" | "export";
	clientIds: number[];
	params?: Record<string, unknown>;
}

export interface ClientExportOptions {
	format: ExportFormat;
	includeHistory?: boolean;
	includeDocuments?: boolean;
	includeCommunications?: boolean;
	includeAnalytics?: boolean;
	dateRange?: {
		start: Date;
		end: Date;
	};
	fields?: string[];
}

// ============================================================================
// GUYANESE REGULATORY AGENCY SYSTEM
// ============================================================================

/**
 * Agency Information and Configuration
 */
export interface AgencyInfo {
	code: Authority;
	name: string;
	fullName: string;
	category: AgencyCategory;
	description: string;
	website?: string;
	contactInfo?: {
		phone?: string;
		email?: string;
		address?: string;
		hours?: string;
	};
	onlinePortal?: {
		url: string;
		loginRequired: boolean;
		supportedServices: string[];
	};
	isActive: boolean;
	priority: number; // Display priority
}

/**
 * Agency-Specific Document Requirements
 */
export interface AgencyDocumentRequirement {
	id: string;
	authority: Authority;
	documentType: string;
	category: DocumentCategory;
	name: string;
	description: string;
	isRequired: boolean;
	frequency?: FilingFrequency;
	dueDate?: {
		dayOfMonth?: number;
		monthOfYear?: number;
		daysAfterEvent?: number;
		businessDaysOnly?: boolean;
	};
	validityPeriod?: {
		duration: number;
		unit: "days" | "months" | "years";
	};
	reminderSchedule?: {
		advance: number;
		unit: "days" | "weeks" | "months";
		escalation?: number[];
	};
	penalties?: {
		lateFilingFee?: number;
		dailyPenalty?: number;
		maximumPenalty?: number;
		compoundingFrequency?: "daily" | "weekly" | "monthly";
	};
	submissionMethod: ("online" | "physical" | "email" | "postal")[];
	supportingDocuments: string[];
	validationRules: DocumentValidationRule[];
	applicableClientTypes: ClientType[];
	metadata?: Record<string, unknown>;
}

/**
 * Document Validation Rules
 */
export interface DocumentValidationRule {
	id: string;
	name: string;
	ruleType:
		| "required_field"
		| "format"
		| "size"
		| "date_range"
		| "calculation"
		| "cross_reference";
	field?: string;
	condition: {
		operator:
			| "equals"
			| "contains"
			| "regex"
			| "range"
			| "required"
			| "optional";
		value?: unknown;
		min?: number;
		max?: number;
		pattern?: string;
	};
	errorMessage: string;
	severity: "error" | "warning" | "info";
	isActive: boolean;
}

/**
 * Agency Compliance Status
 */
export interface AgencyComplianceStatus {
	authority: Authority;
	clientId: number;
	overallStatus: ComplianceLevel;
	score: number;
	lastAssessment: Date;
	requirements: AgencyRequirementStatus[];
	upcomingDeadlines: AgencyDeadline[];
	overdueItems: AgencyOverdueItem[];
	alerts: ComplianceAlert[];
	recommendations: string[];
}

/**
 * Agency Requirement Status
 */
export interface AgencyRequirementStatus {
	requirementId: string;
	documentType: string;
	status: "compliant" | "non_compliant" | "pending" | "not_applicable";
	lastSubmission?: Date;
	nextDue?: Date;
	documentId?: string;
	notes?: string;
}

/**
 * Agency Deadlines
 */
export interface AgencyDeadline {
	id: string;
	authority: Authority;
	clientId: number;
	requirementId: string;
	documentType: string;
	description: string;
	dueDate: Date;
	priority: TaskPriority;
	status: "upcoming" | "due_today" | "overdue";
	reminderSent?: Date;
	escalationLevel: number;
	estimatedCompletionTime?: number; // in hours
	assignedTo?: string;
	dependencies?: string[];
}

/**
 * Overdue Items
 */
export interface AgencyOverdueItem {
	id: string;
	authority: Authority;
	clientId: number;
	requirementId: string;
	documentType: string;
	description: string;
	originalDueDate: Date;
	daysOverdue: number;
	accruedPenalties: number;
	maxPenalty?: number;
	status: "overdue" | "penalty_accruing" | "escalated";
	notificationsSent: number;
	lastNotification?: Date;
	escalationPath: string[];
}

/**
 * Compliance Alerts
 */
export interface ComplianceAlert {
	id: string;
	authority: Authority;
	clientId: number;
	type:
		| "deadline_approaching"
		| "document_expired"
		| "penalty_accruing"
		| "requirement_changed"
		| "system_update";
	severity: "low" | "medium" | "high" | "critical";
	title: string;
	message: string;
	actionRequired?: string;
	dueDate?: Date;
	acknowledged: boolean;
	acknowledgedBy?: string;
	acknowledgedAt?: Date;
	createdAt: Date;
	metadata?: Record<string, unknown>;
}

/**
 * Smart Document Workflow
 */
export interface DocumentWorkflow {
	id: string;
	authority: Authority;
	documentType: string;
	name: string;
	description: string;
	steps: WorkflowStep[];
	triggers: WorkflowTrigger[];
	isActive: boolean;
	version: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Workflow Step
 */
export interface WorkflowStep {
	id: string;
	order: number;
	name: string;
	description: string;
	type:
		| "validation"
		| "approval"
		| "notification"
		| "submission"
		| "wait"
		| "condition";
	config: {
		assignedRole?: string;
		timeoutHours?: number;
		autoComplete?: boolean;
		conditions?: WorkflowCondition[];
		actions?: WorkflowAction[];
	};
	dependencies?: string[];
}

/**
 * Workflow Triggers
 */
export interface WorkflowTrigger {
	id: string;
	type:
		| "document_upload"
		| "date_based"
		| "status_change"
		| "manual"
		| "api_call";
	condition: WorkflowCondition;
	isActive: boolean;
}

/**
 * Workflow Conditions
 */
export interface WorkflowCondition {
	field: string;
	operator:
		| "equals"
		| "not_equals"
		| "greater_than"
		| "less_than"
		| "contains"
		| "exists"
		| "is_null";
	value: unknown;
	logicalOperator?: "AND" | "OR";
}

/**
 * Workflow Actions
 */
export interface WorkflowAction {
	type:
		| "send_notification"
		| "create_task"
		| "update_status"
		| "generate_document"
		| "submit_to_agency"
		| "calculate_fee";
	config: Record<string, unknown>;
	executionOrder: number;
}

/**
 * Agency Form Templates
 */
export interface AgencyFormTemplate {
	id: string;
	authority: Authority;
	documentType: string;
	name: string;
	version: string;
	description?: string;
	sections: FormSection[];
	validationRules: FormValidationRule[];
	submissionConfig: {
		method: "online" | "email" | "physical";
		endpoint?: string;
		format: "json" | "xml" | "pdf" | "form_data";
		authentication?: {
			type: "api_key" | "oauth" | "basic" | "certificate";
			config: Record<string, unknown>;
		};
	};
	isActive: boolean;
	effectiveDate: Date;
	expiryDate?: Date;
}

/**
 * Form Sections
 */
export interface FormSection {
	id: string;
	name: string;
	title: string;
	description?: string;
	order: number;
	isRequired: boolean;
	fields: FormField[];
	conditionalLogic?: {
		showIf: WorkflowCondition[];
		requireIf: WorkflowCondition[];
	};
}

/**
 * Form Fields
 */
export interface FormField {
	id: string;
	name: string;
	label: string;
	type:
		| "text"
		| "number"
		| "date"
		| "select"
		| "multiselect"
		| "checkbox"
		| "radio"
		| "file"
		| "textarea"
		| "currency"
		| "percentage";
	isRequired: boolean;
	placeholder?: string;
	helpText?: string;
	defaultValue?: unknown;
	options?: FormFieldOption[];
	validation?: {
		pattern?: string;
		minLength?: number;
		maxLength?: number;
		min?: number;
		max?: number;
		customRules?: string[];
	};
	conditionalLogic?: {
		showIf: WorkflowCondition[];
		requireIf: WorkflowCondition[];
		calculateFrom?: string[];
	};
	metadata?: Record<string, unknown>;
}

/**
 * Form Field Options
 */
export interface FormFieldOption {
	value: string;
	label: string;
	isDefault?: boolean;
	metadata?: Record<string, unknown>;
}

/**
 * Form Validation Rules
 */
export interface FormValidationRule {
	id: string;
	type: "field" | "cross_field" | "business_rule";
	condition: WorkflowCondition;
	errorMessage: string;
	severity: "error" | "warning";
}

/**
 * Agency Submission Tracking
 */
export interface AgencySubmission {
	id: string;
	authority: Authority;
	clientId: number;
	documentType: string;
	formTemplateId?: string;
	submissionData: Record<string, unknown>;
	status: ServiceRequestStatus;
	referenceNumber?: string;
	submittedAt?: Date;
	acknowledgedAt?: Date;
	processedAt?: Date;
	approvedAt?: Date;
	rejectedAt?: Date;
	rejectionReason?: string;
	agencyResponse?: {
		status: string;
		message?: string;
		documents?: string[];
		nextSteps?: string[];
	};
	fees: {
		applicationFee?: number;
		processingFee?: number;
		penalties?: number;
		total: number;
		currency: string;
		paidAt?: Date;
		paymentReference?: string;
	};
	timeline: SubmissionEvent[];
	internalNotes?: string;
	submittedBy: string;
	processedBy?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Submission Events
 */
export interface SubmissionEvent {
	id: string;
	type:
		| "submitted"
		| "acknowledged"
		| "under_review"
		| "approved"
		| "rejected"
		| "additional_info_requested"
		| "payment_required"
		| "completed";
	timestamp: Date;
	actor: "system" | "client" | "agency" | "staff";
	actorId?: string;
	description: string;
	data?: Record<string, unknown>;
}

/**
 * Agency Performance Metrics
 */
export interface AgencyPerformanceMetrics {
	authority: Authority;
	period: {
		start: Date;
		end: Date;
	};
	submissions: {
		total: number;
		approved: number;
		rejected: number;
		pending: number;
		averageProcessingTime: number; // in hours
	};
	compliance: {
		onTimeSubmissions: number;
		lateSubmissions: number;
		overdueItems: number;
		averageComplianceScore: number;
	};
	penalties: {
		totalPenalties: number;
		penaltyEvents: number;
		averagePenalty: number;
	};
	clientSatisfaction?: {
		averageRating: number;
		responseRate: number;
		feedbackCount: number;
	};
}

/**
 * Agency Integration Configuration
 */
export interface AgencyIntegrationConfig {
	authority: Authority;
	isEnabled: boolean;
	apiConfiguration?: {
		baseUrl: string;
		version: string;
		authentication: {
			type: "api_key" | "oauth2" | "certificate" | "basic";
			credentials: Record<string, string>;
			tokenEndpoint?: string;
			refreshToken?: string;
		};
		rateLimit: {
			requestsPerMinute: number;
			burstLimit: number;
		};
		timeout: number;
		retryPolicy: {
			maxRetries: number;
			backoffMultiplier: number;
			maxBackoffTime: number;
		};
	};
	webhookConfiguration?: {
		inboundUrl: string;
		outboundUrls: string[];
		secret: string;
		eventTypes: string[];
	};
	dataMapping: {
		clientFields: Record<string, string>;
		documentFields: Record<string, string>;
		statusMapping: Record<string, ServiceRequestStatus>;
	};
	testMode: boolean;
	lastHealthCheck?: Date;
	isHealthy: boolean;
	healthCheckUrl?: string;
}
