"use client";

import type * as React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
	title?: string;
	description?: string;
	icon?: React.ReactNode;
	gradient?: "primary" | "secondary" | "accent" | "custom";
	children?: React.ReactNode;
}

const gradientVariants = {
	primary: "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
	secondary: "bg-gradient-to-br from-secondary via-secondary/50 to-transparent",
	accent: "bg-gradient-to-br from-accent via-accent/50 to-transparent",
	custom: "",
};

export function GradientCard({
	title,
	description,
	icon,
	gradient = "primary",
	children,
	className,
	...props
}: GradientCardProps) {
	return (
		<Card
			className={cn(
				"relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl",
				gradientVariants[gradient],
				className,
			)}
			{...props}
		>
			{/* Subtle background pattern */}
			<div className="absolute inset-0 bg-[size:20px_20px] bg-grid-white/[0.02]" />

			{/* Glow effect */}
			<div className="-top-40 -right-40 absolute h-80 w-80 rounded-full bg-primary/5 blur-3xl" />

			<div className="relative">
				{(title || description || icon) && (
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<div>
								{title && (
									<CardTitle className="font-semibold text-lg tracking-tight">
										{title}
									</CardTitle>
								)}
								{description && (
									<CardDescription className="font-medium text-sm">
										{description}
									</CardDescription>
								)}
							</div>
							{icon && (
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/80 shadow-sm backdrop-blur-sm">
									{icon}
								</div>
							)}
						</div>
					</CardHeader>
				)}
				{children && <CardContent>{children}</CardContent>}
			</div>
		</Card>
	);
}
