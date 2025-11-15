"use client";

import { Search, UserMinus, UserPlus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const USER_SKELETON_ITEMS = Array.from(
	{ length: 6 },
	(_, index) => `user-skeleton-${index}`,
);

export function UsersList() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [showRemoveDialog, setShowRemoveDialog] = useState(false);
	const [selectedRoleFilter, setSelectedRoleFilter] = useState<
		number | undefined
	>(undefined);

	const utils = trpc.useUtils();

	const { data, isLoading, error } = trpc.users.list.useQuery({
		search,
		page,
		pageSize: 20,
		roleId: selectedRoleFilter,
	});

	const { data: roles } = trpc.roles.list.useQuery();

	const removeUserMutation = trpc.users.removeFromTenant.useMutation({
		onSuccess: () => {
			toast.success("User removed from tenant");
			utils.users.list.invalidate();
			setShowRemoveDialog(false);
			setSelectedUserId(null);
		},
		onError: (error) => {
			toast.error(`Failed to remove user: ${error.message}`);
		},
	});

	const updateRoleMutation = trpc.users.updateRole.useMutation({
		onSuccess: () => {
			toast.success("User role updated");
			utils.users.list.invalidate();
		},
		onError: (error) => {
			toast.error(`Failed to update role: ${error.message}`);
		},
	});

	const handleRemoveUser = () => {
		if (selectedUserId) {
			removeUserMutation.mutate({ userId: selectedUserId });
		}
	};

	const handleRoleChange = (userId: string, roleId: number) => {
		updateRoleMutation.mutate({ userId, roleId });
	};

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">Error loading users: {error.message}</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex gap-4">
				<div className="relative flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search users by name or email..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="pl-9"
					/>
				</div>
				<Select
					value={selectedRoleFilter?.toString() || ""}
					onChange={(e) => {
						setSelectedRoleFilter(
							e.target.value ? Number(e.target.value) : undefined,
						);
						setPage(1);
					}}
					className="w-48"
				>
					<option value="">All Roles</option>
					{roles?.map((role) => (
						<option key={role.id} value={role.id.toString()}>
							{role.name}
						</option>
					))}
				</Select>
			</div>

			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2">
					{USER_SKELETON_ITEMS.map((skeletonKey) => (
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
				<>
					<div className="grid gap-4 md:grid-cols-2">
						{data?.users.map((user) => (
							<Card key={user.id}>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div>
											<CardTitle className="text-lg">{user.name}</CardTitle>
											<CardDescription>{user.email}</CardDescription>
										</div>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => {
												setSelectedUserId(user.id);
												setShowRemoveDialog(true);
											}}
											title="Remove from tenant"
										>
											<UserMinus className="h-4 w-4" />
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										<div className="flex items-center gap-2">
											<label className="text-muted-foreground text-sm">
												Role:
											</label>
											<Select
												value={user.roleId.toString()}
												onChange={(e) =>
													handleRoleChange(user.id, Number(e.target.value))
												}
												className="flex-1"
											>
												{roles?.map((role) => (
													<option key={role.id} value={role.id.toString()}>
														{role.name}
													</option>
												))}
											</Select>
										</div>
										{user.phone && (
											<p className="text-muted-foreground text-sm">
												{user.phone}
											</p>
										)}
										<p className="text-muted-foreground text-xs">
											Joined:{" "}
											{new Date(user.createdAt).toLocaleDateString()}
										</p>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{data && data.users.length === 0 && (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12 text-center">
								<UserPlus className="mb-4 h-12 w-12 text-muted-foreground" />
								<p className="text-muted-foreground">
									No users found matching your criteria
								</p>
							</CardContent>
						</Card>
					)}

					{data && data.pagination.totalPages > 1 && (
						<div className="mt-6 flex justify-center gap-2">
							<Button
								variant="outline"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
							>
								Previous
							</Button>
							<span className="flex items-center px-4">
								Page {page} of {data.pagination.totalPages}
							</span>
							<Button
								variant="outline"
								onClick={() => setPage((p) => p + 1)}
								disabled={page >= data.pagination.totalPages}
							>
								Next
							</Button>
						</div>
					)}
				</>
			)}

			<Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Remove User from Tenant</DialogTitle>
						<DialogDescription>
							Are you sure you want to remove this user from the tenant? This
							action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowRemoveDialog(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleRemoveUser}
							disabled={removeUserMutation.isPending}
						>
							{removeUserMutation.isPending ? "Removing..." : "Remove User"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
