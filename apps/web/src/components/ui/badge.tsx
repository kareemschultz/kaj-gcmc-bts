import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-3 py-1 font-medium text-xs transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-brand-600 text-white shadow-sm hover:bg-brand-700",
				secondary:
					"border-transparent bg-secondary text-secondary-foreground hover:bg-brand-200",
				destructive:
					"border-transparent bg-error text-white shadow-sm hover:bg-error/90",
				outline: "border-border text-foreground hover:bg-muted",
				success:
					"border-transparent bg-accent-600 text-white shadow-sm hover:bg-accent-700",
				warning:
					"border-transparent bg-warning text-white shadow-sm hover:bg-warning/90",
				info: "border-transparent bg-info text-white shadow-sm hover:bg-info/90",
				compliant:
					"border-transparent bg-accent-100 text-accent-900 dark:bg-accent-900/30 dark:text-accent-300",
				pending:
					"border-transparent bg-warning/10 text-warning dark:bg-warning/20",
				nonCompliant:
					"border-transparent bg-error/10 text-error dark:bg-error/20",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
