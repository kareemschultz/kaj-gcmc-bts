import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DocumentDetail } from "@/components/documents/document-detail";
import { authClient } from "@/lib/auth-client";

interface DocumentDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function DocumentDetailPage({
	params,
}: DocumentDetailPageProps) {
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

	return (
		<div className="container mx-auto py-8">
			<DocumentDetail documentId={Number.parseInt(id, 10)} />
		</div>
	);
}
