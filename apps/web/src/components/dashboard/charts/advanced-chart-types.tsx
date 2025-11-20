"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Activity,
	AlertTriangle,
	BarChart3,
	Calendar,
	CheckCircle,
	Clock,
	Filter,
	Layers,
	Maximize2,
	Pause,
	Play,
	SkipForward,
	Target,
	TrendingUp,
	Users,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Area,
	Bar,
	CartesianGrid,
	Cell,
	ComposedChart,
	Funnel,
	FunnelChart,
	LabelList,
	Legend,
	Line,
	ReferenceLine,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	Treemap,
	XAxis,
	YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Advanced Chart Data Types
export interface GanttData {
	tasks: {
		id: string;
		name: string;
		startDate: Date;
		endDate: Date;
		progress: number;
		assignee: string;
		priority: "low" | "medium" | "high" | "critical";
		dependencies: string[];
		status: "not_started" | "in_progress" | "completed" | "blocked";
	}[];
	milestones: {
		id: string;
		name: string;
		date: Date;
		completed: boolean;
	}[];
}

export interface HeatMapData {
	data: {
		x: string;
		y: string;
		value: number;
		category?: string;
	}[];
	xLabels: string[];
	yLabels: string[];
	colorScale: { min: string; max: string };
}

export interface SankeyData {
	nodes: { id: string; name: string; category: string }[];
	links: { source: string; target: string; value: number }[];
}

export interface GaugeData {
	value: number;
	min: number;
	max: number;
	target?: number;
	zones: { min: number; max: number; color: string; label: string }[];
	title: string;
	unit: string;
}

export interface FunnelData {
	stages: {
		name: string;
		value: number;
		percentage: number;
		color: string;
	}[];
	title: string;
	conversionRates: { stage: string; rate: number }[];
}

export interface TreemapData {
	data: {
		name: string;
		value: number;
		children?: TreemapData["data"];
		color?: string;
		category?: string;
	}[];
	title: string;
}

// Mock data generators
const generateGanttData = (): GanttData => ({
	tasks: [
		{
			id: "1",
			name: "Tax Filing Q1",
			startDate: new Date("2024-01-01"),
			endDate: new Date("2024-03-15"),
			progress: 85,
			assignee: "John Smith",
			priority: "high",
			dependencies: [],
			status: "in_progress",
		},
		{
			id: "2",
			name: "Compliance Audit",
			startDate: new Date("2024-02-01"),
			endDate: new Date("2024-04-30"),
			progress: 45,
			assignee: "Sarah Johnson",
			priority: "critical",
			dependencies: ["1"],
			status: "in_progress",
		},
		{
			id: "3",
			name: "Client Onboarding",
			startDate: new Date("2024-01-15"),
			endDate: new Date("2024-02-15"),
			progress: 100,
			assignee: "Mike Davis",
			priority: "medium",
			dependencies: [],
			status: "completed",
		},
		{
			id: "4",
			name: "Immigration Processing",
			startDate: new Date("2024-03-01"),
			endDate: new Date("2024-05-15"),
			progress: 20,
			assignee: "Lisa Brown",
			priority: "medium",
			dependencies: ["2"],
			status: "in_progress",
		},
	],
	milestones: [
		{
			id: "m1",
			name: "Q1 Filing Deadline",
			date: new Date("2024-03-15"),
			completed: false,
		},
		{
			id: "m2",
			name: "Audit Completion",
			date: new Date("2024-04-30"),
			completed: false,
		},
		{
			id: "m3",
			name: "System Upgrade",
			date: new Date("2024-06-01"),
			completed: false,
		},
	],
});

const generateHeatMapData = (): HeatMapData => {
	const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

	const data = [];
	for (const day of days) {
		for (const hour of hours) {
			data.push({
				x: hour,
				y: day,
				value: Math.floor(Math.random() * 100),
			});
		}
	}

	return {
		data,
		xLabels: hours,
		yLabels: days,
		colorScale: { min: "#E5F3FF", max: "#1D4ED8" },
	};
};

const generateSankeyData = (): SankeyData => ({
	nodes: [
		{ id: "website", name: "Website Visits", category: "source" },
		{ id: "referral", name: "Referrals", category: "source" },
		{ id: "social", name: "Social Media", category: "source" },
		{ id: "inquiry", name: "Service Inquiries", category: "middle" },
		{ id: "consultation", name: "Consultations", category: "middle" },
		{ id: "proposal", name: "Proposals Sent", category: "middle" },
		{ id: "client", name: "New Clients", category: "target" },
	],
	links: [
		{ source: "website", target: "inquiry", value: 150 },
		{ source: "referral", target: "inquiry", value: 80 },
		{ source: "social", target: "inquiry", value: 45 },
		{ source: "inquiry", target: "consultation", value: 180 },
		{ source: "consultation", target: "proposal", value: 120 },
		{ source: "proposal", target: "client", value: 85 },
	],
});

