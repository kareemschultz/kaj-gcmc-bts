/**
 * Form Builder Calculation Engine
 * Tax calculations, NIS contributions, fees, and business-specific calculations for Guyana
 */

import type {
	Authority,
	CalculationConfig,
	CalculationType,
	FormData,
	FormField,
} from "./types";

// Guyanese Tax Rates and Constants (2024 tax year)
export const TAX_CONSTANTS = {
	GRA: {
		INCOME_TAX: {
			PERSONAL_ALLOWANCE: 780000, // GYD per year
			BRACKETS: [
				{ min: 0, max: 780000, rate: 0 },
				{ min: 780001, max: 1560000, rate: 0.28 },
				{ min: 1560001, max: Number.POSITIVE_INFINITY, rate: 0.4 },
			],
		},
		VAT: {
			STANDARD_RATE: 0.14,
			ZERO_RATED_ITEMS: [
				"basic_food_items",
				"medicines",
				"educational_materials",
				"exported_goods",
			],
			EXEMPT_SERVICES: [
				"financial_services",
				"insurance",
				"healthcare",
				"education",
			],
		},
		CORPORATION_TAX: {
			STANDARD_RATE: 0.25,
			SMALL_BUSINESS_RATE: 0.25, // Same as standard in Guyana
			MANUFACTURING_RATE: 0.25,
		},
		WITHHOLDING_TAX: {
			DIVIDENDS: 0.2,
			INTEREST: 0.2,
			ROYALTIES: 0.15,
			MANAGEMENT_FEES: 0.15,
			TECHNICAL_SERVICES: 0.15,
		},
		PROPERTY_TAX: {
			RESIDENTIAL_RATE: 0.0075,
			COMMERCIAL_RATE: 0.015,
			INDUSTRIAL_RATE: 0.015,
		},
	},
	NIS: {
		CONTRIBUTION_RATES: {
			EMPLOYEE: 0.056,
			EMPLOYER: 0.072,
			SELF_EMPLOYED: 0.128,
		},
		WAGE_LIMITS: {
			MIN_WEEKLY_WAGE: 8000,
			MAX_WEEKLY_WAGE: 50000,
			MIN_MONTHLY_WAGE: 34667,
			MAX_MONTHLY_WAGE: 216667,
		},
		BENEFITS: {
			OLD_AGE_PENSION_AGE: 60,
			INVALIDITY_WAITING_PERIOD: 156, // weeks
			MATERNITY_BENEFIT_WEEKS: 13,
			FUNERAL_GRANT: 25000,
		},
	},
	DCRA: {
		REGISTRATION_FEES: {
			COMPANY_INCORPORATION: 25000,
			PARTNERSHIP: 15000,
			SOLE_PROPRIETORSHIP: 10000,
			FOREIGN_COMPANY: 50000,
		},
		ANNUAL_FEES: {
			COMPANY: 10000,
			PARTNERSHIP: 5000,
			SOLE_PROPRIETORSHIP: 3000,
		},
		AMENDMENT_FEES: {
			NAME_CHANGE: 15000,
			SHARE_CAPITAL_CHANGE: 20000,
			DIRECTOR_CHANGE: 5000,
			ADDRESS_CHANGE: 5000,
		},
	},
	COMMON: {
		PENALTY_RATES: {
			LATE_FILING: 0.05, // 5% per month
			LATE_PAYMENT: 0.02, // 2% per month
			UNDERSTATEMENT: 0.25, // 25% of understated amount
		},
		EXCHANGE_RATES: {
			USD_TO_GYD: 209.0, // Approximate rate
			EUR_TO_GYD: 225.0,
			GBP_TO_GYD: 260.0,
			CAD_TO_GYD: 155.0,
		},
	},
} as const;

export class CalculationEngine {
	private formData: FormData;
	private fields: FormField[];

	constructor(formData: FormData, fields: FormField[]) {
		this.formData = formData;
		this.fields = fields;
	}

