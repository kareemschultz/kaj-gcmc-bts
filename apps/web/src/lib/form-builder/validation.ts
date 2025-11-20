/**
 * Form Builder Validation Engine
 * Real-time validation with Guyanese regulatory compliance
 */

import { z } from "zod";
import type {
	Authority,
	ClientType,
	FormConfiguration,
	FormData,
	FormField,
	ValidationError,
	ValidationRule,
} from "./types";

// Guyanese-specific validation patterns
export const GUYANESE_PATTERNS = {
	// National Insurance Number (9 digits)
	NIS_NUMBER: /^[0-9]{9}$/,

	// Tax Identification Number (TIN)
	TIN: /^[0-9]{10}$/,

	// Guyana Revenue Authority (GRA) Registration
	GRA_REG: /^GRA[0-9]{8}$/,

	// Deeds and Commercial Registry Authority (DCRA) Registration
	DCRA_REG: /^RC[0-9]{6}$/,

	// Passport Number (Guyanese format)
	PASSPORT: /^[G][0-9]{7}$/,

	// National ID Card
	NATIONAL_ID: /^[0-9]{6}-[0-9]{7}$/,

	// Business Registration Number
	BUSINESS_REG: /^[0-9]{6}$/,

	// VAT Registration Number
	VAT_REG: /^VAT[0-9]{8}$/,

	// Employer Registration Number
	EMPLOYER_REG: /^EMP[0-9]{6}$/,

	// Phone numbers (Guyana format)
	PHONE_GY: /^(\+592|592|0)?[2-7][0-9]{6}$/,

	// Postal codes (if applicable)
	POSTAL_CODE: /^[0-9]{5}$/,
} as const;

// Authority-specific validation rules
export const AUTHORITY_VALIDATION_RULES: Record<
	Authority,
	Record<string, ValidationRule[]>
> = {
	GRA: {
		tin: [
			{
				id: "gra_tin_format",
				type: "guyaneseSpecific",
				message: "TIN must be a valid 10-digit number",
				severity: "error",
				guyaneseRule: {
					authority: "GRA",
					ruleType: "tin_validation",
					parameters: { pattern: GUYANESE_PATTERNS.TIN },
				},
			},
		],
		vat_registration: [
			{
				id: "gra_vat_format",
				type: "guyaneseSpecific",
				message: "VAT registration must start with 'VAT' followed by 8 digits",
				severity: "error",
				guyaneseRule: {
					authority: "GRA",
					ruleType: "vat_validation",
					parameters: { pattern: GUYANESE_PATTERNS.VAT_REG },
				},
			},
		],
		income_tax: [
			{
				id: "gra_income_tax_calculation",
				type: "businessRule",
				message: "Income tax calculation must follow GRA tax brackets",
				severity: "error",
				guyaneseRule: {
					authority: "GRA",
					ruleType: "income_tax_brackets",
					parameters: {
						brackets: [
							{ min: 0, max: 780000, rate: 0 },
							{ min: 780001, max: 1560000, rate: 0.28 },
							{ min: 1560001, max: Number.POSITIVE_INFINITY, rate: 0.4 },
						],
					},
				},
			},
		],
	},
	NIS: {
		nis_number: [
			{
				id: "nis_number_format",
				type: "guyaneseSpecific",
				message: "NIS number must be exactly 9 digits",
				severity: "error",
				guyaneseRule: {
					authority: "NIS",
					ruleType: "nis_validation",
					parameters: { pattern: GUYANESE_PATTERNS.NIS_NUMBER },
				},
			},
		],
		contribution_rate: [
			{
				id: "nis_contribution_calculation",
				type: "businessRule",
				message: "NIS contribution calculation is incorrect",
				severity: "error",
				guyaneseRule: {
					authority: "NIS",
					ruleType: "contribution_calculation",
					parameters: {
						employeeRate: 0.056,
						employerRate: 0.072,
						maxWeeklyWage: 50000,
						minWeeklyWage: 8000,
					},
				},
			},
		],
	},
	DCRA: {
		business_registration: [
			{
				id: "dcra_business_reg_format",
				type: "guyaneseSpecific",
				message:
					"Business registration must start with 'RC' followed by 6 digits",
				severity: "error",
				guyaneseRule: {
					authority: "DCRA",
					ruleType: "business_reg_validation",
					parameters: { pattern: GUYANESE_PATTERNS.DCRA_REG },
				},
			},
		],
	},
	Immigration: {
		passport: [
			{
				id: "immigration_passport_format",
				type: "guyaneseSpecific",
				message: "Guyanese passport must start with 'G' followed by 7 digits",
				severity: "error",
				guyaneseRule: {
					authority: "Immigration",
					ruleType: "passport_validation",
					parameters: { pattern: GUYANESE_PATTERNS.PASSPORT },
				},
			},
		],
	},
	// Add more authorities as needed...
	MOL: {},
	EPA: {},
	GSB: {},
	BOG: {},
	MOH: {},
	NDIA: {},
	GWI: {},
	GPL: {},
	GuyOil: {},
	GGMC: {},
	MARAD: {},
	GCAA: {},
	CFU: {},
	GoInvest: {},
	GGB: {},
	GPF: {},
	CARICOM: {},
	CUSTOMS: {},
	FORESTRY: {},
	LANDS: {},
	TRANSPORT: {},
	TOURISM: {},
	AGRICULTURE: {},
	EDUCATION: {},
	SOCIAL_SERVICES: {},
};