const generateFunnelData = (): FunnelData => ({
	stages: [
		{
			name: "Website Visitors",
			value: 10000,
			percentage: 100,
			color: "#3B82F6",
		},
		{
			name: "Service Inquiries",
			value: 2500,
			percentage: 25,
			color: "#10B981",
		},
		{
			name: "Consultations Scheduled",
			value: 1200,
			percentage: 12,
			color: "#F59E0B",
		},
		{ name: "Proposals Sent", value: 800, percentage: 8, color: "#8B5CF6" },
		{ name: "Contracts Signed", value: 450, percentage: 4.5, color: "#EF4444" },
	],
	title: "Client Acquisition Funnel",
	conversionRates: [
		{ stage: "Inquiry Rate", rate: 25 },
		{ stage: "Consultation Rate", rate: 48 },
		{ stage: "Proposal Rate", rate: 67 },
		{ stage: "Close Rate", rate: 56 },
	],
});

const generateTreemapData = (): TreemapData => ({
	data: [
		{
			name: "Tax Services",
			value: 1200000,
			color: "#3B82F6",
			children: [
				{ name: "Individual Tax", value: 450000, color: "#60A5FA" },
				{ name: "Corporate Tax", value: 650000, color: "#3B82F6" },
				{ name: "VAT Services", value: 100000, color: "#1E40AF" },
			],
		},
		{
			name: "Compliance Services",
			value: 800000,
			color: "#10B981",
			children: [
				{ name: "Regulatory Compliance", value: 350000, color: "#34D399" },
				{ name: "Audit Support", value: 300000, color: "#10B981" },
				{ name: "Risk Assessment", value: 150000, color: "#059669" },
			],
		},
		{
			name: "Corporate Services",
			value: 600000,
			color: "#F59E0B",
			children: [
				{ name: "Company Formation", value: 250000, color: "#FBBF24" },
				{ name: "Legal Services", value: 200000, color: "#F59E0B" },
				{ name: "Business Advisory", value: 150000, color: "#D97706" },
			],
		},
		{
			name: "Immigration",
			value: 400000,
			color: "#8B5CF6",
			children: [
				{ name: "Work Permits", value: 200000, color: "#A78BFA" },
				{ name: "Visa Services", value: 120000, color: "#8B5CF6" },
				{ name: "Residency", value: 80000, color: "#7C3AED" },
			],
		},
	],
	title: "Revenue by Service Line",
});

