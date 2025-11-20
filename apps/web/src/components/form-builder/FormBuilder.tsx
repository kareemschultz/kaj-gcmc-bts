"use client";

/**
 * Dynamic Form Builder - Visual Designer Interface
 * Drag-and-drop form builder with real-time preview
 */

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
	AlertTriangle,
	CheckCircle,
	Code,
	Copy,
	Eye,
	Layout,
	Monitor,
	Move,
	Plus,
	Save,
	Settings,
	Smartphone,
	Tablet,
	Trash2,
} from "lucide-react";
import React, { useCallback, useMemo, useReducer, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
	AgencyCategory,
	Authority,
	ClientType,
	DocumentCategory,
	FormBuilderAction,
	FormBuilderState,
	FormConfiguration,
	FormField,
	FormFieldType,
	FormSection,
	FormStep,
} from "@/lib/form-builder/types";

// Import sub-components
import { FieldPalette } from "./FieldPalette";
import { FieldPropertiesPanel } from "./FieldPropertiesPanel";
import { FormRenderer } from "./FormRenderer";
import { SortableField } from "./SortableField";

// Form builder reducer
function formBuilderReducer(
	state: FormBuilderState,
	action: FormBuilderAction,
): FormBuilderState {
	switch (action.type) {
		case "SET_FORM":
			return {
				...state,
				form: action.payload,
				isDirty: false,
				errors: [],
				warnings: [],
			};

		case "UPDATE_FORM":
			return {
				...state,
				form: { ...state.form, ...action.payload },
				isDirty: true,
			};

		case "ADD_FIELD": {
			const newField = action.payload.field;
			const targetIndex =
				action.payload.targetIndex ?? state.form.fields.length;
			const newFields = [...state.form.fields];
			newFields.splice(targetIndex, 0, newField);

			// Add to section if specified
			let updatedSections = state.form.sections;
			if (action.payload.section) {
				updatedSections = state.form.sections.map((section) =>
					section.id === action.payload.section
						? { ...section, fields: [...section.fields, newField.id] }
						: section,
				);
			}

			return {
				...state,
				form: {
					...state.form,
					fields: newFields,
					sections: updatedSections,
				},
				isDirty: true,
			};
		}

		case "UPDATE_FIELD":
			return {
				...state,
				form: {
					...state.form,
					fields: state.form.fields.map((field) =>
						field.id === action.payload.fieldId
							? { ...field, ...action.payload.updates }
							: field,
					),
				},
				isDirty: true,
			};

		case "REMOVE_FIELD": {
			const fieldToRemove = action.payload.fieldId;
			return {
				...state,
				form: {
					...state.form,
					fields: state.form.fields.filter(
						(field) => field.id !== fieldToRemove,
					),
					sections: state.form.sections.map((section) => ({
						...section,
						fields: section.fields.filter(
							(fieldId) => fieldId !== fieldToRemove,
						),
					})),
				},
				selectedField:
					state.selectedField === fieldToRemove
						? undefined
						: state.selectedField,
				isDirty: true,
			};
		}

		case "MOVE_FIELD": {
			const { fieldId, newIndex, newSection } = action.payload;
			const fieldToMove = state.form.fields.find((f) => f.id === fieldId);
			if (!fieldToMove) return state;

			const movedFields = state.form.fields.filter((f) => f.id !== fieldId);
			movedFields.splice(newIndex, 0, fieldToMove);

			// Handle section changes
			let movedSections = state.form.sections.map((section) => ({
				...section,
				fields: section.fields.filter((id) => id !== fieldId),
			}));

			if (newSection) {
				movedSections = movedSections.map((section) =>
					section.id === newSection
						? { ...section, fields: [...section.fields, fieldId] }
						: section,
				);
			}

			return {
				...state,
				form: {
					...state.form,
					fields: movedFields,
					sections: movedSections,
				},
				isDirty: true,
			};
		}

		case "SELECT_FIELD":
			return {
				...state,
				selectedField: action.payload.fieldId,
			};

		case "ADD_SECTION": {
			const newSection = action.payload.section;
			const sectionTargetIndex =
				action.payload.targetIndex ?? state.form.sections.length;
			const newSections = [...state.form.sections];
			newSections.splice(sectionTargetIndex, 0, newSection);

			return {
				...state,
				form: {
					...state.form,
					sections: newSections,
				},
				isDirty: true,
			};
		}

		case "UPDATE_SECTION":
			return {
				...state,
				form: {
					...state.form,
					sections: state.form.sections.map((section) =>
						section.id === action.payload.sectionId
							? { ...section, ...action.payload.updates }
							: section,
					),
				},
				isDirty: true,
			};

		case "REMOVE_SECTION":
			return {
				...state,
				form: {
					...state.form,
					sections: state.form.sections.filter(
						(section) => section.id !== action.payload.sectionId,
					),
				},
				selectedSection:
					state.selectedSection === action.payload.sectionId
						? undefined
						: state.selectedSection,
				isDirty: true,
			};

		case "SET_MODE":
			return {
				...state,
				mode: action.payload.mode,
			};

		case "SET_DIRTY":
			return {
				...state,
				isDirty: action.payload.isDirty,
			};

		case "SET_ERRORS":
			return {
				...state,
				errors: action.payload.errors,
			};

		case "SET_WARNINGS":
			return {
				...state,
				warnings: action.payload.warnings,
			};

		default:
			return state;
	}
}

