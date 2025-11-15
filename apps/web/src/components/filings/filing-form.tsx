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

interface FilingFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	filingId?: number | null;
	onSuccess?: () => void;
}

export function FilingForm({
	open,
	onOpenChange,
	filingId,
	onSuccess,
}: FilingFormProps) {
	const [formData, setFormData] = useState({
		clientId: "",
		filingTypeId: "",
		periodLabel: "",
		periodStart: "",
		periodEnd: "",
		status: "draft" as
			| "draft"
			| "prepared"
			| "submitted"
			| "approved"
			| "rejected"
			| "overdue"
			| "archived",
		referenceNumber: "",
		taxAmount: "",
		penalties: "",
		interest: "",
		internalNotes: "",
	});

	const utils = trpc.useContext();

	// Get filing data if editing
	const { data: filing } = trpc.filings.get.useQuery(
		{ id: filingId! },
		{ enabled: !!filingId },
	);

	// Get clients for dropdown
	const { data: clientsData } = trpc.clients.list.useQuery({
		page: 1,
		pageSize: 100,
	});

	// Get filing types (you may need to create this endpoint)
	// For now, we'll use a placeholder

	// Create mutation
	const createMutation = trpc.filings.create.useMutation({
		onSuccess: () => {
			toast.success("Filing created successfully");
			utils.filings.list.invalidate();
			onSuccess?.();
		},
		onError: (error) => {
			toast.error(`Failed to create filing: ${error.message}`);
		},
	});

	// Update mutation
	const updateMutation = trpc.filings.update.useMutation({
		onSuccess: () => {
			toast.success("Filing updated successfully");
			utils.filings.list.invalidate();
			onSuccess?.();
		},
		onError: (error) => {
			toast.error(`Failed to update filing: ${error.message}`);
		},
	});

	// Load filing data when editing
	useEffect(() => {
		if (filing) {
			setFormData({
				clientId: filing.clientId.toString(),
				filingTypeId: filing.filingTypeId.toString(),
				periodLabel: filing.periodLabel || "",
				periodStart: filing.periodStart
					? new Date(filing.periodStart).toISOString().split("T")[0]
					: "",
				periodEnd: filing.periodEnd
					? new Date(filing.periodEnd).toISOString().split("T")[0]
					: "",
				status: filing.status,
				referenceNumber: filing.referenceNumber || "",
				taxAmount: filing.taxAmount?.toString() || "",
				penalties: filing.penalties?.toString() || "",
				interest: filing.interest?.toString() || "",
				internalNotes: filing.internalNotes || "",
			});
		} else {
			// Reset form when creating new
			setFormData({
				clientId: "",
				filingTypeId: "",
				periodLabel: "",
				periodStart: "",
				periodEnd: "",
				status: "draft",
				referenceNumber: "",
				taxAmount: "",
				penalties: "",
				interest: "",
				internalNotes: "",
			});
		}
	}, [filing]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.clientId || !formData.filingTypeId) {
			toast.error("Please select a client and filing type");
			return;
		}

		const payload = {
			clientId: Number.parseInt(formData.clientId, 10),
			filingTypeId: Number.parseInt(formData.filingTypeId, 10),
			periodLabel: formData.periodLabel || undefined,
			periodStart: formData.periodStart
				? new Date(formData.periodStart).toISOString()
				: undefined,
			periodEnd: formData.periodEnd
				? new Date(formData.periodEnd).toISOString()
				: undefined,
			status: formData.status,
			referenceNumber: formData.referenceNumber || undefined,
			taxAmount: formData.taxAmount
				? Number.parseFloat(formData.taxAmount)
				: undefined,
			penalties: formData.penalties
				? Number.parseFloat(formData.penalties)
				: undefined,
			interest: formData.interest
				? Number.parseFloat(formData.interest)
				: undefined,
			internalNotes: formData.internalNotes || undefined,
		};

		// Calculate total if amounts are provided
		const total =
			(payload.taxAmount || 0) +
			(payload.penalties || 0) +
			(payload.interest || 0);

		if (filingId) {
			updateMutation.mutate({
				id: filingId,
				data: { ...payload, total: total > 0 ? total : undefined },
			});
		} else {
			createMutation.mutate({
				...payload,
				total: total > 0 ? total : undefined,
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{filingId ? "Edit Filing" : "Create New Filing"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="clientId">Client *</Label>
								<Select
									id="clientId"
									value={formData.clientId}
									onChange={(e) =>
										setFormData({ ...formData, clientId: e.target.value })
									}
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
								<Label htmlFor="filingTypeId">Filing Type *</Label>
								<Input
									id="filingTypeId"
									type="number"
									value={formData.filingTypeId}
									onChange={(e) =>
										setFormData({ ...formData, filingTypeId: e.target.value })
									}
									placeholder="Filing type ID"
									required
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="periodLabel">Period Label</Label>
							<Input
								id="periodLabel"
								value={formData.periodLabel}
								onChange={(e) =>
									setFormData({ ...formData, periodLabel: e.target.value })
								}
								placeholder="e.g., Q1 2024, January 2024"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="periodStart">Period Start</Label>
								<Input
									id="periodStart"
									type="date"
									value={formData.periodStart}
									onChange={(e) =>
										setFormData({ ...formData, periodStart: e.target.value })
									}
								/>
							</div>

							<div>
								<Label htmlFor="periodEnd">Period End</Label>
								<Input
									id="periodEnd"
									type="date"
									value={formData.periodEnd}
									onChange={(e) =>
										setFormData({ ...formData, periodEnd: e.target.value })
									}
								/>
							</div>
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
									<option value="draft">Draft</option>
									<option value="prepared">Prepared</option>
									<option value="submitted">Submitted</option>
									<option value="approved">Approved</option>
									<option value="rejected">Rejected</option>
									<option value="overdue">Overdue</option>
									<option value="archived">Archived</option>
								</Select>
							</div>

							<div>
								<Label htmlFor="referenceNumber">Reference Number</Label>
								<Input
									id="referenceNumber"
									value={formData.referenceNumber}
									onChange={(e) =>
										setFormData({
											...formData,
											referenceNumber: e.target.value,
										})
									}
									placeholder="Filing reference"
								/>
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div>
								<Label htmlFor="taxAmount">Tax Amount</Label>
								<Input
									id="taxAmount"
									type="number"
									step="0.01"
									value={formData.taxAmount}
									onChange={(e) =>
										setFormData({ ...formData, taxAmount: e.target.value })
									}
									placeholder="0.00"
								/>
							</div>

							<div>
								<Label htmlFor="penalties">Penalties</Label>
								<Input
									id="penalties"
									type="number"
									step="0.01"
									value={formData.penalties}
									onChange={(e) =>
										setFormData({ ...formData, penalties: e.target.value })
									}
									placeholder="0.00"
								/>
							</div>

							<div>
								<Label htmlFor="interest">Interest</Label>
								<Input
									id="interest"
									type="number"
									step="0.01"
									value={formData.interest}
									onChange={(e) =>
										setFormData({ ...formData, interest: e.target.value })
									}
									placeholder="0.00"
								/>
							</div>
						</div>

						{(formData.taxAmount ||
							formData.penalties ||
							formData.interest) && (
							<div className="rounded-md bg-muted p-3">
								<p className="font-medium text-sm">
									Total: $
									{(
										(Number.parseFloat(formData.taxAmount) || 0) +
										(Number.parseFloat(formData.penalties) || 0) +
										(Number.parseFloat(formData.interest) || 0)
									).toFixed(2)}
								</p>
							</div>
						)}

						<div>
							<Label htmlFor="internalNotes">Internal Notes</Label>
							<textarea
								id="internalNotes"
								value={formData.internalNotes}
								onChange={(e) =>
									setFormData({ ...formData, internalNotes: e.target.value })
								}
								placeholder="Internal notes (not visible to client)"
								className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							/>
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
								: filingId
									? "Update Filing"
									: "Create Filing"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
