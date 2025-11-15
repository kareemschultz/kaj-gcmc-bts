"use client";

import { LayoutGrid, LayoutList, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const SERVICE_REQUESTS_LIST_SKELETON_KEYS = Array.from(
	{ length: 6 },
	(_, index) => `service-requests-list-skeleton-${index}`,
);

type ViewMode = "list" | "kanban";

const STATUSES = [
	{ value: "new", label: "New", variant: "info" as const },
	{ value: "in_progress", label: "In Progress", variant: "warning" as const },
	{
		value: "awaiting_client",
		label: "Awaiting Client",
		variant: "warning" as const,
	},
	{
		value: "awaiting_authority",
		label: "Awaiting Authority",
		variant: "warning" as const,
	},
	{ value: "completed", label: "Completed", variant: "success" as const },
	{ value: "cancelled", label: "Cancelled", variant: "destructive" as const },
];

const PRIORITIES = [
	{ value: "low", label: "Low", variant: "secondary" as const },
	{ value: "medium", label: "Medium", variant: "info" as const },
	{ value: "high", label: "High", variant: "warning" as const },
	{ value: "urgent", label: "Urgent", variant: "destructive" as const },
];

export function ServiceRequestsList() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState<string>("");
	const [priority, setPriority] = useState<string>("");
	const [viewMode, setViewMode] = useState<ViewMode>("list");

	const { data, isLoading, error } = trpc.serviceRequests.list.useQuery({
		status: status || undefined,
		priority: priority || undefined,
		page,
		pageSize: 20,
	});

	// Get stats
	const { data: stats } = trpc.serviceRequests.stats.useQuery();

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">
						Error loading service requests: {error.message}
					</p>
				</CardContent>
			</Card>
		);
	}

	const getStatusBadge = (status: string) => {
		const statusConfig = STATUSES.find((s) => s.value === status);
		return (
			<Badge variant={statusConfig?.variant || "secondary"}>
				{statusConfig?.label || status.replace("_", " ")}
			</Badge>
		);
	};

	const getPriorityBadge = (priority?: string | null) => {
		if (!priority) return null;
		const priorityConfig = PRIORITIES.find((p) => p.value === priority);
		return (
			<Badge variant={priorityConfig?.variant || "secondary"} className="ml-2">
				{priorityConfig?.label || priority}
			</Badge>
		);
	};

	const filteredServiceRequests = data?.serviceRequests.filter(
		(sr) =>
			!search ||
			sr.service.name.toLowerCase().includes(search.toLowerCase()) ||
			sr.client.name.toLowerCase().includes(search.toLowerCase()),
	);

	const renderListView = () => (
		<>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{filteredServiceRequests?.map(
					(serviceRequest: (typeof data.serviceRequests)[number]) => (
						<Link
							key={serviceRequest.id}
							href={`/service-requests/${serviceRequest.id}`}
						>
							<Card className="cursor-pointer transition-shadow hover:shadow-lg">
								<CardHeader>
									<div className="flex items-start justify-between">
										<CardTitle className="text-lg">
											{serviceRequest.service.name}
										</CardTitle>
									</div>
									<CardDescription>
										{serviceRequest.client.name}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-2 text-sm">
										{serviceRequest.clientBusiness && (
											<p className="text-muted-foreground">
												Business: {serviceRequest.clientBusiness.name}
											</p>
										)}
										<div className="flex items-center gap-2">
											<span>Status:</span>
											{getStatusBadge(serviceRequest.status)}
											{getPriorityBadge(serviceRequest.priority)}
										</div>
										{serviceRequest.currentStepOrder !== null && (
											<p className="text-muted-foreground text-xs">
												Current Step: {serviceRequest.currentStepOrder + 1}
											</p>
										)}
										<div className="mt-3 flex gap-4 text-muted-foreground text-xs">
											<span>{serviceRequest._count.steps} step(s)</span>
											<span>{serviceRequest._count.tasks} task(s)</span>
											<span>
												{serviceRequest._count.conversations} conversation(s)
											</span>
										</div>
										<p className="text-muted-foreground text-xs">
											Created:{" "}
											{new Date(serviceRequest.createdAt).toLocaleDateString()}
										</p>
									</div>
								</CardContent>
							</Card>
						</Link>
					),
				)}
			</div>

			{filteredServiceRequests && filteredServiceRequests.length === 0 && (
				<Card>
					<CardContent className="pt-6 text-center text-muted-foreground">
						No service requests found. Create your first service request to get
						started.
					</CardContent>
				</Card>
			)}
		</>
	);

	const renderKanbanView = () => (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			{STATUSES.map((statusConfig) => {
				const statusRequests = filteredServiceRequests?.filter(
					(sr) => sr.status === statusConfig.value,
				);
				return (
					<Card key={statusConfig.value} className="flex flex-col">
						<CardHeader className="pb-3">
							<CardTitle className="text-sm">{statusConfig.label}</CardTitle>
							<CardDescription>
								{statusRequests?.length || 0} request(s)
							</CardDescription>
						</CardHeader>
						<CardContent className="flex-1 space-y-2">
							{statusRequests?.map(
								(serviceRequest: (typeof data.serviceRequests)[number]) => (
									<Link
										key={serviceRequest.id}
										href={`/service-requests/${serviceRequest.id}`}
									>
										<Card className="cursor-pointer p-3 transition-shadow hover:shadow-md">
											<div className="space-y-1">
												<p className="font-medium text-sm">
													{serviceRequest.service.name}
												</p>
												<p className="text-muted-foreground text-xs">
													{serviceRequest.client.name}
												</p>
												{serviceRequest.priority &&
													getPriorityBadge(serviceRequest.priority)}
												<p className="text-muted-foreground text-xs">
													{serviceRequest._count.steps} steps,{" "}
													{serviceRequest._count.tasks} tasks
												</p>
											</div>
										</Card>
									</Link>
								),
							)}
							{(!statusRequests || statusRequests.length === 0) && (
								<p className="text-center text-muted-foreground text-xs">
									No requests
								</p>
							)}
						</CardContent>
					</Card>
				);
			})}
		</div>
	);

	return (
		<div className="space-y-4">
			{stats && (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm">Total Requests</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="font-bold text-2xl">{stats.total}</p>
						</CardContent>
					</Card>
					{stats.byStatus.slice(0, 3).map((stat) => {
						const statusConfig = STATUSES.find((s) => s.value === stat.status);
						return (
							<Card key={stat.status}>
								<CardHeader className="pb-3">
									<CardTitle className="text-sm">
										{statusConfig?.label || stat.status}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="font-bold text-2xl">{stat._count}</p>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			<div className="flex flex-wrap gap-4">
				<div className="relative min-w-[200px] flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search service requests..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="pl-9"
					/>
				</div>
				<Select
					value={status}
					onChange={(e) => {
						setStatus(e.target.value);
						setPage(1);
					}}
				>
					<option value="">All Status</option>
					{STATUSES.map((s) => (
						<option key={s.value} value={s.value}>
							{s.label}
						</option>
					))}
				</Select>
				<Select
					value={priority}
					onChange={(e) => {
						setPriority(e.target.value);
						setPage(1);
					}}
				>
					<option value="">All Priorities</option>
					{PRIORITIES.map((p) => (
						<option key={p.value} value={p.value}>
							{p.label}
						</option>
					))}
				</Select>
				<div className="flex gap-2">
					<Button
						variant={viewMode === "list" ? "default" : "outline"}
						size="icon"
						onClick={() => setViewMode("list")}
					>
						<LayoutList className="h-4 w-4" />
					</Button>
					<Button
						variant={viewMode === "kanban" ? "default" : "outline"}
						size="icon"
						onClick={() => setViewMode("kanban")}
					>
						<LayoutGrid className="h-4 w-4" />
					</Button>
				</div>
				<Link href="/service-requests/new">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						New Request
					</Button>
				</Link>
			</div>

			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{SERVICE_REQUESTS_LIST_SKELETON_KEYS.map((skeletonKey) => (
						<Card key={skeletonKey}>
							<CardHeader>
								<Skeleton className="h-6 w-32" />
								<Skeleton className="h-4 w-24" />
							</CardHeader>
							<CardContent>
								<Skeleton className="mb-2 h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<>
					{viewMode === "list" ? renderListView() : renderKanbanView()}

					{data && data.pagination.totalPages > 1 && viewMode === "list" && (
						<div className="mt-6 flex justify-center gap-2">
							<Button
								variant="outline"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
							>
								Previous
							</Button>
							<span className="flex items-center px-4">
								Page {page} of {data.pagination.totalPages}
							</span>
							<Button
								variant="outline"
								onClick={() => setPage((p) => p + 1)}
								disabled={page >= data.pagination.totalPages}
							>
								Next
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
