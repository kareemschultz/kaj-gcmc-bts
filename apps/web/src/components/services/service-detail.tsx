"use client";

import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { ServiceForm } from "./service-form";

interface ServiceDetailProps {
	serviceId: number;
}

export function ServiceDetail({ serviceId }: ServiceDetailProps) {
	const router = useRouter();
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const utils = trpc.useContext();

	const { data: service, isLoading, error } = trpc.services.get.useQuery({
		id: serviceId,
	});

	const deleteMutation = trpc.services.delete.useMutation({
		onSuccess: () => {
			toast.success("Service deleted successfully");
			utils.services.list.invalidate();
			utils.services.stats.invalidate();
			utils.services.categories.invalidate();
			router.push("/services");
		},
		onError: (error) => {
			toast.error(`Failed to delete service: ${error.message}`);
		},
	});

	const toggleActiveMutation = trpc.services.update.useMutation({
		onSuccess: (data) => {
			toast.success(
				`Service ${data.active ? "activated" : "deactivated"} successfully`,
			);
			utils.services.get.invalidate({ id: serviceId });
			utils.services.list.invalidate();
			utils.services.stats.invalidate();
		},
		onError: (error) => {
			toast.error(`Failed to update service: ${error.message}`);
		},
	});

	const handleDelete = () => {
		deleteMutation.mutate({ id: serviceId });
	};

	const handleToggleActive = () => {
		if (service) {
			toggleActiveMutation.mutate({
				id: serviceId,
				data: { active: !service.active },
			});
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Card>
					<CardHeader>
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-32" />
					</CardHeader>
					<CardContent className="space-y-4">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error || !service) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">
						{error?.message || "Service not found"}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Service Header */}
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div>
							<div className="flex items-center gap-3">
								<CardTitle className="text-2xl">{service.name}</CardTitle>
								<Badge variant={service.active ? "default" : "secondary"}>
									{service.active ? "Active" : "Inactive"}
								</Badge>
							</div>
							<CardDescription className="mt-2 capitalize">
								{service.category}
							</CardDescription>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsEditDialogOpen(true)}
							>
								<Edit className="mr-2 h-4 w-4" />
								Edit
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setIsDeleteDialogOpen(true)}
								disabled={service._count.serviceRequests > 0}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Description */}
					{service.description && (
						<div>
							<h3 className="mb-2 font-semibold text-sm">Description</h3>
							<p className="text-muted-foreground">{service.description}</p>
						</div>
					)}

					{/* Service Details Grid */}
					<div className="grid gap-6 md:grid-cols-2">
						<div>
							<h3 className="mb-2 font-semibold text-sm">Pricing</h3>
							<p className="text-2xl">
								{service.basePrice !== null
									? `$${service.basePrice.toFixed(2)}`
									: "Not set"}
							</p>
						</div>
						<div>
							<h3 className="mb-2 font-semibold text-sm">Estimated Duration</h3>
							<p className="text-2xl">
								{service.estimatedDays !== null
									? `${service.estimatedDays} days`
									: "Not set"}
							</p>
						</div>
					</div>

					{/* Active Toggle */}
					<div className="flex items-center space-x-2 border-t pt-4">
						<Checkbox
							id="active-toggle"
							checked={service.active}
							onCheckedChange={handleToggleActive}
							disabled={toggleActiveMutation.isPending}
						/>
						<label
							htmlFor="active-toggle"
							className="cursor-pointer font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							Active service (available for service requests)
						</label>
					</div>
				</CardContent>
			</Card>

			{/* Usage Statistics */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Service Requests</CardTitle>
						<CardDescription>
							Number of times this service has been requested
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-3xl">{service._count.serviceRequests}</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Templates</CardTitle>
						<CardDescription>
							Number of document templates associated with this service
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-3xl">{service.templates.length}</p>
					</CardContent>
				</Card>
			</div>

			{/* Templates List */}
			{service.templates.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Associated Templates</CardTitle>
						<CardDescription>
							Document templates linked to this service
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{service.templates.map((template) => (
								<li
									key={template.id}
									className="flex items-center justify-between rounded-md border px-4 py-2"
								>
									<span>{template.name}</span>
									<Badge variant="outline">{template.type}</Badge>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}

			{/* Edit Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit Service</DialogTitle>
					</DialogHeader>
					<ServiceForm
						serviceId={serviceId}
						onSuccess={() => setIsEditDialogOpen(false)}
					/>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Service</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{service.name}"? This action
							cannot be undone.
						</DialogDescription>
					</DialogHeader>
					{service._count.serviceRequests > 0 && (
						<div className="rounded-md border border-destructive bg-destructive/10 p-4">
							<p className="text-destructive text-sm">
								This service cannot be deleted because it has{" "}
								{service._count.serviceRequests} associated service request(s).
							</p>
						</div>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDeleteDialogOpen(false)}
							disabled={deleteMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={
								deleteMutation.isPending ||
								service._count.serviceRequests > 0
							}
						>
							{deleteMutation.isPending ? "Deleting..." : "Delete Service"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
