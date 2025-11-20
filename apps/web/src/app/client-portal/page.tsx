import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClientDashboard } from "@/components/client-portal/client-dashboard";
import { authClient } from "@/lib/auth-client";

export default async function ClientPortalPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return <ClientDashboard user={session.user} />;
}
