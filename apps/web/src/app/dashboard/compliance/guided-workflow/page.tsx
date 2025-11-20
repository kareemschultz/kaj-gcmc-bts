import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GuidedWorkflowSystem } from "@/components/compliance/guided-workflow-system";
import { authClient } from "@/lib/auth-client";

/**
 * Guided Workflow System Page
 *
 * Advanced guided workflow system featuring:
 * - Step-by-step guided workflows for complex compliance processes
 * - Contextual help and documentation
 * - Smart notification system with priority-based filtering
 * - Progress tracking with visual completion indicators
 * - Automated workflow orchestration
 * - Real-time collaboration features
 */

export const metadata = {
	title: "Guided Workflows | GCMC-KAJ",
	description:
		"Step-by-step guided workflows for complex compliance processes with smart notifications and progress tracking",
};

export default async function GuidedWorkflowPage() {
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
			<GuidedWorkflowSystem />
		</div>
	);
}