// Zod schemas for validation
export const createFieldValidationSchema = (
	field: FormField,
): z.ZodType<unknown> => {
	let schema: z.ZodType<unknown> = z.unknown();

	switch (field.type) {
		case "text":
		case "email":
		case "password":
		case "url": {
			schema = z.string();

			if (field.type === "email") {
				schema = (schema as z.ZodString).email("Invalid email format");
			}

			if (field.type === "url") {
				schema = (schema as z.ZodString).url("Invalid URL format");
			}

			const textField = field as any;
			if (textField.minLength) {
				schema = (schema as z.ZodString).min(
					textField.minLength,
					`Minimum length is ${textField.minLength}`,
				);
			}
			if (textField.maxLength) {
				schema = (schema as z.ZodString).max(
					textField.maxLength,
					`Maximum length is ${textField.maxLength}`,
				);
			}
			if (textField.pattern) {
				schema = (schema as z.ZodString).regex(
					new RegExp(textField.pattern),
					"Invalid format",
				);
			}
			break;
		}

		case "number":
		case "currency":
		case "percentage": {
			schema = z.number();
			const numberField = field as any;
			if (typeof numberField.min === "number") {
				schema = (schema as z.ZodNumber).min(
					numberField.min,
					`Minimum value is ${numberField.min}`,
				);
			}
			if (typeof numberField.max === "number") {
				schema = (schema as z.ZodNumber).max(
					numberField.max,
					`Maximum value is ${numberField.max}`,
				);
			}
			break;
		}

		case "date":
		case "datetime":
		case "time":
			schema = z
				.string()
				.refine((date) => !isNaN(Date.parse(date)), "Invalid date format");
			break;

		case "select":
		case "radio": {
			const selectField = field as any;
			const allowedValues =
				selectField.options?.map((opt: any) => opt.value) || [];
			schema = z.enum(
				allowedValues.length > 0
					? [allowedValues[0], ...allowedValues.slice(1)]
					: ["default"],
			);
			break;
		}

		case "multiselect":
		case "checkboxGroup": {
			const multiSelectField = field as any;
			const multiAllowedValues =
				multiSelectField.options?.map((opt: any) => opt.value) || [];
			schema = z.array(
				z.enum(
					multiAllowedValues.length > 0
						? [multiAllowedValues[0], ...multiAllowedValues.slice(1)]
						: ["default"],
				),
			);
			break;
		}

		case "checkbox":
			schema = z.boolean();
			break;

		case "file":
		case "image":
			schema = z
				.array(
					z.object({
						name: z.string(),
						size: z.number(),
						type: z.string(),
					}),
				)
				.optional();
			break;

		case "tax_id":
			schema = z.string().regex(GUYANESE_PATTERNS.TIN, "Invalid Tax ID format");
			break;

		case "business_reg":
			schema = z
				.string()
				.regex(
					GUYANESE_PATTERNS.DCRA_REG,
					"Invalid business registration format",
				);
			break;

		case "nis_number":
			schema = z
				.string()
				.regex(GUYANESE_PATTERNS.NIS_NUMBER, "Invalid NIS number format");
			break;

		case "passport":
			schema = z
				.string()
				.regex(GUYANESE_PATTERNS.PASSPORT, "Invalid passport number format");
			break;

		case "phone":
			schema = z
				.string()
				.regex(GUYANESE_PATTERNS.PHONE_GY, "Invalid phone number format");
			break;
	}

	// Apply required validation
	if (field.required) {
		if (schema instanceof z.ZodString) {
			schema = schema.min(1, "This field is required");
		} else if (schema instanceof z.ZodArray) {
			schema = schema.min(1, "At least one selection is required");
		} else {
			schema = schema.refine(
				(val) => val !== null && val !== undefined,
				"This field is required",
			);
		}
	} else {
		schema = schema.optional();
	}

	return schema;
};

export class FormValidationEngine {
	private formConfig: FormConfiguration;
	private authorityRules: ValidationRule[];

	constructor(formConfig: FormConfiguration) {
		this.formConfig = formConfig;
		this.authorityRules = this.getAuthoritySpecificRules();
	}