// Initial state
const createInitialState = (): FormBuilderState => ({
	form: {
		id: `form-${Date.now()}`,
		name: "New Form",
		title: "Untitled Form",
		version: "1.0",
		authority: "GRA",
		documentType: "general",
		category: "application_form",
		applicableClientTypes: ["individual"],
		fields: [],
		sections: [],
		submissionConfig: {
			method: "api",
		},
		isActive: true,
		createdBy: "current-user",
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	selectedField: undefined,
	selectedSection: undefined,
	draggedField: undefined,
	isDragging: false,
	mode: "design",
	isDirty: false,
	errors: [],
	warnings: [],
});

interface FormBuilderProps {
	initialConfiguration?: Partial<FormConfiguration>;
	onSave?: (configuration: FormConfiguration) => Promise<void>;
	onPreview?: (configuration: FormConfiguration) => void;
	onExport?: (configuration: FormConfiguration) => void;
	readonly?: boolean;
	className?: string;
}

export function FormBuilder({
	initialConfiguration,
	onSave,
	onPreview,
	onExport,
	readonly = false,
	className = "",
}: FormBuilderProps) {
	const [state, dispatch] = useReducer(
		formBuilderReducer,
		createInitialState(),
	);
	const [isLoading, setIsLoading] = useState(false);
	const [previewDevice, setPreviewDevice] = useState<
		"desktop" | "tablet" | "mobile"
	>("desktop");

	// DnD sensors
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

	// Initialize with provided configuration
	React.useEffect(() => {
		if (initialConfiguration) {
			dispatch({
				type: "SET_FORM",
				payload: {
					...createInitialState().form,
					...initialConfiguration,
				} as FormConfiguration,
			});
		}
	}, [initialConfiguration]);

	// Handle drag start
	const handleDragStart = useCallback((event: DragStartEvent) => {
		const { active } = event;
		dispatch({ type: "SET_DIRTY", payload: { isDirty: true } });
	}, []);

	// Handle drag end
	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;

			if (!over) return;

			// Handle field reordering
			if (active.id !== over.id) {
				const oldIndex = state.form.fields.findIndex(
					(field) => field.id === active.id,
				);
				const newIndex = state.form.fields.findIndex(
					(field) => field.id === over.id,
				);

				if (oldIndex !== -1 && newIndex !== -1) {
					const newFields = arrayMove(state.form.fields, oldIndex, newIndex);
					dispatch({
						type: "UPDATE_FORM",
						payload: { fields: newFields },
					});
				}
			}
		},
		[state.form.fields],
	);

	// Add new field
	const handleAddField = useCallback(
		(fieldType: FormFieldType, targetIndex?: number) => {
			const newField: FormField = {
				id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				type: fieldType,
				name: `field_${Date.now()}`,
				label: `New ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
				order: targetIndex ?? state.form.fields.length,
				required: false,
			} as FormField;

			dispatch({
				type: "ADD_FIELD",
				payload: { field: newField, targetIndex },
			});

			// Select the new field
			dispatch({
				type: "SELECT_FIELD",
				payload: { fieldId: newField.id },
			});

			toast.success("Field added successfully");
		},
		[state.form.fields.length],
	);

	// Update field
	const handleUpdateField = useCallback(
		(fieldId: string, updates: Partial<FormField>) => {
			dispatch({
				type: "UPDATE_FIELD",
				payload: { fieldId, updates },
			});
		},
		[],
	);

	// Remove field
	const handleRemoveField = useCallback((fieldId: string) => {
		dispatch({
			type: "REMOVE_FIELD",
			payload: { fieldId },
		});
		toast.success("Field removed");
	}, []);

	// Duplicate field
	const handleDuplicateField = useCallback(
		(fieldId: string) => {
			const fieldToDuplicate = state.form.fields.find((f) => f.id === fieldId);
			if (!fieldToDuplicate) return;

			const duplicatedField: FormField = {
				...fieldToDuplicate,
				id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				name: `${fieldToDuplicate.name}_copy`,
				label: `${fieldToDuplicate.label} (Copy)`,
			};

			const originalIndex = state.form.fields.findIndex(
				(f) => f.id === fieldId,
			);
			dispatch({
				type: "ADD_FIELD",
				payload: { field: duplicatedField, targetIndex: originalIndex + 1 },
			});

			toast.success("Field duplicated");
		},
		[state.form.fields],
	);

	// Add section
	const handleAddSection = useCallback(() => {
		const newSection: FormSection = {
			id: `section-${Date.now()}`,
			title: "New Section",
			order: state.form.sections.length,
			fields: [],
		};

		dispatch({
			type: "ADD_SECTION",
			payload: { section: newSection },
		});

		toast.success("Section added");
	}, [state.form.sections.length]);

	// Save form
	const handleSave = useCallback(async () => {
		if (!onSave) return;

		setIsLoading(true);
		try {
			await onSave(state.form);
			dispatch({ type: "SET_DIRTY", payload: { isDirty: false } });
			toast.success("Form saved successfully");
		} catch (error) {
			toast.error("Failed to save form");
			console.error("Save error:", error);
		} finally {
			setIsLoading(false);
		}
	}, [onSave, state.form]);

	// Preview form
	const handlePreview = useCallback(() => {
		onPreview?.(state.form);
		dispatch({ type: "SET_MODE", payload: { mode: "preview" } });
	}, [onPreview, state.form]);

	// Validate form configuration
	const validationResults = useMemo(() => {
		const errors: string[] = [];
		const warnings: string[] = [];

		// Check required properties
		if (!state.form.title?.trim()) errors.push("Form title is required");
		if (!state.form.name?.trim()) errors.push("Form name is required");
		if (state.form.fields.length === 0) warnings.push("Form has no fields");

		// Check field names are unique
		const fieldNames = state.form.fields.map((f) => f.name);
		const duplicateNames = fieldNames.filter(
			(name, index) => fieldNames.indexOf(name) !== index,
		);
		if (duplicateNames.length > 0) {
			errors.push(
				`Duplicate field names: ${[...new Set(duplicateNames)].join(", ")}`,
			);
		}

		// Check required fields have proper validation
		state.form.fields.forEach((field) => {
			if (
				field.required &&
				!field.validationRules?.some((rule) => rule.type === "required")
			) {
				warnings.push(
					`Required field "${field.label}" should have required validation rule`,
				);
			}
		});

		return { errors, warnings };
	}, [state.form]);

	// Update validation results
	React.useEffect(() => {
		dispatch({
			type: "SET_ERRORS",
			payload: { errors: validationResults.errors },
		});
		dispatch({
			type: "SET_WARNINGS",
			payload: { warnings: validationResults.warnings },
		});
	}, [validationResults]);

	// Get selected field
	const selectedField = useMemo(() => {
		return state.form.fields.find((f) => f.id === state.selectedField);
	}, [state.form.fields, state.selectedField]);

	// Preview device styles
	const previewDeviceStyles = {
		desktop: "w-full max-w-none",
		tablet: "w-[768px] mx-auto",
		mobile: "w-[375px] mx-auto",
	};

	return (
		<div className={`form-builder flex h-screen flex-col ${className}`}>
			{/* Header */}
			<div className="border-b bg-white px-6 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<div>
							<h1 className="font-semibold text-gray-900 text-xl">
								Form Builder
							</h1>
							<p className="text-gray-500 text-sm">
								{state.form.title} • {state.form.fields.length} fields
							</p>
						</div>
						{state.isDirty && (
							<Badge
								variant="outline"
								className="border-orange-300 text-orange-600"
							>
								Unsaved changes
							</Badge>
						)}
					</div>

					<div className="flex items-center space-x-2">
						{/* Mode toggle */}
						<Tabs
							value={state.mode}
							onValueChange={(mode) =>
								dispatch({ type: "SET_MODE", payload: { mode: mode as any } })
							}
						>
							<TabsList>
								<TabsTrigger value="design">
									<Layout className="mr-2 h-4 w-4" />
									Design
								</TabsTrigger>
								<TabsTrigger value="preview">
									<Eye className="mr-2 h-4 w-4" />
									Preview
								</TabsTrigger>
								<TabsTrigger value="code">
									<Code className="mr-2 h-4 w-4" />
									Code
								</TabsTrigger>
							</TabsList>
						</Tabs>

						{/* Actions */}
						{!readonly && (
							<>
								<Button
									variant="outline"
									onClick={handleSave}
									disabled={isLoading || !state.isDirty}
								>
									<Save className="mr-2 h-4 w-4" />
									Save
								</Button>
								<Button onClick={handlePreview}>
									<Eye className="mr-2 h-4 w-4" />
									Preview
								</Button>
							</>
						)}
					</div>
				</div>

				{/* Validation alerts */}
				{validationResults.errors.length > 0 && (
					<Alert className="mt-4 border-red-200 bg-red-50">
						<AlertTriangle className="h-4 w-4 text-red-600" />
						<AlertDescription className="text-red-800">
							<p className="font-semibold">Please fix the following errors:</p>
							<ul className="mt-1 list-inside list-disc text-sm">
								{validationResults.errors.map((error, index) => (
									<li key={index}>{error}</li>
								))}
							</ul>
						</AlertDescription>
					</Alert>
				)}

				{validationResults.warnings.length > 0 && (
					<Alert className="mt-4 border-yellow-200 bg-yellow-50">
						<AlertTriangle className="h-4 w-4 text-yellow-600" />
						<AlertDescription className="text-yellow-800">
							<p className="font-semibold">Warnings:</p>
							<ul className="mt-1 list-inside list-disc text-sm">
								{validationResults.warnings.map((warning, index) => (
									<li key={index}>{warning}</li>
								))}
							</ul>
						</AlertDescription>
					</Alert>
				)}
			</div>

			{/* Main content */}
			<div className="flex flex-1 overflow-hidden">
				{state.mode === "design" ? (
					<>
						{/* Left sidebar - Field palette */}
						<div className="w-80 overflow-y-auto border-r bg-gray-50">
							<FieldPalette onAddField={handleAddField} readonly={readonly} />
						</div>

						{/* Center - Form canvas */}
						<div className="flex-1 overflow-y-auto bg-white">
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragStart={handleDragStart}
								onDragEnd={handleDragEnd}
							>
								<div className="p-6">
									{/* Form settings */}
									<Card className="mb-6">
										<CardHeader>
											<CardTitle className="flex items-center justify-between">
												<span>Form Settings</span>
												<Settings className="h-5 w-5 text-gray-400" />
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-4">
											<div className="grid grid-cols-2 gap-4">
												<div>
													<Label htmlFor="form-title">Form Title</Label>
													<Input
														id="form-title"
														value={state.form.title}
														onChange={(e) =>
															dispatch({
																type: "UPDATE_FORM",
																payload: { title: e.target.value },
															})
														}
														placeholder="Enter form title"
														disabled={readonly}
													/>
												</div>
												<div>
													<Label htmlFor="form-name">Form Name</Label>
													<Input
														id="form-name"
														value={state.form.name}
														onChange={(e) =>
															dispatch({
																type: "UPDATE_FORM",
																payload: { name: e.target.value },
															})
														}
														placeholder="Enter form name"
														disabled={readonly}
													/>
												</div>
											</div>

											<div>
												<Label htmlFor="form-description">Description</Label>
												<Textarea
													id="form-description"
													value={state.form.description || ""}
													onChange={(e) =>
														dispatch({
															type: "UPDATE_FORM",
															payload: { description: e.target.value },
														})
													}
													placeholder="Enter form description"
													disabled={readonly}
												/>
											</div>

											<div className="grid grid-cols-3 gap-4">
												<div>
													<Label htmlFor="authority">Authority</Label>
													<Select
														value={state.form.authority}
														onValueChange={(value: Authority) =>
															dispatch({
																type: "UPDATE_FORM",
																payload: { authority: value },
															})
														}
														disabled={readonly}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="GRA">GRA</SelectItem>
															<SelectItem value="NIS">NIS</SelectItem>
															<SelectItem value="DCRA">DCRA</SelectItem>
															<SelectItem value="Immigration">
																Immigration
															</SelectItem>
															{/* Add more authorities */}
														</SelectContent>
													</Select>
												</div>
												<div>
													<Label htmlFor="document-type">Document Type</Label>
													<Input
														id="document-type"
														value={state.form.documentType}
														onChange={(e) =>
															dispatch({
																type: "UPDATE_FORM",
																payload: { documentType: e.target.value },
															})
														}
														disabled={readonly}
													/>
												</div>
												<div>
													<Label htmlFor="category">Category</Label>
													<Select
														value={state.form.category}
														onValueChange={(value: DocumentCategory) =>
															dispatch({
																type: "UPDATE_FORM",
																payload: { category: value },
															})
														}
														disabled={readonly}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="application_form">
																Application Form
															</SelectItem>
															<SelectItem value="tax_filing">
																Tax Filing
															</SelectItem>
															<SelectItem value="compliance_certificate">
																Compliance Certificate
															</SelectItem>
															{/* Add more categories */}
														</SelectContent>
													</Select>
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Form fields */}
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center justify-between">
												<span>Form Fields ({state.form.fields.length})</span>
												<div className="flex space-x-2">
													<Button
														size="sm"
														onClick={handleAddSection}
														disabled={readonly}
													>
														<Plus className="mr-2 h-4 w-4" />
														Add Section
													</Button>
												</div>
											</CardTitle>
										</CardHeader>
										<CardContent>
											{state.form.fields.length === 0 ? (
												<div className="py-12 text-center">
													<div className="mb-4 text-gray-400">
														<Layout className="mx-auto h-12 w-12" />
													</div>
													<h3 className="mb-2 font-medium text-gray-900 text-lg">
														No fields yet
													</h3>
													<p className="mb-4 text-gray-500">
														Drag fields from the palette to start building your
														form
													</p>
												</div>
											) : (
												<SortableContext
													items={state.form.fields.map((f) => f.id)}
													strategy={verticalListSortingStrategy}
												>
													<div className="space-y-3">
														{state.form.fields.map((field, index) => (
															<SortableField
																key={field.id}
																field={field}
																isSelected={state.selectedField === field.id}
																onSelect={() =>
																	dispatch({
																		type: "SELECT_FIELD",
																		payload: { fieldId: field.id },
																	})
																}
																onUpdate={(updates) =>
																	handleUpdateField(field.id, updates)
																}
																onRemove={() => handleRemoveField(field.id)}
																onDuplicate={() =>
																	handleDuplicateField(field.id)
																}
																readonly={readonly}
															/>
														))}
													</div>
												</SortableContext>
											)}
										</CardContent>
									</Card>
								</div>

								<DragOverlay>
									{state.draggedField && (
										<div className="rounded-lg border bg-white p-3 shadow-lg">
											<span className="font-medium">
												{state.draggedField.label}
											</span>
										</div>
									)}
								</DragOverlay>
							</DndContext>
						</div>

						{/* Right sidebar - Properties panel */}
						<div className="w-80 overflow-y-auto border-l bg-gray-50">
							<FieldPropertiesPanel
								field={selectedField}
								onUpdate={(updates) => {
									if (selectedField) {
										handleUpdateField(selectedField.id, updates);
									}
								}}
								readonly={readonly}
							/>
						</div>
					</>
				) : state.mode === "preview" ? (
					<div className="flex-1 overflow-y-auto bg-gray-100">
						{/* Device preview controls */}
						<div className="border-b bg-white p-4">
							<div className="flex items-center justify-center space-x-2">
								<Button
									variant={previewDevice === "desktop" ? "default" : "ghost"}
									size="sm"
									onClick={() => setPreviewDevice("desktop")}
								>
									<Monitor className="mr-2 h-4 w-4" />
									Desktop
								</Button>
								<Button
									variant={previewDevice === "tablet" ? "default" : "ghost"}
									size="sm"
									onClick={() => setPreviewDevice("tablet")}
								>
									<Tablet className="mr-2 h-4 w-4" />
									Tablet
								</Button>
								<Button
									variant={previewDevice === "mobile" ? "default" : "ghost"}
									size="sm"
									onClick={() => setPreviewDevice("mobile")}
								>
									<Smartphone className="mr-2 h-4 w-4" />
									Mobile
								</Button>
							</div>
						</div>

						{/* Form preview */}
						<div className="p-6">
							<div className={previewDeviceStyles[previewDevice]}>
								<FormRenderer
									configuration={state.form}
									readonly={true}
									showValidationSummary={false}
								/>
							</div>
						</div>
					</div>
				) : (
					<div className="flex-1 overflow-y-auto bg-gray-900">
						{/* Code view */}
						<div className="p-6">
							<pre className="font-mono text-green-400 text-sm">
								<code>{JSON.stringify(state.form, null, 2)}</code>
							</pre>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default FormBuilder;
