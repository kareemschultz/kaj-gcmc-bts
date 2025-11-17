/**
 * Filings Summary Report PDF Template
 *
 * Detailed summary of client filings with:
 * - Client header
 * - Table of filings (Type, Period, Status, Filed Date, Notes)
 * - Separate sections for: Filed, Pending, Overdue
 * - Summary statistics
 */

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import React from "react";
import { colors, commonStyles, getStatusStyle } from "../styles/common";

interface FilingsSummaryReportProps {
	client: {
		name: string;
		type: string;
		tin?: string | null;
	};
	filings: Array<{
		id: number;
		filingType: string;
		periodLabel?: string | null;
		periodStart?: Date | null;
		periodEnd?: Date | null;
		status: string;
		submissionDate?: Date | null;
		approvalDate?: Date | null;
		referenceNumber?: string | null;
		taxAmount?: number | null;
		total?: number | null;
		internalNotes?: string | null;
	}>;
	tenantName: string;
	generatedAt: Date;
}

export const FilingsSummaryReport: React.FC<FilingsSummaryReportProps> = ({
	client,
	filings,
	tenantName,
	generatedAt,
}) => {
	// Group filings by status category
	const filedFilings = filings.filter(
		(f) => f.status === "approved" || f.status === "submitted",
	);
	const pendingFilings = filings.filter(
		(f) =>
			f.status === "draft" || f.status === "prepared" || f.status === "pending",
	);
	const overdueFilings = filings.filter((f) => f.status === "overdue");
	const otherFilings = filings.filter(
		(f) =>
			!filedFilings.includes(f) &&
			!pendingFilings.includes(f) &&
			!overdueFilings.includes(f),
	);

	const totalTaxAmount = filings.reduce((sum, f) => sum + (f.total || 0), 0);

	const renderFilingsTable = (filingsList: typeof filings, title: string) => {
		if (filingsList.length === 0) return null;

		return (
			<View style={commonStyles.section}>
				<Text style={commonStyles.sectionTitle}>
					{title} ({filingsList.length})
				</Text>

				<View style={commonStyles.table}>
					<View style={commonStyles.tableHeader}>
						<Text style={[commonStyles.tableCellHeader, { width: "20%" }]}>
							Filing Type
						</Text>
						<Text style={[commonStyles.tableCellHeader, { width: "15%" }]}>
							Period
						</Text>
						<Text style={[commonStyles.tableCellHeader, { width: "12%" }]}>
							Status
						</Text>
						<Text style={[commonStyles.tableCellHeader, { width: "12%" }]}>
							Submission Date
						</Text>
						<Text style={[commonStyles.tableCellHeader, { width: "12%" }]}>
							Reference #
						</Text>
						<Text
							style={[
								commonStyles.tableCellHeader,
								{ width: "14%", textAlign: "right" },
							]}
						>
							Amount
						</Text>
						<Text style={[commonStyles.tableCellHeader, { width: "15%" }]}>
							Notes
						</Text>
					</View>

					{filingsList.map((filing, index) => {
						const isLast = index === filingsList.length - 1;
						return (
							<View
								key={filing.id}
								style={
									isLast ? commonStyles.tableRowLast : commonStyles.tableRow
								}
							>
								<Text style={[commonStyles.tableCell, { width: "20%" }]}>
									{filing.filingType}
								</Text>
								<Text style={[commonStyles.tableCell, { width: "15%" }]}>
									{filing.periodLabel ||
										(filing.periodStart
											? format(filing.periodStart, "MMM yyyy")
											: "-")}
								</Text>
								<Text style={[commonStyles.tableCell, { width: "12%" }]}>
									<Text style={getStatusStyle(filing.status)}>
										{filing.status}
									</Text>
								</Text>
								<Text style={[commonStyles.tableCell, { width: "12%" }]}>
									{filing.submissionDate
										? format(filing.submissionDate, "MMM dd, yyyy")
										: "-"}
								</Text>
								<Text style={[commonStyles.tableCell, { width: "12%" }]}>
									{filing.referenceNumber || "-"}
								</Text>
								<Text
									style={[
										commonStyles.tableCell,
										{ width: "14%", textAlign: "right" },
									]}
								>
									{filing.total ? `$${filing.total.toFixed(2)}` : "-"}
								</Text>
								<Text
									style={[
										commonStyles.tableCell,
										{ width: "15%", fontSize: 8 },
									]}
								>
									{filing.internalNotes || "-"}
								</Text>
							</View>
						);
					})}
				</View>
			</View>
		);
	};

	return (
		<Document>
			<Page size="A4" style={commonStyles.page} orientation="landscape">
				{/* Header */}
				<View style={commonStyles.pageHeader}>
					<Text style={commonStyles.companyName}>{tenantName}</Text>
					<Text style={commonStyles.reportTitle}>Filings Summary Report</Text>
					<Text style={commonStyles.subtitle}>
						Client: {client.name} • Generated on{" "}
						{format(generatedAt, "MMMM dd, yyyy HH:mm")}
					</Text>
				</View>

				{/* Client Info */}
				<View style={{ marginBottom: 20 }}>
					<View style={commonStyles.infoRow}>
						<Text style={commonStyles.infoLabel}>Client Name:</Text>
						<Text style={commonStyles.infoValue}>{client.name}</Text>
					</View>
					<View style={commonStyles.infoRow}>
						<Text style={commonStyles.infoLabel}>Client Type:</Text>
						<Text style={commonStyles.infoValue}>{client.type}</Text>
					</View>
					{client.tin && (
						<View style={commonStyles.infoRow}>
							<Text style={commonStyles.infoLabel}>TIN:</Text>
							<Text style={commonStyles.infoValue}>{client.tin}</Text>
						</View>
					)}
				</View>

				{/* Summary Statistics */}
				<View style={commonStyles.section}>
					<Text style={commonStyles.sectionTitle}>Summary Statistics</Text>
					<View style={commonStyles.statsContainer}>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>Total Filings</Text>
							<Text style={commonStyles.statValue}>{filings.length}</Text>
						</View>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>Filed</Text>
							<Text style={[commonStyles.statValue, { color: colors.success }]}>
								{filedFilings.length}
							</Text>
						</View>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>Pending</Text>
							<Text style={[commonStyles.statValue, { color: colors.warning }]}>
								{pendingFilings.length}
							</Text>
						</View>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>Overdue</Text>
							<Text style={[commonStyles.statValue, { color: colors.danger }]}>
								{overdueFilings.length}
							</Text>
						</View>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>Total Tax Amount</Text>
							<Text style={[commonStyles.statValue, { fontSize: 14 }]}>
								${totalTaxAmount.toFixed(2)}
							</Text>
						</View>
					</View>
				</View>

				{/* Footer */}
				<View style={commonStyles.pageFooter}>
					<Text>Filings Summary Report - {client.name}</Text>
					<Text
						render={({ pageNumber, totalPages }) =>
							`Page ${pageNumber} of ${totalPages}`
						}
						fixed
					/>
				</View>
			</Page>

			{/* Additional pages for filing details */}
			{(overdueFilings.length > 0 ||
				pendingFilings.length > 0 ||
				filedFilings.length > 0) && (
				<Page size="A4" style={commonStyles.page} orientation="landscape">
					{/* Header */}
					<View style={commonStyles.pageHeader}>
						<Text style={commonStyles.companyName}>{tenantName}</Text>
						<Text style={commonStyles.reportTitle}>
							Filings Summary Report (continued)
						</Text>
						<Text style={commonStyles.subtitle}>{client.name}</Text>
					</View>

					{/* Overdue Filings */}
					{renderFilingsTable(overdueFilings, "Overdue Filings")}

					{/* Pending Filings */}
					{renderFilingsTable(pendingFilings, "Pending Filings")}

					{/* Filed Filings */}
					{renderFilingsTable(filedFilings, "Filed/Approved Filings")}

					{/* Other Filings */}
					{renderFilingsTable(otherFilings, "Other Filings")}

					{filings.length === 0 && (
						<View style={commonStyles.section}>
							<Text
								style={{
									fontSize: 11,
									color: colors.textLight,
									textAlign: "center",
								}}
							>
								No filings found for this client.
							</Text>
						</View>
					)}

					{/* Footer */}
					<View style={commonStyles.pageFooter}>
						<Text>Filings Summary Report - {client.name}</Text>
						<Text
							render={({ pageNumber, totalPages }) =>
								`Page ${pageNumber} of ${totalPages}`
							}
							fixed
						/>
					</View>
				</Page>
			)}
		</Document>
	);
};
