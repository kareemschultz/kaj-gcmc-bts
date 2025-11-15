import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { DocumentDetail } from "@/components/documents/document-detail";

interface DocumentDetailPageProps {
	params: {
		id: string;
	};
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
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
			<DocumentDetail documentId={parseInt(params.id)} />
		</div>
	);
}
