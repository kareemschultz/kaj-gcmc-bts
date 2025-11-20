/**
 * Form Builder Types for GCMC-KAJ Business Tax Services Platform
 * Comprehensive type system for the dynamic form builder with Guyanese regulatory compliance
 */

import type { z } from "zod";

export type Authority =
	| "GRA"
	| "NIS"
	| "DCRA"
	| "Immigration"
	| "MOL"
	| "EPA"
	| "GSB"
	| "BOG"
	| "MOH"
	| "NDIA"
	| "GWI"
	| "GPL"
	| "GuyOil"
	| "GGMC"
	| "MARAD"
	| "GCAA"
	| "CFU"
	| "GoInvest"
	| "GGB"
	| "GPF"
	| "CARICOM"
	| "CUSTOMS"
	| "FORESTRY"
	| "LANDS"
	| "TRANSPORT"
	| "TOURISM"
	| "AGRICULTURE"
	| "EDUCATION"
	| "SOCIAL_SERVICES";

export type AgencyCategory =
	| "tax_revenue"
	| "registration"
	| "compliance"
	| "permits_licenses"
	| "immigration"
	| "environmental"
	| "financial"
	| "utilities"
	| "natural_resources"
	| "transport"
	| "health_safety"
	| "education"
	| "social_services"
	| "gaming_tourism";

export type DocumentCategory =
	| "incorporation"
	| "tax_filing"
	| "compliance_certificate"
	| "permit_license"
	| "financial_statement"
	| "regulatory_filing"
	| "identification"
	| "operational_document"
	| "legal_document"
	| "correspondence"
	| "application_form"
	| "renewal_document"
	| "amendment_document"
	| "termination_document"
	| "inspection_report"
	| "other";

export type ClientType = "individual" | "company" | "partnership";

// Form Field Types
export type FormFieldType =
	| "text"
	| "email"
	| "password"
	| "number"
	| "phone"
	| "url"
	| "textarea"
	| "select"
	| "multiselect"
	| "checkbox"
	| "radio"
	| "checkboxGroup"
	| "date"
	| "datetime"
	| "time"
	| "file"
	| "image"
	| "currency"
	| "percentage"
	| "tax_id"
	| "business_reg"
	| "nis_number"
	| "passport"
	| "id_card"
	| "signature"
	| "calculated"
	| "section"
	| "divider";

// Validation Rule Types
export type ValidationRuleType =
	| "required"
	| "minLength"
	| "maxLength"
	| "min"
	| "max"
	| "pattern"
	| "email"
	| "url"
	| "custom"
	| "conditional"
	| "crossField"
	| "businessRule"
	| "guyaneseSpecific";

// Calculation Types
export type CalculationType =
	| "sum"
	| "subtract"
	| "multiply"
	| "divide"
	| "percentage"
	| "compound"
	| "vat_calculation"
	| "nis_calculation"
	| "withholding_tax"
	| "penalty_calculation"
	| "fee_calculation"
	| "currency_conversion"
	| "custom_formula";

// Form Field Base
export interface FormFieldBase {
	id: string;
	type: FormFieldType;
	name: string;
	label: string;
	description?: string;
	placeholder?: string;
	helpText?: string;
	required?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	hidden?: boolean;
	order: number;
	section?: string;
	group?: string;

	// Styling and Layout
	width?: "full" | "half" | "third" | "quarter" | "auto";
	className?: string;
	responsive?: {
		mobile?: { width?: string; order?: number };
		tablet?: { width?: string; order?: number };
		desktop?: { width?: string; order?: number };
	};

	// Validation
	validationRules?: ValidationRule[];

	// Conditional Logic
	conditions?: ConditionalLogic[];

