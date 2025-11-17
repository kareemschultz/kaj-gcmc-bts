/**
 * Client File Report PDF Template
 *
 * Comprehensive client overview including:
 * - Client summary (name, type, contact info, businesses)
 * - Document summary (total count, by type, expiring soon)
 * - Filing summary (total count, by status, upcoming deadlines)
 * - Compliance score and status
 * - Service history
 */

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import React from "react";
import {
	colors,
	commonStyles,
	getScoreColor,
	getStatusStyle,
} from "../styles/common";

interface ClientFileReportProps {
	client: {
		name: string;
		type: string;
		email?: string | null;
		phone?: string | null;
		address?: string | null;
		tin?: string | null;
		nisNumber?: string | null;
		sector?: string | null;
		riskLevel?: string | null;
		createdAt: Date;
	};
	businesses: Array<{
		name: string;
		registrationNumber?: string | null;
		registrationType?: string | null;
		sector?: string | null;
	}>;
	documentsSummary: {
		total: number;
		byType: Array<{ type: string; count: number }>;
		expiringSoon: number;
		expired: number;
	};
	filingsSummary: {
		total: number;
		byStatus: Array<{ status: string; count: number }>;
		upcomingDeadlines: Array<{
			type: string;
			dueDate: Date;
			status: string;
		}>;
	};
	complianceScore?: {
		scoreValue: number;
		level: string;
		missingCount: number;
		expiringCount: number;
		overdueFilingsCount: number;
	} | null;
	serviceHistory: Array<{
		serviceName: string;
		status: string;
		createdAt: Date;
		updatedAt: Date;
	}>;
	tenantName: string;
	generatedAt: Date;
}

