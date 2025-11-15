"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { NotificationItem } from "./notification-item";

const NOTIFICATION_LIST_SKELETON_KEYS = Array.from(
	{ length: 6 },
	(_, index) => `notifications-list-skeleton-${index}`,
);

export function NotificationsList() {
	const [page, setPage] = useState(1);
	const [type, setType] = useState<string>("");
	const [channelStatus, setChannelStatus] = useState<string>("");

	const { data, isLoading, error, refetch } = trpc.notifications.list.useQuery({
		type: type || undefined,
		channelStatus: channelStatus || undefined,
		page,
		pageSize: 20,
	});

	// Auto-refresh every 30 seconds
	useEffect(() => {
		const interval = setInterval(() => {
			refetch();
		}, 30000);

		return () => clearInterval(interval);
	}, [refetch]);

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">
						Error loading notifications: {error.message}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-4">
				<Select
					value={type}
					onChange={(e) => {
						setType(e.target.value);
						setPage(1);
					}}
				>
					<option value="">All Types</option>
					<option value="email">Email</option>
					<option value="in_app">In-App</option>
					<option value="sms">SMS</option>
				</Select>
				<Select
					value={channelStatus}
					onChange={(e) => {
						setChannelStatus(e.target.value);
						setPage(1);
					}}
				>
					<option value="">All Status</option>
					<option value="pending">Pending</option>
					<option value="sent">Sent</option>
					<option value="failed">Failed</option>
				</Select>
				<Button
					variant="outline"
					size="sm"
					onClick={() => refetch()}
					disabled={isLoading}
				>
					<RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
					<span className="ml-2">Refresh</span>
				</Button>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{NOTIFICATION_LIST_SKELETON_KEYS.map((skeletonKey) => (
						<Card key={skeletonKey}>
							<CardContent className="pt-6">
								<Skeleton className="mb-2 h-6 w-3/4" />
								<Skeleton className="h-4 w-1/2" />
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<>
					<div className="space-y-3">
						{data?.notifications.map(
							(notification: (typeof data.notifications)[number]) => (
								<NotificationItem
									key={notification.id}
									id={notification.id}
									type={notification.type as "email" | "in_app" | "sms"}
									channelStatus={
										notification.channelStatus as "pending" | "sent" | "failed"
									}
									message={notification.message}
									createdAt={notification.createdAt}
								/>
							),
						)}
					</div>

					{data && data.notifications.length === 0 && (
						<Card>
							<CardContent className="pt-6 text-center text-muted-foreground">
								No notifications found. You're all caught up!
							</CardContent>
						</Card>
					)}

					{data && data.pagination.totalPages > 1 && (
						<div className="mt-6 flex justify-center gap-2">
							<Button
								variant="outline"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
							>
								Previous
							</Button>
							<span className="flex items-center px-4">
								Page {page} of {data.pagination.totalPages}
							</span>
							<Button
								variant="outline"
								onClick={() => setPage((p) => p + 1)}
								disabled={page >= data.pagination.totalPages}
							>
								Next
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
