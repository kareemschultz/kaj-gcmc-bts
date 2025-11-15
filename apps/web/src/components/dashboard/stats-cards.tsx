"use client";

import { AlertTriangle, ClipboardList, FileText, Users } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export function StatsCards() {
	const { data, isLoading } = trpc.dashboard.overview.useQuery();

	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
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
			color: "text-blue-600",
		},
		{
			title: "Documents",
			value: data.counts.documents,
			icon: FileText,
			href: "/documents",
			color: "text-green-600",
		},
		{
			title: "Filings",
			value: data.counts.filings,
			icon: ClipboardList,
			href: "/filings",
			color: "text-purple-600",
		},
		{
			title: "Expiring Docs",
			value: data.alerts.expiringDocuments,
			icon: AlertTriangle,
			href: "/documents?status=expiring",
			color: "text-yellow-600",
			alert: data.alerts.expiringDocuments > 0,
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{stats.map((stat) => (
				<Link key={stat.title} href={stat.href}>
					<Card
						className={`cursor-pointer transition-shadow hover:shadow-lg ${
							stat.alert ? "border-yellow-500" : ""
						}`}
					>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								{stat.title}
							</CardTitle>
							<stat.icon className={`h-4 w-4 ${stat.color}`} />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{stat.value}</div>
							{stat.alert && (
								<p className="mt-1 text-xs text-yellow-600">
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
