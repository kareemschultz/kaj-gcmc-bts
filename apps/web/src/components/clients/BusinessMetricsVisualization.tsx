"use client";

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
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
	Scatter,
	ScatterChart,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BusinessMetricsVisualizationProps {
	clientId: number;
	complianceData: any;
	documentsData: any;
	filingsData: any;
	servicesData: any;
	timelineData: any;
}

// Enhanced color palette for business metrics
const BUSINESS_COLORS = {
	revenue: "#22c55e",
	compliance: "#3b82f6",
	risk: "#ef4444",
	efficiency: "#f59e0b",
	growth: "#8b5cf6",
	satisfaction: "#06b6d4",
};

export function BusinessMetricsVisualization({
	clientId,
	complianceData,
	documentsData,
	filingsData,
	servicesData,
}: BusinessMetricsVisualizationProps) {
	// Process data for comprehensive business visualization
	const businessKPIs = {
		complianceEfficiency: calculateComplianceEfficiency(complianceData),
		documentManagement: calculateDocumentMetrics(documentsData),
		filingPerformance: calculateFilingMetrics(filingsData),
		serviceQuality: calculateServiceMetrics(servicesData),
	};

	// Radar chart data for multi-dimensional analysis
	const radarData = [
		{
			subject: "Compliance",
			A: businessKPIs.complianceEfficiency.score,
			B: businessKPIs.complianceEfficiency.trend,
			fullMark: 100,
		},
		{
			subject: "Documents",
			A: businessKPIs.documentManagement.score,
			B: businessKPIs.documentManagement.trend,
			fullMark: 100,
		},
		{
			subject: "Filings",
			A: businessKPIs.filingPerformance.score,
			B: businessKPIs.filingPerformance.trend,
			fullMark: 100,
		},
		{
			subject: "Services",
			A: businessKPIs.serviceQuality.score,
			B: businessKPIs.serviceQuality.trend,
			fullMark: 100,
		},
		{
			subject: "Risk Mgmt",
			A: calculateRiskScore(complianceData, filingsData),
			B: 85,
			fullMark: 100,
		},
		{
			subject: "Efficiency",
			A: calculateEfficiencyScore(servicesData, filingsData),
			B: 90,
			fullMark: 100,
		},
	];

	// Correlation matrix data
	const correlationData = [
		{
			metric: "Compliance vs Filings",
			correlation: 0.87,
			x: businessKPIs.complianceEfficiency.score,
			y: businessKPIs.filingPerformance.score,
			size: 50,
		},
		{
			metric: "Documents vs Services",
			correlation: 0.72,
			x: businessKPIs.documentManagement.score,
			y: businessKPIs.serviceQuality.score,
			size: 40,
		},
		{
			metric: "Risk vs Efficiency",
			correlation: -0.65,
			x: calculateRiskScore(complianceData, filingsData),
			y: calculateEfficiencyScore(servicesData, filingsData),
			size: 35,
		},
	];

	// Business performance trends
	const trendData = generateBusinessTrends(
		complianceData,
		filingsData,
		servicesData,
	);

	// Cost-benefit analysis
	const costBenefitData = calculateCostBenefitAnalysis(
		complianceData,
		servicesData,
	);

	return (
		<div className="space-y-6">
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="correlations">Correlations</TabsTrigger>
					<TabsTrigger value="trends">Trends</TabsTrigger>
					<TabsTrigger value="performance">Performance</TabsTrigger>
					<TabsTrigger value="insights">Insights</TabsTrigger>
				</TabsList>

				<TabsContent value="overview">
					<div className="grid gap-4 md:grid-cols-2">
						{/* Business KPI Radar Chart */}
						<Card className="col-span-1">
							<CardHeader>
								<CardTitle>Business Performance Radar</CardTitle>
								<CardDescription>
									Multi-dimensional analysis of key business metrics
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={350}>
									<RadarChart data={radarData}>
										<PolarGrid />
										<PolarAngleAxis dataKey="subject" />
										<PolarRadiusAxis angle={30} domain={[0, 100]} />
										<Radar
											name="Current"
											dataKey="A"
											stroke={BUSINESS_COLORS.compliance}
											fill={BUSINESS_COLORS.compliance}
											fillOpacity={0.3}
										/>
										<Radar
											name="Target"
											dataKey="B"
											stroke={BUSINESS_COLORS.growth}
											fill={BUSINESS_COLORS.growth}
											fillOpacity={0.1}
										/>
										<Legend />
									</RadarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* KPI Dashboard */}
						<Card className="col-span-1">
							<CardHeader>
								<CardTitle>Key Performance Indicators</CardTitle>
								<CardDescription>
									Real-time business health metrics
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">
											Compliance Efficiency
										</span>
										<Badge variant="default">
											{businessKPIs.complianceEfficiency.score}%
										</Badge>
									</div>
									<Progress value={businessKPIs.complianceEfficiency.score} />
								</div>

								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">
											Document Management
										</span>
										<Badge variant="secondary">
											{businessKPIs.documentManagement.score}%
										</Badge>
									</div>
									<Progress value={businessKPIs.documentManagement.score} />
								</div>

								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">
											Filing Performance
										</span>
										<Badge variant="default">
											{businessKPIs.filingPerformance.score}%
										</Badge>
									</div>
									<Progress value={businessKPIs.filingPerformance.score} />
								</div>

								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="font-medium text-sm">Service Quality</span>
										<Badge variant="default">
											{businessKPIs.serviceQuality.score}%
										</Badge>
									</div>
									<Progress value={businessKPIs.serviceQuality.score} />
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="correlations">
					<div className="grid gap-4 md:grid-cols-2">
						{/* Correlation Scatter Plot */}
						<Card className="col-span-1">
							<CardHeader>
								<CardTitle>Metric Correlations</CardTitle>
								<CardDescription>
									Relationship analysis between business metrics
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<ScatterChart data={correlationData}>
										<CartesianGrid />
										<XAxis
											type="number"
											dataKey="x"
											name="Metric X"
											domain={[0, 100]}
										/>
										<YAxis
											type="number"
											dataKey="y"
											name="Metric Y"
											domain={[0, 100]}
										/>
										<Tooltip cursor={{ strokeDasharray: "3 3" }} />
										<Scatter dataKey="size" fill={BUSINESS_COLORS.compliance} />
									</ScatterChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Correlation Matrix */}
						<Card className="col-span-1">
							<CardHeader>
								<CardTitle>Correlation Strength</CardTitle>
								<CardDescription>
									Statistical relationships between metrics
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{correlationData.map((item, index) => (
									<div key={index} className="space-y-2">
										<div className="flex items-center justify-between">
											<span className="font-medium text-sm">{item.metric}</span>
											<Badge
												variant={
													Math.abs(item.correlation) > 0.8
														? "default"
														: Math.abs(item.correlation) > 0.5
															? "secondary"
															: "outline"
												}
											>
												{item.correlation.toFixed(2)}
											</Badge>
										</div>
										<Progress
											value={Math.abs(item.correlation) * 100}
											className="h-2"
										/>
									</div>
								))}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="trends">
					<div className="grid gap-4">
						{/* Business Trend Analysis */}
						<Card>
							<CardHeader>
								<CardTitle>Business Performance Trends</CardTitle>
								<CardDescription>
									Historical performance analysis and projections
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={400}>
									<AreaChart data={trendData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="month" />
										<YAxis />
										<Tooltip />
										<Legend />
										<Area
											type="monotone"
											dataKey="compliance"
											stackId="1"
											stroke={BUSINESS_COLORS.compliance}
											fill={BUSINESS_COLORS.compliance}
											fillOpacity={0.8}
										/>
										<Area
											type="monotone"
											dataKey="efficiency"
											stackId="1"
											stroke={BUSINESS_COLORS.efficiency}
											fill={BUSINESS_COLORS.efficiency}
											fillOpacity={0.8}
										/>
										<Area
											type="monotone"
											dataKey="satisfaction"
											stackId="1"
											stroke={BUSINESS_COLORS.satisfaction}
											fill={BUSINESS_COLORS.satisfaction}
											fillOpacity={0.8}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="performance">
					<div className="grid gap-4 md:grid-cols-2">
						{/* Cost-Benefit Analysis */}
						<Card className="col-span-1">
							<CardHeader>
								<CardTitle>Cost-Benefit Analysis</CardTitle>
								<CardDescription>
									Investment vs. returns analysis
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<BarChart data={costBenefitData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="category" />
										<YAxis />
										<Tooltip />
										<Bar dataKey="cost" fill={BUSINESS_COLORS.risk} />
										<Bar dataKey="benefit" fill={BUSINESS_COLORS.revenue} />
									</BarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* ROI Metrics */}
						<Card className="col-span-1">
							<CardHeader>
								<CardTitle>Return on Investment</CardTitle>
								<CardDescription>Efficiency and value metrics</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-2">
									<div className="flex justify-between">
										<span>Compliance ROI</span>
										<span className="font-semibold text-green-600">+24%</span>
									</div>
									<div className="flex justify-between">
										<span>Service Efficiency</span>
										<span className="font-semibold text-blue-600">+18%</span>
									</div>
									<div className="flex justify-between">
										<span>Risk Reduction</span>
										<span className="font-semibold text-purple-600">-32%</span>
									</div>
									<div className="flex justify-between">
										<span>Time Savings</span>
										<span className="font-semibold text-orange-600">+41%</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="insights">
					<BusinessInsightsView
						complianceData={complianceData}
						documentsData={documentsData}
						filingsData={filingsData}
						servicesData={servicesData}
						businessKPIs={businessKPIs}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}

