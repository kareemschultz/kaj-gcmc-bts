import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RolesList } from "@/components/admin/roles-list";
import { authClient } from "@/lib/auth-client";

export default async function AdminRolesPage() {
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
				<h1 className="font-bold text-3xl">Role Management</h1>
				<p className="text-muted-foreground">
					Create and manage roles with custom permissions
				</p>
			</div>
			<RolesList />
		</div>
	);
}
