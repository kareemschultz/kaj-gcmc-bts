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

interface TaskAssignmentEmailProps {
	assigneeName: string;
	taskTitle: string;
	taskDescription: string;
	clientName?: string;
	priority: string;
	dueDate?: Date;
	assignedBy: string;
	portalUrl: string;
	tenantName: string;
}

export const TaskAssignmentEmail = ({
	assigneeName = "Team Member",
	taskTitle = "Review client documents",
	taskDescription = "Please review and approve the uploaded business registration documents.",
	clientName,
	priority = "medium",
	dueDate,
	assignedBy = "System",
	portalUrl = "https://portal.gcmc.com",
	tenantName = "GCMC Professional Services",
}: TaskAssignmentEmailProps) => {
	const priorityConfig = {
		high: { color: "#dc2626", bg: "#fee2e2", label: "High Priority" },
		medium: { color: "#ea580c", bg: "#ffedd5", label: "Medium Priority" },
		low: { color: "#059669", bg: "#d1fae5", label: "Low Priority" },
	};

	const config =
		priorityConfig[priority as keyof typeof priorityConfig] ||
		priorityConfig.medium;

	return (
		<Html>
			<Head />
			<Preview>
				New Task Assigned: {taskTitle}
				{clientName ? ` for ${clientName}` : ""}
			</Preview>
			<Body style={main}>
				<Container style={container}>
					<Section
						style={{
							...priorityBanner,
							backgroundColor: config.bg,
							borderColor: config.color,
						}}
					>
						<Text style={{ ...priorityText, color: config.color }}>
							{config.label}
						</Text>
					</Section>

					<Heading style={h1}>New Task Assigned</Heading>

					<Text style={text}>Hello {assigneeName},</Text>

					<Text style={text}>
						You have been assigned a new task
						{clientName ? ` for ${clientName}` : ""}:
					</Text>

					<Section style={taskCard}>
						<Heading style={taskTitle}>{taskTitle}</Heading>
						<Text style={taskDesc}>{taskDescription}</Text>

						<Hr style={divider} />

						<table style={{ width: "100%" }}>
							<tbody>
								{clientName && (
									<tr>
										<td style={labelCell}>Client:</td>
										<td style={valueCell}>{clientName}</td>
									</tr>
								)}
								<tr>
									<td style={labelCell}>Priority:</td>
									<td style={valueCell}>
										<span
											style={{
												...priorityBadge,
												backgroundColor: config.bg,
												color: config.color,
											}}
										>
											{config.label}
										</span>
									</td>
								</tr>
								{dueDate && (
									<tr>
										<td style={labelCell}>Due Date:</td>
										<td style={{ ...valueCell, fontWeight: "600" }}>
											{dueDate.toLocaleDateString("en-US", {
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
										</td>
									</tr>
								)}
								<tr>
									<td style={labelCell}>Assigned By:</td>
									<td style={valueCell}>{assignedBy}</td>
								</tr>
							</tbody>
						</table>
					</Section>

					<Section style={buttonContainer}>
						<Link style={button} href={portalUrl}>
							View Task
						</Link>
					</Section>

					<Hr style={hr} />

					<Text style={footer}>
						This task has been assigned to you through {tenantName}. You can
						view all your tasks and update their status in the portal.
					</Text>
				</Container>
			</Body>
		</Html>
	);
};

export default TaskAssignmentEmail;

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

const priorityBanner = {
	padding: "12px 40px",
	textAlign: "center" as const,
	border: "2px solid",
	borderRadius: "8px 8px 0 0",
};

const priorityText = {
	fontSize: "13px",
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

const taskCard = {
	backgroundColor: "#f8f9fa",
	border: "2px solid #e9ecef",
	borderRadius: "8px",
	margin: "24px 40px",
	padding: "24px",
};

const _taskTitle = {
	color: "#1a1a1a",
	fontSize: "20px",
	fontWeight: "700",
	margin: "0 0 12px 0",
	lineHeight: "1.4",
};

const taskDesc = {
	color: "#525252",
	fontSize: "15px",
	lineHeight: "24px",
	margin: "0",
};

const divider = {
	borderColor: "#d1d5db",
	margin: "20px 0",
};

const labelCell = {
	color: "#6b7280",
	fontSize: "14px",
	fontWeight: "600",
	paddingRight: "16px",
	paddingBottom: "12px",
	verticalAlign: "top" as const,
	width: "35%",
};

const valueCell = {
	color: "#1a1a1a",
	fontSize: "15px",
	paddingBottom: "12px",
	verticalAlign: "top" as const,
};

const priorityBadge = {
	display: "inline-block",
	padding: "4px 12px",
	borderRadius: "12px",
	fontSize: "13px",
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
