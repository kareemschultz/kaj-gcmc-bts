"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Activity,
	AlertTriangle,
	Award,
	BarChart3,
	Briefcase,
	Building,
	Calendar,
	CheckCircle,
	Clock,
	DollarSign,
	FileText,
	Globe,
	PieChartIcon,
	Shield,
	Star,
	Target,
	TrendingDown,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ComposedChart,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	RadialBar,
	RadialBarChart,
	ReferenceLine,
	ResponsiveContainer,
	ResponsiveTreeMap,
	Sankey,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Executive Summary Data Types
export interface ExecutiveSummaryData {
	kpis: {
		totalRevenue: number;
		revenueGrowth: number;
		totalClients: number;
		clientGrowth: number;
		complianceScore: number;
		serviceRequests: number;
	};
	revenueBreakdown: { service: string; revenue: number; growth: number }[];
	clientDistribution: { segment: string; count: number; value: number }[];
	monthlyTrends: {
		month: string;
		revenue: number;
		clients: number;
		satisfaction: number;
	}[];
}

export interface ComplianceHealthData {
	overallScore: number;
	agencyScores: {
		agency: string;
		score: number;
		target: number;
		status: "good" | "warning" | "critical";
	}[];
	riskDistribution: { level: string; count: number; percentage: number }[];
	complianceTrends: { month: string; score: number; incidents: number }[];
}

export interface FinancialPerformanceData {
	revenue: { month: string; revenue: number; costs: number; profit: number }[];
	profitability: { service: string; margin: number; volume: number }[];
	cashFlow: {
		month: string;
		inflow: number;
		outflow: number;
		netFlow: number;
	}[];
	budgetVariance: {
		category: string;
		budget: number;
		actual: number;
		variance: number;
	}[];
}

export interface ClientPortfolioData {
	segmentation: {
		segment: string;
		count: number;
		revenue: number;
		riskLevel: string;
	}[];
	acquisitionTrends: {
		month: string;
		newClients: number;
		churnRate: number;
		retentionRate: number;
	}[];
	clientValue: {
		tier: string;
		count: number;
		avgValue: number;
		lifetimeValue: number;
	}[];
	satisfactionScores: { department: string; score: number; trend: number }[];
}

export interface OperationalEfficiencyData {
	processingTimes: {
		process: string;
		current: number;
		target: number;
		improvement: number;
	}[];
	staffProductivity: {
		department: string;
		productivity: number;
		utilization: number;
		efficiency: number;
	}[];
	serviceMetrics: {
		metric: string;
		value: number;
		target: number;
		status: string;
	}[];
	resourceUtilization: {
		resource: string;
		utilization: number;
		capacity: number;
		availability: number;
	}[];
}

// Mock data generators
const generateExecutiveSummary = (): ExecutiveSummaryData => ({
	kpis: {
		totalRevenue: 2450000,
		revenueGrowth: 15.3,
		totalClients: 347,
		clientGrowth: 8.7,
		complianceScore: 94.2,
		serviceRequests: 1523,
	},
	revenueBreakdown: [
		{ service: "Tax Filing Services", revenue: 980000, growth: 12.5 },
		{ service: "Compliance Consulting", revenue: 650000, growth: 18.3 },
		{ service: "Corporate Formation", revenue: 420000, growth: 9.8 },
		{ service: "Immigration Services", revenue: 280000, growth: 22.1 },
		{ service: "Accounting Services", revenue: 120000, growth: 6.4 },
	],
	clientDistribution: [
		{ segment: "Enterprise", count: 45, value: 1200000 },
		{ segment: "SME", count: 156, value: 890000 },
		{ segment: "Startups", count: 89, value: 250000 },
		{ segment: "Individual", count: 57, value: 110000 },
	],
	monthlyTrends: Array.from({ length: 12 }, (_, i) => ({
		month: new Date(2024, i).toLocaleDateString("en", { month: "short" }),
		revenue: Math.floor(Math.random() * 300000) + 150000,
		clients: Math.floor(Math.random() * 40) + 280,
		satisfaction: Math.floor(Math.random() * 20) + 80,
	})),
});

