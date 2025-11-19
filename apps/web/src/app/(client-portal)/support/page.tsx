import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClientSupport } from "@/components/client-portal/client-support";
import { authClient } from "@/lib/auth-client";

export default async function ClientSupportPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return <ClientSupport user={session.user} />;
}