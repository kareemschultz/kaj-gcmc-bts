"use client";

import {
	BarChart3,
	Bell,
	Calendar,
	CreditCard,
	FileText,
	Home,
	MessageCircle,
	Settings,
	Shield,
	User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const navigationItems = [
	{
		title: "Dashboard",
		href: "/client-portal",
		icon: Home,
		description: "Overview and quick actions",
	},
	{
		title: "Documents",
		href: "/client-portal/documents",
		icon: FileText,
		description: "Manage your documents",
		badge: 3, // New documents
	},
	{
		title: "Messages",
		href: "/client-portal/messages",
		icon: MessageCircle,
		description: "Communication hub",
		badge: 2, // Unread messages
	},
	{
		title: "Calendar",
		href: "/client-portal/calendar",
		icon: Calendar,
		description: "Filing deadlines & appointments",
		badge: 5, // Upcoming deadlines
	},
	{
		title: "Compliance",
		href: "/client-portal/compliance",
		icon: Shield,
		description: "Compliance tracking",
	},
	{
		title: "Analytics",
		href: "/client-portal/analytics",
		icon: BarChart3,
		description: "Business insights",
	},
	{
		title: "Payments",
		href: "/client-portal/payments",
		icon: CreditCard,
		description: "Invoices & payments",
	},
	{
		title: "Profile",
		href: "/client-portal/profile",
		icon: User,
		description: "Account settings",
	},
	{
		title: "Support",
		href: "/client-portal/support",
		icon: Settings,
		description: "Help & support",
	},
];

export function ClientPortalNav() {
	const pathname = usePathname();

	return (
		<div className="flex h-full flex-col border-r bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
			{/* Logo */}
			<div className="flex h-16 items-center border-b px-6">
				<Link href="/client-portal" className="flex items-center space-x-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
						<Shield className="h-4 w-4" />
					</div>
					<div className="flex flex-col">
						<span className="font-semibold text-sm">GCMC-KAJ</span>
						<span className="text-muted-foreground text-xs">Client Portal</span>
					</div>
				</Link>
			</div>

			{/* Navigation */}
			<ScrollArea className="flex-1 px-4 py-4">
				<nav className="space-y-2">
					{navigationItems.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href;

						return (
							<Link key={item.href} href={item.href}>
								<Button
									variant={isActive ? "default" : "ghost"}
									className={cn(
										"w-full justify-start h-auto p-3 text-left transition-all duration-200",
										isActive
											? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
											: "hover:bg-blue-50 dark:hover:bg-slate-800"
									)}
								>
									<div className="flex w-full items-center justify-between">
										<div className="flex items-center space-x-3">
											<Icon
												className={cn(
													"h-5 w-5 transition-colors",
													isActive
														? "text-white"
														: "text-slate-600 dark:text-slate-400"
												)}
											/>
											<div className="flex flex-col">
												<span
													className={cn(
														"font-medium text-sm",
														isActive
															? "text-white"
															: "text-slate-900 dark:text-slate-100"
													)}
												>
													{item.title}
												</span>
												<span
													className={cn(
														"text-xs",
														isActive
															? "text-blue-100"
															: "text-slate-500 dark:text-slate-400"
													)}
												>
													{item.description}
												</span>
											</div>
										</div>
										{item.badge && (
											<Badge
												variant={isActive ? "secondary" : "default"}
												className={cn(
													"ml-auto h-6 w-6 rounded-full p-0 text-xs",
													isActive
														? "bg-white/20 text-white"
														: "bg-blue-100 text-blue-600"
												)}
											>
												{item.badge}
											</Badge>
										)}
									</div>
								</Button>
							</Link>
						);
					})}
				</nav>
			</ScrollArea>

			{/* Bottom Actions */}
			<div className="border-t p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-500" />
						<div className="flex-1">
							<p className="font-medium text-sm">Online</p>
							<p className="text-muted-foreground text-xs">All systems operational</p>
						</div>
					</div>
					<Button size="icon" variant="ghost" className="h-8 w-8">
						<Bell className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}