const generateComplianceHealth = (): ComplianceHealthData => ({
	overallScore: 91.5,
	agencyScores: [
		{ agency: "GRA", score: 94, target: 95, status: "warning" },
		{ agency: "NIS", score: 96, target: 95, status: "good" },
		{ agency: "DCRA", score: 89, target: 90, status: "warning" },
		{ agency: "Immigration", score: 87, target: 90, status: "critical" },
	],
	riskDistribution: [
		{ level: "Low Risk", count: 234, percentage: 67.4 },
		{ level: "Medium Risk", count: 89, percentage: 25.6 },
		{ level: "High Risk", count: 24, percentage: 7.0 },
	],
	complianceTrends: Array.from({ length: 12 }, (_, i) => ({
		month: new Date(2024, i).toLocaleDateString("en", { month: "short" }),
		score: Math.floor(Math.random() * 10) + 85,
		incidents: Math.floor(Math.random() * 5),
	})),
});

const generateFinancialPerformance = (): FinancialPerformanceData => ({
	revenue: Array.from({ length: 12 }, (_, i) => ({
		month: new Date(2024, i).toLocaleDateString("en", { month: "short" }),
		revenue: Math.floor(Math.random() * 300000) + 150000,
		costs: Math.floor(Math.random() * 150000) + 80000,
		profit: Math.floor(Math.random() * 150000) + 50000,
	})),
	profitability: [
		{ service: "Tax Filing", margin: 65.2, volume: 245 },
		{ service: "Compliance", margin: 58.7, volume: 189 },
		{ service: "Corporate Formation", margin: 72.3, volume: 98 },
		{ service: "Immigration", margin: 55.1, volume: 67 },
	],
	cashFlow: Array.from({ length: 12 }, (_, i) => ({
		month: new Date(2024, i).toLocaleDateString("en", { month: "short" }),
		inflow: Math.floor(Math.random() * 250000) + 180000,
		outflow: Math.floor(Math.random() * 180000) + 120000,
		netFlow: Math.floor(Math.random() * 100000) + 30000,
	})),
	budgetVariance: [
		{ category: "Staff Costs", budget: 850000, actual: 823000, variance: -3.2 },
		{ category: "Technology", budget: 120000, actual: 135000, variance: 12.5 },
		{ category: "Marketing", budget: 45000, actual: 38000, variance: -15.6 },
		{
			category: "Office Expenses",
			budget: 78000,
			actual: 81000,
			variance: 3.8,
		},
	],
});

// KPI Card Component
function KPICard({
	title,
	value,
	change,
	icon: Icon,
	format = "number",
	delay = 0,
}: {
	title: string;
	value: number;
	change?: number;
	icon: React.ElementType;
	format?: "number" | "currency" | "percentage";
	delay?: number;
}) {
	const formatValue = (val: number) => {
		switch (format) {
			case "currency":
				return new Intl.NumberFormat("en-US", {
					style: "currency",
					currency: "USD",
				}).format(val);
			case "percentage":
				return `${val.toFixed(1)}%`;
			default:
				return val.toLocaleString();
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay, duration: 0.5 }}
		>
			<Card className="relative overflow-hidden">
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<div className="space-y-2">
							<p className="font-medium text-muted-foreground text-sm">
								{title}
							</p>
							<p className="font-bold text-2xl">{formatValue(value)}</p>
							{change !== undefined && (
								<div className="flex items-center gap-1 text-sm">
									{change > 0 ? (
										<TrendingUp className="h-4 w-4 text-green-600" />
									) : (
										<TrendingDown className="h-4 w-4 text-red-600" />
									)}
									<span
										className={cn(
											"font-medium",
											change > 0 ? "text-green-600" : "text-red-600",
										)}
									>
										{change > 0 ? "+" : ""}
										{change.toFixed(1)}%
									</span>
									<span className="text-muted-foreground">vs last period</span>
								</div>
							)}
						</div>
						<div className="rounded-full bg-blue-50 p-3 dark:bg-blue-900/20">
							<Icon className="h-6 w-6 text-blue-600" />
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}

