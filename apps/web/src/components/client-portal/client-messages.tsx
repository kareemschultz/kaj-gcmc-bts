"use client";

import {
	Check,
	FileText,
	MessageCircle,
	MoreVertical,
	Paperclip,
	Search,
	Send,
	Star,
	User,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

interface User {
	name?: string;
	email?: string;
	image?: string;
}

interface Message {
	id: number;
	content: string;
	timestamp: string;
	sender: {
		name: string;
		avatar?: string;
		role: "client" | "advisor" | "system";
	};
	attachments?: {
		name: string;
		size: string;
		type: string;
	}[];
	read: boolean;
	starred?: boolean;
}

interface Conversation {
	id: number;
	title: string;
	lastMessage: string;
	timestamp: string;
	unreadCount: number;
	participants: {
		name: string;
		avatar?: string;
		role: string;
	}[];
	priority: "low" | "medium" | "high";
	status: "open" | "closed" | "pending";
}

interface ClientMessagesProps {
	user: User;
}

// Mock data
const mockConversations: Conversation[] = [
	{
		id: 1,
		title: "Tax Filing Q4 2024",
		lastMessage: "I've reviewed your documents and have a few questions...",
		timestamp: "2024-11-19T14:30:00Z",
		unreadCount: 2,
		participants: [
			{ name: "Sarah Johnson", avatar: "", role: "Senior Tax Advisor" },
		],
		priority: "high",
		status: "open",
	},
	{
		id: 2,
		title: "Business License Renewal",
		lastMessage: "The renewal application has been submitted successfully.",
		timestamp: "2024-11-18T10:15:00Z",
		unreadCount: 0,
		participants: [
			{ name: "Mike Chen", avatar: "", role: "Legal Consultant" },
		],
		priority: "medium",
		status: "closed",
	},
	{
		id: 3,
		title: "NIS Contribution Query",
		lastMessage: "Thank you for the clarification. I'll proceed with...",
		timestamp: "2024-11-17T16:45:00Z",
		unreadCount: 1,
		participants: [
			{ name: "Lisa Rodriguez", avatar: "", role: "Compliance Officer" },
		],
		priority: "low",
		status: "pending",
	},
];

const mockMessages: Record<number, Message[]> = {
	1: [
		{
			id: 1,
			content: "Hi! I need help with my Q4 tax filing. I have all the documents ready.",
			timestamp: "2024-11-19T09:00:00Z",
			sender: { name: "You", role: "client" },
			read: true,
		},
		{
			id: 2,
			content: "Hello! I'd be happy to help you with your Q4 tax filing. Could you please upload the following documents: 1. Income statements 2. Expense receipts 3. Previous tax returns",
			timestamp: "2024-11-19T09:15:00Z",
			sender: { name: "Sarah Johnson", role: "advisor" },
			read: true,
		},
		{
			id: 3,
			content: "I've uploaded all the required documents. Please let me know if you need anything else.",
			timestamp: "2024-11-19T10:30:00Z",
			sender: { name: "You", role: "client" },
			read: true,
			attachments: [
				{ name: "Income_Statement_Q4.pdf", size: "2.3 MB", type: "PDF" },
				{ name: "Expense_Receipts.zip", size: "5.1 MB", type: "ZIP" },
			],
		},
		{
			id: 4,
			content: "Perfect! I've reviewed your documents and have a few questions about some expense categories. Could we schedule a call to discuss?",
			timestamp: "2024-11-19T14:30:00Z",
			sender: { name: "Sarah Johnson", role: "advisor" },
			read: false,
			starred: true,
		},
		{
			id: 5,
			content: "I've also prepared a preliminary calculation that shows potential savings. Please review the attached document.",
			timestamp: "2024-11-19T14:32:00Z",
			sender: { name: "Sarah Johnson", role: "advisor" },
			read: false,
			attachments: [
				{ name: "Tax_Calculation_Draft.pdf", size: "892 KB", type: "PDF" },
			],
		},
	],
};

export function ClientMessages({ user }: ClientMessagesProps) {
	const [selectedConversation, setSelectedConversation] = useState<number>(1);
	const [searchTerm, setSearchTerm] = useState("");
	const [newMessage, setNewMessage] = useState("");
	const [conversations, setConversations] = useState(mockConversations);
	const [messages, setMessages] = useState(mockMessages);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [selectedConversation, messages]);

	const filteredConversations = conversations.filter(
		(conv) =>
			conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const currentMessages = messages[selectedConversation] || [];

	const handleSendMessage = () => {
		if (!newMessage.trim()) return;

		const message: Message = {
			id: currentMessages.length + 1,
			content: newMessage,
			timestamp: new Date().toISOString(),
			sender: { name: "You", role: "client" },
			read: true,
		};

		setMessages((prev) => ({
			...prev,
			[selectedConversation]: [...(prev[selectedConversation] || []), message],
		}));

		// Update conversation last message
		setConversations((prev) =>
			prev.map((conv) =>
				conv.id === selectedConversation
					? {
							...conv,
							lastMessage: newMessage,
							timestamp: new Date().toISOString(),
						}
					: conv
			)
		);

		setNewMessage("");
	};

	const formatTime = (timestamp: string) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

		if (diffInHours < 24) {
			return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
		} else {
			return date.toLocaleDateString([], { month: "short", day: "numeric" });
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high":
				return "bg-red-100 text-red-800 border-red-200";
			case "medium":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			default:
				return "bg-green-100 text-green-800 border-green-200";
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "open":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "closed":
				return "bg-gray-100 text-gray-800 border-gray-200";
			default:
				return "bg-orange-100 text-orange-800 border-orange-200";
		}
	};

	return (
		<div className="flex h-[calc(100vh-12rem)] space-x-6">
			{/* Conversations List */}
			<div className="w-80 flex-shrink-0">
				<Card className="h-full flex flex-col">
					<CardHeader className="pb-4">
						<CardTitle className="flex items-center gap-2">
							<MessageCircle className="h-5 w-5" />
							Messages
						</CardTitle>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search conversations..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
					</CardHeader>
					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full">
							<div className="space-y-2 p-4">
								{filteredConversations.map((conversation) => (
									<div
										key={conversation.id}
										onClick={() => setSelectedConversation(conversation.id)}
										className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
											selectedConversation === conversation.id
												? "bg-primary/10 border-primary"
												: "hover:bg-muted/50"
										}`}
									>
										<div className="space-y-3">
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<h4 className="font-semibold text-sm leading-none">
														{conversation.title}
													</h4>
													<div className="mt-1 flex items-center space-x-2">
														<Badge className={getPriorityColor(conversation.priority)}>
															{conversation.priority}
														</Badge>
														<Badge className={getStatusColor(conversation.status)}>
															{conversation.status}
														</Badge>
													</div>
												</div>
												{conversation.unreadCount > 0 && (
													<Badge variant="destructive" className="ml-2">
														{conversation.unreadCount}
													</Badge>
												)}
											</div>

											<p className="text-muted-foreground text-sm line-clamp-2">
												{conversation.lastMessage}
											</p>

											<div className="flex items-center justify-between text-xs">
												<div className="flex items-center space-x-2">
													<Avatar className="h-6 w-6">
														<AvatarImage
															src={conversation.participants[0]?.avatar}
														/>
														<AvatarFallback>
															{conversation.participants[0]?.name
																.split(" ")
																.map((n) => n[0])
																.join("")}
														</AvatarFallback>
													</Avatar>
													<span className="text-muted-foreground">
														{conversation.participants[0]?.name}
													</span>
												</div>
												<span className="text-muted-foreground">
													{formatTime(conversation.timestamp)}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			{/* Messages Area */}
			<div className="flex-1">
				<Card className="h-full flex flex-col">
					{/* Chat Header */}
					<CardHeader className="border-b">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-lg">
									{conversations.find((c) => c.id === selectedConversation)?.title}
								</CardTitle>
								<CardDescription>
									{conversations.find((c) => c.id === selectedConversation)
										?.participants[0]?.name}{" "}
									•{" "}
									{conversations.find((c) => c.id === selectedConversation)
										?.participants[0]?.role}
								</CardDescription>
							</div>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon">
										<MoreVertical className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem>
										<Star className="mr-2 h-4 w-4" />
										Star Conversation
									</DropdownMenuItem>
									<DropdownMenuItem>
										<FileText className="mr-2 h-4 w-4" />
										Export Chat
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem className="text-red-600">
										Close Conversation
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</CardHeader>

					{/* Messages */}
					<CardContent className="flex-1 p-0">
						<ScrollArea className="h-full p-4">
							<div className="space-y-4">
								{currentMessages.map((message) => (
									<div
										key={message.id}
										className={`flex ${
											message.sender.role === "client"
												? "justify-end"
												: "justify-start"
										}`}
									>
										<div
											className={`max-w-[70%] space-y-2 ${
												message.sender.role === "client"
													? "order-last"
													: "order-first"
											}`}
										>
											{message.sender.role !== "client" && (
												<div className="flex items-center space-x-2">
													<Avatar className="h-6 w-6">
														<AvatarImage src={message.sender.avatar} />
														<AvatarFallback>
															{message.sender.name
																.split(" ")
																.map((n) => n[0])
																.join("")}
														</AvatarFallback>
													</Avatar>
													<span className="font-medium text-sm">
														{message.sender.name}
													</span>
													{message.starred && (
														<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
													)}
												</div>
											)}

											<div
												className={`rounded-lg p-3 ${
													message.sender.role === "client"
														? "bg-primary text-primary-foreground"
														: "bg-muted"
												}`}
											>
												<p className="text-sm">{message.content}</p>

												{message.attachments && (
													<div className="mt-3 space-y-2">
														{message.attachments.map((attachment, index) => (
															<div
																key={index}
																className="flex items-center space-x-3 rounded border bg-background/50 p-2"
															>
																<Paperclip className="h-4 w-4" />
																<div className="flex-1">
																	<p className="text-xs font-medium">
																		{attachment.name}
																	</p>
																	<p className="text-muted-foreground text-xs">
																		{attachment.type} • {attachment.size}
																	</p>
																</div>
															</div>
														))}
													</div>
												)}
											</div>

											<div className="flex items-center space-x-2 text-xs text-muted-foreground">
												<span>{formatTime(message.timestamp)}</span>
												{message.sender.role === "client" && (
													<div className="flex items-center">
														{message.read ? (
															<Check className="h-3 w-3 text-green-500" />
														) : (
															<Check className="h-3 w-3" />
														)}
													</div>
												)}
											</div>
										</div>
									</div>
								))}
								<div ref={messagesEndRef} />
							</div>
						</ScrollArea>
					</CardContent>

					{/* Message Input */}
					<div className="border-t p-4">
						<div className="flex space-x-2">
							<div className="flex-1">
								<Textarea
									placeholder="Type your message..."
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									onKeyPress={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											handleSendMessage();
										}
									}}
									className="min-h-[60px] resize-none"
								/>
							</div>
							<div className="flex flex-col space-y-2">
								<Button variant="outline" size="icon">
									<Paperclip className="h-4 w-4" />
								</Button>
								<Button
									onClick={handleSendMessage}
									disabled={!newMessage.trim()}
									size="icon"
								>
									<Send className="h-4 w-4" />
								</Button>
							</div>
						</div>
						<div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
							<span>Press Enter to send, Shift+Enter for new line</span>
							<span>Online now</span>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}