/**
 * Guyana Compliance Dashboard Component Tests
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GuyanaComplianceDashboard } from "../guyana-compliance-dashboard";

// Mock tRPC
const mockUseQuery = vi.fn();
vi.mock("@/utils/trpc", () => ({
	trpc: {
		dashboard: {
			overview: {
				useQuery: () => mockUseQuery("dashboard.overview"),
			},
			complianceOverview: {
				useQuery: () => mockUseQuery("dashboard.complianceOverview"),
			},
		},
		guyana: {
			complianceStats: {
				useQuery: () => mockUseQuery("guyana.complianceStats"),
			},
			filingStatus: {
				useQuery: () => mockUseQuery("guyana.filingStatus"),
			},
		},
		clients: {
			list: {
				useQuery: () => mockUseQuery("clients.list"),
			},
		},
	},
}));

// Mock UI components
vi.mock("@/components/ui/card", () => ({
	Card: ({ children, className }: any) => (
		<div className={`card ${className}`}>{children}</div>
	),
	CardContent: ({ children }: any) => (
		<div className="card-content">{children}</div>
	),
	CardDescription: ({ children }: any) => (
		<div className="card-description">{children}</div>
	),
	CardHeader: ({ children }: any) => (
		<div className="card-header">{children}</div>
	),
	CardTitle: ({ children }: any) => (
		<div className="card-title">{children}</div>
	),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({ children, ...props }: any) => (
		<button {...props}>{children}</button>
	),
}));

vi.mock("@/components/ui/badge", () => ({
	Badge: ({ children, variant }: any) => (
		<span className={`badge ${variant}`}>{children}</span>
	),
}));

vi.mock("@/components/ui/progress", () => ({
	Progress: ({ value }: any) => <div className="progress" data-value={value} />,
}));

vi.mock("@/components/ui/skeleton", () => ({
	Skeleton: ({ className }: any) => <div className={`skeleton ${className}`} />,
}));

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("GuyanaComplianceDashboard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should show loading skeleton when data is loading", () => {
		mockUseQuery.mockReturnValue({
			data: undefined,
			isLoading: true,
			error: null,
		});

		const { container } = render(<GuyanaComplianceDashboard />, { wrapper: createWrapper() });

		expect(container.querySelector(".skeleton")).toBeTruthy();
	});

	it("should render dashboard with compliance data", async () => {
		const mockOverviewData = {
			counts: { clients: 100 },
			alerts: { overdueFilings: 5 },
		};

		const mockComplianceData = {
			byLevel: { high: 85 },
		};

		const mockGuyanaStats = {
			upcomingDeadlines: 12,
			totalPenalties: 2500,
		};

		mockUseQuery.mockImplementation((queryKey) => {
			switch (queryKey) {
				case "dashboard.overview":
					return { data: mockOverviewData, isLoading: false };
				case "dashboard.complianceOverview":
					return { data: mockComplianceData, isLoading: false };
				case "guyana.complianceStats":
					return { data: mockGuyanaStats, isLoading: false };
				default:
					return { data: null, isLoading: false };
			}
		});

		render(<GuyanaComplianceDashboard />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(screen.getByText("Guyana Tax Compliance")).toBeInTheDocument();
			expect(
				screen.getByText("GRA & GRT compliance tracking for your clients"),
			).toBeInTheDocument();
			expect(screen.getByText("85.0%")).toBeInTheDocument(); // Compliance rate
			expect(screen.getByText("12")).toBeInTheDocument(); // Upcoming deadlines
			expect(screen.getByText("5")).toBeInTheDocument(); // Overdue filings
			expect(screen.getByText("$2,500")).toBeInTheDocument(); // Total penalties
		});
	});

	it("should calculate compliance rate correctly", async () => {
		const mockOverviewData = {
			counts: { clients: 50 },
		};

		const mockComplianceData = {
			byLevel: { high: 40 },
		};

		mockUseQuery.mockImplementation((queryKey) => {
			switch (queryKey) {
				case "dashboard.overview":
					return { data: mockOverviewData, isLoading: false };
				case "dashboard.complianceOverview":
					return { data: mockComplianceData, isLoading: false };
				case "guyana.complianceStats":
					return { data: {}, isLoading: false };
				default:
					return { data: null, isLoading: false };
			}
		});

		render(<GuyanaComplianceDashboard />, { wrapper: createWrapper() });

		await waitFor(() => {
			// 40/50 * 100 = 80.0%
			expect(screen.getByText("80.0%")).toBeInTheDocument();
		});
	});

	it("should handle zero clients gracefully", async () => {
		const mockOverviewData = {
			counts: { clients: 0 },
		};

		const mockComplianceData = {
			byLevel: { high: 0 },
		};

		mockUseQuery.mockImplementation((queryKey) => {
			switch (queryKey) {
				case "dashboard.overview":
					return { data: mockOverviewData, isLoading: false };
				case "dashboard.complianceOverview":
					return { data: mockComplianceData, isLoading: false };
				case "guyana.complianceStats":
					return { data: {}, isLoading: false };
				default:
					return { data: null, isLoading: false };
			}
		});

		render(<GuyanaComplianceDashboard />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(screen.getByText("0.0%")).toBeInTheDocument();
		});
	});

	it("should show appropriate badge variants based on metrics", async () => {
		const mockGuyanaStats = {
			upcomingDeadlines: 5,
			totalPenalties: 1000,
		};

		const mockOverviewData = {
			counts: { clients: 100 },
			alerts: { overdueFilings: 3 },
		};

		mockUseQuery.mockImplementation((queryKey) => {
			switch (queryKey) {
				case "dashboard.overview":
					return { data: mockOverviewData, isLoading: false };
				case "guyana.complianceStats":
					return { data: mockGuyanaStats, isLoading: false };
				default:
					return { data: {}, isLoading: false };
			}
		});

		render(<GuyanaComplianceDashboard />, { wrapper: createWrapper() });

		await waitFor(() => {
			// Should show warning badges for upcoming deadlines and overdue items
			const warningBadge = document.querySelector(".badge.warning");
			const destructiveBadge = document.querySelector(".badge.destructive");

			expect(warningBadge).toBeInTheDocument();
			expect(destructiveBadge).toBeInTheDocument();
		});
	});

	it("should render filing status widget with correct data", async () => {
		const mockFilingStatus = {
			submitted: 25,
			inProgress: 10,
			pending: 5,
			overdue: 2,
		};

		mockUseQuery.mockImplementation((queryKey) => {
			switch (queryKey) {
				case "guyana.filingStatus":
					return { data: mockFilingStatus, isLoading: false };
				default:
					return { data: {}, isLoading: false };
			}
		});

		render(<GuyanaComplianceDashboard />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(screen.getByText("25")).toBeInTheDocument(); // Submitted
			expect(screen.getByText("10")).toBeInTheDocument(); // In Progress
			expect(screen.getByText("5")).toBeInTheDocument(); // Pending
			expect(screen.getByText("2")).toBeInTheDocument(); // Overdue
		});
	});

	it("should display quick action buttons", async () => {
		mockUseQuery.mockReturnValue({
			data: {},
			isLoading: false,
		});

		render(<GuyanaComplianceDashboard />, { wrapper: createWrapper() });

		await waitFor(() => {
			expect(screen.getByText("Generate Tax Return")).toBeInTheDocument();
			expect(screen.getByText("Check Filing Calendar")).toBeInTheDocument();
			expect(screen.getByText("Update Client Info")).toBeInTheDocument();
			expect(screen.getByText("Calculate Penalties")).toBeInTheDocument();
		});
	});

	it("should handle API errors gracefully", async () => {
		mockUseQuery.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Database connection failed",
			}),
		});

		render(<GuyanaComplianceDashboard />, { wrapper: createWrapper() });

		// Component should still render with default values
		await waitFor(() => {
			expect(screen.getByText("Guyana Tax Compliance")).toBeInTheDocument();
			expect(screen.getByText("0.0%")).toBeInTheDocument(); // Default compliance rate
		});
	});
});
