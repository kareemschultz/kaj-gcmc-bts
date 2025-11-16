import { Download, FileText } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReportDownloadButton } from "@/components/reports/ReportDownloadButton";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default async function ClientDetailPage({
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

	const clientId = Number.parseInt(id, 10);

	if (Number.isNaN(clientId)) {
		redirect("/clients");
	}

	return (
		<div className="container mx-auto py-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="font-bold text-3xl">Client Reports</h1>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{/* Client File Report */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Client File Report
						</CardTitle>
						<CardDescription>
							Comprehensive overview including client details, documents,
							filings, compliance score, and service history
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ReportDownloadButton
							clientId={clientId}
							reportType="client_file"
							variant="default"
							className="w-full"
						/>
					</CardContent>
				</Card>

				{/* Documents List Report */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Documents List
						</CardTitle>
						<CardDescription>
							Detailed list of all client documents with types, status, issue
							dates, and expiry dates
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ReportDownloadButton
							clientId={clientId}
							reportType="documents_list"
							variant="default"
							className="w-full"
						/>
					</CardContent>
				</Card>

				{/* Filings Summary Report */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Filings Summary
						</CardTitle>
						<CardDescription>
							Summary of all filings categorized by status, including filed,
							pending, and overdue filings
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ReportDownloadButton
							clientId={clientId}
							reportType="filings_summary"
							variant="default"
							className="w-full"
						/>
					</CardContent>
				</Card>

				{/* Compliance Report */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Compliance Report
						</CardTitle>
						<CardDescription>
							Compliance score, missing documents, expiring documents, overdue
							filings, and recommendations
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ReportDownloadButton
							clientId={clientId}
							reportType="compliance"
							variant="default"
							className="w-full"
						/>
					</CardContent>
				</Card>

				{/* Service History Report */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Service History
						</CardTitle>
						<CardDescription>
							Complete history of all service requests with status, steps, and
							completion details
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ReportDownloadButton
							clientId={clientId}
							reportType="service_history"
							variant="default"
							className="w-full"
						/>
					</CardContent>
				</Card>

				{/* Download All */}
				<Card className="border-primary">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Download className="h-5 w-5" />
							Download All Reports
						</CardTitle>
						<CardDescription>
							Download all available reports for this client (coming soon)
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-muted-foreground text-sm">
							Use the individual download buttons above to generate specific
							reports.
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
