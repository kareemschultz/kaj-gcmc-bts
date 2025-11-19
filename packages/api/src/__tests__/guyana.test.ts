/**
 * Guyana API Router Tests
 */

import type { PrismaClient } from "@GCMC-KAJ/db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCallerFactory } from "..";
import { guyanaRouter } from "../routers/guyana";

// Mock database
const mockDb = {
	tenant: {
		findUnique: vi.fn(),
	},
	user: {
		findUnique: vi.fn(),
	},
	client: {
		findMany: vi.fn(),
		count: vi.fn(),
		aggregate: vi.fn(),
	},
	taxFiling: {
		findMany: vi.fn(),
		count: vi.fn(),
		aggregate: vi.fn(),
	},
	businessRegistration: {
		findMany: vi.fn(),
		count: vi.fn(),
	},
	penalty: {
		findMany: vi.fn(),
		aggregate: vi.fn(),
	},
	deadline: {
		findMany: vi.fn(),
	},
} as unknown as PrismaClient;

// Mock context
const createMockContext = (permissions: string[] = []) => ({
	db: mockDb,
	tenant: { id: 1, name: "Test Tenant" },
	user: {
		id: 1,
		email: "test@example.com",
		permissions: permissions.map((perm) => ({ permission: perm })),
	},
});

