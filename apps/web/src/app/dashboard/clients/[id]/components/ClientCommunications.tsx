"use client";

import type {
	ClientCommunication,
	ClientCommunicationType,
	ClientContact,
	ClientNote,
	TaskPriority,
} from "@gcmc-kaj/types";
import {
	Calendar,
	ChevronDown,
	ChevronRight,
	Edit,
	FileText,
	Filter,
	Mail,
	MessageSquare,
	Phone,
	Pin,
	Plus,
	Search,
	Send,
	Trash2,
	User,
	Video,
} from "lucide-react";
import { useMemo, useState } from "react";
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
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ClientCommunicationsProps {
	clientId: number;
	communications: ClientCommunication[];
	notes: ClientNote[];
	contacts: ClientContact[];
	onAddCommunication?: (communication: Partial<ClientCommunication>) => void;
	onEditCommunication?: (
		id: string,
		communication: Partial<ClientCommunication>,
	) => void;
	onDeleteCommunication?: (id: string) => void;
	onAddNote?: (note: Partial<ClientNote>) => void;
	onEditNote?: (id: string, note: Partial<ClientNote>) => void;
	onDeleteNote?: (id: string) => void;
	onPinNote?: (id: string, pinned: boolean) => void;
	className?: string;
}

const COMMUNICATION_ICONS = {
	email: Mail,
	phone: Phone,
	meeting: Calendar,
	video_call: Video,
	sms: MessageSquare,
	letter: Mail,
	portal_message: MessageSquare,
} as const;

const COMMUNICATION_COLORS = {
	email: "bg-blue-100 text-blue-800",
	phone: "bg-green-100 text-green-800",
	meeting: "bg-purple-100 text-purple-800",
	video_call: "bg-indigo-100 text-indigo-800",
	sms: "bg-orange-100 text-orange-800",
	letter: "bg-gray-100 text-gray-800",
	portal_message: "bg-cyan-100 text-cyan-800",
} as const;