	/**
	 * Calculate field value based on configuration
	 */
	calculateField(config: CalculationConfig): number {
		switch (config.type) {
			case "sum":
				return this.calculateSum(config);
			case "subtract":
				return this.calculateSubtraction(config);
			case "multiply":
				return this.calculateMultiplication(config);
			case "divide":
				return this.calculateDivision(config);
			case "percentage":
				return this.calculatePercentage(config);
			case "compound":
				return this.calculateCompound(config);
			case "vat_calculation":
				return this.calculateVAT(config);
			case "nis_calculation":
				return this.calculateNIS(config);
			case "withholding_tax":
				return this.calculateWithholdingTax(config);
			case "penalty_calculation":
				return this.calculatePenalty(config);
			case "fee_calculation":
				return this.calculateFees(config);
			case "currency_conversion":
				return this.calculateCurrencyConversion(config);
			case "custom_formula":
				return this.calculateCustomFormula(config);
			default:
				throw new Error(`Unsupported calculation type: ${config.type}`);
		}
	}

	private calculateSum(config: CalculationConfig): number {
		const { fields } = config.parameters as { fields: string[] };
		return fields.reduce((sum, fieldName) => {
			const value = this.getFieldValue(fieldName);
			return sum + (typeof value === "number" ? value : 0);
		}, 0);
	}

	private calculateSubtraction(config: CalculationConfig): number {
		const { minuend, subtrahends } = config.parameters as {
			minuend: string;
			subtrahends: string[];
		};
		const minuendValue = this.getFieldValue(minuend);
		const subtraction = subtrahends.reduce((sum, fieldName) => {
			const value = this.getFieldValue(fieldName);
			return sum + (typeof value === "number" ? value : 0);
		}, 0);
		return (typeof minuendValue === "number" ? minuendValue : 0) - subtraction;
	}

	private calculateMultiplication(config: CalculationConfig): number {
		const { fields } = config.parameters as { fields: string[] };
		return fields.reduce((product, fieldName) => {
			const value = this.getFieldValue(fieldName);
			return product * (typeof value === "number" ? value : 1);
		}, 1);
	}

	private calculateDivision(config: CalculationConfig): number {
		const { dividend, divisor } = config.parameters as {
			dividend: string;
			divisor: string;
		};
		const dividendValue = this.getFieldValue(dividend);
		const divisorValue = this.getFieldValue(divisor);

		if (typeof divisorValue !== "number" || divisorValue === 0) {
			return 0; // Avoid division by zero
		}

		return (
			(typeof dividendValue === "number" ? dividendValue : 0) / divisorValue
		);
	}

	private calculatePercentage(config: CalculationConfig): number {
		const { value, percentage } = config.parameters as {
			value: string;
			percentage: number;
		};
		const baseValue = this.getFieldValue(value);
		return (typeof baseValue === "number" ? baseValue : 0) * (percentage / 100);
	}

	private calculateCompound(config: CalculationConfig): number {
		const {
			principal,
			rate,
			time,
			frequency = 1,
		} = config.parameters as {
			principal: string;
			rate: number;
			time: number;
			frequency?: number;
		};

		const principalValue = this.getFieldValue(principal);
		if (typeof principalValue !== "number") return 0;

		return principalValue * (1 + rate / frequency) ** (frequency * time);
	}

	/**
	 * Calculate VAT based on Guyanese rates
	 */
	private calculateVAT(config: CalculationConfig): number {
		const guyaneseCalc = config.guyaneseCalculation;
		if (!guyaneseCalc || guyaneseCalc.authority !== "GRA") {
			throw new Error("VAT calculation requires GRA authority configuration");
		}

		const {
			baseAmount,
			vatType,
			isInclusive = false,
		} = config.parameters as {
			baseAmount: string;
			vatType?: string;
			isInclusive?: boolean;
		};

		const baseValue = this.getFieldValue(baseAmount);
		if (typeof baseValue !== "number" || baseValue <= 0) return 0;

		// Check if item is VAT exempt or zero-rated
		if (
			vatType &&
			(TAX_CONSTANTS.GRA.VAT.ZERO_RATED_ITEMS.includes(vatType) ||
				TAX_CONSTANTS.GRA.VAT.EXEMPT_SERVICES.includes(vatType))
		) {
			return 0;
		}

		const vatRate = TAX_CONSTANTS.GRA.VAT.STANDARD_RATE;

		if (isInclusive) {
			// VAT = (Amount × VAT Rate) ÷ (1 + VAT Rate)
			return (baseValue * vatRate) / (1 + vatRate);
		}
		// VAT = Amount × VAT Rate
		return baseValue * vatRate;
	}

