import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DCRAComplianceInterface } from "@/components/compliance/dcra-compliance-interface";
import { authClient } from "@/lib/auth-client";

/**
 * DCRA (Deeds and Commercial Registry Authority) Compliance Page
 *
 * Comprehensive DCRA registry management featuring:
 * - Business Registration Dashboard with renewal tracking
 * - Annual Return Calendar with submission deadlines
 * - Director Change Tracker with approval workflows
 * - Share Transfer Manager with documentation requirements
 * - Corporate Structure Visualizer with relationship mapping
 */

export const metadata = {
	title: "DCRA Registry Management | GCMC-KAJ",
	description:
		"Deeds and Commercial Registry Authority compliance for business registration, annual returns, and corporate changes",
};

export default async function DCRACompliancePage() {
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
			<DCRAComplianceInterface />
		</div>
	);
}
