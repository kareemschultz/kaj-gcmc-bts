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

interface WelcomeEmailProps {
	clientName: string;
	tenantName: string;
	portalUrl: string;
	supportEmail: string;
}

export const WelcomeEmail = ({
	clientName = "John Doe",
	tenantName = "GCMC Professional Services",
	portalUrl = "https://portal.gcmc.com",
	supportEmail = "support@gcmc.com",
}: WelcomeEmailProps) => (
	<Html>
		<Head />
		<Preview>Welcome to {tenantName} - Your Compliance Portal</Preview>
		<Body style={main}>
			<Container style={container}>
				<Heading style={h1}>Welcome to {tenantName}</Heading>
				<Text style={text}>Hello {clientName},</Text>
				<Text style={text}>
					Thank you for choosing {tenantName} for your compliance and filing
					needs. We're excited to have you on board!
				</Text>
				<Section style={highlightBox}>
					<Text style={highlightText}>
						Your account has been successfully created. You can now access your
						client portal to:
					</Text>
					<ul style={list}>
						<li style={listItem}>View and upload documents</li>
						<li style={listItem}>Track filing deadlines</li>
						<li style={listItem}>Monitor compliance status</li>
						<li style={listItem}>Communicate with your account manager</li>
						<li style={listItem}>Request additional services</li>
					</ul>
				</Section>
				<Section style={buttonContainer}>
					<Link style={button} href={portalUrl}>
						Access Client Portal
					</Link>
				</Section>
				<Hr style={hr} />
				<Text style={footer}>
					If you have any questions or need assistance, please don't hesitate to
					reach out to us at{" "}
					<Link style={link} href={`mailto:${supportEmail}`}>
						{supportEmail}
					</Link>
					.
				</Text>
				<Text style={footer}>
					Best regards,
					<br />
					The {tenantName} Team
				</Text>
			</Container>
		</Body>
	</Html>
);

export default WelcomeEmail;

// Styles
const main = {
	backgroundColor: "#f6f9fc",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "20px 0 48px",
	marginBottom: "64px",
	maxWidth: "600px",
};

const h1 = {
	color: "#1a1a1a",
	fontSize: "32px",
	fontWeight: "700",
	margin: "40px 0",
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

const highlightBox = {
	backgroundColor: "#f8f9fa",
	border: "1px solid #e9ecef",
	borderRadius: "8px",
	margin: "24px 40px",
	padding: "20px",
};

const highlightText = {
	color: "#1a1a1a",
	fontSize: "16px",
	lineHeight: "26px",
	margin: "0 0 12px 0",
	fontWeight: "600",
};

const list = {
	margin: "8px 0",
	paddingLeft: "20px",
};

const listItem = {
	color: "#525252",
	fontSize: "15px",
	lineHeight: "24px",
	marginBottom: "8px",
};

const buttonContainer = {
	padding: "27px 40px",
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
	fontSize: "14px",
	lineHeight: "24px",
	padding: "0 40px",
	margin: "8px 0",
};

const link = {
	color: "#2563eb",
	textDecoration: "underline",
};
