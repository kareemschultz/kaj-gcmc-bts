import { motion } from "framer-motion";
import { Minus, MoreHorizontal, TrendingDown, TrendingUp } from "lucide-react";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { brandColors, dashboardColors } from "@/styles/brand";

interface ChartContainerProps {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
	className?: string;
	height?: number | string;
	loading?: boolean;
	error?: string;
	trend?: {
		value: number;
		positive: boolean;
		period?: string;
	};
	actions?: React.ReactNode;
	fullWidth?: boolean;
}

export function ChartContainer({
	title,
	subtitle,
	children,
	className,
	height = 300,
	loading = false,
	error,
	trend,
	actions,
	fullWidth = false,
}: ChartContainerProps) {
	if (loading) {
		return (
			<div
				className={cn("rounded-lg border bg-white p-6 shadow-sm", className)}
			>
				<div className="animate-pulse space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<div className="mb-2 h-6 w-48 rounded bg-gray-200" />
							{subtitle && <div className="h-4 w-32 rounded bg-gray-200" />}
						</div>
						{trend && <div className="h-6 w-20 rounded bg-gray-200" />}
					</div>
					<div
						className="rounded bg-gray-200"
						style={{
							height: typeof height === "number" ? `${height}px` : height,
						}}
					/>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div
				className={cn("rounded-lg border bg-white p-6 shadow-sm", className)}
			>
				<div className="py-8 text-center">
					<div className="mb-2 text-red-500">⚠️</div>
					<p className="font-medium text-gray-500">Failed to load chart</p>
					<p className="mt-1 text-gray-400 text-sm">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className={cn("rounded-lg border bg-white p-6 shadow-sm", className)}
		>
			{/* Header */}
			<div className="mb-6 flex items-start justify-between">
				<div className="flex-1">
					<h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
					{subtitle && <p className="mt-1 text-gray-600 text-sm">{subtitle}</p>}
				</div>

				<div className="flex items-center gap-3">
					{/* Trend Indicator */}
					{trend && (
						<motion.div
							initial={{ opacity: 0, x: 10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
							className={cn(
								"flex items-center gap-1 rounded-full px-2 py-1 font-medium text-sm",
								trend.positive
									? "bg-green-100 text-green-700"
									: "bg-red-100 text-red-700",
							)}
						>
							{trend.positive ? (
								<TrendingUp className="h-4 w-4" />
							) : trend.value === 0 ? (
								<Minus className="h-4 w-4" />
							) : (
								<TrendingDown className="h-4 w-4" />
							)}
							<span>
								{trend.value > 0 ? "+" : ""}
								{trend.value}%
							</span>
							{trend.period && (
								<span className="text-xs opacity-75">vs {trend.period}</span>
							)}
						</motion.div>
					)}

					{/* Actions */}
					{actions || (
						<button className="p-1 text-gray-400 transition-colors hover:text-gray-600">
							<MoreHorizontal className="h-5 w-5" />
						</button>
					)}
				</div>
			</div>

			{/* Chart Content */}
			<div
				className={cn("w-full", fullWidth && "mx-0")}
				style={{ height: typeof height === "number" ? `${height}px` : height }}
			>
				<ResponsiveContainer width="100%" height="100%">
					{children}
				</ResponsiveContainer>
			</div>
		</motion.div>
	);
}

// Predefined chart color schemes
export const chartColorSchemes = {
	default: [
		brandColors.primary[500],
		brandColors.accent[500],
		brandColors.warning[500],
		brandColors.danger[500],
		brandColors.gray[400],
		brandColors.primary[300],
		brandColors.accent[300],
	],
	compliance: [
		"#22c55e", // Excellent
		"#84cc16", // Good
		"#f59e0b", // Fair
		"#ef4444", // Poor
	],
	revenue: [
		businessColors.revenue.positive,
		businessColors.revenue.neutral,
		businessColors.revenue.negative,
	],
	status: [
		dashboardColors.status.online,
		dashboardColors.status.processing,
		dashboardColors.status.pending,
		dashboardColors.status.offline,
	],
	gradient: [
		"rgba(59, 130, 246, 0.8)",
		"rgba(34, 197, 94, 0.8)",
		"rgba(245, 158, 11, 0.8)",
		"rgba(239, 68, 68, 0.8)",
		"rgba(107, 114, 128, 0.8)",
	],
};

// Chart wrapper components for specific use cases
export function ComplianceChart({
	title,
	children,
	className,
	...props
}: Omit<ChartContainerProps, "children"> & { children: React.ReactNode }) {
	return (
		<ChartContainer
			title={title}
			className={cn("border-l-4 border-l-green-500", className)}
			{...props}
		>
			{children}
		</ChartContainer>
	);
}

export function RevenueChart({
	title,
	children,
	className,
	...props
}: Omit<ChartContainerProps, "children"> & { children: React.ReactNode }) {
	return (
		<ChartContainer
			title={title}
			className={cn("border-l-4 border-l-blue-500", className)}
			{...props}
		>
			{children}
		</ChartContainer>
	);
}

export function ActivityChart({
	title,
	children,
	className,
	...props
}: Omit<ChartContainerProps, "children"> & { children: React.ReactNode }) {
	return (
		<ChartContainer
			title={title}
			className={cn("border-l-4 border-l-purple-500", className)}
			{...props}
		>
			{children}
		</ChartContainer>
	);
}

// Chart grid layout component
export function ChartGrid({
	children,
	columns = 2,
	gap = 6,
	className,
}: {
	children: React.ReactNode;
	columns?: 1 | 2 | 3 | 4;
	gap?: number;
	className?: string;
}) {
	const columnClasses = {
		1: "grid-cols-1",
		2: "grid-cols-1 lg:grid-cols-2",
		3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
		4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
	};

	const gapClass = `gap-${gap}`;

	return (
		<div className={cn("grid", columnClasses[columns], gapClass, className)}>
			{children}
		</div>
	);
}

// Chart legend component
export function ChartLegend({
	items,
	className,
	orientation = "horizontal",
}: {
	items: Array<{
		label: string;
		color: string;
		value?: string | number;
	}>;
	className?: string;
	orientation?: "horizontal" | "vertical";
}) {
	return (
		<div
			className={cn(
				"flex gap-4",
				orientation === "vertical" ? "flex-col" : "flex-wrap",
				className,
			)}
		>
			{items.map((item, index) => (
				<motion.div
					key={item.label}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: index * 0.1 }}
					className="flex items-center gap-2"
				>
					<div
						className="h-3 w-3 rounded-full"
						style={{ backgroundColor: item.color }}
					/>
					<span className="text-gray-600 text-sm">{item.label}</span>
					{item.value && (
						<span className="font-medium text-gray-900 text-sm">
							{item.value}
						</span>
					)}
				</motion.div>
			))}
		</div>
	);
}

// Chart tooltip customization
export const customTooltipStyle = {
	backgroundColor: "white",
	border: "1px solid #e5e7eb",
	borderRadius: "8px",
	boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
	padding: "12px",
	fontSize: "14px",
	fontWeight: "500",
};

export const customTooltipProps = {
	contentStyle: customTooltipStyle,
	labelStyle: {
		color: "#374151",
		fontWeight: "600",
		marginBottom: "4px",
	},
	itemStyle: {
		color: "#6b7280",
	},
};
