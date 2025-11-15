"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/utils/trpc";

interface RoleFormProps {
	roleId?: number;
	onSuccess?: () => void;
}

// Define available modules and actions
const MODULES = [
	"users",
	"clients",
	"documents",
	"filings",
	"tasks",
	"settings",
	"audit",
];

const ACTIONS = ["view", "create", "edit", "delete"];

interface Permission {
	module: string;
	action: string;
	allowed: boolean;
}

export function RoleForm({ roleId, onSuccess }: RoleFormProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [permissions, setPermissions] = useState<Permission[]>([]);

	const utils = trpc.useUtils();

	// Fetch existing role data if editing
	const { data: existingRole } = trpc.roles.get.useQuery(
		{ id: roleId! },
		{ enabled: !!roleId },
	);

	// Initialize form with existing role data
	useEffect(() => {
		if (existingRole) {
			setName(existingRole.name);
			setDescription(existingRole.description || "");

			// Initialize permissions grid with existing permissions
			const permissionMap = new Map<string, boolean>();
			existingRole.permissions.forEach((perm) => {
				permissionMap.set(`${perm.module}:${perm.action}`, perm.allowed);
			});

			const initialPermissions: Permission[] = [];
			MODULES.forEach((module) => {
				ACTIONS.forEach((action) => {
					const key = `${module}:${action}`;
					initialPermissions.push({
						module,
						action,
						allowed: permissionMap.get(key) || false,
					});
				});
			});

			setPermissions(initialPermissions);
		} else {
			// Initialize empty permissions grid for new role
			const initialPermissions: Permission[] = [];
			MODULES.forEach((module) => {
				ACTIONS.forEach((action) => {
					initialPermissions.push({
						module,
						action,
						allowed: false,
					});
				});
			});
			setPermissions(initialPermissions);
		}
	}, [existingRole]);

	const createRoleMutation = trpc.roles.create.useMutation({
		onSuccess: () => {
			toast.success("Role created successfully");
			utils.roles.list.invalidate();
			onSuccess?.();
		},
		onError: (error) => {
			toast.error(`Failed to create role: ${error.message}`);
		},
	});

	const updateRoleMutation = trpc.roles.update.useMutation({
		onSuccess: () => {
			toast.success("Role updated successfully");
			utils.roles.list.invalidate();
			utils.roles.get.invalidate({ id: roleId });
			onSuccess?.();
		},
		onError: (error) => {
			toast.error(`Failed to update role: ${error.message}`);
		},
	});

	const addPermissionMutation = trpc.roles.addPermission.useMutation({
		onSuccess: () => {
			utils.roles.list.invalidate();
			utils.roles.get.invalidate({ id: roleId });
		},
		onError: (error) => {
			toast.error(`Failed to add permission: ${error.message}`);
		},
	});

	const removePermissionMutation = trpc.roles.removePermission.useMutation({
		onSuccess: () => {
			utils.roles.list.invalidate();
			utils.roles.get.invalidate({ id: roleId });
		},
		onError: (error) => {
			toast.error(`Failed to remove permission: ${error.message}`);
		},
	});

	const handleTogglePermission = async (
		module: string,
		action: string,
		checked: boolean,
	) => {
		// Update local state immediately
		setPermissions((prev) =>
			prev.map((perm) =>
				perm.module === module && perm.action === action
					? { ...perm, allowed: checked }
					: perm,
			),
		);

		// If editing existing role, sync with backend
		if (roleId && existingRole) {
			const existingPerm = existingRole.permissions.find(
				(p) => p.module === module && p.action === action,
			);

			if (checked && !existingPerm) {
				// Add new permission
				await addPermissionMutation.mutateAsync({
					roleId,
					permission: { module, action, allowed: true },
				});
			} else if (!checked && existingPerm) {
				// Remove permission
				await removePermissionMutation.mutateAsync({
					permissionId: existingPerm.id,
				});
			}
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.error("Role name is required");
			return;
		}

		try {
			if (roleId) {
				// Update existing role
				await updateRoleMutation.mutateAsync({
					id: roleId,
					data: { name, description },
				});
			} else {
				// Create new role
				const newRole = await createRoleMutation.mutateAsync({
					name,
					description,
				});

				// Add all enabled permissions
				const enabledPermissions = permissions.filter((p) => p.allowed);
				for (const perm of enabledPermissions) {
					await addPermissionMutation.mutateAsync({
						roleId: newRole.id,
						permission: {
							module: perm.module,
							action: perm.action,
							allowed: true,
						},
					});
				}

				toast.success("Role created with permissions");
				onSuccess?.();
			}
		} catch (error) {
			// Error handled by mutation callbacks
		}
	};

	const toggleAllForModule = (module: string, checked: boolean) => {
		ACTIONS.forEach((action) => {
			handleTogglePermission(module, action, checked);
		});
	};

	const toggleAllForAction = (action: string, checked: boolean) => {
		MODULES.forEach((module) => {
			handleTogglePermission(module, action, checked);
		});
	};

	const getPermission = (module: string, action: string): boolean => {
		return (
			permissions.find((p) => p.module === module && p.action === action)
				?.allowed || false
		);
	};

	const isModuleFullyChecked = (module: string): boolean => {
		return ACTIONS.every((action) => getPermission(module, action));
	};

	const isActionFullyChecked = (action: string): boolean => {
		return MODULES.every((module) => getPermission(module, action));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-4">
				<div>
					<label htmlFor="name" className="mb-2 block font-medium text-sm">
						Role Name
					</label>
					<Input
						id="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="e.g., Manager, Viewer"
						required
					/>
				</div>

				<div>
					<label
						htmlFor="description"
						className="mb-2 block font-medium text-sm"
					>
						Description
					</label>
					<Input
						id="description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Brief description of the role"
					/>
				</div>
			</div>

			<div>
				<h3 className="mb-3 font-semibold text-sm">Permissions</h3>
				<div className="overflow-x-auto rounded-lg border">
					<table className="w-full">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="p-3 text-left font-medium text-sm">Module</th>
								{ACTIONS.map((action) => (
									<th key={action} className="p-3 text-center font-medium text-sm">
										<div className="flex flex-col items-center gap-2">
											<span className="capitalize">{action}</span>
											<Checkbox
												checked={isActionFullyChecked(action)}
												onCheckedChange={(checked) =>
													toggleAllForAction(action, checked === true)
												}
												title={`Toggle all ${action}`}
											/>
										</div>
									</th>
								))}
								<th className="p-3 text-center font-medium text-sm">All</th>
							</tr>
						</thead>
						<tbody>
							{MODULES.map((module) => (
								<tr key={module} className="border-b hover:bg-muted/30">
									<td className="p-3 font-medium text-sm capitalize">
										{module}
									</td>
									{ACTIONS.map((action) => (
										<td key={`${module}-${action}`} className="p-3 text-center">
											<Checkbox
												checked={getPermission(module, action)}
												onCheckedChange={(checked) =>
													handleTogglePermission(
														module,
														action,
														checked === true,
													)
												}
											/>
										</td>
									))}
									<td className="p-3 text-center">
										<Checkbox
											checked={isModuleFullyChecked(module)}
											onCheckedChange={(checked) =>
												toggleAllForModule(module, checked === true)
											}
											title={`Toggle all for ${module}`}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<p className="mt-2 text-muted-foreground text-xs">
					Click column/row headers to toggle all permissions in that column/row
				</p>
			</div>

			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" onClick={onSuccess}>
					Cancel
				</Button>
				<Button
					type="submit"
					disabled={
						createRoleMutation.isPending || updateRoleMutation.isPending
					}
				>
					{createRoleMutation.isPending || updateRoleMutation.isPending
						? "Saving..."
						: roleId
							? "Update Role"
							: "Create Role"}
				</Button>
			</div>
		</form>
	);
}
