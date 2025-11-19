import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ModernDashboardLayout } from "@/components/dashboard/modern-dashboard-layout";
import { authClient } from "@/lib/auth-client";

export default async function DashboardPage() {
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
		<ModernDashboardLayout
			userName={session.user.name || undefined}
			userEmail={session.user.email}
		/>
	);
}
