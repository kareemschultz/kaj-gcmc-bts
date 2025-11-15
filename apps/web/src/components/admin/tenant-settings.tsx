"use client";

import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export function TenantSettings() {
	const [name, setName] = useState("");
	const [contactInfo, setContactInfo] = useState({
		email: "",
		phone: "",
		address: "",
	});

	const utils = trpc.useUtils();

	const { data: currentTenant, isLoading } = trpc.tenants.current.useQuery();

	useEffect(() => {
		if (currentTenant) {
			setName(currentTenant.name);
			if (currentTenant.contactInfo) {
				const info =
					typeof currentTenant.contactInfo === "string"
						? JSON.parse(currentTenant.contactInfo)
						: currentTenant.contactInfo;
				setContactInfo({
					email: info.email || "",
					phone: info.phone || "",
					address: info.address || "",
				});
			}
		}
	}, [currentTenant]);

	const updateTenantMutation = trpc.tenants.update.useMutation({
		onSuccess: () => {
			toast.success("Tenant settings updated successfully");
			utils.tenants.current.invalidate();
		},
		onError: (error) => {
			toast.error(`Failed to update tenant: ${error.message}`);
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!currentTenant) return;

		try {
			await updateTenantMutation.mutateAsync({
				id: currentTenant.id,
				data: {
					name,
					contactInfo,
				},
			});
		} catch (_error) {
			// Error handled by mutation callback
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-64" />
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!currentTenant) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">No tenant found</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Tenant Information</CardTitle>
					<CardDescription>
						View and update your tenant settings
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label
								htmlFor="tenant-name"
								className="mb-2 block font-medium text-sm"
							>
								Tenant Name
							</label>
							<Input
								id="tenant-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Organization Name"
								required
							/>
						</div>

						<div>
							<label
								htmlFor="tenant-code"
								className="mb-2 block font-medium text-sm"
							>
								Tenant Code
							</label>
							<Input
								id="tenant-code"
								value={currentTenant.code}
								disabled
								className="bg-muted"
							/>
							<p className="mt-1 text-muted-foreground text-xs">
								Tenant code cannot be changed
							</p>
						</div>

						<div className="flex justify-end">
							<Button type="submit" disabled={updateTenantMutation.isPending}>
								<Save className="mr-2 h-4 w-4" />
								{updateTenantMutation.isPending ? "Saving..." : "Save Changes"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Contact Information</CardTitle>
					<CardDescription>Manage your tenant contact details</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label
								htmlFor="contact-email"
								className="mb-2 block font-medium text-sm"
							>
								Email
							</label>
							<Input
								id="contact-email"
								type="email"
								value={contactInfo.email}
								onChange={(e) =>
									setContactInfo({ ...contactInfo, email: e.target.value })
								}
								placeholder="contact@example.com"
							/>
						</div>

						<div>
							<label
								htmlFor="contact-phone"
								className="mb-2 block font-medium text-sm"
							>
								Phone
							</label>
							<Input
								id="contact-phone"
								type="tel"
								value={contactInfo.phone}
								onChange={(e) =>
									setContactInfo({ ...contactInfo, phone: e.target.value })
								}
								placeholder="+1 (555) 000-0000"
							/>
						</div>

						<div>
							<label
								htmlFor="contact-address"
								className="mb-2 block font-medium text-sm"
							>
								Address
							</label>
							<Input
								id="contact-address"
								value={contactInfo.address}
								onChange={(e) =>
									setContactInfo({ ...contactInfo, address: e.target.value })
								}
								placeholder="123 Main St, City, State 12345"
							/>
						</div>

						<div className="flex justify-end">
							<Button type="submit" disabled={updateTenantMutation.isPending}>
								<Save className="mr-2 h-4 w-4" />
								{updateTenantMutation.isPending
									? "Saving..."
									: "Save Contact Info"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Statistics</CardTitle>
					<CardDescription>Overview of your tenant activity</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<div className="space-y-1">
							<p className="text-muted-foreground text-sm">Users</p>
							<p className="font-bold text-2xl">
								{currentTenant._count?.tenantUsers || 0}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-muted-foreground text-sm">Clients</p>
							<p className="font-bold text-2xl">
								{currentTenant._count?.clients || 0}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-muted-foreground text-sm">Documents</p>
							<p className="font-bold text-2xl">
								{currentTenant._count?.documents || 0}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-muted-foreground text-sm">Filings</p>
							<p className="font-bold text-2xl">
								{currentTenant._count?.filings || 0}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Tenant Details</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Tenant ID:</span>
							<span className="font-medium">{currentTenant.id}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Created:</span>
							<span className="font-medium">
								{new Date(currentTenant.createdAt).toLocaleDateString()}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Last Updated:</span>
							<span className="font-medium">
								{new Date(currentTenant.updatedAt).toLocaleDateString()}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
