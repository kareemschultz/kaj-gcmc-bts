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
import { formatDate } from "@/utils/date-utils";
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
					<p className="text-destructive">
						Error loading users: {error.message}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row">
				<div className="relative flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search users by name or email..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="h-11 border-2 pl-9 transition-colors focus:border-primary"
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
					className="h-11 w-full sm:w-48"
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
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{USER_SKELETON_ITEMS.map((skeletonKey) => (
						<Card key={skeletonKey} className="animate-pulse">
							<CardHeader className="pb-3">
								<div className="flex items-center space-x-3">
									<Skeleton className="h-10 w-10 rounded-full" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-3 w-32" />
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<Skeleton className="mb-3 h-8 w-full" />
								<Skeleton className="h-3 w-20" />
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<>
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{data?.users.map((user) => (
							<Card
								key={user.id}
								className="card-elevated-hover animate-slide-in transition-all duration-200 hover:shadow-lg"
							>
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between">
										<div className="flex items-center space-x-3">
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
												{user.name
													?.split(" ")
													.map((n) => n[0])
													.join("") || "U"}
											</div>
											<div>
												<CardTitle className="font-semibold text-lg tracking-tight">
													{user.name}
												</CardTitle>
												<CardDescription className="text-sm">
													{user.email}
												</CardDescription>
											</div>
										</div>
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8 text-muted-foreground transition-colors hover:text-destructive"
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
								<CardContent className="space-y-4">
									<div className="space-y-3">
										<div className="flex items-center gap-3">
											<label
												htmlFor={`user-role-${user.id}`}
												className="min-w-[40px] font-medium text-foreground text-sm"
											>
												Role:
											</label>
											<Select
												id={`user-role-${user.id}`}
												value={user.roleId.toString()}
												onChange={(e) =>
													handleRoleChange(user.id, Number(e.target.value))
												}
												className="h-9 flex-1"
											>
												{roles?.map((role) => (
													<option key={role.id} value={role.id.toString()}>
														{role.name}
													</option>
												))}
											</Select>
										</div>
										{user.phone && (
											<div className="flex items-center gap-2 text-muted-foreground text-sm">
												<span className="font-medium">Phone:</span>
												<span>{user.phone}</span>
											</div>
										)}
										<div className="border-t pt-2">
											<p className="flex items-center gap-2 text-muted-foreground text-xs">
												<span className="font-medium">Joined:</span>
												<span>{formatDate(user.createdAt)}</span>
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{data && data.users.length === 0 && (
						<Card className="col-span-full">
							<CardContent className="flex flex-col items-center justify-center py-16 text-center">
								<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
									<UserPlus className="h-8 w-8 text-muted-foreground" />
								</div>
								<h3 className="mb-2 font-semibold text-lg">No users found</h3>
								<p className="max-w-sm text-muted-foreground">
									No users match your current search criteria. Try adjusting
									your filters or search terms.
								</p>
							</CardContent>
						</Card>
					)}

					{data && data.pagination.totalPages > 1 && (
						<div className="mt-8 flex justify-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
								className="font-medium"
							>
								Previous
							</Button>
							<div className="flex items-center rounded-md bg-muted/50 px-4 py-2">
								<span className="font-medium text-sm">
									Page {page} of {data.pagination.totalPages}
								</span>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => p + 1)}
								disabled={page >= data.pagination.totalPages}
								className="font-medium"
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
