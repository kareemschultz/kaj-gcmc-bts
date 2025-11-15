"use client";

import { Edit, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { RoleForm } from "./role-form";

const ROLE_SKELETON_ITEMS = Array.from(
	{ length: 4 },
	(_, index) => `role-skeleton-${index}`,
);

export function RolesList() {
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
	const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);

	const utils = trpc.useUtils();

	const { data: roles, isLoading, error } = trpc.roles.list.useQuery();

	const deleteRoleMutation = trpc.roles.delete.useMutation({
		onSuccess: () => {
			toast.success("Role deleted successfully");
			utils.roles.list.invalidate();
			setDeletingRoleId(null);
		},
		onError: (error) => {
			toast.error(`Failed to delete role: ${error.message}`);
		},
	});

	const handleDeleteRole = () => {
		if (deletingRoleId) {
			deleteRoleMutation.mutate({ id: deletingRoleId });
		}
	};

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">
						Error loading roles: {error.message}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button onClick={() => setShowCreateDialog(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Create Role
				</Button>
			</div>

			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{ROLE_SKELETON_ITEMS.map((skeletonKey) => (
						<Card key={skeletonKey}>
							<CardHeader>
								<Skeleton className="h-6 w-32" />
								<Skeleton className="h-4 w-24" />
							</CardHeader>
							<CardContent>
								<Skeleton className="mb-2 h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{roles?.map((role) => (
						<Card key={role.id}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div>
										<CardTitle className="text-lg">{role.name}</CardTitle>
										<CardDescription>
											{role.description || "No description"}
										</CardDescription>
									</div>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => setEditingRoleId(role.id)}
											title="Edit role"
										>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => setDeletingRoleId(role.id)}
											title="Delete role"
										>
											<Trash className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">Permissions:</span>
										<span className="font-medium">
											{role.permissions?.length || 0}
										</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">Users:</span>
										<span className="font-medium">
											{role._count?.tenantUsers || 0}
										</span>
									</div>
									{role.permissions && role.permissions.length > 0 && (
										<div className="mt-3">
											<p className="mb-2 text-muted-foreground text-xs">
												Top Permissions:
											</p>
											<div className="flex flex-wrap gap-1">
												{role.permissions.slice(0, 3).map((perm) => (
													<span
														key={perm.id}
														className="rounded-md bg-secondary px-2 py-1 text-xs"
													>
														{perm.module}:{perm.action}
													</span>
												))}
												{role.permissions.length > 3 && (
													<span className="rounded-md bg-secondary px-2 py-1 text-xs">
														+{role.permissions.length - 3} more
													</span>
												)}
											</div>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Create Role Dialog */}
			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Create New Role</DialogTitle>
						<DialogDescription>
							Create a new role and assign permissions to it.
						</DialogDescription>
					</DialogHeader>
					<RoleForm onSuccess={() => setShowCreateDialog(false)} />
				</DialogContent>
			</Dialog>

			{/* Edit Role Dialog */}
			<Dialog
				open={editingRoleId !== null}
				onOpenChange={(open) => !open && setEditingRoleId(null)}
			>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Edit Role</DialogTitle>
						<DialogDescription>
							Update the role details and permissions.
						</DialogDescription>
					</DialogHeader>
					{editingRoleId && (
						<RoleForm
							roleId={editingRoleId}
							onSuccess={() => setEditingRoleId(null)}
						/>
					)}
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={deletingRoleId !== null}
				onOpenChange={(open) => !open && setDeletingRoleId(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Role</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this role? This action cannot be
							undone. Roles with assigned users cannot be deleted.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeletingRoleId(null)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteRole}
							disabled={deleteRoleMutation.isPending}
						>
							{deleteRoleMutation.isPending ? "Deleting..." : "Delete Role"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
