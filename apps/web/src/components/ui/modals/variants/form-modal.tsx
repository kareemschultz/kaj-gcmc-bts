"use client";

import React, { memo } from "react";
import { cn } from "@/lib/utils";
import type { ModalConfig } from "../modal-context";

interface FormModalProps {
	modal: ModalConfig;
	onClose: () => void;
}

export const FormModal = memo(function FormModal({
	modal,
	onClose,
}: FormModalProps) {
	const { title, description, props = {} } = modal;
	const {
		fields = [],
		submitText = "Submit",
		cancelText = "Cancel",
		onSubmit,
		initialValues = {},
		validationSchema,
		loading = false,
	} = props;

	const [formData, setFormData] = React.useState(initialValues);
	const [errors, setErrors] = React.useState<Record<string, string>>({});
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	const validateField = (name: string, value: any) => {
		if (validationSchema && validationSchema[name]) {
			try {
				validationSchema[name].parse(value);
				return "";
			} catch (error: any) {
				return error.errors?.[0]?.message || "Invalid value";
			}
		}
		return "";
	};

	const handleInputChange = (name: string, value: any) => {
		setFormData((prev) => ({ ...prev, [name]: value }));

		// Clear error when user starts typing
		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: "" }));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (loading || isSubmitting) return;

		// Validate all fields
		const newErrors: Record<string, string> = {};
		for (const field of fields) {
			const error = validateField(field.name, formData[field.name]);
			if (error) {
				newErrors[field.name] = error;
			}
		}

		setErrors(newErrors);

		if (Object.keys(newErrors).length > 0) {
			return;
		}

		try {
			setIsSubmitting(true);
			if (onSubmit) {
				await onSubmit(formData);
			}
			onClose();
		} catch (error) {
			console.error("Error submitting form:", error);
			setIsSubmitting(false);
		}
	};

	const renderField = (field: any) => {
		const {
			name,
			label,
			type = "text",
			placeholder,
			required = false,
			options = [],
		} = field;

		const value = formData[name] || "";
		const error = errors[name];

		switch (type) {
			case "select":
				return (
					<div key={name} className="space-y-1">
						<label htmlFor={name} className="block font-medium text-sm">
							{label}
							{required && <span className="ml-1 text-red-500">*</span>}
						</label>
						<select
							id={name}
							value={value}
							onChange={(e) => handleInputChange(name, e.target.value)}
							className={cn(
								"w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
								error
									? "border-red-300 bg-red-50 dark:bg-red-950/20"
									: "border-border bg-background",
							)}
							required={required}
						>
							<option value="">{placeholder || "Select an option"}</option>
							{options.map((option: any) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
						{error && <p className="text-red-500 text-xs">{error}</p>}
					</div>
				);

			case "textarea":
				return (
					<div key={name} className="space-y-1">
						<label htmlFor={name} className="block font-medium text-sm">
							{label}
							{required && <span className="ml-1 text-red-500">*</span>}
						</label>
						<textarea
							id={name}
							value={value}
							onChange={(e) => handleInputChange(name, e.target.value)}
							placeholder={placeholder}
							rows={3}
							className={cn(
								"w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
								error
									? "border-red-300 bg-red-50 dark:bg-red-950/20"
									: "border-border bg-background",
							)}
							required={required}
						/>
						{error && <p className="text-red-500 text-xs">{error}</p>}
					</div>
				);

			case "checkbox":
				return (
					<div key={name} className="flex items-center space-x-2">
						<input
							type="checkbox"
							id={name}
							checked={value}
							onChange={(e) => handleInputChange(name, e.target.checked)}
							className="rounded border-border focus:ring-2 focus:ring-primary/50"
							required={required}
						/>
						<label htmlFor={name} className="text-sm">
							{label}
							{required && <span className="ml-1 text-red-500">*</span>}
						</label>
						{error && <p className="ml-6 text-red-500 text-xs">{error}</p>}
					</div>
				);

			default:
				return (
					<div key={name} className="space-y-1">
						<label htmlFor={name} className="block font-medium text-sm">
							{label}
							{required && <span className="ml-1 text-red-500">*</span>}
						</label>
						<input
							type={type}
							id={name}
							value={value}
							onChange={(e) => handleInputChange(name, e.target.value)}
							placeholder={placeholder}
							className={cn(
								"w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50",
								error
									? "border-red-300 bg-red-50 dark:bg-red-950/20"
									: "border-border bg-background",
							)}
							required={required}
						/>
						{error && <p className="text-red-500 text-xs">{error}</p>}
					</div>
				);
		}
	};

	return (
		<div className="p-6">
			{title && <h3 className="mb-2 font-semibold text-lg">{title}</h3>}

			{description && (
				<p className="mb-4 text-muted-foreground text-sm">{description}</p>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				{fields.map(renderField)}

				<div className="flex justify-end gap-3 border-border border-t pt-4">
					<button
						type="button"
						onClick={onClose}
						disabled={loading || isSubmitting}
						className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
					>
						{cancelText}
					</button>
					<button
						type="submit"
						disabled={loading || isSubmitting}
						className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{(loading || isSubmitting) && (
							<div className="h-4 w-4 animate-spin rounded-full border-white border-b-2" />
						)}
						{submitText}
					</button>
				</div>
			</form>
		</div>
	);
});
