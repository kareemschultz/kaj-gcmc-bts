import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClientMessages } from "@/components/client-portal/client-messages";
import { authClient } from "@/lib/auth-client";

export default async function ClientMessagesPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return <ClientMessages user={session.user} />;
}
