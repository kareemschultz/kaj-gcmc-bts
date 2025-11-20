"use client";

import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
	Activity,
	BarChart3,
	Bookmark,
	Clock,
	Download,
	Filter,
	Layers,
	Maximize2,
	PieChartIcon,
	RefreshCw,
	Settings,
	Share,
	Target,
	TrendingDown,
	TrendingUp,
	Users,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ComposedChart,
	Funnel,
	FunnelChart,
	LabelList,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	RadialBar,
	RadialBarChart,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	Treemap,
	XAxis,
	YAxis,
} from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ChartType =
	| "line"
	| "area"
	| "bar"
	| "pie"
	| "radial"
	| "scatter"
	| "treemap"
	| "funnel"
	| "gantt"
	| "heatmap"
	| "gauge"
	| "sankey";

export interface ChartData {
	[key: string]: any;
}

export interface ChartConfig {
	title: string;
	subtitle?: string;
	type: ChartType;
	data: ChartData[];
	dataKeys: string[];
	colors: string[];
	realTime?: boolean;
	updateInterval?: number;
	height?: number;
	responsive?: boolean;
	drillDown?: boolean;
	exportable?: boolean;
	bookmarkable?: boolean;
	filterable?: boolean;
}

export interface InteractiveChartProps {
	config: ChartConfig;
	onDrillDown?: (data: any) => void;
	onFilter?: (filters: any) => void;
	onExport?: (format: "pdf" | "excel" | "png") => void;
	onBookmark?: (chartConfig: ChartConfig) => void;
	className?: string;
	delay?: number;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
	if (active && payload && payload.length) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className="min-w-[200px] rounded-lg border border-gray-200 bg-white/95 p-4 shadow-xl backdrop-blur-md"
			>
				<p className="mb-2 font-semibold text-gray-900">{label}</p>
				{payload.map((entry: any, index: number) => (
					<div key={index} className="flex items-center justify-between gap-4">
						<div className="flex items-center gap-2">
							<div
								className="h-3 w-3 rounded-full"
								style={{ backgroundColor: entry.color }}
							/>
							<span className="text-gray-600 text-sm">{entry.name}</span>
						</div>
						<span className="font-medium text-gray-900">
							{formatter ? formatter(entry.value, entry.name) : entry.value}
						</span>
					</div>
				))}
			</motion.div>
		);
	}
	return null;
};

// Chart Controls Component
const ChartControls = ({
	config,
	onRefresh,
	onFilter,
	onExport,
	onBookmark,
	isFullscreen,
	onToggleFullscreen,
}: {
	config: ChartConfig;
	onRefresh: () => void;
	onFilter: () => void;
	onExport: (format: "pdf" | "excel" | "png") => void;
	onBookmark: () => void;
	isFullscreen: boolean;
	onToggleFullscreen: () => void;
}) => (
	<div className="flex items-center gap-2">
		{config.realTime && (
			<Button
				size="sm"
				variant="ghost"
				onClick={onRefresh}
				className="h-8 w-8 p-0 hover:bg-gray-100"
			>
				<RefreshCw className="h-4 w-4" />
			</Button>
		)}

		{config.filterable && (
			<Button
				size="sm"
				variant="ghost"
				onClick={onFilter}
				className="h-8 w-8 p-0 hover:bg-gray-100"
			>
				<Filter className="h-4 w-4" />
			</Button>
		)}

		{config.exportable && (
			<div className="group relative">
				<Button
					size="sm"
					variant="ghost"
					className="h-8 w-8 p-0 hover:bg-gray-100"
				>
					<Download className="h-4 w-4" />
				</Button>
				<div className="absolute top-8 right-0 z-50 rounded-lg border border-gray-200 bg-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
					<div className="py-1">
						<button
							onClick={() => onExport("pdf")}
							className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
						>
							Export as PDF
						</button>
						<button
							onClick={() => onExport("png")}
							className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
						>
							Export as PNG
						</button>
						<button
							onClick={() => onExport("excel")}
							className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
						>
							Export as Excel
						</button>
					</div>
				</div>
			</div>
		)}

		{config.bookmarkable && (
			<Button
				size="sm"
				variant="ghost"
				onClick={onBookmark}
				className="h-8 w-8 p-0 hover:bg-gray-100"
			>
				<Bookmark className="h-4 w-4" />
			</Button>
		)}

		<Button
			size="sm"
			variant="ghost"
			onClick={onToggleFullscreen}
			className="h-8 w-8 p-0 hover:bg-gray-100"
		>
			<Maximize2 className="h-4 w-4" />
		</Button>
	</div>
);

