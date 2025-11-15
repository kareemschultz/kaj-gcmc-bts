"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface MessageItemProps {
	message: {
		id: number;
		body: string;
		createdAt: Date | string;
		readAt: Date | string | null;
		author: {
			id: number;
			name: string | null;
			email: string;
			avatarUrl: string | null;
		};
	};
	isCurrentUser: boolean;
}

export function MessageItem({ message, isCurrentUser }: MessageItemProps) {
	const createdAt = new Date(message.createdAt);

	return (
		<div
			className={cn(
				"flex gap-3",
				isCurrentUser ? "flex-row-reverse" : "flex-row",
			)}
		>
			{/* Avatar */}
			<div className="flex-shrink-0">
				{message.author.avatarUrl ? (
					<img
						src={message.author.avatarUrl}
						alt={message.author.name || message.author.email}
						className="h-8 w-8 rounded-full"
					/>
				) : (
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
						<span className="font-medium text-xs">
							{(message.author.name || message.author.email)
								.charAt(0)
								.toUpperCase()}
						</span>
					</div>
				)}
			</div>

			{/* Message bubble */}
			<div
				className={cn(
					"flex max-w-[70%] flex-col gap-1",
					isCurrentUser ? "items-end" : "items-start",
				)}
			>
				<div
					className={cn(
						"rounded-lg px-4 py-2",
						isCurrentUser
							? "bg-primary text-primary-foreground"
							: "bg-muted text-foreground",
					)}
				>
					<p className="whitespace-pre-wrap break-words text-sm">
						{message.body}
					</p>
				</div>
				<div className="flex items-center gap-2 px-1">
					<span className="text-muted-foreground text-xs">
						{message.author.name || message.author.email}
					</span>
					<span className="text-muted-foreground text-xs">•</span>
					<span className="text-muted-foreground text-xs">
						{format(createdAt, "MMM d, yyyy 'at' h:mm a")}
					</span>
					{!isCurrentUser && !message.readAt && (
						<>
							<span className="text-muted-foreground text-xs">•</span>
							<span className="font-medium text-primary text-xs">Unread</span>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