	// Metadata
	metadata?: Record<string, unknown>;
	version?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

// Specific Field Types
export interface TextFormField extends FormFieldBase {
	type: "text" | "email" | "password" | "url";
	defaultValue?: string;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	format?: "none" | "uppercase" | "lowercase" | "capitalize" | "trim";
	mask?: string; // Input mask for formatting
}

export interface NumberFormField extends FormFieldBase {
	type: "number" | "currency" | "percentage";
	defaultValue?: number;
	min?: number;
	max?: number;
	step?: number;
	precision?: number;
	currency?: "GYD" | "USD" | "EUR" | "GBP";
	currencyDisplay?: "symbol" | "code" | "name";
	showThousandSeparator?: boolean;
}

export interface SelectFormField extends FormFieldBase {
	type: "select" | "multiselect" | "radio" | "checkboxGroup";
	options: FormFieldOption[];
	allowOther?: boolean;
	otherLabel?: string;
	searchable?: boolean;
	multiple?: boolean;
	maxSelections?: number;
	defaultValue?: string | string[];
	loadOptionsFrom?: {
		source: "api" | "static" | "calculated";
		endpoint?: string;
		dependsOn?: string[];
		transform?: string; // JavaScript code to transform options
	};
}

export interface DateFormField extends FormFieldBase {
	type: "date" | "datetime" | "time";
	defaultValue?: string;
	minDate?: string;
	maxDate?: string;
	format?: string;
	showTime?: boolean;
	timezone?: string;
	businessDaysOnly?: boolean;
	excludeDates?: string[];
}

export interface FileFormField extends FormFieldBase {
	type: "file" | "image" | "signature";
	accept?: string[];
	maxFiles?: number;
	maxSize?: number; // in bytes
	allowedTypes?: string[];
	requireSignature?: boolean;
	captureMethod?: "upload" | "camera" | "draw";
	validation?: {
		scanForMalware?: boolean;
		extractText?: boolean;
		validateFormat?: boolean;
	};
}

export interface CalculatedFormField extends FormFieldBase {
	type: "calculated";
	calculation: CalculationConfig;
	displayAs?: "number" | "currency" | "percentage" | "text";
	showCalculationSteps?: boolean;
	dependsOn: string[]; // Field IDs this calculation depends on
}

export interface SectionFormField extends FormFieldBase {
	type: "section";
	collapsible?: boolean;
	collapsed?: boolean;
	fields?: string[]; // Field IDs in this section
	showProgress?: boolean;
	completionRules?: {
		requiredFields?: string[];
		validationRules?: ValidationRule[];
	};
}

export type FormField =
	| TextFormField
	| NumberFormField
	| SelectFormField
	| DateFormField
	| FileFormField
	| CalculatedFormField
	| SectionFormField;

// Field Options
export interface FormFieldOption {
	value: string;
	label: string;
	description?: string;
	group?: string;
	disabled?: boolean;
	metadata?: Record<string, unknown>;
	conditionalShow?: ConditionalLogic[];
}

// Validation Rules
export interface ValidationRule {
	id: string;
	type: ValidationRuleType;
	field?: string; // For cross-field validation
	value?: unknown;
	message: string;
	severity: "error" | "warning" | "info";
	when?: ConditionalLogic[]; // When this rule applies

	// Guyanese-specific validation
	guyaneseRule?: {
		authority: Authority;
		ruleType: string;
		parameters: Record<string, unknown>;
	};
}

// Conditional Logic
export interface ConditionalLogic {
	id: string;
	field: string; // Field ID to check
	operator:
		| "equals"
		| "not_equals"
		| "contains"
		| "not_contains"
		| "greater_than"
		| "less_than"
		| "in"
		| "not_in"
		| "empty"
		| "not_empty"
		| "regex";
	value: unknown;
	action:
		| "show"
		| "hide"
		| "enable"
		| "disable"
		| "require"
		| "unrequire"
		| "calculate";
	target?: string; // Target field ID (for actions that affect other fields)
}

// Calculations
export interface CalculationConfig {
	id: string;
	type: CalculationType;
	formula?: string; // JavaScript expression or predefined formula
	parameters: Record<string, unknown>;

	// Guyanese-specific calculations
	guyaneseCalculation?: {
		authority: Authority;
		calculationType: string;
		taxYear?: number;
		rates: Record<string, number>;
		thresholds: Record<string, number>;
		allowances: Record<string, number>;
	};
}

// Form Configuration
export interface FormConfiguration {
	id: string;
	name: string;
	title: string;
	description?: string;
	version: string;

