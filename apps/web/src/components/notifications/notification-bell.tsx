"use client";

import { useEffect } from "react";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/utils/trpc";

export function NotificationBell() {
	const { data: pendingCount, refetch: refetchCount } =
		trpc.notifications.count.useQuery({
			channelStatus: "pending",
		});

	const { data: recentNotifications, refetch: refetchRecent } =
		trpc.notifications.recent.useQuery({
			limit: 5,
		});

	// Auto-refresh every 30 seconds
	useEffect(() => {
		const interval = setInterval(() => {
			refetchCount();
			refetchRecent();
		}, 30000);

		return () => clearInterval(interval);
	}, [refetchCount, refetchRecent]);

	const getTypeIcon = (type: string) => {
		switch (type) {
			case "email":
				return <Mail className="h-4 w-4 text-blue-500" />;
			case "in_app":
				return <MessageSquare className="h-4 w-4 text-purple-500" />;
			case "sms":
				return <Smartphone className="h-4 w-4 text-green-500" />;
			default:
				return <MessageSquare className="h-4 w-4 text-gray-500" />;
		}
	};

	const getStatusBadge = (status: string) => {
		const variants: Record<
			string,
			"success" | "warning" | "destructive" | "secondary"
		> = {
			pending: "warning",
			sent: "success",
			failed: "destructive",
		};
		return (
			<Badge variant={variants[status] || "secondary"} className="text-xs">
				{status}
			</Badge>
		);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="relative">
					<Bell className="h-5 w-5" />
					{pendingCount && pendingCount > 0 ? (
						<span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
							{pendingCount > 9 ? "9+" : pendingCount}
						</span>
					) : null}
					<span className="sr-only">Notifications</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80">
				<DropdownMenuLabel className="flex items-center justify-between">
					<span>Notifications</span>
					{pendingCount && pendingCount > 0 ? (
						<Badge variant="destructive" className="text-xs">
							{pendingCount} pending
						</Badge>
					) : null}
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{recentNotifications && recentNotifications.length > 0 ? (
					<>
						{recentNotifications.map((notification) => (
							<DropdownMenuItem
								key={notification.id}
								className="flex flex-col items-start gap-2 p-3"
								asChild
							>
								<Link href="/notifications">
									<div className="flex w-full items-start gap-2">
										{getTypeIcon(notification.type)}
										<div className="flex-1 space-y-1">
											<p className="line-clamp-2 text-sm">
												{notification.message}
											</p>
											<div className="flex items-center gap-2">
												{getStatusBadge(notification.channelStatus)}
												<span className="text-muted-foreground text-xs">
													{formatDistanceToNow(
														new Date(notification.createdAt),
														{
															addSuffix: true,
														},
													)}
												</span>
											</div>
										</div>
									</div>
								</Link>
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link
								href="/notifications"
								className="w-full text-center font-medium text-primary"
							>
								View all notifications
							</Link>
						</DropdownMenuItem>
					</>
				) : (
					<div className="p-4 text-center text-muted-foreground text-sm">
						No notifications yet
					</div>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
