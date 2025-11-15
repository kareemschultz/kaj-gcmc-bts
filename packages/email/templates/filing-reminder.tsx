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

interface FilingReminderEmailProps {
	recipientName: string;
	filingType: string;
	clientName: string;
	periodLabel: string;
	dueDate: Date;
	daysUntilDue: number;
	authority: string;
	status: string;
	portalUrl: string;
	tenantName: string;
}

export const FilingReminderEmail = ({
	recipientName = "Team Member",
	filingType = "VAT Return",
	clientName = "ABC Corporation",
	periodLabel = "Q4 2025",
	dueDate = new Date("2026-01-31"),
	daysUntilDue = 7,
	authority = "GRA",
	status = "draft",
	portalUrl = "https://portal.gcmc.com",
	tenantName = "GCMC Professional Services",
}: FilingReminderEmailProps) => {
	const isOverdue = daysUntilDue < 0;
	const urgencyColor = isOverdue
		? "#dc2626"
		: daysUntilDue <= 3
			? "#ea580c"
			: "#2563eb";
	const urgencyLabel = isOverdue
		? "OVERDUE"
		: daysUntilDue <= 3
			? "URGENT"
			: "Reminder";

	const statusLabels: Record<string, string> = {
		draft: "Draft",
		prepared: "Prepared",
		submitted: "Submitted",
		approved: "Approved",
		rejected: "Rejected",
	};

	return (
		<Html>
			<Head />
			<Preview>
				{urgencyLabel}: {filingType} for {clientName} - {periodLabel}
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section
						style={{
							...alertBanner,
							backgroundColor: urgencyColor,
						}}
					>
						<Text style={alertText}>
							{urgencyLabel}: Filing {isOverdue ? "Overdue" : "Due Soon"}
						</Text>
					</Section>

					<Heading style={h1}>Filing Deadline Reminder</Heading>

					<Text style={text}>Hello {recipientName},</Text>

					<Text style={text}>
						{isOverdue
							? "This filing is now overdue and requires immediate attention:"
							: `This is a reminder that a filing deadline is approaching in ${daysUntilDue} days:`}
					</Text>

					<Section style={filingCard}>
						<table style={{ width: "100%" }}>
							<tbody>
								<tr>
									<td style={labelCell}>Filing Type:</td>
									<td style={valueCell}>{filingType}</td>
								</tr>
								<tr>
									<td style={labelCell}>Client:</td>
									<td style={valueCell}>{clientName}</td>
								</tr>
								<tr>
									<td style={labelCell}>Period:</td>
									<td style={valueCell}>{periodLabel}</td>
								</tr>
								<tr>
									<td style={labelCell}>Authority:</td>
									<td style={valueCell}>{authority}</td>
								</tr>
								<tr>
									<td style={labelCell}>Due Date:</td>
									<td
										style={{
											...valueCell,
											fontWeight: "700",
											color: urgencyColor,
										}}
									>
										{dueDate.toLocaleDateString("en-US", {
											year: "numeric",
											month: "long",
											day: "numeric",
										})}
									</td>
								</tr>
								<tr>
									<td style={labelCell}>
										{isOverdue ? "Days Overdue:" : "Days Remaining:"}
									</td>
									<td
										style={{
											...valueCell,
											fontWeight: "700",
											color: urgencyColor,
										}}
									>
										{isOverdue ? Math.abs(daysUntilDue) : daysUntilDue} days
									</td>
								</tr>
								<tr>
									<td style={labelCell}>Current Status:</td>
									<td style={valueCell}>
										<span
											style={{
												...statusBadge,
												backgroundColor:
													status === "draft"
														? "#fef3c7"
														: status === "prepared"
															? "#dbeafe"
															: "#d1fae5",
												color:
													status === "draft"
														? "#92400e"
														: status === "prepared"
															? "#1e40af"
															: "#065f46",
											}}
										>
											{statusLabels[status] || status}
										</span>
									</td>
								</tr>
							</tbody>
						</table>
					</Section>

					{isOverdue && (
						<Section style={warningBox}>
							<Text style={warningText}>
								⚠️ This filing is overdue. Late submission may result in
								penalties and interest charges. Please complete and submit as
								soon as possible.
							</Text>
						</Section>
					)}

					<Section style={nextStepsBox}>
						<Text style={nextStepsTitle}>Next Steps:</Text>
						<ul style={list}>
							{status === "draft" && (
								<>
									<li style={listItem}>Review and complete the filing data</li>
									<li style={listItem}>
										Attach all required supporting documents
									</li>
									<li style={listItem}>
										Submit to {authority} before the deadline
									</li>
								</>
							)}
							{status === "prepared" && (
								<>
									<li style={listItem}>
										Final review of calculations and attachments
									</li>
									<li style={listItem}>Submit to {authority}</li>
									<li style={listItem}>
										Obtain and file submission confirmation
									</li>
								</>
							)}
						</ul>
					</Section>

					<Section style={buttonContainer}>
						<Link style={button} href={portalUrl}>
							View Filing
						</Link>
					</Section>

					<Hr style={hr} />

					<Text style={footer}>
						This is an automated reminder from {tenantName}. Please ensure all
						filings are submitted on time to avoid penalties.
					</Text>
				</Container>
			</Body>
		</Html>
	);
};

export default FilingReminderEmail;

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

const alertBanner = {
	padding: "16px 40px",
	textAlign: "center" as const,
};

const alertText = {
	color: "#ffffff",
	fontSize: "14px",
	fontWeight: "700",
	margin: "0",
	textTransform: "uppercase" as const,
	letterSpacing: "0.5px",
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

const filingCard = {
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
	padding: "4px 12px",
	borderRadius: "12px",
	fontSize: "13px",
	fontWeight: "600",
};

const warningBox = {
	backgroundColor: "#fee2e2",
	border: "2px solid #dc2626",
	borderRadius: "8px",
	margin: "24px 40px",
	padding: "16px 20px",
};

const warningText = {
	color: "#991b1b",
	fontSize: "15px",
	lineHeight: "24px",
	margin: "0",
	fontWeight: "600",
};

const nextStepsBox = {
	backgroundColor: "#f0f9ff",
	border: "1px solid #bfdbfe",
	borderRadius: "8px",
	margin: "24px 40px",
	padding: "20px",
};

const nextStepsTitle = {
	color: "#1e40af",
	fontSize: "16px",
	fontWeight: "700",
	margin: "0 0 12px 0",
};

const list = {
	margin: "0",
	paddingLeft: "20px",
};

const listItem = {
	color: "#1e3a8a",
	fontSize: "15px",
	lineHeight: "24px",
	marginBottom: "8px",
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
