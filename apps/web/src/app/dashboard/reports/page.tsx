import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PDFReportInterface } from "@/components/dashboard/pdf-report-interface";
import { authClient } from "@/lib/auth-client";

/**
 * Reports Dashboard Page
 *
 * Comprehensive PDF report generation interface
 * Integrates with Phase 4 storage system for:
 * - Automated PDF generation
 * - Secure storage with retention policies
 * - Download management
 * - Compliance report templates
 */

export const metadata = {
	title: "Reports | GCMC-KAJ",
	description:
		"Generate and manage compliance reports, tax filings, and client documents",
};

export default async function ReportsPage() {
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
			<PDFReportInterface />
		</div>
	);
}
