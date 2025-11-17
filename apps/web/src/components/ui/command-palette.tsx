"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
	Calculator,
	Calendar,
	CreditCard,
	FileText,
	Settings,
	Smile,
	User,
	Users,
	Search,
	Home,
	BarChart3,
	ClipboardList,
	Bell,
	HelpCircle,
} from "lucide-react";

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "@/components/ui/command";

interface CommandPaletteProps {
	open: boolean;
	setOpen: (open: boolean) => void;
}

export function CommandPalette({ open, setOpen }: CommandPaletteProps) {
	const router = useRouter();

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen(!open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [open, setOpen]);

	const runCommand = React.useCallback((command: () => void) => {
		setOpen(false);
		command();
	}, [setOpen]);

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput placeholder="Type a command or search..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading="Quick Navigation">
					<CommandItem
						onSelect={() => runCommand(() => router.push("/dashboard"))}
					>
						<Home className="mr-2 h-4 w-4" />
						<span>Dashboard</span>
						<CommandShortcut>⌘H</CommandShortcut>
					</CommandItem>
					<CommandItem
						onSelect={() => runCommand(() => router.push("/clients"))}
					>
						<Users className="mr-2 h-4 w-4" />
						<span>Clients</span>
						<CommandShortcut>⌘U</CommandShortcut>
					</CommandItem>
					<CommandItem
						onSelect={() => runCommand(() => router.push("/documents"))}
					>
						<FileText className="mr-2 h-4 w-4" />
						<span>Documents</span>
						<CommandShortcut>⌘D</CommandShortcut>
					</CommandItem>
					<CommandItem
						onSelect={() => runCommand(() => router.push("/filings"))}
					>
						<ClipboardList className="mr-2 h-4 w-4" />
						<span>Filings</span>
						<CommandShortcut>⌘F</CommandShortcut>
					</CommandItem>
					<CommandItem
						onSelect={() => runCommand(() => router.push("/analytics"))}
					>
						<BarChart3 className="mr-2 h-4 w-4" />
						<span>Analytics</span>
						<CommandShortcut>⌘A</CommandShortcut>
					</CommandItem>
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading="Actions">
					<CommandItem>
						<FileText className="mr-2 h-4 w-4" />
						<span>Create Document</span>
						<CommandShortcut>⌘⇧D</CommandShortcut>
					</CommandItem>
					<CommandItem>
						<Users className="mr-2 h-4 w-4" />
						<span>Add Client</span>
						<CommandShortcut>⌘⇧U</CommandShortcut>
					</CommandItem>
					<CommandItem>
						<ClipboardList className="mr-2 h-4 w-4" />
						<span>New Filing</span>
						<CommandShortcut>⌘⇧F</CommandShortcut>
					</CommandItem>
					<CommandItem>
						<Calendar className="mr-2 h-4 w-4" />
						<span>Schedule Task</span>
						<CommandShortcut>⌘⇧T</CommandShortcut>
					</CommandItem>
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading="Recent">
					<CommandItem>
						<FileText className="mr-2 h-4 w-4" />
						<span>Annual Report 2024</span>
					</CommandItem>
					<CommandItem>
						<Users className="mr-2 h-4 w-4" />
						<span>TechCorp Inc.</span>
					</CommandItem>
					<CommandItem>
						<ClipboardList className="mr-2 h-4 w-4" />
						<span>Q4 Compliance Filing</span>
					</CommandItem>
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading="Settings">
					<CommandItem
						onSelect={() => runCommand(() => router.push("/profile"))}
					>
						<User className="mr-2 h-4 w-4" />
						<span>Profile</span>
						<CommandShortcut>⌘P</CommandShortcut>
					</CommandItem>
					<CommandItem
						onSelect={() => runCommand(() => router.push("/settings"))}
					>
						<Settings className="mr-2 h-4 w-4" />
						<span>Settings</span>
						<CommandShortcut>⌘,</CommandShortcut>
					</CommandItem>
					<CommandItem>
						<Bell className="mr-2 h-4 w-4" />
						<span>Notifications</span>
					</CommandItem>
					<CommandItem>
						<HelpCircle className="mr-2 h-4 w-4" />
						<span>Help & Support</span>
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}

export function useCommandPalette() {
	const [open, setOpen] = React.useState(false);

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	return { open, setOpen };
}