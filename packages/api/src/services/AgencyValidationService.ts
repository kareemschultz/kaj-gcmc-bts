/**
 * Agency-Specific Document Validation Service
 * Handles validation rules for different Guyanese regulatory agencies
 */

import type {
	AgencyDocumentRequirement,
	Authority,
	DocumentCategory,
	DocumentValidationRule,
	DocumentWorkflow,
	WorkflowCondition,
} from "@GCMC-KAJ/types";

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];
	suggestions: ValidationSuggestion[];
}

export interface ValidationError {
	ruleId: string;
	field?: string;
	message: string;
	severity: "error";
	code: string;
}

export interface ValidationWarning {
	ruleId: string;
	field?: string;
	message: string;
	severity: "warning";
	code: string;
}

export interface ValidationSuggestion {
	ruleId: string;
	field?: string;
	message: string;
	severity: "info";
	code: string;
	suggestedValue?: unknown;
}

export interface DocumentData {
	[key: string]: unknown;
}

/**
 * Agency-specific document validation service
 */
export class AgencyValidationService {
	constructor(private prisma: any) {}

	/**
	 * Validate document against agency-specific rules
	 */
	async validateDocument(
		tenantId: number,
		authority: Authority,
		documentType: string,
		documentData: DocumentData,
		documentCategory?: DocumentCategory,
	): Promise<ValidationResult> {
		const validationResult: ValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
			suggestions: [],
		};

