import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";

interface ServiceRequestUpdateEmailProps {
	recipientName: string;
	serviceName: string;
	clientName: string;
	previousStatus: string;
	newStatus: string;
	updatedBy: string;
	notes?: string;
	currentStep?: string;
	portalUrl: string;
	tenantName: string;
}

export const ServiceRequestUpdateEmail = ({
	recipientName = "Client",
	serviceName = "Business Registration",
	clientName = "ABC Corporation",
	previousStatus = "new",
	newStatus = "in_progress",
	updatedBy = "Team Member",
	notes,
	currentStep,
	portalUrl = "https://portal.gcmc.com",
	tenantName = "GCMC Professional Services",
}: ServiceRequestUpdateEmailProps) => {
	const statusConfig: Record<
		string,
		{ color: string; bg: string; icon: string }
	> = {
		new: { color: "#6b7280", bg: "#f3f4f6", icon: "📋" },
		in_progress: { color: "#2563eb", bg: "#dbeafe", icon: "⚙️" },
		awaiting_client: { color: "#ea580c", bg: "#ffedd5", icon: "⏳" },
		awaiting_authority: { color: "#7c3aed", bg: "#ede9fe", icon: "🏛️" },
		completed: { color: "#059669", bg: "#d1fae5", icon: "✅" },
		cancelled: { color: "#dc2626", bg: "#fee2e2", icon: "❌" },
	};

	const newStatusData = statusConfig[newStatus] || statusConfig.new;

	const statusLabels: Record<string, string> = {
		new: "New Request",
		in_progress: "In Progress",
		awaiting_client: "Awaiting Client Input",
		awaiting_authority: "Awaiting Authority Response",
		completed: "Completed",
		cancelled: "Cancelled",
	};

	return (
		<Html>
			<Head />
			<Preview>
				Service Request Update: {serviceName} - Now {statusLabels[newStatus]}
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section
						style={{
							...statusBanner,
							backgroundColor: newStatusData.bg,
							borderColor: newStatusData.color,
						}}
					>
						<Text style={{ ...statusText, color: newStatusData.color }}>
							{newStatusData.icon} {statusLabels[newStatus]}
						</Text>
					</Section>

					<Heading style={h1}>Service Request Updated</Heading>

					<Text style={text}>Hello {recipientName},</Text>

					<Text style={text}>
						Your service request has been updated. Here are the details:
					</Text>

					<Section style={serviceCard}>
						<table style={{ width: "100%" }}>
							<tbody>
								<tr>
									<td style={labelCell}>Service:</td>
									<td style={valueCell}>{serviceName}</td>
								</tr>
								<tr>
									<td style={labelCell}>Client:</td>
									<td style={valueCell}>{clientName}</td>
								</tr>
								<tr>
									<td style={labelCell}>Previous Status:</td>
									<td style={valueCell}>{statusLabels[previousStatus]}</td>
								</tr>
								<tr>
									<td style={labelCell}>New Status:</td>
									<td style={valueCell}>
										<span
											style={{
												...statusBadge,
												backgroundColor: newStatusData.bg,
												color: newStatusData.color,
											}}
										>
											{statusLabels[newStatus]}
										</span>
									</td>
								</tr>
								{currentStep && (
									<tr>
										<td style={labelCell}>Current Step:</td>
										<td style={valueCell}>{currentStep}</td>
									</tr>
								)}
								<tr>
									<td style={labelCell}>Updated By:</td>
									<td style={valueCell}>{updatedBy}</td>
								</tr>
							</tbody>
						</table>
					</Section>

					{notes && (
						<Section style={notesBox}>
							<Text style={notesTitle}>Update Notes:</Text>
							<Text style={notesText}>{notes}</Text>
						</Section>
					)}

					{newStatus === "awaiting_client" && (
						<Section style={actionBox}>
							<Text style={actionText}>
								⚠️ Action Required: We need your input to proceed with this
								service request. Please review and provide the requested
								information or documents.
							</Text>
						</Section>
					)}

					{newStatus === "completed" && (
						<Section style={successBox}>
							<Text style={successText}>
								🎉 Congratulations! Your service request has been completed
								successfully. All documents and deliverables are available in
								your portal.
							</Text>
						</Section>
					)}

					{newStatus === "awaiting_authority" && (
						<Section style={infoBox}>
							<Text style={infoText}>
								ℹ️ Your request has been submitted to the relevant authority. We
								will notify you once we receive a response.
							</Text>
						</Section>
					)}

					<Section style={buttonContainer}>
						<Link style={button} href={portalUrl}>
							View Service Request
						</Link>
					</Section>

					<Hr style={hr} />

					<Text style={footer}>
						You're receiving this notification from {tenantName}. You can track
						the progress of all your service requests in the client portal.
					</Text>
				</Container>
			</Body>
		</Html>
	);
};

