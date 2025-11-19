"use client";

import {
	Calendar as CalendarIcon,
	ChevronLeft,
	ChevronRight,
	Clock,
	FileText,
	Filter,
	Plus,
	User,
	AlertTriangle,
	CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
	name?: string;
	email?: string;
	image?: string;
}

interface CalendarEvent {
	id: number;
	title: string;
	description: string;
	date: Date;
	time: string;
	type: "deadline" | "appointment" | "reminder" | "meeting";
	priority: "low" | "medium" | "high";
	status: "upcoming" | "completed" | "overdue";
	category: string;
	assignee?: string;
}

interface ClientCalendarProps {
	user: User;
}

// Mock calendar events
const mockEvents: CalendarEvent[] = [
	{
		id: 1,
		title: "Quarterly Tax Filing",
		description: "Submit Q4 2024 tax returns to GRA",
		date: new Date(2024, 11, 15), // December 15, 2024
		time: "11:59 PM",
		type: "deadline",
		priority: "high",
		status: "upcoming",
		category: "Tax Filing",
		assignee: "Sarah Johnson",
	},
	{
		id: 2,
		title: "Business License Renewal Meeting",
		description: "Review renewal documents with legal team",
		date: new Date(2024, 11, 20),
		time: "2:00 PM",
		type: "meeting",
		priority: "medium",
		status: "upcoming",
		category: "Legal",
		assignee: "Mike Chen",
	},
	{
		id: 3,
		title: "NIS Contribution Payment",
		description: "Monthly NIS contribution payment due",
		date: new Date(2024, 11, 25),
		time: "5:00 PM",
		type: "deadline",
		priority: "medium",
		status: "upcoming",
		category: "Compliance",
	},
	{
		id: 4,
		title: "Annual Financial Review",
		description: "Review annual financial statements",
		date: new Date(2024, 11, 30),
		time: "10:00 AM",
		type: "appointment",
		priority: "high",
		status: "upcoming",
		category: "Financial",
		assignee: "Lisa Rodriguez",
	},
	{
		id: 5,
		title: "Insurance Policy Renewal",
		description: "Business insurance policy renewal deadline",
		date: new Date(2025, 0, 10),
		time: "11:59 PM",
		type: "deadline",
		priority: "medium",
		status: "upcoming",
		category: "Insurance",
	},
	{
		id: 6,
		title: "VAT Return Filing",
		description: "Monthly VAT return submission",
		date: new Date(2024, 10, 15), // November 15, 2024 (completed)
		time: "11:59 PM",
		type: "deadline",
		priority: "high",
		status: "completed",
		category: "Tax Filing",
		assignee: "Sarah Johnson",
	},
];

const eventTypeColors = {
	deadline: "bg-red-100 text-red-800 border-red-200",
	appointment: "bg-blue-100 text-blue-800 border-blue-200",
	reminder: "bg-yellow-100 text-yellow-800 border-yellow-200",
	meeting: "bg-green-100 text-green-800 border-green-200",
};

const priorityColors = {
	high: "bg-red-100 text-red-800 border-red-200",
	medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
	low: "bg-green-100 text-green-800 border-green-200",
};

const statusIcons = {
	upcoming: <Clock className="h-4 w-4 text-blue-600" />,
	completed: <CheckCircle className="h-4 w-4 text-green-600" />,
	overdue: <AlertTriangle className="h-4 w-4 text-red-600" />,
};

