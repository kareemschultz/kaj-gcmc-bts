"use client";

/**
 * Form Field Renderer
 * Renders individual form fields based on their type and configuration
 */

import { format } from "date-fns";
import { Calculator, Calendar, Eye, EyeOff, Upload, X } from "lucide-react";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import type { FormField, FormFieldOption } from "@/lib/form-builder/types";

interface FormFieldRendererProps {
	field: FormField;
	value: unknown;
	onChange: (value: unknown) => void;
	error?: string;
	readonly?: boolean;
	calculatedValues?: Record<string, unknown>;
	allValues?: Record<string, unknown>;
	className?: string;
}

export function FormFieldRenderer({
	field,
	value,
	onChange,
	error,
	readonly = false,
	calculatedValues = {},
	allValues = {},
	className = "",
}: FormFieldRendererProps) {
	const [showPassword, setShowPassword] = useState(false);
	const [isDragOver, setIsDragOver] = useState(false);

	// Format value for display
	const formatValue = useCallback(
		(val: unknown, fieldType: string): string => {
			if (val === null || val === undefined) return "";

			switch (fieldType) {
				case "currency": {
					const currencyField = field as any;
					const currency = currencyField.currency || "GYD";
					return new Intl.NumberFormat("en-GY", {
						style: "currency",
						currency: currency,
						minimumFractionDigits: 2,
					}).format(Number(val) || 0);
				}

				case "percentage":
					return `${Number(val) || 0}%`;

				case "number": {
					const numberField = field as any;
					return new Intl.NumberFormat("en-GY", {
						minimumFractionDigits: numberField.precision || 0,
						maximumFractionDigits: numberField.precision || 2,
					}).format(Number(val) || 0);
				}

				case "date":
					return val ? format(new Date(val as string), "PPP") : "";

				case "datetime":
					return val ? format(new Date(val as string), "PPP p") : "";

				case "time":
					return val ? format(new Date(val as string), "p") : "";

				default:
					return String(val);
			}
		},
		[field],
	);

	// Handle file upload
	const handleFileUpload = useCallback(
		(files: FileList | null) => {
			if (!files) return;

			const fileField = field as any;
			const maxFiles = fileField.maxFiles || 1;
			const maxSize = fileField.maxSize || 10 * 1024 * 1024; // 10MB default
			const allowedTypes = fileField.allowedTypes || [];

			const validFiles: File[] = [];
			const errors: string[] = [];

			Array.from(files)
				.slice(0, maxFiles)
				.forEach((file) => {
					// Check file size
					if (file.size > maxSize) {
						errors.push(
							`${file.name} is too large (max ${maxSize / 1024 / 1024}MB)`,
						);
						return;
					}

					// Check file type
					if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
						errors.push(`${file.name} is not an allowed file type`);
						return;
					}

					validFiles.push(file);
				});

			if (errors.length > 0) {
				// Handle errors (would typically show toast or alert)
				console.error("File upload errors:", errors);
			}

			onChange(validFiles);
		},
		[field, onChange],
	);

	// Handle drag and drop
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragOver(false);
			handleFileUpload(e.dataTransfer.files);
		},
		[handleFileUpload],
	);

	// Check if field should be visible based on conditions
	const isVisible = useMemo(() => {
		if (!field.conditions) return !field.hidden;

		return field.conditions.every((condition) => {
			const conditionValue = allValues?.[condition.field];

			switch (condition.operator) {
				case "equals":
					return conditionValue === condition.value;
				case "not_equals":
					return conditionValue !== condition.value;
				case "contains":
					return String(conditionValue || "").includes(String(condition.value));
				case "not_contains":
					return !String(conditionValue || "").includes(
						String(condition.value),
					);
				case "greater_than":
					return Number(conditionValue) > Number(condition.value);
				case "less_than":
					return Number(conditionValue) < Number(condition.value);
				case "empty":
					return !conditionValue || conditionValue === "";
				case "not_empty":
					return !!(conditionValue && conditionValue !== "");
				default:
					return true;
			}
		});
	}, [field.conditions, field.hidden, allValues]);

	if (!isVisible) return null;

	// Common props for all input fields
	const commonProps = {
		id: field.id,
		disabled: readonly || field.disabled,
		readOnly: field.readOnly,
		placeholder: field.placeholder,
		className: `${error ? "border-red-500" : ""} ${field.className || ""}`,
	};

	// Render field based on type
	const renderField = () => {
		switch (field.type) {
			case "text":
			case "email":
			case "url":
			case "tax_id":
			case "business_reg":
			case "nis_number":
			case "passport":
			case "id_card":
				return (
					<Input
						{...commonProps}
						type={
							field.type === "email"
								? "email"
								: field.type === "url"
									? "url"
									: "text"
						}
						value={String(value || "")}
						onChange={(e) => onChange(e.target.value)}
						maxLength={(field as any).maxLength}
					/>
				);

			case "password":
				return (
					<div className="relative">
						<Input
							{...commonProps}
							type={showPassword ? "text" : "password"}
							value={String(value || "")}
							onChange={(e) => onChange(e.target.value)}
						/>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="-translate-y-1/2 absolute top-1/2 right-2 h-8 w-8 p-0"
							onClick={() => setShowPassword(!showPassword)}
						>
							{showPassword ? (
								<EyeOff className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
						</Button>
					</div>
				);

			case "phone":
				return (
					<Input
						{...commonProps}
						type="tel"
						value={String(value || "")}
						onChange={(e) => onChange(e.target.value)}
						placeholder={field.placeholder || "+592 XXX XXXX"}
					/>
				);

			case "textarea":
				return (
					<Textarea
						{...commonProps}
						value={String(value || "")}
						onChange={(e) => onChange(e.target.value)}
						rows={(field as any).rows || 3}
						maxLength={(field as any).maxLength}
					/>
				);

			case "number": {
				const numberField = field as any;
				return (
					<Input
						{...commonProps}
						type="number"
						value={value || ""}
						onChange={(e) =>
							onChange(e.target.value ? Number(e.target.value) : null)
						}
						min={numberField.min}
						max={numberField.max}
						step={numberField.step || 1}
					/>
				);
			}

			case "currency": {
				const currencyField = field as any;
				return (
					<div className="relative">
						<span className="-translate-y-1/2 absolute top-1/2 left-3 text-gray-500">
							{currencyField.currency === "USD"
								? "$"
								: currencyField.currency === "EUR"
									? "€"
									: currencyField.currency === "GBP"
										? "£"
										: "GY$"}
						</span>
						<Input
							{...commonProps}
							type="number"
							className={`pl-12 ${commonProps.className}`}
							value={value || ""}
							onChange={(e) =>
								onChange(e.target.value ? Number(e.target.value) : null)
							}
							min={currencyField.min || 0}
							max={currencyField.max}
							step={currencyField.step || 0.01}
						/>
					</div>
				);
			}

			case "percentage": {
				const percentageField = field as any;
				return (
					<div className="relative">
						<Input
							{...commonProps}
							type="number"
							value={value || ""}
							onChange={(e) =>
								onChange(e.target.value ? Number(e.target.value) : null)
							}
							min={percentageField.min || 0}
							max={percentageField.max || 100}
							step={percentageField.step || 1}
						/>
						<span className="-translate-y-1/2 absolute top-1/2 right-3 text-gray-500">
							%
						</span>
					</div>
				);
			}

			case "select": {
				const selectField = field as any;
				return (
					<Select
						value={String(value || "")}
						onValueChange={onChange}
						disabled={commonProps.disabled}
					>
						<SelectTrigger className={commonProps.className}>
							<SelectValue
								placeholder={field.placeholder || "Select an option"}
							/>
						</SelectTrigger>
						<SelectContent>
							{selectField.options?.map((option: FormFieldOption) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				);
			}

			case "multiselect": {
				const multiSelectField = field as any;
				const selectedValues = Array.isArray(value) ? value : [];

				return (
					<div className="space-y-2">
						{multiSelectField.options?.map((option: FormFieldOption) => (
							<div key={option.value} className="flex items-center space-x-2">
								<Checkbox
									id={`${field.id}-${option.value}`}
									checked={selectedValues.includes(option.value)}
									onCheckedChange={(checked) => {
										const newValues = checked
											? [...selectedValues, option.value]
											: selectedValues.filter((v) => v !== option.value);
										onChange(newValues);
									}}
									disabled={commonProps.disabled}
								/>
								<Label
									htmlFor={`${field.id}-${option.value}`}
									className="text-sm"
								>
									{option.label}
								</Label>
							</div>
						))}
					</div>
				);
			}

			case "radio": {
				const radioField = field as any;
				return (
					<div className="space-y-2">
						{radioField.options?.map((option: FormFieldOption) => (
							<div key={option.value} className="flex items-center space-x-2">
								<input
									type="radio"
									id={`${field.id}-${option.value}`}
									name={field.name}
									value={option.value}
									checked={value === option.value}
									onChange={(e) => onChange(e.target.value)}
									disabled={commonProps.disabled}
									className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
								/>
								<Label
									htmlFor={`${field.id}-${option.value}`}
									className="text-sm"
								>
									{option.label}
								</Label>
							</div>
						))}
					</div>
				);
			}

			case "checkbox":
				return (
					<div className="flex items-center space-x-2">
						<Checkbox
							id={field.id}
							checked={Boolean(value)}
							onCheckedChange={onChange}
							disabled={commonProps.disabled}
						/>
						<Label htmlFor={field.id} className="text-sm">
							{field.label}
						</Label>
					</div>
				);

			case "checkboxGroup": {
				const checkboxField = field as any;
				const checkedValues = Array.isArray(value) ? value : [];

				return (
					<div className="space-y-2">
						{checkboxField.options?.map((option: FormFieldOption) => (
							<div key={option.value} className="flex items-center space-x-2">
								<Checkbox
									id={`${field.id}-${option.value}`}
									checked={checkedValues.includes(option.value)}
									onCheckedChange={(checked) => {
										const newValues = checked
											? [...checkedValues, option.value]
											: checkedValues.filter((v) => v !== option.value);
										onChange(newValues);
									}}
									disabled={commonProps.disabled}
								/>
								<Label
									htmlFor={`${field.id}-${option.value}`}
									className="text-sm"
								>
									{option.label}
								</Label>
							</div>
						))}
					</div>
				);
			}

			case "date":
			case "datetime":
			case "time": {
				const dateField = field as any;
				return (
					<div className="relative">
						<Input
							{...commonProps}
							type={field.type === "datetime" ? "datetime-local" : field.type}
							value={
								value
									? field.type === "date"
										? String(value).split("T")[0]
										: String(value)
									: ""
							}
							onChange={(e) => onChange(e.target.value)}
							min={dateField.minDate}
							max={dateField.maxDate}
						/>
						<Calendar className="-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 text-gray-400" />
					</div>
				);
			}

			case "file":
			case "image": {
				const fileField = field as any;
				const files = Array.isArray(value) ? value : [];

				return (
					<div className="space-y-4">
						{/* Upload area */}
						<div
							className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
								isDragOver
									? "border-blue-400 bg-blue-50"
									: "border-gray-300 hover:border-gray-400"
							} ${readonly ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
							onClick={() => {
								if (!readonly) {
									const input = document.createElement("input");
									input.type = "file";
									input.multiple = (fileField.maxFiles || 1) > 1;
									input.accept = fileField.accept?.join(",") || "";
									input.onchange = () => handleFileUpload(input.files);
									input.click();
								}
							}}
						>
							<Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
							<p className="font-medium text-gray-900 text-lg">
								Drop files here or click to upload
							</p>
							<p className="text-gray-500 text-sm">
								{fileField.maxFiles > 1
									? `Up to ${fileField.maxFiles} files`
									: "Single file"}
								{fileField.maxSize &&
									` (max ${Math.round(fileField.maxSize / 1024 / 1024)}MB each)`}
							</p>
						</div>

						{/* Uploaded files */}
						{files.length > 0 && (
							<div className="space-y-2">
								{files.map((file: File, index: number) => (
									<div
										key={index}
										className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
									>
										<div className="flex items-center space-x-3">
											<div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100">
												<span className="font-medium text-blue-600 text-xs">
													{file.name.split(".").pop()?.toUpperCase()}
												</span>
											</div>
											<div>
												<p className="font-medium text-gray-900 text-sm">
													{file.name}
												</p>
												<p className="text-gray-500 text-xs">
													{(file.size / 1024 / 1024).toFixed(2)} MB
												</p>
											</div>
										</div>
										{!readonly && (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => {
													const newFiles = files.filter((_, i) => i !== index);
													onChange(newFiles);
												}}
											>
												<X className="h-4 w-4" />
											</Button>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				);
			}

			case "calculated": {
				const calculatedField = field as any;
				const calculatedValue = calculatedValues[field.name] || value || 0;
				const displayValue = formatValue(
					calculatedValue,
					calculatedField.displayAs || "number",
				);

				return (
					<div className="space-y-2">
						<div className="flex items-center space-x-2 rounded-lg bg-blue-50 p-3">
							<Calculator className="h-5 w-5 text-blue-600" />
							<span className="font-medium text-blue-900">{displayValue}</span>
							{calculatedField.showCalculationSteps && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="text-blue-600 hover:text-blue-700"
								>
									Show calculation
								</Button>
							)}
						</div>
						{calculatedField.showCalculationSteps && (
							<Alert>
								<AlertDescription>
									Calculation details would be shown here...
								</AlertDescription>
							</Alert>
						)}
					</div>
				);
			}

			case "section":
				return (
					<div className="space-y-4">
						<div className="border-gray-200 border-b pb-2">
							<h3 className="font-semibold text-gray-900 text-lg">
								{field.label}
							</h3>
							{field.description && (
								<p className="mt-1 text-gray-600 text-sm">
									{field.description}
								</p>
							)}
						</div>
					</div>
				);

			case "divider":
				return <hr className="my-6 border-gray-200" />;

			default:
				return (
					<div className="rounded-lg bg-gray-50 p-4">
						<p className="text-gray-500 text-sm">
							Unknown field type: {field.type}
						</p>
					</div>
				);
		}
	};

	return (
		<div
			className={`space-y-2 ${field.width === "half" ? "w-1/2" : field.width === "third" ? "w-1/3" : field.width === "quarter" ? "w-1/4" : "w-full"} ${className}`}
		>
			{/* Field label and description */}
			{field.type !== "section" &&
				field.type !== "divider" &&
				field.type !== "checkbox" && (
					<div className="space-y-1">
						<Label
							htmlFor={field.id}
							className="font-medium text-gray-700 text-sm"
						>
							{field.label}
							{field.required && <span className="ml-1 text-red-500">*</span>}
						</Label>
						{field.description && (
							<p className="text-gray-500 text-xs">{field.description}</p>
						)}
					</div>
				)}

			{/* Field input */}
			{renderField()}

			{/* Help text */}
			{field.helpText && (
				<p className="text-gray-500 text-xs">{field.helpText}</p>
			)}

			{/* Error message */}
			{error && <p className="text-red-600 text-xs">{error}</p>}

			{/* Calculated field dependencies */}
			{field.type === "calculated" && field.dependsOn && (
				<p className="text-gray-400 text-xs">
					Calculated from: {field.dependsOn.join(", ")}
				</p>
			)}
		</div>
	);
}

export default FormFieldRenderer;
