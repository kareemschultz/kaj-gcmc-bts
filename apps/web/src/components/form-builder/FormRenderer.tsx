"use client";

/**
 * Dynamic Form Renderer
 * Renders forms based on configuration with real-time validation and multi-step support
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
	AlertCircle,
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	Clock,
	Eye,
	EyeOff,
	Save,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
	CalculationEngine,
	createCalculationEngine,
} from "@/lib/form-builder/calculations";
import type {
	CalculationConfig,
	FormConfiguration,
	FormData,
	FormField,
	FormSection,
	FormStep,
	ValidationError,
} from "@/lib/form-builder/types";
import {
	createValidationEngine,
	FormValidationEngine,
} from "@/lib/form-builder/validation";

// Field Components
import { FormFieldRenderer } from "./FormFieldRenderer";

interface FormRendererProps {
	configuration: FormConfiguration;
	initialData?: Partial<FormData>;
	onSubmit?: (data: FormData) => Promise<void>;
	onSave?: (data: Partial<FormData>) => Promise<void>;
	onFieldChange?: (fieldName: string, value: unknown) => void;
	onValidationChange?: (errors: ValidationError[]) => void;
	readonly?: boolean;
	showValidationSummary?: boolean;
	autoSave?: boolean;
	autoSaveInterval?: number;
	className?: string;
}

export function FormRenderer({
	configuration,
	initialData,
	onSubmit,
	onSave,
	onFieldChange,
	onValidationChange,
	readonly = false,
	showValidationSummary = true,
	autoSave = false,
	autoSaveInterval = 30000,
	className = "",
}: FormRendererProps) {
	// State
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
	const [fieldErrors, setFieldErrors] = useState<
		Record<string, ValidationError[]>
	>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [showPreview, setShowPreview] = useState(false);
	const [calculatedValues, setCalculatedValues] = useState<
		Record<string, unknown>
	>({});

	// Create validation engine
	const validationEngine = useMemo(
		() => createValidationEngine(configuration),
		[configuration],
	);

	// Create form schema
	const formSchema = useMemo(() => {
		const schemaFields: Record<string, z.ZodType<unknown>> = {};

		configuration.fields.forEach((field) => {
			// Basic schema based on field type
			switch (field.type) {
				case "text":
				case "email":
				case "password":
				case "url":
				case "textarea":
					schemaFields[field.name] = field.required
						? z.string().min(1, "This field is required")
						: z.string().optional();
					break;
				case "number":
				case "currency":
				case "percentage":
					schemaFields[field.name] = field.required
						? z.number({ required_error: "This field is required" })
						: z.number().optional();
					break;
				case "select":
				case "radio": {
					const selectField = field as any;
					const options =
						selectField.options?.map((opt: any) => opt.value) || [];
					schemaFields[field.name] = field.required
						? z.enum(
								options.length > 0 ? [options[0], ...options.slice(1)] : [""],
							)
						: z
								.enum(
									options.length > 0 ? [options[0], ...options.slice(1)] : [""],
								)
								.optional();
					break;
				}
				case "checkbox":
					schemaFields[field.name] = field.required
						? z
								.boolean()
								.refine((val) => val === true, "This field is required")
						: z.boolean().optional();
					break;
				default:
					schemaFields[field.name] = field.required
						? z
								.unknown()
								.refine(
									(val) => val !== null && val !== undefined,
									"This field is required",
								)
						: z.unknown().optional();
			}
		});

		return z.object(schemaFields);
	}, [configuration]);

	// Initialize form
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: initialData?.values || {},
		mode: "onChange",
	});

	const {
		control,
		handleSubmit,
		setValue,
		getValues,
		formState: { errors, isDirty, isValid },
	} = form;

	// Watch all form values for real-time updates
	const watchedValues = useWatch({ control });

	// Get current step and sections
	const currentStep = configuration.steps?.[currentStepIndex];
	const isMultiStep = configuration.steps && configuration.steps.length > 1;
	const currentSections = useMemo(() => {
		if (!currentStep) return configuration.sections;
		return configuration.sections.filter((section) =>
			currentStep.sections.includes(section.id),
		);
	}, [currentStep, configuration.sections]);

	// Calculate progress
	const progress = useMemo(() => {
		if (!isMultiStep) {
			const totalFields = configuration.fields.filter((f) => f.required).length;
			const completedFields = configuration.fields.filter(
				(f) =>
					f.required &&
					watchedValues[f.name] !== undefined &&
					watchedValues[f.name] !== "",
			).length;
			return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
		}

		const totalSteps = configuration.steps?.length || 1;
		const completedStepsCount = completedSteps.size;
		const currentStepProgress = currentStepIndex / totalSteps;
		return Math.min(
			((completedStepsCount + currentStepProgress) / totalSteps) * 100,
			100,
		);
	}, [
		isMultiStep,
		configuration.fields,
		configuration.steps,
		completedSteps,
		currentStepIndex,
		watchedValues,
	]);

	// Handle field value changes
	const handleFieldChange = useCallback(
		(fieldName: string, value: unknown) => {
			setValue(fieldName, value, { shouldValidate: true, shouldDirty: true });

			// Real-time validation
			const fieldErrors = validationEngine.validateFieldRealTime(
				fieldName,
				value,
				getValues(),
			);
			setFieldErrors((prev) => ({
				...prev,
				[fieldName]: fieldErrors,
			}));

			// Handle calculations
			const field = configuration.fields.find((f) => f.name === fieldName);
			if (field) {
				updateCalculatedFields(fieldName, value);
			}

			// Call external change handler
			onFieldChange?.(fieldName, value);
		},
		[
			setValue,
			validationEngine,
			getValues,
			onFieldChange,
			configuration.fields,
		],
	);

	// Update calculated fields
	const updateCalculatedFields = useCallback(
		(changedField: string, changedValue: unknown) => {
			const formData: FormData = {
				formId: configuration.id,
				version: configuration.version,
				userId: "current-user", // This would come from auth context
				values: getValues(),
				files: {},
				startedAt: new Date(),
				lastSavedAt: new Date(),
				status: "in_progress",
				completionPercentage: progress,
				validationErrors: [],
				hasErrors: false,
			};

			const calculationEngine = createCalculationEngine(
				formData,
				configuration.fields,
			);

			// Find fields that depend on the changed field
			const dependentFields = configuration.fields.filter((field) => {
				if (field.type === "calculated" && field.dependsOn) {
					return field.dependsOn.includes(changedField);
				}
				return false;
			});

			// Calculate new values for dependent fields
			const newCalculatedValues: Record<string, unknown> = {
				...calculatedValues,
			};

			dependentFields.forEach((field) => {
				if (field.type === "calculated" && field.calculation) {
					try {
						const calculatedValue = calculationEngine.calculateField(
							field.calculation,
						);
						newCalculatedValues[field.name] = calculatedValue;
						setValue(field.name, calculatedValue);
					} catch (error) {
						console.error(`Error calculating field ${field.name}:`, error);
					}
				}
			});

			setCalculatedValues(newCalculatedValues);
		},
		[configuration, getValues, progress, calculatedValues, setValue],
	);

	// Navigation handlers
	const goToNextStep = useCallback(() => {
		if (
			!configuration.steps ||
			currentStepIndex >= configuration.steps.length - 1
		)
			return;

		// Validate current step
		const currentStepFields = getCurrentStepFields();
		const hasErrors = currentStepFields.some(
			(field) => fieldErrors[field.name]?.length > 0,
		);

		if (hasErrors) {
			toast.error("Please fix all errors before proceeding");
			return;
		}

		setCompletedSteps((prev) => new Set([...prev, currentStepIndex]));
		setCurrentStepIndex((prev) => prev + 1);
	}, [configuration.steps, currentStepIndex, fieldErrors]);

	const goToPreviousStep = useCallback(() => {
		if (currentStepIndex <= 0) return;
		setCurrentStepIndex((prev) => prev - 1);
	}, [currentStepIndex]);

	const goToStep = useCallback(
		(stepIndex: number) => {
			if (
				stepIndex < 0 ||
				!configuration.steps ||
				stepIndex >= configuration.steps.length
			)
				return;
			setCurrentStepIndex(stepIndex);
		},
		[configuration.steps],
	);

	// Get fields for current step
	const getCurrentStepFields = useCallback(() => {
		if (!currentStep) return configuration.fields;

		const sectionIds = currentStep.sections;
		const sectionsInStep = configuration.sections.filter((section) =>
			sectionIds.includes(section.id),
		);

		const fieldIds = sectionsInStep.flatMap((section) => section.fields);
		return configuration.fields.filter((field) => fieldIds.includes(field.id));
	}, [currentStep, configuration.fields, configuration.sections]);

	// Auto-save functionality
	useEffect(() => {
		if (!autoSave || !onSave || !isDirty) return;

		const interval = setInterval(async () => {
			if (isDirty) {
				setIsSaving(true);
				try {
					await onSave({
						values: getValues(),
						lastSavedAt: new Date(),
						completionPercentage: progress,
					});
					setLastSaved(new Date());
					toast.success("Progress saved automatically");
				} catch (error) {
					console.error("Auto-save failed:", error);
				} finally {
					setIsSaving(false);
				}
			}
		}, autoSaveInterval);

		return () => clearInterval(interval);
	}, [autoSave, onSave, isDirty, autoSaveInterval, getValues, progress]);

	// Handle form submission
	const handleFormSubmit = useCallback(
		async (data: Record<string, unknown>) => {
			if (!onSubmit) return;

			setIsSubmitting(true);
			try {
				const formData: FormData = {
					formId: configuration.id,
					version: configuration.version,
					userId: "current-user", // From auth context
					values: data,
					files: {}, // Handle files separately
					startedAt: initialData?.startedAt || new Date(),
					lastSavedAt: new Date(),
					submittedAt: new Date(),
					status: "submitted",
					completionPercentage: 100,
					validationErrors: [],
					hasErrors: false,
				};

				await onSubmit(formData);
				toast.success("Form submitted successfully!");
			} catch (error) {
				toast.error("Failed to submit form");
				console.error("Form submission error:", error);
			} finally {
				setIsSubmitting(false);
			}
		},
		[onSubmit, configuration, initialData],
	);

	// Manual save
	const handleSave = useCallback(async () => {
		if (!onSave) return;

		setIsSaving(true);
		try {
			await onSave({
				values: getValues(),
				lastSavedAt: new Date(),
				completionPercentage: progress,
			});
			setLastSaved(new Date());
			toast.success("Progress saved");
		} catch (error) {
			toast.error("Failed to save progress");
			console.error("Save error:", error);
		} finally {
			setIsSaving(false);
		}
	}, [onSave, getValues, progress]);

	// Validation summary
	const validationSummary = useMemo(() => {
		const allErrors = Object.values(fieldErrors).flat();
		return validationEngine.getValidationSummary({
			values: getValues(),
			validationErrors: allErrors,
			hasErrors: allErrors.some((e) => e.severity === "error"),
		} as Partial<FormData>);
	}, [fieldErrors, validationEngine, getValues]);

	// Update validation change handler
	useEffect(() => {
		const allErrors = Object.values(fieldErrors).flat();
		onValidationChange?.(allErrors);
	}, [fieldErrors, onValidationChange]);

	return (
		<div className={`form-renderer ${className}`}>
			{/* Header */}
			<div className="mb-6">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="font-bold text-2xl text-gray-900">
							{configuration.title}
						</h2>
						{configuration.description && (
							<p className="mt-1 text-gray-600">{configuration.description}</p>
						)}
					</div>

					<div className="flex items-center gap-3">
						{/* Auto-save indicator */}
						{autoSave && (
							<div className="flex items-center gap-2 text-gray-500 text-sm">
								{isSaving ? (
									<>
										<Clock className="h-4 w-4 animate-spin" />
										<span>Saving...</span>
									</>
								) : lastSaved ? (
									<>
										<CheckCircle className="h-4 w-4 text-green-500" />
										<span>Saved {lastSaved.toLocaleTimeString()}</span>
									</>
								) : isDirty ? (
									<>
										<Clock className="h-4 w-4" />
										<span>Unsaved changes</span>
									</>
								) : null}
							</div>
						)}

						{/* Manual save button */}
						{onSave && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleSave}
								disabled={isSaving || !isDirty}
							>
								<Save className="mr-2 h-4 w-4" />
								Save
							</Button>
						)}

						{/* Preview toggle */}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowPreview(!showPreview)}
						>
							{showPreview ? (
								<EyeOff className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
							<span className="ml-2">{showPreview ? "Edit" : "Preview"}</span>
						</Button>
					</div>
				</div>

				{/* Progress bar */}
				<div className="mt-4">
					<div className="mb-2 flex items-center justify-between">
						<span className="font-medium text-gray-700 text-sm">
							{isMultiStep
								? `Step ${currentStepIndex + 1} of ${configuration.steps?.length}`
								: "Progress"}
						</span>
						<span className="text-gray-500 text-sm">
							{Math.round(progress)}% complete
						</span>
					</div>
					<Progress value={progress} className="h-2" />
				</div>

				{/* Step indicators for multi-step forms */}
				{isMultiStep && configuration.steps && (
					<div className="mt-4 flex items-center space-x-4 overflow-x-auto">
						{configuration.steps.map((step, index) => (
							<button
								key={step.id}
								onClick={() => goToStep(index)}
								className={`flex items-center space-x-2 rounded-lg px-3 py-2 font-medium text-sm transition-colors ${
									index === currentStepIndex
										? "bg-blue-100 text-blue-900"
										: completedSteps.has(index)
											? "bg-green-100 text-green-900"
											: "bg-gray-100 text-gray-600 hover:bg-gray-200"
								}`}
							>
								<span
									className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
										index === currentStepIndex
											? "bg-blue-600 text-white"
											: completedSteps.has(index)
												? "bg-green-600 text-white"
												: "bg-gray-400 text-white"
									}`}
								>
									{completedSteps.has(index) ? (
										<CheckCircle className="h-4 w-4" />
									) : (
										index + 1
									)}
								</span>
								<span>{step.title}</span>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Validation summary */}
			{showValidationSummary && !validationSummary.isValid && (
				<Alert className="mb-6 border-red-200 bg-red-50">
					<AlertCircle className="h-4 w-4 text-red-600" />
					<AlertDescription className="text-red-800">
						<p className="mb-2 font-semibold">
							Please fix {validationSummary.errorCount} error(s) before
							submitting:
						</p>
						<ul className="list-inside list-disc space-y-1 text-sm">
							{validationSummary.errors
								.filter((e) => e.severity === "error")
								.slice(0, 5)
								.map((error, index) => (
									<li key={index}>{error.message}</li>
								))}
							{validationSummary.errorCount > 5 && (
								<li>... and {validationSummary.errorCount - 5} more errors</li>
							)}
						</ul>
					</AlertDescription>
				</Alert>
			)}

			{/* Form content */}
			<form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
				<AnimatePresence mode="wait">
					<motion.div
						key={currentStepIndex}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}
					>
						{currentSections.map((section) => (
							<Card key={section.id} className="mb-6">
								<CardHeader>
									<CardTitle className="flex items-center justify-between">
										<span>{section.title}</span>
										{section.showProgress && (
											<Badge variant="outline">
												{Math.round(progress)}% complete
											</Badge>
										)}
									</CardTitle>
									{section.description && (
										<p className="text-gray-600 text-sm">
											{section.description}
										</p>
									)}
								</CardHeader>
								<CardContent className="space-y-6">
									{section.fields
										.map((fieldId) =>
											configuration.fields.find((f) => f.id === fieldId),
										)
										.filter(Boolean)
										.sort((a, b) => a!.order - b!.order)
										.map((field) => (
											<div key={field!.id}>
												<Controller
													name={field!.name}
													control={control}
													render={({ field: formField, fieldState }) => (
														<FormFieldRenderer
															field={field!}
															value={formField.value}
															onChange={(value) =>
																handleFieldChange(field!.name, value)
															}
															error={
																fieldState.error?.message ||
																fieldErrors[field!.name]?.[0]?.message
															}
															readonly={readonly || showPreview}
															calculatedValues={calculatedValues}
															allValues={getValues()}
														/>
													)}
												/>
											</div>
										))}
								</CardContent>
							</Card>
						))}
					</motion.div>
				</AnimatePresence>

				{/* Navigation */}
				<div className="flex items-center justify-between border-t pt-6">
					<div>
						{isMultiStep && currentStepIndex > 0 && (
							<Button
								type="button"
								variant="outline"
								onClick={goToPreviousStep}
								className="flex items-center gap-2"
							>
								<ChevronLeft className="h-4 w-4" />
								Previous
							</Button>
						)}
					</div>

					<div className="flex items-center gap-3">
						{isMultiStep &&
						currentStepIndex < (configuration.steps?.length || 1) - 1 ? (
							<Button
								type="button"
								onClick={goToNextStep}
								className="flex items-center gap-2"
								disabled={!isValid}
							>
								Next
								<ChevronRight className="h-4 w-4" />
							</Button>
						) : (
							<Button
								type="submit"
								disabled={isSubmitting || !isValid || readonly}
								className="bg-green-600 text-white hover:bg-green-700"
							>
								{isSubmitting ? "Submitting..." : "Submit Form"}
							</Button>
						)}
					</div>
				</div>
			</form>
		</div>
	);
}

export default FormRenderer;
