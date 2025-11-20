import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UsersList } from "@/components/admin/users-list";
import { authClient } from "@/lib/auth-client";

export default async function AdminUsersPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="container mx-auto py-8">
			<div className="mb-6">
				<h1 className="font-bold text-3xl">User Management</h1>
				<p className="text-muted-foreground">
					Manage users and their roles within your tenant
				</p>
			</div>
			<UsersList />
		</div>
	);
}
