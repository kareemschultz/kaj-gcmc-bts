import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ConversationDetail } from "@/components/conversations/conversation-detail";
import { authClient } from "@/lib/auth-client";

export default async function ConversationDetailPage({
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

	const conversationId = Number.parseInt(id, 10);

	if (Number.isNaN(conversationId)) {
		redirect("/conversations");
	}

	return (
		<div className="container mx-auto py-8">
			<ConversationDetail conversationId={conversationId} />
		</div>
	);
}