describe("Guyana API Router", () => {
	const createCaller = createCallerFactory(guyanaRouter);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("complianceStats", () => {
		it("should return compliance statistics for authorized user", async () => {
			const ctx = createMockContext(["compliance:view"]);
			const caller = createCaller(ctx);

			// Mock database responses
			(mockDb.client.count as any)
				.mockResolvedValueOnce(50) // totalClients
				.mockResolvedValueOnce(12) // soleTraders
				.mockResolvedValueOnce(8); // companies

			(mockDb.taxFiling.count as any)
				.mockResolvedValueOnce(5) // overdueFilings
				.mockResolvedValueOnce(10); // activeGRAFilings

			(mockDb.client.findMany as any).mockResolvedValue([
				{ id: 1, complianceScore: 95 },
				{ id: 2, complianceScore: 87 },
				{ id: 3, complianceScore: 92 },
			]);

			(mockDb.deadline.findMany as any).mockResolvedValue([
				{ dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) }, // 5 days
				{ dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) }, // 15 days
			]);

			(mockDb.penalty.aggregate as any).mockResolvedValue({
				_sum: { amount: 5000 },
			});

			const result = await caller.complianceStats();

			expect(result).toEqual({
				totalClients: 50,
				soleTraders: 12,
				companies: 8,
				overdueFilings: 5,
				upcomingDeadlines: 2,
				totalPenalties: 5000,
				activeGRAFilings: 10,
				compliantClients: 3,
			});
		});

		it("should throw unauthorized error for user without permissions", async () => {
			const ctx = createMockContext([]);
			const caller = createCaller(ctx);

			await expect(caller.complianceStats()).rejects.toThrow("UNAUTHORIZED");
		});
	});

	describe("grtStatus", () => {
		it("should return GRT status information", async () => {
			const ctx = createMockContext(["filings:view"]);
			const caller = createCaller(ctx);

			(mockDb.client.count as any)
				.mockResolvedValueOnce(25) // totalRegistered
				.mockResolvedValueOnce(20); // currentCompliant

			(mockDb.taxFiling.count as any)
				.mockResolvedValueOnce(18) // thisMonthFiled
				.mockResolvedValueOnce(3); // overdue

			const result = await caller.grtStatus();

			expect(result).toEqual({
				totalRegistered: 25,
				currentCompliant: 20,
				thisMonthFiled: 18,
				overdue: 3,
			});
		});
	});

	describe("corporationTaxStatus", () => {
		it("should return corporation tax status", async () => {
			const ctx = createMockContext(["filings:view"]);
			const caller = createCaller(ctx);

			(mockDb.client.count as any).mockResolvedValue(15);

			(mockDb.taxFiling.count as any)
				.mockResolvedValueOnce(12) // filed
				.mockResolvedValueOnce(2) // inProgress
				.mockResolvedValueOnce(1); // dueSoon

			const result = await caller.corporationTaxStatus();

			expect(result).toEqual({
				companies: 15,
				filed: 12,
				inProgress: 2,
				dueSoon: 1,
			});
		});
	});

	describe("payeStatus", () => {
		it("should return PAYE status with monthly and quarterly data", async () => {
			const ctx = createMockContext(["filings:view"]);
			const caller = createCaller(ctx);

			// Mock Prisma raw queries for PAYE data
			(mockDb.taxFiling.findMany as any)
				.mockResolvedValueOnce([
					{ status: "FILED", submittedAt: new Date() },
					{ status: "FILED", submittedAt: new Date() },
					{ status: "LATE", submittedAt: new Date() },
				]) // Monthly data
				.mockResolvedValueOnce([
					{ status: "FILED" },
					{ status: "FILED" },
					{ status: "FILED" },
				]) // Current quarter
				.mockResolvedValueOnce([{ status: "FILED" }, { status: "FILED" }]); // Previous quarters

			const result = await caller.payeStatus();

			expect(result).toEqual({
				monthly: {
					onTime: 2,
					late: 1,
					outstanding: 0,
				},
				quarterly: {
					current: 3,
					previous: 2,
				},
			});
		});
	});

	describe("withholdingTaxStatus", () => {
		it("should return withholding tax status", async () => {
			const ctx = createMockContext(["filings:view"]);
			const caller = createCaller(ctx);

			(mockDb.taxFiling.aggregate as any).mockResolvedValue({
				_sum: {
					withholdingAmount: 50000,
					remittedAmount: 45000,
				},
			});

			const result = await caller.withholdingTaxStatus();

			expect(result).toEqual({
				currentStatus: "pending",
				totalDeducted: 50000,
				remitted: 45000,
				outstanding: 5000,
			});
		});

		it("should return compliant status when no outstanding amount", async () => {
			const ctx = createMockContext(["filings:view"]);
			const caller = createCaller(ctx);

			(mockDb.taxFiling.aggregate as any).mockResolvedValue({
				_sum: {
					withholdingAmount: 50000,
					remittedAmount: 50000,
				},
			});

			const result = await caller.withholdingTaxStatus();

			expect(result.currentStatus).toBe("compliant");
			expect(result.outstanding).toBe(0);
		});
	});

	describe("businessRegistrationStatus", () => {
		it("should return business registration status", async () => {
			const ctx = createMockContext(["filings:view"]);
			const caller = createCaller(ctx);

			const _futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
			const _pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

			(mockDb.businessRegistration.count as any)
				.mockResolvedValueOnce(45) // active
				.mockResolvedValueOnce(3) // expired
				.mockResolvedValueOnce(2) // renewalsDue
				.mockResolvedValueOnce(1); // pending

			const result = await caller.businessRegistrationStatus();

			expect(result).toEqual({
				active: 45,
				expired: 3,
				renewalsDue: 2,
				pending: 1,
			});
		});
	});

	describe("taxCalendar", () => {
		it("should return upcoming tax calendar events", async () => {
			const ctx = createMockContext(["filings:view"]);
			const caller = createCaller(ctx);

			const upcomingDeadlines = [
				{
					title: "GRT Monthly Return",
					dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
					type: "GRT",
				},
				{
					title: "PAYE Returns",
					dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
					type: "PAYE",
				},
			];

			(mockDb.deadline.findMany as any).mockResolvedValue(upcomingDeadlines);
			(mockDb.client.count as any)
				.mockResolvedValueOnce(5) // GRT clients
				.mockResolvedValueOnce(8); // PAYE clients

			const result = await caller.taxCalendar();

			expect(result.upcomingEvents).toHaveLength(2);
			expect(result.upcomingEvents[0]).toEqual({
				title: "GRT Monthly Return",
				daysUntil: 7,
				clientsAffected: 5,
			});
			expect(result.upcomingEvents[1]).toEqual({
				title: "PAYE Returns",
				daysUntil: 15,
				clientsAffected: 8,
			});
		});

		it("should handle empty calendar", async () => {
			const ctx = createMockContext(["filings:view"]);
			const caller = createCaller(ctx);

			(mockDb.deadline.findMany as any).mockResolvedValue([]);

			const result = await caller.taxCalendar();

			expect(result.upcomingEvents).toHaveLength(0);
		});
	});

	describe("complianceDeadlines", () => {
		it("should return compliance deadlines with urgency levels", async () => {
			const ctx = createMockContext(["compliance:view"]);
			const caller = createCaller(ctx);

			const criticalDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
			const warningDeadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days
			const normalDeadline = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000); // 20 days

			(mockDb.deadline.findMany as any).mockResolvedValue([
				{
					title: "Critical Deadline",
					description: "Urgent filing required",
					dueDate: criticalDeadline,
					penaltyAmount: 1000,
				},
				{
					title: "Warning Deadline",
					description: "Filing due soon",
					dueDate: warningDeadline,
					penaltyAmount: 500,
				},
				{
					title: "Normal Deadline",
					description: "Regular filing",
					dueDate: normalDeadline,
					penaltyAmount: 100,
				},
			]);

			const result = await caller.complianceDeadlines();

			expect(result.criticalDeadlines).toHaveLength(3);
			expect(result.criticalDeadlines[0].urgency).toBe("critical");
			expect(result.criticalDeadlines[1].urgency).toBe("warning");
			expect(result.criticalDeadlines[2].urgency).toBe("normal");
		});
	});
});
