"use client";

import {
	Calculator,
	CheckCircle,
	DollarSign,
	FileText,
	Info,
	Plus,
	Trash2,
	Users,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Form configuration types
interface FormField {
	id: string;
	label: string;
	type:
		| "text"
		| "number"
		| "select"
		| "checkbox"
		| "textarea"
		| "date"
		| "currency";
	required?: boolean;
	options?: Array<{ value: string; label: string }>;
	placeholder?: string;
	description?: string;
	validation?: z.ZodSchema<any>;
	dependsOn?: {
		field: string;
		value: string | boolean;
		condition?: "equals" | "not_equals" | "greater_than" | "less_than";
	};
	calculation?: {
		formula: string;
		dependencies: string[];
	};
}

interface FormSection {
	id: string;
	title: string;
	description?: string;
	icon?: React.ReactNode;
	fields: FormField[];
	repeatable?: boolean;
	conditionalOn?: {
		field: string;
		value: string | boolean;
	};
}

interface FormTemplate {
	id: string;
	title: string;
	description: string;
	category: "individual" | "company" | "partnership";
	sections: FormSection[];
}

// Tax form templates
const individualTaxFormTemplate: FormTemplate = {
	id: "individual_tax_return",
	title: "Individual Income Tax Return",
	description: "Annual income tax return for individual taxpayers",
	category: "individual",
	sections: [
		{
			id: "personal_info",
			title: "Personal Information",
			icon: <Users className="h-5 w-5" />,
			fields: [
				{
					id: "full_name",
					label: "Full Name",
					type: "text",
					required: true,
					placeholder: "Enter your full legal name",
				},
				{
					id: "tin_number",
					label: "TIN Number",
					type: "text",
					required: true,
					placeholder: "TIN123456789",
				},
				{
					id: "address",
					label: "Address",
					type: "textarea",
					required: true,
					placeholder: "Enter your full address",
				},
				{
					id: "filing_status",
					label: "Filing Status",
					type: "select",
					required: true,
					options: [
						{ value: "single", label: "Single" },
						{ value: "married_joint", label: "Married Filing Jointly" },
						{ value: "married_separate", label: "Married Filing Separately" },
						{ value: "head_of_household", label: "Head of Household" },
					],
				},
				{
					id: "spouse_name",
					label: "Spouse Name",
					type: "text",
					placeholder: "Enter spouse's full name",
					dependsOn: {
						field: "filing_status",
						value: "married_joint",
					},
				},
				{
					id: "spouse_tin",
					label: "Spouse TIN",
					type: "text",
					placeholder: "Spouse's TIN number",
					dependsOn: {
						field: "filing_status",
						value: "married_joint",
					},
				},
			],
		},
		{
			id: "income_sources",
			title: "Income Sources",
			description: "Report all sources of income for the tax year",
			icon: <DollarSign className="h-5 w-5" />,
			fields: [
				{
					id: "employment_income",
					label: "Employment Income",
					type: "currency",
					placeholder: "0.00",
					description: "Salary, wages, bonuses, and other employment income",
				},
				{
					id: "business_income",
					label: "Business Income",
					type: "currency",
					placeholder: "0.00",
					description: "Income from self-employment or business activities",
				},
				{
					id: "rental_income",
					label: "Rental Income",
					type: "currency",
					placeholder: "0.00",
					description: "Income from rental properties",
				},
				{
					id: "investment_income",
					label: "Investment Income",
					type: "currency",
					placeholder: "0.00",
					description: "Dividends, interest, capital gains",
				},
				{
					id: "other_income",
					label: "Other Income",
					type: "currency",
					placeholder: "0.00",
					description: "Any other taxable income",
				},
				{
					id: "total_income",
					label: "Total Income",
					type: "currency",
					calculation: {
						formula:
							"employment_income + business_income + rental_income + investment_income + other_income",
						dependencies: [
							"employment_income",
							"business_income",
							"rental_income",
							"investment_income",
							"other_income",
						],
					},
				},
			],
		},
		{
			id: "deductions",
			title: "Deductions and Allowances",
			description: "Claim applicable deductions to reduce taxable income",
			icon: <Calculator className="h-5 w-5" />,
			fields: [
				{
					id: "personal_allowance",
					label: "Personal Allowance",
					type: "currency",
					placeholder: "0.00",
					description: "Standard personal allowance for the tax year",
				},
				{
					id: "spouse_allowance",
					label: "Spouse Allowance",
					type: "currency",
					placeholder: "0.00",
					dependsOn: {
						field: "filing_status",
						value: "married_joint",
					},
				},
				{
					id: "medical_expenses",
					label: "Medical Expenses",
					type: "currency",
					placeholder: "0.00",
					description: "Qualifying medical and dental expenses",
				},
				{
					id: "education_expenses",
					label: "Education Expenses",
					type: "currency",
					placeholder: "0.00",
					description: "Tuition and education-related expenses",
				},
				{
					id: "charitable_donations",
					label: "Charitable Donations",
					type: "currency",
					placeholder: "0.00",
					description: "Donations to registered charities",
				},
				{
					id: "mortgage_interest",
					label: "Mortgage Interest",
					type: "currency",
					placeholder: "0.00",
					description: "Interest paid on qualifying home loans",
				},
				{
					id: "total_deductions",
					label: "Total Deductions",
					type: "currency",
					calculation: {
						formula:
							"personal_allowance + spouse_allowance + medical_expenses + education_expenses + charitable_donations + mortgage_interest",
						dependencies: [
							"personal_allowance",
							"spouse_allowance",
							"medical_expenses",
							"education_expenses",
							"charitable_donations",
							"mortgage_interest",
						],
					},
				},
			],
		},
		{
			id: "tax_calculation",
			title: "Tax Calculation",
			description: "Calculate your tax liability",
			icon: <FileText className="h-5 w-5" />,
			fields: [
				{
					id: "taxable_income",
					label: "Taxable Income",
					type: "currency",
					calculation: {
						formula: "max(0, total_income - total_deductions)",
						dependencies: ["total_income", "total_deductions"],
					},
				},
				{
					id: "tax_due",
					label: "Tax Due",
					type: "currency",
					calculation: {
						formula: "calculateTax(taxable_income)",
						dependencies: ["taxable_income"],
					},
				},
				{
					id: "taxes_paid",
					label: "Taxes Already Paid",
					type: "currency",
					placeholder: "0.00",
					description: "PAYE and other taxes already paid during the year",
				},
				{
					id: "refund_due",
					label: "Refund Due / Additional Tax",
					type: "currency",
					calculation: {
						formula: "taxes_paid - tax_due",
						dependencies: ["taxes_paid", "tax_due"],
					},
				},
			],
		},
	],
};

const companyTaxFormTemplate: FormTemplate = {
	id: "company_tax_return",
	title: "Company Income Tax Return",
	description: "Annual income tax return for companies",
	category: "company",
	sections: [
		{
			id: "company_info",
			title: "Company Information",
			icon: <Users className="h-5 w-5" />,
			fields: [
				{
					id: "company_name",
					label: "Company Name",
					type: "text",
					required: true,
					placeholder: "Enter registered company name",
				},
				{
					id: "registration_number",
					label: "Registration Number",
					type: "text",
					required: true,
					placeholder: "Company registration number",
				},
				{
					id: "tin_number",
					label: "TIN Number",
					type: "text",
					required: true,
					placeholder: "Company TIN number",
				},
				{
					id: "business_address",
					label: "Business Address",
					type: "textarea",
					required: true,
					placeholder: "Enter registered business address",
				},
				{
					id: "business_type",
					label: "Business Type",
					type: "select",
					required: true,
					options: [
						{ value: "manufacturing", label: "Manufacturing" },
						{ value: "retail", label: "Retail" },
						{ value: "services", label: "Services" },
						{ value: "technology", label: "Technology" },
						{ value: "finance", label: "Finance" },
						{ value: "other", label: "Other" },
					],
				},
			],
		},
		{
			id: "financial_info",
			title: "Financial Information",
			description: "Company financial data for the tax year",
			icon: <DollarSign className="h-5 w-5" />,
			fields: [
				{
					id: "gross_revenue",
					label: "Gross Revenue",
					type: "currency",
					required: true,
					placeholder: "0.00",
					description: "Total revenue before expenses",
				},
				{
					id: "cost_of_goods_sold",
					label: "Cost of Goods Sold",
					type: "currency",
					placeholder: "0.00",
					description: "Direct costs of producing goods/services",
				},
				{
					id: "operating_expenses",
					label: "Operating Expenses",
					type: "currency",
					placeholder: "0.00",
					description: "Salaries, rent, utilities, and other operating costs",
				},
				{
					id: "depreciation",
					label: "Depreciation",
					type: "currency",
					placeholder: "0.00",
					description: "Depreciation of assets",
				},
				{
					id: "interest_expense",
					label: "Interest Expense",
					type: "currency",
					placeholder: "0.00",
					description: "Interest paid on loans and debt",
				},
				{
					id: "other_expenses",
					label: "Other Expenses",
					type: "currency",
					placeholder: "0.00",
					description: "Other deductible business expenses",
				},
				{
					id: "total_expenses",
					label: "Total Expenses",
					type: "currency",
					calculation: {
						formula:
							"cost_of_goods_sold + operating_expenses + depreciation + interest_expense + other_expenses",
						dependencies: [
							"cost_of_goods_sold",
							"operating_expenses",
							"depreciation",
							"interest_expense",
							"other_expenses",
						],
					},
				},
				{
					id: "net_income",
					label: "Net Income Before Tax",
					type: "currency",
					calculation: {
						formula: "gross_revenue - total_expenses",
						dependencies: ["gross_revenue", "total_expenses"],
					},
				},
			],
		},
		{
			id: "tax_calculation",
			title: "Tax Calculation",
			description: "Calculate corporate tax liability",
			icon: <Calculator className="h-5 w-5" />,
			fields: [
				{
					id: "taxable_income",
					label: "Taxable Income",
					type: "currency",
					calculation: {
						formula: "max(0, net_income)",
						dependencies: ["net_income"],
					},
				},
				{
					id: "corporate_tax_rate",
					label: "Corporate Tax Rate (%)",
					type: "number",
					placeholder: "25",
					description: "Current corporate tax rate",
				},
				{
					id: "corporate_tax",
					label: "Corporate Tax Due",
					type: "currency",
					calculation: {
						formula: "(taxable_income * corporate_tax_rate) / 100",
						dependencies: ["taxable_income", "corporate_tax_rate"],
					},
				},
				{
					id: "advance_tax_paid",
					label: "Advance Tax Paid",
					type: "currency",
					placeholder: "0.00",
					description: "Advance corporate tax payments made during the year",
				},
				{
					id: "final_tax_liability",
					label: "Final Tax Liability",
					type: "currency",
					calculation: {
						formula: "corporate_tax - advance_tax_paid",
						dependencies: ["corporate_tax", "advance_tax_paid"],
					},
				},
			],
		},
	],
};

// Dynamic form component
interface DynamicTaxFormProps {
	template?: FormTemplate;
	initialData?: Record<string, any>;
	onSubmit?: (data: Record<string, any>) => void;
	onSave?: (data: Record<string, any>) => void;
	autoSave?: boolean;
	readOnly?: boolean;
}

export function DynamicTaxForm({
	template = individualTaxFormTemplate,
	initialData = {},
	onSubmit,
	onSave,
	autoSave = true,
	readOnly = false,
}: DynamicTaxFormProps) {
	const [formData, setFormData] = useState<Record<string, any>>(initialData);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [calculatedFields, setCalculatedFields] = useState<
		Record<string, number>
	>({});

	// Auto-save functionality
	useEffect(() => {
		if (autoSave && onSave && Object.keys(formData).length > 0) {
			const timeoutId = setTimeout(() => {
				onSave(formData);
			}, 2000);

			return () => clearTimeout(timeoutId);
		}
	}, [formData, autoSave, onSave]);

	// Calculate fields with formulas
	useEffect(() => {
		const newCalculatedFields: Record<string, number> = {};

		template.sections.forEach((section) => {
			section.fields.forEach((field) => {
				if (field.calculation) {
					const value = calculateFieldValue(field.calculation, formData);
					newCalculatedFields[field.id] = value;
					setFormData((prev) => ({ ...prev, [field.id]: value }));
				}
			});
		});

		setCalculatedFields(newCalculatedFields);
	}, [formData, template]);

	const calculateFieldValue = (
		calculation: { formula: string; dependencies: string[] },
		data: Record<string, any>,
	): number => {
		const { formula, dependencies } = calculation;

		// Simple calculation engine
		let result = 0;

		try {
			// Replace field references with actual values
			let expression = formula;
			dependencies.forEach((dep) => {
				const value = Number.parseFloat(data[dep]) || 0;
				expression = expression.replace(new RegExp(dep, "g"), value.toString());
			});

			// Handle special functions
			if (expression.includes("calculateTax")) {
				const taxableIncome = Number.parseFloat(data.taxable_income) || 0;
				result = calculateTaxLiability(taxableIncome);
			} else if (expression.includes("max(")) {
				// Handle max function
				const match = expression.match(/max\(([^)]+)\)/);
				if (match) {
					const args = match[1].split(",").map((arg) => eval(arg.trim()));
					result = Math.max(...args);
				}
			} else {
				// Simple arithmetic evaluation
				result = eval(expression);
			}
		} catch (error) {
			console.error("Calculation error:", error);
			result = 0;
		}

		return Math.round(result * 100) / 100; // Round to 2 decimal places
	};

	const calculateTaxLiability = (taxableIncome: number): number => {
		// Guyana tax brackets (simplified)
		if (taxableIncome <= 600000) return 0;
		if (taxableIncome <= 1200000) return (taxableIncome - 600000) * 0.2;
		if (taxableIncome <= 1800000)
			return 120000 + (taxableIncome - 1200000) * 0.25;
		return 270000 + (taxableIncome - 1800000) * 0.3;
	};

	const handleFieldChange = (fieldId: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			[fieldId]: value,
		}));

		// Clear error when field is updated
		if (errors[fieldId]) {
			setErrors((prev) => {
				const { [fieldId]: _, ...rest } = prev;
				return rest;
			});
		}
	};

	const shouldShowField = (field: FormField): boolean => {
		if (!field.dependsOn) return true;

		const {
			field: dependentField,
			value: expectedValue,
			condition = "equals",
		} = field.dependsOn;
		const actualValue = formData[dependentField];

		switch (condition) {
			case "equals":
				return actualValue === expectedValue;
			case "not_equals":
				return actualValue !== expectedValue;
			case "greater_than":
				return (
					Number.parseFloat(actualValue) >
					Number.parseFloat(expectedValue as string)
				);
			case "less_than":
				return (
					Number.parseFloat(actualValue) <
					Number.parseFloat(expectedValue as string)
				);
			default:
				return actualValue === expectedValue;
		}
	};

	const shouldShowSection = (section: FormSection): boolean => {
		if (!section.conditionalOn) return true;

		const { field, value } = section.conditionalOn;
		return formData[field] === value;
	};

	const renderField = (field: FormField) => {
		if (!shouldShowField(field)) return null;

		const isCalculated = !!field.calculation;
		const fieldValue = formData[field.id] || "";
		const hasError = !!errors[field.id];

		return (
			<div key={field.id} className="space-y-2">
				<Label htmlFor={field.id} className="flex items-center gap-2">
					{field.label}
					{field.required && <span className="text-red-500">*</span>}
					{isCalculated && (
						<span className="rounded bg-blue-100 px-2 py-1 text-blue-800 text-xs">
							Auto-calculated
						</span>
					)}
				</Label>

				{field.description && (
					<p className="flex items-start gap-2 text-gray-600 text-sm">
						<Info className="mt-0.5 h-4 w-4 text-blue-500" />
						{field.description}
					</p>
				)}

				{field.type === "text" && (
					<Input
						id={field.id}
						value={fieldValue}
						onChange={(e) => handleFieldChange(field.id, e.target.value)}
						placeholder={field.placeholder}
						disabled={isCalculated || readOnly}
						className={hasError ? "border-red-500" : ""}
					/>
				)}

				{field.type === "number" && (
					<Input
						id={field.id}
						type="number"
						value={fieldValue}
						onChange={(e) =>
							handleFieldChange(
								field.id,
								Number.parseFloat(e.target.value) || 0,
							)
						}
						placeholder={field.placeholder}
						disabled={isCalculated || readOnly}
						className={hasError ? "border-red-500" : ""}
					/>
				)}

				{field.type === "currency" && (
					<div className="relative">
						<span className="-translate-y-1/2 absolute top-1/2 left-3 transform text-gray-500">
							$
						</span>
						<Input
							id={field.id}
							type="number"
							step="0.01"
							value={fieldValue}
							onChange={(e) =>
								handleFieldChange(
									field.id,
									Number.parseFloat(e.target.value) || 0,
								)
							}
							placeholder={field.placeholder}
							disabled={isCalculated || readOnly}
							className={`pl-8 ${hasError ? "border-red-500" : ""} ${isCalculated ? "bg-gray-50 font-semibold" : ""}`}
						/>
					</div>
				)}

				{field.type === "select" && (
					<Select
						value={fieldValue}
						onValueChange={(value) => handleFieldChange(field.id, value)}
						disabled={readOnly}
					>
						<SelectTrigger className={hasError ? "border-red-500" : ""}>
							<SelectValue placeholder={field.placeholder} />
						</SelectTrigger>
						<SelectContent>
							{field.options?.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}

				{field.type === "textarea" && (
					<Textarea
						id={field.id}
						value={fieldValue}
						onChange={(e) => handleFieldChange(field.id, e.target.value)}
						placeholder={field.placeholder}
						disabled={readOnly}
						className={hasError ? "border-red-500" : ""}
						rows={3}
					/>
				)}

				{field.type === "date" && (
					<Input
						id={field.id}
						type="date"
						value={fieldValue}
						onChange={(e) => handleFieldChange(field.id, e.target.value)}
						disabled={readOnly}
						className={hasError ? "border-red-500" : ""}
					/>
				)}

				{field.type === "checkbox" && (
					<div className="flex items-center space-x-2">
						<Checkbox
							checked={fieldValue || false}
							onCheckedChange={(checked) =>
								handleFieldChange(field.id, checked)
							}
							disabled={readOnly}
						/>
						<Label>{field.label}</Label>
					</div>
				)}

				{hasError && <p className="text-red-600 text-sm">{errors[field.id]}</p>}
			</div>
		);
	};

	const handleSubmit = () => {
		if (onSubmit) {
			onSubmit(formData);
		}
	};

	return (
		<div className="mx-auto max-w-4xl space-y-8 p-6">
			<div className="text-center">
				<h1 className="font-bold text-3xl text-gray-900">{template.title}</h1>
				<p className="mt-2 text-gray-600">{template.description}</p>
				{autoSave && (
					<div className="mt-2 flex items-center justify-center gap-2 text-green-600 text-sm">
						<CheckCircle className="h-4 w-4" />
						Auto-save enabled
					</div>
				)}
			</div>

			{template.sections.map((section) => {
				if (!shouldShowSection(section)) return null;

				return (
					<Card key={section.id} className="shadow-lg">
						<CardHeader>
							<CardTitle className="flex items-center gap-3">
								{section.icon}
								<div>
									<h2 className="text-xl">{section.title}</h2>
									{section.description && (
										<p className="mt-1 font-normal text-gray-600 text-sm">
											{section.description}
										</p>
									)}
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								{section.fields.map(renderField)}
							</div>
						</CardContent>
					</Card>
				);
			})}

			{!readOnly && (
				<div className="flex justify-center space-x-4">
					<Button variant="outline" onClick={() => onSave?.(formData)}>
						Save Draft
					</Button>
					<Button onClick={handleSubmit} className="bg-blue-600 text-white">
						Submit Tax Return
					</Button>
				</div>
			)}
		</div>
	);
}

// Template selector component
interface TaxFormTemplateSelectorProps {
	onTemplateSelect: (template: FormTemplate) => void;
	selectedTemplate?: string;
}

export function TaxFormTemplateSelector({
	onTemplateSelect,
	selectedTemplate,
}: TaxFormTemplateSelectorProps) {
	const templates = [individualTaxFormTemplate, companyTaxFormTemplate];

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
			{templates.map((template) => (
				<Card
					key={template.id}
					className={`cursor-pointer transition-all hover:shadow-lg ${
						selectedTemplate === template.id ? "ring-2 ring-blue-500" : ""
					}`}
					onClick={() => onTemplateSelect(template)}
				>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-6 w-6" />
							{template.title}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="mb-4 text-gray-600">{template.description}</p>
						<div className="flex items-center gap-2">
							<span className="rounded bg-blue-100 px-2 py-1 text-blue-800 text-sm">
								{template.category}
							</span>
							<span className="text-gray-500 text-sm">
								{template.sections.length} sections
							</span>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
