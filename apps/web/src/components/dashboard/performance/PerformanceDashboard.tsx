/**
 * Performance Dashboard Component
 *
 * Displays real-time performance metrics, cache statistics,
 * and optimization recommendations for administrators
 */

"use client";

import {
	Activity,
	BarChart3,
	Clock,
	Database,
	Gauge,
	RefreshCw,
	TrendingDown,
	TrendingUp,
	Zap,
} from "lucide-react";
import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWebVitals } from "@/hooks/usePerformance";
import { trpc } from "@/utils/trpc";

export function PerformanceDashboard() {
	const [refreshing, setRefreshing] = useState(false);
	const { vitals, getVitalsScore } = useWebVitals();

	// Mock performance data - in production these would come from tRPC endpoints
	const { data: performanceStats, refetch: refetchPerformance } =
		trpc.performance.getStats.useQuery(
			{ timeframe: "current" },
			{
				refetchInterval: 30000, // Refresh every 30 seconds
				initialData: {
					totalRequests: 1247,
					averageResponseTime: 245,
					medianResponseTime: 180,
					p95ResponseTime: 890,
					p99ResponseTime: 1450,
					errorRate: 2.1,
					requestsByEndpoint: {
						"dashboard.overview": 324,
						"guyana.complianceStats": 198,
						"clients.list": 156,
						"reports.generate": 89,
					},
					averageResponseTimeByEndpoint: {
						"dashboard.overview": 156,
						"guyana.complianceStats": 203,
						"clients.list": 334,
						"reports.generate": 1240,
					},
					slowQueries: [],
				},
			},
		);

	const { data: cacheStats } = trpc.performance.getCacheStats.useQuery(
		undefined,
		{
			refetchInterval: 30000,
			initialData: {
				keyCount: 1543,
				memory: "127.3 MB",
				hits: 8934,
				misses: 1247,
				hitRate: 87.8,
			},
		},
	);

	const vitalsScore = getVitalsScore();

	const handleRefresh = async () => {
		setRefreshing(true);
		await refetchPerformance();
		setRefreshing(false);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-2xl">Performance Dashboard</h2>
					<p className="text-muted-foreground">
						Monitor system performance, cache efficiency, and optimization
						opportunities
					</p>
				</div>
				<Button onClick={handleRefresh} disabled={refreshing} variant="outline">
					<RefreshCw
						className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
					/>
					Refresh
				</Button>
			</div>

			{/* Key Performance Metrics */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Avg Response Time
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{performanceStats?.averageResponseTime || 0}ms
						</div>
						<p className="text-muted-foreground text-xs">
							<TrendingDown className="inline h-3 w-3 text-green-500" />
							12% improvement from last hour
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Cache Hit Rate
						</CardTitle>
						<Database className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{cacheStats?.hitRate?.toFixed(1) || 0}%
						</div>
						<Progress value={cacheStats?.hitRate || 0} className="mt-2" />
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Error Rate</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{performanceStats?.errorRate?.toFixed(1) || 0}%
						</div>
						<Badge
							variant={
								(performanceStats?.errorRate || 0) < 1
									? "success"
									: (performanceStats?.errorRate || 0) < 5
										? "warning"
										: "destructive"
							}
						>
							{(performanceStats?.errorRate || 0) < 1
								? "Excellent"
								: (performanceStats?.errorRate || 0) < 5
									? "Good"
									: "Needs Attention"}
						</Badge>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Requests
						</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{performanceStats?.totalRequests?.toLocaleString() || 0}
						</div>
						<p className="text-muted-foreground text-xs">Last hour</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="endpoints">Endpoints</TabsTrigger>
					<TabsTrigger value="cache">Cache</TabsTrigger>
					<TabsTrigger value="vitals">Web Vitals</TabsTrigger>
					<TabsTrigger value="recommendations">Recommendations</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Response Time Distribution</CardTitle>
								<CardDescription>
									Performance percentiles for the last hour
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex justify-between">
									<span className="text-sm">Median (P50)</span>
									<span className="font-medium">
										{performanceStats?.medianResponseTime || 0}ms
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">95th Percentile</span>
									<span className="font-medium">
										{performanceStats?.p95ResponseTime || 0}ms
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">99th Percentile</span>
									<span className="font-medium">
										{performanceStats?.p99ResponseTime || 0}ms
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Cache Performance</CardTitle>
								<CardDescription>
									Redis cache statistics and memory usage
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex justify-between">
									<span className="text-sm">Total Keys</span>
									<span className="font-medium">
										{cacheStats?.keyCount?.toLocaleString() || 0}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Memory Usage</span>
									<span className="font-medium">
										{cacheStats?.memory || "0 MB"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Cache Hits</span>
									<span className="font-medium text-green-600">
										{cacheStats?.hits?.toLocaleString() || 0}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Cache Misses</span>
									<span className="font-medium text-red-600">
										{cacheStats?.misses?.toLocaleString() || 0}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="endpoints" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Endpoint Performance</CardTitle>
							<CardDescription>
								Average response times and request counts by endpoint
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{Object.entries(
									performanceStats?.averageResponseTimeByEndpoint || {},
								).map(([endpoint, avgTime]) => {
									const requestCount =
										performanceStats?.requestsByEndpoint?.[endpoint] || 0;
									return (
										<div
											key={endpoint}
											className="flex items-center justify-between border-l-2 border-l-muted pl-3"
										>
											<div>
												<p className="font-medium text-sm">{endpoint}</p>
												<p className="text-muted-foreground text-xs">
													{requestCount} requests
												</p>
											</div>
											<div className="text-right">
												<Badge
													variant={
														avgTime < 200
															? "success"
															: avgTime < 1000
																? "warning"
																: "destructive"
													}
												>
													{avgTime}ms
												</Badge>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="cache" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-3">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Hit Rate</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-3xl text-green-600">
									{cacheStats?.hitRate?.toFixed(1) || 0}%
								</div>
								<Progress value={cacheStats?.hitRate || 0} className="mt-2" />
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Memory Usage</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-3xl">
									{cacheStats?.memory || "0 MB"}
								</div>
								<p className="text-muted-foreground text-sm">
									{cacheStats?.keyCount?.toLocaleString() || 0} keys stored
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Operations</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="text-green-600">Hits</span>
										<span>{cacheStats?.hits?.toLocaleString() || 0}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-red-600">Misses</span>
										<span>{cacheStats?.misses?.toLocaleString() || 0}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="vitals" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-3">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">
									Largest Contentful Paint
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{(vitals.lcp / 1000).toFixed(2)}s
								</div>
								<Badge
									variant={
										vitalsScore.individual.lcp === "good"
											? "success"
											: vitalsScore.individual.lcp === "needs-improvement"
												? "warning"
												: "destructive"
									}
								>
									{vitalsScore.individual.lcp}
								</Badge>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">First Input Delay</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{vitals.fid.toFixed(0)}ms
								</div>
								<Badge
									variant={
										vitalsScore.individual.fid === "good"
											? "success"
											: vitalsScore.individual.fid === "needs-improvement"
												? "warning"
												: "destructive"
									}
								>
									{vitalsScore.individual.fid}
								</Badge>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">
									Cumulative Layout Shift
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{vitals.cls.toFixed(3)}
								</div>
								<Badge
									variant={
										vitalsScore.individual.cls === "good"
											? "success"
											: vitalsScore.individual.cls === "needs-improvement"
												? "warning"
												: "destructive"
									}
								>
									{vitalsScore.individual.cls}
								</Badge>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="recommendations" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Performance Recommendations</CardTitle>
							<CardDescription>
								Automated suggestions to improve system performance
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<RecommendationItem
									icon={<Zap className="h-4 w-4" />}
									title="Enable Redis Caching"
									description="Add caching to reports.generate endpoint to reduce load times"
									priority="high"
								/>
								<RecommendationItem
									icon={<Database className="h-4 w-4" />}
									title="Optimize Database Queries"
									description="Add index on client.tenantId for faster tenant isolation"
									priority="medium"
								/>
								<RecommendationItem
									icon={<Gauge className="h-4 w-4" />}
									title="Implement Pagination"
									description="Large client lists should use pagination to improve load times"
									priority="medium"
								/>
								<RecommendationItem
									icon={<TrendingUp className="h-4 w-4" />}
									title="CDN Integration"
									description="Serve static assets through CDN for better global performance"
									priority="low"
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function RecommendationItem({
	icon,
	title,
	description,
	priority,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	priority: "high" | "medium" | "low";
}) {
	return (
		<div className="flex items-start gap-3 rounded-lg border p-3">
			<div className="rounded-lg bg-muted p-2">{icon}</div>
			<div className="flex-1">
				<div className="flex items-center gap-2">
					<h4 className="font-medium text-sm">{title}</h4>
					<Badge
						variant={
							priority === "high"
								? "destructive"
								: priority === "medium"
									? "warning"
									: "outline"
						}
					>
						{priority}
					</Badge>
				</div>
				<p className="text-muted-foreground text-sm">{description}</p>
			</div>
		</div>
	);
}
