"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Activity,
	BarChart3,
	Building,
	Database,
	Eye,
	EyeOff,
	Grid3x3,
	Layout,
	Monitor,
	PieChart,
	Plane,
	Settings,
	Shield,
	Smartphone,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AdvancedChartsShowcase } from "./advanced-chart-types";
// Import components
import {
	ApiMetricCards,
	ChartDataProvider,
	ChartDataStatus,
} from "./chart-data-providers";
import { MobileChartViewer } from "./mobile-chart-viewer";
import { PerformanceOptimizedCharts } from "./performance-optimized-charts";

// Lazy-loaded components for better performance
const AgencyComplianceCharts = lazy(() =>
	import("./agency-compliance-charts").then((module) => ({
		default: module.AgencyComplianceCharts,
	})),
);

const BusinessIntelligenceDashboard = lazy(() =>
	import("./business-intelligence-dashboard").then((module) => ({
		default: module.BusinessIntelligenceDashboard,
	})),
);

const PerformanceMetricsPanel = lazy(() =>
	import("./performance-metrics-panel").then((module) => ({
		default: module.PerformanceMetricsPanel,
	})),
);

const InteractiveChart = lazy(() =>
	import("./interactive-chart-library").then((module) => ({
		default: module.InteractiveChart,
	})),
);

// Loading skeleton component
function ChartSkeleton({
	height = "300px",
	title,
}: {
	height?: string;
	title?: string;
}) {
	return (
		<Card>
			{title && (
				<CardHeader>
					<div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
				</CardHeader>
			)}
			<CardContent>
				<div
					style={{ height }}
					className="flex animate-pulse items-center justify-center rounded bg-gray-100"
				>
					<BarChart3 className="h-12 w-12 text-gray-400" />
				</div>
			</CardContent>
		</Card>
	);
}

// Dashboard layout types
type DashboardLayout =
	| "executive"
	| "operational"
	| "agency"
	| "mobile"
	| "advanced"
	| "performance";

interface DashboardConfig {
	layout: DashboardLayout;
	showMetrics: boolean;
	enableRealTime: boolean;
	enableMobile: boolean;
	enablePerformance: boolean;
}

