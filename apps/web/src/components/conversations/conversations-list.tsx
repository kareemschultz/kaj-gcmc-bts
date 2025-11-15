"use client";

import { formatDistanceToNow } from "date-fns";
import { Briefcase, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const SKELETON_ITEMS = Array.from(
	{ length: 6 },
	(_, index) => `conversation-skeleton-${index}`,
);

export function ConversationsList() {
	const [clientFilter, _setClientFilter] = useState<number | undefined>();
	const [serviceRequestFilter, _setServiceRequestFilter] = useState<
		number | undefined
	>();
	const [page, setPage] = useState(1);

	const { data, isLoading, error } = trpc.conversations.list.useQuery({
		clientId: clientFilter,
		serviceRequestId: serviceRequestFilter,
		page,
		pageSize: 20,
	});

	const { data: unreadCount } = trpc.conversations.unreadCount.useQuery();

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">
						Error loading conversations: {error.message}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2">
					<MessageCircle className="h-5 w-5 text-muted-foreground" />
					<span className="text-muted-foreground text-sm">
						{unreadCount !== undefined && unreadCount > 0 && (
							<Badge variant="destructive">{unreadCount} unread</Badge>
						)}
					</span>
				</div>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{SKELETON_ITEMS.map((skeletonKey) => (
						<Card key={skeletonKey}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<Skeleton className="mb-2 h-5 w-48" />
										<Skeleton className="h-4 w-32" />
									</div>
									<Skeleton className="h-5 w-20" />
								</div>
							</CardHeader>
							<CardContent>
								<Skeleton className="h-4 w-full" />
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<>
					<div className="space-y-3">
						{data?.conversations.length === 0 ? (
							<Card>
								<CardContent className="py-12 text-center">
									<MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
									<p className="text-muted-foreground">
										No conversations found.
									</p>
								</CardContent>
							</Card>
						) : (
							data?.conversations.map((conversation) => {
								const lastMessage = conversation.messages[0];
								const hasUnreadMessages = lastMessage?.readAt === null;

								return (
									<Link
										key={conversation.id}
										href={`/conversations/${conversation.id}`}
									>
										<Card
											className={`cursor-pointer transition-all hover:shadow-md ${
												hasUnreadMessages ? "border-primary bg-primary/5" : ""
											}`}
										>
											<CardHeader>
												<div className="flex items-start justify-between gap-4">
													<div className="flex-1 space-y-1">
														<div className="flex items-center gap-2">
															<CardTitle className="text-base">
																{conversation.subject || "Conversation"}
															</CardTitle>
															{hasUnreadMessages && (
																<Badge
																	variant="destructive"
																	className="text-xs"
																>
																	New
																</Badge>
															)}
														</div>
														<div className="flex flex-wrap gap-3 text-muted-foreground text-xs">
															{conversation.client && (
																<div className="flex items-center gap-1">
																	<User className="h-3 w-3" />
																	<span>{conversation.client.name}</span>
																</div>
															)}
															{conversation.serviceRequest && (
																<div className="flex items-center gap-1">
																	<Briefcase className="h-3 w-3" />
																	<span>
																		{conversation.serviceRequest.service.name}
																	</span>
																</div>
															)}
														</div>
													</div>
													<div className="text-right text-muted-foreground text-xs">
														{formatDistanceToNow(
															new Date(conversation.updatedAt),
															{
																addSuffix: true,
															},
														)}
													</div>
												</div>
											</CardHeader>
											{lastMessage && (
												<CardContent>
													<p className="line-clamp-2 text-muted-foreground text-sm">
														<span className="font-medium">
															{lastMessage.author.name}:
														</span>{" "}
														{lastMessage.body}
													</p>
													<div className="mt-2 flex items-center justify-between text-muted-foreground text-xs">
														<span>
															{conversation._count.messages}{" "}
															{conversation._count.messages === 1
																? "message"
																: "messages"}
														</span>
													</div>
												</CardContent>
											)}
										</Card>
									</Link>
								);
							})
						)}
					</div>

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
