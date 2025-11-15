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

interface PasswordResetEmailProps {
	userName: string;
	resetLink: string;
	expiryMinutes?: number;
	tenantName: string;
	supportEmail: string;
}

export const PasswordResetEmail = ({
	userName = "User",
	resetLink = "https://portal.gcmc.com/reset-password?token=abc123",
	expiryMinutes = 60,
	tenantName = "GCMC Professional Services",
	supportEmail = "support@gcmc.com",
}: PasswordResetEmailProps) => (
	<Html>
		<Head />
		<Preview>Reset your password for {tenantName}</Preview>
		<Body style={main}>
			<Container style={container}>
				<Section style={securityBanner}>
					<Text style={securityText}>🔒 Security Notice</Text>
				</Section>

				<Heading style={h1}>Password Reset Request</Heading>

				<Text style={text}>Hello {userName},</Text>

				<Text style={text}>
					We received a request to reset the password for your {tenantName}{" "}
					account. If you made this request, click the button below to reset
					your password:
				</Text>

				<Section style={buttonContainer}>
					<Link style={button} href={resetLink}>
						Reset Password
					</Link>
				</Section>

				<Text style={expiryText}>
					This link will expire in {expiryMinutes} minutes for security reasons.
				</Text>

				<Hr style={hr} />

				<Section style={warningBox}>
					<Text style={warningTitle}>⚠️ Important Security Information</Text>
					<ul style={list}>
						<li style={listItem}>
							If you didn't request this password reset, please ignore this
							email. Your password will remain unchanged.
						</li>
						<li style={listItem}>
							Never share your password or password reset links with anyone.
						</li>
						<li style={listItem}>
							If you suspect unauthorized access to your account, contact our
							support team immediately.
						</li>
					</ul>
				</Section>

				<Hr style={hr} />

				<Text style={linkText}>
					If the button above doesn't work, you can copy and paste this link
					into your browser:
				</Text>
				<Text style={linkUrl}>{resetLink}</Text>

				<Hr style={hr} />

				<Text style={footer}>
					If you need assistance, please contact our support team at{" "}
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

export default PasswordResetEmail;

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

const securityBanner = {
	backgroundColor: "#3730a3",
	padding: "16px 40px",
	textAlign: "center" as const,
	borderRadius: "8px 8px 0 0",
};

const securityText = {
	color: "#ffffff",
	fontSize: "14px",
	fontWeight: "700",
	margin: "0",
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

const buttonContainer = {
	padding: "32px 40px",
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
	padding: "14px 40px",
};

const expiryText = {
	color: "#ea580c",
	fontSize: "14px",
	lineHeight: "24px",
	padding: "0 40px",
	margin: "8px 0",
	fontWeight: "600",
	textAlign: "center" as const,
};

const warningBox = {
	backgroundColor: "#fef3c7",
	border: "2px solid #fbbf24",
	borderRadius: "8px",
	margin: "24px 40px",
	padding: "20px",
};

const warningTitle = {
	color: "#92400e",
	fontSize: "15px",
	fontWeight: "700",
	margin: "0 0 12px 0",
};

const list = {
	margin: "8px 0",
	paddingLeft: "20px",
};

const listItem = {
	color: "#92400e",
	fontSize: "14px",
	lineHeight: "22px",
	marginBottom: "8px",
};

const linkText = {
	color: "#6b7280",
	fontSize: "13px",
	lineHeight: "22px",
	padding: "0 40px",
	margin: "16px 0 8px",
};

const linkUrl = {
	color: "#2563eb",
	fontSize: "12px",
	lineHeight: "20px",
	padding: "8px 40px",
	margin: "0",
	wordBreak: "break-all" as const,
	backgroundColor: "#f3f4f6",
	borderRadius: "4px",
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
