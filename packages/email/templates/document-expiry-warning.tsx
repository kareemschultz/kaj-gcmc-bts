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

interface DocumentExpiryWarningEmailProps {
	recipientName: string;
	documentTitle: string;
	documentType: string;
	clientName: string;
	expiryDate: Date;
	daysUntilExpiry: number;
	portalUrl: string;
	tenantName: string;
}

export const DocumentExpiryWarningEmail = ({
	recipientName = "Team Member",
	documentTitle = "Business License",
	documentType = "Registration",
	clientName = "ABC Corporation",
	expiryDate = new Date("2025-12-31"),
	daysUntilExpiry = 7,
	portalUrl = "https://portal.gcmc.com",
	tenantName = "GCMC Professional Services",
}: DocumentExpiryWarningEmailProps) => {
	const urgencyColor =
		daysUntilExpiry <= 3
			? "#dc2626"
			: daysUntilExpiry <= 7
				? "#ea580c"
				: "#f59e0b";
	const urgencyLabel =
		daysUntilExpiry <= 3
			? "URGENT"
			: daysUntilExpiry <= 7
				? "Important"
				: "Reminder";

	return (
		<Html>
			<Head />
			<Preview>
				{urgencyLabel}: {documentTitle} expires in {daysUntilExpiry} days
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
							{urgencyLabel}: Document Expiring Soon
						</Text>
					</Section>

					<Heading style={h1}>Document Expiry Warning</Heading>

					<Text style={text}>Hello {recipientName},</Text>

					<Text style={text}>
						This is a reminder that an important document is expiring soon:
					</Text>

					<Section style={documentCard}>
						<table style={{ width: "100%" }}>
							<tbody>
								<tr>
									<td style={labelCell}>Document:</td>
									<td style={valueCell}>{documentTitle}</td>
								</tr>
								<tr>
									<td style={labelCell}>Type:</td>
									<td style={valueCell}>{documentType}</td>
								</tr>
								<tr>
									<td style={labelCell}>Client:</td>
									<td style={valueCell}>{clientName}</td>
								</tr>
								<tr>
									<td style={labelCell}>Expiry Date:</td>
									<td
										style={{
											...valueCell,
											fontWeight: "700",
											color: urgencyColor,
										}}
									>
										{expiryDate.toLocaleDateString("en-US", {
											year: "numeric",
											month: "long",
											day: "numeric",
										})}
									</td>
								</tr>
								<tr>
									<td style={labelCell}>Days Remaining:</td>
									<td
										style={{
											...valueCell,
											fontWeight: "700",
											color: urgencyColor,
										}}
									>
										{daysUntilExpiry} days
									</td>
								</tr>
							</tbody>
						</table>
					</Section>

					<Section style={actionBox}>
						<Text style={actionText}>
							Please take immediate action to renew or replace this document to
							maintain compliance.
						</Text>
					</Section>

					<Section style={buttonContainer}>
						<Link style={button} href={portalUrl}>
							View Document
						</Link>
					</Section>

					<Hr style={hr} />

					<Text style={footer}>
						This is an automated reminder from {tenantName}. If this document
						has already been renewed, please upload the updated version to your
						portal.
					</Text>
				</Container>
			</Body>
		</Html>
	);
};

export default DocumentExpiryWarningEmail;

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

const documentCard = {
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

const actionBox = {
	backgroundColor: "#fef3c7",
	border: "1px solid #fbbf24",
	borderRadius: "8px",
	margin: "24px 40px",
	padding: "16px 20px",
};

const actionText = {
	color: "#92400e",
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
