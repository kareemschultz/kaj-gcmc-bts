"use client";

import type {
	ClientHistoryEvent,
	ClientHistoryEventType,
} from "@gcmc-kaj/types";
import {
	Calendar,
	ChevronDown,
	ChevronRight,
	Clock,
	FileText,
	Filter,
	MessageSquare,
	Plus,
	Search,
	User,
	Zap,
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
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
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
import { cn } from "@/lib/utils";

interface ClientHistoryTimelineProps {
	clientId: number;
	events: ClientHistoryEvent[];
	onAddEvent?: () => void;
	className?: string;
}

const EVENT_ICONS = {
	client_created: User,
	client_updated: User,
	document_uploaded: FileText,
	document_expired: FileText,
	filing_submitted: FileText,
	filing_completed: FileText,
	service_requested: Zap,
	service_completed: Zap,
	payment_received: Calendar,
	compliance_updated: Calendar,
	communication_logged: MessageSquare,
	note_added: MessageSquare,
	contact_added: User,
	contact_updated: User,
	relationship_established: User,
	tag_added: Plus,
	tag_removed: Plus,
	custom_field_updated: User,
} as const;

const EVENT_COLORS = {
	client_created: "bg-blue-500",
	client_updated: "bg-blue-400",
	document_uploaded: "bg-green-500",
	document_expired: "bg-red-500",
	filing_submitted: "bg-yellow-500",
	filing_completed: "bg-green-500",
	service_requested: "bg-purple-500",
	service_completed: "bg-green-500",
	payment_received: "bg-green-600",
	compliance_updated: "bg-orange-500",
	communication_logged: "bg-blue-500",
	note_added: "bg-gray-500",
	contact_added: "bg-blue-500",
	contact_updated: "bg-blue-400",
	relationship_established: "bg-purple-400",
	tag_added: "bg-indigo-500",
	tag_removed: "bg-gray-400",
	custom_field_updated: "bg-gray-500",
} as const;

const EVENT_CATEGORIES = {
	client: ["client_created", "client_updated"],
	documents: ["document_uploaded", "document_expired"],
	filings: ["filing_submitted", "filing_completed"],
	services: ["service_requested", "service_completed"],
	payments: ["payment_received"],
	compliance: ["compliance_updated"],
	communications: ["communication_logged", "note_added"],
	contacts: ["contact_added", "contact_updated", "relationship_established"],
	system: ["tag_added", "tag_removed", "custom_field_updated"],
} as const;

type EventCategory = keyof typeof EVENT_CATEGORIES;

export function ClientHistoryTimeline({
	clientId,
	events,
	onAddEvent,
	className,
}: ClientHistoryTimelineProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategories, setSelectedCategories] = useState<
		Set<EventCategory>
	>(new Set(Object.keys(EVENT_CATEGORIES) as EventCategory[]));
	const [dateRange, setDateRange] = useState<
		"all" | "today" | "week" | "month" | "quarter"
	>("all");
	const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

	// Filter and sort events
	const filteredEvents = useMemo(() => {
		let filtered = events;

		// Filter by search query
		if (searchQuery) {
			filtered = filtered.filter(
				(event) =>
					event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					event.description.toLowerCase().includes(searchQuery.toLowerCase()),
			);
		}

		// Filter by categories
		filtered = filtered.filter((event) => {
			return Object.entries(EVENT_CATEGORIES).some(([category, eventTypes]) => {
				return (
					selectedCategories.has(category as EventCategory) &&
					eventTypes.includes(event.eventType as any)
				);
			});
		});

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
				case "quarter":
					cutoffDate = new Date(
						now.getFullYear(),
						now.getMonth() - 3,
						now.getDate(),
					);
					break;
				default:
					cutoffDate = new Date(0);
			}

			filtered = filtered.filter(
				(event) => new Date(event.occurredAt) >= cutoffDate,
			);
		}

		// Sort by date (newest first)
		return filtered.sort(
			(a, b) =>
				new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
		);
	}, [events, searchQuery, selectedCategories, dateRange]);

	// Group events by date
	const groupedEvents = useMemo(() => {
		const groups: Record<string, ClientHistoryEvent[]> = {};

		filteredEvents.forEach((event) => {
			const date = new Date(event.occurredAt).toDateString();
			if (!groups[date]) {
				groups[date] = [];
			}
			groups[date].push(event);
		});

		return Object.entries(groups).sort(
			([a], [b]) => new Date(b).getTime() - new Date(a).getTime(),
		);
	}, [filteredEvents]);

	const toggleCategory = (category: EventCategory) => {
		const newCategories = new Set(selectedCategories);
		if (newCategories.has(category)) {
			newCategories.delete(category);
		} else {
			newCategories.add(category);
		}
		setSelectedCategories(newCategories);
	};

	const toggleEventExpansion = (eventId: string) => {
		const newExpanded = new Set(expandedEvents);
		if (newExpanded.has(eventId)) {
			newExpanded.delete(eventId);
		} else {
			newExpanded.add(eventId);
		}
		setExpandedEvents(newExpanded);
	};

	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return "Today";
		}
		if (date.toDateString() === yesterday.toDateString()) {
			return "Yesterday";
		}
		return date.toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatTime = (date: Date): string => {
		return new Intl.DateTimeFormat("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		}).format(new Date(date));
	};

	const getEventIcon = (eventType: ClientHistoryEventType) => {
		const Icon = EVENT_ICONS[eventType] || FileText;
		return Icon;
	};

	const getEventColor = (eventType: ClientHistoryEventType): string => {
		return EVENT_COLORS[eventType] || "bg-gray-500";
	};

	return (
		<div className={cn("space-y-6", className)}>
			{/* Header and Controls */}
			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
				<div>
					<h2 className="font-semibold text-lg">Activity Timeline</h2>
					<p className="text-muted-foreground text-sm">
						Complete history of all client interactions and changes
					</p>
				</div>

				{onAddEvent && (
					<Button onClick={onAddEvent} size="sm">
						<Plus className="mr-2 h-4 w-4" />
						Add Event
					</Button>
				)}
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="p-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
						{/* Search */}
						<div className="relative">
							<Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search events..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>

						{/* Date Range */}
						<Select value={dateRange} onValueChange={setDateRange as any}>
							<SelectTrigger>
								<SelectValue placeholder="Date range" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All time</SelectItem>
								<SelectItem value="today">Today</SelectItem>
								<SelectItem value="week">Last week</SelectItem>
								<SelectItem value="month">Last month</SelectItem>
								<SelectItem value="quarter">Last quarter</SelectItem>
							</SelectContent>
						</Select>

						{/* Category Filter */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="w-full justify-between">
									<Filter className="mr-2 h-4 w-4" />
									Categories ({selectedCategories.size})
									<ChevronDown className="ml-2 h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel>Filter by category</DropdownMenuLabel>
								<DropdownMenuSeparator />
								{(Object.keys(EVENT_CATEGORIES) as EventCategory[]).map(
									(category) => (
										<DropdownMenuCheckboxItem
											key={category}
											checked={selectedCategories.has(category)}
											onCheckedChange={() => toggleCategory(category)}
										>
											{category.charAt(0).toUpperCase() + category.slice(1)}
										</DropdownMenuCheckboxItem>
									),
								)}
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Results Count */}
						<div className="flex items-center justify-center text-muted-foreground text-sm">
							{filteredEvents.length} events found
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Timeline */}
			<div className="space-y-4">
				{groupedEvents.length === 0 ? (
					<Card>
						<CardContent className="p-8 text-center">
							<Clock className="mx-auto h-12 w-12 text-muted-foreground" />
							<h3 className="mt-4 font-medium text-lg">No events found</h3>
							<p className="text-muted-foreground">
								No events match your current filters. Try adjusting your search
								criteria.
							</p>
						</CardContent>
					</Card>
				) : (
					groupedEvents.map(([date, dayEvents]) => (
						<Card key={date}>
							<CardHeader className="pb-4">
								<CardTitle className="font-medium text-muted-foreground text-sm">
									{formatDate(date)}
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="space-y-4">
									{dayEvents.map((event, index) => {
										const Icon = getEventIcon(event.eventType);
										const isExpanded = expandedEvents.has(event.id);
										const hasDetails =
											event.oldValue || event.newValue || event.metadata;

										return (
											<div key={event.id} className="relative">
												{/* Timeline line */}
												{index < dayEvents.length - 1 && (
													<div className="absolute top-8 left-4 h-full w-0.5 bg-border" />
												)}

												<div className="flex gap-4">
													{/* Event icon */}
													<div
														className={cn(
															"flex h-8 w-8 items-center justify-center rounded-full",
															getEventColor(event.eventType),
														)}
													>
														<Icon className="h-4 w-4 text-white" />
													</div>

													{/* Event content */}
													<div className="flex-1 space-y-2">
														<div className="flex items-start justify-between">
															<div className="space-y-1">
																<h4 className="font-medium text-sm">
																	{event.title}
																</h4>
																<p className="text-muted-foreground text-sm">
																	{event.description}
																</p>
															</div>
															<div className="flex items-center gap-2">
																<span className="text-muted-foreground text-xs">
																	{formatTime(event.occurredAt)}
																</span>
																{hasDetails && (
																	<Button
																		variant="ghost"
																		size="sm"
																		className="h-6 w-6 p-0"
																		onClick={() =>
																			toggleEventExpansion(event.id)
																		}
																	>
																		{isExpanded ? (
																			<ChevronDown className="h-4 w-4" />
																		) : (
																			<ChevronRight className="h-4 w-4" />
																		)}
																	</Button>
																)}
															</div>
														</div>

														{/* Event details (expandable) */}
														{hasDetails && (
															<Collapsible open={isExpanded}>
																<CollapsibleContent className="space-y-3">
																	<Separator />
																	{(event.oldValue || event.newValue) && (
																		<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
																			{event.oldValue && (
																				<div>
																					<Label className="font-medium text-muted-foreground text-xs">
																						Previous Value
																					</Label>
																					<div className="mt-1 rounded-md bg-red-50 p-2 text-sm">
																						<code className="text-red-800">
																							{typeof event.oldValue ===
																							"string"
																								? event.oldValue
																								: JSON.stringify(
																										event.oldValue,
																										null,
																										2,
																									)}
																						</code>
																					</div>
																				</div>
																			)}
																			{event.newValue && (
																				<div>
																					<Label className="font-medium text-muted-foreground text-xs">
																						New Value
																					</Label>
																					<div className="mt-1 rounded-md bg-green-50 p-2 text-sm">
																						<code className="text-green-800">
																							{typeof event.newValue ===
																							"string"
																								? event.newValue
																								: JSON.stringify(
																										event.newValue,
																										null,
																										2,
																									)}
																						</code>
																					</div>
																				</div>
																			)}
																		</div>
																	)}
																	{event.metadata && (
																		<div>
																			<Label className="font-medium text-muted-foreground text-xs">
																				Additional Information
																			</Label>
																			<div className="mt-1 rounded-md bg-gray-50 p-2 text-sm">
																				<pre className="text-gray-700">
																					{JSON.stringify(
																						event.metadata,
																						null,
																						2,
																					)}
																				</pre>
																			</div>
																		</div>
																	)}
																</CollapsibleContent>
															</Collapsible>
														)}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}
