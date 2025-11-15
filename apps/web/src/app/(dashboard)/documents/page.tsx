import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DocumentsList } from "@/components/documents/documents-list";
import { authClient } from "@/lib/auth-client";

export default async function DocumentsPage() {
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
			<div className="mb-6 flex items-center justify-between">
				<h1 className="font-bold text-3xl">Documents</h1>
			</div>
			<DocumentsList />
		</div>
	);
}
