import {
	Body,
	Button,
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

interface NewUserSignupEmailProps {
	adminName: string;
	userName: string;
	userEmail: string;
	organizationName: string;
	adminDashboardUrl: string;
}

export default function NewUserSignupEmail({
	adminName = "Admin",
	userName = "John Doe",
	userEmail = "john.doe@company.com",
	organizationName = "Your Organization",
	adminDashboardUrl = "https://app.gcmc-kaj.com/admin/users",
}: NewUserSignupEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>
				New user signup: {userName} joined your compliance platform
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<Heading style={h1}>🎉 New User Signup</Heading>

					<Text style={text}>Hi {adminName},</Text>

					<Text style={text}>
						A new user has signed up for your GCMC-KAJ compliance platform and
						is awaiting role assignment.
					</Text>

					<Section style={userInfoSection}>
						<Heading style={h2}>User Details</Heading>
						<Text style={userInfo}>
							<strong>Name:</strong> {userName}
						</Text>
						<Text style={userInfo}>
							<strong>Email:</strong> {userEmail}
						</Text>
						<Text style={userInfo}>
							<strong>Organization:</strong> {organizationName}
						</Text>
						<Text style={userInfo}>
							<strong>Current Role:</strong> Viewer (Safe Default)
						</Text>
					</Section>

					<Section style={actionSection}>
						<Heading style={h2}>Action Required</Heading>
						<Text style={text}>
							The user has been automatically assigned the "Viewer" role for
							security. Please review and assign the appropriate role based on
							their responsibilities:
						</Text>

						<ul style={roleList}>
							<li>
								<strong>FirmAdmin:</strong> Full platform access and user
								management
							</li>
							<li>
								<strong>ComplianceManager:</strong> Oversight of compliance
								operations
							</li>
							<li>
								<strong>ComplianceOfficer:</strong> Daily compliance tasks and
								filings
							</li>
							<li>
								<strong>DocumentOfficer:</strong> Document management
							</li>
							<li>
								<strong>FilingClerk:</strong> Filing preparation and submission
							</li>
							<li>
								<strong>Viewer:</strong> Read-only access (current)
							</li>
						</ul>

						<Button style={button} href={adminDashboardUrl}>
							Manage User Roles
						</Button>
					</Section>

					<Hr style={hr} />

					<Section style={securitySection}>
						<Heading style={h3}>🔐 Security Best Practices</Heading>
						<Text style={securityText}>
							• Users start with minimal "Viewer" permissions
							<br />• Admin approval required for elevated roles
							<br />• All role changes are logged for audit
							<br />• Regular permission reviews recommended
						</Text>
					</Section>

					<Hr style={hr} />

					<Text style={footer}>
						This email was sent from your GCMC-KAJ Compliance Platform.
						<br />
						<Link href={adminDashboardUrl} style={link}>
							Admin Dashboard
						</Link>{" "}
						•
						<Link href="mailto:support@gcmc-kaj.com" style={link}>
							Support
						</Link>
					</Text>
				</Container>
			</Body>
		</Html>
	);
}

const main = {
	backgroundColor: "#ffffff",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
	margin: "0 auto",
	padding: "20px 0 48px",
	maxWidth: "600px",
};

const h1 = {
	color: "#1f2937",
	fontSize: "28px",
	fontWeight: "bold",
	margin: "40px 0",
	padding: "0",
	textAlign: "center" as const,
};

const h2 = {
	color: "#374151",
	fontSize: "20px",
	fontWeight: "600",
	margin: "32px 0 16px",
};

const h3 = {
	color: "#374151",
	fontSize: "16px",
	fontWeight: "600",
	margin: "24px 0 12px",
};

const text = {
	color: "#374151",
	fontSize: "16px",
	lineHeight: "26px",
	margin: "16px 0",
};

const userInfoSection = {
	backgroundColor: "#f8fafc",
	border: "1px solid #e2e8f0",
	borderRadius: "8px",
	padding: "24px",
	margin: "24px 0",
};

const userInfo = {
	color: "#374151",
	fontSize: "14px",
	lineHeight: "20px",
	margin: "8px 0",
};

const actionSection = {
	backgroundColor: "#fef3cd",
	border: "1px solid #fbbf24",
	borderRadius: "8px",
	padding: "24px",
	margin: "24px 0",
};

const roleList = {
	color: "#374151",
	fontSize: "14px",
	lineHeight: "24px",
	margin: "16px 0",
	paddingLeft: "20px",
};

const button = {
	backgroundColor: "#3b82f6",
	borderRadius: "6px",
	color: "#ffffff",
	display: "inline-block",
	fontSize: "16px",
	fontWeight: "600",
	lineHeight: "50px",
	padding: "0 24px",
	textAlign: "center" as const,
	textDecoration: "none",
	margin: "16px 0",
};

const securitySection = {
	backgroundColor: "#ecfdf5",
	border: "1px solid #10b981",
	borderRadius: "8px",
	padding: "20px",
	margin: "24px 0",
};

const securityText = {
	color: "#065f46",
	fontSize: "14px",
	lineHeight: "22px",
	margin: "8px 0",
};

const hr = {
	borderColor: "#e2e8f0",
	margin: "32px 0",
};

const footer = {
	color: "#6b7280",
	fontSize: "12px",
	lineHeight: "18px",
	margin: "32px 0 0",
	textAlign: "center" as const,
};

const link = {
	color: "#3b82f6",
	textDecoration: "underline",
};