	/**
	 * Calculate NIS contributions
	 */
	private calculateNIS(config: CalculationConfig): number {
		const guyaneseCalc = config.guyaneseCalculation;
		if (!guyaneseCalc || guyaneseCalc.authority !== "NIS") {
			throw new Error("NIS calculation requires NIS authority configuration");
		}

		const {
			salary,
			contributionType,
			period = "monthly",
		} = config.parameters as {
			salary: string;
			contributionType: "employee" | "employer" | "self_employed";
			period?: "weekly" | "monthly";
		};

		const salaryValue = this.getFieldValue(salary);
		if (typeof salaryValue !== "number" || salaryValue <= 0) return 0;

		// Get contribution rate
		let rate: number;
		let minWage: number;
		let maxWage: number;

		if (period === "weekly") {
			minWage = TAX_CONSTANTS.NIS.WAGE_LIMITS.MIN_WEEKLY_WAGE;
			maxWage = TAX_CONSTANTS.NIS.WAGE_LIMITS.MAX_WEEKLY_WAGE;
		} else {
			minWage = TAX_CONSTANTS.NIS.WAGE_LIMITS.MIN_MONTHLY_WAGE;
			maxWage = TAX_CONSTANTS.NIS.WAGE_LIMITS.MAX_MONTHLY_WAGE;
		}

		switch (contributionType) {
			case "employee":
				rate = TAX_CONSTANTS.NIS.CONTRIBUTION_RATES.EMPLOYEE;
				break;
			case "employer":
				rate = TAX_CONSTANTS.NIS.CONTRIBUTION_RATES.EMPLOYER;
				break;
			case "self_employed":
				rate = TAX_CONSTANTS.NIS.CONTRIBUTION_RATES.SELF_EMPLOYED;
				break;
			default:
				throw new Error(`Invalid contribution type: ${contributionType}`);
		}

		// Apply wage limits
		const contributableSalary = Math.min(
			Math.max(salaryValue, minWage),
			maxWage,
		);

		return contributableSalary * rate;
	}

	/**
	 * Calculate withholding tax
	 */
	private calculateWithholdingTax(config: CalculationConfig): number {
		const guyaneseCalc = config.guyaneseCalculation;
		if (!guyaneseCalc || guyaneseCalc.authority !== "GRA") {
			throw new Error(
				"Withholding tax calculation requires GRA authority configuration",
			);
		}

		const { amount, incomeType } = config.parameters as {
			amount: string;
			incomeType:
				| "dividends"
				| "interest"
				| "royalties"
				| "management_fees"
				| "technical_services";
		};

		const amountValue = this.getFieldValue(amount);
		if (typeof amountValue !== "number" || amountValue <= 0) return 0;

		let rate: number;
		switch (incomeType) {
			case "dividends":
				rate = TAX_CONSTANTS.GRA.WITHHOLDING_TAX.DIVIDENDS;
				break;
			case "interest":
				rate = TAX_CONSTANTS.GRA.WITHHOLDING_TAX.INTEREST;
				break;
			case "royalties":
				rate = TAX_CONSTANTS.GRA.WITHHOLDING_TAX.ROYALTIES;
				break;
			case "management_fees":
				rate = TAX_CONSTANTS.GRA.WITHHOLDING_TAX.MANAGEMENT_FEES;
				break;
			case "technical_services":
				rate = TAX_CONSTANTS.GRA.WITHHOLDING_TAX.TECHNICAL_SERVICES;
				break;
			default:
				throw new Error(`Invalid income type: ${incomeType}`);
		}

		return amountValue * rate;
	}

