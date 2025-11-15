/**
 * Report Generator
 *
 * Main functions for generating PDF reports
 * - Fetches data from Prisma
 * - Validates tenant access
 * - Renders React PDF templates
 * - Returns Buffer
 */

import prisma from '@GCMC-KAJ/db';
import { renderToBuffer } from '@react-pdf/renderer';
import { addDays, differenceInDays } from 'date-fns';
import React from 'react';
import { ClientFileReport } from './templates/ClientFileReport';
import { ComplianceReport } from './templates/ComplianceReport';
import { DocumentsListReport } from './templates/DocumentsListReport';
import { FilingsSummaryReport } from './templates/FilingsSummaryReport';
import { ServiceHistoryReport } from './templates/ServiceHistoryReport';

/**
 * Generate Client File Report
 */
export async function generateClientFileReport(
	clientId: number,
	tenantId: number,
): Promise<Buffer> {
	// Fetch client with validation
	const client = await prisma.client.findFirst({
		where: { id: clientId, tenantId },
		include: {
			businesses: {
				select: {
					name: true,
					registrationNumber: true,
					registrationType: true,
					sector: true,
				},
			},
			tenant: {
				select: {
					name: true,
				},
			},
		},
	});

	if (!client) {
		throw new Error('Client not found or access denied');
	}

	// Fetch documents summary
	const documents = await prisma.document.findMany({
		where: { clientId, tenantId },
		include: {
			documentType: true,
			latestVersion: true,
		},
	});

	const now = new Date();
	const thirtyDaysFromNow = addDays(now, 30);

	const documentsSummary = {
		total: documents.length,
		byType: Object.entries(
			documents.reduce(
				(acc, doc) => {
					const type = doc.documentType.name;
					acc[type] = (acc[type] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>,
			),
		)
			.map(([type, count]) => ({ type, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10), // Top 10 document types
		expiringSoon: documents.filter(
			(doc) =>
				doc.latestVersion?.expiryDate &&
				doc.latestVersion.expiryDate > now &&
				doc.latestVersion.expiryDate <= thirtyDaysFromNow,
		).length,
		expired: documents.filter(
			(doc) => doc.latestVersion?.expiryDate && doc.latestVersion.expiryDate < now,
		).length,
	};

	// Fetch filings summary
	const filings = await prisma.filing.findMany({
		where: { clientId, tenantId },
		include: {
			filingType: true,
		},
		orderBy: { createdAt: 'desc' },
	});

	const filingsSummary = {
		total: filings.length,
		byStatus: Object.entries(
			filings.reduce(
				(acc, filing) => {
					acc[filing.status] = (acc[filing.status] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>,
			),
		).map(([status, count]) => ({ status, count })),
		upcomingDeadlines: filings
			.filter(
				(f) =>
					(f.status === 'draft' || f.status === 'prepared' || f.status === 'pending') &&
					f.periodEnd &&
					f.periodEnd > now,
			)
			.slice(0, 5)
			.map((f) => ({
				type: f.filingType.name,
				dueDate: f.periodEnd!,
				status: f.status,
			})),
	};

	// Fetch compliance score
	const complianceScore = await prisma.complianceScore.findUnique({
		where: {
			tenantId_clientId: { tenantId, clientId },
		},
	});

	// Fetch service history
	const serviceRequests = await prisma.serviceRequest.findMany({
		where: { clientId, tenantId },
		include: {
			service: true,
		},
		orderBy: { createdAt: 'desc' },
		take: 10, // Latest 10 service requests
	});

	const serviceHistory = serviceRequests.map((sr) => ({
		serviceName: sr.service.name,
		status: sr.status,
		createdAt: sr.createdAt,
		updatedAt: sr.updatedAt,
	}));

	// Render PDF
	const pdfDocument = React.createElement(ClientFileReport, {
		client: {
			name: client.name,
			type: client.type,
			email: client.email,
			phone: client.phone,
			address: client.address,
			tin: client.tin,
			nisNumber: client.nisNumber,
			sector: client.sector,
			riskLevel: client.riskLevel,
			createdAt: client.createdAt,
		},
		businesses: client.businesses,
		documentsSummary,
		filingsSummary,
		complianceScore,
		serviceHistory,
		tenantName: client.tenant.name,
		generatedAt: new Date(),
	});

	return await renderToBuffer(pdfDocument);
}

/**
 * Generate Documents List Report
 */
export async function generateDocumentsListReport(
	clientId: number,
	tenantId: number,
): Promise<Buffer> {
	// Fetch client
	const client = await prisma.client.findFirst({
		where: { id: clientId, tenantId },
		include: {
			tenant: {
				select: {
					name: true,
				},
			},
		},
	});

	if (!client) {
		throw new Error('Client not found or access denied');
	}

	// Fetch all documents
	const documents = await prisma.document.findMany({
		where: { clientId, tenantId },
		include: {
			documentType: true,
			latestVersion: true,
		},
		orderBy: [{ documentType: { name: 'asc' } }, { createdAt: 'desc' }],
	});

	const documentsList = documents.map((doc) => ({
		id: doc.id,
		title: doc.title,
		documentType: doc.documentType.name,
		status: doc.status,
		issueDate: doc.latestVersion?.issueDate || null,
		expiryDate: doc.latestVersion?.expiryDate || null,
		authority: doc.authority,
		documentNumber: doc.latestVersion?.metadata
			? (doc.latestVersion.metadata as any)?.documentNumber
			: null,
	}));

	// Render PDF
	const pdfDocument = React.createElement(DocumentsListReport, {
		client: {
			name: client.name,
			type: client.type,
			email: client.email,
		},
		documents: documentsList,
		tenantName: client.tenant.name,
		generatedAt: new Date(),
	});

	return await renderToBuffer(pdfDocument);
}

/**
 * Generate Filings Summary Report
 */
export async function generateFilingsSummaryReport(
	clientId: number,
	tenantId: number,
): Promise<Buffer> {
	// Fetch client
	const client = await prisma.client.findFirst({
		where: { id: clientId, tenantId },
		include: {
			tenant: {
				select: {
					name: true,
				},
			},
		},
	});

	if (!client) {
		throw new Error('Client not found or access denied');
	}

	// Fetch all filings
	const filings = await prisma.filing.findMany({
		where: { clientId, tenantId },
		include: {
			filingType: true,
		},
		orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
	});

	const filingsList = filings.map((filing) => ({
		id: filing.id,
		filingType: filing.filingType.name,
		periodLabel: filing.periodLabel,
		periodStart: filing.periodStart,
		periodEnd: filing.periodEnd,
		status: filing.status,
		submissionDate: filing.submissionDate,
		approvalDate: filing.approvalDate,
		referenceNumber: filing.referenceNumber,
		taxAmount: filing.taxAmount,
		total: filing.total,
		internalNotes: filing.internalNotes,
	}));

	// Render PDF
	const pdfDocument = React.createElement(FilingsSummaryReport, {
		client: {
			name: client.name,
			type: client.type,
			tin: client.tin,
		},
		filings: filingsList,
		tenantName: client.tenant.name,
		generatedAt: new Date(),
	});

	return await renderToBuffer(pdfDocument);
}

/**
 * Generate Compliance Report
 */
export async function generateComplianceReport(
	clientId: number,
	tenantId: number,
): Promise<Buffer> {
	// Fetch client
	const client = await prisma.client.findFirst({
		where: { id: clientId, tenantId },
		include: {
			tenant: {
				select: {
					name: true,
				},
			},
		},
	});

	if (!client) {
		throw new Error('Client not found or access denied');
	}

	// Fetch compliance score
	const complianceScore = await prisma.complianceScore.findUnique({
		where: {
			tenantId_clientId: { tenantId, clientId },
		},
	});

	// Fetch missing documents (based on requirement bundles)
	// This is a simplified version - you may want to enhance this logic
	const requiredDocTypes = await prisma.documentType.findMany({
		where: { tenantId },
		select: { id: true, name: true, description: true },
	});

	const existingDocTypes = await prisma.document.findMany({
		where: { clientId, tenantId },
		select: { documentTypeId: true },
		distinct: ['documentTypeId'],
	});

	const existingDocTypeIds = new Set(existingDocTypes.map((d) => d.documentTypeId));

	const missingDocuments = requiredDocTypes
		.filter((dt) => !existingDocTypeIds.has(dt.id))
		.map((dt) => ({
			documentType: dt.name,
			description: dt.description,
			required: true, // You may want to check against requirement bundles
		}));

	// Fetch expiring documents (next 30 days)
	const now = new Date();
	const thirtyDaysFromNow = addDays(now, 30);

	const documents = await prisma.document.findMany({
		where: {
			clientId,
			tenantId,
			latestVersion: {
				expiryDate: {
					gte: now,
					lte: thirtyDaysFromNow,
				},
			},
		},
		include: {
			documentType: true,
			latestVersion: true,
		},
		orderBy: {
			latestVersion: {
				expiryDate: 'asc',
			},
		},
	});

	const expiringDocuments = documents
		.filter((doc) => doc.latestVersion?.expiryDate)
		.map((doc) => ({
			title: doc.title,
			documentType: doc.documentType.name,
			expiryDate: doc.latestVersion!.expiryDate!,
			daysUntilExpiry: differenceInDays(doc.latestVersion!.expiryDate!, now),
			status: doc.status,
		}));

	// Fetch overdue filings
	const overdueFilings = await prisma.filing.findMany({
		where: {
			clientId,
			tenantId,
			status: 'overdue',
		},
		include: {
			filingType: true,
		},
		orderBy: {
			periodEnd: 'asc',
		},
	});

	const overdueFilingsList = overdueFilings.map((filing) => ({
		filingType: filing.filingType.name,
		periodLabel: filing.periodLabel,
		dueDate: filing.periodEnd,
		daysOverdue: filing.periodEnd ? differenceInDays(now, filing.periodEnd) : 0,
	}));

	// Generate recommendations
	const recommendations: string[] = [];

	if (missingDocuments.length > 0) {
		recommendations.push(
			`Upload ${missingDocuments.length} missing document(s) to improve compliance score.`,
		);
	}

	if (expiringDocuments.length > 0) {
		const urgentDocs = expiringDocuments.filter((d) => d.daysUntilExpiry <= 7);
		if (urgentDocs.length > 0) {
			recommendations.push(
				`Urgent: Renew ${urgentDocs.length} document(s) expiring within 7 days.`,
			);
		} else {
			recommendations.push(
				`Renew ${expiringDocuments.length} document(s) expiring within 30 days.`,
			);
		}
	}

	if (overdueFilingsList.length > 0) {
		recommendations.push(
			`Immediately file ${overdueFilingsList.length} overdue filing(s) to avoid penalties.`,
		);
	}

	if (recommendations.length === 0) {
		recommendations.push(
			'Maintain current compliance status through regular monitoring and timely renewals.',
		);
		recommendations.push(
			'Review upcoming filing deadlines monthly to ensure timely submissions.',
		);
	}

	// Render PDF
	const pdfDocument = React.createElement(ComplianceReport, {
		client: {
			name: client.name,
			type: client.type,
			sector: client.sector,
		},
		complianceScore,
		missingDocuments,
		expiringDocuments,
		overdueFilings: overdueFilingsList,
		recommendations,
		tenantName: client.tenant.name,
		generatedAt: new Date(),
	});

	return await renderToBuffer(pdfDocument);
}

/**
 * Generate Service History Report
 */
export async function generateServiceHistoryReport(
	clientId: number,
	tenantId: number,
): Promise<Buffer> {
	// Fetch client
	const client = await prisma.client.findFirst({
		where: { id: clientId, tenantId },
		include: {
			tenant: {
				select: {
					name: true,
				},
			},
		},
	});

	if (!client) {
		throw new Error('Client not found or access denied');
	}

	// Fetch all service requests
	const serviceRequests = await prisma.serviceRequest.findMany({
		where: { clientId, tenantId },
		include: {
			service: true,
			clientBusiness: {
				select: {
					name: true,
				},
			},
			steps: {
				orderBy: {
					order: 'asc',
				},
			},
		},
		orderBy: { createdAt: 'desc' },
	});

	const serviceRequestsList = serviceRequests.map((sr) => ({
		id: sr.id,
		serviceName: sr.service.name,
		status: sr.status,
		priority: sr.priority,
		createdAt: sr.createdAt,
		updatedAt: sr.updatedAt,
		businessName: sr.clientBusiness?.name || null,
		steps: sr.steps.map((step) => ({
			title: step.title,
			status: step.status,
			order: step.order,
			dueDate: step.dueDate,
		})),
	}));

	// Calculate summary
	const summary = {
		totalRequests: serviceRequests.length,
		completed: serviceRequests.filter((sr) => sr.status === 'completed').length,
		inProgress: serviceRequests.filter(
			(sr) =>
				sr.status === 'in_progress' ||
				sr.status === 'new' ||
				sr.status === 'awaiting_client' ||
				sr.status === 'awaiting_authority',
		).length,
		cancelled: serviceRequests.filter((sr) => sr.status === 'cancelled').length,
		totalRevenue: 0, // You may want to calculate this from service pricing
	};

	// Render PDF
	const pdfDocument = React.createElement(ServiceHistoryReport, {
		client: {
			name: client.name,
			type: client.type,
			email: client.email,
		},
		serviceRequests: serviceRequestsList,
		summary,
		tenantName: client.tenant.name,
		generatedAt: new Date(),
	});

	return await renderToBuffer(pdfDocument);
}
