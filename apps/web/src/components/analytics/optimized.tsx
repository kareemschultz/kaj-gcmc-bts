/**
 * Optimized Analytics Components
 *
 * High-performance analytics components with data visualization
 * Using Recharts with our enhanced brand system
 */

import { AnimatePresence, motion } from "framer-motion";
import {
	CalendarIcon,
	Download,
	Minus,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ChartContainer,
	customTooltipProps,
} from "@/components/ui/chart-container";
import { cn } from "@/lib/utils";
import { brandColors, chartColorSchemes } from "@/styles/brand";

// KPI Card Component
export interface KPICardProps {
	title: string;
	value: string | number;
	icon: React.ComponentType<{ className?: string }>;
	trend?: number;
	subtitle?: string;
	className?: string;
}

export function KPICard({
	title,
	value,
	icon: Icon,
	trend,
	subtitle,
	className,
}: KPICardProps) {
	const getTrendIcon = () => {
		if (trend === undefined) return null;
		if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
		if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
		return <Minus className="h-4 w-4 text-gray-400" />;
	};

	const getTrendColor = () => {
		if (trend === undefined) return "text-gray-500";
		if (trend > 0) return "text-green-600";
		if (trend < 0) return "text-red-600";
		return "text-gray-500";
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className={cn(className)}
		>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-muted-foreground text-sm">
						{title}
					</CardTitle>
					<Icon className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{value}</div>
					<div className="mt-1 flex items-center justify-between">
						{subtitle && (
							<p className="text-muted-foreground text-xs">{subtitle}</p>
						)}
						{trend !== undefined && (
							<div className={cn("flex items-center text-xs", getTrendColor())}>
								{getTrendIcon()}
								<span className="ml-1">{Math.abs(trend)}%</span>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}

// Bar Chart Component
export interface BarChartProps {
	data: Array<Record<string, any>>;
	xAxisKey: string;
	yAxisKey: string;
	title?: string;
	height?: number;
	color?: string;
	className?: string;
}

export function BarChartComponent({
	data,
	xAxisKey,
	yAxisKey,
	title,
	height = 300,
	color = brandColors.primary[500],
	className,
}: BarChartProps) {
	return (
		<div className={cn("w-full", className)} style={{ height }}>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={data}
					margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
				>
					<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
					<XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} stroke="#666" />
					<YAxis tick={{ fontSize: 12 }} stroke="#666" />
					<Tooltip {...customTooltipProps} />
					<Legend />
					<Bar
						dataKey={yAxisKey}
						fill={color}
						radius={[4, 4, 0, 0]}
						name={title || yAxisKey}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

// Pie Chart Component
export interface PieChartProps {
	data: Array<{ name: string; value: number; color?: string }>;
	title?: string;
	height?: number;
	showLabels?: boolean;
	className?: string;
}

export function PieChartComponent({
	data,
	title,
	height = 300,
	showLabels = true,
	className,
}: PieChartProps) {
	const colors = chartColorSchemes.default;

	const dataWithColors = data.map((item, index) => ({
		...item,
		color: item.color || colors[index % colors.length],
	}));

	const RADIAN = Math.PI / 180;
	const renderCustomizedLabel = ({
		cx,
		cy,
		midAngle,
		innerRadius,
		outerRadius,
		percent,
		name,
	}: any) => {
		if (!showLabels || percent < 0.05) return null; // Don't show labels for slices < 5%

		const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
		const x = cx + radius * Math.cos(-midAngle * RADIAN);
		const y = cy + radius * Math.sin(-midAngle * RADIAN);

		return (
			<text
				x={x}
				y={y}
				fill="white"
				textAnchor={x > cx ? "start" : "end"}
				dominantBaseline="central"
				fontSize={12}
				fontWeight="500"
			>
				{`${(percent * 100).toFixed(0)}%`}
			</text>
		);
	};

	return (
		<div className={cn("w-full", className)} style={{ height }}>
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie
						data={dataWithColors}
						cx="50%"
						cy="50%"
						labelLine={false}
						label={renderCustomizedLabel}
						outerRadius={Math.min(height * 0.35, 100)}
						fill="#8884d8"
						dataKey="value"
					>
						{dataWithColors.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={entry.color} />
						))}
					</Pie>
					<Tooltip {...customTooltipProps} />
					<Legend />
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}

// Line Chart Component
export interface LineChartProps {
	data: Array<Record<string, any>>;
	xAxisKey: string;
	yAxisKey: string;
	title?: string;
	height?: number;
	color?: string;
	area?: boolean;
	className?: string;
}

export function LineChartComponent({
	data,
	xAxisKey,
	yAxisKey,
	title,
	height = 300,
	color = brandColors.primary[500],
	area = false,
	className,
}: LineChartProps) {
	const ChartComponent = area ? AreaChart : LineChart;

	return (
		<div className={cn("w-full", className)} style={{ height }}>
			<ResponsiveContainer width="100%" height="100%">
				<ChartComponent
					data={data}
					margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
				>
					<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
					<XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} stroke="#666" />
					<YAxis tick={{ fontSize: 12 }} stroke="#666" />
					<Tooltip {...customTooltipProps} />
					<Legend />
					{area ? (
						<Area
							type="monotone"
							dataKey={yAxisKey}
							stroke={color}
							fill={`${color}20`}
							strokeWidth={2}
							name={title || yAxisKey}
						/>
					) : (
						<Line
							type="monotone"
							dataKey={yAxisKey}
							stroke={color}
							strokeWidth={2}
							dot={{ fill: color, r: 4 }}
							name={title || yAxisKey}
						/>
					)}
				</ChartComponent>
			</ResponsiveContainer>
		</div>
	);
}

// Date Range Picker Component
export interface DateRangePickerProps {
	value: { startDate?: string; endDate?: string };
	onChange: (range: { startDate?: string; endDate?: string }) => void;
	className?: string;
}

export function DateRangePicker({
	value,
	onChange,
	className,
}: DateRangePickerProps) {
	const [isOpen, setIsOpen] = useState(false);

	const quickRanges = [
		{
			label: "Last 7 days",
			getValue: () => ({
				startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
					.toISOString()
					.split("T")[0],
				endDate: new Date().toISOString().split("T")[0],
			}),
		},
		{
			label: "Last 30 days",
			getValue: () => ({
				startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
					.toISOString()
					.split("T")[0],
				endDate: new Date().toISOString().split("T")[0],
			}),
		},
		{
			label: "Last 90 days",
			getValue: () => ({
				startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
					.toISOString()
					.split("T")[0],
				endDate: new Date().toISOString().split("T")[0],
			}),
		},
		{
			label: "This year",
			getValue: () => ({
				startDate: new Date(new Date().getFullYear(), 0, 1)
					.toISOString()
					.split("T")[0],
				endDate: new Date().toISOString().split("T")[0],
			}),
		},
	];

	const formatDateRange = () => {
		if (!value.startDate && !value.endDate) return "Select date range";
		if (value.startDate === value.endDate) return value.startDate;
		return `${value.startDate || ""} - ${value.endDate || ""}`;
	};

	return (
		<div className={cn("relative", className)}>
			<Button
				variant="outline"
				onClick={() => setIsOpen(!isOpen)}
				className="w-[240px] justify-start text-left font-normal"
			>
				<CalendarIcon className="mr-2 h-4 w-4" />
				{formatDateRange()}
			</Button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						className="absolute right-0 z-50 mt-2 w-64 rounded-lg border bg-white p-4 shadow-lg"
					>
						<div className="space-y-2">
							<h4 className="font-medium text-sm">Quick ranges</h4>
							{quickRanges.map((range) => (
								<button
									key={range.label}
									onClick={() => {
										onChange(range.getValue());
										setIsOpen(false);
									}}
									className="w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100"
								>
									{range.label}
								</button>
							))}
						</div>

						<div className="mt-4 border-t pt-4">
							<h4 className="mb-2 font-medium text-sm">Custom range</h4>
							<div className="space-y-2">
								<input
									type="date"
									value={value.startDate || ""}
									onChange={(e) =>
										onChange({ ...value, startDate: e.target.value })
									}
									className="w-full rounded border px-3 py-2 text-sm"
								/>
								<input
									type="date"
									value={value.endDate || ""}
									onChange={(e) =>
										onChange({ ...value, endDate: e.target.value })
									}
									className="w-full rounded border px-3 py-2 text-sm"
								/>
							</div>
						</div>

						<div className="mt-4 flex justify-between border-t pt-4">
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									onChange({ startDate: "", endDate: "" });
									setIsOpen(false);
								}}
							>
								Clear
							</Button>
							<Button size="sm" onClick={() => setIsOpen(false)}>
								Done
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// Export Button Component
export interface ExportButtonProps {
	data: Array<Record<string, any>>;
	chartRef?: React.RefObject<HTMLElement>;
	filename?: string;
	className?: string;
}

export function ExportButton({
	data,
	chartRef,
	filename = "analytics-export",
	className,
}: ExportButtonProps) {
	const [isExporting, setIsExporting] = useState(false);

	const exportToCSV = () => {
		if (!data.length) return;

		const headers = Object.keys(data[0]).join(",");
		const rows = data.map((row) =>
			Object.values(row)
				.map((value) =>
					typeof value === "string" && value.includes(",")
						? `"${value}"`
						: value,
				)
				.join(","),
		);

		const csvContent = [headers, ...rows].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${filename}.csv`;
		a.click();
		window.URL.revokeObjectURL(url);
	};

	const exportToPNG = async () => {
		if (!chartRef?.current) return;

		setIsExporting(true);
		try {
			// Simple implementation - in production, you'd use html2canvas or similar
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (ctx) {
				canvas.width = 1200;
				canvas.height = 800;
				ctx.fillStyle = "white";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.fillStyle = "black";
				ctx.font = "24px Arial";
				ctx.fillText("Analytics Export", 50, 50);
				ctx.fillText(`Generated: ${new Date().toLocaleString()}`, 50, 100);

				// Convert to blob and download
				canvas.toBlob((blob) => {
					if (blob) {
						const url = window.URL.createObjectURL(blob);
						const a = document.createElement("a");
						a.href = url;
						a.download = `${filename}.png`;
						a.click();
						window.URL.revokeObjectURL(url);
					}
				});
			}
		} catch (error) {
			console.error("Export failed:", error);
		} finally {
			setIsExporting(false);
		}
	};

	const exportToJSON = () => {
		const jsonData = {
			exportDate: new Date().toISOString(),
			data,
		};

		const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
			type: "application/json",
		});
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${filename}.json`;
		a.click();
		window.URL.revokeObjectURL(url);
	};

	return (
		<div className={cn("relative", className)}>
			<Button
				variant="outline"
				size="sm"
				onClick={exportToCSV}
				disabled={isExporting || !data.length}
				className="flex items-center gap-2"
			>
				<Download className="h-4 w-4" />
				{isExporting ? "Exporting..." : "Export CSV"}
			</Button>
		</div>
	);
}

// Trend Indicator Component
export interface TrendIndicatorProps {
	value: number;
	threshold?: number;
	format?: (value: number) => string;
	className?: string;
}

export function TrendIndicator({
	value,
	threshold = 0,
	format = (v) => v.toFixed(1),
	className,
}: TrendIndicatorProps) {
	const isPositive = value > threshold;
	const isNeutral = value === threshold;

	return (
		<div className={cn("flex items-center text-sm", className)}>
			{isNeutral ? (
				<Minus className="mr-1 h-4 w-4 text-gray-400" />
			) : isPositive ? (
				<TrendingUp className="mr-1 h-4 w-4 text-green-500" />
			) : (
				<TrendingDown className="mr-1 h-4 w-4 text-red-500" />
			)}
			<span
				className={cn(
					"font-medium",
					isNeutral
						? "text-gray-500"
						: isPositive
							? "text-green-600"
							: "text-red-600",
				)}
			>
				{format(Math.abs(value - threshold))}
				{!isNeutral && (isPositive ? " above" : " below")} target
			</span>
		</div>
	);
}

// Analytics Grid Component for consistent layout
export function AnalyticsGrid({
	children,
	columns = 2,
	className,
}: {
	children: React.ReactNode;
	columns?: 1 | 2 | 3 | 4;
	className?: string;
}) {
	const gridClasses = {
		1: "grid-cols-1",
		2: "grid-cols-1 md:grid-cols-2",
		3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
		4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
	};

	return (
		<div className={cn("grid gap-4", gridClasses[columns], className)}>
			{children}
		</div>
	);
}
