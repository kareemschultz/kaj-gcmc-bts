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

interface InvoiceLineItem {
	description: string;
	quantity: number;
	unitPrice: number;
	total: number;
}

interface InvoiceEmailProps {
	clientName: string;
	invoiceNumber: string;
	invoiceDate: Date;
	dueDate: Date;
	lineItems: InvoiceLineItem[];
	subtotal: number;
	tax?: number;
	total: number;
	paymentInstructions?: string;
	portalUrl: string;
	tenantName: string;
	tenantAddress?: string;
	tenantPhone?: string;
	tenantEmail?: string;
}

export const InvoiceEmail = ({
	clientName = "ABC Corporation",
	invoiceNumber = "INV-2025-001",
	invoiceDate = new Date(),
	dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
	lineItems = [
		{
			description: "Monthly Compliance Services",
			quantity: 1,
			unitPrice: 500.0,
			total: 500.0,
		},
		{
			description: "VAT Return Filing",
			quantity: 1,
			unitPrice: 150.0,
			total: 150.0,
		},
	],
	subtotal = 650.0,
	tax = 0,
	total = 650.0,
	paymentInstructions,
	portalUrl = "https://portal.gcmc.com",
	tenantName = "GCMC Professional Services",
	tenantAddress,
	tenantPhone,
	tenantEmail = "billing@gcmc.com",
}: InvoiceEmailProps) => (
	<Html>
		<Head />
		<Preview>
			Invoice {invoiceNumber} from {tenantName}
		</Preview>
		<Body style={main}>
			<Container style={container}>
				<Section style={header}>
					<Heading style={companyName}>{tenantName}</Heading>
					{tenantAddress && <Text style={companyInfo}>{tenantAddress}</Text>}
					{tenantPhone && <Text style={companyInfo}>{tenantPhone}</Text>}
					{tenantEmail && (
						<Text style={companyInfo}>
							<Link style={link} href={`mailto:${tenantEmail}`}>
								{tenantEmail}
							</Link>
						</Text>
					)}
				</Section>

				<Hr style={hr} />

				<Section style={invoiceHeader}>
					<table style={{ width: "100%" }}>
						<tbody>
							<tr>
								<td style={{ width: "50%", verticalAlign: "top" }}>
									<Text style={label}>Bill To:</Text>
									<Text style={clientNameText}>{clientName}</Text>
								</td>
								<td
									style={{
										width: "50%",
										verticalAlign: "top",
										textAlign: "right",
									}}
								>
									<Heading style={invoiceTitle}>INVOICE</Heading>
									<Text style={invoiceNumber}>#{invoiceNumber}</Text>
								</td>
							</tr>
						</tbody>
					</table>

					<table style={{ width: "100%", marginTop: "24px" }}>
						<tbody>
							<tr>
								<td style={{ width: "50%" }}>
									<Text style={dateLabel}>Invoice Date:</Text>
									<Text style={dateValue}>
										{invoiceDate.toLocaleDateString("en-US", {
											year: "numeric",
											month: "long",
											day: "numeric",
										})}
									</Text>
								</td>
								<td style={{ width: "50%", textAlign: "right" }}>
									<Text style={dateLabel}>Due Date:</Text>
									<Text style={{ ...dateValue, fontWeight: "700" }}>
										{dueDate.toLocaleDateString("en-US", {
											year: "numeric",
											month: "long",
											day: "numeric",
										})}
									</Text>
								</td>
							</tr>
						</tbody>
					</table>
				</Section>

				<Section style={itemsSection}>
					<table style={itemsTable}>
						<thead>
							<tr style={tableHeaderRow}>
								<th style={{ ...tableHeader, textAlign: "left", width: "50%" }}>
									Description
								</th>
								<th
									style={{ ...tableHeader, textAlign: "center", width: "15%" }}
								>
									Qty
								</th>
								<th
									style={{ ...tableHeader, textAlign: "right", width: "17.5%" }}
								>
									Unit Price
								</th>
								<th
									style={{ ...tableHeader, textAlign: "right", width: "17.5%" }}
								>
									Amount
								</th>
							</tr>
						</thead>
						<tbody>
							{lineItems.map((item, index) => (
								<tr key={index} style={tableRow}>
									<td style={{ ...tableCell, textAlign: "left" }}>
										{item.description}
									</td>
									<td style={{ ...tableCell, textAlign: "center" }}>
										{item.quantity}
									</td>
									<td style={{ ...tableCell, textAlign: "right" }}>
										${item.unitPrice.toFixed(2)}
									</td>
									<td style={{ ...tableCell, textAlign: "right" }}>
										${item.total.toFixed(2)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</Section>

				<Section style={totalsSection}>
					<table style={{ width: "100%" }}>
						<tbody>
							<tr>
								<td style={{ width: "70%" }} />
								<td style={totalLabel}>Subtotal:</td>
								<td style={totalValue}>${subtotal.toFixed(2)}</td>
							</tr>
							{tax !== undefined && tax > 0 && (
								<tr>
									<td style={{ width: "70%" }} />
									<td style={totalLabel}>Tax:</td>
									<td style={totalValue}>${tax.toFixed(2)}</td>
								</tr>
							)}
							<tr style={grandTotalRow}>
								<td style={{ width: "70%" }} />
								<td style={grandTotalLabel}>Total Due:</td>
								<td style={grandTotalValue}>${total.toFixed(2)}</td>
							</tr>
						</tbody>
					</table>
				</Section>

				{paymentInstructions && (
					<Section style={paymentBox}>
						<Text style={paymentTitle}>Payment Instructions</Text>
						<Text style={paymentText}>{paymentInstructions}</Text>
					</Section>
				)}

				<Section style={buttonContainer}>
					<Link style={button} href={portalUrl}>
						View Invoice in Portal
					</Link>
				</Section>

				<Hr style={hr} />

				<Text style={footer}>
					Thank you for your business! If you have any questions about this
					invoice, please contact us at{" "}
					<Link style={link} href={`mailto:${tenantEmail}`}>
						{tenantEmail}
					</Link>
					.
				</Text>
			</Container>
		</Body>
	</Html>
);

export default InvoiceEmail;

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
	maxWidth: "700px",
	padding: "0",
};

const header = {
	padding: "40px 40px 20px",
};

const companyName = {
	color: "#1a1a1a",
	fontSize: "28px",
	fontWeight: "700",
	margin: "0 0 8px 0",
};

const companyInfo = {
	color: "#6b7280",
	fontSize: "14px",
	lineHeight: "20px",
	margin: "2px 0",
};

const invoiceHeader = {
	padding: "20px 40px",
};

const label = {
	color: "#6b7280",
	fontSize: "13px",
	fontWeight: "600",
	textTransform: "uppercase" as const,
	letterSpacing: "0.5px",
	margin: "0 0 8px 0",
};

const clientNameText = {
	color: "#1a1a1a",
	fontSize: "18px",
	fontWeight: "600",
	margin: "0",
};

const invoiceTitle = {
	color: "#1a1a1a",
	fontSize: "32px",
	fontWeight: "700",
	margin: "0",
	textAlign: "right" as const,
};

const _invoiceNumber = {
	color: "#6b7280",
	fontSize: "16px",
	margin: "4px 0 0 0",
	textAlign: "right" as const,
};

const dateLabel = {
	color: "#6b7280",
	fontSize: "13px",
	fontWeight: "600",
	margin: "0 0 4px 0",
};

const dateValue = {
	color: "#1a1a1a",
	fontSize: "15px",
	margin: "0",
};

const itemsSection = {
	padding: "24px 40px",
};

const itemsTable = {
	width: "100%",
	borderCollapse: "collapse" as const,
};

const tableHeaderRow = {
	borderBottom: "2px solid #1a1a1a",
};

const tableHeader = {
	color: "#1a1a1a",
	fontSize: "13px",
	fontWeight: "700",
	textTransform: "uppercase" as const,
	letterSpacing: "0.5px",
	padding: "12px 8px",
};

const tableRow = {
	borderBottom: "1px solid #e5e7eb",
};

const tableCell = {
	color: "#525252",
	fontSize: "15px",
	padding: "14px 8px",
};

const totalsSection = {
	padding: "0 40px 24px",
};

const totalLabel = {
	color: "#6b7280",
	fontSize: "15px",
	fontWeight: "600",
	textAlign: "right" as const,
	padding: "8px 16px 8px 8px",
	width: "20%",
};

const totalValue = {
	color: "#1a1a1a",
	fontSize: "15px",
	textAlign: "right" as const,
	padding: "8px 8px",
	width: "10%",
};

const grandTotalRow = {
	borderTop: "2px solid #1a1a1a",
};

const grandTotalLabel = {
	color: "#1a1a1a",
	fontSize: "17px",
	fontWeight: "700",
	textAlign: "right" as const,
	padding: "16px 16px 16px 8px",
	width: "20%",
};

const grandTotalValue = {
	color: "#1a1a1a",
	fontSize: "17px",
	fontWeight: "700",
	textAlign: "right" as const,
	padding: "16px 8px",
	width: "10%",
};

const paymentBox = {
	backgroundColor: "#f0f9ff",
	border: "1px solid #bae6fd",
	borderRadius: "8px",
	margin: "24px 40px",
	padding: "20px",
};

const paymentTitle = {
	color: "#0c4a6e",
	fontSize: "15px",
	fontWeight: "700",
	margin: "0 0 8px 0",
};

const paymentText = {
	color: "#0c4a6e",
	fontSize: "14px",
	lineHeight: "22px",
	margin: "0",
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
	margin: "0 40px",
};

const footer = {
	color: "#8898aa",
	fontSize: "13px",
	lineHeight: "22px",
	padding: "20px 40px 40px",
	margin: "0",
};

const link = {
	color: "#2563eb",
	textDecoration: "underline",
};
