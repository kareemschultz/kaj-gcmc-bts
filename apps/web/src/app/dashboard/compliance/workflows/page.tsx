import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CrossAgencyWorkflowViewer } from "@/components/compliance/cross-agency-workflow-viewer";
import { authClient } from "@/lib/auth-client";

/**
 * Cross-Agency Workflow Management Page
 *
 * Comprehensive workflow visualization and management featuring:
 * - Dependency visualization with interactive workflow mapping
 * - Process orchestration with stage-by-stage tracking
 * - Bottleneck identification and optimization recommendations
 * - Real-time status updates across all agencies
 * - Automated escalation and notification systems
 */

export const metadata = {
	title: "Cross-Agency Workflows | GCMC-KAJ",
	description:
		"Visualize and manage complex workflows spanning multiple Guyana government agencies",
};

export default async function WorkflowsPage() {
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
			<CrossAgencyWorkflowViewer />
		</div>
	);
}