// Real-time data update hook
const useRealTimeData = (initialData: ChartData[], interval = 5000) => {
	const [data, setData] = useState(initialData);

	useEffect(() => {
		if (interval > 0) {
			const timer = setInterval(() => {
				setData((prevData) =>
					prevData.map((item) => ({
						...item,
						value: Math.floor(Math.random() * 100) + 1,
						// Add some realistic variance
						...Object.keys(item).reduce((acc, key) => {
							if (typeof item[key] === "number" && key !== "value") {
								acc[key] = item[key] + (Math.random() - 0.5) * 10;
							}
							return acc;
						}, {} as any),
					})),
				);
			}, interval);

			return () => clearInterval(timer);
		}
	}, [interval]);

	return data;
};

// Chart Component Mapper
const ChartComponentMapper = ({
	config,
	data,
	onDrillDown,
}: {
	config: ChartConfig;
	data: ChartData[];
	onDrillDown?: (data: any) => void;
}) => {
	const handleClick = useCallback(
		(data: any) => {
			if (config.drillDown && onDrillDown) {
				onDrillDown(data);
			}
		},
		[config.drillDown, onDrillDown],
	);

	const commonProps = {
		data,
		margin: { top: 10, right: 30, left: 20, bottom: 5 },
	};

	switch (config.type) {
		case "line":
			return (
				<LineChart {...commonProps}>
					<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
					<XAxis
						dataKey={config.dataKeys[0]}
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 12, fill: "#6B7280" }}
					/>
					<YAxis
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 12, fill: "#6B7280" }}
					/>
					<Tooltip content={<CustomTooltip />} />
					<Legend />
					{config.dataKeys.slice(1).map((key, index) => (
						<Line
							key={key}
							type="monotone"
							dataKey={key}
							stroke={config.colors[index] || "#3B82F6"}
							strokeWidth={2}
							dot={{
								fill: config.colors[index] || "#3B82F6",
								strokeWidth: 2,
								r: 4,
							}}
							activeDot={{
								r: 6,
								stroke: config.colors[index] || "#3B82F6",
								strokeWidth: 2,
							}}
							onClick={handleClick}
						/>
					))}
				</LineChart>
			);

		case "area":
			return (
				<AreaChart {...commonProps}>
					<defs>
						{config.dataKeys.slice(1).map((key, index) => (
							<linearGradient
								key={key}
								id={`gradient-${key}`}
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor={config.colors[index] || "#3B82F6"}
									stopOpacity={0.3}
								/>
								<stop
									offset="95%"
									stopColor={config.colors[index] || "#3B82F6"}
									stopOpacity={0.01}
								/>
							</linearGradient>
						))}
					</defs>
					<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
					<XAxis
						dataKey={config.dataKeys[0]}
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 12, fill: "#6B7280" }}
					/>
					<YAxis
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 12, fill: "#6B7280" }}
					/>
					<Tooltip content={<CustomTooltip />} />
					<Legend />
					{config.dataKeys.slice(1).map((key, index) => (
						<Area
							key={key}
							type="monotone"
							dataKey={key}
							stroke={config.colors[index] || "#3B82F6"}
							strokeWidth={2}
							fill={`url(#gradient-${key})`}
							onClick={handleClick}
						/>
					))}
				</AreaChart>
			);

		case "bar":
			return (
				<BarChart {...commonProps}>
					<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
					<XAxis
						dataKey={config.dataKeys[0]}
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 12, fill: "#6B7280" }}
					/>
					<YAxis
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 12, fill: "#6B7280" }}
					/>
					<Tooltip content={<CustomTooltip />} />
					<Legend />
					{config.dataKeys.slice(1).map((key, index) => (
						<Bar
							key={key}
							dataKey={key}
							fill={config.colors[index] || "#3B82F6"}
							radius={[4, 4, 0, 0]}
							onClick={handleClick}
						/>
					))}
				</BarChart>
			);

		case "pie":
			return (
				<PieChart>
					<Pie
						data={data}
						cx="50%"
						cy="50%"
						outerRadius={100}
						fill="#8884d8"
						dataKey={config.dataKeys[1] || "value"}
						onClick={handleClick}
					>
						{data.map((entry, index) => (
							<Cell
								key={`cell-${index}`}
								fill={config.colors[index % config.colors.length] || "#3B82F6"}
							/>
						))}
					</Pie>
					<Tooltip content={<CustomTooltip />} />
					<Legend />
				</PieChart>
			);

		case "radial":
			return (
				<RadialBarChart
					cx="50%"
					cy="50%"
					innerRadius="20%"
					outerRadius="80%"
					data={data}
				>
					<RadialBar
						dataKey={config.dataKeys[1] || "value"}
						cornerRadius={10}
						fill="#8884d8"
						onClick={handleClick}
					/>
					<Tooltip content={<CustomTooltip />} />
					<Legend />
				</RadialBarChart>
			);

		case "funnel":
			return (
				<FunnelChart>
					<Tooltip content={<CustomTooltip />} />
					<Funnel
						dataKey={config.dataKeys[1] || "value"}
						data={data}
						onClick={handleClick}
					>
						<LabelList position="center" fill="#fff" stroke="none" />
					</Funnel>
				</FunnelChart>
			);

		default:
			return (
				<div className="flex h-full items-center justify-center">
					Unsupported chart type
				</div>
			);
	}
};