	// Agency Configuration
	authority: Authority;
	documentType: string;
	category: DocumentCategory;
	applicableClientTypes: ClientType[];

	// Form Structure
	fields: FormField[];
	sections: FormSection[];
	steps?: FormStep[];

	// Behavior
	saveAndResume?: boolean;
	autoSave?: boolean;
	autoSaveInterval?: number; // in seconds
	allowPartialSubmission?: boolean;
	requiresReview?: boolean;
	multiLanguage?: {
		default: "en";
		supported: string[];
	};

	// Styling
	theme?: FormTheme;
	customCSS?: string;

	// Submission
	submissionConfig: SubmissionConfig;

	// Metadata
	metadata?: Record<string, unknown>;
	tags?: string[];
	isActive: boolean;
	effectiveDate?: Date;
	expiryDate?: Date;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

// Form Sections
export interface FormSection {
	id: string;
	title: string;
	description?: string;
	order: number;
	fields: string[]; // Field IDs
	collapsible?: boolean;
	collapsed?: boolean;
	showProgress?: boolean;
	completionRules?: {
		requiredFields?: string[];
		validationRules?: ValidationRule[];
	};
}

// Multi-step Forms
export interface FormStep {
	id: string;
	title: string;
	description?: string;
	order: number;
	sections: string[]; // Section IDs
	icon?: string;
	optional?: boolean;
	completionCriteria?: {
		requiredFields?: string[];
		validationRules?: ValidationRule[];
		minimumCompletion?: number; // percentage
	};
	navigation?: {
		allowSkip?: boolean;
		allowBack?: boolean;
		customNext?: string; // Custom next button text
		customBack?: string; // Custom back button text;
	};
}

// Form Theme
export interface FormTheme {
	name: string;
	colors: {
		primary: string;
		secondary: string;
		accent: string;
		background: string;
		surface: string;
		text: string;
		textSecondary: string;
		border: string;
		error: string;
		warning: string;
		success: string;
		info: string;
	};
	fonts: {
		primary: string;
		secondary?: string;
	};
	spacing: {
		small: string;
		medium: string;
		large: string;
	};
	borderRadius: string;
	shadows: {
		small: string;
		medium: string;
		large: string;
	};
}

// Submission Configuration
export interface SubmissionConfig {
	method: "api" | "email" | "webhook";
	endpoint?: string;
	headers?: Record<string, string>;
	authentication?: {
		type: "none" | "bearer" | "basic" | "api_key";
		credentials?: Record<string, string>;
	};

	// File handling
	fileUploadConfig?: {
		storage: "local" | "s3" | "cloudinary";
		maxTotalSize: number;
		allowedTypes: string[];
		scanForMalware: boolean;
	};

	// Post-submission actions
	postSubmissionActions?: PostSubmissionAction[];

	// Notifications
	notifications?: {
		email?: {
			to: string[];
			cc?: string[];
			bcc?: string[];
			subject: string;
			template: string;
		};
		webhook?: {
			url: string;
			headers?: Record<string, string>;
		};
	};
}

// Post-submission Actions
export interface PostSubmissionAction {
	type: "redirect" | "email" | "api_call" | "workflow" | "document_generation";
	config: Record<string, unknown>;
	conditions?: ConditionalLogic[];
}

// Form Data and Submission
export interface FormData {
	formId: string;
	version: string;
	submissionId?: string;
	clientId?: number;
	userId: string;

	// Form values
	values: Record<string, unknown>;
	files: Record<string, FileUpload[]>;

	// Metadata
	startedAt: Date;
	lastSavedAt: Date;
	submittedAt?: Date;
	ipAddress?: string;
	userAgent?: string;

	// Status
	status:
		| "draft"
		| "in_progress"
		| "completed"
		| "submitted"
		| "approved"
		| "rejected";
	completionPercentage: number;

	// Validation
	validationErrors: ValidationError[];
	hasErrors: boolean;

