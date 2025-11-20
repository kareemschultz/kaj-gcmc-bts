"use client";

import {
	Bell,
	ChevronDown,
	HelpCircle,
	Menu,
	Search,
	Settings,
	User,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface ClientPortalHeaderProps {
	user?: {
		name?: string;
		email?: string;
		image?: string;
	};
}

export function ClientPortalHeader({ user }: ClientPortalHeaderProps) {
	const [searchQuery, setSearchQuery] = useState("");

	// Mock notification data
	const notifications = [
		{
			id: 1,
			title: "Tax Filing Reminder",
			message: "Your quarterly tax filing is due in 5 days",
			time: "2 hours ago",
			unread: true,
		},
		{
			id: 2,
			title: "Document Uploaded",
			message: "Your compliance certificate has been processed",
			time: "1 day ago",
			unread: true,
		},
		{
			id: 3,
			title: "Payment Received",
			message: "Payment for Invoice #INV-001 has been received",
			time: "2 days ago",
			unread: false,
		},
	];

	const unreadCount = notifications.filter((n) => n.unread).length;

	return (
		<header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
			<div className="flex h-16 items-center justify-between px-6">
				{/* Mobile Menu Button */}
				<Button
					variant="ghost"
					size="icon"
					className="lg:hidden"
					aria-label="Open sidebar"
				>
					<Menu className="h-5 w-5" />
				</Button>

				{/* Search */}
				<div className="flex flex-1 items-center justify-center px-6 lg:justify-start">
					<div className="w-full max-w-lg">
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search documents, filings, messages..."
								className="w-full pr-4 pl-10"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					</div>
				</div>

				{/* Right Actions */}
				<div className="flex items-center space-x-4">
					{/* Notifications */}
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="ghost" size="icon" className="relative">
								<Bell className="h-5 w-5" />
								{unreadCount > 0 && (
									<Badge className="-right-1 -top-1 absolute h-5 w-5 rounded-full p-0 text-xs">
										{unreadCount}
									</Badge>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80" align="end">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h4 className="font-semibold">Notifications</h4>
									<Button variant="ghost" size="sm">
										Mark all as read
									</Button>
								</div>
								<div className="space-y-3">
									{notifications.map((notification) => (
										<div
											key={notification.id}
											className={`rounded-lg p-3 transition-colors hover:bg-muted ${
												notification.unread
													? "bg-blue-50 dark:bg-blue-950/20"
													: ""
											}`}
										>
											<div className="flex items-start justify-between">
												<div className="space-y-1">
													<p className="font-medium text-sm">
														{notification.title}
													</p>
													<p className="text-muted-foreground text-sm">
														{notification.message}
													</p>
													<p className="text-muted-foreground text-xs">
														{notification.time}
													</p>
												</div>
												{notification.unread && (
													<div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
												)}
											</div>
										</div>
									))}
								</div>
								<Button variant="outline" className="w-full" size="sm">
									View All Notifications
								</Button>
							</div>
						</PopoverContent>
					</Popover>

					{/* Help */}
					<Button variant="ghost" size="icon" aria-label="Help">
						<HelpCircle className="h-5 w-5" />
					</Button>

					{/* User Menu */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-10 w-auto px-3">
								<div className="flex items-center space-x-2">
									<Avatar className="h-8 w-8">
										<AvatarImage src={user?.image} alt={user?.name || "User"} />
										<AvatarFallback>
											{user?.name?.charAt(0)?.toUpperCase() || "U"}
										</AvatarFallback>
									</Avatar>
									<div className="hidden flex-col items-start sm:flex">
										<p className="font-medium text-sm">
											{user?.name || "User"}
										</p>
										<p className="text-muted-foreground text-xs">
											{user?.email || "user@example.com"}
										</p>
									</div>
									<ChevronDown className="h-4 w-4 opacity-50" />
								</div>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56" align="end">
							<DropdownMenuLabel>My Account</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								<User className="mr-2 h-4 w-4" />
								<span>Profile</span>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Settings className="mr-2 h-4 w-4" />
								<span>Settings</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem className="text-red-600">
								Sign Out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