// Main Interactive Chart Component
export function InteractiveChart({
	config,
	onDrillDown,
	onFilter,
	onExport,
	onBookmark,
	className,
	delay = 0,
}: InteractiveChartProps) {
	const chartRef = useRef<HTMLDivElement>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Use real-time data if enabled
	const data = useRealTimeData(
		config.data,
		config.realTime ? config.updateInterval || 5000 : 0,
	);

	const handleRefresh = useCallback(() => {
		setIsRefreshing(true);
		// Simulate data refresh
		setTimeout(() => setIsRefreshing(false), 1000);
		toast.success("Chart data refreshed");
	}, []);

	const handleFilter = useCallback(() => {
		onFilter?.({});
		toast.info("Filters applied");
	}, [onFilter]);

	const handleExport = useCallback(
		async (format: "pdf" | "excel" | "png") => {
			if (!chartRef.current) return;

			try {
				if (format === "png") {
					const canvas = await html2canvas(chartRef.current);
					const link = document.createElement("a");
					link.download = `${config.title.toLowerCase().replace(/\s+/g, "-")}.png`;
					link.href = canvas.toDataURL();
					link.click();
				} else if (format === "pdf") {
					const canvas = await html2canvas(chartRef.current);
					const pdf = new jsPDF();
					const imgData = canvas.toDataURL("image/png");
					pdf.addImage(imgData, "PNG", 10, 10, 190, 100);
					pdf.save(`${config.title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
				}

				toast.success(`Chart exported as ${format.toUpperCase()}`);
			} catch (error) {
				toast.error("Failed to export chart");
			}
		},
		[config.title],
	);

	const handleBookmark = useCallback(() => {
		onBookmark?.(config);
		toast.success("Chart bookmarked");
	}, [config, onBookmark]);

	const handleToggleFullscreen = useCallback(() => {
		setIsFullscreen(!isFullscreen);
	}, [isFullscreen]);

	const chartHeight = config.height || 300;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, delay }}
			className={cn(
				"relative",
				isFullscreen && "fixed inset-0 z-50 bg-white p-6",
				className,
			)}
		>
			<Card
				ref={chartRef}
				className={cn(
					"bg-gradient-to-br from-white to-gray-50/50",
					"dark:from-gray-900 dark:to-gray-800/50",
					"border-0 shadow-lg ring-1 ring-gray-200/50",
					"overflow-hidden dark:ring-gray-700/50",
					isFullscreen && "h-full",
				)}
			>
				<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
					<div className="space-y-1">
						<CardTitle className="font-semibold text-lg">
							{config.title}
						</CardTitle>
						{config.subtitle && (
							<p className="text-muted-foreground text-sm">{config.subtitle}</p>
						)}
					</div>

					<ChartControls
						config={config}
						onRefresh={handleRefresh}
						onFilter={handleFilter}
						onExport={handleExport}
						onBookmark={handleBookmark}
						isFullscreen={isFullscreen}
						onToggleFullscreen={handleToggleFullscreen}
					/>
				</CardHeader>

				<CardContent>
					<div
						className={cn(
							"relative transition-all duration-300",
							isRefreshing && "opacity-50",
						)}
						style={{
							height: isFullscreen ? "calc(100vh - 200px)" : chartHeight,
						}}
					>
						<ResponsiveContainer width="100%" height="100%">
							<ChartComponentMapper
								config={config}
								data={data}
								onDrillDown={onDrillDown}
							/>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>

			{/* Fullscreen overlay */}
			<AnimatePresence>
				{isFullscreen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-40 bg-black/20"
						onClick={handleToggleFullscreen}
					/>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

// Chart Grid Component
export function InteractiveChartGrid({
	charts,
	columns = 2,
	gap = 6,
}: {
	charts: ChartConfig[];
	columns?: number;
	gap?: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className={cn(
				"grid gap-6",
				columns === 1 && "grid-cols-1",
				columns === 2 && "grid-cols-1 lg:grid-cols-2",
				columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
				columns === 4 &&
					"grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
			)}
			style={{ gap: `${gap * 0.25}rem` }}
		>
			{charts.map((chart, index) => (
				<InteractiveChart
					key={chart.title}
					config={chart}
					delay={index * 0.1}
				/>
			))}
		</motion.div>
	);
}
