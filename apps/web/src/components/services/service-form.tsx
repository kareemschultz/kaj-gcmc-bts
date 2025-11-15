"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";

interface ServiceFormProps {
	serviceId?: number;
	onSuccess?: () => void;
}

export function ServiceForm({ serviceId, onSuccess }: ServiceFormProps) {
	const router = useRouter();
	const [formData, setFormData] = useState({
		name: "",
		category: "",
		description: "",
		basePrice: "",
		estimatedDays: "",
		active: true,
	});

	const utils = trpc.useContext();

	// Get service data if editing
	const { data: service, isLoading: isLoadingService } =
		trpc.services.get.useQuery(
			{ id: serviceId ?? 0 },
			{ enabled: !!serviceId },
		);

	// Get categories for reference
	const { data: categories } = trpc.services.categories.useQuery();

	// Create mutation
	const createMutation = trpc.services.create.useMutation({
		onSuccess: (data) => {
			toast.success("Service created successfully");
			utils.services.list.invalidate();
			utils.services.stats.invalidate();
			utils.services.categories.invalidate();
			if (onSuccess) {
				onSuccess();
			} else {
				router.push(`/services/${data.id}`);
			}
		},
		onError: (error) => {
			toast.error(`Failed to create service: ${error.message}`);
		},
	});

	// Update mutation
	const updateMutation = trpc.services.update.useMutation({
		onSuccess: (data) => {
			toast.success("Service updated successfully");
			utils.services.list.invalidate();
			utils.services.get.invalidate({ id: serviceId ?? 0 });
			utils.services.stats.invalidate();
			utils.services.categories.invalidate();
			if (onSuccess) {
				onSuccess();
			} else {
				router.push(`/services/${data.id}`);
			}
		},
		onError: (error) => {
			toast.error(`Failed to update service: ${error.message}`);
		},
	});

	// Load service data when editing
	useEffect(() => {
		if (service) {
			setFormData({
				name: service.name,
				category: service.category,
				description: service.description || "",
				basePrice: service.basePrice?.toString() || "",
				estimatedDays: service.estimatedDays?.toString() || "",
				active: service.active,
			});
		}
	}, [service]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			toast.error("Please enter a service name");
			return;
		}

		if (!formData.category.trim()) {
			toast.error("Please enter a category");
			return;
		}

		const payload = {
			name: formData.name.trim(),
			category: formData.category.trim(),
			description: formData.description.trim() || undefined,
			basePrice: formData.basePrice
				? Number.parseFloat(formData.basePrice)
				: undefined,
			estimatedDays: formData.estimatedDays
				? Number.parseInt(formData.estimatedDays, 10)
				: undefined,
			active: formData.active,
		};

		// Validate numbers
		if (payload.basePrice !== undefined && Number.isNaN(payload.basePrice)) {
			toast.error("Base price must be a valid number");
			return;
		}

		if (
			payload.estimatedDays !== undefined &&
			(Number.isNaN(payload.estimatedDays) || payload.estimatedDays <= 0)
		) {
			toast.error("Estimated days must be a positive number");
			return;
		}

		if (serviceId) {
			updateMutation.mutate({
				id: serviceId,
				data: payload,
			});
		} else {
			createMutation.mutate(payload);
		}
	};

	const isLoading = createMutation.isPending || updateMutation.isPending;

	if (serviceId && isLoadingService) {
		return (
			<div className="flex items-center justify-center py-8">
				<p className="text-muted-foreground">Loading service...</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="grid gap-6 md:grid-cols-2">
				{/* Name */}
				<div className="md:col-span-2">
					<Label htmlFor="name">Service Name *</Label>
					<Input
						id="name"
						value={formData.name}
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						placeholder="e.g., Business Registration"
						required
						disabled={isLoading}
					/>
				</div>

				{/* Category */}
				<div>
					<Label htmlFor="category">Category *</Label>
					<Input
						id="category"
						value={formData.category}
						onChange={(e) =>
							setFormData({ ...formData, category: e.target.value })
						}
						placeholder="e.g., Corporate Services"
						list="categories-list"
						required
						disabled={isLoading}
					/>
					{categories && categories.length > 0 && (
						<datalist id="categories-list">
							{categories.map((cat) => (
								<option key={cat.category} value={cat.category} />
							))}
						</datalist>
					)}
					<p className="mt-1 text-muted-foreground text-xs">
						Start typing to see existing categories
					</p>
				</div>

				{/* Base Price */}
				<div>
					<Label htmlFor="basePrice">Base Price (optional)</Label>
					<div className="relative">
						<span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground">
							$
						</span>
						<Input
							id="basePrice"
							type="number"
							step="0.01"
							min="0"
							value={formData.basePrice}
							onChange={(e) =>
								setFormData({ ...formData, basePrice: e.target.value })
							}
							placeholder="0.00"
							className="pl-7"
							disabled={isLoading}
						/>
					</div>
				</div>

				{/* Estimated Days */}
				<div>
					<Label htmlFor="estimatedDays">Estimated Days (optional)</Label>
					<Input
						id="estimatedDays"
						type="number"
						min="1"
						value={formData.estimatedDays}
						onChange={(e) =>
							setFormData({ ...formData, estimatedDays: e.target.value })
						}
						placeholder="e.g., 5"
						disabled={isLoading}
					/>
				</div>

				{/* Active Status */}
				<div className="flex items-center space-x-2">
					<Checkbox
						id="active"
						checked={formData.active}
						onCheckedChange={(checked) =>
							setFormData({ ...formData, active: checked === true })
						}
						disabled={isLoading}
					/>
					<Label
						htmlFor="active"
						className="cursor-pointer font-normal text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						Active service (available for service requests)
					</Label>
				</div>

				{/* Description */}
				<div className="md:col-span-2">
					<Label htmlFor="description">Description (optional)</Label>
					<textarea
						id="description"
						value={formData.description}
						onChange={(e) =>
							setFormData({ ...formData, description: e.target.value })
						}
						placeholder="Detailed description of the service..."
						rows={4}
						className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
						disabled={isLoading}
					/>
				</div>
			</div>

			{/* Form Actions */}
			<div className="flex justify-end gap-4 border-t pt-6">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.back()}
					disabled={isLoading}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isLoading}>
					{isLoading
						? serviceId
							? "Updating..."
							: "Creating..."
						: serviceId
							? "Update Service"
							: "Create Service"}
				</Button>
			</div>
		</form>
	);
}
