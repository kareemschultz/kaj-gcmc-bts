"use client";

import { Check, CheckCircle2, Circle, Clock, Plus, XCircle, Pencil, Trash2 } from "lucide-react";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

interface WorkflowStepsProps {
	serviceRequestId: number;
	steps: Array<{
		id: number;
		title: string;
		description?: string | null;
		order: number;
		status: string;
		dueDate?: Date | null;
		filingId?: number | null;
		requiredDocTypeIds: number[];
		dependsOnStepId?: number | null;
		filing?: {
			id: number;
			periodLabel?: string | null;
		} | null;
	}>;
}

const STEP_STATUSES = [
	{
		value: "not_started",
		label: "Not Started",
		icon: Circle,
		variant: "secondary" as const,
	},
	{
		value: "in_progress",
		label: "In Progress",
		icon: Clock,
		variant: "warning" as const,
	},
	{
		value: "done",
		label: "Done",
		icon: CheckCircle2,
		variant: "success" as const,
	},
	{
		value: "blocked",
		label: "Blocked",
		icon: XCircle,
		variant: "destructive" as const,
	},
];

export function WorkflowSteps({ serviceRequestId, steps }: WorkflowStepsProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingStep, setEditingStep] = useState<number | null>(null);
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		order: "",
		status: "not_started" as "not_started" | "in_progress" | "done" | "blocked",
		dueDate: "",
		filingId: "",
	});

	const utils = trpc.useContext();

	// Create step mutation
	const createStepMutation = trpc.serviceRequests.createStep.useMutation({
		onSuccess: () => {
			toast.success("Workflow step created successfully");
			utils.serviceRequests.get.invalidate({ id: serviceRequestId });
			setIsDialogOpen(false);
			resetForm();
		},
		onError: (error) => {
			toast.error(`Failed to create step: ${error.message}`);
		},
	});

	// Update step mutation
	const updateStepMutation = trpc.serviceRequests.updateStep.useMutation({
		onSuccess: () => {
			toast.success("Workflow step updated successfully");
			utils.serviceRequests.get.invalidate({ id: serviceRequestId });
			setIsDialogOpen(false);
			setEditingStep(null);
			resetForm();
		},
		onError: (error) => {
			toast.error(`Failed to update step: ${error.message}`);
		},
	});

	// Delete step mutation
	const deleteStepMutation = trpc.serviceRequests.deleteStep.useMutation({
		onSuccess: () => {
			toast.success("Workflow step deleted successfully");
			utils.serviceRequests.get.invalidate({ id: serviceRequestId });
		},
		onError: (error) => {
			toast.error(`Failed to delete step: ${error.message}`);
		},
	});

	const resetForm = () => {
		setFormData({
			title: "",
			description: "",
			order: "",
			status: "not_started",
			dueDate: "",
			filingId: "",
		});
	};

	const handleOpenDialog = (step?: (typeof steps)[number]) => {
		if (step) {
			setEditingStep(step.id);
			setFormData({
				title: step.title,
				description: step.description || "",
				order: step.order.toString(),
				status: step.status as typeof formData.status,
				dueDate: step.dueDate
					? new Date(step.dueDate).toISOString().split("T")[0]
					: "",
				filingId: step.filingId?.toString() || "",
			});
		} else {
			setEditingStep(null);
			resetForm();
		}
		setIsDialogOpen(true);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.title || !formData.order) {
			toast.error("Please fill in required fields");
			return;
		}

		const payload = {
			title: formData.title,
			description: formData.description || undefined,
			order: Number.parseInt(formData.order, 10),
			status: formData.status,
			dueDate: formData.dueDate
				? new Date(formData.dueDate).toISOString()
				: undefined,
			filingId: formData.filingId
				? Number.parseInt(formData.filingId, 10)
				: undefined,
			requiredDocTypeIds: [],
		};

		if (editingStep) {
			updateStepMutation.mutate({
				id: editingStep,
				data: payload,
			});
		} else {
			createStepMutation.mutate({
				...payload,
				serviceRequestId,
			});
		}
	};

	const handleDelete = (stepId: number) => {
		if (
			window.confirm(
				"Are you sure you want to delete this step? This action cannot be undone.",
			)
		) {
			deleteStepMutation.mutate({ id: stepId });
		}
	};

	const getStatusConfig = (status: string) => {
		return (
			STEP_STATUSES.find((s) => s.value === status) || {
				value: status,
				label: status,
				icon: Circle,
				variant: "secondary" as const,
			}
		);
	};

	const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Workflow Steps</CardTitle>
							<CardDescription>
								{steps.length} step(s) in this service request workflow
							</CardDescription>
						</div>
						<Button onClick={() => handleOpenDialog()}>
							<Plus className="mr-2 h-4 w-4" />
							Add Step
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{sortedSteps.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground">
							<p>No workflow steps yet.</p>
							<p className="text-sm">Add your first step to get started.</p>
						</div>
					) : (
						<div className="space-y-4">
							{sortedSteps.map((step, index) => {
								const statusConfig = getStatusConfig(step.status);
								const StatusIcon = statusConfig.icon;
								const isLastStep = index === sortedSteps.length - 1;

								return (
									<div key={step.id} className="relative">
										<div className="flex gap-4">
											<div className="flex flex-col items-center">
												<div
													className={`flex h-8 w-8 items-center justify-center rounded-full ${
														step.status === "done"
															? "bg-green-500"
															: step.status === "in_progress"
																? "bg-yellow-500"
																: step.status === "blocked"
																	? "bg-red-500"
																	: "bg-gray-300"
													}`}
												>
													<StatusIcon className="h-4 w-4 text-white" />
												</div>
												{!isLastStep && (
													<div className="h-full w-0.5 flex-1 bg-gray-300" />
												)}
											</div>
											<Card className="mb-4 flex-1">
												<CardContent className="pt-4">
													<div className="flex items-start justify-between">
														<div className="flex-1">
															<div className="flex items-center gap-2">
																<h4 className="font-medium">
																	{index + 1}. {step.title}
																</h4>
																<Badge variant={statusConfig.variant}>
																	{statusConfig.label}
																</Badge>
															</div>
															{step.description && (
																<p className="mt-1 text-muted-foreground text-sm">
																	{step.description}
																</p>
															)}
															<div className="mt-2 flex flex-wrap gap-3 text-muted-foreground text-xs">
																{step.dueDate && (
																	<span>
																		Due:{" "}
																		{new Date(step.dueDate).toLocaleDateString()}
																	</span>
																)}
																{step.filing && (
																	<Link
																		href={`/filings/${step.filing.id}`}
																		className="text-blue-600 hover:underline"
																	>
																		Filing: {step.filing.periodLabel || `#${step.filing.id}`}
																	</Link>
																)}
																{step.dependsOnStepId && (
																	<span>
																		Depends on: Step{" "}
																		{sortedSteps.findIndex(
																			(s) => s.id === step.dependsOnStepId,
																		) + 1}
																	</span>
																)}
															</div>
														</div>
														<div className="flex gap-2">
															<Button
																variant="ghost"
																size="icon"
																onClick={() => handleOpenDialog(step)}
															>
																<Pencil className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="icon"
																onClick={() => handleDelete(step.id)}
															>
																<Trash2 className="h-4 w-4 text-destructive" />
															</Button>
														</div>
													</div>
												</CardContent>
											</Card>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{editingStep ? "Edit Workflow Step" : "Add Workflow Step"}
						</DialogTitle>
						<DialogDescription>
							{editingStep
								? "Update the details of this workflow step"
								: "Add a new step to the service request workflow"}
						</DialogDescription>
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
									placeholder="Step title"
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
									placeholder="Step description (optional)"
									rows={3}
									className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="order">Order *</Label>
									<Input
										id="order"
										type="number"
										value={formData.order}
										onChange={(e) =>
											setFormData({ ...formData, order: e.target.value })
										}
										placeholder="0"
										required
									/>
									<p className="mt-1 text-muted-foreground text-xs">
										The position of this step (0-indexed)
									</p>
								</div>

								<div>
									<Label htmlFor="status">Status *</Label>
									<Select
										id="status"
										value={formData.status}
										onChange={(e) =>
											setFormData({
												...formData,
												status: e.target.value as typeof formData.status,
											})
										}
										required
									>
										{STEP_STATUSES.map((s) => (
											<option key={s.value} value={s.value}>
												{s.label}
											</option>
										))}
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
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
									<Label htmlFor="filingId">Filing ID</Label>
									<Input
										id="filingId"
										type="number"
										value={formData.filingId}
										onChange={(e) =>
											setFormData({ ...formData, filingId: e.target.value })
										}
										placeholder="Optional filing reference"
									/>
								</div>
							</div>
						</div>

						<DialogFooter className="mt-6">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setIsDialogOpen(false);
									setEditingStep(null);
									resetForm();
								}}
								disabled={
									createStepMutation.isPending || updateStepMutation.isPending
								}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={
									createStepMutation.isPending || updateStepMutation.isPending
								}
							>
								{createStepMutation.isPending || updateStepMutation.isPending
									? "Saving..."
									: editingStep
										? "Update Step"
										: "Add Step"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