		try {
			// Get agency document requirements and validation rules
			const requirements = await this.getAgencyRequirements(
				tenantId,
				authority,
				documentType,
				documentCategory,
			);

			for (const requirement of requirements) {
				for (const rule of requirement.validationRules) {
					if (!rule.isActive) continue;

					const ruleResult = await this.validateAgainstRule(rule, documentData);

					if (ruleResult) {
						if (ruleResult.severity === "error") {
							validationResult.errors.push(ruleResult);
							validationResult.isValid = false;
						} else if (ruleResult.severity === "warning") {
							validationResult.warnings.push(ruleResult);
						} else if (ruleResult.severity === "info") {
							validationResult.suggestions.push(ruleResult);
						}
					}
				}
			}

			// Apply authority-specific business rules
			await this.applyAuthoritySpecificRules(
				authority,
				documentType,
				documentData,
				validationResult,
			);

			return validationResult;
		} catch (error) {
			console.error("Document validation error:", error);
			validationResult.isValid = false;
			validationResult.errors.push({
				ruleId: "SYSTEM_ERROR",
				message: "System error during validation",
				severity: "error",
				code: "VALIDATION_SYSTEM_ERROR",
			});
			return validationResult;
		}
	}

	/**
	 * Get agency requirements for document type
	 */
	private async getAgencyRequirements(
		tenantId: number,
		authority: Authority,
		documentType: string,
		documentCategory?: DocumentCategory,
	) {
		const whereClause: any = {
			tenantId,
			authority,
			documentType,
		};

		if (documentCategory) {
			whereClause.category = documentCategory;
		}

		return await this.prisma.agencyDocumentRequirement.findMany({
			where: whereClause,
			include: {
				validationRules: {
					where: { isActive: true },
					orderBy: { id: "asc" },
				},
			},
		});
	}

	/**
	 * Validate document data against a specific rule
	 */
	private async validateAgainstRule(
		rule: any,
		documentData: DocumentData,
	): Promise<
		ValidationError | ValidationWarning | ValidationSuggestion | null
	> {
		const { ruleType, field, conditions, errorMessage, severity } = rule;

		try {
			switch (ruleType) {
				case "required_field":
					return this.validateRequiredField(rule, documentData);

				case "format":
					return this.validateFormat(rule, documentData);

				case "size":
					return this.validateSize(rule, documentData);

				case "date_range":
					return this.validateDateRange(rule, documentData);

				case "calculation":
					return this.validateCalculation(rule, documentData);

				case "cross_reference":
					return this.validateCrossReference(rule, documentData);

				default:
					console.warn(`Unknown validation rule type: ${ruleType}`);
					return null;
			}
		} catch (error) {
			console.error(`Error validating rule ${rule.id}:`, error);
			return {
				ruleId: rule.id,
				field,
				message: "Error during rule validation",
				severity: "error" as const,
				code: "RULE_VALIDATION_ERROR",
			};
		}
	}

	/**
	 * Validate required field rule
	 */
	private validateRequiredField(
		rule: any,
		documentData: DocumentData,
	): ValidationError | null {
		const { field, conditions, errorMessage } = rule;
		const operator = conditions.operator;

		if (operator === "required") {
			const value = this.getFieldValue(documentData, field);
			if (value === null || value === undefined || value === "") {
				return {
					ruleId: rule.id,
					field,
					message: errorMessage || `${field} is required`,
					severity: "error",
					code: "REQUIRED_FIELD_MISSING",
				};
			}
		}

		return null;
	}

	/**
	 * Validate format rule (regex, patterns)
	 */
	private validateFormat(
		rule: any,
		documentData: DocumentData,
	): ValidationError | null {
		const { field, conditions, errorMessage } = rule;
		const { operator, pattern, value: expectedValue } = conditions;
		const fieldValue = this.getFieldValue(documentData, field);

		if (fieldValue === null || fieldValue === undefined) {
			return null; // Skip format validation for empty fields
		}

		const stringValue = String(fieldValue);

		switch (operator) {
			case "regex":
				if (pattern && !new RegExp(pattern).test(stringValue)) {
					return {
						ruleId: rule.id,
						field,
						message: errorMessage || `${field} format is invalid`,
						severity: "error",
						code: "INVALID_FORMAT",
					};
				}
				break;

			case "equals":
				if (stringValue !== String(expectedValue)) {
					return {
						ruleId: rule.id,
						field,
						message: errorMessage || `${field} must equal ${expectedValue}`,
						severity: "error",
						code: "VALUE_MISMATCH",
					};
				}
				break;

			case "contains":
				if (!stringValue.includes(String(expectedValue))) {
					return {
						ruleId: rule.id,
						field,
						message: errorMessage || `${field} must contain ${expectedValue}`,
						severity: "error",
						code: "VALUE_NOT_CONTAINED",
					};
				}
				break;
		}

		return null;
	}

	/**
	 * Validate size constraints
	 */
	private validateSize(
		rule: any,
		documentData: DocumentData,
	): ValidationError | null {
		const { field, conditions, errorMessage } = rule;
		const { operator, min, max } = conditions;
		const fieldValue = this.getFieldValue(documentData, field);

		if (fieldValue === null || fieldValue === undefined) {
			return null;
		}

		let size: number;
		if (typeof fieldValue === "string") {
			size = fieldValue.length;
		} else if (typeof fieldValue === "number") {
			size = fieldValue;
		} else if (Array.isArray(fieldValue)) {
			size = fieldValue.length;
		} else {
			return null;
		}

		if (operator === "range") {
			if (
				(min !== undefined && size < min) ||
				(max !== undefined && size > max)
			) {
				return {
					ruleId: rule.id,
					field,
					message:
						errorMessage || `${field} size must be between ${min} and ${max}`,
					severity: "error",
					code: "SIZE_OUT_OF_RANGE",
				};
			}
		}

		return null;
	}

	/**
	 * Validate date range constraints
	 */
	private validateDateRange(
		rule: any,
		documentData: DocumentData,
	): ValidationError | null {
		const { field, conditions, errorMessage } = rule;
		const { operator, min, max } = conditions;
		const fieldValue = this.getFieldValue(documentData, field);

		if (!fieldValue) return null;

		const date = new Date(fieldValue);
		if (isNaN(date.getTime())) {
			return {
				ruleId: rule.id,
				field,
				message: errorMessage || `${field} must be a valid date`,
				severity: "error",
				code: "INVALID_DATE",
			};
		}

		if (operator === "range") {
			const minDate = min ? new Date(min) : null;
			const maxDate = max ? new Date(max) : null;

			if ((minDate && date < minDate) || (maxDate && date > maxDate)) {
				return {
					ruleId: rule.id,
					field,
					message: errorMessage || `${field} must be between ${min} and ${max}`,
					severity: "error",
					code: "DATE_OUT_OF_RANGE",
				};
			}
		}

		return null;
	}

	/**
	 * Validate calculation rules
	 */
	private validateCalculation(
		rule: any,
		documentData: DocumentData,
	): ValidationError | null {
		const { field, conditions, errorMessage } = rule;
		// Implementation depends on specific calculation requirements
		// This is a placeholder for complex business calculations
		console.log("Calculation validation not yet implemented for:", field);
		return null;
	}

	/**
	 * Validate cross-reference rules
	 */
	private validateCrossReference(
		rule: any,
		documentData: DocumentData,
	): ValidationError | null {
		const { field, conditions, errorMessage } = rule;
		// Implementation depends on cross-reference requirements
		// This would typically involve checking against other documents or databases
		console.log("Cross-reference validation not yet implemented for:", field);
		return null;
	}

	/**
	 * Apply authority-specific business rules
	 */
	private async applyAuthoritySpecificRules(
		authority: Authority,
		documentType: string,
		documentData: DocumentData,
		validationResult: ValidationResult,
	): Promise<void> {
		switch (authority) {
			case "GRA":
				await this.applyGRASpecificRules(
					documentType,
					documentData,
					validationResult,
				);
				break;

			case "NIS":
				await this.applyNISSpecificRules(
					documentType,
					documentData,
					validationResult,
				);
				break;

			case "DCRA":
				await this.applyDCRASpecificRules(
					documentType,
					documentData,
					validationResult,
				);
				break;

			case "Immigration":
				await this.applyImmigrationSpecificRules(
					documentType,
					documentData,
					validationResult,
				);
				break;

			default:
				// Other authorities can be added here
				break;
		}
	}

	/**
	 * GRA-specific validation rules
	 */
	private async applyGRASpecificRules(
		documentType: string,
		documentData: DocumentData,
		validationResult: ValidationResult,
	): Promise<void> {
		// Example GRA-specific rules
		if (documentType === "VAT_RETURN") {
			// VAT return specific validations
			const totalSales = this.getFieldValue(
				documentData,
				"totalSales",
			) as number;
			const vatAmount = this.getFieldValue(documentData, "vatAmount") as number;

			if (totalSales && vatAmount) {
				const expectedVAT = totalSales * 0.14; // 14% VAT rate in Guyana
				const tolerance = expectedVAT * 0.01; // 1% tolerance

				if (Math.abs(vatAmount - expectedVAT) > tolerance) {
					validationResult.warnings.push({
						ruleId: "GRA_VAT_CALCULATION",
						field: "vatAmount",
						message: `VAT amount (${vatAmount}) seems incorrect. Expected approximately ${expectedVAT.toFixed(2)}`,
						severity: "warning",
						code: "VAT_CALCULATION_WARNING",
					});
				}
			}
		}

		if (documentType === "INCOME_TAX_RETURN") {
			// Income tax specific validations
			const grossIncome = this.getFieldValue(
				documentData,
				"grossIncome",
			) as number;
			const taxPayable = this.getFieldValue(
				documentData,
				"taxPayable",
			) as number;

			if (grossIncome && grossIncome < 0) {
				validationResult.errors.push({
					ruleId: "GRA_INCOME_VALIDATION",
					field: "grossIncome",
					message: "Gross income cannot be negative",
					severity: "error",
					code: "NEGATIVE_INCOME_ERROR",
				});
			}
		}
	}

	/**
	 * NIS-specific validation rules
	 */
	private async applyNISSpecificRules(
		documentType: string,
		documentData: DocumentData,
		validationResult: ValidationResult,
	): Promise<void> {
		if (documentType === "EMPLOYEE_CONTRIBUTION") {
			const salary = this.getFieldValue(documentData, "salary") as number;
			const contribution = this.getFieldValue(
				documentData,
				"employeeContribution",
			) as number;

			if (salary && contribution) {
				const expectedContribution = Math.min(salary * 0.056, 1000); // 5.6% up to max
				const tolerance = expectedContribution * 0.01;

				if (Math.abs(contribution - expectedContribution) > tolerance) {
					validationResult.warnings.push({
						ruleId: "NIS_CONTRIBUTION_CALCULATION",
						field: "employeeContribution",
						message: `Employee contribution may be incorrect. Expected ${expectedContribution.toFixed(2)}`,
						severity: "warning",
						code: "NIS_CONTRIBUTION_WARNING",
					});
				}
			}
		}
	}

	/**
	 * DCRA-specific validation rules
	 */
	private async applyDCRASpecificRules(
		documentType: string,
		documentData: DocumentData,
		validationResult: ValidationResult,
	): Promise<void> {
		if (documentType === "COMPANY_REGISTRATION") {
			const companyName = this.getFieldValue(
				documentData,
				"companyName",
			) as string;

			if (companyName) {
				// Check for reserved words
				const reservedWords = ["BANK", "INSURANCE", "TRUST", "GOVERNMENT"];
				const uppercaseName = companyName.toUpperCase();

				for (const word of reservedWords) {
					if (uppercaseName.includes(word)) {
						validationResult.warnings.push({
							ruleId: "DCRA_RESERVED_WORDS",
							field: "companyName",
							message: `Company name contains reserved word '${word}'. Additional approval may be required.`,
							severity: "warning",
							code: "RESERVED_WORD_WARNING",
						});
					}
				}
			}
		}
	}

	/**
	 * Immigration-specific validation rules
	 */
	private async applyImmigrationSpecificRules(
		documentType: string,
		documentData: DocumentData,
		validationResult: ValidationResult,
	): Promise<void> {
		if (documentType === "WORK_PERMIT_APPLICATION") {
			const passportExpiry = this.getFieldValue(
				documentData,
				"passportExpiryDate",
			);

			if (passportExpiry) {
				const expiryDate = new Date(passportExpiry);
				const sixMonthsFromNow = new Date();
				sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

				if (expiryDate < sixMonthsFromNow) {
					validationResult.warnings.push({
						ruleId: "IMMIGRATION_PASSPORT_EXPIRY",
						field: "passportExpiryDate",
						message:
							"Passport expires within 6 months. Consider renewal before application.",
						severity: "warning",
						code: "PASSPORT_EXPIRY_WARNING",
					});
				}
			}
		}
	}

	/**
	 * Get field value from document data using dot notation
	 */
	private getFieldValue(data: DocumentData, fieldPath: string): unknown {
		return fieldPath.split(".").reduce((obj: any, key: string) => {
			return obj && obj[key] !== undefined ? obj[key] : null;
		}, data);
	}

	/**
	 * Validate workflow conditions
	 */
	async validateWorkflowConditions(
		conditions: WorkflowCondition[],
		documentData: DocumentData,
	): Promise<boolean> {
		for (const condition of conditions) {
			const fieldValue = this.getFieldValue(documentData, condition.field);

			if (!this.evaluateCondition(fieldValue, condition)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Evaluate a single workflow condition
	 */
	private evaluateCondition(
		fieldValue: unknown,
		condition: WorkflowCondition,
	): boolean {
		const { operator, value } = condition;

		switch (operator) {
			case "equals":
				return fieldValue === value;

			case "not_equals":
				return fieldValue !== value;

			case "greater_than":
				return Number(fieldValue) > Number(value);

			case "less_than":
				return Number(fieldValue) < Number(value);

			case "contains":
				return String(fieldValue).includes(String(value));

			case "exists":
				return fieldValue !== null && fieldValue !== undefined;

			case "is_null":
				return fieldValue === null || fieldValue === undefined;

			default:
				console.warn(`Unknown condition operator: ${operator}`);
				return false;
		}
	}

	/**
	 * Get validation rules for a specific authority and document type
	 */
	async getValidationRules(
		tenantId: number,
		authority: Authority,
		documentType: string,
	): Promise<DocumentValidationRule[]> {
		const requirements = await this.getAgencyRequirements(
			tenantId,
			authority,
			documentType,
		);

		return requirements.flatMap((req) => req.validationRules);
	}

	/**
	 * Test validation rules against sample data
	 */
	async testValidationRules(
		ruleId: string,
		sampleData: DocumentData,
	): Promise<ValidationResult> {
		const rule = await this.prisma.documentValidationRule.findUnique({
			where: { id: ruleId },
		});

		if (!rule) {
			throw new Error(`Validation rule ${ruleId} not found`);
		}

		const result: ValidationResult = {
			isValid: true,
			errors: [],
			warnings: [],
			suggestions: [],
		};

		const ruleResult = await this.validateAgainstRule(rule, sampleData);

		if (ruleResult) {
			if (ruleResult.severity === "error") {
				result.errors.push(ruleResult);
				result.isValid = false;
			} else if (ruleResult.severity === "warning") {
				result.warnings.push(ruleResult);
			} else if (ruleResult.severity === "info") {
				result.suggestions.push(ruleResult);
			}
		}

		return result;
	}
}

/**
 * Factory function to create validation service
 */
export function createAgencyValidationService(
	prisma: any,
): AgencyValidationService {
	return new AgencyValidationService(prisma);
}

/**
 * Authority-specific validation rule templates
 */
export const AUTHORITY_VALIDATION_TEMPLATES = {
	GRA: {
		VAT_RETURN: [
			{
				name: "VAT Rate Validation",
				ruleType: "calculation",
				field: "vatAmount",
				description: "Validates VAT calculation at 14%",
			},
			{
				name: "Sales Amount Required",
				ruleType: "required_field",
				field: "totalSales",
				description: "Total sales amount is required",
			},
		],
		INCOME_TAX_RETURN: [
			{
				name: "Gross Income Validation",
				ruleType: "size",
				field: "grossIncome",
				description: "Gross income must be non-negative",
			},
		],
	},
	NIS: {
		EMPLOYEE_CONTRIBUTION: [
			{
				name: "NIS Contribution Calculation",
				ruleType: "calculation",
				field: "employeeContribution",
				description: "Validates NIS contribution at 5.6%",
			},
		],
	},
	DCRA: {
		COMPANY_REGISTRATION: [
			{
				name: "Company Name Validation",
				ruleType: "format",
				field: "companyName",
				description: "Company name format and reserved word validation",
			},
		],
	},
	Immigration: {
		WORK_PERMIT_APPLICATION: [
			{
				name: "Passport Expiry Validation",
				ruleType: "date_range",
				field: "passportExpiryDate",
				description: "Passport must be valid for at least 6 months",
			},
		],
	},
} as const;
