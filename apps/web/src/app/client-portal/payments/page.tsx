import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClientPayments } from "@/components/client-portal/client-payments";
import { authClient } from "@/lib/auth-client";

export default async function ClientPaymentsPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return <ClientPayments user={session.user} />;
}
