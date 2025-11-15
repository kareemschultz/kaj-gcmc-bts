"use client";

import { FileText, Users } from "lucide-react";
import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const RECENT_ACTIVITY_SKELETON_KEYS = Array.from(
	{ length: 5 },
	(_, index) => `recent-activity-skeleton-${index}`,
);

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
						{RECENT_ACTIVITY_SKELETON_KEYS.map((skeletonKey) => (
							<div key={skeletonKey} className="flex items-center gap-3">
								<Skeleton className="h-10 w-10 rounded-full" />
								<div className="flex-1">
									<Skeleton className="mb-2 h-4 w-3/4" />
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
		...data.recentActivity.clients.map(
			(client: (typeof data.recentActivity.clients)[number]) => ({
				type: "client" as const,
				id: client.id,
				title: client.name,
				subtitle: `New ${client.type} client`,
				date: client.createdAt,
				icon: Users,
				href: `/clients/${client.id}`,
			}),
		),
		...data.recentActivity.documents.map(
			(doc: (typeof data.recentActivity.documents)[number]) => ({
				type: "document" as const,
				id: doc.id,
				title: doc.title,
				subtitle: `${doc.documentType.name} - ${doc.client.name}`,
				date: doc.createdAt,
				icon: FileText,
				href: `/documents/${doc.id}`,
			}),
		),
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
					<p className="text-muted-foreground text-sm">No recent activity</p>
				) : (
					<div className="space-y-3">
						{activities.map((activity, index) => (
							<Link
								key={`${activity.type}-${activity.id}-${index}`}
								href={activity.href}
							>
								<div className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
									<div
										className={`flex h-10 w-10 items-center justify-center rounded-full ${
											activity.type === "client"
												? "bg-blue-100 text-blue-600"
												: "bg-green-100 text-green-600"
										}`}
									>
										<activity.icon className="h-5 w-5" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate font-medium text-sm">
											{activity.title}
										</p>
										<p className="truncate text-muted-foreground text-xs">
											{activity.subtitle}
										</p>
									</div>
									<div className="text-muted-foreground text-xs">
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
