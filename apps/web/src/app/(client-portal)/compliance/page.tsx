import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClientCompliance } from "@/components/client-portal/client-compliance";
import { authClient } from "@/lib/auth-client";

export default async function ClientCompliancePage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return <ClientCompliance user={session.user} />;
}