export const ClientFileReport: React.FC<ClientFileReportProps> = ({
	client,
	businesses,
	documentsSummary,
	filingsSummary,
	complianceScore,
	serviceHistory,
	tenantName,
	generatedAt,
}) => {
	return (
		<Document>
			<Page size="A4" style={commonStyles.page}>
				{/* Header */}
				<View style={commonStyles.pageHeader}>
					<Text style={commonStyles.companyName}>{tenantName}</Text>
					<Text style={commonStyles.reportTitle}>Client File Report</Text>
					<Text style={commonStyles.subtitle}>
						Generated on {format(generatedAt, "MMMM dd, yyyy HH:mm")}
					</Text>
				</View>

				{/* Client Summary */}
				<View style={commonStyles.section}>
					<Text style={commonStyles.sectionTitle}>Client Information</Text>
					<View style={commonStyles.infoRow}>
						<Text style={commonStyles.infoLabel}>Full Name:</Text>
						<Text style={commonStyles.infoValue}>{client.name}</Text>
					</View>
					<View style={commonStyles.infoRow}>
						<Text style={commonStyles.infoLabel}>Type:</Text>
						<Text style={commonStyles.infoValue}>{client.type}</Text>
					</View>
					{client.email && (
						<View style={commonStyles.infoRow}>
							<Text style={commonStyles.infoLabel}>Email:</Text>
							<Text style={commonStyles.infoValue}>{client.email}</Text>
						</View>
					)}
					{client.phone && (
						<View style={commonStyles.infoRow}>
							<Text style={commonStyles.infoLabel}>Phone:</Text>
							<Text style={commonStyles.infoValue}>{client.phone}</Text>
						</View>
					)}
					{client.address && (
						<View style={commonStyles.infoRow}>
							<Text style={commonStyles.infoLabel}>Address:</Text>
							<Text style={commonStyles.infoValue}>{client.address}</Text>
						</View>
					)}
					{client.tin && (
						<View style={commonStyles.infoRow}>
							<Text style={commonStyles.infoLabel}>TIN:</Text>
							<Text style={commonStyles.infoValue}>{client.tin}</Text>
						</View>
					)}
					{client.nisNumber && (
						<View style={commonStyles.infoRow}>
							<Text style={commonStyles.infoLabel}>NIS Number:</Text>
							<Text style={commonStyles.infoValue}>{client.nisNumber}</Text>
						</View>
					)}
					{client.sector && (
						<View style={commonStyles.infoRow}>
							<Text style={commonStyles.infoLabel}>Sector:</Text>
							<Text style={commonStyles.infoValue}>{client.sector}</Text>
						</View>
					)}
					{client.riskLevel && (
						<View style={commonStyles.infoRow}>
							<Text style={commonStyles.infoLabel}>Risk Level:</Text>
							<Text style={commonStyles.infoValue}>{client.riskLevel}</Text>
						</View>
					)}
					<View style={commonStyles.infoRow}>
						<Text style={commonStyles.infoLabel}>Client Since:</Text>
						<Text style={commonStyles.infoValue}>
							{format(client.createdAt, "MMMM dd, yyyy")}
						</Text>
					</View>
				</View>

				{/* Businesses */}
				{businesses.length > 0 && (
					<View style={commonStyles.section}>
						<Text style={commonStyles.sectionTitle}>Associated Businesses</Text>
						{businesses.map((business) => {
							const businessKey = `${business.name}-${business.registrationNumber ?? "no-reg"}`;

							return (
								<View key={businessKey} style={{ marginBottom: 8 }}>
									<Text
										style={{
											fontSize: 10,
											fontWeight: "bold",
											marginBottom: 3,
										}}
									>
										{business.name}
									</Text>
									{business.registrationNumber && (
										<Text style={{ fontSize: 9, color: colors.textLight }}>
											Reg #: {business.registrationNumber}
										</Text>
									)}
									{business.registrationType && (
										<Text style={{ fontSize: 9, color: colors.textLight }}>
											Type: {business.registrationType}
										</Text>
									)}
									{business.sector && (
										<Text style={{ fontSize: 9, color: colors.textLight }}>
											Sector: {business.sector}
										</Text>
									)}
								</View>
							);
						})}
					</View>
				)}

				{/* Compliance Score */}
				{complianceScore && (
					<View style={commonStyles.section}>
						<Text style={commonStyles.sectionTitle}>Compliance Status</Text>
						<View style={commonStyles.scoreContainer}>
							<Text
								style={[
									commonStyles.scoreValue,
									{ color: getScoreColor(complianceScore.scoreValue) },
								]}
							>
								{complianceScore.scoreValue}%
							</Text>
							<Text style={commonStyles.scoreLabel}>Compliance Score</Text>
							<Text
								style={{
									fontSize: 11,
									marginTop: 5,
									color: colors.textLight,
									textTransform: "uppercase",
								}}
							>
								Level: {complianceScore.level}
							</Text>
						</View>

						<View style={commonStyles.statsContainer}>
							<View style={commonStyles.statBox}>
								<Text style={commonStyles.statLabel}>Missing Documents</Text>
								<Text
									style={[
										commonStyles.statValue,
										{
											color:
												complianceScore.missingCount > 0
													? colors.danger
													: colors.success,
										},
									]}
								>
									{complianceScore.missingCount}
								</Text>
							</View>
							<View style={commonStyles.statBox}>
								<Text style={commonStyles.statLabel}>Expiring Soon</Text>
								<Text
									style={[
										commonStyles.statValue,
										{
											color:
												complianceScore.expiringCount > 0
													? colors.warning
													: colors.success,
										},
									]}
								>
									{complianceScore.expiringCount}
								</Text>
							</View>
							<View style={commonStyles.statBox}>
								<Text style={commonStyles.statLabel}>Overdue Filings</Text>
								<Text
									style={[
										commonStyles.statValue,
										{
											color:
												complianceScore.overdueFilingsCount > 0
													? colors.danger
													: colors.success,
										},
									]}
								>
									{complianceScore.overdueFilingsCount}
								</Text>
							</View>
						</View>
					</View>
				)}

				{/* Documents Summary */}
				<View style={commonStyles.section}>
					<Text style={commonStyles.sectionTitle}>Documents Summary</Text>
					<View style={commonStyles.statsContainer}>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>Total Documents</Text>
							<Text style={commonStyles.statValue}>
								{documentsSummary.total}
							</Text>
						</View>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>Expiring Soon</Text>
							<Text
								style={[
									commonStyles.statValue,
									{
										color:
											documentsSummary.expiringSoon > 0
												? colors.warning
												: colors.success,
									},
								]}
							>
								{documentsSummary.expiringSoon}
							</Text>
						</View>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>Expired</Text>
							<Text
								style={[
									commonStyles.statValue,
									{
										color:
											documentsSummary.expired > 0
												? colors.danger
												: colors.success,
									},
								]}
							>
								{documentsSummary.expired}
							</Text>
						</View>
					</View>

					{documentsSummary.byType.length > 0 && (
						<View style={commonStyles.table}>
							<View style={commonStyles.tableHeader}>
								<Text style={[commonStyles.tableCellHeader, { width: "70%" }]}>
									Document Type
								</Text>
								<Text
									style={[
										commonStyles.tableCellHeader,
										{ width: "30%", textAlign: "right" },
									]}
								>
									Count
								</Text>
							</View>
							{documentsSummary.byType.map((item, index) => (
								<View
									key={`${item.type}-${item.count}`}
									style={
										index === documentsSummary.byType.length - 1
											? commonStyles.tableRowLast
											: commonStyles.tableRow
									}
								>
									<Text style={[commonStyles.tableCell, { width: "70%" }]}>
										{item.type}
									</Text>
									<Text
										style={[
											commonStyles.tableCell,
											{ width: "30%", textAlign: "right" },
										]}
									>
										{item.count}
									</Text>
								</View>
							))}
						</View>
					)}
				</View>

				{/* Footer */}
				<View style={commonStyles.pageFooter}>
					<Text>Client File Report - {client.name}</Text>
					<Text
						render={({ pageNumber, totalPages }) =>
							`Page ${pageNumber} of ${totalPages}`
						}
						fixed
					/>
				</View>
			</Page>

			{/* Page 2: Filings and Service History */}
			<Page size="A4" style={commonStyles.page}>
				{/* Header */}
				<View style={commonStyles.pageHeader}>
					<Text style={commonStyles.companyName}>{tenantName}</Text>
					<Text style={commonStyles.reportTitle}>
						Client File Report (continued)
					</Text>
					<Text style={commonStyles.subtitle}>{client.name}</Text>
				</View>

				{/* Filings Summary */}
				<View style={commonStyles.section}>
					<Text style={commonStyles.sectionTitle}>Filings Summary</Text>
					<View style={commonStyles.statsContainer}>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>Total Filings</Text>
							<Text style={commonStyles.statValue}>{filingsSummary.total}</Text>
						</View>
					</View>

					{filingsSummary.byStatus.length > 0 && (
						<View style={commonStyles.table}>
							<View style={commonStyles.tableHeader}>
								<Text style={[commonStyles.tableCellHeader, { width: "70%" }]}>
									Status
								</Text>
								<Text
									style={[
										commonStyles.tableCellHeader,
										{ width: "30%", textAlign: "right" },
									]}
								>
									Count
								</Text>
							</View>
							{filingsSummary.byStatus.map((item, index) => (
								<View
									key={`${item.status}-${item.count}`}
									style={
										index === filingsSummary.byStatus.length - 1
											? commonStyles.tableRowLast
											: commonStyles.tableRow
									}
								>
									<Text style={[commonStyles.tableCell, { width: "70%" }]}>
										{item.status}
									</Text>
									<Text
										style={[
											commonStyles.tableCell,
											{ width: "30%", textAlign: "right" },
										]}
									>
										{item.count}
									</Text>
								</View>
							))}
						</View>
					)}

					{filingsSummary.upcomingDeadlines.length > 0 && (
						<>
							<Text
								style={{
									fontSize: 11,
									fontWeight: "bold",
									marginTop: 15,
									marginBottom: 10,
								}}
							>
								Upcoming Deadlines
							</Text>
							<View style={commonStyles.table}>
								<View style={commonStyles.tableHeader}>
									<Text
										style={[commonStyles.tableCellHeader, { width: "40%" }]}
									>
										Filing Type
									</Text>
									<Text
										style={[commonStyles.tableCellHeader, { width: "30%" }]}
									>
										Due Date
									</Text>
									<Text
										style={[commonStyles.tableCellHeader, { width: "30%" }]}
									>
										Status
									</Text>
								</View>
								{filingsSummary.upcomingDeadlines.map((filing, index) => {
									const dueKey = new Date(filing.dueDate).toISOString();
									const deadlineKey = `${filing.type}-${dueKey}`;

									return (
										<View
											key={deadlineKey}
											style={
												index === filingsSummary.upcomingDeadlines.length - 1
													? commonStyles.tableRowLast
													: commonStyles.tableRow
											}
										>
											<Text style={[commonStyles.tableCell, { width: "40%" }]}>
												{filing.type}
											</Text>
											<Text style={[commonStyles.tableCell, { width: "30%" }]}>
												{format(filing.dueDate, "MMM dd, yyyy")}
											</Text>
											<Text style={[commonStyles.tableCell, { width: "30%" }]}>
												<Text style={getStatusStyle(filing.status)}>
													{filing.status}
												</Text>
											</Text>
										</View>
									);
								})}
							</View>
						</>
					)}
				</View>

				{/* Service History */}
				{serviceHistory.length > 0 && (
					<View style={commonStyles.section}>
						<Text style={commonStyles.sectionTitle}>Service History</Text>
						<View style={commonStyles.table}>
							<View style={commonStyles.tableHeader}>
								<Text style={[commonStyles.tableCellHeader, { width: "40%" }]}>
									Service
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "20%" }]}>
									Status
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "20%" }]}>
									Started
								</Text>
								<Text style={[commonStyles.tableCellHeader, { width: "20%" }]}>
									Updated
								</Text>
							</View>
							{serviceHistory.map((service, index) => {
								const serviceKey = `${service.serviceName}-${service.createdAt.toISOString()}-${service.updatedAt.toISOString()}`;

								return (
									<View
										key={serviceKey}
										style={
											index === serviceHistory.length - 1
												? commonStyles.tableRowLast
												: commonStyles.tableRow
										}
									>
										<Text style={[commonStyles.tableCell, { width: "40%" }]}>
											{service.serviceName}
										</Text>
										<Text style={[commonStyles.tableCell, { width: "20%" }]}>
											<Text style={getStatusStyle(service.status)}>
												{service.status}
											</Text>
										</Text>
										<Text style={[commonStyles.tableCell, { width: "20%" }]}>
											{format(service.createdAt, "MMM dd, yy")}
										</Text>
										<Text style={[commonStyles.tableCell, { width: "20%" }]}>
											{format(service.updatedAt, "MMM dd, yy")}
										</Text>
									</View>
								);
							})}
						</View>
					</View>
				)}

				{/* Footer */}
				<View style={commonStyles.pageFooter}>
					<Text>Client File Report - {client.name}</Text>
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
