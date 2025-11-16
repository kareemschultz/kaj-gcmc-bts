"use client";
import {
	Bell,
	Briefcase,
	CheckSquare,
	ClipboardList,
	FileText,
	LayoutDashboard,
	MessageSquare,
	Send,
	Settings,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import { NotificationBell } from "./notifications/notification-bell";
import UserMenu from "./user-menu";

export default function Header() {
	const pathname = usePathname();

	const links = [
		{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
		{ to: "/clients", label: "Clients", icon: Users },
		{ to: "/documents", label: "Documents", icon: FileText },
		{ to: "/filings", label: "Filings", icon: Send },
		{ to: "/services", label: "Services", icon: Briefcase },
		{ to: "/service-requests", label: "Requests", icon: ClipboardList },
		{ to: "/tasks", label: "Tasks", icon: CheckSquare },
		{ to: "/conversations", label: "Messages", icon: MessageSquare },
		{ to: "/notifications", label: "Alerts", icon: Bell },
		{ to: "/admin", label: "Admin", icon: Settings },
	] as const;

	const isActive = (path: string) => {
		if (path === "/dashboard") {
			return pathname === "/dashboard" || pathname === "/";
		}
		return pathname?.startsWith(path);
	};

	return (
		<header className="border-b bg-background">
			<div className="container mx-auto">
				<div className="flex items-center justify-between px-4 py-3">
					{/* Logo/Brand */}
					<Link href="/dashboard" className="flex items-center gap-3 group">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm group-hover:bg-brand-700 transition-colors">
							<span className="font-bold text-base">KAJ</span>
						</div>
						<div className="flex flex-col">
							<span className="font-semibold text-lg text-foreground">GCMC Platform</span>
							<span className="text-xs text-muted-foreground">Compliance Management</span>
						</div>
					</Link>

					{/* Main Navigation */}
					<nav className="hidden items-center gap-1 lg:flex">
						{links.map(({ to, label, icon: Icon }) => {
							const active = isActive(to);
							return (
								<Link
									key={to}
									href={to}
									className={`flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-sm transition-all${
										active
											? "bg-brand-600 text-white shadow-sm"
											: "text-muted-foreground hover:bg-brand-100 hover:text-brand-900 dark:hover:bg-brand-800 dark:hover:text-brand-100"
									}
									`}
								>
									<Icon className="h-4 w-4" />
									<span>{label}</span>
								</Link>
							);
						})}
					</nav>

					{/* Right Section */}
					<div className="flex items-center gap-2">
						<NotificationBell />
						<ModeToggle />
						<UserMenu />
					</div>
				</div>

				{/* Mobile Navigation */}
				<div className="overflow-x-auto px-4 pb-3 lg:hidden">
					<div className="flex gap-2">
						{links.slice(0, 6).map(({ to, label, icon: Icon }) => {
							const active = isActive(to);
							return (
								<Link
									key={to}
									href={to}
									className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 font-medium text-sm transition-all${
										active
											? "bg-brand-600 text-white shadow-sm"
											: "text-muted-foreground hover:bg-brand-100 hover:text-brand-900 dark:hover:bg-brand-800 dark:hover:text-brand-100"
									}
									`}
								>
									<Icon className="h-4 w-4" />
									<span className="whitespace-nowrap">{label}</span>
								</Link>
							);
						})}
					</div>
				</div>
			</div>
		</header>
	);
}