	private getAuthoritySpecificRules(): ValidationRule[] {
		const authority = this.formConfig.authority;
		const rules: ValidationRule[] = [];

		// Get authority-specific validation rules
		const authorityConfig = AUTHORITY_VALIDATION_RULES[authority];
		if (authorityConfig) {
			Object.values(authorityConfig).forEach((ruleSet) => {
				rules.push(...ruleSet);
			});
		}

		return rules;
	}

	/**
	 * Validate a single field value
	 */
	validateField(fieldId: string, value: unknown): ValidationError[] {
		const field = this.formConfig.fields.find((f) => f.id === fieldId);
		if (!field) return [];

		const errors: ValidationError[] = [];

		try {
			// Create and validate against Zod schema
			const schema = createFieldValidationSchema(field);
			schema.parse(value);
		} catch (error) {
			if (error instanceof z.ZodError) {
				error.issues.forEach((issue) => {
					errors.push({
						field: fieldId,
						rule: issue.code,
						message: issue.message,
						severity: "error",
						value,
					});
				});
			}
		}

		// Apply custom validation rules
		if (field.validationRules) {
			field.validationRules.forEach((rule) => {
				const validationResult = this.applyValidationRule(rule, fieldId, value);
				if (validationResult) {
					errors.push(validationResult);
				}
			});
		}

		// Apply authority-specific rules
		this.authorityRules.forEach((rule) => {
			if (this.shouldApplyRule(rule, field)) {
				const validationResult = this.applyValidationRule(rule, fieldId, value);
				if (validationResult) {
					errors.push(validationResult);
				}
			}
		});

		return errors;
	}

	/**
	 * Validate entire form data
	 */
	validateForm(formData: Partial<FormData>): ValidationError[] {
		const errors: ValidationError[] = [];

		// Validate individual fields
		this.formConfig.fields.forEach((field) => {
			const value = formData.values?.[field.name];
			const fieldErrors = this.validateField(field.id, value);
			errors.push(...fieldErrors);
		});

		// Validate cross-field rules
		errors.push(...this.validateCrossFieldRules(formData));

		// Validate business rules
		errors.push(...this.validateBusinessRules(formData));

		return errors;
	}

	/**
	 * Real-time validation as user types
	 */
	validateFieldRealTime(
		fieldId: string,
		value: unknown,
		allValues: Record<string, unknown> = {},
	): ValidationError[] {
		const errors = this.validateField(fieldId, value);

		// Check conditional validations that might affect this field
		const conditionalErrors = this.validateConditionalRules(
			fieldId,
			value,
			allValues,
		);
		errors.push(...conditionalErrors);

		return errors;
	}

	private applyValidationRule(
		rule: ValidationRule,
		fieldId: string,
		value: unknown,
	): ValidationError | null {
		switch (rule.type) {
			case "required":
				if (!value || (typeof value === "string" && value.trim() === "")) {
					return {
						field: fieldId,
						rule: rule.id,
						message: rule.message,
						severity: rule.severity,
						value,
					};
				}
				break;

			case "pattern":
				if (typeof value === "string" && typeof rule.value === "string") {
					const pattern = new RegExp(rule.value);
					if (!pattern.test(value)) {
						return {
							field: fieldId,
							rule: rule.id,
							message: rule.message,
							severity: rule.severity,
							value,
						};
					}
				}
				break;

			case "guyaneseSpecific":
				return this.validateGuyaneseSpecificRule(rule, fieldId, value);

			case "businessRule":
				return this.validateBusinessRule(rule, fieldId, value);

			// Add more validation rule types as needed
		}

		return null;
	}

	private validateGuyaneseSpecificRule(
		rule: ValidationRule,
		fieldId: string,
		value: unknown,
	): ValidationError | null {
		if (!rule.guyaneseRule) return null;

		const { authority, ruleType, parameters } = rule.guyaneseRule;

		switch (ruleType) {
			case "tin_validation":
			case "vat_validation":
			case "nis_validation":
			case "passport_validation":
			case "business_reg_validation":
				if (typeof value === "string" && parameters.pattern) {
					const pattern = new RegExp(parameters.pattern);
					if (!pattern.test(value)) {
						return {
							field: fieldId,
							rule: rule.id,
							message: rule.message,
							severity: rule.severity,
							value,
						};
					}
				}
				break;

			// Add more Guyanese-specific validation types
		}

		return null;
	}

	private validateBusinessRule(
		rule: ValidationRule,
		fieldId: string,
		value: unknown,
	): ValidationError | null {
		if (!rule.guyaneseRule) return null;

		const { authority, ruleType, parameters } = rule.guyaneseRule;

		switch (ruleType) {
			case "income_tax_brackets":
				// Implement income tax calculation validation
				if (typeof value === "number" && parameters.brackets) {
					// This would contain complex business logic for tax calculation
					// For now, just a placeholder
				}
				break;

			case "contribution_calculation":
				// Implement NIS contribution validation
				if (typeof value === "number" && parameters.employeeRate) {
					// Complex NIS calculation logic would go here
				}
				break;

			// Add more business rule types
		}

		return null;
	}

