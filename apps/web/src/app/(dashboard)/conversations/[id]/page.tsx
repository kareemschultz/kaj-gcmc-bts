import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ConversationDetail } from "@/components/conversations/conversation-detail";
import { authClient } from "@/lib/auth-client";

export default async function ConversationDetailPage({
	params,
}: {
	params: { id: string };
}) {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	const conversationId = Number.parseInt(params.id, 10);

	if (Number.isNaN(conversationId)) {
		redirect("/conversations");
	}

	return (
		<div className="container mx-auto py-8">
			<ConversationDetail conversationId={conversationId} />
		</div>
	);
}
