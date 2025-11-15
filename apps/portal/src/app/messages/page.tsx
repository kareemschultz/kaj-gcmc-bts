"use client";

import { MessageSquare, Send, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export default function MessagesPage() {
	const [selectedConversationId, setSelectedConversationId] = useState<
		number | null
	>(null);
	const [messageBody, setMessageBody] = useState("");

	const utils = trpc.useUtils();
	const { data: conversations, isLoading: conversationsLoading } =
		trpc.portal.conversations.useQuery();

	const { data: conversationDetails, isLoading: detailsLoading } =
		trpc.portal.conversationDetails.useQuery(
			{ conversationId: selectedConversationId! },
			{ enabled: !!selectedConversationId },
		);

	const sendMessageMutation = trpc.portal.sendMessage.useMutation({
		onSuccess: () => {
			setMessageBody("");
			utils.portal.conversationDetails.invalidate();
			utils.portal.conversations.invalidate();
			toast.success("Message sent");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to send message");
		},
	});

	const handleSendMessage = () => {
		if (!messageBody.trim() || !selectedConversationId) return;

		sendMessageMutation.mutate({
			conversationId: selectedConversationId,
			body: messageBody,
		});
	};

	return (
		<div className="container mx-auto p-6">
			<div className="mb-6 space-y-2">
				<h1 className="font-bold text-3xl">Messages</h1>
				<p className="text-muted-foreground">
					Communicate with your account manager
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Conversations List */}
				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle>Conversations</CardTitle>
					</CardHeader>
					<CardContent>
						{conversationsLoading ? (
							<div className="space-y-2">
								{[...Array(3)].map((_, i) => (
									<Skeleton key={i} className="h-16 w-full" />
								))}
							</div>
						) : !conversations || conversations.length === 0 ? (
							<div className="py-12 text-center">
								<MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
								<p className="mt-4 text-muted-foreground text-sm">
									No conversations yet
								</p>
							</div>
						) : (
							<div className="space-y-2">
								{conversations.map((conv) => (
									<button
										key={conv.id}
										onClick={() => setSelectedConversationId(conv.id)}
										className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
											selectedConversationId === conv.id
												? "border-primary bg-accent"
												: ""
										}`}
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<p className="font-medium">{conv.subject}</p>
												<p className="mt-1 text-muted-foreground text-sm">
													{conv.messages[0]?.body.substring(0, 50)}
													{(conv.messages[0]?.body.length ?? 0) > 50 && "..."}
												</p>
											</div>
											<Badge variant="secondary" className="ml-2">
												{conv._count.messages}
											</Badge>
										</div>
										<p className="mt-2 text-muted-foreground text-xs">
											{new Date(conv.updatedAt).toLocaleDateString()}
										</p>
									</button>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Conversation Details */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>
							{conversationDetails
								? conversationDetails.subject
								: "Select a conversation"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{!selectedConversationId ? (
							<div className="py-12 text-center">
								<MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
								<p className="mt-4 text-muted-foreground">
									Select a conversation to view messages
								</p>
							</div>
						) : detailsLoading ? (
							<div className="space-y-4">
								{[...Array(3)].map((_, i) => (
									<Skeleton key={i} className="h-20 w-full" />
								))}
							</div>
						) : !conversationDetails ? (
							<div className="py-12 text-center">
								<p className="text-muted-foreground">
									Failed to load conversation
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{/* Messages */}
								<div className="max-h-[400px] space-y-4 overflow-y-auto rounded-lg border p-4">
									{conversationDetails.messages.map((message) => (
										<div
											key={message.id}
											className="rounded-lg border bg-card p-3"
										>
											<div className="mb-2 flex items-center gap-2">
												<User className="h-4 w-4 text-muted-foreground" />
												<span className="font-medium">
													{message.author.name}
												</span>
												<span className="text-muted-foreground text-xs">
													{new Date(message.createdAt).toLocaleString()}
												</span>
											</div>
											<p className="text-sm">{message.body}</p>
										</div>
									))}
								</div>

								{/* Send Message */}
								<div className="flex gap-2">
									<Input
										placeholder="Type your message..."
										value={messageBody}
										onChange={(e) => setMessageBody(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" && !e.shiftKey) {
												e.preventDefault();
												handleSendMessage();
											}
										}}
									/>
									<Button
										onClick={handleSendMessage}
										disabled={
											!messageBody.trim() || sendMessageMutation.isPending
										}
									>
										<Send className="h-4 w-4" />
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
