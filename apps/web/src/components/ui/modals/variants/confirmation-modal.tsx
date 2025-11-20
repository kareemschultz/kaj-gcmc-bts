"use client";

import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import React, { memo } from "react";
import { cn } from "@/lib/utils";
import type { ModalConfig } from "../modal-context";

interface ConfirmationModalProps {
	modal: ModalConfig;
	onClose: () => void;
}

const iconMap = {
	danger: AlertTriangle,
	warning: AlertCircle,
	success: CheckCircle,
	info: Info,
};

const iconColorMap = {
	danger: "text-red-500",
	warning: "text-yellow-500",
	success: "text-green-500",
	info: "text-blue-500",
};

const buttonColorMap = {
	danger: "bg-red-500 hover:bg-red-600 text-white",
	warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
	success: "bg-green-500 hover:bg-green-600 text-white",
	info: "bg-blue-500 hover:bg-blue-600 text-white",
};

export const ConfirmationModal = memo(function ConfirmationModal({
	modal,
	onClose,
}: ConfirmationModalProps) {
	const { title, description, onConfirm, onCancel, props = {} } = modal;
	const {
		variant = "danger",
		confirmText = "Confirm",
		cancelText = "Cancel",
		showIcon = true,
		loading = false,
	} = props;

	const [isLoading, setIsLoading] = React.useState(false);

	const handleConfirm = async () => {
		if (loading || isLoading) return;

		try {
			setIsLoading(true);
			if (onConfirm) {
				await onConfirm();
			}
			onClose();
		} catch (error) {
			console.error("Error in confirmation modal:", error);
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		if (loading || isLoading) return;

		if (onCancel) {
			onCancel();
		}
		onClose();
	};

	const Icon = iconMap[variant];

	return (
		<div className="p-6">
			{showIcon && (
				<div className="mb-4 flex justify-center">
					<div
						className={cn(
							"rounded-full bg-gray-100 p-3 dark:bg-gray-800",
							iconColorMap[variant],
						)}
					>
						<Icon className="h-6 w-6" />
					</div>
				</div>
			)}

			{title && (
				<h3 className="mb-2 text-center font-semibold text-lg">{title}</h3>
			)}

			{description && (
				<p className="mb-6 text-center text-muted-foreground text-sm leading-relaxed">
					{description}
				</p>
			)}

			<div className="flex justify-end gap-3">
				<button
					type="button"
					onClick={handleCancel}
					disabled={loading || isLoading}
					className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
				>
					{cancelText}
				</button>
				<button
					type="button"
					onClick={handleConfirm}
					disabled={loading || isLoading}
					className={cn(
						"flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
						buttonColorMap[variant],
					)}
				>
					{(loading || isLoading) && (
						<div className="h-4 w-4 animate-spin rounded-full border-white border-b-2" />
					)}
					{confirmText}
				</button>
			</div>
		</div>
	);
});
