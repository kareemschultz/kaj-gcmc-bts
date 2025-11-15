import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TenantSettings } from "@/components/admin/tenant-settings";
import { authClient } from "@/lib/auth-client";

export default async function AdminTenantsPage() {
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
				<h1 className="font-bold text-3xl">Tenant Settings</h1>
				<p className="text-muted-foreground">
					Manage your tenant configuration and settings
				</p>
			</div>
			<TenantSettings />
		</div>
	);
}