// Executive Summary Tab
function ExecutiveSummaryTab({ data }: { data: ExecutiveSummaryData }) {
	return (
		<div className="space-y-6">
			{/* KPI Grid */}
			<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
				<div className="md:col-span-2">
					<KPICard
						title="Total Revenue"
						value={data.kpis.totalRevenue}
						change={data.kpis.revenueGrowth}
						icon={DollarSign}
						format="currency"
						delay={0.1}
					/>
				</div>
				<div className="md:col-span-1">
					<KPICard
						title="Total Clients"
						value={data.kpis.totalClients}
						change={data.kpis.clientGrowth}
						icon={Users}
						delay={0.2}
					/>
				</div>
				<div className="md:col-span-1">
					<KPICard
						title="Compliance Score"
						value={data.kpis.complianceScore}
						icon={Shield}
						format="percentage"
						delay={0.3}
					/>
				</div>
				<div className="md:col-span-2">
					<KPICard
						title="Service Requests"
						value={data.kpis.serviceRequests}
						icon={Activity}
						delay={0.4}
					/>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Revenue Breakdown */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BarChart3 className="h-5 w-5" />
							Revenue by Service Line
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={data.revenueBreakdown}>
									<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
									<XAxis
										dataKey="service"
										angle={-45}
										textAnchor="end"
										height={100}
									/>
									<YAxis />
									<Tooltip />
									<Bar dataKey="revenue" fill="#3B82F6" />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				{/* Client Distribution */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<PieChartIcon className="h-5 w-5" />
							Client Segmentation
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={data.clientDistribution}
										cx="50%"
										cy="50%"
										outerRadius={100}
										fill="#8884d8"
										dataKey="value"
										label={({ segment, percent }) =>
											`${segment} ${(percent * 100).toFixed(0)}%`
										}
									>
										{data.clientDistribution.map((entry, index) => {
											const colors = [
												"#3B82F6",
												"#10B981",
												"#F59E0B",
												"#EF4444",
											];
											return (
												<Cell key={`cell-${index}`} fill={colors[index]} />
											);
										})}
									</Pie>
									<Tooltip />
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Monthly Trends */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5" />
						Business Performance Trends
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="h-80">
						<ResponsiveContainer width="100%" height="100%">
							<ComposedChart data={data.monthlyTrends}>
								<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
								<XAxis dataKey="month" />
								<YAxis yAxisId="left" />
								<YAxis yAxisId="right" orientation="right" />
								<Tooltip />
								<Legend />
								<Area
									yAxisId="left"
									type="monotone"
									dataKey="revenue"
									fill="#3B82F6"
									stroke="#3B82F6"
									fillOpacity={0.3}
									name="Revenue"
								/>
								<Bar
									yAxisId="right"
									dataKey="clients"
									fill="#10B981"
									name="Clients"
								/>
								<Line
									yAxisId="right"
									type="monotone"
									dataKey="satisfaction"
									stroke="#F59E0B"
									strokeWidth={3}
									name="Satisfaction %"
								/>
							</ComposedChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Compliance Health Tab
function ComplianceHealthTab({ data }: { data: ComplianceHealthData }) {
	return (
		<div className="space-y-6">
			{/* Overall Score */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						Overall Compliance Health
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center space-x-8">
						<div className="text-center">
							<div className="mb-2 font-bold text-4xl text-blue-600">
								{data.overallScore}%
							</div>
							<div className="text-muted-foreground text-sm">Overall Score</div>
							<Progress value={data.overallScore} className="mt-2 w-32" />
						</div>
						<div className="space-y-3">
							{data.agencyScores.map((agency, index) => (
								<div key={index} className="flex items-center gap-3">
									<Badge
										variant={
											agency.status === "good"
												? "default"
												: agency.status === "warning"
													? "secondary"
													: "destructive"
										}
									>
										{agency.agency}
									</Badge>
									<div className="w-24">
										<Progress value={agency.score} className="h-2" />
									</div>
									<span className="text-sm">{agency.score}%</span>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Risk Distribution */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5" />
							Risk Distribution
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={data.riskDistribution}
										cx="50%"
										cy="50%"
										outerRadius={80}
										fill="#8884d8"
										dataKey="count"
										label={({ level, percentage }) =>
											`${level}: ${percentage}%`
										}
									>
										{data.riskDistribution.map((entry, index) => {
											const colors = ["#10B981", "#F59E0B", "#EF4444"];
											return (
												<Cell key={`cell-${index}`} fill={colors[index]} />
											);
										})}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				{/* Compliance Trends */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Compliance Trends
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<ComposedChart data={data.complianceTrends}>
									<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
									<XAxis dataKey="month" />
									<YAxis yAxisId="left" />
									<YAxis yAxisId="right" orientation="right" />
									<Tooltip />
									<Legend />
									<Line
										yAxisId="left"
										type="monotone"
										dataKey="score"
										stroke="#3B82F6"
										strokeWidth={3}
										name="Compliance Score"
									/>
									<Bar
										yAxisId="right"
										dataKey="incidents"
										fill="#EF4444"
										name="Incidents"
									/>
									<ReferenceLine
										yAxisId="left"
										y={90}
										stroke="#10B981"
										strokeDasharray="3 3"
									/>
								</ComposedChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

// Financial Performance Tab
function FinancialPerformanceTab({ data }: { data: FinancialPerformanceData }) {
	return (
		<div className="space-y-6">
			{/* Revenue, Costs, Profit */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<DollarSign className="h-5 w-5" />
						Revenue & Profitability
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="h-80">
						<ResponsiveContainer width="100%" height="100%">
							<ComposedChart data={data.revenue}>
								<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
								<XAxis dataKey="month" />
								<YAxis />
								<Tooltip />
								<Legend />
								<Area
									type="monotone"
									dataKey="revenue"
									fill="#3B82F6"
									stroke="#3B82F6"
									fillOpacity={0.3}
									name="Revenue"
								/>
								<Area
									type="monotone"
									dataKey="costs"
									fill="#EF4444"
									stroke="#EF4444"
									fillOpacity={0.3}
									name="Costs"
								/>
								<Line
									type="monotone"
									dataKey="profit"
									stroke="#10B981"
									strokeWidth={3}
									name="Profit"
								/>
							</ComposedChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Service Profitability */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Target className="h-5 w-5" />
							Service Line Profitability
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<ScatterChart data={data.profitability}>
									<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
									<XAxis dataKey="volume" name="Volume" />
									<YAxis dataKey="margin" name="Margin %" />
									<Tooltip cursor={{ strokeDasharray: "3 3" }} />
									<Scatter data={data.profitability} fill="#3B82F6" />
								</ScatterChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				{/* Budget Variance */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<BarChart3 className="h-5 w-5" />
							Budget vs Actual
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={data.budgetVariance}>
									<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
									<XAxis
										dataKey="category"
										angle={-45}
										textAnchor="end"
										height={80}
									/>
									<YAxis />
									<Tooltip />
									<Legend />
									<Bar dataKey="budget" fill="#E5E7EB" name="Budget" />
									<Bar dataKey="actual" fill="#3B82F6" name="Actual" />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

// Main Business Intelligence Dashboard
export function BusinessIntelligenceDashboard() {
	const [activeTab, setActiveTab] = useState("executive");

	const executiveSummary = useMemo(() => generateExecutiveSummary(), []);
	const complianceHealth = useMemo(() => generateComplianceHealth(), []);
	const financialPerformance = useMemo(
		() => generateFinancialPerformance(),
		[],
	);

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6 }}
			className="space-y-6"
		>
			<div className="border-gray-200 border-b pb-4">
				<h1 className="font-bold text-2xl text-gray-900">
					Business Intelligence Dashboard
				</h1>
				<p className="mt-2 text-gray-600">
					Executive-level analytics with key performance indicators and
					strategic insights
				</p>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="space-y-6"
			>
				<TabsList className="grid w-full grid-cols-3 bg-gray-100">
					<TabsTrigger value="executive" className="flex items-center gap-2">
						<Star className="h-4 w-4" />
						Executive Summary
					</TabsTrigger>
					<TabsTrigger value="compliance" className="flex items-center gap-2">
						<Shield className="h-4 w-4" />
						Compliance Health
					</TabsTrigger>
					<TabsTrigger value="financial" className="flex items-center gap-2">
						<DollarSign className="h-4 w-4" />
						Financial Performance
					</TabsTrigger>
				</TabsList>

				<TabsContent value="executive">
					<ExecutiveSummaryTab data={executiveSummary} />
				</TabsContent>

				<TabsContent value="compliance">
					<ComplianceHealthTab data={complianceHealth} />
				</TabsContent>

				<TabsContent value="financial">
					<FinancialPerformanceTab data={financialPerformance} />
				</TabsContent>
			</Tabs>
		</motion.div>
	);
}
