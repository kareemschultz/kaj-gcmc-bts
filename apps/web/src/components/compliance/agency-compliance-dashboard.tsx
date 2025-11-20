"use client";

import {
	Activity,
	AlertTriangle,
	Building2,
	Calendar,
	CheckCircle2,
	ChevronRight,
	Clock,
	FileText,
	Globe,
	Shield,
	TrendingDown,
	TrendingUp,
	Users,
	XCircle,
} from "lucide-react";
import Link from "next/link";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * Central Agency Compliance Dashboard
 *
 * Multi-agency overview with real-time health indicators for:
 * - GRA (Guyana Revenue Authority)
 * - NIS (National Insurance Scheme)
 * - DCRA (Deeds and Commercial Registry Authority)
 * - Immigration Department
 *
 * Features:
 * - Real-time compliance scores and trend analysis
 * - Urgent alerts and deadline notifications
 * - Quick action buttons for common tasks
 * - Interactive agency cards with detailed status
 * - Cross-agency dependency tracking
 */

interface AgencyStatus {
	id: string;
	name: string;
	shortName: string;
	description: string;
	complianceScore: number;
	trend: "up" | "down" | "stable";
	trendPercentage: number;
	urgentAlerts: number;
	upcomingDeadlines: number;
	activeSubmissions: number;
	totalClients: number;
	color: string;
	borderColor: string;
	bgColor: string;
	status: "excellent" | "good" | "warning" | "critical";
}

interface ComplianceDashboardProps {
	className?: string;
}

// Mock data - in production this would come from your API
const agencyStatuses: AgencyStatus[] = [
	{
		id: "gra",
		name: "Guyana Revenue Authority",
		shortName: "GRA",
		description: "Tax filings, VAT returns, and revenue compliance",
		complianceScore: 92,
		trend: "up",
		trendPercentage: 5.2,
		urgentAlerts: 2,
		upcomingDeadlines: 8,
		activeSubmissions: 15,
		totalClients: 45,
		color: "text-emerald-700",
		borderColor: "border-emerald-200",
		bgColor: "bg-emerald-50",
		status: "excellent",
	},
	{
		id: "nis",
		name: "National Insurance Scheme",
		shortName: "NIS",
		description: "Employee contributions and employer returns",
		complianceScore: 87,
		trend: "stable",
		trendPercentage: 0.8,
		urgentAlerts: 1,
		upcomingDeadlines: 12,
		activeSubmissions: 8,
		totalClients: 38,
		color: "text-blue-700",
		borderColor: "border-blue-200",
		bgColor: "bg-blue-50",
		status: "good",
	},
	{
		id: "dcra",
		name: "Deeds and Commercial Registry Authority",
		shortName: "DCRA",
		description: "Business registration and annual returns",
		complianceScore: 78,
		trend: "down",
		trendPercentage: -3.1,
		urgentAlerts: 5,
		upcomingDeadlines: 6,
		activeSubmissions: 3,
		totalClients: 28,
		color: "text-amber-700",
		borderColor: "border-amber-200",
		bgColor: "bg-amber-50",
		status: "warning",
	},
	{
		id: "immigration",
		name: "Immigration Department",
		shortName: "Immigration",
		description: "Work permits, visas, and residency permits",
		complianceScore: 94,
		trend: "up",
		trendPercentage: 8.7,
		urgentAlerts: 0,
		upcomingDeadlines: 4,
		activeSubmissions: 6,
		totalClients: 15,
		color: "text-purple-700",
		borderColor: "border-purple-200",
		bgColor: "bg-purple-50",
		status: "excellent",
	},
];

const overallStats = {
	averageScore: 87.8,
	totalAlerts: 8,
	totalDeadlines: 30,
	criticalItems: 3,
	trend: "up" as const,
	trendPercentage: 2.4,
};

