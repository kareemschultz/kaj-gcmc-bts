import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClientDocuments } from "@/components/client-portal/client-documents";
import { authClient } from "@/lib/auth-client";

export default async function ClientDocumentsPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return <ClientDocuments user={session.user} />;
}
