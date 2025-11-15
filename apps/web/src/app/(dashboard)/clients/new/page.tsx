import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ClientFormPage } from "@/components/clients/client-form-page";
import { authClient } from "@/lib/auth-client";

export default async function NewClientPage() {
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
			<ClientFormPage />
		</div>
	);
}
