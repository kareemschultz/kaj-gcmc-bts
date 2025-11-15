"use client";

import { formatDistanceToNow } from "date-fns";
import {
	AlertCircle,
	CheckCircle,
	Clock,
	Mail,
	MessageSquare,
	Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
	id: number;
	type: "email" | "in_app" | "sms";
	channelStatus: "pending" | "sent" | "failed";
	message: string;
	createdAt: Date;
	onClick?: () => void;
}

export function NotificationItem({
	type,
	channelStatus,
	message,
	createdAt,
	onClick,
}: NotificationItemProps) {
	const getTypeIcon = () => {
		switch (type) {
			case "email":
				return <Mail className="h-5 w-5 text-blue-500" />;
			case "in_app":
				return <MessageSquare className="h-5 w-5 text-purple-500" />;
			case "sms":
				return <Smartphone className="h-5 w-5 text-green-500" />;
			default:
				return <MessageSquare className="h-5 w-5 text-gray-500" />;
		}
	};

	const getStatusBadge = () => {
		const variants: Record<
			string,
			"success" | "warning" | "destructive" | "secondary"
		> = {
			pending: "warning",
			sent: "success",
			failed: "destructive",
		};
		return (
			<Badge variant={variants[channelStatus] || "secondary"}>
				{channelStatus}
			</Badge>
		);
	};

	const getStatusIcon = () => {
		switch (channelStatus) {
			case "sent":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "failed":
				return <AlertCircle className="h-4 w-4 text-red-500" />;
			case "pending":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			default:
				return null;
		}
	};

	const getTypeLabel = () => {
		const labels: Record<string, string> = {
			email: "Email",
			in_app: "In-App",
			sms: "SMS",
		};
		return labels[type] || type;
	};

	return (
		<Card
			className={cn(
				"cursor-pointer transition-shadow hover:shadow-md",
				channelStatus === "failed" && "border-red-200 bg-red-50/50",
			)}
			onClick={onClick}
		>
			<CardContent className="pt-6">
				<div className="flex items-start gap-3">
					{getTypeIcon()}
					<div className="min-w-0 flex-1">
						<div className="mb-2 flex items-center gap-2">
							<Badge variant="outline" className="text-xs">
								{getTypeLabel()}
							</Badge>
							{getStatusBadge()}
						</div>
						<p className="mb-2 text-sm">{message}</p>
						<div className="flex items-center gap-2 text-muted-foreground text-xs">
							{getStatusIcon()}
							<span>
								{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
							</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
