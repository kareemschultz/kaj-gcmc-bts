"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

interface ServiceRequestFormProps {
	serviceRequestId?: number;
	onSuccess?: () => void;
}

export function ServiceRequestForm({
	serviceRequestId,
	onSuccess,
}: ServiceRequestFormProps) {
	const router = useRouter();
	const [formData, setFormData] = useState({
		clientId: "",
		clientBusinessId: "",
		serviceId: "",
		templateId: "",
		status: "new" as
			| "new"
			| "in_progress"
			| "awaiting_client"
			| "awaiting_authority"
			| "completed"
			| "cancelled",
		priority: "" as "low" | "medium" | "high" | "urgent" | "",
		currentStepOrder: "",
	});

	const utils = trpc.useContext();

	// Get service request data if editing
	const { data: serviceRequest } = trpc.serviceRequests.get.useQuery(
		{ id: serviceRequestId ?? 0 },
		{ enabled: !!serviceRequestId },
	);

	// Get clients for dropdown
	const { data: clientsData } = trpc.clients.list.useQuery({
		page: 1,
		pageSize: 100,
	});

	// Get services for dropdown
	const { data: servicesData } = trpc.services.list.useQuery({
		active: true,
	});

	// Get client businesses if client is selected
	const { data: clientBusinessesData } = trpc.clients.get.useQuery(
		{ id: Number.parseInt(formData.clientId, 10) },
		{ enabled: !!formData.clientId },
	);

	// Create mutation
	const createMutation = trpc.serviceRequests.create.useMutation({
		onSuccess: (data) => {
			toast.success("Service request created successfully");
			utils.serviceRequests.list.invalidate();
			utils.serviceRequests.stats.invalidate();
			if (onSuccess) {
				onSuccess();
			} else {
				router.push(`/service-requests/${data.id}`);
			}
		},
		onError: (error) => {
			toast.error(`Failed to create service request: ${error.message}`);
		},
	});

	// Update mutation
	const updateMutation = trpc.serviceRequests.update.useMutation({
		onSuccess: (data) => {
			toast.success("Service request updated successfully");
			utils.serviceRequests.list.invalidate();
			utils.serviceRequests.get.invalidate({ id: serviceRequestId });
			utils.serviceRequests.stats.invalidate();
			if (onSuccess) {
				onSuccess();
			} else {
				router.push(`/service-requests/${data.id}`);
			}
		},
		onError: (error) => {
			toast.error(`Failed to update service request: ${error.message}`);
		},
	});

	// Load service request data when editing
	useState(() => {
		if (serviceRequest) {
			setFormData({
				clientId: serviceRequest.clientId.toString(),
				clientBusinessId: serviceRequest.clientBusinessId?.toString() || "",
				serviceId: serviceRequest.serviceId.toString(),
				templateId: serviceRequest.templateId?.toString() || "",
				status: serviceRequest.status,
				priority: (serviceRequest.priority as
					| "low"
					| "medium"
					| "high"
					| "urgent") || "",
				currentStepOrder: serviceRequest.currentStepOrder?.toString() || "",
			});
		}
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.clientId || !formData.serviceId) {
			toast.error("Please select a client and service");
			return;
		}

		const payload = {
			clientId: Number.parseInt(formData.clientId, 10),
			clientBusinessId: formData.clientBusinessId
				? Number.parseInt(formData.clientBusinessId, 10)
				: undefined,
			serviceId: Number.parseInt(formData.serviceId, 10),
			templateId: formData.templateId
				? Number.parseInt(formData.templateId, 10)
				: undefined,
			status: formData.status,
			priority: formData.priority || undefined,
			currentStepOrder: formData.currentStepOrder
				? Number.parseInt(formData.currentStepOrder, 10)
				: undefined,
			metadata: {},
		};

		if (serviceRequestId) {
			updateMutation.mutate({
				id: serviceRequestId,
				data: payload,
			});
		} else {
			createMutation.mutate(payload);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{serviceRequestId ? "Edit Service Request" : "New Service Request"}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<Label htmlFor="clientId">Client *</Label>
							<Select
								id="clientId"
								value={formData.clientId}
								onChange={(e) => {
									setFormData({
										...formData,
										clientId: e.target.value,
										clientBusinessId: "", // Reset business when client changes
									});
								}}
								required
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

						<div>
							<Label htmlFor="clientBusinessId">Client Business</Label>
							<Select
								id="clientBusinessId"
								value={formData.clientBusinessId}
								onChange={(e) =>
									setFormData({ ...formData, clientBusinessId: e.target.value })
								}
								disabled={!formData.clientId}
							>
								<option value="">Select a business (optional)</option>
								{clientBusinessesData?.businesses?.map(
									(business: (typeof clientBusinessesData.businesses)[number]) => (
										<option key={business.id} value={business.id}>
											{business.name}
										</option>
									),
								)}
							</Select>
						</div>
					</div>

					<div>
						<Label htmlFor="serviceId">Service *</Label>
						<Select
							id="serviceId"
							value={formData.serviceId}
							onChange={(e) =>
								setFormData({ ...formData, serviceId: e.target.value })
							}
							required
						>
							<option value="">Select a service</option>
							{servicesData?.map((service) => (
								<option key={service.id} value={service.id}>
									{service.name} - {service.category}
								</option>
							))}
						</Select>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
								<option value="new">New</option>
								<option value="in_progress">In Progress</option>
								<option value="awaiting_client">Awaiting Client</option>
								<option value="awaiting_authority">Awaiting Authority</option>
								<option value="completed">Completed</option>
								<option value="cancelled">Cancelled</option>
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
								<option value="">Select priority (optional)</option>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
								<option value="urgent">Urgent</option>
							</Select>
						</div>
					</div>

					<div>
						<Label htmlFor="currentStepOrder">Current Step Order</Label>
						<Input
							id="currentStepOrder"
							type="number"
							value={formData.currentStepOrder}
							onChange={(e) =>
								setFormData({ ...formData, currentStepOrder: e.target.value })
							}
							placeholder="Leave empty to auto-calculate"
						/>
						<p className="mt-1 text-muted-foreground text-xs">
							The order of the current workflow step (0-indexed)
						</p>
					</div>

					<div className="flex gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
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
								: serviceRequestId
									? "Update Request"
									: "Create Request"}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
