/**
 * Documents List Report PDF Template
 *
 * Detailed list of all client documents with:
 * - Client header
 * - Table of all documents (Type, Number, Issue Date, Expiry Date, Status)
 * - Grouping by document type
 * - Expiry warnings highlighted
 */

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { differenceInDays, format } from "date-fns";
import type React from "react";
import { colors, commonStyles, getStatusStyle } from "../styles/common";

interface DocumentsListReportProps {
	client: {
		name: string;
		type: string;
		email?: string | null;
	};
	documents: Array<{
		id: number;
		title: string;
		documentType: string;
		status: string;
		issueDate?: Date | null;
		expiryDate?: Date | null;
		authority?: string | null;
		documentNumber?: string | null;
	}>;
	tenantName: string;
	generatedAt: Date;
}

export const DocumentsListReport: React.FC<DocumentsListReportProps> = ({
	client,
	documents,
	tenantName,
	generatedAt,
}) => {
	// Group documents by type
	const groupedDocuments = documents.reduce(
		(acc, doc) => {
			const type = doc.documentType;
			if (!acc[type]) {
				acc[type] = [];
			}
			acc[type].push(doc);
			return acc;
		},
		{} as Record<string, typeof documents>,
	);

	const sortedTypes = Object.keys(groupedDocuments).sort();

	const getExpiryWarning = (expiryDate: Date | null | undefined) => {
		if (!expiryDate) return null;

		const daysUntilExpiry = differenceInDays(expiryDate, new Date());

		if (daysUntilExpiry < 0) {
			return { text: "EXPIRED", color: colors.danger };
		}
		if (daysUntilExpiry <= 30) {
			return {
				text: `Expires in ${daysUntilExpiry} days`,
				color: colors.warning,
			};
		}
		return null;
	};

	return (
		<Document>
			<Page size="A4" style={commonStyles.page} orientation="landscape">
				{/* Header */}
				<View style={commonStyles.pageHeader}>
					<Text style={commonStyles.companyName}>{tenantName}</Text>
					<Text style={commonStyles.reportTitle}>Documents List Report</Text>
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
					{client.email && (
						<View style={commonStyles.infoRow}>
							<Text style={commonStyles.infoLabel}>Email:</Text>
							<Text style={commonStyles.infoValue}>{client.email}</Text>
						</View>
					)}
					<View style={commonStyles.infoRow}>
						<Text style={commonStyles.infoLabel}>Total Documents:</Text>
						<Text style={commonStyles.infoValue}>{documents.length}</Text>
					</View>
				</View>

				{/* Documents Table by Type */}
				{sortedTypes.map((type, typeIndex) => (
					<View key={typeIndex} style={commonStyles.section}>
						<Text
							style={{
								fontSize: 12,
								fontWeight: "bold",
								marginBottom: 8,
								color: colors.primary,
							}}
						>
							{type} ({groupedDocuments[type].length})
						</Text>

						<View style={commonStyles.table}>
							<View style={commonStyles.tableHeader}>
								<Text style={[commonStyles.tableCellHeader, { width: "25%" }]}>
									Document Title
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "15%" }]}>
									Document #
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "12%" }]}>
									Issue Date
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "12%" }]}>
									Expiry Date
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "12%" }]}>
									Status
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "12%" }]}>
									Authority
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "12%" }]}>
									Warning
								</Text>
							</View>

							{groupedDocuments[type].map((doc, docIndex) => {
								const warning = getExpiryWarning(doc.expiryDate);
								const isLast = docIndex === groupedDocuments[type].length - 1;

								return (
									<View
										key={doc.id}
										style={
											isLast ? commonStyles.tableRowLast : commonStyles.tableRow
										}
									>
										<Text style={[commonStyles.tableCell, { width: "25%" }]}>
											{doc.title}
										</Text>
										<Text style={[commonStyles.tableCell, { width: "15%" }]}>
											{doc.documentNumber || "-"}
										</Text>
										<Text style={[commonStyles.tableCell, { width: "12%" }]}>
											{doc.issueDate
												? format(doc.issueDate, "MMM dd, yyyy")
												: "-"}
										</Text>
										<Text style={[commonStyles.tableCell, { width: "12%" }]}>
											{doc.expiryDate
												? format(doc.expiryDate, "MMM dd, yyyy")
												: "-"}
										</Text>
										<Text style={[commonStyles.tableCell, { width: "12%" }]}>
											<Text style={getStatusStyle(doc.status)}>
												{doc.status}
											</Text>
										</Text>
										<Text style={[commonStyles.tableCell, { width: "12%" }]}>
											{doc.authority || "-"}
										</Text>
										<Text
											style={[
												commonStyles.tableCell,
												{ width: "12%", color: warning?.color || colors.text },
											]}
										>
											{warning?.text || "-"}
										</Text>
									</View>
								);
							})}
						</View>
					</View>
				))}

				{documents.length === 0 && (
					<View style={commonStyles.section}>
						<Text
							style={{
								fontSize: 11,
								color: colors.textLight,
								textAlign: "center",
							}}
						>
							No documents found for this client.
						</Text>
					</View>
				)}

				{/* Footer */}
				<View style={commonStyles.pageFooter}>
					<Text>Documents List Report - {client.name}</Text>
					<Text
						render={({ pageNumber, totalPages }) =>
							`Page ${pageNumber} of ${totalPages}`
						}
						fixed
					/>
				</View>
			</Page>
		</Document>
	);
};