	// Workflow
	workflowState?: {
		currentStep: string;
		completedSteps: string[];
		nextSteps: string[];
	};
}

// File Upload
export interface FileUpload {
	id: string;
	fileName: string;
	originalName: string;
	mimeType: string;
	size: number;
	url: string;
	uploadedAt: Date;
	metadata?: Record<string, unknown>;
}

// Validation Errors
export interface ValidationError {
	field: string;
	rule: string;
	message: string;
	severity: "error" | "warning" | "info";
	value?: unknown;
}

// Form Builder State
export interface FormBuilderState {
	form: FormConfiguration;
	selectedField?: string;
	selectedSection?: string;
	draggedField?: FormField;
	isDragging: boolean;
	mode: "design" | "preview" | "code";
	isDirty: boolean;
	errors: ValidationError[];
	warnings: string[];
}

// Form Builder Actions
export type FormBuilderAction =
	| { type: "SET_FORM"; payload: FormConfiguration }
	| { type: "UPDATE_FORM"; payload: Partial<FormConfiguration> }
	| {
			type: "ADD_FIELD";
			payload: { field: FormField; targetIndex?: number; section?: string };
	  }
	| {
			type: "UPDATE_FIELD";
			payload: { fieldId: string; updates: Partial<FormField> };
	  }
	| { type: "REMOVE_FIELD"; payload: { fieldId: string } }
	| {
			type: "MOVE_FIELD";
			payload: { fieldId: string; newIndex: number; newSection?: string };
	  }
	| { type: "SELECT_FIELD"; payload: { fieldId?: string } }
	| {
			type: "ADD_SECTION";
			payload: { section: FormSection; targetIndex?: number };
	  }
	| {
			type: "UPDATE_SECTION";
			payload: { sectionId: string; updates: Partial<FormSection> };
	  }
	| { type: "REMOVE_SECTION"; payload: { sectionId: string } }
	| { type: "SET_MODE"; payload: { mode: "design" | "preview" | "code" } }
	| { type: "SET_DIRTY"; payload: { isDirty: boolean } }
	| { type: "SET_ERRORS"; payload: { errors: ValidationError[] } }
	| { type: "SET_WARNINGS"; payload: { warnings: string[] } };

// Agency Form Templates
export interface AgencyFormTemplate {
	id: string;
	authority: Authority;
	category: AgencyCategory;
	documentType: string;
	name: string;
	description: string;
	configuration: FormConfiguration;

	// Template metadata
	version: string;
	isOfficial: boolean;
	isActive: boolean;
	effectiveDate: Date;
	expiryDate?: Date;

	// Usage statistics
	usageCount: number;
	lastUsed?: Date;
	averageCompletionTime?: number; // in minutes
	averageCompletionRate?: number; // percentage

	// Compliance
	complianceVersion: string;
	validationRules: ValidationRule[];
	requiredFields: string[];

	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

// Form Analytics
export interface FormAnalytics {
	formId: string;
	period: {
		start: Date;
		end: Date;
	};

	// Completion metrics
	totalStarts: number;
	totalCompletions: number;
	completionRate: number;
	averageCompletionTime: number; // in minutes

	// Field analytics
	fieldAnalytics: FieldAnalytics[];

	// Validation analytics
	validationErrors: FieldValidationAnalytics[];
	mostCommonErrors: string[];

	// User behavior
	dropOffPoints: DropOffAnalytics[];
	averageTimePerStep: StepTimeAnalytics[];

	// Device/browser analytics
	deviceTypes: Record<string, number>;
	browsers: Record<string, number>;
	mobileOptimizationScore: number;

	generatedAt: Date;
}

export interface FieldAnalytics {
	fieldId: string;
	fieldName: string;
	completionRate: number;
	averageTimeSpent: number; // in seconds
	validationErrorRate: number;
	skipRate: number;
	mostCommonValues: Array<{ value: string; count: number }>;
}

export interface FieldValidationAnalytics {
	fieldId: string;
	ruleType: ValidationRuleType;
	errorCount: number;
	errorRate: number;
	message: string;
}

export interface DropOffAnalytics {
	step: string;
	section: string;
	field: string;
	dropOffCount: number;
	dropOffRate: number;
	averageTimeBeforeDropOff: number; // in seconds
}

export interface StepTimeAnalytics {
	step: string;
	averageTime: number; // in seconds
	medianTime: number;
	completionRate: number;
}
