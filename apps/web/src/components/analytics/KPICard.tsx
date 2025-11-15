"use client";

import type { LucideIcon } from "lucide-react";
import { TrendIndicator } from "./TrendIndicator";

interface KPICardProps {
	title: string;
	value: string | number;
	icon?: LucideIcon;
	trend?: {
		value: number;
		label?: string;
	};
	description?: string;
	className?: string;
}

export function KPICard({
	title,
	value,
	icon: Icon,
	trend,
	description,
	className = "",
}: KPICardProps) {
	return (
		<div
			className={`rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md ${className}`}
		>
			<div className="flex items-center justify-between">
				<p className="font-medium text-muted-foreground text-sm">{title}</p>
				{Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
			</div>
			<div className="mt-3">
				<p className="font-bold text-3xl">{value}</p>
				{description && (
					<p className="mt-1 text-muted-foreground text-sm">{description}</p>
				)}
			</div>
			{trend && (
				<div className="mt-4">
					<TrendIndicator
						value={trend.value}
						label={trend.label || "vs last period"}
					/>
				</div>
			)}
		</div>
	);
}
