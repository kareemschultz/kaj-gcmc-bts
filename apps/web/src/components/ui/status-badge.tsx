"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
	"inline-flex items-center rounded-full px-2.5 py-1 font-semibold text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
	{
		variants: {
			variant: {
				default: "bg-primary/10 text-primary hover:bg-primary/20",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
				success:
					"bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
				warning:
					"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
				destructive:
					"bg-destructive/10 text-destructive hover:bg-destructive/20",
				outline:
					"border border-input bg-background hover:bg-accent hover:text-accent-foreground",
				active:
					"bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
				pending:
					"bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
				completed:
					"bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
				overdue: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
			},
			size: {
				default: "px-2.5 py-1 text-xs",
				sm: "px-2 py-0.5 text-xs",
				lg: "px-3 py-1.5 text-sm",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface StatusBadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof statusBadgeVariants> {
	icon?: React.ReactNode;
	pulse?: boolean;
}

function StatusBadge({
	className,
	variant,
	size,
	icon,
	pulse = false,
	children,
	...props
}: StatusBadgeProps) {
	return (
		<div
			className={cn(
				statusBadgeVariants({ variant, size }),
				pulse && "animate-pulse",
				className,
			)}
			{...props}
		>
			{icon && <span className="mr-1.5 flex-shrink-0">{icon}</span>}
			{children}
		</div>
	);
}

export { StatusBadge, statusBadgeVariants };
