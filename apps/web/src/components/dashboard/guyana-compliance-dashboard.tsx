"use client";

import {
	AlertTriangle,
	Building2,
	Calendar,
	CalendarDays,
	DollarSign,
	FileText,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

/**
 * Enhanced Guyana Compliance Dashboard
 *
 * Specialized dashboard for Guyana business tax compliance:
 * - GRT & GRA filing status tracking
 * - Tax deadline monitoring with penalties
 * - Business type-specific compliance requirements
 * - Agency portal integration status
 * - Quick actions for common tasks
 */

interface GuyanaComplianceStats {
	totalClients: number;
	soleTraders: number;
	companies: number;
	overdueFilings: number;
	upcomingDeadlines: number;
	totalPenalties: number;
	activeGRAFilings: number;
	compliantClients: number;
}

export function GuyanaComplianceDashboard() {
	const { data: overview, isLoading } = trpc.dashboard.overview.useQuery();
	const { data: complianceData, isLoading: complianceLoading } =
		trpc.dashboard.complianceOverview.useQuery();
	const { data: guyanaStats, isLoading: guyanaLoading } =
		trpc.guyana.complianceStats.useQuery();

	if (isLoading || complianceLoading || guyanaLoading) {
		return <GuyanaComplianceSkeleton />;
	}

	// Calculate Guyana-specific metrics
	const complianceRate = overview?.counts?.clients
		? ((complianceData?.byLevel?.high || 0) / overview.counts.clients) * 100
		: 0;

	const upcomingDeadlines = guyanaStats?.upcomingDeadlines || 0;
	const overdueCount = overview?.alerts?.overdueFilings || 0;
	const totalPenalties = guyanaStats?.totalPenalties || 0;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-2xl">Guyana Tax Compliance</h2>
					<p className="text-muted-foreground">
						GRA & GRT compliance tracking for your clients
					</p>
				</div>
				<Button>Generate Compliance Report</Button>
			</div>

			{/* Key Metrics Row */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card className="border-l-4 border-l-brand">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Compliance Rate
						</CardTitle>
						<Building2 className="h-4 w-4 text-brand" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{complianceRate.toFixed(1)}%
						</div>
						<Progress value={complianceRate} className="mt-2" />
						<p className="mt-2 text-muted-foreground text-xs">
							{complianceData?.byLevel?.high || 0} of{" "}
							{overview?.counts?.clients || 0} clients
						</p>
					</CardContent>
				</Card>

				<Card
					className={`border-l-4 ${upcomingDeadlines > 0 ? "border-l-warning" : "border-l-success"}`}
				>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Upcoming Deadlines
						</CardTitle>
						<CalendarDays
							className={`h-4 w-4 ${upcomingDeadlines > 0 ? "text-warning" : "text-success"}`}
						/>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{upcomingDeadlines}</div>
						<p className="text-muted-foreground text-xs">Next 30 days</p>
						{upcomingDeadlines > 0 && (
							<Badge variant="warning" className="mt-2">
								Action Required
							</Badge>
						)}
					</CardContent>
				</Card>

				<Card
					className={`border-l-4 ${overdueCount > 0 ? "border-l-destructive" : "border-l-success"}`}
				>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Overdue Filings
						</CardTitle>
						<AlertTriangle
							className={`h-4 w-4 ${overdueCount > 0 ? "text-destructive" : "text-success"}`}
						/>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{overdueCount}</div>
						<p className="text-muted-foreground text-xs">Immediate attention</p>
						{overdueCount > 0 && (
							<Badge variant="destructive" className="mt-2">
								Critical
							</Badge>
						)}
					</CardContent>
				</Card>

				<Card
					className={`border-l-4 ${totalPenalties > 0 ? "border-l-warning" : "border-l-success"}`}
				>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Penalties
						</CardTitle>
						<DollarSign
							className={`h-4 w-4 ${totalPenalties > 0 ? "text-warning" : "text-success"}`}
						/>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							${totalPenalties.toLocaleString()}
						</div>
						<p className="text-muted-foreground text-xs">GYD accumulated</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Grid */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{/* Filing Status Overview */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>GRA Filing Status</CardTitle>
						<CardDescription>
							Current status of tax filings with GRA
						</CardDescription>
					</CardHeader>
					<CardContent>
						<FilingStatusWidget />
					</CardContent>
				</Card>

				{/* Quick Actions */}
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
						<CardDescription>Common compliance tasks</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button variant="outline" className="w-full justify-start">
							<FileText className="mr-2 h-4 w-4" />
							Generate Tax Return
						</Button>
						<Button variant="outline" className="w-full justify-start">
							<Calendar className="mr-2 h-4 w-4" />
							Check Filing Calendar
						</Button>
						<Button variant="outline" className="w-full justify-start">
							<Building2 className="mr-2 h-4 w-4" />
							Update Client Info
						</Button>
						<Button variant="outline" className="w-full justify-start">
							<DollarSign className="mr-2 h-4 w-4" />
							Calculate Penalties
						</Button>
					</CardContent>
				</Card>

				{/* Business Type Distribution */}
				<BusinessTypeDistribution />

				{/* Deadline Calendar */}
				<UpcomingDeadlinesWidget />

				{/* Penalty Tracker */}
				<PenaltyTracker />
			</div>
		</div>
	);
}

function FilingStatusWidget() {
	const { data: filingStatus } = trpc.guyana.filingStatus.useQuery();

	const statuses = [
		{
			label: "Submitted",
			count: filingStatus?.submitted || 0,
			color: "bg-success",
			variant: "success" as const,
		},
		{
			label: "In Progress",
			count: filingStatus?.inProgress || 0,
			color: "bg-info",
			variant: "info" as const,
		},
		{
			label: "Pending",
			count: filingStatus?.pending || 0,
			color: "bg-warning",
			variant: "warning" as const,
		},
		{
			label: "Overdue",
			count: filingStatus?.overdue || 0,
			color: "bg-destructive",
			variant: "destructive" as const,
		},
	];

	const total = statuses.reduce((sum, status) => sum + status.count, 0);

	return (
		<div className="space-y-4">
			{statuses.map((status) => (
				<div key={status.label} className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className={`h-3 w-3 rounded-full ${status.color}`} />
						<span className="font-medium text-sm">{status.label}</span>
						<Badge variant={status.variant}>{status.count}</Badge>
					</div>
					<div className="text-muted-foreground text-sm">
						{total > 0 ? ((status.count / total) * 100).toFixed(1) : 0}%
					</div>
				</div>
			))}
		</div>
	);
}

function BusinessTypeDistribution() {
	const { data: clientData } = trpc.dashboard.overview.useQuery();

	return (
		<Card>
			<CardHeader>
				<CardTitle>Client Types</CardTitle>
				<CardDescription>Business classification breakdown</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-sm">Sole Traders</span>
						<Badge variant="outline">12</Badge>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm">Companies</span>
						<Badge variant="outline">8</Badge>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm">Partnerships</span>
						<Badge variant="outline">3</Badge>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm">Non-Profits</span>
						<Badge variant="outline">1</Badge>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function UpcomingDeadlinesWidget() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Upcoming Deadlines</CardTitle>
				<CardDescription>Critical filing dates</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="flex items-center justify-between border-l-4 border-l-warning pl-3">
						<div>
							<p className="font-medium text-sm">GRT Monthly Return</p>
							<p className="text-muted-foreground text-xs">5 clients</p>
						</div>
						<Badge variant="warning">Dec 15</Badge>
					</div>
					<div className="flex items-center justify-between border-l-4 border-l-info pl-3">
						<div>
							<p className="font-medium text-sm">Corporation Tax</p>
							<p className="text-muted-foreground text-xs">2 clients</p>
						</div>
						<Badge variant="outline">Jan 31</Badge>
					</div>
					<div className="flex items-center justify-between border-l-4 border-l-success pl-3">
						<div>
							<p className="font-medium text-sm">PAYE Returns</p>
							<p className="text-muted-foreground text-xs">8 clients</p>
						</div>
						<Badge variant="success">Feb 15</Badge>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function PenaltyTracker() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Penalty Tracker</CardTitle>
				<CardDescription>Outstanding penalties by client</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium text-sm">ABC Trading Ltd</p>
							<p className="text-muted-foreground text-xs">Late GRT filing</p>
						</div>
						<Badge variant="destructive">$500</Badge>
					</div>
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium text-sm">XYZ Services</p>
							<p className="text-muted-foreground text-xs">Late PAYE payment</p>
						</div>
						<Badge variant="warning">$250</Badge>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="font-medium">Total Outstanding</span>
						<span className="font-bold text-destructive">$750</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function GuyanaComplianceSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Skeleton className="h-8 w-64" />
					<Skeleton className="mt-2 h-4 w-96" />
				</div>
				<Skeleton className="h-10 w-32" />
			</div>

			<div className="grid gap-4 md:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
							<Skeleton className="mt-2 h-2 w-full" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
