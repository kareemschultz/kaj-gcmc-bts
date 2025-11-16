import type * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps extends React.ComponentProps<"div"> {
	icon?: React.ReactNode;
	title: string;
	description?: string;
	action?: {
		label: string;
		onClick: () => void;
		variant?:
			| "default"
			| "destructive"
			| "outline"
			| "secondary"
			| "ghost"
			| "link";
	};
}

function EmptyState({
	className,
	icon,
	title,
	description,
	action,
	...props
}: EmptyStateProps) {
	return (
		<div
			data-slot="empty-state"
			className={cn(
				"flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center sm:p-12",
				className,
			)}
			{...props}
		>
			{icon && (
				<div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
					{icon}
				</div>
			)}
			<h3 className="mb-2 font-semibold text-lg">{title}</h3>
			{description && (
				<p className="mb-6 max-w-md text-muted-foreground text-sm">
					{description}
				</p>
			)}
			{action && (
				<Button variant={action.variant || "default"} onClick={action.onClick}>
					{action.label}
				</Button>
			)}
		</div>
	);
}

export { EmptyState };
