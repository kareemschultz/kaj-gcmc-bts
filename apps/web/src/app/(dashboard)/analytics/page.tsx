"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChartComponent } from "@/components/analytics/BarChartComponent";
import { LineChartComponent } from "@/components/analytics/LineChartComponent";
import { PieChartComponent } from "@/components/analytics/PieChartComponent";
import { KPICard } from "@/components/analytics/KPICard";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { ExportButton } from "@/components/analytics/ExportButton";
import { TrendIndicator } from "@/components/analytics/TrendIndicator";
import { trpc } from "@/utils/trpc";
import {
	BarChart3,
	Users,
	FileText,
	ClipboardList,
	DollarSign,
	Shield,
	Activity,
	TrendingUp
} from "lucide-react";

export default function AnalyticsPage() {
	const [dateRange, setDateRange] = useState<{
		startDate?: string;
		endDate?: string;
	}>({});

	const chartRef = useRef<HTMLDivElement>(null);

	// Fetch analytics data
	const { data: clientAnalytics } = trpc.analytics.clients.useQuery(dateRange);
	const { data: documentAnalytics } = trpc.analytics.documents.useQuery(dateRange);
	const { data: filingAnalytics } = trpc.analytics.filings.useQuery(dateRange);
	const { data: serviceAnalytics } = trpc.analytics.serviceRequests.useQuery(dateRange);
	const { data: complianceAnalytics } = trpc.analytics.compliance.useQuery();
	const { data: revenueAnalytics } = trpc.analytics.revenue.useQuery(dateRange);
	const { data: activityAnalytics } = trpc.analytics.userActivity.useQuery(dateRange);

	const isLoading = !clientAnalytics || !documentAnalytics || !filingAnalytics;

	if (isLoading) {
		return (
			<div className="container mx-auto py-8">
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
			<div className="flex flex-col gap-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
						<p className="text-muted-foreground">
							Comprehensive insights and performance metrics
						</p>
					</div>
					<div className="flex items-center gap-4">
						<DateRangePicker
							value={dateRange}
							onChange={setDateRange}
						/>
						<ExportButton
							data={[
								{ metric: "Total Clients", value: clientAnalytics?.total || 0 },
								{ metric: "Total Documents", value: documentAnalytics?.total || 0 },
								{ metric: "Total Filings", value: filingAnalytics?.total || 0 },
								{ metric: "Total Revenue", value: revenueAnalytics?.totalRevenue || 0 },
							]}
							chartRef={chartRef}
							filename="analytics-report"
						/>
					</div>
				</div>

				{/* KPI Cards */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<KPICard
						title="Total Clients"
						value={clientAnalytics?.total || 0}
						icon={Users}
						trend={clientAnalytics?.growth}
					/>
					<KPICard
						title="Total Documents"
						value={documentAnalytics?.total || 0}
						icon={FileText}
						subtitle={`${documentAnalytics?.expiringCount || 0} expiring soon`}
					/>
					<KPICard
						title="Filing Completion Rate"
						value={`${filingAnalytics?.onTimeRate?.toFixed(1) || 0}%`}
						icon={ClipboardList}
						subtitle={`${filingAnalytics?.overdueCount || 0} overdue`}
					/>
					<KPICard
						title="Total Revenue"
						value={`$${(revenueAnalytics?.totalRevenue || 0).toLocaleString()}`}
						icon={DollarSign}
						subtitle={`${revenueAnalytics?.totalRequests || 0} requests completed`}
					/>
				</div>

				{/* Analytics Tabs */}
				<div ref={chartRef}>
					<Tabs defaultValue="overview" className="space-y-4">
						<TabsList className="grid w-full grid-cols-6">
							<TabsTrigger value="overview">Overview</TabsTrigger>
							<TabsTrigger value="clients">Clients</TabsTrigger>
							<TabsTrigger value="documents">Documents</TabsTrigger>
							<TabsTrigger value="filings">Filings</TabsTrigger>
							<TabsTrigger value="compliance">Compliance</TabsTrigger>
							<TabsTrigger value="activity">Activity</TabsTrigger>
						</TabsList>

						<TabsContent value="overview" className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<TrendingUp className="h-4 w-4" />
											Revenue Trends
										</CardTitle>
									</CardHeader>
									<CardContent>
										<BarChartComponent
											data={revenueAnalytics?.byService?.map(service => ({
												name: `Service ${service.serviceId}`,
												value: service.revenue,
											})) || []}
											xAxisKey="name"
											yAxisKey="value"
										/>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Shield className="h-4 w-4" />
											Compliance Overview
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">Average Score</span>
												<span className="text-2xl font-bold">
													{complianceAnalytics?.averageScore?.toFixed(1) || 0}%
												</span>
											</div>
											<PieChartComponent
												data={complianceAnalytics?.byLevel?.map(level => ({
													name: level.level,
													value: level._count,
												})) || []}
											/>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						<TabsContent value="clients" className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>Clients by Type</CardTitle>
									</CardHeader>
									<CardContent>
										<PieChartComponent
											data={clientAnalytics?.byType?.map(type => ({
												name: type.type,
												value: type._count,
											})) || []}
										/>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Clients by Sector</CardTitle>
									</CardHeader>
									<CardContent>
										<BarChartComponent
											data={clientAnalytics?.bySector?.map(sector => ({
												name: sector.sector || 'Other',
												value: sector._count,
											})) || []}
											xAxisKey="name"
											yAxisKey="value"
										/>
									</CardContent>
								</Card>
							</div>

							<Card>
								<CardHeader>
									<CardTitle>Risk Level Distribution</CardTitle>
								</CardHeader>
								<CardContent>
									<BarChartComponent
										data={clientAnalytics?.byRiskLevel?.map(risk => ({
											name: risk.riskLevel || 'Unassigned',
											value: risk._count,
										})) || []}
										xAxisKey="name"
										yAxisKey="value"
									/>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="documents" className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>Document Status</CardTitle>
									</CardHeader>
									<CardContent>
										<PieChartComponent
											data={documentAnalytics?.byStatus?.map(status => ({
												name: status.status,
												value: status._count,
											})) || []}
										/>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Document Types</CardTitle>
									</CardHeader>
									<CardContent>
										<BarChartComponent
											data={documentAnalytics?.byType?.map(type => ({
												name: `Type ${type.documentTypeId}`,
												value: type._count,
											})) || []}
											xAxisKey="name"
											yAxisKey="value"
										/>
									</CardContent>
								</Card>
							</div>

							<div className="grid gap-4 md:grid-cols-3">
								<Card>
									<CardHeader>
										<CardTitle>Expiring Documents</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-amber-600">
											{documentAnalytics?.expiringCount || 0}
										</div>
										<p className="text-xs text-muted-foreground">
											Within 30 days
										</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Total Versions</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{documentAnalytics?.totalVersions || 0}
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Avg Versions/Doc</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{documentAnalytics?.averageVersionsPerDocument?.toFixed(1) || 0}
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						<TabsContent value="filings" className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>Filing Status</CardTitle>
									</CardHeader>
									<CardContent>
										<PieChartComponent
											data={filingAnalytics?.byStatus?.map(status => ({
												name: status.status,
												value: status._count,
											})) || []}
										/>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Filing Types</CardTitle>
									</CardHeader>
									<CardContent>
										<BarChartComponent
											data={filingAnalytics?.byType?.map(type => ({
												name: `Type ${type.filingTypeId}`,
												value: type._count,
											})) || []}
											xAxisKey="name"
											yAxisKey="value"
										/>
									</CardContent>
								</Card>
							</div>

							<div className="grid gap-4 md:grid-cols-3">
								<Card>
									<CardHeader>
										<CardTitle>On-Time Rate</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-green-600">
											{filingAnalytics?.onTimeRate?.toFixed(1) || 0}%
										</div>
										<TrendIndicator value={filingAnalytics?.onTimeRate || 0} />
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Overdue Filings</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-red-600">
											{filingAnalytics?.overdueCount || 0}
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Completed Filings</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">
											{filingAnalytics?.submittedCount || 0}
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						<TabsContent value="compliance" className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>Compliance Distribution</CardTitle>
									</CardHeader>
									<CardContent>
										<PieChartComponent
											data={complianceAnalytics?.byLevel?.map(level => ({
												name: level.level,
												value: level._count,
											})) || []}
										/>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Compliance Metrics</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div>
												<div className="flex items-center justify-between">
													<span className="text-sm font-medium">Average Score</span>
													<span className="text-lg font-bold">
														{complianceAnalytics?.averageScore?.toFixed(1) || 0}%
													</span>
												</div>
												<div className="w-full bg-gray-200 rounded-full h-2.5">
													<div
														className="bg-blue-600 h-2.5 rounded-full"
														style={{
															width: `${complianceAnalytics?.averageScore || 0}%`
														}}
													/>
												</div>
											</div>

											<div className="grid grid-cols-2 gap-4 text-center">
												<div>
													<div className="text-lg font-bold text-green-600">
														{complianceAnalytics?.clientsAboveThreshold || 0}
													</div>
													<div className="text-xs text-muted-foreground">Above 70%</div>
												</div>
												<div>
													<div className="text-lg font-bold text-red-600">
														{complianceAnalytics?.clientsBelowThreshold || 0}
													</div>
													<div className="text-xs text-muted-foreground">Below 50%</div>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</TabsContent>

						<TabsContent value="activity" className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<Card>
									<CardHeader>
										<CardTitle>User Activity</CardTitle>
									</CardHeader>
									<CardContent>
										<BarChartComponent
											data={activityAnalytics?.byUser?.slice(0, 10)?.map(user => ({
												name: `User ${user.userId.slice(-8)}`,
												value: user.count,
											})) || []}
											xAxisKey="name"
											yAxisKey="value"
										/>
									</CardContent>
								</Card>

								<Card>
									<CardHeader>
										<CardTitle>Actions Distribution</CardTitle>
									</CardHeader>
									<CardContent>
										<PieChartComponent
											data={activityAnalytics?.byAction?.map(action => ({
												name: action.action,
												value: action.count,
											})) || []}
										/>
									</CardContent>
								</Card>
							</div>

							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Activity className="h-4 w-4" />
										Total Actions
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold">
										{activityAnalytics?.totalActions?.toLocaleString() || 0}
									</div>
									<p className="text-sm text-muted-foreground">
										Total system actions recorded
									</p>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}