// Custom Gantt Chart Component
export function GanttChart({
	data,
	height = 400,
}: {
	data: GanttData;
	height?: number;
}) {
	const [selectedTask, setSelectedTask] = useState<string | null>(null);
	const timelineStart = new Date("2024-01-01");
	const timelineEnd = new Date("2024-06-30");
	const timelineWidth = timelineEnd.getTime() - timelineStart.getTime();

	const getTaskPosition = (task: GanttData["tasks"][0]) => {
		const startPos =
			((task.startDate.getTime() - timelineStart.getTime()) / timelineWidth) *
			100;
		const duration =
			((task.endDate.getTime() - task.startDate.getTime()) / timelineWidth) *
			100;
		return { left: startPos, width: duration };
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "bg-green-500";
			case "in_progress":
				return "bg-blue-500";
			case "blocked":
				return "bg-red-500";
			default:
				return "bg-gray-400";
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "critical":
				return "border-red-500";
			case "high":
				return "border-orange-500";
			case "medium":
				return "border-yellow-500";
			default:
				return "border-green-500";
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Calendar className="h-5 w-5" />
					Project Timeline
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div style={{ height }} className="relative overflow-x-auto">
					{/* Timeline header */}
					<div className="relative mb-4 h-8 rounded bg-gray-100">
						{["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => (
							<div
								key={month}
								className="absolute top-0 flex h-full items-center justify-center border-gray-300 border-r"
								style={{
									left: `${(index * 100) / 6}%`,
									width: `${100 / 6}%`,
								}}
							>
								<span className="font-medium text-sm">{month} 2024</span>
							</div>
						))}
					</div>

					{/* Tasks */}
					<div className="space-y-3">
						{data.tasks.map((task) => {
							const position = getTaskPosition(task);
							return (
								<div key={task.id} className="relative h-12">
									{/* Task name */}
									<div className="absolute left-0 flex h-full w-48 items-center">
										<div className="space-y-1">
											<div className="font-medium text-sm">{task.name}</div>
											<div className="flex items-center gap-1">
												<Badge
													variant="outline"
													className={cn(
														"text-xs",
														getPriorityColor(task.priority),
													)}
												>
													{task.priority}
												</Badge>
												<span className="text-gray-500 text-xs">
													{task.assignee}
												</span>
											</div>
										</div>
									</div>

									{/* Task bar */}
									<div
										className={cn(
											"absolute h-8 cursor-pointer rounded transition-all duration-200",
											getStatusColor(task.status),
											selectedTask === task.id && "ring-2 ring-blue-300",
											"ml-52",
										)}
										style={{
											left: `${position.left}%`,
											width: `${position.width}%`,
										}}
										onClick={() =>
											setSelectedTask(selectedTask === task.id ? null : task.id)
										}
									>
										{/* Progress bar */}
										<div
											className="h-full rounded bg-white/30"
											style={{ width: `${task.progress}%` }}
										/>

										{/* Task info */}
										<div className="absolute inset-0 flex items-center px-2">
											<span className="truncate font-medium text-white text-xs">
												{task.name} ({task.progress}%)
											</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{/* Milestones */}
					<div className="relative mt-6 h-8">
						{data.milestones.map((milestone) => {
							const pos =
								((milestone.date.getTime() - timelineStart.getTime()) /
									timelineWidth) *
								100;
							return (
								<div
									key={milestone.id}
									className="absolute top-0 h-full w-1"
									style={{ left: `calc(${pos}% + 13rem)` }}
								>
									<div
										className={cn(
											"-translate-x-1 h-3 w-3 transform rounded-full border-2",
											milestone.completed
												? "border-green-600 bg-green-500"
												: "border-yellow-600 bg-yellow-500",
										)}
									/>
									<div className="-translate-x-1/2 absolute top-4 left-1/2 transform whitespace-nowrap text-xs">
										{milestone.name}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// Custom Heat Map Component
export function HeatMapChart({
	data,
	height = 400,
}: {
	data: HeatMapData;
	height?: number;
}) {
	const [selectedCell, setSelectedCell] = useState<{
		x: string;
		y: string;
	} | null>(null);

	const getColorIntensity = (value: number) => {
		const intensity = value / 100;
		const r = Math.floor(29 + (59 - 29) * intensity);
		const g = Math.floor(78 + (165 - 78) * intensity);
		const b = Math.floor(216 + (255 - 216) * intensity);
		return `rgb(${r}, ${g}, ${b})`;
	};

	const cellWidth = 100 / data.xLabels.length;
	const cellHeight = (height - 100) / data.yLabels.length;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Activity className="h-5 w-5" />
					Activity Heat Map
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div style={{ height }} className="relative">
					{/* Y-axis labels */}
					<div className="absolute top-8 bottom-8 left-0">
						{data.yLabels.map((label, index) => (
							<div
								key={label}
								className="absolute flex items-center justify-end pr-2 text-sm"
								style={{
									top: `${(index * 100) / data.yLabels.length}%`,
									height: `${100 / data.yLabels.length}%`,
									width: "60px",
								}}
							>
								{label}
							</div>
						))}
					</div>

					{/* X-axis labels */}
					<div className="absolute right-0 bottom-0 left-16 h-8">
						{data.xLabels
							.filter((_, i) => i % 2 === 0)
							.map((label, index) => (
								<div
									key={label}
									className="absolute flex items-center justify-center text-xs"
									style={{
										left: `${index * 2 * cellWidth}%`,
										width: `${cellWidth * 2}%`,
									}}
								>
									{label}
								</div>
							))}
					</div>

					{/* Heat map grid */}
					<div className="absolute top-8 right-0 bottom-8 left-16">
						{data.data.map((cell, index) => {
							const xIndex = data.xLabels.indexOf(cell.x);
							const yIndex = data.yLabels.indexOf(cell.y);
							const isSelected =
								selectedCell &&
								selectedCell.x === cell.x &&
								selectedCell.y === cell.y;

							return (
								<div
									key={index}
									className={cn(
										"absolute cursor-pointer border border-gray-200 transition-all duration-200",
										isSelected && "z-10 ring-2 ring-blue-500",
									)}
									style={{
										left: `${xIndex * cellWidth}%`,
										top: `${(yIndex * 100) / data.yLabels.length}%`,
										width: `${cellWidth}%`,
										height: `${100 / data.yLabels.length}%`,
										backgroundColor: getColorIntensity(cell.value),
									}}
									onClick={() =>
										setSelectedCell(
											isSelected ? null : { x: cell.x, y: cell.y },
										)
									}
									title={`${cell.y} ${cell.x}: ${cell.value}`}
								/>
							);
						})}
					</div>

					{/* Legend */}
					<div className="absolute right-2 bottom-2 flex items-center gap-2 text-xs">
						<span>Low</span>
						<div className="h-3 w-20 rounded bg-gradient-to-r from-blue-100 to-blue-600" />
						<span>High</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// Custom Gauge Chart Component
export function GaugeChart({
	data,
	size = 200,
}: {
	data: GaugeData;
	size?: number;
}) {
	const [animatedValue, setAnimatedValue] = useState(0);

	useEffect(() => {
		const timer = setTimeout(() => {
			setAnimatedValue(data.value);
		}, 100);
		return () => clearTimeout(timer);
	}, [data.value]);

	const percentage = ((animatedValue - data.min) / (data.max - data.min)) * 100;
	const angle = (percentage * 180) / 100 - 90;

	const getZoneColor = (value: number) => {
		for (const zone of data.zones) {
			if (value >= zone.min && value <= zone.max) {
				return zone.color;
			}
		}
		return "#6B7280";
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-center">{data.title}</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col items-center">
				<div
					className="relative"
					style={{ width: size, height: size / 2 + 40 }}
				>
					{/* Gauge background */}
					<svg width={size} height={size / 2 + 40} className="absolute inset-0">
						{/* Background arc */}
						<path
							d={`M 20 ${size / 2 + 20} A ${size / 2 - 20} ${size / 2 - 20} 0 0 1 ${size - 20} ${size / 2 + 20}`}
							stroke="#E5E7EB"
							strokeWidth="12"
							fill="none"
						/>

						{/* Value arc */}
						<path
							d={`M 20 ${size / 2 + 20} A ${size / 2 - 20} ${size / 2 - 20} 0 0 1 ${size - 20} ${size / 2 + 20}`}
							stroke={getZoneColor(animatedValue)}
							strokeWidth="12"
							fill="none"
							strokeDasharray={`${(percentage * Math.PI * (size / 2 - 20)) / 100} ${Math.PI * (size / 2 - 20)}`}
							strokeLinecap="round"
							className="transition-all duration-1000"
						/>

						{/* Needle */}
						<line
							x1={size / 2}
							y1={size / 2 + 20}
							x2={
								size / 2 + Math.cos((angle * Math.PI) / 180) * (size / 2 - 30)
							}
							y2={
								size / 2 +
								20 +
								Math.sin((angle * Math.PI) / 180) * (size / 2 - 30)
							}
							stroke="#374151"
							strokeWidth="3"
							strokeLinecap="round"
							className="transition-all duration-1000"
						/>

						{/* Center circle */}
						<circle cx={size / 2} cy={size / 2 + 20} r="6" fill="#374151" />
					</svg>

					{/* Value display */}
					<div className="absolute right-0 bottom-0 left-0 text-center">
						<div className="font-bold text-3xl">{animatedValue.toFixed(1)}</div>
						<div className="text-muted-foreground text-sm">{data.unit}</div>
						{data.target && (
							<div className="text-muted-foreground text-xs">
								Target: {data.target}
							</div>
						)}
					</div>
				</div>

				{/* Zone indicators */}
				<div className="mt-4 flex flex-wrap justify-center gap-2">
					{data.zones.map((zone, index) => (
						<div key={index} className="flex items-center gap-1 text-xs">
							<div
								className="h-3 w-3 rounded"
								style={{ backgroundColor: zone.color }}
							/>
							<span>{zone.label}</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

// Custom Funnel Chart
export function CustomFunnelChart({ data }: { data: FunnelData }) {
	const maxValue = Math.max(...data.stages.map((s) => s.value));

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Target className="h-5 w-5" />
					{data.title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{data.stages.map((stage, index) => {
						const width = (stage.value / maxValue) * 100;
						const prevStage = data.stages[index - 1];
						const conversionRate = prevStage
							? ((stage.value / prevStage.value) * 100).toFixed(1)
							: "100.0";

						return (
							<div key={stage.name} className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="font-medium text-sm">{stage.name}</span>
									<div className="flex items-center gap-2">
										<span className="font-bold text-lg">
											{stage.value.toLocaleString()}
										</span>
										{index > 0 && (
											<Badge variant="outline" className="text-xs">
												{conversionRate}%
											</Badge>
										)}
									</div>
								</div>
								<div
									className="flex h-12 items-center justify-center rounded font-medium text-white transition-all duration-700"
									style={{
										width: `${width}%`,
										backgroundColor: stage.color,
										marginLeft: `${(100 - width) / 2}%`,
									}}
								>
									{stage.percentage}%
								</div>
							</div>
						);
					})}
				</div>

				<div className="mt-6 border-t pt-6">
					<h4 className="mb-3 font-medium">Conversion Rates</h4>
					<div className="grid grid-cols-2 gap-4">
						{data.conversionRates.map((rate, index) => (
							<div key={index} className="text-center">
								<div className="font-bold text-2xl text-blue-600">
									{rate.rate}%
								</div>
								<div className="text-muted-foreground text-sm">
									{rate.stage}
								</div>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// Custom Treemap Component
export function CustomTreemap({ data }: { data: TreemapData }) {
	const [selectedItem, setSelectedItem] = useState<string | null>(null);

	const RADIAN = Math.PI / 180;
	const renderCustomizedLabel = ({
		cx,
		cy,
		midAngle,
		innerRadius,
		outerRadius,
		percent,
		index,
		name,
	}: any) => {
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
				fontWeight={600}
			>
				{`${name} (${(percent * 100).toFixed(0)}%)`}
			</text>
		);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Layers className="h-5 w-5" />
					{data.title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="h-96">
					<ResponsiveContainer width="100%" height="100%">
						<Treemap
							data={data.data}
							dataKey="value"
							aspectRatio={4 / 3}
							stroke="#fff"
							fill="#8884d8"
						>
							<Tooltip
								content={({ active, payload }) => {
									if (active && payload && payload[0]) {
										const data = payload[0].payload;
										return (
											<div className="rounded-lg border bg-white p-3 shadow-lg">
												<p className="font-medium">{data.name}</p>
												<p className="text-blue-600">
													Value: ${data.value?.toLocaleString()}
												</p>
												{data.children && (
													<p className="text-gray-500 text-sm">
														{data.children.length} subcategories
													</p>
												)}
											</div>
										);
									}
									return null;
								}}
							/>
						</Treemap>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}

// Main Advanced Charts Showcase
export function AdvancedChartsShowcase() {
	const ganttData = useMemo(() => generateGanttData(), []);
	const heatMapData = useMemo(() => generateHeatMapData(), []);
	const funnelData = useMemo(() => generateFunnelData(), []);
	const treemapData = useMemo(() => generateTreemapData(), []);

	const gaugeData: GaugeData = {
		value: 87.5,
		min: 0,
		max: 100,
		target: 90,
		zones: [
			{ min: 0, max: 50, color: "#EF4444", label: "Critical" },
			{ min: 50, max: 70, color: "#F59E0B", label: "Warning" },
			{ min: 70, max: 90, color: "#10B981", label: "Good" },
			{ min: 90, max: 100, color: "#3B82F6", label: "Excellent" },
		],
		title: "Overall Performance Score",
		unit: "%",
	};

	return (
		<div className="space-y-8">
			<div className="border-gray-200 border-b pb-4">
				<h1 className="font-bold text-2xl text-gray-900">
					Advanced Chart Types
				</h1>
				<p className="mt-2 text-gray-600">
					Specialized visualizations for complex data analysis and project
					management
				</p>
			</div>

			<div className="grid gap-8">
				{/* Gantt Chart */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
				>
					<GanttChart data={ganttData} />
				</motion.div>

				{/* Heat Map and Gauge */}
				<div className="grid gap-6 lg:grid-cols-3">
					<motion.div
						className="lg:col-span-2"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						<HeatMapChart data={heatMapData} />
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3 }}
					>
						<GaugeChart data={gaugeData} />
					</motion.div>
				</div>

				{/* Funnel and Treemap */}
				<div className="grid gap-6 lg:grid-cols-2">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
					>
						<CustomFunnelChart data={funnelData} />
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.5 }}
					>
						<CustomTreemap data={treemapData} />
					</motion.div>
				</div>
			</div>
		</div>
	);
}
