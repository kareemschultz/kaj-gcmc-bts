"use client";

import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText } from "lucide-react";
import Link from "next/link";

export function RecentActivity() {
	const { data, isLoading } = trpc.dashboard.overview.useQuery();

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
					<CardDescription>Latest updates across your platform</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[...Array(5)].map((_, i) => (
							<div key={i} className="flex items-center gap-3">
								<Skeleton className="h-10 w-10 rounded-full" />
								<div className="flex-1">
									<Skeleton className="h-4 w-3/4 mb-2" />
									<Skeleton className="h-3 w-1/2" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!data) {
		return null;
	}

	const activities = [
		...data.recentActivity.clients.map((client) => ({
			type: "client" as const,
			id: client.id,
			title: client.name,
			subtitle: `New ${client.type} client`,
			date: client.createdAt,
			icon: Users,
			href: `/clients/${client.id}`,
		})),
		...data.recentActivity.documents.map((doc) => ({
			type: "document" as const,
			id: doc.id,
			title: doc.title,
			subtitle: `${doc.documentType.name} - ${doc.client.name}`,
			date: doc.createdAt,
			icon: FileText,
			href: `/documents/${doc.id}`,
		})),
	]
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.slice(0, 10);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Activity</CardTitle>
				<CardDescription>Latest updates across your platform</CardDescription>
			</CardHeader>
			<CardContent>
				{activities.length === 0 ? (
					<p className="text-sm text-muted-foreground">No recent activity</p>
				) : (
					<div className="space-y-3">
						{activities.map((activity, index) => (
							<Link key={`${activity.type}-${activity.id}-${index}`} href={activity.href}>
								<div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
									<div
										className={`h-10 w-10 rounded-full flex items-center justify-center ${
											activity.type === "client"
												? "bg-blue-100 text-blue-600"
												: "bg-green-100 text-green-600"
										}`}
									>
										<activity.icon className="h-5 w-5" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">{activity.title}</p>
										<p className="text-xs text-muted-foreground truncate">
											{activity.subtitle}
										</p>
									</div>
									<div className="text-xs text-muted-foreground">
										{new Date(activity.date).toLocaleDateString()}
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