export function ClientCalendar({ user }: ClientCalendarProps) {
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
	const [viewMode, setViewMode] = useState<"month" | "week" | "list">("month");
	const [filterType, setFilterType] = useState<string>("all");
	const [filterCategory, setFilterCategory] = useState<string>("all");

	// Filter events based on selected filters
	const filteredEvents = mockEvents.filter((event) => {
		const typeMatch = filterType === "all" || event.type === filterType;
		const categoryMatch = filterCategory === "all" || event.category === filterCategory;
		return typeMatch && categoryMatch;
	});

	// Get events for selected date
	const eventsForSelectedDate = filteredEvents.filter((event) => {
		if (!selectedDate) return false;
		return (
			event.date.getDate() === selectedDate.getDate() &&
			event.date.getMonth() === selectedDate.getMonth() &&
			event.date.getFullYear() === selectedDate.getFullYear()
		);
	});

	// Get upcoming events (next 7 days)
	const upcomingEvents = filteredEvents
		.filter((event) => {
			const now = new Date();
			const weekFromNow = new Date();
			weekFromNow.setDate(now.getDate() + 7);
			return event.date >= now && event.date <= weekFromNow && event.status === "upcoming";
		})
		.sort((a, b) => a.date.getTime() - b.date.getTime());

	// Get overdue events
	const overdueEvents = filteredEvents.filter((event) => {
		const now = new Date();
		return event.date < now && event.status === "upcoming";
	});

	// Get events that have calendar dates
	const eventsWithDates = filteredEvents.filter((event) => event.date);

	// Get unique categories for filter
	const categories = [...new Set(mockEvents.map(event => event.category))];

	const formatDate = (date: Date) => {
		return date.toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const getDaysUntil = (date: Date) => {
		const now = new Date();
		const diffTime = date.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Calendar</h1>
					<p className="text-muted-foreground">
						Track deadlines, appointments, and important dates
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<Dialog>
						<DialogTrigger asChild>
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Add Event
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Add Calendar Event</DialogTitle>
								<DialogDescription>
									Create a new appointment or reminder
								</DialogDescription>
							</DialogHeader>
							<p className="text-muted-foreground">
								Event creation form would be implemented here
							</p>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Upcoming This Week</p>
								<p className="font-bold text-2xl">{upcomingEvents.length}</p>
							</div>
							<div className="rounded-full bg-blue-100 p-3">
								<Clock className="h-6 w-6 text-blue-600" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Overdue Items</p>
								<p className="font-bold text-2xl">{overdueEvents.length}</p>
							</div>
							<div className="rounded-full bg-red-100 p-3">
								<AlertTriangle className="h-6 w-6 text-red-600" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Total Events</p>
								<p className="font-bold text-2xl">{filteredEvents.length}</p>
							</div>
							<div className="rounded-full bg-green-100 p-3">
								<CalendarIcon className="h-6 w-6 text-green-600" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-4 md:space-y-0">
				<Select value={filterType} onValueChange={setFilterType}>
					<SelectTrigger className="w-48">
						<SelectValue placeholder="Filter by type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Types</SelectItem>
						<SelectItem value="deadline">Deadlines</SelectItem>
						<SelectItem value="appointment">Appointments</SelectItem>
						<SelectItem value="meeting">Meetings</SelectItem>
						<SelectItem value="reminder">Reminders</SelectItem>
					</SelectContent>
				</Select>

				<Select value={filterCategory} onValueChange={setFilterCategory}>
					<SelectTrigger className="w-48">
						<SelectValue placeholder="Filter by category" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Categories</SelectItem>
						{categories.map((category) => (
							<SelectItem key={category} value={category}>
								{category}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Calendar Tabs */}
			<Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
				<TabsList>
					<TabsTrigger value="month">Month View</TabsTrigger>
					<TabsTrigger value="list">List View</TabsTrigger>
				</TabsList>

				<TabsContent value="month" className="mt-6">
					<div className="grid gap-6 lg:grid-cols-3">
						{/* Calendar Widget */}
						<Card className="lg:col-span-2">
							<CardHeader>
								<CardTitle>Calendar</CardTitle>
							</CardHeader>
							<CardContent>
								<Calendar
									mode="single"
									selected={selectedDate}
									onSelect={setSelectedDate}
									className="rounded-md border"
									modifiers={{
										hasEvents: eventsWithDates.map(event => event.date),
									}}
									modifiersStyles={{
										hasEvents: { backgroundColor: '#3b82f6', color: 'white' },
									}}
								/>
							</CardContent>
						</Card>

						{/* Events for Selected Date */}
						<Card>
							<CardHeader>
								<CardTitle>
									{selectedDate ? formatDate(selectedDate) : "Select a Date"}
								</CardTitle>
								<CardDescription>
									{eventsForSelectedDate.length} event(s) scheduled
								</CardDescription>
							</CardHeader>
							<CardContent>
								{eventsForSelectedDate.length > 0 ? (
									<div className="space-y-3">
										{eventsForSelectedDate.map((event) => (
											<div
												key={event.id}
												className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
											>
												<div className="space-y-2">
													<div className="flex items-center justify-between">
														<h4 className="font-medium text-sm">{event.title}</h4>
														{statusIcons[event.status]}
													</div>
													<p className="text-muted-foreground text-xs">
														{event.time}
													</p>
													<div className="flex flex-wrap gap-1">
														<Badge className={eventTypeColors[event.type]}>
															{event.type}
														</Badge>
														<Badge className={priorityColors[event.priority]}>
															{event.priority}
														</Badge>
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="text-muted-foreground text-center text-sm">
										No events scheduled for this date
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="list" className="mt-6">
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Upcoming Events */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Clock className="h-5 w-5 text-blue-600" />
									Upcoming Events
								</CardTitle>
								<CardDescription>
									Events in the next 7 days
								</CardDescription>
							</CardHeader>
							<CardContent>
								{upcomingEvents.length > 0 ? (
									<div className="space-y-4">
										{upcomingEvents.map((event) => (
											<div
												key={event.id}
												className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
											>
												<div className="space-y-3">
													<div className="flex items-start justify-between">
														<div>
															<h4 className="font-semibold">{event.title}</h4>
															<p className="text-muted-foreground text-sm">
																{event.description}
															</p>
														</div>
														<Badge variant={getDaysUntil(event.date) <= 3 ? "destructive" : "outline"}>
															{getDaysUntil(event.date) === 0
																? "Today"
																: getDaysUntil(event.date) === 1
																? "Tomorrow"
																: `${getDaysUntil(event.date)} days`}
														</Badge>
													</div>

													<div className="flex items-center justify-between">
														<div className="flex flex-wrap gap-2">
															<Badge className={eventTypeColors[event.type]}>
																{event.type}
															</Badge>
															<Badge className={priorityColors[event.priority]}>
																{event.priority}
															</Badge>
														</div>
														<div className="flex items-center space-x-2 text-sm text-muted-foreground">
															<CalendarIcon className="h-4 w-4" />
															<span>
																{event.date.toLocaleDateString()} at {event.time}
															</span>
														</div>
													</div>

													{event.assignee && (
														<div className="flex items-center space-x-2 text-sm">
															<User className="h-4 w-4 text-muted-foreground" />
															<span className="text-muted-foreground">
																Assigned to: {event.assignee}
															</span>
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								) : (
									<p className="text-center text-muted-foreground">
										No upcoming events
									</p>
								)}
							</CardContent>
						</Card>

						{/* All Events List */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5 text-green-600" />
									All Events
								</CardTitle>
								<CardDescription>
									Complete list of filtered events
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{filteredEvents
										.sort((a, b) => a.date.getTime() - b.date.getTime())
										.map((event) => (
											<div
												key={event.id}
												className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
											>
												<div className="flex items-center space-x-3">
													{statusIcons[event.status]}
													<div>
														<h4 className="font-medium text-sm">{event.title}</h4>
														<p className="text-muted-foreground text-xs">
															{event.date.toLocaleDateString()} • {event.time}
														</p>
													</div>
												</div>
												<div className="flex items-center space-x-2">
													<Badge className={eventTypeColors[event.type]}>
														{event.type}
													</Badge>
													<Badge className={priorityColors[event.priority]}>
														{event.priority}
													</Badge>
												</div>
											</div>
										))}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}