export function AgencyComplianceDashboard({
	className,
}: ComplianceDashboardProps) {
	return (
		<div className={cn("space-y-6", className)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-3xl tracking-tight">
						Agency Compliance Dashboard
					</h2>
					<p className="text-lg text-muted-foreground">
						Comprehensive oversight of Guyana regulatory compliance
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline">
						<FileText className="mr-2 h-4 w-4" />
						Export Report
					</Button>
					<Button>
						<Activity className="mr-2 h-4 w-4" />
						Generate Analysis
					</Button>
				</div>
			</div>

			{/* Overall Health Indicators */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card className="border-l-4 border-l-brand">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Overall Compliance Score
						</CardTitle>
						<Shield className="h-4 w-4 text-brand" />
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<div className="font-bold text-2xl">
								{overallStats.averageScore.toFixed(1)}%
							</div>
							{overallStats.trend === "up" ? (
								<TrendingUp className="h-4 w-4 text-success" />
							) : (
								<TrendingDown className="h-4 w-4 text-destructive" />
							)}
							<span
								className={cn(
									"font-medium text-xs",
									overallStats.trend === "up"
										? "text-success"
										: "text-destructive",
								)}
							>
								{overallStats.trendPercentage > 0 ? "+" : ""}
								{overallStats.trendPercentage}%
							</span>
						</div>
						<Progress value={overallStats.averageScore} className="mt-2" />
						<p className="mt-2 text-muted-foreground text-xs">
							Across {agencyStatuses.length} agencies
						</p>
					</CardContent>
				</Card>

				<Card
					className={cn(
						"border-l-4",
						overallStats.totalAlerts > 0
							? "border-l-destructive"
							: "border-l-success",
					)}
				>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Urgent Alerts</CardTitle>
						<AlertTriangle
							className={cn(
								"h-4 w-4",
								overallStats.totalAlerts > 0
									? "text-destructive"
									: "text-success",
							)}
						/>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{overallStats.totalAlerts}</div>
						<p className="text-muted-foreground text-xs">
							Require immediate attention
						</p>
						{overallStats.totalAlerts > 0 && (
							<Badge variant="destructive" className="mt-2">
								Action Required
							</Badge>
						)}
					</CardContent>
				</Card>

				<Card
					className={cn(
						"border-l-4",
						overallStats.totalDeadlines > 5
							? "border-l-warning"
							: "border-l-info",
					)}
				>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Upcoming Deadlines
						</CardTitle>
						<Calendar
							className={cn(
								"h-4 w-4",
								overallStats.totalDeadlines > 5 ? "text-warning" : "text-info",
							)}
						/>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{overallStats.totalDeadlines}
						</div>
						<p className="text-muted-foreground text-xs">Next 30 days</p>
						{overallStats.criticalItems > 0 && (
							<Badge variant="warning" className="mt-2">
								{overallStats.criticalItems} Critical
							</Badge>
						)}
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-info">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Active Submissions
						</CardTitle>
						<Clock className="h-4 w-4 text-info" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{agencyStatuses.reduce(
								(sum, agency) => sum + agency.activeSubmissions,
								0,
							)}
						</div>
						<p className="text-muted-foreground text-xs">
							In progress across agencies
						</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="overview" className="space-y-6">
				<TabsList>
					<TabsTrigger value="overview">Agency Overview</TabsTrigger>
					<TabsTrigger value="deadlines">Deadline Calendar</TabsTrigger>
					<TabsTrigger value="alerts">Alert Center</TabsTrigger>
					<TabsTrigger value="workflows">Cross-Agency Workflows</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					{/* Agency Cards Grid */}
					<div className="grid gap-6 md:grid-cols-2">
						{agencyStatuses.map((agency) => (
							<AgencyCard key={agency.id} agency={agency} />
						))}
					</div>

					{/* Quick Actions */}
					<Card>
						<CardHeader>
							<CardTitle>Quick Actions</CardTitle>
							<CardDescription>
								Common compliance tasks across agencies
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
								<Button variant="outline" className="justify-start">
									<FileText className="mr-2 h-4 w-4" />
									Bulk Filing Check
								</Button>
								<Button variant="outline" className="justify-start">
									<Calendar className="mr-2 h-4 w-4" />
									Deadline Planner
								</Button>
								<Button variant="outline" className="justify-start">
									<Users className="mr-2 h-4 w-4" />
									Client Status Review
								</Button>
								<Button variant="outline" className="justify-start">
									<Activity className="mr-2 h-4 w-4" />
									Compliance Audit
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="deadlines">
					<DeadlineCalendar />
				</TabsContent>

				<TabsContent value="alerts">
					<AlertCenter />
				</TabsContent>

				<TabsContent value="workflows">
					<WorkflowOverview />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function AgencyCard({ agency }: { agency: AgencyStatus }) {
	return (
		<Card className={cn("transition-all hover:shadow-md", agency.borderColor)}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div
							className={cn(
								"flex h-10 w-10 items-center justify-center rounded-lg font-semibold text-sm",
								agency.bgColor,
								agency.color,
							)}
						>
							{agency.shortName}
						</div>
						<div>
							<CardTitle className="text-base">{agency.name}</CardTitle>
							<CardDescription className="text-xs">
								{agency.description}
							</CardDescription>
						</div>
					</div>
					<Link href={`/dashboard/compliance/${agency.id}`}>
						<Button variant="ghost" size="sm">
							<ChevronRight className="h-4 w-4" />
						</Button>
					</Link>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Compliance Score */}
				<div>
					<div className="mb-2 flex items-center justify-between">
						<span className="font-medium text-sm">Compliance Score</span>
						<div className="flex items-center gap-1">
							<span className="font-bold text-lg">
								{agency.complianceScore}%
							</span>
							{agency.trend === "up" ? (
								<TrendingUp className="h-3 w-3 text-success" />
							) : agency.trend === "down" ? (
								<TrendingDown className="h-3 w-3 text-destructive" />
							) : (
								<span className="h-3 w-3" />
							)}
						</div>
					</div>
					<Progress
						value={agency.complianceScore}
						className={cn(
							"h-2",
							agency.status === "excellent" && "bg-emerald-100",
							agency.status === "good" && "bg-blue-100",
							agency.status === "warning" && "bg-amber-100",
							agency.status === "critical" && "bg-red-100",
						)}
					/>
					<div className="mt-1 flex justify-between text-muted-foreground text-xs">
						<span>
							{agency.trend === "up"
								? "+"
								: agency.trend === "down"
									? "-"
									: "±"}
							{Math.abs(agency.trendPercentage)}% this month
						</span>
						<StatusBadge status={agency.status} />
					</div>
				</div>

				{/* Key Metrics */}
				<div className="grid grid-cols-3 gap-4 text-center">
					<div>
						<div
							className={cn(
								"font-bold text-lg",
								agency.urgentAlerts > 0
									? "text-destructive"
									: "text-muted-foreground",
							)}
						>
							{agency.urgentAlerts}
						</div>
						<div className="text-muted-foreground text-xs">Urgent Alerts</div>
					</div>
					<div>
						<div
							className={cn(
								"font-bold text-lg",
								agency.upcomingDeadlines > 5
									? "text-warning"
									: "text-muted-foreground",
							)}
						>
							{agency.upcomingDeadlines}
						</div>
						<div className="text-muted-foreground text-xs">Deadlines</div>
					</div>
					<div>
						<div className="font-bold text-info text-lg">
							{agency.activeSubmissions}
						</div>
						<div className="text-muted-foreground text-xs">Active</div>
					</div>
				</div>

				{/* Client Coverage */}
				<div className="border-t pt-3">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Client Coverage</span>
						<span className="font-medium">{agency.totalClients} clients</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function StatusBadge({ status }: { status: AgencyStatus["status"] }) {
	const variants = {
		excellent: {
			variant: "success" as const,
			icon: CheckCircle2,
			label: "Excellent",
		},
		good: { variant: "info" as const, icon: CheckCircle2, label: "Good" },
		warning: {
			variant: "warning" as const,
			icon: AlertTriangle,
			label: "Warning",
		},
		critical: {
			variant: "destructive" as const,
			icon: XCircle,
			label: "Critical",
		},
	};

	const { variant, icon: Icon, label } = variants[status];

	return (
		<Badge variant={variant} className="text-xs">
			<Icon className="mr-1 h-3 w-3" />
			{label}
		</Badge>
	);
}

function DeadlineCalendar() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Upcoming Deadlines</CardTitle>
				<CardDescription>
					Critical filing dates across all agencies
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{/* Add deadline calendar implementation */}
					<p className="text-muted-foreground">
						Deadline calendar implementation would go here with dates, agencies,
						and client counts.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

function AlertCenter() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Alert Center</CardTitle>
				<CardDescription>
					Urgent items requiring immediate attention
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{/* Add alert center implementation */}
					<p className="text-muted-foreground">
						Alert center implementation would display urgent compliance issues.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

function WorkflowOverview() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Cross-Agency Workflows</CardTitle>
				<CardDescription>
					Dependencies and workflow visualization
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{/* Add workflow visualization */}
					<p className="text-muted-foreground">
						Cross-agency workflow visualization would show process dependencies.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
