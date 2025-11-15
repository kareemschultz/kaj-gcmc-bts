"use client";

import { AlertCircle, Calendar, CheckSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export default function TasksPage() {
	const [page, setPage] = useState(1);
	const [statusFilter, setStatusFilter] = useState<string | undefined>(
		undefined,
	);
	const pageSize = 20;

	const utils = trpc.useUtils();
	const { data, isLoading } = trpc.portal.tasks.useQuery({
		page,
		pageSize,
		status: statusFilter,
	});

	const completeTaskMutation = trpc.portal.completeTask.useMutation({
		onSuccess: () => {
			toast.success("Task marked as complete");
			utils.portal.tasks.invalidate();
			utils.portal.dashboard.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to complete task");
		},
	});

	const handleCompleteTask = (taskId: number) => {
		completeTaskMutation.mutate({ taskId });
	};

	const getPriorityColor = (dueDate: Date | null) => {
		if (!dueDate) return "text-gray-500";
		const today = new Date();
		const due = new Date(dueDate);
		const daysUntilDue = Math.ceil(
			(due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
		);

		if (daysUntilDue < 0) return "text-red-600";
		if (daysUntilDue <= 3) return "text-orange-600";
		if (daysUntilDue <= 7) return "text-yellow-600";
		return "text-green-600";
	};

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case "completed":
				return "default";
			case "pending":
				return "secondary";
			case "in_progress":
				return "outline";
			default:
				return "secondary";
		}
	};

	return (
		<div className="container mx-auto space-y-6 p-6">
			<div className="space-y-2">
				<h1 className="font-bold text-3xl">My Tasks</h1>
				<p className="text-muted-foreground">
					Manage your pending tasks and action items
				</p>
			</div>

			{/* Filter */}
			<div className="flex items-center gap-4">
				<Select
					value={statusFilter || "all"}
					onChange={(e) =>
						setStatusFilter(
							e.target.value === "all" ? undefined : e.target.value,
						)
					}
				>
					<option value="all">All Tasks</option>
					<option value="pending">Pending</option>
					<option value="in_progress">In Progress</option>
					<option value="completed">Completed</option>
				</Select>
			</div>

			{/* Tasks List */}
			<Card>
				<CardHeader>
					<CardTitle>All Tasks ({data?.pagination.total || 0})</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-2">
							{[...Array(5)].map((_, i) => (
								<Skeleton /* biome-ignore lint/suspicious/noArrayIndexKey: skeleton loaders are temporary UI elements that do not persist */
									key={`skeleton-${i}`}
									className="h-20 w-full"
								/>
							))}
						</div>
					) : !data || data.tasks.length === 0 ? (
						<div className="py-12 text-center">
							<CheckSquare className="mx-auto h-12 w-12 text-muted-foreground" />
							<p className="mt-4 text-muted-foreground">No tasks found</p>
						</div>
					) : (
						<div className="space-y-2">
							{data.tasks.map((task) => {
								const isOverdue =
									task.dueDate && new Date(task.dueDate) < new Date();
								const isCompleted = task.status === "completed";

								return (
									<div
										key={task.id}
										className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent"
									>
										<Checkbox
											checked={isCompleted}
											disabled={isCompleted || completeTaskMutation.isPending}
											onCheckedChange={() => handleCompleteTask(task.id)}
										/>
										<div className="flex flex-1 items-center gap-4">
											<CheckSquare
												className={`h-8 w-8 ${getPriorityColor(task.dueDate)}`}
											/>
											<div className="flex-1 space-y-1">
												<p
													className={`font-medium ${isCompleted ? "text-muted-foreground line-through" : ""}`}
												>
													{task.title}
												</p>
												<div className="flex items-center gap-2 text-muted-foreground text-sm">
													{task.dueDate && (
														<>
															<Calendar className="h-3 w-3" />
															<span>
																Due:{" "}
																{new Date(task.dueDate).toLocaleDateString()}
															</span>
															{isOverdue && !isCompleted && (
																<>
																	<AlertCircle className="h-3 w-3 text-red-600" />
																	<span className="text-red-600">Overdue</span>
																</>
															)}
														</>
													)}
													{task.serviceRequest?.service && (
														<>
															<span>•</span>
															<span>{task.serviceRequest.service.name}</span>
														</>
													)}
												</div>
												{task.description && (
													<p className="text-muted-foreground text-sm">
														{task.description}
													</p>
												)}
											</div>
										</div>
										<Badge variant={getStatusColor(task.status)}>
											{task.status}
										</Badge>
									</div>
								);
							})}
						</div>
					)}

					{/* Pagination */}
					{data && data.pagination.totalPages > 1 && (
						<div className="mt-4 flex items-center justify-between">
							<p className="text-muted-foreground text-sm">
								Page {page} of {data.pagination.totalPages}
							</p>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={page === 1}
									onClick={() => setPage((p) => Math.max(1, p - 1))}
								>
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={page === data.pagination.totalPages}
									onClick={() =>
										setPage((p) => Math.min(data.pagination.totalPages, p + 1))
									}
								>
									Next
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
