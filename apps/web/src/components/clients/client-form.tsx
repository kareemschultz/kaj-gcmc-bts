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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/utils/trpc";

interface ClientFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	clientId?: number | null;
	onSuccess?: () => void;
}

export function ClientForm({
	open,
	onOpenChange,
	clientId,
	onSuccess,
}: ClientFormProps) {
	const [formData, setFormData] = useState({
		name: "",
		type: "" as "individual" | "company" | "partnership" | "",
		email: "",
		phone: "",
		address: "",
		tin: "",
		nisNumber: "",
		sector: "",
		riskLevel: "" as "low" | "medium" | "high" | "",
		notes: "",
	});

	const utils = trpc.useContext();

	// Get client data if editing
	const { data: client } = trpc.clients.get.useQuery(
		{ id: clientId ?? 0 },
		{ enabled: !!clientId },
	);

	// Create mutation
	const createMutation = trpc.clients.create.useMutation({
		onSuccess: () => {
			toast.success("Client created successfully");
			utils.clients.list.invalidate();
			onSuccess?.();
		},
		onError: (error) => {
			toast.error(`Failed to create client: ${error.message}`);
		},
	});

	// Update mutation
	const updateMutation = trpc.clients.update.useMutation({
		onSuccess: () => {
			toast.success("Client updated successfully");
			utils.clients.list.invalidate();
			onSuccess?.();
		},
		onError: (error) => {
			toast.error(`Failed to update client: ${error.message}`);
		},
	});

	// Load client data when editing
	useEffect(() => {
		if (client) {
			setFormData({
				name: client.name,
				type: client.type as "individual" | "company" | "partnership",
				email: client.email || "",
				phone: client.phone || "",
				address: client.address || "",
				tin: client.tin || "",
				nisNumber: client.nisNumber || "",
				sector: client.sector || "",
				riskLevel: (client.riskLevel as "low" | "medium" | "high") || "",
				notes: client.notes || "",
			});
		} else {
			// Reset form when creating new
			setFormData({
				name: "",
				type: "",
				email: "",
				phone: "",
				address: "",
				tin: "",
				nisNumber: "",
				sector: "",
				riskLevel: "",
				notes: "",
			});
		}
	}, [client]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name || !formData.type) {
			toast.error("Please provide a name and client type");
			return;
		}

		const payload = {
			name: formData.name,
			type: formData.type,
			email: formData.email || undefined,
			phone: formData.phone || undefined,
			address: formData.address || undefined,
			tin: formData.tin || undefined,
			nisNumber: formData.nisNumber || undefined,
			sector: formData.sector || undefined,
			riskLevel: formData.riskLevel || undefined,
			notes: formData.notes || undefined,
		};

		if (clientId) {
			updateMutation.mutate({ id: clientId, ...payload });
		} else {
			createMutation.mutate(payload);
		}
	};

	const isSubmitting = createMutation.isPending || updateMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{clientId ? "Edit Client" : "Create New Client"}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid gap-6 md:grid-cols-2">
						{/* Name */}
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="name">
								Client Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="Enter client name"
								required
							/>
						</div>

						{/* Type */}
						<div className="space-y-2">
							<Label htmlFor="type">
								Client Type <span className="text-destructive">*</span>
							</Label>
							<Select
								value={formData.type}
								onValueChange={(value) =>
									setFormData({
										...formData,
										type: value as "individual" | "company" | "partnership",
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select client type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="individual">Individual</SelectItem>
									<SelectItem value="company">Company</SelectItem>
									<SelectItem value="partnership">Partnership</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Risk Level */}
						<div className="space-y-2">
							<Label htmlFor="riskLevel">Risk Level</Label>
							<Select
								value={formData.riskLevel}
								onValueChange={(value) =>
									setFormData({
										...formData,
										riskLevel: value as "low" | "medium" | "high",
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select risk level" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="low">Low</SelectItem>
									<SelectItem value="medium">Medium</SelectItem>
									<SelectItem value="high">High</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Email */}
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								placeholder="client@example.com"
							/>
						</div>

						{/* Phone */}
						<div className="space-y-2">
							<Label htmlFor="phone">Phone</Label>
							<Input
								id="phone"
								type="tel"
								value={formData.phone}
								onChange={(e) =>
									setFormData({ ...formData, phone: e.target.value })
								}
								placeholder="+592-XXX-XXXX"
							/>
						</div>

						{/* TIN */}
						<div className="space-y-2">
							<Label htmlFor="tin">TIN (Tax Identification Number)</Label>
							<Input
								id="tin"
								value={formData.tin}
								onChange={(e) =>
									setFormData({ ...formData, tin: e.target.value })
								}
								placeholder="Enter TIN"
							/>
						</div>

						{/* NIS Number */}
						<div className="space-y-2">
							<Label htmlFor="nisNumber">NIS Number</Label>
							<Input
								id="nisNumber"
								value={formData.nisNumber}
								onChange={(e) =>
									setFormData({ ...formData, nisNumber: e.target.value })
								}
								placeholder="Enter NIS number"
							/>
						</div>

						{/* Sector */}
						<div className="space-y-2">
							<Label htmlFor="sector">Sector/Industry</Label>
							<Input
								id="sector"
								value={formData.sector}
								onChange={(e) =>
									setFormData({ ...formData, sector: e.target.value })
								}
								placeholder="e.g., Technology, Healthcare, Finance"
							/>
						</div>

						{/* Address */}
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="address">Address</Label>
							<Textarea
								id="address"
								value={formData.address}
								onChange={(e) =>
									setFormData({ ...formData, address: e.target.value })
								}
								placeholder="Enter full address"
								rows={2}
							/>
						</div>

						{/* Notes */}
						<div className="space-y-2 md:col-span-2">
							<Label htmlFor="notes">Notes</Label>
							<Textarea
								id="notes"
								value={formData.notes}
								onChange={(e) =>
									setFormData({ ...formData, notes: e.target.value })
								}
								placeholder="Additional notes or comments"
								rows={3}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting
								? clientId
									? "Updating..."
									: "Creating..."
								: clientId
									? "Update Client"
									: "Create Client"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
