/**
 * Service History Report PDF Template
 *
 * Comprehensive service history with:
 * - List of all service requests
 * - Status, dates, assigned to
 * - Completed steps
 * - Total revenue (if applicable)
 */

import { Document, Page, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import React from "react";
import { colors, commonStyles, getStatusStyle } from "../styles/common";

interface ServiceHistoryReportProps {
	client: {
		name: string;
		type: string;
		email?: string | null;
	};
	serviceRequests: Array<{
		id: number;
		serviceName: string;
		status: string;
		priority?: string | null;
		createdAt: Date;
		updatedAt: Date;
		steps: Array<{
			title: string;
			status: string;
			order: number;
			dueDate?: Date | null;
		}>;
		businessName?: string | null;
	}>;
	summary: {
		totalRequests: number;
		completed: number;
		inProgress: number;
		cancelled: number;
		totalRevenue?: number;
	};
	tenantName: string;
	generatedAt: Date;
}

export const ServiceHistoryReport: React.FC<ServiceHistoryReportProps> = ({
	client,
	serviceRequests,
	summary,
	tenantName,
	generatedAt,
}) => {
	// Sort service requests by creation date (newest first)
	const sortedRequests = [...serviceRequests].sort(
		(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
	);

	// Group by status
	const activeRequests = sortedRequests.filter(
		(sr) =>
			sr.status === "in_progress" ||
			sr.status === "new" ||
			sr.status === "awaiting_client" ||
			sr.status === "awaiting_authority",
	);
	const completedRequests = sortedRequests.filter(
		(sr) => sr.status === "completed",
	);
	const cancelledRequests = sortedRequests.filter(
		(sr) => sr.status === "cancelled",
	);

	const renderServiceRequestsTable = (
		requests: typeof serviceRequests,
		title: string,
	) => {
		if (requests.length === 0) return null;

		return (
			<View style={commonStyles.section}>
				<Text style={commonStyles.sectionTitle}>
					{title} ({requests.length})
				</Text>

				{requests.map((request) => (
					<View
						key={request.id}
						style={{
							marginBottom: 15,
							padding: 10,
							backgroundColor: colors.background,
							borderRadius: 4,
							borderWidth: 1,
							borderColor: colors.border,
							borderStyle: "solid",
						}}
					>
						{/* Service Request Header */}
						<View
							style={{
								flexDirection: "row",
								justifyContent: "space-between",
								marginBottom: 8,
							}}
						>
							<View style={{ flex: 1 }}>
								<Text
									style={{ fontSize: 11, fontWeight: "bold", marginBottom: 3 }}
								>
									{request.serviceName}
								</Text>
								{request.businessName && (
									<Text style={{ fontSize: 9, color: colors.textLight }}>
										Business: {request.businessName}
									</Text>
								)}
							</View>
							<View>
								<Text style={getStatusStyle(request.status)}>
									{request.status}
								</Text>
							</View>
						</View>

						{/* Service Request Details */}
						<View style={{ flexDirection: "row", marginBottom: 8 }}>
							<View style={{ flex: 1 }}>
								<Text style={{ fontSize: 9, color: colors.textLight }}>
									Created: {format(request.createdAt, "MMM dd, yyyy")}
								</Text>
							</View>
							<View style={{ flex: 1 }}>
								<Text style={{ fontSize: 9, color: colors.textLight }}>
									Updated: {format(request.updatedAt, "MMM dd, yyyy")}
								</Text>
							</View>
							{request.priority && (
								<View style={{ flex: 1 }}>
									<Text style={{ fontSize: 9, color: colors.textLight }}>
										Priority: {request.priority}
									</Text>
								</View>
							)}
						</View>

						{/* Steps */}
						{request.steps.length > 0 && (
							<>
								<Text
									style={{
										fontSize: 9,
										fontWeight: "bold",
										marginTop: 5,
										marginBottom: 5,
										color: colors.text,
									}}
								>
									Steps (
									{request.steps.filter((s) => s.status === "done").length}/
									{request.steps.length} completed):
								</Text>
								{request.steps.map((step) => (
									<View
										key={`${request.id}-${step.order}-${step.title}`}
										style={{
											flexDirection: "row",
											marginBottom: 3,
											paddingLeft: 10,
										}}
									>
										<Text
											style={{
												fontSize: 8,
												width: 15,
												color:
													step.status === "done"
														? colors.success
														: step.status === "in_progress"
															? colors.warning
															: colors.textLight,
											}}
										>
											{step.status === "done"
												? "✓"
												: step.status === "in_progress"
													? "→"
													: "○"}
										</Text>
										<Text style={{ fontSize: 8, flex: 1 }}>{step.title}</Text>
										{step.dueDate && (
											<Text style={{ fontSize: 8, color: colors.textLight }}>
												Due: {format(step.dueDate, "MMM dd")}
											</Text>
										)}
									</View>
								))}
							</>
						)}
					</View>
				))}
			</View>
		);
	};

	return (
		<Document>
			<Page size="A4" style={commonStyles.page}>
				{/* Header */}
				<View style={commonStyles.pageHeader}>
					<Text style={commonStyles.companyName}>{tenantName}</Text>
					<Text style={commonStyles.reportTitle}>Service History Report</Text>
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
				</View>

				{/* Summary Statistics */}
				<View style={commonStyles.section}>
					<Text style={commonStyles.sectionTitle}>Summary</Text>
					<View style={commonStyles.statsContainer}>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>Total Requests</Text>
							<Text style={commonStyles.statValue}>
								{summary.totalRequests}
							</Text>
						</View>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>Completed</Text>
							<Text style={[commonStyles.statValue, { color: colors.success }]}>
								{summary.completed}
							</Text>
						</View>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>In Progress</Text>
							<Text style={[commonStyles.statValue, { color: colors.warning }]}>
								{summary.inProgress}
							</Text>
						</View>
						<View style={commonStyles.statBox}>
							<Text style={commonStyles.statLabel}>Cancelled</Text>
							<Text
								style={[commonStyles.statValue, { color: colors.secondary }]}
							>
								{summary.cancelled}
							</Text>
						</View>
					</View>

					{summary.totalRevenue !== undefined && summary.totalRevenue > 0 && (
						<View
							style={{
								marginTop: 15,
								padding: 12,
								backgroundColor: colors.background,
								borderRadius: 4,
								alignItems: "center",
							}}
						>
							<Text
								style={{
									fontSize: 10,
									color: colors.textLight,
									marginBottom: 5,
								}}
							>
								Total Revenue
							</Text>
							<Text
								style={{
									fontSize: 24,
									fontWeight: "bold",
									color: colors.primary,
								}}
							>
								${summary.totalRevenue.toFixed(2)}
							</Text>
						</View>
					)}
				</View>

				{/* Footer */}
				<View style={commonStyles.pageFooter}>
					<Text>Service History Report - {client.name}</Text>
					<Text
						render={({ pageNumber, totalPages }) =>
							`Page ${pageNumber} of ${totalPages}`
						}
						fixed
					/>
				</View>
			</Page>

			{/* Additional pages for service requests */}
			{serviceRequests.length > 0 && (
				<Page size="A4" style={commonStyles.page}>
					{/* Header */}
					<View style={commonStyles.pageHeader}>
						<Text style={commonStyles.companyName}>{tenantName}</Text>
						<Text style={commonStyles.reportTitle}>
							Service History Report (continued)
						</Text>
						<Text style={commonStyles.subtitle}>{client.name}</Text>
					</View>

					{/* Active Service Requests */}
					{renderServiceRequestsTable(
						activeRequests,
						"Active Service Requests",
					)}

					{/* Completed Service Requests */}
					{renderServiceRequestsTable(
						completedRequests,
						"Completed Service Requests",
					)}

					{/* Cancelled Service Requests */}
					{renderServiceRequestsTable(
						cancelledRequests,
						"Cancelled Service Requests",
					)}

					{serviceRequests.length === 0 && (
						<View style={commonStyles.section}>
							<Text
								style={{
									fontSize: 11,
									color: colors.textLight,
									textAlign: "center",
								}}
							>
								No service requests found for this client.
							</Text>
						</View>
					)}

					{/* Footer */}
					<View style={commonStyles.pageFooter}>
						<Text>Service History Report - {client.name}</Text>
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
