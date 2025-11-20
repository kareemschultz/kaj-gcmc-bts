"use client";

import { X } from "lucide-react";
import React, { memo } from "react";
import { cn } from "@/lib/utils";
import type { ModalConfig } from "../modal-context";

interface LoadingModalProps {
	modal: ModalConfig;
	onClose: () => void;
}

export const LoadingModal = memo(function LoadingModal({
	modal,
	onClose,
}: LoadingModalProps) {
	const { title, description, props = {}, onCancel } = modal;
	const {
		progress,
		cancelable = false,
		showPercentage = true,
		animation = "spin",
		size = "md",
	} = props;

	const handleCancel = () => {
		if (onCancel) {
			onCancel();
		}
		onClose();
	};

	const renderSpinner = () => {
		switch (animation) {
			case "pulse":
				return (
					<div className="flex space-x-1">
						<div className="h-3 w-3 animate-pulse rounded-full bg-primary" />
						<div
							className="h-3 w-3 animate-pulse rounded-full bg-primary"
							style={{ animationDelay: "0.1s" }}
						/>
						<div
							className="h-3 w-3 animate-pulse rounded-full bg-primary"
							style={{ animationDelay: "0.2s" }}
						/>
					</div>
				);

			case "bounce":
				return (
					<div className="flex space-x-1">
						<div className="h-3 w-3 animate-bounce rounded-full bg-primary" />
						<div
							className="h-3 w-3 animate-bounce rounded-full bg-primary"
							style={{ animationDelay: "0.1s" }}
						/>
						<div
							className="h-3 w-3 animate-bounce rounded-full bg-primary"
							style={{ animationDelay: "0.2s" }}
						/>
					</div>
				);

			case "bars":
				return (
					<div className="flex space-x-1">
						{[...Array(5)].map((_, i) => (
							<div
								key={i}
								className="h-6 w-1 animate-pulse bg-primary"
								style={{
									animationDelay: `${i * 0.1}s`,
									animationDuration: "1s",
								}}
							/>
						))}
					</div>
				);

			default:
				return (
					<div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
				);
		}
	};

	const sizeClasses = {
		sm: "w-4 h-4",
		md: "w-8 h-8",
		lg: "w-12 h-12",
	};

	return (
		<div className="p-8 text-center">
			{/* Cancel button for cancelable modals */}
			{cancelable && (
				<button
					type="button"
					onClick={handleCancel}
					className="absolute top-4 right-4 rounded-full p-1 transition-colors hover:bg-accent"
					aria-label="Cancel loading"
				>
					<X className="h-4 w-4" />
				</button>
			)}

			{/* Loading spinner */}
			<div className="mb-6 flex justify-center">{renderSpinner()}</div>

			{/* Title */}
			{title && <h3 className="mb-2 font-semibold text-lg">{title}</h3>}

			{/* Description */}
			{description && (
				<p className="mx-auto mb-6 max-w-sm text-muted-foreground text-sm leading-relaxed">
					{description}
				</p>
			)}

			{/* Progress bar */}
			{typeof progress === "number" && (
				<div className="space-y-2">
					<div className="h-2 w-full rounded-full bg-secondary">
						<div
							className="h-2 rounded-full bg-primary transition-all duration-500 ease-out"
							style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
						/>
					</div>

					{showPercentage && (
						<div className="text-muted-foreground text-sm">
							{Math.round(progress)}%
						</div>
					)}
				</div>
			)}

			{/* Indeterminate progress */}
			{progress === undefined && (
				<div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
					<div className="h-full animate-pulse bg-primary" />
				</div>
			)}

			{/* Cancel button at bottom for better UX */}
			{cancelable && (
				<div className="mt-6">
					<button
						type="button"
						onClick={handleCancel}
						className="rounded border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
					>
						Cancel
					</button>
				</div>
			)}
		</div>
	);
});
