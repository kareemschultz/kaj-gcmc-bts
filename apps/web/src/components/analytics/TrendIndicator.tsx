"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface TrendIndicatorProps {
	value: number;
	label?: string;
	showIcon?: boolean;
	className?: string;
}

export function TrendIndicator({
	value,
	label,
	showIcon = true,
	className = "",
}: TrendIndicatorProps) {
	const isPositive = value > 0;
	const isNeutral = value === 0;

	const colorClass = isNeutral
		? "text-muted-foreground"
		: isPositive
			? "text-green-600 dark:text-green-500"
			: "text-red-600 dark:text-red-500";

	const Icon = isNeutral ? Minus : isPositive ? ArrowUp : ArrowDown;

	return (
		<div
			className={`flex items-center gap-1 text-sm ${colorClass} ${className}`}
		>
			{showIcon && <Icon className="h-4 w-4" />}
			<span className="font-medium">
				{isPositive && "+"}
				{value.toFixed(1)}%
			</span>
			{label && <span className="text-muted-foreground">{label}</span>}
		</div>
	);
}
