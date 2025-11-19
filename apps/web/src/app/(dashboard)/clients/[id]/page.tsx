import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { EnhancedClientProfile } from "./components/EnhancedClientProfile";
import type {
	ClientProfile,
	ClientAnalytics,
	ClientProfileStatus,
	RiskLevel,
	ClientTag,
	ClientDocument,
	ClientContact,
	ClientRelationship,
	ClientCommunication,
	ClientNote,
	ClientTask,
	ClientHistoryEvent,
	ClientComplianceHistory,
} from "@gcmc-kaj/types";

export default async function ClientDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	const clientId = Number.parseInt(id, 10);

	if (Number.isNaN(clientId)) {
		redirect("/clients");
	}

	// Mock data for demonstration - replace with actual data fetching
	const mockClient: ClientProfile = {
		id: clientId,
		tenantId: 1,
		name: "Acme Corporation Ltd",
		email: "contact@acmecorp.com",
		phone: "+592-123-4567",
		type: "company",
		status: "active" as ClientProfileStatus,
		sector: "Manufacturing",
		website: "https://acmecorp.com",
		address: {
			street: "123 Business District",
			city: "Georgetown",
			state: "Demerara",
			postalCode: "00001",
			country: "Guyana",
		},
		taxId: "TAX123456789",
		registrationNumber: "REG987654321",
		incorporationDate: new Date("2018-01-15"),
		annualRevenue: 5000000,
		employeeCount: 150,
		riskLevel: "medium" as RiskLevel,
		preferredCommunication: ["email", "phone"],
		billingContact: "Jane Doe",
		technicalContact: "John Smith",
		complianceContact: "Sarah Wilson",
		notes: "Key client in manufacturing sector. Requires monthly compliance reviews.",
		tags: [
			{
				id: "1",
				name: "VIP Client",
				color: "#3b82f6",
				description: "High-value client",
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: "2",
				name: "Manufacturing",
				color: "#22c55e",
				description: "Manufacturing sector",
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		] as ClientTag[],
		customFields: [],
		contacts: [
			{
				id: "1",
				clientId: clientId,
				name: "Jane Doe",
				email: "jane.doe@acmecorp.com",
				phone: "+592-123-4567",
				role: "primary",
				department: "Finance",
				title: "CFO",
				isPrimary: true,
				isActive: true,
				notes: "Primary contact for financial matters",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: "2",
				clientId: clientId,
				name: "John Smith",
				email: "john.smith@acmecorp.com",
				phone: "+592-123-4568",
				role: "technical",
				department: "IT",
				title: "CTO",
				isPrimary: false,
				isActive: true,
				notes: "Technical contact for system integration",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		] as ClientContact[],
		relationships: [
			{
				id: "1",
				clientId: clientId,
				relatedEntityName: "Acme Subsidiary Inc",
				relationshipType: "subsidiary",
				description: "Wholly owned subsidiary",
				startDate: new Date("2020-01-01"),
				isActive: true,
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		] as ClientRelationship[],
		communications: [
			{
				id: "1",
				clientId: clientId,
				contactId: "1",
				userId: "user1",
				type: "email",
				subject: "Quarterly Tax Review",
				content: "Discussed Q4 tax obligations and compliance requirements.",
				direction: "outbound",
				isInternal: false,
				attachments: [],
				metadata: {},
				communicatedAt: new Date("2024-01-15T10:00:00Z"),
				createdAt: new Date("2024-01-15T10:00:00Z"),
			},
		] as ClientCommunication[],
		clientNotes: [
			{
				id: "1",
				clientId: clientId,
				userId: "user1",
				title: "Client Meeting Notes",
				content: "Discussed expansion plans and compliance requirements for new facility.",
				isPrivate: false,
				isPinned: true,
				tags: ["meeting", "expansion"],
				metadata: {},
				createdAt: new Date("2024-01-10T14:30:00Z"),
				updatedAt: new Date("2024-01-10T14:30:00Z"),
			},
		] as ClientNote[],
		tasks: [] as ClientTask[],
		history: [
			{
				id: "1",
				clientId: clientId,
				userId: "user1",
				eventType: "client_created",
				title: "Client Created",
				description: "New client profile created in the system",
				entityId: clientId.toString(),
				entityType: "client",
				oldValue: null,
				newValue: { name: "Acme Corporation Ltd" },
				metadata: {},
				occurredAt: new Date("2024-01-01T09:00:00Z"),
				createdAt: new Date("2024-01-01T09:00:00Z"),
			},
			{
				id: "2",
				clientId: clientId,
				userId: "user1",
				eventType: "document_uploaded",
				title: "Document Uploaded",
				description: "Business license uploaded to client profile",
				entityId: "doc1",
				entityType: "document",
				oldValue: null,
				newValue: { name: "business_license.pdf" },
				metadata: {},
				occurredAt: new Date("2024-01-05T11:30:00Z"),
				createdAt: new Date("2024-01-05T11:30:00Z"),
			},
		] as ClientHistoryEvent[],
		complianceHistory: [
			{
				id: "1",
				clientId: clientId,
				score: 85,
				level: "green",
				breakdown: {
					tax: 90,
					regulatory: 85,
					financial: 80,
				},
				alerts: [],
				outstandingItems: 2,
				assessmentDate: new Date("2024-01-01"),
				assessedBy: "system",
				notes: "Good overall compliance status",
				createdAt: new Date("2024-01-01"),
			},
		] as ClientComplianceHistory[],
		documents: [
			{
				id: "1",
				clientId: clientId,
				name: "business_license.pdf",
				originalName: "Business License 2024.pdf",
				category: "licenses",
				type: "Business License",
				size: 2048576,
				mimeType: "application/pdf",
				url: "/documents/business_license.pdf",
				description: "Annual business license renewal",
				tags: ["license", "2024"],
				isConfidential: false,
				expiryDate: new Date("2024-12-31"),
				version: 1,
				uploadedBy: "user1",
				metadata: {},
				createdAt: new Date("2024-01-01"),
				updatedAt: new Date("2024-01-01"),
			},
		] as ClientDocument[],
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-15"),
		lastActivity: new Date("2024-01-15T10:00:00Z"),
		assignedUserId: "user1",
		metadata: {},
	};

	const mockAnalytics: ClientAnalytics = {
		clientId: clientId,
		totalDocuments: 15,
		totalFilings: 12,
		totalServiceRequests: 8,
		complianceScore: 85,
		outstandingFees: 2500,
		lastActivity: new Date("2024-01-15T10:00:00Z"),
		revenueGenerated: 125000,
		averageResponseTime: 2.5,
		satisfactionScore: 92,
		communicationFrequency: 3.2,
		riskAssessment: {
			score: 75,
			factors: ["Financial stability", "Compliance history"],
			lastAssessed: new Date("2024-01-01"),
		},
		performance: {
			onTimeFilings: 95,
			overdueItems: 2,
			responseTime: 2.5,
			serviceQuality: 88,
		},
	};

	return (
		<div className="container mx-auto py-6 space-y-6">
			<EnhancedClientProfile
				clientId={clientId}
				client={mockClient}
				analytics={mockAnalytics}
			/>
		</div>
	);
}
