"use client";

import {
	AlertTriangle,
	Building,
	Calendar,
	Clock,
	DollarSign,
	FileCheck,
	TrendingUp,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";

/**
 * Guyana Tax Filing Status Widgets
 *
 * Specialized widgets for tracking Guyana-specific tax obligations:
 * - GRT (Goods & Services Tax) compliance
 * - Corporation Tax tracking
 * - PAYE (Pay As You Earn) monitoring
 * - Withholding Tax status
 * - Business registration compliance
 */

export function TaxFilingStatusGrid() {
	const { data: guyanaData } = trpc.guyana.taxFilingStatus.useQuery();

	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			<GRTStatusWidget />
			<CorporationTaxWidget />
			<PAYEStatusWidget />
			<WithholdingTaxWidget />
			<BusinessRegistrationWidget />
			<TaxCalendarWidget />
		</div>
	);
}

export function GRTStatusWidget() {
	const { data: grtData } = trpc.guyana.grtStatus.useQuery();

	const totalClients = grtData?.totalRegistered || 0;
	const currentFilers = grtData?.currentCompliant || 0;
	const complianceRate =
		totalClients > 0 ? (currentFilers / totalClients) * 100 : 0;

	return (
		<Card className="border-l-4 border-l-brand">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div>
					<CardTitle className="text-base">GRT Compliance</CardTitle>
					<CardDescription className="text-sm">
						Goods & Services Tax status
					</CardDescription>
				</div>
				<div className="rounded-lg bg-brand/10 p-2">
					<TrendingUp className="h-5 w-5 text-brand" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<span className="font-bold text-2xl">
							{currentFilers}/{totalClients}
						</span>
						<Badge
							variant={
								complianceRate >= 90
									? "success"
									: complianceRate >= 70
										? "warning"
										: "destructive"
							}
						>
							{complianceRate.toFixed(1)}%
						</Badge>
					</div>
					<Progress value={complianceRate} className="h-2" />
					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p className="text-muted-foreground">This Month</p>
							<p className="font-medium">
								{grtData?.thisMonthFiled || 0} filed
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">Overdue</p>
							<p className="font-medium text-destructive">
								{grtData?.overdue || 0}
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function CorporationTaxWidget() {
	const { data: corpTaxData } = trpc.guyana.corporationTaxStatus.useQuery();

	return (
		<Card className="border-l-4 border-l-accent">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div>
					<CardTitle className="text-base">Corporation Tax</CardTitle>
					<CardDescription className="text-sm">
						Annual corporate filings
					</CardDescription>
				</div>
				<div className="rounded-lg bg-accent/10 p-2">
					<Building className="h-5 w-5 text-accent" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<span className="font-bold text-2xl">
							{corpTaxData?.companies || 0}
						</span>
						<Badge variant="outline">Companies</Badge>
					</div>
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>Returns Filed</span>
							<span className="font-medium">{corpTaxData?.filed || 0}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span>In Progress</span>
							<span className="font-medium text-warning">
								{corpTaxData?.inProgress || 0}
							</span>
						</div>
						<div className="flex justify-between text-sm">
							<span>Due Soon</span>
							<span className="font-medium text-destructive">
								{corpTaxData?.dueSoon || 0}
							</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function PAYEStatusWidget() {
	const { data: payeData } = trpc.guyana.payeStatus.useQuery();

	return (
		<Card className="border-l-4 border-l-info">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div>
					<CardTitle className="text-base">PAYE Status</CardTitle>
					<CardDescription className="text-sm">
						Pay As You Earn compliance
					</CardDescription>
				</div>
				<div className="rounded-lg bg-info/10 p-2">
					<DollarSign className="h-5 w-5 text-info" />
				</div>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="monthly" className="space-y-3">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="monthly">Monthly</TabsTrigger>
						<TabsTrigger value="quarterly">Quarterly</TabsTrigger>
					</TabsList>
					<TabsContent value="monthly" className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>Filed On Time</span>
							<Badge variant="success">{payeData?.monthly?.onTime || 0}</Badge>
						</div>
						<div className="flex justify-between text-sm">
							<span>Late Filings</span>
							<Badge variant="warning">{payeData?.monthly?.late || 0}</Badge>
						</div>
						<div className="flex justify-between text-sm">
							<span>Outstanding</span>
							<Badge variant="destructive">
								{payeData?.monthly?.outstanding || 0}
							</Badge>
						</div>
					</TabsContent>
					<TabsContent value="quarterly" className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>Q4 2024 Filed</span>
							<Badge variant="success">
								{payeData?.quarterly?.current || 0}
							</Badge>
						</div>
						<div className="flex justify-between text-sm">
							<span>Previous Quarters</span>
							<Badge variant="outline">
								{payeData?.quarterly?.previous || 0}
							</Badge>
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}

export function WithholdingTaxWidget() {
	const { data: witholdingData } = trpc.guyana.withholdingTaxStatus.useQuery();

	return (
		<Card className="border-l-4 border-l-warning">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div>
					<CardTitle className="text-base">Withholding Tax</CardTitle>
					<CardDescription className="text-sm">
						Tax deduction compliance
					</CardDescription>
				</div>
				<div className="rounded-lg bg-warning/10 p-2">
					<FileCheck className="h-5 w-5 text-warning" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<span className="font-medium text-lg">Current Month</span>
						<Badge
							variant={
								witholdingData?.currentStatus === "compliant"
									? "success"
									: "warning"
							}
						>
							{witholdingData?.currentStatus || "pending"}
						</Badge>
					</div>
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span>Total Deducted</span>
							<span className="font-medium">
								${witholdingData?.totalDeducted?.toLocaleString() || 0}
							</span>
						</div>
						<div className="flex justify-between">
							<span>Remitted</span>
							<span className="font-medium text-success">
								${witholdingData?.remitted?.toLocaleString() || 0}
							</span>
						</div>
						<div className="flex justify-between">
							<span>Outstanding</span>
							<span className="font-medium text-destructive">
								${witholdingData?.outstanding?.toLocaleString() || 0}
							</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function BusinessRegistrationWidget() {
	const { data: registrationData } =
		trpc.guyana.businessRegistrationStatus.useQuery();

	return (
		<Card className="border-l-4 border-l-success">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div>
					<CardTitle className="text-base">Business Registration</CardTitle>
					<CardDescription className="text-sm">
						Registration status overview
					</CardDescription>
				</div>
				<div className="rounded-lg bg-success/10 p-2">
					<Building className="h-5 w-5 text-success" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<p className="text-muted-foreground">Active</p>
							<p className="font-bold text-lg text-success">
								{registrationData?.active || 0}
							</p>
						</div>
						<div>
							<p className="text-muted-foreground">Expired</p>
							<p className="font-bold text-destructive text-lg">
								{registrationData?.expired || 0}
							</p>
						</div>
					</div>
					<div className="space-y-1 text-sm">
						<div className="flex justify-between">
							<span>Renewals Due</span>
							<Badge variant="warning">
								{registrationData?.renewalsDue || 0}
							</Badge>
						</div>
						<div className="flex justify-between">
							<span>Applications Pending</span>
							<Badge variant="outline">{registrationData?.pending || 0}</Badge>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function TaxCalendarWidget() {
	const { data: calendarData } = trpc.guyana.taxCalendar.useQuery();

	const upcomingEvents = calendarData?.upcomingEvents || [];

	return (
		<Card className="border-l-4 border-l-purple-500">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
				<div>
					<CardTitle className="text-base">Tax Calendar</CardTitle>
					<CardDescription className="text-sm">
						Upcoming deadlines
					</CardDescription>
				</div>
				<div className="rounded-lg bg-purple-500/10 p-2">
					<Calendar className="h-5 w-5 text-purple-500" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{upcomingEvents.length > 0 ? (
						upcomingEvents.slice(0, 3).map((event, index) => (
							<div
								key={index}
								className="flex items-center justify-between border-l-2 border-l-purple-200 pl-3"
							>
								<div>
									<p className="font-medium text-sm">{event.title}</p>
									<p className="text-muted-foreground text-xs">
										{event.clientsAffected} client(s)
									</p>
								</div>
								<div className="text-right">
									<Badge
										variant={
											event.daysUntil <= 7
												? "destructive"
												: event.daysUntil <= 14
													? "warning"
													: "outline"
										}
									>
										{event.daysUntil}d
									</Badge>
								</div>
							</div>
						))
					) : (
						<div className="py-4 text-center text-muted-foreground text-sm">
							<Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
							No upcoming deadlines
						</div>
					)}

					<Button variant="outline" className="mt-3 w-full" size="sm">
						View Full Calendar
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

export function ComplianceDeadlineTracker() {
	const { data: deadlines } = trpc.guyana.complianceDeadlines.useQuery();

	return (
		<Card>
			<CardHeader>
				<CardTitle>Compliance Deadline Tracker</CardTitle>
				<CardDescription>
					Critical filing dates and penalty implications
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{deadlines?.criticalDeadlines?.map((deadline, index) => (
						<div
							key={index}
							className="flex items-center justify-between rounded-lg border p-3"
						>
							<div className="flex items-center gap-3">
								<div
									className={`h-3 w-3 rounded-full ${
										deadline.urgency === "critical"
											? "bg-destructive"
											: deadline.urgency === "warning"
												? "bg-warning"
												: "bg-success"
									}`}
								/>
								<div>
									<p className="font-medium text-sm">{deadline.title}</p>
									<p className="text-muted-foreground text-xs">
										{deadline.description}
									</p>
								</div>
							</div>
							<div className="text-right">
								<Badge
									variant={
										deadline.urgency === "critical"
											? "destructive"
											: deadline.urgency === "warning"
												? "warning"
												: "success"
									}
								>
									{deadline.daysRemaining}d
								</Badge>
								<p className="mt-1 text-muted-foreground text-xs">
									${deadline.penaltyAmount} penalty
								</p>
							</div>
						</div>
					)) || (
						<div className="py-8 text-center text-muted-foreground">
							<AlertTriangle className="mx-auto mb-2 h-8 w-8 opacity-50" />
							No critical deadlines found
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
