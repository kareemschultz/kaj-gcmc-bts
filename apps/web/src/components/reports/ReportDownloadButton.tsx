"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Report types available
 */
type ReportType = "client_file" | "documents_list" | "filings_summary" | "compliance" | "service_history";

interface ReportDownloadButtonProps {
	clientId: number;
	reportType: ReportType;
	variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
	size?: "default" | "sm" | "lg" | "icon";
	label?: string;
	className?: string;
}

/**
 * Report labels for display
 */
const reportLabels: Record<ReportType, string> = {
	client_file: "Client File Report",
	documents_list: "Documents List",
	filings_summary: "Filings Summary",
	compliance: "Compliance Report",
	service_history: "Service History",
};

/**
 * Report Download Button Component
 *
 * Handles downloading PDF reports using tRPC mutation
 * Shows loading state while generating
 * Triggers browser download when ready
 * Handles errors gracefully
 */
export function ReportDownloadButton({
	clientId,
	reportType,
	variant = "outline",
	size = "default",
	label,
	className,
}: ReportDownloadButtonProps) {
	const [isDownloading, setIsDownloading] = useState(false);

	// Get the appropriate mutation based on report type
	const clientFileMutation = trpc.reports.generateClientFile.useMutation();
	const documentsListMutation = trpc.reports.generateDocumentsList.useMutation();
	const filingsSummaryMutation = trpc.reports.generateFilingsSummary.useMutation();
	const complianceMutation = trpc.reports.generateComplianceReport.useMutation();
	const serviceHistoryMutation = trpc.reports.generateServiceHistory.useMutation();

	const handleDownload = async () => {
		setIsDownloading(true);

		try {
			let result;

			// Call the appropriate mutation based on report type
			switch (reportType) {
				case "client_file":
					result = await clientFileMutation.mutateAsync({ clientId });
					break;
				case "documents_list":
					result = await documentsListMutation.mutateAsync({ clientId });
					break;
				case "filings_summary":
					result = await filingsSummaryMutation.mutateAsync({ clientId });
					break;
				case "compliance":
					result = await complianceMutation.mutateAsync({ clientId });
					break;
				case "service_history":
					result = await serviceHistoryMutation.mutateAsync({ clientId });
					break;
				default:
					throw new Error("Invalid report type");
			}

			if (result.success) {
				// Convert base64 to blob
				const binaryString = atob(result.data);
				const bytes = new Uint8Array(binaryString.length);
				for (let i = 0; i < binaryString.length; i++) {
					bytes[i] = binaryString.charCodeAt(i);
				}
				const blob = new Blob([bytes], { type: "application/pdf" });

				// Create download link and trigger download
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = result.filename;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);

				toast.success("Report downloaded successfully");
			} else {
				throw new Error("Failed to generate report");
			}
		} catch (error) {
			console.error("Error downloading report:", error);
			toast.error("Failed to download report", {
				description: error instanceof Error ? error.message : "An unknown error occurred",
			});
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<Button
			variant={variant}
			size={size}
			onClick={handleDownload}
			disabled={isDownloading}
			className={className}
		>
			{isDownloading ? (
				<>
					<Loader2 className="h-4 w-4 animate-spin" />
					Generating...
				</>
			) : (
				<>
					<Download className="h-4 w-4" />
					{label || reportLabels[reportType]}
				</>
			)}
		</Button>
	);
}