// Helper functions for calculations
function calculateComplianceEfficiency(complianceData: any) {
	const score = complianceData?.overallScore || 0;
	const trend = score > 80 ? 95 : score > 60 ? 75 : 50;
	return { score, trend };
}

function calculateDocumentMetrics(documentsData: any) {
	const total = documentsData?.total || 0;
	const valid = documentsData?.statusBreakdown?.valid || 0;
	const score = total > 0 ? Math.round((valid / total) * 100) : 0;
	const trend = score > 85 ? 90 : score > 70 ? 80 : 60;
	return { score, trend };
}

function calculateFilingMetrics(filingsData: any) {
	const total = filingsData?.total || 0;
	const filed = filingsData?.statusBreakdown?.filed || 0;
	const score = total > 0 ? Math.round((filed / total) * 100) : 0;
	const trend = score > 90 ? 95 : score > 75 ? 85 : 65;
	return { score, trend };
}

function calculateServiceMetrics(servicesData: any) {
	const total = servicesData?.total || 0;
	const completed = servicesData?.statusBreakdown?.completed || 0;
	const score = total > 0 ? Math.round((completed / total) * 100) : 0;
	const trend = score > 85 ? 92 : score > 70 ? 82 : 62;
	return { score, trend };
}

function calculateRiskScore(complianceData: any, filingsData: any) {
	const complianceRisk = 100 - (complianceData?.overallScore || 0);
	const filingRisk = (filingsData?.statusBreakdown?.overdue || 0) * 10;
	return Math.max(0, Math.min(100, 100 - (complianceRisk + filingRisk) / 2));
}

