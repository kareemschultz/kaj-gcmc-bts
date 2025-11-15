"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	LayoutDashboard,
	Users,
	FileText,
	Send,
	Briefcase,
	ClipboardList,
	CheckSquare,
	MessageSquare,
	Bell,
	Settings,
} from "lucide-react";
import { ModeToggle } from "./mode-toggle";
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
					<Link href="/dashboard" className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
							<span className="text-sm font-bold">KAJ</span>
						</div>
						<span className="text-lg font-semibold">GCMC Platform</span>
					</Link>

					{/* Main Navigation */}
					<nav className="hidden lg:flex items-center gap-1">
						{links.map(({ to, label, icon: Icon }) => {
							const active = isActive(to);
							return (
								<Link
									key={to}
									href={to}
									className={`
										flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors
										${
											active
												? "bg-accent text-accent-foreground"
												: "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
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
						<ModeToggle />
						<UserMenu />
					</div>
				</div>

				{/* Mobile Navigation */}
				<div className="lg:hidden overflow-x-auto px-4 pb-3">
					<div className="flex gap-2">
						{links.slice(0, 6).map(({ to, label, icon: Icon }) => {
							const active = isActive(to);
							return (
								<Link
									key={to}
									href={to}
									className={`
										flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors
										${
											active
												? "bg-accent text-accent-foreground"
												: "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
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