	/**
	 * Calculate penalties for late filing/payment
	 */
	private calculatePenalty(config: CalculationConfig): number {
		const { baseAmount, penaltyType, daysLate } = config.parameters as {
			baseAmount: string;
			penaltyType: "late_filing" | "late_payment" | "understatement";
			daysLate?: number;
		};

		const baseValue = this.getFieldValue(baseAmount);
		if (typeof baseValue !== "number" || baseValue <= 0) return 0;

		switch (penaltyType) {
			case "late_filing": {
				if (!daysLate) return 0;
				const monthsLate = Math.ceil(daysLate / 30);
				return (
					baseValue *
					TAX_CONSTANTS.COMMON.PENALTY_RATES.LATE_FILING *
					monthsLate
				);
			}

			case "late_payment": {
				if (!daysLate) return 0;
				const paymentMonthsLate = Math.ceil(daysLate / 30);
				return (
					baseValue *
					TAX_CONSTANTS.COMMON.PENALTY_RATES.LATE_PAYMENT *
					paymentMonthsLate
				);
			}

			case "understatement":
				return baseValue * TAX_CONSTANTS.COMMON.PENALTY_RATES.UNDERSTATEMENT;

			default:
				return 0;
		}
	}

	/**
	 * Calculate registration and filing fees
	 */
	private calculateFees(config: CalculationConfig): number {
		const guyaneseCalc = config.guyaneseCalculation;
		if (!guyaneseCalc || guyaneseCalc.authority !== "DCRA") {
			throw new Error("Fee calculation requires DCRA authority configuration");
		}

		const { feeType, entityType } = config.parameters as {
			feeType: "registration" | "annual" | "amendment";
			entityType?:
				| "company"
				| "partnership"
				| "sole_proprietorship"
				| "foreign_company";
		};

		switch (feeType) {
			case "registration":
				switch (entityType) {
					case "company":
						return TAX_CONSTANTS.DCRA.REGISTRATION_FEES.COMPANY_INCORPORATION;
					case "partnership":
						return TAX_CONSTANTS.DCRA.REGISTRATION_FEES.PARTNERSHIP;
					case "sole_proprietorship":
						return TAX_CONSTANTS.DCRA.REGISTRATION_FEES.SOLE_PROPRIETORSHIP;
					case "foreign_company":
						return TAX_CONSTANTS.DCRA.REGISTRATION_FEES.FOREIGN_COMPANY;
					default:
						return 0;
				}

			case "annual":
				switch (entityType) {
					case "company":
						return TAX_CONSTANTS.DCRA.ANNUAL_FEES.COMPANY;
					case "partnership":
						return TAX_CONSTANTS.DCRA.ANNUAL_FEES.PARTNERSHIP;
					case "sole_proprietorship":
						return TAX_CONSTANTS.DCRA.ANNUAL_FEES.SOLE_PROPRIETORSHIP;
					default:
						return 0;
				}

			default:
				return 0;
		}
	}

	/**
	 * Calculate currency conversion
	 */
	private calculateCurrencyConversion(config: CalculationConfig): number {
		const { amount, fromCurrency, toCurrency } = config.parameters as {
			amount: string;
			fromCurrency: "USD" | "EUR" | "GBP" | "CAD" | "GYD";
			toCurrency: "USD" | "EUR" | "GBP" | "CAD" | "GYD";
		};

		const amountValue = this.getFieldValue(amount);
		if (typeof amountValue !== "number" || amountValue <= 0) return 0;

		if (fromCurrency === toCurrency) return amountValue;

		// Convert to GYD first, then to target currency
		let gydAmount: number;

		switch (fromCurrency) {
			case "GYD":
				gydAmount = amountValue;
				break;
			case "USD":
				gydAmount =
					amountValue * TAX_CONSTANTS.COMMON.EXCHANGE_RATES.USD_TO_GYD;
				break;
			case "EUR":
				gydAmount =
					amountValue * TAX_CONSTANTS.COMMON.EXCHANGE_RATES.EUR_TO_GYD;
				break;
			case "GBP":
				gydAmount =
					amountValue * TAX_CONSTANTS.COMMON.EXCHANGE_RATES.GBP_TO_GYD;
				break;
			case "CAD":
				gydAmount =
					amountValue * TAX_CONSTANTS.COMMON.EXCHANGE_RATES.CAD_TO_GYD;
				break;
			default:
				return 0;
		}

		switch (toCurrency) {
			case "GYD":
				return gydAmount;
			case "USD":
				return gydAmount / TAX_CONSTANTS.COMMON.EXCHANGE_RATES.USD_TO_GYD;
			case "EUR":
				return gydAmount / TAX_CONSTANTS.COMMON.EXCHANGE_RATES.EUR_TO_GYD;
			case "GBP":
				return gydAmount / TAX_CONSTANTS.COMMON.EXCHANGE_RATES.GBP_TO_GYD;
			case "CAD":
				return gydAmount / TAX_CONSTANTS.COMMON.EXCHANGE_RATES.CAD_TO_GYD;
			default:
				return 0;
		}
	}