export default ServiceRequestUpdateEmail;

// Styles
const main = {
	backgroundColor: "#f6f9fc",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	marginBottom: "64px",
	maxWidth: "600px",
};

const statusBanner = {
	padding: "16px 40px",
	textAlign: "center" as const,
	border: "2px solid",
	borderRadius: "8px 8px 0 0",
};

const statusText = {
	fontSize: "16px",
	fontWeight: "700",
	margin: "0",
	letterSpacing: "0.3px",
};

const h1 = {
	color: "#1a1a1a",
	fontSize: "28px",
	fontWeight: "700",
	margin: "32px 0 24px",
	padding: "0 40px",
	lineHeight: "1.3",
};

const text = {
	color: "#525252",
	fontSize: "16px",
	lineHeight: "26px",
	padding: "0 40px",
	margin: "16px 0",
};

const serviceCard = {
	backgroundColor: "#f8f9fa",
	border: "2px solid #e9ecef",
	borderRadius: "8px",
	margin: "24px 40px",
	padding: "24px",
};

const labelCell = {
	color: "#6b7280",
	fontSize: "14px",
	fontWeight: "600",
	paddingRight: "16px",
	paddingBottom: "12px",
	verticalAlign: "top" as const,
	width: "40%",
};

const valueCell = {
	color: "#1a1a1a",
	fontSize: "15px",
	paddingBottom: "12px",
	verticalAlign: "top" as const,
};

const statusBadge = {
	display: "inline-block",
	padding: "6px 14px",
	borderRadius: "14px",
	fontSize: "14px",
	fontWeight: "600",
};

const notesBox = {
	backgroundColor: "#f0f9ff",
	border: "1px solid #bae6fd",
	borderRadius: "8px",
	margin: "24px 40px",
	padding: "20px",
};

const notesTitle = {
	color: "#0c4a6e",
	fontSize: "15px",
	fontWeight: "700",
	margin: "0 0 8px 0",
};

const notesText = {
	color: "#0c4a6e",
	fontSize: "15px",
	lineHeight: "24px",
	margin: "0",
};

const actionBox = {
	backgroundColor: "#ffedd5",
	border: "2px solid #ea580c",
	borderRadius: "8px",
	margin: "24px 40px",
	padding: "16px 20px",
};

const actionText = {
	color: "#9a3412",
	fontSize: "15px",
	lineHeight: "24px",
	margin: "0",
	fontWeight: "600",
};

const successBox = {
	backgroundColor: "#d1fae5",
	border: "2px solid #059669",
	borderRadius: "8px",
	margin: "24px 40px",
	padding: "16px 20px",
};

const successText = {
	color: "#065f46",
	fontSize: "15px",
	lineHeight: "24px",
	margin: "0",
	fontWeight: "600",
};

const infoBox = {
	backgroundColor: "#e0e7ff",
	border: "1px solid #818cf8",
	borderRadius: "8px",
	margin: "24px 40px",
	padding: "16px 20px",
};

const infoText = {
	color: "#3730a3",
	fontSize: "15px",
	lineHeight: "24px",
	margin: "0",
	fontWeight: "600",
};

const buttonContainer = {
	padding: "24px 40px",
	textAlign: "center" as const,
};

const button = {
	backgroundColor: "#2563eb",
	borderRadius: "6px",
	color: "#fff",
	fontSize: "16px",
	fontWeight: "600",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "inline-block",
	padding: "12px 32px",
};

const hr = {
	borderColor: "#e6ebf1",
	margin: "20px 40px",
};

const footer = {
	color: "#8898aa",
	fontSize: "13px",
	lineHeight: "22px",
	padding: "0 40px",
	margin: "8px 0 32px",
};
