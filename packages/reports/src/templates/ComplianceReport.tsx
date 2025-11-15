/**
 * Compliance Report PDF Template
 *
 * Comprehensive compliance status with:
 * - Client compliance score with visual indicator
 * - Missing documents list
 * - Expiring documents (next 30 days)
 * - Overdue filings
 * - Recommendations
 */

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import type React from "react";
import { colors, commonStyles, getScoreColor } from "../styles/common";

interface ComplianceReportProps {
	client: {
		name: string;
		type: string;
		sector?: string | null;
	};
	complianceScore: {
		scoreValue: number;
		level: string;
		missingCount: number;
		expiringCount: number;
		overdueFilingsCount: number;
		lastCalculatedAt: Date;
		breakdown?: Record<string, unknown>;
	} | null;
	missingDocuments: Array<{
		documentType: string;
		description?: string | null;
		required: boolean;
	}>;
	expiringDocuments: Array<{
		title: string;
		documentType: string;
		expiryDate: Date;
		daysUntilExpiry: number;
		status: string;
	}>;
	overdueFilings: Array<{
		filingType: string;
		periodLabel?: string | null;
		dueDate?: Date | null;
		daysOverdue: number;
	}>;
	recommendations: string[];
	tenantName: string;
	generatedAt: Date;
}

