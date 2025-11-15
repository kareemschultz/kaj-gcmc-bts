"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

interface TaskFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	taskId?: number | null;
	onSuccess?: () => void;
}

export function TaskForm({
	open,
	onOpenChange,
	taskId,
	onSuccess,
}: TaskFormProps) {
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		status: "open" as "open" | "in_progress" | "blocked" | "completed",
		priority: "medium" as "low" | "medium" | "high" | "urgent",
		dueDate: "",
		clientId: "",
	});

	const utils = trpc.useContext();

	// Get task data if editing
	const { data: task } = trpc.tasks.get.useQuery(
		{ id: taskId ?? 0 },
		{ enabled: !!taskId },
	);

	// Get clients for dropdown
	const { data: clientsData } = trpc.clients.list.useQuery({
		page: 1,
		pageSize: 100,
	});

	// Create mutation
	const createMutation = trpc.tasks.create.useMutation({
		onSuccess: () => {
			toast.success("Task created successfully");
			utils.tasks.list.invalidate();
			onSuccess?.();
		},
		onError: (error) => {
			toast.error(`Failed to create task: ${error.message}`);
		},
	});

	// Update mutation
	const updateMutation = trpc.tasks.update.useMutation({
		onSuccess: () => {
			toast.success("Task updated successfully");
			utils.tasks.list.invalidate();
			onSuccess?.();
		},
		onError: (error) => {
			toast.error(`Failed to update task: ${error.message}`);
		},
	});

	// Load task data when editing
	useEffect(() => {
		if (task) {
			setFormData({
				title: task.title,
				description: task.description || "",
				status: task.status,
				priority: task.priority || "medium",
				dueDate: task.dueDate
					? new Date(task.dueDate).toISOString().split("T")[0]
					: "",
				clientId: task.clientId?.toString() || "",
			});
		} else {
			// Reset form when creating new
			setFormData({
				title: "",
				description: "",
				status: "open",
				priority: "medium",
				dueDate: "",
				clientId: "",
			});
		}
	}, [task]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.title.trim()) {
			toast.error("Please enter a task title");
			return;
		}

		const payload = {
			title: formData.title,
			description: formData.description || undefined,
			status: formData.status,
			priority: formData.priority,
			dueDate: formData.dueDate
				? new Date(formData.dueDate).toISOString()
				: undefined,
			clientId: formData.clientId
				? Number.parseInt(formData.clientId, 10)
				: undefined,
		};

		if (taskId) {
			updateMutation.mutate({
				id: taskId,
				data: payload,
			});
		} else {
			createMutation.mutate(payload);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{taskId ? "Edit Task" : "Create New Task"}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4">
						<div>
							<Label htmlFor="title">Title *</Label>
							<Input
								id="title"
								value={formData.title}
								onChange={(e) =>
									setFormData({ ...formData, title: e.target.value })
								}
								placeholder="Task title"
								required
							/>
						</div>

						<div>
							<Label htmlFor="description">Description</Label>
							<textarea
								id="description"
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								placeholder="Task description"
								className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="status">Status</Label>
								<Select
									id="status"
									value={formData.status}
									onChange={(e) =>
										setFormData({
											...formData,
											status: e.target.value as typeof formData.status,
										})
									}
								>
									<option value="open">Open</option>
									<option value="in_progress">In Progress</option>
									<option value="blocked">Blocked</option>
									<option value="completed">Completed</option>
								</Select>
							</div>

							<div>
								<Label htmlFor="priority">Priority</Label>
								<Select
									id="priority"
									value={formData.priority}
									onChange={(e) =>
										setFormData({
											...formData,
											priority: e.target.value as typeof formData.priority,
										})
									}
								>
									<option value="low">Low</option>
									<option value="medium">Medium</option>
									<option value="high">High</option>
									<option value="urgent">Urgent</option>
								</Select>
							</div>
						</div>

						<div>
							<Label htmlFor="dueDate">Due Date</Label>
							<Input
								id="dueDate"
								type="date"
								value={formData.dueDate}
								onChange={(e) =>
									setFormData({ ...formData, dueDate: e.target.value })
								}
							/>
						</div>

						<div>
							<Label htmlFor="clientId">Client (Optional)</Label>
							<Select
								id="clientId"
								value={formData.clientId}
								onChange={(e) =>
									setFormData({ ...formData, clientId: e.target.value })
								}
							>
								<option value="">Select a client</option>
								{clientsData?.clients.map(
									(client: (typeof clientsData.clients)[number]) => (
										<option key={client.id} value={client.id}>
											{client.name}
										</option>
									),
								)}
							</Select>
						</div>
					</div>

					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={createMutation.isPending || updateMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={createMutation.isPending || updateMutation.isPending}
						>
							{createMutation.isPending || updateMutation.isPending
								? "Saving..."
								: taskId
									? "Update Task"
									: "Create Task"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
