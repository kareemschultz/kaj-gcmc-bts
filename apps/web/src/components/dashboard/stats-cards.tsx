"use client";

import { AlertTriangle, ClipboardList, FileText, Users } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const DASHBOARD_SKELETON_KEYS = Array.from(
	{ length: 4 },
	(_, index) => `stats-card-skeleton-${index}`,
);

export function StatsCards() {
	const { data, isLoading } = trpc.dashboard.overview.useQuery();

	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{DASHBOARD_SKELETON_KEYS.map((skeletonKey) => (
					<Card key={skeletonKey}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (!data) {
		return null;
	}

	const stats = [
		{
			title: "Total Clients",
			value: data.counts.clients,
			icon: Users,
			href: "/clients",
			color: "text-brand-600 dark:text-brand-400",
			bgColor: "bg-brand-50 dark:bg-brand-900/20",
		},
		{
			title: "Documents",
			value: data.counts.documents,
			icon: FileText,
			href: "/documents",
			color: "text-accent-600 dark:text-accent-400",
			bgColor: "bg-accent-50 dark:bg-accent-900/20",
		},
		{
			title: "Filings",
			value: data.counts.filings,
			icon: ClipboardList,
			href: "/filings",
			color: "text-info dark:text-info/80",
			bgColor: "bg-info/10 dark:bg-info/20",
		},
		{
			title: "Expiring Docs",
			value: data.alerts.expiringDocuments,
			icon: AlertTriangle,
			href: "/documents?status=expiring",
			color: "text-warning dark:text-warning/80",
			bgColor: "bg-warning/10 dark:bg-warning/20",
			alert: data.alerts.expiringDocuments > 0,
		},
	];

	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
			{stats.map((stat) => (
				<Link key={stat.title} href={stat.href}>
					<Card
						className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
							stat.alert ? "border-warning shadow-md ring-2 ring-warning/20" : ""
						}`}
					>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
							<CardTitle className="font-semibold text-sm text-muted-foreground">
								{stat.title}
							</CardTitle>
							<div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
								<stat.icon className={`h-5 w-5 ${stat.color}`} />
							</div>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-3xl text-foreground">{stat.value}</div>
							{stat.alert && (
								<p className="mt-2 text-xs font-medium text-warning flex items-center gap-1">
									<AlertTriangle className="h-3 w-3" />
									Requires attention
								</p>
							)}
						</CardContent>
					</Card>
				</Link>
			))}
		</div>
	);
}
