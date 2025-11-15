"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { TaskForm } from "./task-form";

export function TasksList() {
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState<string>("");
	const [formOpen, setFormOpen] = useState(false);
	const [editingTask, setEditingTask] = useState<number | null>(null);

	const { data, isLoading, error, refetch } = trpc.tasks.list.useQuery({
		status: status || undefined,
		page,
		pageSize: 20,
	});

	// Get overdue tasks
	const { data: overdueTasks } = trpc.tasks.overdue.useQuery();

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">Error loading tasks: {error.message}</p>
				</CardContent>
			</Card>
		);
	}

	const getStatusBadge = (status: string) => {
		const variants: Record<string, "success" | "warning" | "destructive" | "secondary" | "info"> = {
			open: "secondary",
			in_progress: "info",
			blocked: "destructive",
			completed: "success",
		};
		return <Badge variant={variants[status] || "secondary"}>{status.replace("_", " ")}</Badge>;
	};

	const getPriorityBadge = (priority?: string | null) => {
		if (!priority) return null;
		const variants: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
			low: "secondary",
			medium: "info",
			high: "warning",
			urgent: "destructive",
		};
		return <Badge variant={variants[priority] || "secondary"}>{priority}</Badge>;
	};

	const isOverdue = (dueDate?: Date | null) => {
		if (!dueDate) return false;
		return new Date(dueDate) < new Date();
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return <CheckCircle className="h-5 w-5 text-green-500" />;
			case "blocked":
				return <AlertTriangle className="h-5 w-5 text-red-500" />;
			case "in_progress":
				return <Clock className="h-5 w-5 text-blue-500" />;
			default:
				return <Clock className="h-5 w-5 text-gray-500" />;
		}
	};

	return (
		<div className="space-y-4">
			{overdueTasks && overdueTasks.length > 0 && (
				<Card className="border-red-500 bg-red-50">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-red-900">
							<AlertTriangle className="h-5 w-5" />
							Overdue Tasks
						</CardTitle>
						<CardDescription className="text-red-800">
							{overdueTasks.length} task(s) past their due date
						</CardDescription>
					</CardHeader>
				</Card>
			)}

			<div className="flex gap-4 flex-wrap">
				<Select
					value={status}
					onChange={(e) => {
						setStatus(e.target.value);
						setPage(1);
					}}
				>
					<option value="">All Status</option>
					<option value="open">Open</option>
					<option value="in_progress">In Progress</option>
					<option value="blocked">Blocked</option>
					<option value="completed">Completed</option>
				</Select>
				<Button onClick={() => setFormOpen(true)}>
					<Plus className="h-4 w-4 mr-2" />
					New Task
				</Button>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{[...Array(6)].map((_, i) => (
						<Card key={i}>
							<CardContent className="pt-6">
								<Skeleton className="h-6 w-3/4 mb-2" />
								<Skeleton className="h-4 w-1/2" />
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<>
					<div className="space-y-3">
						{data?.tasks.map((task) => (
							<Card
								key={task.id}
								className={`hover:shadow-md transition-shadow ${
									isOverdue(task.dueDate) && task.status !== "completed" ? "border-red-500" : ""
								}`}
							>
								<CardContent className="pt-6">
									<div className="flex items-start justify-between gap-4">
										<div className="flex items-start gap-3 flex-1">
											{getStatusIcon(task.status)}
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<h3
														className="font-medium cursor-pointer hover:text-blue-600"
														onClick={() => {
															setEditingTask(task.id);
															setFormOpen(true);
														}}
													>
														{task.title}
													</h3>
													{task.priority && getPriorityBadge(task.priority)}
												</div>
												{task.description && (
													<p className="text-sm text-muted-foreground mb-2">
														{task.description}
													</p>
												)}
												<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
													{task.client && (
														<span>Client: {task.client.name}</span>
													)}
													{task.assignedTo && (
														<span>Assigned: {task.assignedTo.name}</span>
													)}
													{task.dueDate && (
														<span
															className={
																isOverdue(task.dueDate) && task.status !== "completed"
																	? "text-red-600 font-medium"
																	: ""
															}
														>
															Due: {new Date(task.dueDate).toLocaleDateString()}
														</span>
													)}
												</div>
											</div>
										</div>
										<div>{getStatusBadge(task.status)}</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{data && data.tasks.length === 0 && (
						<Card>
							<CardContent className="pt-6 text-center text-muted-foreground">
								No tasks found. Create your first task to get started.
							</CardContent>
						</Card>
					)}

					{data && data.pagination.totalPages > 1 && (
						<div className="flex justify-center gap-2 mt-6">
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

			<TaskForm
				open={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open);
					if (!open) {
						setEditingTask(null);
					}
				}}
				taskId={editingTask}
				onSuccess={() => {
					refetch();
					setFormOpen(false);
					setEditingTask(null);
				}}
			/>
		</div>
	);
}