	private validateCrossFieldRules(
		formData: Partial<FormData>,
	): ValidationError[] {
		const errors: ValidationError[] = [];

		// Find fields with cross-field validation rules
		this.formConfig.fields.forEach((field) => {
			field.validationRules?.forEach((rule) => {
				if (rule.type === "crossField" && rule.field) {
					const currentValue = formData.values?.[field.name];
					const relatedValue = formData.values?.[rule.field];

					// Implement cross-field validation logic
					const error = this.validateCrossFieldRule(
						rule,
						field.id,
						currentValue,
						relatedValue,
					);
					if (error) {
						errors.push(error);
					}
				}
			});
		});

		return errors;
	}

	private validateCrossFieldRule(
		rule: ValidationRule,
		fieldId: string,
		currentValue: unknown,
		relatedValue: unknown,
	): ValidationError | null {
		// Implement specific cross-field validation logic
		// This would depend on the specific rule and business requirements
		return null;
	}

	private validateBusinessRules(
		formData: Partial<FormData>,
	): ValidationError[] {
		const errors: ValidationError[] = [];

		// Implement comprehensive business rule validation
		// This would include complex calculations and validations specific to Guyanese regulations

		return errors;
	}

	private validateConditionalRules(
		fieldId: string,
		value: unknown,
		allValues: Record<string, unknown>,
	): ValidationError[] {
		const errors: ValidationError[] = [];

		// Check if this field change affects other fields' conditional rules
		this.formConfig.fields.forEach((field) => {
			field.conditions?.forEach((condition) => {
				if (condition.field === fieldId) {
					// This field change might affect the target field
					const shouldApply = this.evaluateCondition(condition, value);

					if (shouldApply && condition.action === "require") {
						const targetValue = allValues[condition.target || ""];
						if (!targetValue) {
							errors.push({
								field: condition.target || "",
								rule: "conditional_required",
								message: `This field is required when ${field.label} is ${value}`,
								severity: "error",
								value: targetValue,
							});
						}
					}
				}
			});
		});

		return errors;
	}

	private evaluateCondition(condition: any, value: unknown): boolean {
		switch (condition.operator) {
			case "equals":
				return value === condition.value;
			case "not_equals":
				return value !== condition.value;
			case "contains":
				return typeof value === "string" && value.includes(condition.value);
			case "not_contains":
				return typeof value === "string" && !value.includes(condition.value);
			case "greater_than":
				return typeof value === "number" && value > condition.value;
			case "less_than":
				return typeof value === "number" && value < condition.value;
			case "in":
				return (
					Array.isArray(condition.value) && condition.value.includes(value)
				);
			case "not_in":
				return (
					Array.isArray(condition.value) && !condition.value.includes(value)
				);
			case "empty":
				return !value || (typeof value === "string" && value.trim() === "");
			case "not_empty":
				return !!(value && (typeof value !== "string" || value.trim() !== ""));
			case "regex":
				return (
					typeof value === "string" && new RegExp(condition.value).test(value)
				);
			default:
				return false;
		}
	}

	private shouldApplyRule(rule: ValidationRule, field: FormField): boolean {
		// Determine if a rule should apply to a specific field
		// This could be based on field type, metadata, etc.
		return true; // Simplified for now
	}

	/**
	 * Get validation summary for the entire form
	 */
	getValidationSummary(formData: Partial<FormData>): {
		isValid: boolean;
		errorCount: number;
		warningCount: number;
		errors: ValidationError[];
		fieldSummary: Record<
			string,
			{ isValid: boolean; errors: ValidationError[] }
		>;
	} {
		const allErrors = this.validateForm(formData);
		const errorCount = allErrors.filter((e) => e.severity === "error").length;
		const warningCount = allErrors.filter(
			(e) => e.severity === "warning",
		).length;

		// Group errors by field
		const fieldSummary: Record<
			string,
			{ isValid: boolean; errors: ValidationError[] }
		> = {};
		this.formConfig.fields.forEach((field) => {
			const fieldErrors = allErrors.filter((e) => e.field === field.id);
			fieldSummary[field.id] = {
				isValid: fieldErrors.filter((e) => e.severity === "error").length === 0,
				errors: fieldErrors,
			};
		});

		return {
			isValid: errorCount === 0,
			errorCount,
			warningCount,
			errors: allErrors,
			fieldSummary,
		};
	}
}

/**
 * Create validation engine instance
 */
export const createValidationEngine = (
	formConfig: FormConfiguration,
): FormValidationEngine => {
	return new FormValidationEngine(formConfig);
};
