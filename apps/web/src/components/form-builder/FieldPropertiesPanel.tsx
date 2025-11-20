"use client";

/**
 * Field Properties Panel
 * Configuration panel for editing field properties
 */

import {
	AlertTriangle,
	ChevronDown,
	ChevronRight,
	Code,
	Eye,
	Info,
	Plus,
	Settings,
	Trash2,
	Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
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
	CalculationConfig,
	ConditionalLogic,
	FormField,
	FormFieldOption,
	ValidationRule,
} from "@/lib/form-builder/types";

interface FieldPropertiesPanelProps {
	field?: FormField;
	onUpdate: (updates: Partial<FormField>) => void;
	readonly?: boolean;
}

export function FieldPropertiesPanel({
	field,
	onUpdate,
	readonly,
}: FieldPropertiesPanelProps) {
	const [localField, setLocalField] = useState<Partial<FormField>>(field || {});
	const [activeTab, setActiveTab] = useState("basic");

	// Update local state when field changes
	useEffect(() => {
		setLocalField(field || {});
	}, [field]);

	// Debounced update handler
	const handleUpdate = useCallback(
		(updates: Partial<FormField>) => {
			const merged = { ...localField, ...updates };
			setLocalField(merged);
			onUpdate(updates);
		},
		[localField, onUpdate],
	);

	// Handle field options update
	const handleOptionsUpdate = useCallback(
		(options: FormFieldOption[]) => {
			handleUpdate({ options } as any);
		},
		[handleUpdate],
	);

	// Handle validation rules update
	const handleValidationRulesUpdate = useCallback(
		(validationRules: ValidationRule[]) => {
			handleUpdate({ validationRules });
		},
		[handleUpdate],
	);

	// Handle conditional logic update
	const handleConditionalLogicUpdate = useCallback(
		(conditions: ConditionalLogic[]) => {
			handleUpdate({ conditions });
		},
		[handleUpdate],
	);

	if (!field) {
		return (
			<div className="p-6 text-center">
				<div className="mb-4">
					<Settings className="mx-auto h-12 w-12 text-gray-300" />
				</div>
				<h3 className="mb-2 font-medium text-gray-900 text-lg">
					No field selected
				</h3>
				<p className="text-gray-500">
					Select a field from the canvas to edit its properties
				</p>
			</div>
		);
	}

	// Field type specific properties
	const renderFieldSpecificProperties = () => {
		switch (field.type) {
			case "text":
			case "textarea":
			case "email":
			case "password":
			case "url":
				return (
					<div className="space-y-4">
						<div>
							<Label htmlFor="placeholder">Placeholder Text</Label>
							<Input
								id="placeholder"
								value={localField.placeholder || ""}
								onChange={(e) => handleUpdate({ placeholder: e.target.value })}
								placeholder="Enter placeholder text"
								disabled={readonly}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="minLength">Min Length</Label>
								<Input
									id="minLength"
									type="number"
									value={(localField as any).minLength || ""}
									onChange={(e) =>
										handleUpdate({
											minLength: Number.parseInt(e.target.value) || undefined,
										} as any)
									}
									disabled={readonly}
								/>
							</div>
							<div>
								<Label htmlFor="maxLength">Max Length</Label>
								<Input
									id="maxLength"
									type="number"
									value={(localField as any).maxLength || ""}
									onChange={(e) =>
										handleUpdate({
											maxLength: Number.parseInt(e.target.value) || undefined,
										} as any)
									}
									disabled={readonly}
								/>
							</div>
						</div>

						{field.type === "text" && (
							<div>
								<Label htmlFor="pattern">Pattern (Regex)</Label>
								<Input
									id="pattern"
									value={(localField as any).pattern || ""}
									onChange={(e) =>
										handleUpdate({ pattern: e.target.value } as any)
									}
									placeholder="^[A-Z0-9]+$"
									disabled={readonly}
								/>
							</div>
						)}
					</div>
				);

			case "number":
			case "currency":
			case "percentage":
				return (
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="min">Minimum Value</Label>
								<Input
									id="min"
									type="number"
									value={(localField as any).min || ""}
									onChange={(e) =>
										handleUpdate({
											min: Number.parseFloat(e.target.value) || undefined,
										} as any)
									}
									disabled={readonly}
								/>
							</div>
							<div>
								<Label htmlFor="max">Maximum Value</Label>
								<Input
									id="max"
									type="number"
									value={(localField as any).max || ""}
									onChange={(e) =>
										handleUpdate({
											max: Number.parseFloat(e.target.value) || undefined,
										} as any)
									}
									disabled={readonly}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="step">Step</Label>
								<Input
									id="step"
									type="number"
									value={(localField as any).step || ""}
									onChange={(e) =>
										handleUpdate({
											step: Number.parseFloat(e.target.value) || undefined,
										} as any)
									}
									placeholder="1"
									disabled={readonly}
								/>
							</div>
							{field.type !== "percentage" && (
								<div>
									<Label htmlFor="precision">Decimal Places</Label>
									<Input
										id="precision"
										type="number"
										value={(localField as any).precision || ""}
										onChange={(e) =>
											handleUpdate({
												precision: Number.parseInt(e.target.value) || undefined,
											} as any)
										}
										placeholder="2"
										disabled={readonly}
									/>
								</div>
							)}
						</div>

						{field.type === "currency" && (
							<div>
								<Label htmlFor="currency">Currency</Label>
								<Select
									value={(localField as any).currency || "GYD"}
									onValueChange={(value) =>
										handleUpdate({ currency: value } as any)
									}
									disabled={readonly}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="GYD">Guyanese Dollar (GYD)</SelectItem>
										<SelectItem value="USD">US Dollar (USD)</SelectItem>
										<SelectItem value="EUR">Euro (EUR)</SelectItem>
										<SelectItem value="GBP">British Pound (GBP)</SelectItem>
										<SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}
					</div>
				);

			case "select":
			case "multiselect":
			case "radio":
			case "checkboxGroup":
				return (
					<OptionsEditor
						options={(localField as any).options || []}
						onUpdate={handleOptionsUpdate}
						readonly={readonly}
					/>
				);

			case "date":
			case "datetime":
			case "time":
				return (
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="minDate">Minimum Date</Label>
								<Input
									id="minDate"
									type={field.type === "time" ? "time" : "date"}
									value={(localField as any).minDate || ""}
									onChange={(e) =>
										handleUpdate({ minDate: e.target.value } as any)
									}
									disabled={readonly}
								/>
							</div>
							<div>
								<Label htmlFor="maxDate">Maximum Date</Label>
								<Input
									id="maxDate"
									type={field.type === "time" ? "time" : "date"}
									value={(localField as any).maxDate || ""}
									onChange={(e) =>
										handleUpdate({ maxDate: e.target.value } as any)
									}
									disabled={readonly}
								/>
							</div>
						</div>

						{field.type !== "time" && (
							<div className="flex items-center space-x-2">
								<Switch
									checked={(localField as any).businessDaysOnly || false}
									onCheckedChange={(checked) =>
										handleUpdate({ businessDaysOnly: checked } as any)
									}
									disabled={readonly}
								/>
								<Label>Business days only</Label>
							</div>
						)}
					</div>
				);

			case "file":
			case "image":
				return (
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="maxFiles">Max Files</Label>
								<Input
									id="maxFiles"
									type="number"
									value={(localField as any).maxFiles || "1"}
									onChange={(e) =>
										handleUpdate({
											maxFiles: Number.parseInt(e.target.value) || 1,
										} as any)
									}
									min="1"
									disabled={readonly}
								/>
							</div>
							<div>
								<Label htmlFor="maxSize">Max Size (MB)</Label>
								<Input
									id="maxSize"
									type="number"
									value={
										((localField as any).maxSize || 10485760) / 1024 / 1024
									}
									onChange={(e) =>
										handleUpdate({
											maxSize:
												(Number.parseFloat(e.target.value) || 10) * 1024 * 1024,
										} as any)
									}
									disabled={readonly}
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="acceptedTypes">Accepted File Types</Label>
							<Input
								id="acceptedTypes"
								value={((localField as any).allowedTypes || []).join(", ")}
								onChange={(e) =>
									handleUpdate({
										allowedTypes: e.target.value
											.split(",")
											.map((s) => s.trim()),
									} as any)
								}
								placeholder="image/*, .pdf, .doc"
								disabled={readonly}
							/>
						</div>
					</div>
				);

			case "calculated":
				return (
					<CalculationEditor
						calculation={(localField as any).calculation}
						dependsOn={(localField as any).dependsOn || []}
						onUpdate={(calculation, dependsOn) =>
							handleUpdate({ calculation, dependsOn } as any)
						}
						readonly={readonly}
					/>
				);

			default:
				return null;
		}
	};

	return (
		<div className="flex h-full flex-col">
			<div className="border-b p-4">
				<h2 className="font-semibold text-gray-900 text-lg">
					Field Properties
				</h2>
				<p className="mt-1 text-gray-500 text-sm">
					{field.label} ({field.type})
				</p>
			</div>

			<div className="flex-1 overflow-y-auto">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
					<div className="px-4 pt-4">
						<TabsList className="grid w-full grid-cols-4">
							<TabsTrigger value="basic" className="text-xs">
								Basic
							</TabsTrigger>
							<TabsTrigger value="validation" className="text-xs">
								Validation
							</TabsTrigger>
							<TabsTrigger value="logic" className="text-xs">
								Logic
							</TabsTrigger>
							<TabsTrigger value="style" className="text-xs">
								Style
							</TabsTrigger>
						</TabsList>
					</div>

					<div className="space-y-6 p-4">
						<TabsContent value="basic" className="mt-0 space-y-6">
							{/* Basic Properties */}
							<Card>
								<CardHeader>
									<CardTitle className="text-sm">Basic Properties</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<Label htmlFor="field-label">Label</Label>
										<Input
											id="field-label"
											value={localField.label || ""}
											onChange={(e) => handleUpdate({ label: e.target.value })}
											placeholder="Field label"
											disabled={readonly}
										/>
									</div>

									<div>
										<Label htmlFor="field-name">Field Name</Label>
										<Input
											id="field-name"
											value={localField.name || ""}
											onChange={(e) => handleUpdate({ name: e.target.value })}
											placeholder="field_name"
											disabled={readonly}
										/>
									</div>

									<div>
										<Label htmlFor="field-description">Description</Label>
										<Textarea
											id="field-description"
											value={localField.description || ""}
											onChange={(e) =>
												handleUpdate({ description: e.target.value })
											}
											placeholder="Field description"
											rows={3}
											disabled={readonly}
										/>
									</div>

									<div>
										<Label htmlFor="help-text">Help Text</Label>
										<Input
											id="help-text"
											value={localField.helpText || ""}
											onChange={(e) =>
												handleUpdate({ helpText: e.target.value })
											}
											placeholder="Helpful information for users"
											disabled={readonly}
										/>
									</div>
								</CardContent>
							</Card>

							{/* Field Behavior */}
							<Card>
								<CardHeader>
									<CardTitle className="text-sm">Field Behavior</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="flex items-center justify-between">
										<Label htmlFor="required">Required</Label>
										<Switch
											id="required"
											checked={localField.required || false}
											onCheckedChange={(checked) =>
												handleUpdate({ required: checked })
											}
											disabled={readonly}
										/>
									</div>

									<div className="flex items-center justify-between">
										<Label htmlFor="disabled">Disabled</Label>
										<Switch
											id="disabled"
											checked={localField.disabled || false}
											onCheckedChange={(checked) =>
												handleUpdate({ disabled: checked })
											}
											disabled={readonly}
										/>
									</div>

									<div className="flex items-center justify-between">
										<Label htmlFor="readonly">Read Only</Label>
										<Switch
											id="readonly"
											checked={localField.readOnly || false}
											onCheckedChange={(checked) =>
												handleUpdate({ readOnly: checked })
											}
											disabled={readonly}
										/>
									</div>

									<div className="flex items-center justify-between">
										<Label htmlFor="hidden">Hidden</Label>
										<Switch
											id="hidden"
											checked={localField.hidden || false}
											onCheckedChange={(checked) =>
												handleUpdate({ hidden: checked })
											}
											disabled={readonly}
										/>
									</div>
								</CardContent>
							</Card>

							{/* Field Specific Properties */}
							{renderFieldSpecificProperties() && (
								<Card>
									<CardHeader>
										<CardTitle className="text-sm">Field Options</CardTitle>
									</CardHeader>
									<CardContent>{renderFieldSpecificProperties()}</CardContent>
								</Card>
							)}
						</TabsContent>

						<TabsContent value="validation" className="mt-0 space-y-6">
							<ValidationRulesEditor
								rules={localField.validationRules || []}
								onUpdate={handleValidationRulesUpdate}
								readonly={readonly}
							/>
						</TabsContent>

						<TabsContent value="logic" className="mt-0 space-y-6">
							<ConditionalLogicEditor
								conditions={localField.conditions || []}
								onUpdate={handleConditionalLogicUpdate}
								readonly={readonly}
							/>
						</TabsContent>

						<TabsContent value="style" className="mt-0 space-y-6">
							<StyleEditor
								field={localField}
								onUpdate={handleUpdate}
								readonly={readonly}
							/>
						</TabsContent>
					</div>
				</Tabs>
			</div>
		</div>
	);
}

// Options Editor Component
interface OptionsEditorProps {
	options: FormFieldOption[];
	onUpdate: (options: FormFieldOption[]) => void;
	readonly?: boolean;
}

function OptionsEditor({ options, onUpdate, readonly }: OptionsEditorProps) {
	const [localOptions, setLocalOptions] = useState<FormFieldOption[]>(options);

	useEffect(() => {
		setLocalOptions(options);
	}, [options]);

	const handleAddOption = () => {
		const newOption: FormFieldOption = {
			value: `option_${localOptions.length + 1}`,
			label: `Option ${localOptions.length + 1}`,
		};
		const updated = [...localOptions, newOption];
		setLocalOptions(updated);
		onUpdate(updated);
	};

	const handleUpdateOption = (
		index: number,
		updates: Partial<FormFieldOption>,
	) => {
		const updated = localOptions.map((opt, i) =>
			i === index ? { ...opt, ...updates } : opt,
		);
		setLocalOptions(updated);
		onUpdate(updated);
	};

	const handleRemoveOption = (index: number) => {
		const updated = localOptions.filter((_, i) => i !== index);
		setLocalOptions(updated);
		onUpdate(updated);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="font-medium text-sm">Options</h4>
				{!readonly && (
					<Button size="sm" onClick={handleAddOption}>
						<Plus className="mr-2 h-4 w-4" />
						Add Option
					</Button>
				)}
			</div>

			<div className="space-y-3">
				{localOptions.map((option, index) => (
					<div key={index} className="space-y-2 rounded-lg border p-3">
						<div className="grid grid-cols-2 gap-2">
							<div>
								<Label>Value</Label>
								<Input
									value={option.value}
									onChange={(e) =>
										handleUpdateOption(index, { value: e.target.value })
									}
									disabled={readonly}
								/>
							</div>
							<div>
								<Label>Label</Label>
								<Input
									value={option.label}
									onChange={(e) =>
										handleUpdateOption(index, { label: e.target.value })
									}
									disabled={readonly}
								/>
							</div>
						</div>

						{!readonly && (
							<div className="flex justify-end">
								<Button
									size="sm"
									variant="ghost"
									onClick={() => handleRemoveOption(index)}
									className="text-red-600 hover:text-red-700"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						)}
					</div>
				))}

				{localOptions.length === 0 && (
					<div className="py-6 text-center text-gray-500">
						<List className="mx-auto mb-2 h-8 w-8 text-gray-300" />
						<p className="text-sm">
							No options yet. Add options for users to choose from.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

// Validation Rules Editor
interface ValidationRulesEditorProps {
	rules: ValidationRule[];
	onUpdate: (rules: ValidationRule[]) => void;
	readonly?: boolean;
}

function ValidationRulesEditor({
	rules,
	onUpdate,
	readonly,
}: ValidationRulesEditorProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">Validation Rules</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-gray-600 text-sm">
					Validation rules will be implemented in the next iteration.
				</p>
			</CardContent>
		</Card>
	);
}

// Conditional Logic Editor
interface ConditionalLogicEditorProps {
	conditions: ConditionalLogic[];
	onUpdate: (conditions: ConditionalLogic[]) => void;
	readonly?: boolean;
}

function ConditionalLogicEditor({
	conditions,
	onUpdate,
	readonly,
}: ConditionalLogicEditorProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">Conditional Logic</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-gray-600 text-sm">
					Conditional logic editor will be implemented in the next iteration.
				</p>
			</CardContent>
		</Card>
	);
}

// Calculation Editor
interface CalculationEditorProps {
	calculation?: CalculationConfig;
	dependsOn: string[];
	onUpdate: (calculation: CalculationConfig, dependsOn: string[]) => void;
	readonly?: boolean;
}

function CalculationEditor({
	calculation,
	dependsOn,
	onUpdate,
	readonly,
}: CalculationEditorProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">Calculation Configuration</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-gray-600 text-sm">
					Calculation editor will be implemented in the next iteration.
				</p>
			</CardContent>
		</Card>
	);
}

// Style Editor
interface StyleEditorProps {
	field: Partial<FormField>;
	onUpdate: (updates: Partial<FormField>) => void;
	readonly?: boolean;
}

function StyleEditor({ field, onUpdate, readonly }: StyleEditorProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">Layout & Style</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<Label>Field Width</Label>
					<Select
						value={field.width || "full"}
						onValueChange={(value) => onUpdate({ width: value as any })}
						disabled={readonly}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="full">Full Width</SelectItem>
							<SelectItem value="half">Half Width (50%)</SelectItem>
							<SelectItem value="third">Third Width (33%)</SelectItem>
							<SelectItem value="quarter">Quarter Width (25%)</SelectItem>
							<SelectItem value="auto">Auto Width</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div>
					<Label>Custom CSS Classes</Label>
					<Input
						value={field.className || ""}
						onChange={(e) => onUpdate({ className: e.target.value })}
						placeholder="custom-class-1 custom-class-2"
						disabled={readonly}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

export default FieldPropertiesPanel;
