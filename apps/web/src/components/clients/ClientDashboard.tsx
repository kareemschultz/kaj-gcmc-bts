"use client";

import {
	AlertTriangle,
	Calendar,
	CheckCircle,
	Clock,
	DollarSign,
	FileCheck,
	FileText,
	TrendingUp,
	Users,
	XCircle,
} from "lucide-react";
import { useMemo } from "react";
import {
	AreaChart,
	Area,
	BarChart,
	Bar,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	CartesianGrid,
	Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import { BusinessMetricsVisualization } from "./BusinessMetricsVisualization";

interface ClientDashboardProps {
	clientId: number;
}

// Chart color schemes
const COLORS = {
	primary: "#3b82f6",
	success: "#22c55e",
	warning: "#f59e0b",
	danger: "#ef4444",
	info: "#06b6d4",
	purple: "#8b5cf6",
	pink: "#ec4899",
};

const PIE_COLORS = [COLORS.success, COLORS.warning, COLORS.danger, COLORS.info];

export function ClientDashboard({ clientId }: ClientDashboardProps) {
	const { data: client, isLoading: clientLoading } =
		trpc.clientAnalytics.getById.useQuery(clientId);
	const { data: complianceData, isLoading: complianceLoading } =
		trpc.clientAnalytics.complianceStats.useQuery(clientId);
	const { data: documentsData, isLoading: documentsLoading } =
		trpc.clientAnalytics.documentsAnalytics.useQuery(clientId);
	const { data: filingsData, isLoading: filingsLoading } =
		trpc.clientAnalytics.filingsAnalytics.useQuery(clientId);
	const { data: servicesData, isLoading: servicesLoading } =
		trpc.clientAnalytics.servicesAnalytics.useQuery(clientId);
	const { data: timelineData, isLoading: timelineLoading } =
		trpc.clientAnalytics.activityTimeline.useQuery(clientId);

	const isLoading =
		clientLoading ||
		complianceLoading ||
		documentsLoading ||
		filingsLoading ||
		servicesLoading ||
		timelineLoading;

	// Process data for charts
	const chartData = useMemo(() => {
		if (!filingsData || !documentsData || !complianceData) return null;

		// Filings status pie chart data
		const filingsStatusData = [
			{
				name: "Filed",
				value: filingsData.statusBreakdown.filed || 0,
				color: COLORS.success,
			},
			{
				name: "In Progress",
				value: filingsData.statusBreakdown.inProgress || 0,
				color: COLORS.info,
			},
			{
				name: "Overdue",
				value: filingsData.statusBreakdown.overdue || 0,
				color: COLORS.danger,
			},
			{
				name: "Draft",
				value: filingsData.statusBreakdown.draft || 0,
				color: COLORS.warning,
			},
		];

		// Documents status pie chart data
		const documentsStatusData = [
			{
				name: "Valid",
				value: documentsData.statusBreakdown.valid || 0,
				color: COLORS.success,
			},
			{
				name: "Expiring Soon",
				value: documentsData.statusBreakdown.expiringSoon || 0,
				color: COLORS.warning,
			},
			{
				name: "Expired",
				value: documentsData.statusBreakdown.expired || 0,
				color: COLORS.danger,
			},
		];

		// Monthly compliance trend
		const complianceTrendData = complianceData.monthlyTrend?.map(
			(month: any) => ({
				month: month.month,
				score: month.score,
				filings: month.filings,
				documents: month.documents,
			}),
		) || [];

		// Service requests over time
		const servicesTimelineData = servicesData?.monthlyStats?.map(
			(month: any) => ({
				month: month.month,
				completed: month.completed,
				pending: month.pending,
				total: month.completed + month.pending,
			}),
		) || [];

		return {
			filingsStatusData,
			documentsStatusData,
			complianceTrendData,
			servicesTimelineData,
		};
	}, [filingsData, documentsData, complianceData, servicesData]);

	if (isLoading) {
		return <ClientDashboardSkeleton />;
	}

	if (!client) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-muted-foreground">Client not found.</p>
				</CardContent>
			</Card>
		);
	}

	const complianceScore = complianceData?.overallScore || 0;
	const complianceLevel = complianceData?.level || "unknown";

	return (
		<div className="space-y-6">
			{/* Client Header */}
			<div className="flex items-start justify-between">
				<div className="space-y-1">
					<h1 className="font-bold text-3xl tracking-tight">{client.name}</h1>
					<div className="flex items-center gap-4 text-muted-foreground">
						<Badge variant="outline" className="capitalize">
							{client.type}
						</Badge>
						<span>{client.email}</span>
						{client.sector && <span>• {client.sector}</span>}
					</div>
				</div>
				<div className="text-right">
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground text-sm">
							Compliance Score
						</span>
						<Badge
							variant={
								complianceScore >= 80
									? "default"
									: complianceScore >= 60
										? "secondary"
										: "destructive"
							}
						>
							{complianceScore}%
						</Badge>
					</div>
					<p className="text-muted-foreground text-sm capitalize">
						{complianceLevel} Level
					</p>
				</div>
			</div>

			{/* Key Metrics Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total Documents</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{documentsData?.total || 0}
						</div>
						<p className="text-muted-foreground text-xs">
							{documentsData?.statusBreakdown?.expiringSoon || 0} expiring soon
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Active Filings</CardTitle>
						<FileCheck className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{filingsData?.total || 0}
						</div>
						<p className="text-muted-foreground text-xs">
							{filingsData?.statusBreakdown?.overdue || 0} overdue
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Service Requests
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{servicesData?.total || 0}
						</div>
						<p className="text-muted-foreground text-xs">
							{servicesData?.pending || 0} pending
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Outstanding Fees
						</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							${complianceData?.outstandingFees?.toLocaleString() || "0"}
						</div>
						<p className="text-muted-foreground text-xs">
							{complianceData?.pendingPayments || 0} pending payments
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Dashboard Tabs */}
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList className="grid grid-cols-7 w-full">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="analytics">Analytics</TabsTrigger>
					<TabsTrigger value="compliance">Compliance</TabsTrigger>
					<TabsTrigger value="documents">Documents</TabsTrigger>
					<TabsTrigger value="filings">Filings</TabsTrigger>
					<TabsTrigger value="services">Services</TabsTrigger>
					<TabsTrigger value="timeline">Activity</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						{/* Compliance Trend Chart */}
						<Card className="col-span-1">
							<CardHeader>
								<CardTitle>Compliance Trend</CardTitle>
								<CardDescription>
									Monthly compliance score over the last 12 months
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<AreaChart data={chartData?.complianceTrendData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="month" />
										<YAxis />
										<Tooltip />
										<Area
											type="monotone"
											dataKey="score"
											stroke={COLORS.primary}
											fill={COLORS.primary}
											fillOpacity={0.3}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Service Requests Timeline */}
						<Card className="col-span-1">
							<CardHeader>
								<CardTitle>Service Activity</CardTitle>
								<CardDescription>
									Service requests completion over time
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<BarChart data={chartData?.servicesTimelineData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="month" />
										<YAxis />
										<Tooltip />
										<Bar dataKey="completed" fill={COLORS.success} />
										<Bar dataKey="pending" fill={COLORS.warning} />
									</BarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						{/* Filings Status Distribution */}
						<Card>
							<CardHeader>
								<CardTitle>Filings Status</CardTitle>
								<CardDescription>
									Current status of all client filings
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={250}>
									<PieChart>
										<Pie
											data={chartData?.filingsStatusData}
											cx="50%"
											cy="50%"
											innerRadius={60}
											outerRadius={100}
											paddingAngle={5}
											dataKey="value"
										>
											{chartData?.filingsStatusData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Pie>
										<Tooltip />
										<Legend />
									</PieChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Documents Status Distribution */}
						<Card>
							<CardHeader>
								<CardTitle>Documents Status</CardTitle>
								<CardDescription>
									Current status of all client documents
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={250}>
									<PieChart>
										<Pie
											data={chartData?.documentsStatusData}
											cx="50%"
											cy="50%"
											innerRadius={60}
											outerRadius={100}
											paddingAngle={5}
											dataKey="value"
										>
											{chartData?.documentsStatusData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Pie>
										<Tooltip />
										<Legend />
									</PieChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="analytics" className="space-y-4">
					<BusinessMetricsVisualization
						clientId={clientId}
						complianceData={complianceData}
						documentsData={documentsData}
						filingsData={filingsData}
						servicesData={servicesData}
						timelineData={timelineData}
					/>
				</TabsContent>

				<TabsContent value="compliance" className="space-y-4">
					<ComplianceDetailsView
						clientId={clientId}
						complianceData={complianceData}
					/>
				</TabsContent>

				<TabsContent value="documents" className="space-y-4">
					<DocumentsDetailsView
						clientId={clientId}
						documentsData={documentsData}
					/>
				</TabsContent>

				<TabsContent value="filings" className="space-y-4">
					<FilingsDetailsView clientId={clientId} filingsData={filingsData} />
				</TabsContent>

				<TabsContent value="services" className="space-y-4">
					<ServicesDetailsView
						clientId={clientId}
						servicesData={servicesData}
					/>
				</TabsContent>

				<TabsContent value="timeline" className="space-y-4">
					<TimelineView clientId={clientId} timelineData={timelineData} />
				</TabsContent>
			</Tabs>
		</div>
	);
}

// Skeleton loading component
function ClientDashboardSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-48" />
				</div>
				<Skeleton className="h-6 w-20" />
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
							<Skeleton className="mt-1 h-3 w-20" />
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{Array.from({ length: 2 }).map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-32" />
							<Skeleton className="h-4 w-48" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-64 w-full" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

// Sub-components for detailed views
function ComplianceDetailsView({
	clientId,
	complianceData,
}: {
	clientId: number;
	complianceData: any;
}) {
	return (
		<div className="grid gap-4 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Compliance Score Breakdown</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{complianceData?.scoreBreakdown?.map((item: any) => (
						<div key={item.category} className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>{item.category}</span>
								<span>{item.score}%</span>
							</div>
							<Progress value={item.score} className="h-2" />
						</div>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Compliance Alerts</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{complianceData?.alerts?.map((alert: any, index: number) => (
						<div key={index} className="flex items-start gap-3">
							<AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
							<div>
								<p className="text-sm">{alert.message}</p>
								<p className="text-muted-foreground text-xs">{alert.dueDate}</p>
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

function DocumentsDetailsView({
	clientId,
	documentsData,
}: {
	clientId: number;
	documentsData: any;
}) {
	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Documents by Category</CardTitle>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={documentsData?.byCategory}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="category" />
							<YAxis />
							<Tooltip />
							<Bar dataKey="count" fill={COLORS.primary} />
						</BarChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Expiring Documents</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{documentsData?.expiring?.map((doc: any) => (
							<div key={doc.id} className="flex items-center justify-between">
								<div>
									<p className="font-medium">{doc.type}</p>
									<p className="text-muted-foreground text-sm">{doc.name}</p>
								</div>
								<Badge
									variant={
										doc.daysUntilExpiry <= 7 ? "destructive" : "secondary"
									}
								>
									{doc.daysUntilExpiry} days
								</Badge>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function FilingsDetailsView({
	clientId,
	filingsData,
}: {
	clientId: number;
	filingsData: any;
}) {
	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Filing Deadlines</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{filingsData?.upcoming?.map((filing: any) => (
							<div key={filing.id} className="flex items-center justify-between">
								<div>
									<p className="font-medium">{filing.type}</p>
									<p className="text-muted-foreground text-sm">
										{filing.period}
									</p>
								</div>
								<div className="text-right">
									<p className="text-sm">{filing.dueDate}</p>
									<Badge
										variant={
											filing.daysUntilDue <= 7
												? "destructive"
												: filing.daysUntilDue <= 30
													? "secondary"
													: "outline"
										}
									>
										{filing.daysUntilDue} days
									</Badge>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function ServicesDetailsView({
	clientId,
	servicesData,
}: {
	clientId: number;
	servicesData: any;
}) {
	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Service Requests Status</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{servicesData?.recent?.map((service: any) => (
							<div key={service.id} className="flex items-center justify-between">
								<div>
									<p className="font-medium">{service.type}</p>
									<p className="text-muted-foreground text-sm">
										{service.description}
									</p>
								</div>
								<Badge
									variant={
										service.status === "completed"
											? "default"
											: service.status === "in_progress"
												? "secondary"
												: "outline"
									}
								>
									{service.status}
								</Badge>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function TimelineView({
	clientId,
	timelineData,
}: {
	clientId: number;
	timelineData: any;
}) {
	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{timelineData?.activities?.map((activity: any) => (
							<div key={activity.id} className="flex gap-3">
								<div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
									<div className="h-2 w-2 rounded-full bg-white" />
								</div>
								<div className="space-y-1">
									<p className="text-sm">{activity.description}</p>
									<p className="text-muted-foreground text-xs">
										{activity.timestamp}
									</p>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}