	/**
	 * Execute custom JavaScript formula
	 */
	private calculateCustomFormula(config: CalculationConfig): number {
		const { formula } = config.parameters as { formula: string };

		try {
			// Create a safe context for formula execution
			const context = this.createFormulaContext();

			// Use Function constructor for safer evaluation than eval
			const func = new Function(...Object.keys(context), `return ${formula}`);
			const result = func(...Object.values(context));

			return typeof result === "number" ? result : 0;
		} catch (error) {
			console.error("Error executing custom formula:", error);
			return 0;
		}
	}

	/**
	 * Create safe context for formula execution
	 */
	private createFormulaContext(): Record<string, unknown> {
		const context: Record<string, unknown> = {};

		// Add all field values to context
		this.fields.forEach((field) => {
			const value = this.getFieldValue(field.name);
			context[field.name] = typeof value === "number" ? value : 0;
		});

		// Add utility functions
		context.Math = Math;
		context.sum = (...values: number[]) => values.reduce((a, b) => a + b, 0);
		context.avg = (...values: number[]) =>
			values.reduce((a, b) => a + b, 0) / values.length;
		context.min = Math.min;
		context.max = Math.max;
		context.round = (value: number, decimals = 2) =>
			Math.round(value * 10 ** decimals) / 10 ** decimals;

		// Add tax constants
		context.TAX_CONSTANTS = TAX_CONSTANTS;

		return context;
	}

	private getFieldValue(fieldName: string): unknown {
		return this.formData.values?.[fieldName];
	}

	/**
	 * Calculate income tax based on Guyanese tax brackets
	 */
	static calculateIncomeTax(annualIncome: number): {
		totalTax: number;
		effectiveRate: number;
		marginalRate: number;
		breakdown: Array<{
			bracket: string;
			taxableAmount: number;
			rate: number;
			tax: number;
		}>;
	} {
		const brackets = TAX_CONSTANTS.GRA.INCOME_TAX.BRACKETS;
		let totalTax = 0;
		const breakdown: Array<{
			bracket: string;
			taxableAmount: number;
			rate: number;
			tax: number;
		}> = [];

		let remainingIncome = annualIncome;

		for (const bracket of brackets) {
			if (remainingIncome <= 0) break;

			const taxableInThisBracket = Math.min(
				remainingIncome,
				bracket.max === Number.POSITIVE_INFINITY
					? remainingIncome
					: bracket.max - bracket.min,
			);

			const taxInThisBracket = taxableInThisBracket * bracket.rate;
			totalTax += taxInThisBracket;

			breakdown.push({
				bracket: `${bracket.min.toLocaleString()} - ${bracket.max === Number.POSITIVE_INFINITY ? "∞" : bracket.max.toLocaleString()}`,
				taxableAmount: taxableInThisBracket,
				rate: bracket.rate,
				tax: taxInThisBracket,
			});

			remainingIncome -= taxableInThisBracket;
		}

		const effectiveRate = annualIncome > 0 ? totalTax / annualIncome : 0;
		const marginalRate =
			brackets.find((b) => annualIncome > b.min && annualIncome <= b.max)
				?.rate || 0;

		return {
			totalTax,
			effectiveRate,
			marginalRate,
			breakdown,
		};
	}
}

/**
 * Create calculation engine instance
 */
export const createCalculationEngine = (
	formData: FormData,
	fields: FormField[],
): CalculationEngine => {
	return new CalculationEngine(formData, fields);
};
