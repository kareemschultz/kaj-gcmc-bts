"use client";

import {
	Briefcase,
	CheckSquare,
	FileText,
	LayoutDashboard,
	MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
	{
		href: "/dashboard",
		label: "Dashboard",
		icon: LayoutDashboard,
	},
	{
		href: "/documents",
		label: "Documents",
		icon: FileText,
	},
	{
		href: "/filings",
		label: "Filings",
		icon: Briefcase,
	},
	{
		href: "/tasks",
		label: "Tasks",
		icon: CheckSquare,
	},
	{
		href: "/messages",
		label: "Messages",
		icon: MessageSquare,
	},
];

export default function PortalNav() {
	const pathname = usePathname();

	return (
		<nav className="border-border border-b bg-card">
			<div className="container mx-auto px-4">
				<div className="flex gap-6 overflow-x-auto">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"flex items-center gap-2 border-b-2 px-3 py-3 font-medium text-sm transition-colors hover:text-primary",
									isActive
										? "border-primary text-primary"
										: "border-transparent text-muted-foreground",
								)}
							>
								<Icon className="h-4 w-4" />
								<span>{item.label}</span>
							</Link>
						);
					})}
				</div>
			</div>
		</nav>
	);
}
