import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClientDashboard } from "@/components/clients/ClientDashboard";
import { authClient } from "@/lib/auth-client";

export default async function ClientDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	const clientId = Number.parseInt(id, 10);

	if (Number.isNaN(clientId)) {
		redirect("/clients");
	}

	return (
		<div className="container mx-auto py-8">
			<ClientDashboard clientId={clientId} />
		</div>
	);
}
