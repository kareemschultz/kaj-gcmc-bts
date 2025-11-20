"use client";

/**
 * Sortable Field Component
 * Represents a draggable field in the form builder canvas
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	BarChart3,
	Calculator,
	Calendar,
	CheckSquare,
	Copy,
	DollarSign,
	Eye,
	EyeOff,
	Hash,
	List,
	Lock,
	Mail,
	MoreVertical,
	Move,
	Phone,
	Radio,
	Separator as SeparatorIcon,
	Settings,
	Star,
	Trash2,
	Type,
	Unlock,
	Upload,
} from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FormField } from "@/lib/form-builder/types";

interface SortableFieldProps {
	field: FormField;
	isSelected: boolean;
	onSelect: () => void;
	onUpdate: (updates: Partial<FormField>) => void;
	onRemove: () => void;
	onDuplicate: () => void;
	readonly?: boolean;
}

// Field type icons mapping
const FIELD_ICONS: Record<string, React.ReactNode> = {
	text: <Type className="h-4 w-4" />,
	textarea: <Type className="h-4 w-4" />,
	email: <Mail className="h-4 w-4" />,
	phone: <Phone className="h-4 w-4" />,
	number: <Hash className="h-4 w-4" />,
	currency: <DollarSign className="h-4 w-4" />,
	percentage: <Hash className="h-4 w-4" />,
	date: <Calendar className="h-4 w-4" />,
	datetime: <Calendar className="h-4 w-4" />,
	time: <Calendar className="h-4 w-4" />,
	checkbox: <CheckSquare className="h-4 w-4" />,
	select: <List className="h-4 w-4" />,
	multiselect: <List className="h-4 w-4" />,
	radio: <Radio className="h-4 w-4" />,
	checkboxGroup: <CheckSquare className="h-4 w-4" />,
	file: <Upload className="h-4 w-4" />,
	image: <Upload className="h-4 w-4" />,
	signature: <Upload className="h-4 w-4" />,
	calculated: <Calculator className="h-4 w-4" />,
	section: <BarChart3 className="h-4 w-4" />,
	divider: <SeparatorIcon className="h-4 w-4" />,
	tax_id: <Hash className="h-4 w-4" />,
	business_reg: <Hash className="h-4 w-4" />,
	nis_number: <Hash className="h-4 w-4" />,
	passport: <Hash className="h-4 w-4" />,
	id_card: <Hash className="h-4 w-4" />,
	password: <Lock className="h-4 w-4" />,
	url: <Type className="h-4 w-4" />,
};

// Field type categories for styling
const getFieldCategory = (
	type: string,
): "basic" | "advanced" | "guyanese" | "layout" => {
	const basicTypes = [
		"text",
		"textarea",
		"email",
		"phone",
		"number",
		"date",
		"checkbox",
		"select",
		"radio",
	];
	const advancedTypes = [
		"multiselect",
		"checkboxGroup",
		"file",
		"image",
		"signature",
		"datetime",
		"time",
		"password",
		"url",
	];
	const guyaneseTypes = [
		"tax_id",
		"business_reg",
		"nis_number",
		"passport",
		"id_card",
		"currency",
		"percentage",
		"calculated",
	];
	const layoutTypes = ["section", "divider"];

	if (basicTypes.includes(type)) return "basic";
	if (advancedTypes.includes(type)) return "advanced";
	if (guyaneseTypes.includes(type)) return "guyanese";
	if (layoutTypes.includes(type)) return "layout";
	return "basic";
};

export function SortableField({
	field,
	isSelected,
	onSelect,
	onUpdate,
	onRemove,
	onDuplicate,
	readonly,
}: SortableFieldProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: field.id,
		disabled: readonly,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const category = getFieldCategory(field.type);
	const icon = FIELD_ICONS[field.type] || <Type className="h-4 w-4" />;

	// Get category styles
	const getCategoryStyles = (cat: string, selected: boolean) => {
		const baseStyles = "border-2 transition-all duration-200";

		if (selected) {
			switch (cat) {
				case "basic":
					return `${baseStyles} border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-200`;
				case "advanced":
					return `${baseStyles} border-purple-400 bg-purple-50 shadow-md ring-2 ring-purple-200`;
				case "guyanese":
					return `${baseStyles} border-green-400 bg-green-50 shadow-md ring-2 ring-green-200`;
				case "layout":
					return `${baseStyles} border-gray-400 bg-gray-50 shadow-md ring-2 ring-gray-200`;
				default:
					return `${baseStyles} border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-200`;
			}
		}

		switch (cat) {
			case "basic":
				return `${baseStyles} border-blue-200 hover:border-blue-300 hover:shadow-sm`;
			case "advanced":
				return `${baseStyles} border-purple-200 hover:border-purple-300 hover:shadow-sm`;
			case "guyanese":
				return `${baseStyles} border-green-200 hover:border-green-300 hover:shadow-sm`;
			case "layout":
				return `${baseStyles} border-gray-200 hover:border-gray-300 hover:shadow-sm`;
			default:
				return `${baseStyles} border-gray-200 hover:border-gray-300 hover:shadow-sm`;
		}
	};

	// Handle field property quick toggles
	const handleToggleRequired = () => {
		onUpdate({ required: !field.required });
	};

	const handleToggleHidden = () => {
		onUpdate({ hidden: !field.hidden });
	};

	const handleToggleDisabled = () => {
		onUpdate({ disabled: !field.disabled });
	};

	const handleToggleReadOnly = () => {
		onUpdate({ readOnly: !field.readOnly });
	};

	// Render field preview content
	const renderFieldPreview = () => {
		switch (field.type) {
			case "section":
				return (
					<div className="w-full">
						<h3 className="font-semibold text-gray-900 text-lg">
							{field.label}
						</h3>
						{field.description && (
							<p className="mt-1 text-gray-600 text-sm">{field.description}</p>
						)}
					</div>
				);

			case "divider":
				return (
					<div className="w-full">
						<hr className="border-gray-300" />
						<p className="mt-2 text-center text-gray-500 text-xs">Divider</p>
					</div>
				);

			case "calculated":
				return (
					<div className="w-full">
						<div className="flex items-center space-x-2">
							<Calculator className="h-4 w-4 text-blue-600" />
							<span className="text-gray-700 text-sm">{field.label}</span>
						</div>
						<div className="mt-1 rounded border bg-blue-50 p-2 text-blue-700 text-sm">
							Calculated value
						</div>
					</div>
				);

			default:
				return (
					<div className="w-full">
						<div className="mb-2 flex items-center justify-between">
							<label className="font-medium text-gray-700 text-sm">
								{field.label}
								{field.required && <span className="ml-1 text-red-500">*</span>}
							</label>
							<div className="flex items-center space-x-1">
								{field.hidden && <EyeOff className="h-3 w-3 text-gray-400" />}
								{field.disabled && <Lock className="h-3 w-3 text-gray-400" />}
								{field.readOnly && <Lock className="h-3 w-3 text-orange-400" />}
							</div>
						</div>

						{/* Mock input based on field type */}
						<div className="space-y-2">
							{field.type === "textarea" ? (
								<div className="h-20 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-500 text-sm">
									{field.placeholder || "Enter text..."}
								</div>
							) : field.type === "select" ? (
								<div className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-500 text-sm">
									<span>{field.placeholder || "Select an option"}</span>
									<List className="h-4 w-4" />
								</div>
							) : field.type === "checkbox" ? (
								<div className="flex items-center space-x-2">
									<div className="h-4 w-4 rounded border border-gray-300 bg-white" />
									<span className="text-gray-600 text-sm">{field.label}</span>
								</div>
							) : field.type === "radio" ? (
								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<div className="h-4 w-4 rounded-full border border-gray-300 bg-white" />
										<span className="text-gray-600 text-sm">Option 1</span>
									</div>
									<div className="flex items-center space-x-2">
										<div className="h-4 w-4 rounded-full border border-gray-300 bg-white" />
										<span className="text-gray-600 text-sm">Option 2</span>
									</div>
								</div>
							) : field.type === "file" || field.type === "image" ? (
								<div className="flex h-24 w-full items-center justify-center rounded-md border-2 border-gray-300 border-dashed bg-gray-50">
									<div className="text-center">
										<Upload className="mx-auto mb-1 h-6 w-6 text-gray-400" />
										<p className="text-gray-500 text-xs">Upload file</p>
									</div>
								</div>
							) : (
								<div className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-500 text-sm">
									{field.placeholder || `Enter ${field.type}...`}
								</div>
							)}

							{field.description && (
								<p className="text-gray-500 text-xs">{field.description}</p>
							)}
						</div>
					</div>
				);
		}
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`
        ${getCategoryStyles(category, isSelected)}
        ${isDragging ? "scale-95 opacity-50" : ""}
        ${readonly ? "cursor-default" : "cursor-pointer"}rounded-lg bg-white p-4`}
			onClick={onSelect}
			{...attributes}
			{...listeners}
		>
			<div className="flex items-start justify-between">
				<div className="flex flex-1 items-center space-x-3">
					{/* Field type indicator */}
					<div
						className={`flex-shrink-0 rounded-md p-2 ${
							category === "basic"
								? "bg-blue-100 text-blue-600"
								: category === "advanced"
									? "bg-purple-100 text-purple-600"
									: category === "guyanese"
										? "bg-green-100 text-green-600"
										: "bg-gray-100 text-gray-600"
						}
          `}
					>
						{icon}
					</div>

					{/* Field content */}
					<div className="min-w-0 flex-1">{renderFieldPreview()}</div>
				</div>

				{/* Field actions */}
				<div className="ml-4 flex items-center space-x-2">
					{/* Field status badges */}
					<div className="flex items-center space-x-1">
						{field.required && (
							<Badge variant="outline" className="px-1 py-0 text-xs">
								Required
							</Badge>
						)}
						{field.type === "calculated" && (
							<Badge
								variant="outline"
								className="border-blue-300 bg-blue-50 px-1 py-0 text-blue-700 text-xs"
							>
								Calculated
							</Badge>
						)}
						{category === "guyanese" && (
							<Badge
								variant="outline"
								className="border-green-300 bg-green-50 px-1 py-0 text-green-700 text-xs"
							>
								GY
							</Badge>
						)}
					</div>

					{/* Quick actions */}
					{!readonly && (
						<div className="flex items-center space-x-1">
							<Button
								size="sm"
								variant="ghost"
								className="h-8 w-8 p-0"
								onClick={(e) => {
									e.stopPropagation();
									handleToggleRequired();
								}}
								title={field.required ? "Make optional" : "Make required"}
							>
								<Star
									className={`h-3 w-3 ${field.required ? "fill-current text-yellow-500" : "text-gray-400"}`}
								/>
							</Button>

							<Button
								size="sm"
								variant="ghost"
								className="h-8 w-8 p-0"
								onClick={(e) => {
									e.stopPropagation();
									handleToggleHidden();
								}}
								title={field.hidden ? "Show field" : "Hide field"}
							>
								{field.hidden ? (
									<EyeOff className="h-3 w-3 text-gray-400" />
								) : (
									<Eye className="h-3 w-3 text-gray-400" />
								)}
							</Button>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										size="sm"
										variant="ghost"
										className="h-8 w-8 p-0"
										onClick={(e) => e.stopPropagation()}
									>
										<MoreVertical className="h-3 w-3 text-gray-400" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-48">
									<DropdownMenuItem
										onClick={(e) => {
											e.stopPropagation();
											onSelect();
										}}
									>
										<Settings className="mr-2 h-4 w-4" />
										Edit Properties
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={(e) => {
											e.stopPropagation();
											onDuplicate();
										}}
									>
										<Copy className="mr-2 h-4 w-4" />
										Duplicate Field
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={(e) => {
											e.stopPropagation();
											handleToggleDisabled();
										}}
									>
										{field.disabled ? (
											<Unlock className="mr-2 h-4 w-4" />
										) : (
											<Lock className="mr-2 h-4 w-4" />
										)}
										{field.disabled ? "Enable" : "Disable"}
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={(e) => {
											e.stopPropagation();
											handleToggleReadOnly();
										}}
									>
										{field.readOnly ? (
											<Unlock className="mr-2 h-4 w-4" />
										) : (
											<Lock className="mr-2 h-4 w-4" />
										)}
										{field.readOnly ? "Make Editable" : "Make Read-only"}
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={(e) => {
											e.stopPropagation();
											onRemove();
										}}
										className="text-red-600 focus:text-red-600"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete Field
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)}

					{/* Drag handle */}
					{!readonly && (
						<div className="cursor-move text-gray-400 hover:text-gray-600">
							<Move className="h-4 w-4" />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default SortableField;