// Main dashboard component
function MainDashboardContent({ config }: { config: DashboardConfig }) {
	const [activeTab, setActiveTab] = useState<DashboardLayout>(config.layout);

	const tabs = [
		{
			id: "executive" as const,
			label: "Executive",
			icon: TrendingUp,
			description: "High-level business intelligence and KPIs",
		},
		{
			id: "agency" as const,
			label: "Agencies",
			icon: Shield,
			description: "GRA, NIS, DCRA, and Immigration compliance",
		},
		{
			id: "operational" as const,
			label: "Operations",
			icon: Activity,
			description: "Performance metrics and efficiency tracking",
		},
		{
			id: "advanced" as const,
			label: "Advanced",
			icon: BarChart3,
			description: "Specialized chart types and visualizations",
		},
		{
			id: "mobile" as const,
			label: "Mobile",
			icon: Smartphone,
			description: "Touch-optimized chart interface",
		},
		{
			id: "performance" as const,
			label: "Performance",
			icon: Zap,
			description: "Optimization features and monitoring",
		},
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="font-bold text-3xl text-gray-900">
						GCMC-KAJ Analytics Dashboard
					</h1>
					<p className="mt-2 text-gray-600">
						Comprehensive data visualization and business intelligence platform
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Badge variant="outline" className="flex items-center gap-1">
						<Database className="h-3 w-3" />
						Live Data
					</Badge>
					<Badge variant="outline" className="flex items-center gap-1">
						<Zap className="h-3 w-3" />
						Optimized
					</Badge>
				</div>
			</div>

			{/* Data status indicator */}
			<ChartDataStatus />

			{/* Metrics overview */}
			{config.showMetrics && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<ApiMetricCards />
				</motion.div>
			)}

			{/* Main content tabs */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab as (value: string) => void}
			>
				<TabsList className="grid w-full grid-cols-3 bg-gray-100 lg:grid-cols-6">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						return (
							<TabsTrigger
								key={tab.id}
								value={tab.id}
								className="flex items-center gap-2 data-[state=active]:bg-white"
								title={tab.description}
							>
								<Icon className="h-4 w-4" />
								<span className="hidden sm:inline">{tab.label}</span>
							</TabsTrigger>
						);
					})}
				</TabsList>

				{/* Tab content */}
				<div className="mt-6">
					<TabsContent value="executive" className="space-y-6">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.5 }}
						>
							<Suspense
								fallback={
									<ChartSkeleton
										height="600px"
										title="Business Intelligence Dashboard"
									/>
								}
							>
								<BusinessIntelligenceDashboard />
							</Suspense>
						</motion.div>
					</TabsContent>

					<TabsContent value="agency" className="space-y-6">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.5 }}
						>
							<Suspense
								fallback={
									<ChartSkeleton
										height="800px"
										title="Agency Compliance Charts"
									/>
								}
							>
								<AgencyComplianceCharts />
							</Suspense>
						</motion.div>
					</TabsContent>

					<TabsContent value="operational" className="space-y-6">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.5 }}
						>
							<Suspense
								fallback={
									<ChartSkeleton
										height="700px"
										title="Performance Metrics Panel"
									/>
								}
							>
								<PerformanceMetricsPanel />
							</Suspense>
						</motion.div>
					</TabsContent>

					<TabsContent value="advanced" className="space-y-6">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.5 }}
						>
							<AdvancedChartsShowcase />
						</motion.div>
					</TabsContent>

					<TabsContent value="mobile" className="space-y-6">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.5 }}
						>
							<MobileChartViewer charts={[]} />
						</motion.div>
					</TabsContent>

					<TabsContent value="performance" className="space-y-6">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.5 }}
						>
							<PerformanceOptimizedCharts />
						</motion.div>
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}

// Main dashboard component with provider
export function ComprehensiveAnalyticsDashboard({
	initialLayout = "executive",
	showMetrics = true,
	enableRealTime = true,
	enableMobile = true,
	enablePerformance = true,
}: {
	initialLayout?: DashboardLayout;
	showMetrics?: boolean;
	enableRealTime?: boolean;
	enableMobile?: boolean;
	enablePerformance?: boolean;
} = {}) {
	const [config] = useState<DashboardConfig>({
		layout: initialLayout,
		showMetrics,
		enableRealTime,
		enableMobile,
		enablePerformance,
	});

	return (
		<ChartDataProvider>
			<div className="min-h-screen bg-gray-50/30">
				<div className="container mx-auto px-4 py-6">
					<MainDashboardContent config={config} />
				</div>
			</div>
		</ChartDataProvider>
	);
}

// Export all components for individual use
export {
	AgencyComplianceCharts,
	BusinessIntelligenceDashboard,
	PerformanceMetricsPanel,
	InteractiveChart,
	MobileChartViewer,
	AdvancedChartsShowcase,
	PerformanceOptimizedCharts,
	ChartDataProvider,
	ChartDataStatus,
	ApiMetricCards,
};

export type {
	DCRAData,
	GRAData,
	ImmigrationData,
	NISData,
} from "./agency-compliance-charts";
// Export hooks
export {
	transformToChartData,
	useActivityTimeline,
	useAllChartData,
	useChartData,
	useClientRiskDistribution,
	useComplianceOverview,
	useDashboardOverview,
	useFilingStatusBreakdown,
	useServiceRequestPipeline,
	useTaskOverview,
} from "./chart-data-providers";
// Export types
export type {
	ChartConfig,
	ChartData,
	ChartType,
} from "./interactive-chart-library";

export type {
	MobileChartConfig,
	TouchGesture,
} from "./mobile-chart-viewer";

export type {
	LazyLoadConfig,
	PerformanceMetrics,
	VirtualizationConfig,
} from "./performance-optimized-charts";

// Default export
export default ComprehensiveAnalyticsDashboard;
