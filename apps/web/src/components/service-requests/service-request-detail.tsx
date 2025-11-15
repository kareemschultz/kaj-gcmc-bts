"use client";

import { ArrowLeft, MessageSquare, CheckSquare, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowSteps } from "@/components/service-requests/workflow-steps";
import { trpc } from "@/utils/trpc";

interface ServiceRequestDetailProps {
	serviceRequestId: number;
}

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

export function ServiceRequestDetail({
	serviceRequestId,
}: ServiceRequestDetailProps) {
	const [newStatus, setNewStatus] = useState<string>("");
	const utils = trpc.useContext();

	const {
		data: serviceRequest,
		isLoading,
		error,
	} = trpc.serviceRequests.get.useQuery({ id: serviceRequestId });

	const updateMutation = trpc.serviceRequests.update.useMutation({
		onSuccess: () => {
			toast.success("Service request status updated successfully");
			utils.serviceRequests.get.invalidate({ id: serviceRequestId });
			utils.serviceRequests.list.invalidate();
			utils.serviceRequests.stats.invalidate();
			setNewStatus("");
		},
		onError: (error) => {
			toast.error(`Failed to update status: ${error.message}`);
		},
	});

	const deleteMutation = trpc.serviceRequests.delete.useMutation({
		onSuccess: () => {
			toast.success("Service request deleted successfully");
			window.location.href = "/service-requests";
		},
		onError: (error) => {
			toast.error(`Failed to delete service request: ${error.message}`);
		},
	});

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">
						Error loading service request: {error.message}
					</p>
					<Link href="/service-requests">
						<Button variant="outline" className="mt-4">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Service Requests
						</Button>
					</Link>
				</CardContent>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-64" />
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-32" />
					</CardHeader>
					<CardContent>
						<Skeleton className="mb-2 h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!serviceRequest) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-muted-foreground">Service request not found</p>
					<Link href="/service-requests">
						<Button variant="outline" className="mt-4">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Service Requests
						</Button>
					</Link>
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
			<Badge variant={priorityConfig?.variant || "secondary"}>
				{priorityConfig?.label || priority}
			</Badge>
		);
	};

	const handleStatusChange = () => {
		if (!newStatus) {
			toast.error("Please select a status");
			return;
		}
		updateMutation.mutate({
			id: serviceRequestId,
			data: {
				status: newStatus as
					| "new"
					| "in_progress"
					| "awaiting_client"
					| "awaiting_authority"
					| "completed"
					| "cancelled",
			},
		});
	};

	const handleDelete = () => {
		if (
			window.confirm(
				"Are you sure you want to delete this service request? This action cannot be undone.",
			)
		) {
			deleteMutation.mutate({ id: serviceRequestId });
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Link href="/service-requests">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Service Requests
						</Button>
					</Link>
					<h1 className="mt-2 font-bold text-3xl">
						{serviceRequest.service.name}
					</h1>
					<p className="text-muted-foreground">
						{serviceRequest.client.name}
					</p>
				</div>
				<Button variant="destructive" onClick={handleDelete} size="sm">
					<Trash2 className="mr-2 h-4 w-4" />
					Delete
				</Button>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Request Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<p className="font-medium text-muted-foreground text-sm">
								Service
							</p>
							<p className="text-sm">{serviceRequest.service.name}</p>
							<p className="text-muted-foreground text-xs">
								{serviceRequest.service.category}
							</p>
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-sm">Client</p>
							<Link href={`/clients/${serviceRequest.client.id}`}>
								<p className="text-blue-600 text-sm hover:underline">
									{serviceRequest.client.name}
								</p>
							</Link>
						</div>
						{serviceRequest.clientBusiness && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Business
								</p>
								<p className="text-sm">{serviceRequest.clientBusiness.name}</p>
							</div>
						)}
						{serviceRequest.template && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Template
								</p>
								<p className="text-sm">{serviceRequest.template.name}</p>
							</div>
						)}
						<div>
							<p className="font-medium text-muted-foreground text-sm">Status</p>
							<div className="mt-1">{getStatusBadge(serviceRequest.status)}</div>
						</div>
						{serviceRequest.priority && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Priority
								</p>
								<div className="mt-1">
									{getPriorityBadge(serviceRequest.priority)}
								</div>
							</div>
						)}
						{serviceRequest.currentStepOrder !== null && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Current Step
								</p>
								<p className="text-sm">Step {serviceRequest.currentStepOrder + 1}</p>
							</div>
						)}
						<div>
							<p className="font-medium text-muted-foreground text-sm">Created</p>
							<p className="text-sm">
								{new Date(serviceRequest.createdAt).toLocaleString()}
							</p>
						</div>
						{serviceRequest.updatedAt &&
							serviceRequest.updatedAt !== serviceRequest.createdAt && (
								<div>
									<p className="font-medium text-muted-foreground text-sm">
										Last Updated
									</p>
									<p className="text-sm">
										{new Date(serviceRequest.updatedAt).toLocaleString()}
									</p>
								</div>
							)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Change Status</CardTitle>
						<CardDescription>
							Update the status of this service request. Email notifications will
							be sent to the client.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label htmlFor="newStatus">New Status</Label>
							<Select
								id="newStatus"
								value={newStatus}
								onChange={(e) => setNewStatus(e.target.value)}
							>
								<option value="">Select new status</option>
								{STATUSES.map((s) => (
									<option
										key={s.value}
										value={s.value}
										disabled={s.value === serviceRequest.status}
									>
										{s.label}
									</option>
								))}
							</Select>
						</div>
						<Button
							onClick={handleStatusChange}
							disabled={!newStatus || updateMutation.isPending}
							className="w-full"
						>
							{updateMutation.isPending ? "Updating..." : "Update Status"}
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Workflow Steps */}
			<WorkflowSteps serviceRequestId={serviceRequestId} steps={serviceRequest.steps} />

			{/* Related Tasks */}
			{serviceRequest.tasks && serviceRequest.tasks.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CheckSquare className="h-5 w-5" />
							Related Tasks
						</CardTitle>
						<CardDescription>
							{serviceRequest.tasks.length} task(s) associated with this request
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{serviceRequest.tasks.map((task) => (
								<Link key={task.id} href={`/tasks/${task.id}`}>
									<Card className="cursor-pointer p-3 transition-shadow hover:shadow-md">
										<div className="flex items-center justify-between">
											<div>
												<p className="font-medium text-sm">{task.title}</p>
												{task.assignedTo && (
													<p className="text-muted-foreground text-xs">
														Assigned to: {task.assignedTo.name}
													</p>
												)}
											</div>
											<Badge
												variant={
													task.status === "completed"
														? "success"
														: task.status === "in_progress"
															? "warning"
															: "secondary"
												}
											>
												{task.status}
											</Badge>
										</div>
									</Card>
								</Link>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Related Conversations */}
			{serviceRequest.conversations && serviceRequest.conversations.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<MessageSquare className="h-5 w-5" />
							Related Conversations
						</CardTitle>
						<CardDescription>
							{serviceRequest.conversations.length} conversation(s) about this
							request
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{serviceRequest.conversations.map((conversation) => (
								<Link key={conversation.id} href={`/conversations/${conversation.id}`}>
									<Card className="cursor-pointer p-3 transition-shadow hover:shadow-md">
										<div>
											<p className="font-medium text-sm">{conversation.subject}</p>
											{conversation.messages && conversation.messages.length > 0 && (
												<div className="mt-2 space-y-1">
													{conversation.messages.slice(0, 2).map((message) => (
														<p key={message.id} className="text-muted-foreground text-xs">
															{message.author?.name}:{" "}
															{message.body.substring(0, 50)}
															{message.body.length > 50 ? "..." : ""}
														</p>
													))}
												</div>
											)}
										</div>
									</Card>
								</Link>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
