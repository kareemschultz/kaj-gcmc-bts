import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClientProfile } from "@/components/client-portal/client-profile";
import { authClient } from "@/lib/auth-client";

export default async function ClientProfilePage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return <ClientProfile user={session.user} />;
}