export const ComplianceReport: React.FC<ComplianceReportProps> = ({
	client,
	complianceScore,
	missingDocuments,
	expiringDocuments,
	overdueFilings,
	recommendations,
	tenantName,
	generatedAt,
}) => {
	const score = complianceScore?.scoreValue ?? 0;
	const scoreColor = getScoreColor(score);

	return (
		<Document>
			<Page size="A4" style={commonStyles.page}>
				{/* Header */}
				<View style={commonStyles.pageHeader}>
					<Text style={commonStyles.companyName}>{tenantName}</Text>
					<Text style={commonStyles.reportTitle}>Compliance Report</Text>
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
					{client.sector && (
						<View style={commonStyles.infoRow}>
							<Text style={commonStyles.infoLabel}>Sector:</Text>
							<Text style={commonStyles.infoValue}>{client.sector}</Text>
						</View>
					)}
				</View>

				{/* Compliance Score */}
				<View style={commonStyles.section}>
					<Text style={commonStyles.sectionTitle}>Compliance Score</Text>
					<View style={commonStyles.scoreContainer}>
						<Text style={[commonStyles.scoreValue, { color: scoreColor }]}>
							{score}%
						</Text>
						<Text style={commonStyles.scoreLabel}>
							Overall Compliance Score
						</Text>
						<Text
							style={{
								fontSize: 12,
								marginTop: 5,
								color: colors.textLight,
								textTransform: "uppercase",
								fontWeight: "bold",
							}}
						>
							Level: {complianceScore?.level || "N/A"}
						</Text>
						{complianceScore && (
							<Text
								style={{ fontSize: 9, marginTop: 5, color: colors.textLight }}
							>
								Last calculated:{" "}
								{format(complianceScore.lastCalculatedAt, "MMM dd, yyyy HH:mm")}
							</Text>
						)}
					</View>

					{/* Compliance Metrics */}
					<View style={commonStyles.statsContainer}>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>Missing Documents</Text>
							<Text
								style={[
									commonStyles.statValue,
									{
										color:
											(complianceScore?.missingCount || 0) > 0
												? colors.danger
												: colors.success,
									},
								]}
							>
								{complianceScore?.missingCount || 0}
							</Text>
						</View>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>Expiring Soon</Text>
							<Text
								style={[
									commonStyles.statValue,
									{
										color:
											(complianceScore?.expiringCount || 0) > 0
												? colors.warning
												: colors.success,
									},
								]}
							>
								{complianceScore?.expiringCount || 0}
							</Text>
						</View>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>Overdue Filings</Text>
							<Text
								style={[
									commonStyles.statValue,
									{
										color:
											(complianceScore?.overdueFilingsCount || 0) > 0
												? colors.danger
												: colors.success,
									},
								]}
							>
								{complianceScore?.overdueFilingsCount || 0}
							</Text>
						</View>
					</View>
				</View>

				{/* Compliance Status Summary */}
				{score >= 80 && (
					<View style={commonStyles.successBox}>
						<Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 3 }}>
							Excellent Compliance
						</Text>
						<Text style={{ fontSize: 9 }}>
							This client maintains strong compliance standards. Continue
							monitoring for upcoming requirements.
						</Text>
					</View>
				)}

				{score >= 60 && score < 80 && (
					<View style={commonStyles.warningBox}>
						<Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 3 }}>
							Moderate Compliance
						</Text>
						<Text style={{ fontSize: 9 }}>
							This client has some compliance gaps that require attention.
							Review the recommendations below.
						</Text>
					</View>
				)}

				{score < 60 && (
					<View style={commonStyles.dangerBox}>
						<Text style={{ fontSize: 10, fontWeight: "bold", marginBottom: 3 }}>
							Low Compliance - Immediate Action Required
						</Text>
						<Text style={{ fontSize: 9 }}>
							This client has significant compliance issues that require
							immediate attention to avoid penalties.
						</Text>
					</View>
				)}

				{/* Missing Documents */}
				{missingDocuments.length > 0 && (
					<View style={commonStyles.section}>
						<Text style={commonStyles.sectionTitle}>
							Missing Documents ({missingDocuments.length})
						</Text>
						<View style={commonStyles.table}>
							<View style={commonStyles.tableHeader}>
								<Text style={[commonStyles.tableCellHeader, { width: "40%" }]}>
									Document Type
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "15%" }]}>
									Required
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "45%" }]}>
									Description
								</Text>
							</View>
							{missingDocuments.map((doc, index) => (
								<View
									key={index}
									style={
										index === missingDocuments.length - 1
											? commonStyles.tableRowLast
											: commonStyles.tableRow
									}
								>
									<Text style={[commonStyles.tableCell, { width: "40%" }]}>
										{doc.documentType}
									</Text>
									<Text
										style={[
											commonStyles.tableCell,
											{
												width: "15%",
												color: doc.required ? colors.danger : colors.warning,
												fontWeight: "bold",
											},
										]}
									>
										{doc.required ? "Required" : "Optional"}
									</Text>
									<Text style={[commonStyles.tableCell, { width: "45%" }]}>
										{doc.description || "-"}
									</Text>
								</View>
							))}
						</View>
					</View>
				)}

				{/* Footer */}
				<View style={commonStyles.pageFooter}>
					<Text>Compliance Report - {client.name}</Text>
					<Text
						render={({ pageNumber, totalPages }) =>
							`Page ${pageNumber} of ${totalPages}`
						}
						fixed
					/>
				</View>
			</Page>

			{/* Page 2: Expiring Documents and Overdue Filings */}
			<Page size="A4" style={commonStyles.page}>
				{/* Header */}
				<View style={commonStyles.pageHeader}>
					<Text style={commonStyles.companyName}>{tenantName}</Text>
					<Text style={commonStyles.reportTitle}>
						Compliance Report (continued)
					</Text>
					<Text style={commonStyles.subtitle}>{client.name}</Text>
				</View>

				{/* Expiring Documents */}
				{expiringDocuments.length > 0 && (
					<View style={commonStyles.section}>
						<Text style={commonStyles.sectionTitle}>
							Expiring Documents - Next 30 Days ({expiringDocuments.length})
						</Text>
						<View style={commonStyles.table}>
							<View style={commonStyles.tableHeader}>
								<Text style={[commonStyles.tableCellHeader, { width: "30%" }]}>
									Document Title
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "25%" }]}>
									Type
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "20%" }]}>
									Expiry Date
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "15%" }]}>
									Days Left
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "10%" }]}>
									Status
								</Text>
							</View>
							{expiringDocuments.map((doc, index) => {
								const urgencyColor =
									doc.daysUntilExpiry <= 7
										? colors.danger
										: doc.daysUntilExpiry <= 14
											? colors.warning
											: colors.text;

								return (
									<View
										key={index}
										style={
											index === expiringDocuments.length - 1
												? commonStyles.tableRowLast
												: commonStyles.tableRow
										}
									>
										<Text style={[commonStyles.tableCell, { width: "30%" }]}>
											{doc.title}
										</Text>
										<Text style={[commonStyles.tableCell, { width: "25%" }]}>
											{doc.documentType}
										</Text>
										<Text style={[commonStyles.tableCell, { width: "20%" }]}>
											{format(doc.expiryDate, "MMM dd, yyyy")}
										</Text>
										<Text
											style={[
												commonStyles.tableCell,
												{
													width: "15%",
													color: urgencyColor,
													fontWeight: "bold",
												},
											]}
										>
											{doc.daysUntilExpiry} days
										</Text>
										<Text style={[commonStyles.tableCell, { width: "10%" }]}>
											{doc.status}
										</Text>
									</View>
								);
							})}
						</View>
					</View>
				)}

				{/* Overdue Filings */}
				{overdueFilings.length > 0 && (
					<View style={commonStyles.section}>
						<Text style={commonStyles.sectionTitle}>
							Overdue Filings ({overdueFilings.length})
						</Text>
						<View style={commonStyles.table}>
							<View style={commonStyles.tableHeader}>
								<Text style={[commonStyles.tableCellHeader, { width: "40%" }]}>
									Filing Type
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "25%" }]}>
									Period
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "20%" }]}>
									Due Date
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "15%" }]}>
									Days Overdue
								</Text>
							</View>
							{overdueFilings.map((filing, index) => (
								<View
									key={index}
									style={
										index === overdueFilings.length - 1
											? commonStyles.tableRowLast
											: commonStyles.tableRow
									}
								>
									<Text style={[commonStyles.tableCell, { width: "40%" }]}>
										{filing.filingType}
									</Text>
									<Text style={[commonStyles.tableCell, { width: "25%" }]}>
										{filing.periodLabel || "-"}
									</Text>
									<Text style={[commonStyles.tableCell, { width: "20%" }]}>
										{filing.dueDate
											? format(filing.dueDate, "MMM dd, yyyy")
											: "-"}
									</Text>
									<Text
										style={[
											commonStyles.tableCell,
											{
												width: "15%",
												color: colors.danger,
												fontWeight: "bold",
											},
										]}
									>
										{filing.daysOverdue} days
									</Text>
								</View>
							))}
						</View>
					</View>
				)}

				{/* Recommendations */}
				{recommendations.length > 0 && (
					<View style={commonStyles.section}>
						<Text style={commonStyles.sectionTitle}>Recommendations</Text>
						<View style={commonStyles.list}>
							{recommendations.map((recommendation, index) => (
								<View key={index} style={commonStyles.listItem}>
									<Text style={commonStyles.listBullet}>•</Text>
									<Text style={commonStyles.listContent}>{recommendation}</Text>
								</View>
							))}
						</View>
					</View>
				)}

				{/* No Issues */}
				{missingDocuments.length === 0 &&
					expiringDocuments.length === 0 &&
					overdueFilings.length === 0 && (
						<View style={commonStyles.successBox}>
							<Text
								style={{ fontSize: 11, fontWeight: "bold", marginBottom: 5 }}
							>
								No Compliance Issues Found
							</Text>
							<Text style={{ fontSize: 10 }}>
								This client is fully compliant with all document and filing
								requirements. Continue regular monitoring to maintain this
								status.
							</Text>
						</View>
					)}

				{/* Footer */}
				<View style={commonStyles.pageFooter}>
					<Text>Compliance Report - {client.name}</Text>
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
