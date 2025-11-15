"use client";

import { ArrowLeft, User, Briefcase, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MessageInput } from "./message-input";
import { MessageItem } from "./message-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

interface ConversationDetailProps {
	conversationId: number;
}

export function ConversationDetail({
	conversationId,
}: ConversationDetailProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const utils = trpc.useUtils();

	// Fetch conversation with polling every 5 seconds
	const { data: conversation, isLoading } = trpc.conversations.get.useQuery(
		{ id: conversationId },
		{
			refetchInterval: 5000, // Poll every 5 seconds
		},
	);

	// Get current user from session (we'll need to extract this from the conversation data)
	useEffect(() => {
		if (conversation?.messages && conversation.messages.length > 0) {
			// Find a message from the current user
			// We can infer the current user by checking which author ID appears most recently
			// Or we could add a separate query for the current user
			// For now, we'll mark the most recent message author as current user if needed
			// This is a simplified approach - in production you'd want a proper user context
		}
	}, [conversation]);

	// Auto-scroll to bottom on new messages
	useEffect(() => {
		if (conversation?.messages) {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [conversation?.messages]);

	// Mark messages as read when viewing
	const markAsReadMutation = trpc.conversations.markAsRead.useMutation({
		onSuccess: () => {
			utils.conversations.get.invalidate({ id: conversationId });
			utils.conversations.list.invalidate();
			utils.conversations.unreadCount.invalidate();
		},
	});

	useEffect(() => {
		if (conversation?.messages) {
			const unreadMessageIds = conversation.messages
				.filter((msg) => !msg.readAt && msg.author.id !== currentUserId)
				.map((msg) => msg.id);

			if (unreadMessageIds.length > 0) {
				// Mark messages as read after a short delay
				const timer = setTimeout(() => {
					markAsReadMutation.mutate({ messageIds: unreadMessageIds });
				}, 1000);

				return () => clearTimeout(timer);
			}
		}
	}, [conversation?.messages, currentUserId]);

	const handleMessageSent = () => {
		// Scroll to bottom after sending a message
		setTimeout(() => {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}, 100);
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-32" />
					</CardHeader>
				</Card>
				<Card>
					<CardContent className="space-y-4 pt-6">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex gap-3">
								<Skeleton className="h-8 w-8 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-16 w-3/4" />
									<Skeleton className="h-3 w-32" />
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!conversation) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">Conversation not found</p>
				</CardContent>
			</Card>
		);
	}

	// Determine current user ID from the first message sent by the user
	// This is a heuristic - ideally you'd get this from a user context
	const inferredUserId =
		conversation.messages.length > 0
			? conversation.messages[conversation.messages.length - 1].author.id
			: null;

	return (
		<div className="space-y-4">
			{/* Header with conversation info */}
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1">
							<div className="mb-3 flex items-center gap-2">
								<Link href="/conversations">
									<Button variant="ghost" size="icon">
										<ArrowLeft className="h-4 w-4" />
									</Button>
								</Link>
								<CardTitle className="text-xl">
									{conversation.subject || "Conversation"}
								</CardTitle>
							</div>
							<div className="flex flex-wrap gap-3">
								{conversation.client && (
									<Link href={`/clients/${conversation.client.id}`}>
										<Badge
											variant="outline"
											className="cursor-pointer hover:bg-accent"
										>
											<User className="mr-1 h-3 w-3" />
											{conversation.client.name}
										</Badge>
									</Link>
								)}
								{conversation.serviceRequest && (
									<Badge variant="outline">
										<Briefcase className="mr-1 h-3 w-3" />
										{conversation.serviceRequest.service.name}
									</Badge>
								)}
							</div>
						</div>
						<div className="text-right text-muted-foreground text-sm">
							<div className="flex items-center gap-1">
								<MessageCircle className="h-4 w-4" />
								<span>
									{conversation.messages.length}{" "}
									{conversation.messages.length === 1 ? "message" : "messages"}
								</span>
							</div>
						</div>
					</div>
				</CardHeader>
			</Card>

			{/* Messages */}
			<Card>
				<CardContent className="pt-6">
					<div className="mb-6 max-h-[600px] space-y-4 overflow-y-auto pr-4">
						{conversation.messages.length === 0 ? (
							<div className="py-12 text-center">
								<MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
								<p className="text-muted-foreground">
									No messages yet. Start the conversation below.
								</p>
							</div>
						) : (
							conversation.messages.map((message) => (
								<MessageItem
									key={message.id}
									message={message}
									isCurrentUser={message.author.id === inferredUserId}
								/>
							))
						)}
						<div ref={messagesEndRef} />
					</div>

					{/* Message input */}
					<div className="border-t pt-6">
						<MessageInput
							conversationId={conversationId}
							onMessageSent={handleMessageSent}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
