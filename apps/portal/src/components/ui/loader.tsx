import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const loaderVariants = cva(
	"inline-block animate-spin rounded-full border-current border-r-transparent border-solid align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
	{
		variants: {
			size: {
				sm: "size-4 border-2",
				md: "size-8 border-2",
				lg: "size-12 border-[3px]",
			},
			variant: {
				primary: "text-primary",
				secondary: "text-muted-foreground",
				white: "text-white",
			},
		},
		defaultVariants: {
			size: "md",
			variant: "primary",
		},
	},
);

interface LoaderProps
	extends React.ComponentProps<"div">,
		VariantProps<typeof loaderVariants> {
	label?: string;
	fullScreen?: boolean;
}

function Loader({
	className,
	size,
	variant,
	label,
	fullScreen = false,
	...props
}: LoaderProps) {
	const spinner = (
		<>
			{/* biome-ignore lint/a11y/useSemanticElements: role="status" is the correct ARIA pattern for loading indicators */}
			<div
				role="status"
				aria-label={label || "Loading"}
				className={cn(loaderVariants({ size, variant }), className)}
				{...props}
			>
				<span className="sr-only">{label || "Loading..."}</span>
			</div>
			{label && <p className="mt-3 text-muted-foreground text-sm">{label}</p>}
		</>
	);

	if (fullScreen) {
		return (
			<div
				data-slot="loader-fullscreen"
				className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
			>
				{spinner}
			</div>
		);
	}

	return (
		<div
			data-slot="loader"
			className="flex flex-col items-center justify-center"
		>
			{spinner}
		</div>
	);
}

export { Loader, loaderVariants };