export function ClientCommunications({
	clientId,
	communications,
	notes,
	contacts,
	onAddCommunication,
	onEditCommunication,
	onDeleteCommunication,
	onAddNote,
	onEditNote,
	onDeleteNote,
	onPinNote,
	className,
}: ClientCommunicationsProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTypes, setSelectedTypes] = useState<
		Set<ClientCommunicationType>
	>(new Set(Object.keys(COMMUNICATION_COLORS) as ClientCommunicationType[]));
	const [dateRange, setDateRange] = useState<
		"all" | "today" | "week" | "month"
	>("all");
	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(["communications", "notes"]),
	);
	const [showAddCommunicationDialog, setShowAddCommunicationDialog] =
		useState(false);
	const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);

	// New communication form state
	const [newCommunication, setNewCommunication] = useState<
		Partial<ClientCommunication>
	>({
		type: "email",
		direction: "outbound",
		isInternal: false,
	});

	// New note form state
	const [newNote, setNewNote] = useState<Partial<ClientNote>>({
		isPrivate: false,
		isPinned: false,
		tags: [],
	});

	// Filter communications
	const filteredCommunications = useMemo(() => {
		let filtered = communications;

		// Filter by search query
		if (searchQuery) {
			filtered = filtered.filter(
				(comm) =>
					comm.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
					comm.content.toLowerCase().includes(searchQuery.toLowerCase()),
			);
		}

		// Filter by communication type
		filtered = filtered.filter((comm) => selectedTypes.has(comm.type));

		// Filter by date range
		if (dateRange !== "all") {
			const now = new Date();
			let cutoffDate: Date;

			switch (dateRange) {
				case "today":
					cutoffDate = new Date(
						now.getFullYear(),
						now.getMonth(),
						now.getDate(),
					);
					break;
				case "week":
					cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
					break;
				case "month":
					cutoffDate = new Date(
						now.getFullYear(),
						now.getMonth() - 1,
						now.getDate(),
					);
					break;
				default:
					cutoffDate = new Date(0);
			}

			filtered = filtered.filter(
				(comm) => new Date(comm.communicatedAt) >= cutoffDate,
			);
		}

		// Sort by date (newest first)
		return filtered.sort(
			(a, b) =>
				new Date(b.communicatedAt).getTime() -
				new Date(a.communicatedAt).getTime(),
		);
	}, [communications, searchQuery, selectedTypes, dateRange]);

	// Filter notes
	const filteredNotes = useMemo(() => {
		let filtered = notes;

		// Filter by search query
		if (searchQuery) {
			filtered = filtered.filter(
				(note) =>
					(note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ??
						false) ||
					note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
					note.tags.some((tag) =>
						tag.toLowerCase().includes(searchQuery.toLowerCase()),
					),
			);
		}

		// Sort by pinned first, then by date
		return filtered.sort((a, b) => {
			if (a.isPinned && !b.isPinned) return -1;
			if (!a.isPinned && b.isPinned) return 1;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	}, [notes, searchQuery]);

	const toggleSection = (section: string) => {
		const newExpanded = new Set(expandedSections);
		if (newExpanded.has(section)) {
			newExpanded.delete(section);
		} else {
			newExpanded.add(section);
		}
		setExpandedSections(newExpanded);
	};

	const toggleCommunicationType = (type: ClientCommunicationType) => {
		const newTypes = new Set(selectedTypes);
		if (newTypes.has(type)) {
			newTypes.delete(type);
		} else {
			newTypes.add(type);
		}
		setSelectedTypes(newTypes);
	};

	const handleAddCommunication = () => {
		if (
			onAddCommunication &&
			newCommunication.subject &&
			newCommunication.content
		) {
			onAddCommunication({
				...newCommunication,
				clientId,
				communicatedAt: new Date(),
			});
			setNewCommunication({
				type: "email",
				direction: "outbound",
				isInternal: false,
			});
			setShowAddCommunicationDialog(false);
		}
	};

	const handleAddNote = () => {
		if (onAddNote && newNote.content) {
			onAddNote({
				...newNote,
				clientId,
			});
			setNewNote({
				isPrivate: false,
				isPinned: false,
				tags: [],
			});
			setShowAddNoteDialog(false);
		}
	};

	const formatDate = (date: Date): string => {
		const now = new Date();
		const diffTime = now.getTime() - new Date(date).getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return new Intl.DateTimeFormat("en-US", {
				hour: "2-digit",
				minute: "2-digit",
			}).format(new Date(date));
		}
		if (diffDays === 1) {
			return "Yesterday";
		}
		if (diffDays < 7) {
			return `${diffDays} days ago`;
		}
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		}).format(new Date(date));
	};

	const getCommunicationIcon = (type: ClientCommunicationType) => {
		const Icon = COMMUNICATION_ICONS[type] || MessageSquare;
		return Icon;
	};

	const getCommunicationColor = (type: ClientCommunicationType): string => {
		return COMMUNICATION_COLORS[type] || COMMUNICATION_COLORS.portal_message;
	};

	return (
		<TooltipProvider>
			<div className={cn("space-y-6", className)}>
				{/* Header and Filters */}
				<Card>
					<CardContent className="p-4">
						<div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
							<div>
								<h2 className="font-semibold text-lg">
									Communications & Notes
								</h2>
								<p className="text-muted-foreground text-sm">
									Track all communications and internal notes
								</p>
							</div>
							<div className="flex items-center space-x-2">
								{/* Search */}
								<div className="relative">
									<Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Search..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="w-64 pl-9"
									/>
								</div>

								{/* Date Range Filter */}
								<Select value={dateRange} onValueChange={setDateRange as any}>
									<SelectTrigger className="w-32">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All time</SelectItem>
										<SelectItem value="today">Today</SelectItem>
										<SelectItem value="week">Last week</SelectItem>
										<SelectItem value="month">Last month</SelectItem>
									</SelectContent>
								</Select>

								{/* Communication Type Filter */}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" size="sm">
											<Filter className="mr-2 h-4 w-4" />
											Types ({selectedTypes.size})
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuLabel>Communication Types</DropdownMenuLabel>
										<DropdownMenuSeparator />
										{(
											Object.keys(
												COMMUNICATION_COLORS,
											) as ClientCommunicationType[]
										).map((type) => (
											<DropdownMenuCheckboxItem
												key={type}
												checked={selectedTypes.has(type)}
												onCheckedChange={() => toggleCommunicationType(type)}
											>
												{type
													.replace(/_/g, " ")
													.replace(/\b\w/g, (c) => c.toUpperCase())}
											</DropdownMenuCheckboxItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Communications Section */}
				<Card>
					<CardHeader>
						<Collapsible
							open={expandedSections.has("communications")}
							onOpenChange={() => toggleSection("communications")}
						>
							<CollapsibleTrigger asChild>
								<div className="flex cursor-pointer items-center justify-between">
									<div className="flex items-center gap-2">
										{expandedSections.has("communications") ? (
											<ChevronDown className="h-5 w-5" />
										) : (
											<ChevronRight className="h-5 w-5" />
										)}
										<CardTitle>
											Communications
											<Badge variant="secondary" className="ml-2">
												{filteredCommunications.length}
											</Badge>
										</CardTitle>
									</div>
									<Dialog
										open={showAddCommunicationDialog}
										onOpenChange={setShowAddCommunicationDialog}
									>
										<DialogTrigger asChild>
											<Button size="sm" onClick={(e) => e.stopPropagation()}>
												<Plus className="mr-2 h-4 w-4" />
												Log Communication
											</Button>
										</DialogTrigger>
										<DialogContent className="max-w-2xl">
											<DialogHeader>
												<DialogTitle>Log Communication</DialogTitle>
												<DialogDescription>
													Record a new communication with this client.
												</DialogDescription>
											</DialogHeader>
											<div className="space-y-4">
												<div className="grid grid-cols-3 gap-4">
													<div className="space-y-2">
														<Label htmlFor="commType">Type</Label>
														<Select
															value={newCommunication.type}
															onValueChange={(value) =>
																setNewCommunication({
																	...newCommunication,
																	type: value as ClientCommunicationType,
																})
															}
														>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																{Object.keys(COMMUNICATION_COLORS).map(
																	(type) => (
																		<SelectItem key={type} value={type}>
																			{type
																				.replace(/_/g, " ")
																				.replace(/\b\w/g, (c) =>
																					c.toUpperCase(),
																				)}
																		</SelectItem>
																	),
																)}
															</SelectContent>
														</Select>
													</div>
													<div className="space-y-2">
														<Label htmlFor="direction">Direction</Label>
														<Select
															value={newCommunication.direction}
															onValueChange={(value) =>
																setNewCommunication({
																	...newCommunication,
																	direction: value as "inbound" | "outbound",
																})
															}
														>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="inbound">Inbound</SelectItem>
																<SelectItem value="outbound">
																	Outbound
																</SelectItem>
															</SelectContent>
														</Select>
													</div>
													<div className="space-y-2">
														<Label htmlFor="contact">Contact</Label>
														<Select
															value={newCommunication.contactId || ""}
															onValueChange={(value) =>
																setNewCommunication({
																	...newCommunication,
																	contactId: value || undefined,
																})
															}
														>
															<SelectTrigger>
																<SelectValue placeholder="Select contact" />
															</SelectTrigger>
															<SelectContent>
																{contacts.map((contact) => (
																	<SelectItem
																		key={contact.id}
																		value={contact.id}
																	>
																		{contact.name}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													</div>
												</div>
												<div className="space-y-2">
													<Label htmlFor="subject">Subject</Label>
													<Input
														id="subject"
														placeholder="Communication subject"
														value={newCommunication.subject || ""}
														onChange={(e) =>
															setNewCommunication({
																...newCommunication,
																subject: e.target.value,
															})
														}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="content">Content</Label>
													<Textarea
														id="content"
														placeholder="Describe the communication..."
														rows={4}
														value={newCommunication.content || ""}
														onChange={(e) =>
															setNewCommunication({
																...newCommunication,
																content: e.target.value,
															})
														}
													/>
												</div>
												<div className="flex justify-end space-x-2">
													<Button
														variant="outline"
														onClick={() => setShowAddCommunicationDialog(false)}
													>
														Cancel
													</Button>
													<Button onClick={handleAddCommunication}>
														Log Communication
													</Button>
												</div>
											</div>
										</DialogContent>
									</Dialog>
								</div>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<CardContent className="pt-4">
									{filteredCommunications.length === 0 ? (
										<div className="py-8 text-center">
											<MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
											<h3 className="mt-4 font-medium text-lg">
												No communications found
											</h3>
											<p className="text-muted-foreground">
												No communications match your current filters.
											</p>
										</div>
									) : (
										<div className="space-y-4">
											{filteredCommunications.map((communication) => {
												const Icon = getCommunicationIcon(communication.type);
												const contact = contacts.find(
													(c) => c.id === communication.contactId,
												);

												return (
													<div
														key={communication.id}
														className="space-y-3 rounded-lg border p-4"
													>
														<div className="flex items-center justify-between">
															<div className="flex items-center space-x-3">
																<div
																	className={cn(
																		"flex h-8 w-8 items-center justify-center rounded-full",
																		getCommunicationColor(communication.type),
																	)}
																>
																	<Icon className="h-4 w-4" />
																</div>
																<div>
																	<h4 className="font-medium">
																		{communication.subject}
																	</h4>
																	<div className="flex items-center space-x-2 text-muted-foreground text-sm">
																		<Badge
																			variant={
																				communication.direction === "inbound"
																					? "default"
																					: "secondary"
																			}
																			className="text-xs"
																		>
																			{communication.direction}
																		</Badge>
																		{contact && <span>{contact.name}</span>}
																		<span>
																			{formatDate(communication.communicatedAt)}
																		</span>
																	</div>
																</div>
															</div>
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button variant="ghost" size="icon">
																		<ChevronDown className="h-4 w-4" />
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent align="end">
																	{onEditCommunication && (
																		<DropdownMenuItem
																			onClick={() =>
																				onEditCommunication(
																					communication.id,
																					communication,
																				)
																			}
																		>
																			<Edit className="mr-2 h-4 w-4" />
																			Edit
																		</DropdownMenuItem>
																	)}
																	<DropdownMenuSeparator />
																	{onDeleteCommunication && (
																		<DropdownMenuItem
																			onClick={() =>
																				onDeleteCommunication(communication.id)
																			}
																			className="text-red-600"
																		>
																			<Trash2 className="mr-2 h-4 w-4" />
																			Delete
																		</DropdownMenuItem>
																	)}
																</DropdownMenuContent>
															</DropdownMenu>
														</div>
														<p className="text-muted-foreground text-sm">
															{communication.content}
														</p>
													</div>
												);
											})}
										</div>
									)}
								</CardContent>
							</CollapsibleContent>
						</Collapsible>
					</CardHeader>
				</Card>

				{/* Notes Section */}
				<Card>
					<CardHeader>
						<Collapsible
							open={expandedSections.has("notes")}
							onOpenChange={() => toggleSection("notes")}
						>
							<CollapsibleTrigger asChild>
								<div className="flex cursor-pointer items-center justify-between">
									<div className="flex items-center gap-2">
										{expandedSections.has("notes") ? (
											<ChevronDown className="h-5 w-5" />
										) : (
											<ChevronRight className="h-5 w-5" />
										)}
										<CardTitle>
											Notes
											<Badge variant="secondary" className="ml-2">
												{filteredNotes.length}
											</Badge>
										</CardTitle>
									</div>
									<Dialog
										open={showAddNoteDialog}
										onOpenChange={setShowAddNoteDialog}
									>
										<DialogTrigger asChild>
											<Button size="sm" onClick={(e) => e.stopPropagation()}>
												<Plus className="mr-2 h-4 w-4" />
												Add Note
											</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Add Note</DialogTitle>
												<DialogDescription>
													Create a new note for this client.
												</DialogDescription>
											</DialogHeader>
											<div className="space-y-4">
												<div className="space-y-2">
													<Label htmlFor="noteTitle">Title (Optional)</Label>
													<Input
														id="noteTitle"
														placeholder="Note title"
														value={newNote.title || ""}
														onChange={(e) =>
															setNewNote({
																...newNote,
																title: e.target.value,
															})
														}
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor="noteContent">Content</Label>
													<Textarea
														id="noteContent"
														placeholder="Write your note here..."
														rows={4}
														value={newNote.content || ""}
														onChange={(e) =>
															setNewNote({
																...newNote,
																content: e.target.value,
															})
														}
													/>
												</div>
												<div className="flex items-center space-x-4">
													<label className="flex cursor-pointer items-center space-x-2">
														<input
															type="checkbox"
															checked={newNote.isPrivate || false}
															onChange={(e) =>
																setNewNote({
																	...newNote,
																	isPrivate: e.target.checked,
																})
															}
														/>
														<span className="text-sm">Private note</span>
													</label>
													<label className="flex cursor-pointer items-center space-x-2">
														<input
															type="checkbox"
															checked={newNote.isPinned || false}
															onChange={(e) =>
																setNewNote({
																	...newNote,
																	isPinned: e.target.checked,
																})
															}
														/>
														<span className="text-sm">Pin note</span>
													</label>
												</div>
												<div className="flex justify-end space-x-2">
													<Button
														variant="outline"
														onClick={() => setShowAddNoteDialog(false)}
													>
														Cancel
													</Button>
													<Button onClick={handleAddNote}>Add Note</Button>
												</div>
											</div>
										</DialogContent>
									</Dialog>
								</div>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<CardContent className="pt-4">
									{filteredNotes.length === 0 ? (
										<div className="py-8 text-center">
											<FileText className="mx-auto h-12 w-12 text-muted-foreground" />
											<h3 className="mt-4 font-medium text-lg">
												No notes found
											</h3>
											<p className="text-muted-foreground">
												No notes match your current search criteria.
											</p>
										</div>
									) : (
										<div className="space-y-4">
											{filteredNotes.map((note) => (
												<div
													key={note.id}
													className={cn(
														"space-y-3 rounded-lg border p-4",
														note.isPinned && "border-yellow-200 bg-yellow-50",
													)}
												>
													<div className="flex items-center justify-between">
														<div className="flex items-center space-x-3">
															{note.isPinned && (
																<Pin className="h-4 w-4 text-yellow-600" />
															)}
															<div>
																{note.title && (
																	<h4 className="font-medium">{note.title}</h4>
																)}
																<div className="flex items-center space-x-2 text-muted-foreground text-sm">
																	<span>{formatDate(note.createdAt)}</span>
																	{note.isPrivate && (
																		<Badge
																			variant="outline"
																			className="text-xs"
																		>
																			Private
																		</Badge>
																	)}
																</div>
															</div>
														</div>
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button variant="ghost" size="icon">
																	<ChevronDown className="h-4 w-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																{onPinNote && (
																	<DropdownMenuItem
																		onClick={() =>
																			onPinNote(note.id, !note.isPinned)
																		}
																	>
																		<Pin className="mr-2 h-4 w-4" />
																		{note.isPinned ? "Unpin" : "Pin"}
																	</DropdownMenuItem>
																)}
																{onEditNote && (
																	<DropdownMenuItem
																		onClick={() => onEditNote(note.id, note)}
																	>
																		<Edit className="mr-2 h-4 w-4" />
																		Edit
																	</DropdownMenuItem>
																)}
																<DropdownMenuSeparator />
																{onDeleteNote && (
																	<DropdownMenuItem
																		onClick={() => onDeleteNote(note.id)}
																		className="text-red-600"
																	>
																		<Trash2 className="mr-2 h-4 w-4" />
																		Delete
																	</DropdownMenuItem>
																)}
															</DropdownMenuContent>
														</DropdownMenu>
													</div>
													<p className="text-sm">{note.content}</p>
													{note.tags.length > 0 && (
														<div className="flex flex-wrap gap-1">
															{note.tags.map((tag) => (
																<Badge
																	key={tag}
																	variant="outline"
																	className="text-xs"
																>
																	{tag}
																</Badge>
															))}
														</div>
													)}
												</div>
											))}
										</div>
									)}
								</CardContent>
							</CollapsibleContent>
						</Collapsible>
					</CardHeader>
				</Card>
			</div>
		</TooltipProvider>
	);
}