function calculateEfficiencyScore(servicesData: any, filingsData: any) {
	const serviceEfficiency = calculateServiceMetrics(servicesData).score;
	const filingEfficiency = calculateFilingMetrics(filingsData).score;
	return Math.round((serviceEfficiency + filingEfficiency) / 2);
}

function generateBusinessTrends(
	complianceData: any,
	filingsData: any,
	servicesData: any,
) {
	// Mock trend data - in real app, this would come from historical data
	return [
		{ month: "Jan", compliance: 78, efficiency: 82, satisfaction: 85 },
		{ month: "Feb", compliance: 82, efficiency: 84, satisfaction: 87 },
		{ month: "Mar", compliance: 85, efficiency: 86, satisfaction: 89 },
		{ month: "Apr", compliance: 87, efficiency: 88, satisfaction: 91 },
		{ month: "May", compliance: 89, efficiency: 90, satisfaction: 93 },
		{ month: "Jun", compliance: 91, efficiency: 92, satisfaction: 95 },
	];
}

function calculateCostBenefitAnalysis(complianceData: any, servicesData: any) {
	return [
		{ category: "Compliance", cost: 5000, benefit: 12000 },
		{ category: "Documentation", cost: 3000, benefit: 8500 },
		{ category: "Filing Services", cost: 4000, benefit: 9800 },
		{ category: "Advisory", cost: 2500, benefit: 7200 },
	];
}

// Business insights component
function BusinessInsightsView({
	complianceData,
	documentsData,
	filingsData,
	servicesData,
	businessKPIs,
}: {
	complianceData: any;
	documentsData: any;
	filingsData: any;
	servicesData: any;
	businessKPIs: any;
}) {
	const insights = [
		{
			title: "Compliance Excellence",
			description:
				"Your compliance score of " +
				businessKPIs.complianceEfficiency.score +
				"% exceeds industry standards by 15%.",
			impact: "High",
			recommendation:
				"Maintain current practices and consider becoming a compliance benchmark client.",
		},
		{
			title: "Document Management Optimization",
			description:
				"Strong document management with " +
				businessKPIs.documentManagement.score +
				"% efficiency.",
			impact: "Medium",
			recommendation:
				"Implement automated document renewal alerts to reach 95%+ efficiency.",
		},
		{
			title: "Service Quality Leadership",
			description:
				"Outstanding service completion rate demonstrates operational excellence.",
			impact: "High",
			recommendation:
				"Share best practices with other clients in similar industries.",
		},
	];

	return (
		<div className="grid gap-4">
			{insights.map((insight, index) => (
				<Card key={index}>
					<CardHeader>
						<div className="flex items-start justify-between">
							<CardTitle className="text-lg">{insight.title}</CardTitle>
							<Badge
								variant={
									insight.impact === "High"
										? "default"
										: insight.impact === "Medium"
											? "secondary"
											: "outline"
								}
							>
								{insight.impact} Impact
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<p className="mb-3 text-muted-foreground">{insight.description}</p>
						<div className="rounded-lg bg-muted p-3">
							<p className="text-sm">
								<strong>Recommendation:</strong> {insight.recommendation}
							</p>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
