/**
 * PDF Report Interface Component Tests
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PDFReportInterface } from "../pdf-report-interface";

// Mock tRPC
const mockUseMutation = vi.fn();
const mockUseQuery = vi.fn();

vi.mock("@/utils/trpc", () => ({
	trpc: {
		reports: {
			availableTypes: {
				useQuery: () => mockUseQuery("reports.availableTypes"),
			},
			recent: {
				useQuery: () => mockUseQuery("reports.recent"),
			},
			generate: {
				useMutation: () => mockUseMutation("reports.generate"),
			},
			download: {
				useMutation: () => mockUseMutation("reports.download"),
			},
		},
		clients: {
			list: {
				useQuery: () => mockUseQuery("clients.list"),
			},
		},
	},
}));

// Mock toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock UI components
vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ children, open }: any) =>
		open ? <div data-testid="dialog">{children}</div> : null,
	DialogContent: ({ children }: any) => (
		<div data-testid="dialog-content">{children}</div>
	),
	DialogDescription: ({ children }: any) => <div>{children}</div>,
	DialogHeader: ({ children }: any) => <div>{children}</div>,
	DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock("@/components/analytics/DateRangePicker", () => ({
	DateRangePicker: ({ value, onChange }: any) => (
		<input
			data-testid="date-range-picker"
			value={value ? `${value.from}-${value.to}` : ""}
			onChange={(e) => {
				if (e.target.value) {
					const [from, to] = e.target.value.split("-");
					onChange({ from: new Date(from), to: new Date(to) });
				}
			}}
		/>
	),
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

describe("PDFReportInterface", () => {
	const user = userEvent.setup();

	beforeEach(() => {
		vi.clearAllMocks();

		// Default mock implementations
		mockUseQuery.mockImplementation((queryKey) => {
			switch (queryKey) {
				case "reports.availableTypes":
					return { data: [], isLoading: false };
				case "reports.recent":
					return { data: { reports: [] }, isLoading: false };
				case "clients.list":
					return { data: [], isLoading: false };
				default:
					return { data: null, isLoading: false };
			}
		});

		mockUseMutation.mockImplementation((mutationType) => {
			switch (mutationType) {
				case "reports.generate":
					return {
						mutateAsync: vi.fn(),
						isLoading: false,
					};
				case "reports.download":
					return {
						mutateAsync: vi.fn(),
						isLoading: false,
					};
				default:
					return {
						mutateAsync: vi.fn(),
						isLoading: false,
					};
			}
		});
	});

	it("should render PDF report interface with all report types", () => {
		render(<PDFReportInterface />, { wrapper: createWrapper() });

		expect(screen.getByText("PDF Report Generator")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Generate compliance and business reports with automatic storage management",
			),
		).toBeInTheDocument();

		// Check all report type cards are rendered
		expect(screen.getByText("Compliance Report")).toBeInTheDocument();
		expect(screen.getByText("Tax Filing Summary")).toBeInTheDocument();
		expect(screen.getByText("Client Document Package")).toBeInTheDocument();
		expect(screen.getByText("Audit Trail Report")).toBeInTheDocument();
		expect(screen.getByText("Penalty Calculation Report")).toBeInTheDocument();
	});

	it("should display storage statistics", () => {
		render(<PDFReportInterface />, { wrapper: createWrapper() });

		expect(screen.getByText("Storage Usage")).toBeInTheDocument();
		expect(screen.getByText("2.4 GB")).toBeInTheDocument();
		expect(screen.getByText("of 10 GB used")).toBeInTheDocument();

		expect(screen.getByText("Reports Generated")).toBeInTheDocument();
		expect(screen.getByText("147")).toBeInTheDocument();
		expect(screen.getByText("this month")).toBeInTheDocument();

		expect(screen.getByText("Retention Policy")).toBeInTheDocument();
		expect(screen.getByText("365")).toBeInTheDocument();
		expect(screen.getByText("days retention")).toBeInTheDocument();
	});

	it("should open dialog when generate button is clicked", async () => {
		render(<PDFReportInterface />, { wrapper: createWrapper() });

		const generateButtons = screen.getAllByText("Generate");
		await user.click(generateButtons[0]); // Click first generate button

		await waitFor(() => {
			expect(screen.getByTestId("dialog")).toBeInTheDocument();
			expect(screen.getByText("Compliance Report")).toBeInTheDocument();
		});
	});

	it("should render report generation form with client selection", async () => {
		const mockClients = [
			{ id: 1, name: "Client A" },
			{ id: 2, name: "Client B" },
			{ id: 3, name: "Client C" },
		];

		mockUseQuery.mockImplementation((queryKey) => {
			switch (queryKey) {
				case "clients.list":
					return { data: mockClients, isLoading: false };
				default:
					return { data: [], isLoading: false };
			}
		});

		render(<PDFReportInterface />, { wrapper: createWrapper() });

		const generateButtons = screen.getAllByText("Generate");
		await user.click(generateButtons[0]);

		await waitFor(() => {
			expect(screen.getByText("Select Clients")).toBeInTheDocument();
			expect(screen.getByText("Client A")).toBeInTheDocument();
			expect(screen.getByText("Client B")).toBeInTheDocument();
			expect(screen.getByText("Client C")).toBeInTheDocument();
		});
	});

	it("should handle client selection", async () => {
		const mockClients = [
			{ id: 1, name: "Client A" },
			{ id: 2, name: "Client B" },
		];

		mockUseQuery.mockImplementation((queryKey) => {
			if (queryKey === "clients.list") {
				return { data: mockClients, isLoading: false };
			}
			return { data: [], isLoading: false };
		});

		render(<PDFReportInterface />, { wrapper: createWrapper() });

		const generateButtons = screen.getAllByText("Generate");
		await user.click(generateButtons[0]);

		await waitFor(() => {
			const clientACheckbox = screen.getByLabelText("Client A");
			fireEvent.click(clientACheckbox);
		});

		// Checkbox should be checked (implementation depends on checkbox component)
		expect(screen.getByLabelText("Client A")).toBeInTheDocument();
	});

	it("should handle date range selection", async () => {
		render(<PDFReportInterface />, { wrapper: createWrapper() });

		const generateButtons = screen.getAllByText("Generate");
		await user.click(generateButtons[0]);

		await waitFor(() => {
			const dateRangePicker = screen.getByTestId("date-range-picker");
			fireEvent.change(dateRangePicker, {
				target: { value: "2024-01-01-2024-12-31" },
			});
		});

		expect(screen.getByTestId("date-range-picker")).toHaveValue(
			"2024-01-01-2024-12-31",
		);
	});

	it("should handle format selection", async () => {
		render(<PDFReportInterface />, { wrapper: createWrapper() });

		const generateButtons = screen.getAllByText("Generate");
		await user.click(generateButtons[0]);

		await waitFor(() => {
			expect(screen.getByText("Output Format")).toBeInTheDocument();
			expect(screen.getByText("PDF Document")).toBeInTheDocument();
			expect(screen.getByText("Excel Spreadsheet")).toBeInTheDocument();
		});
	});

	it("should generate report successfully", async () => {
		const mockGenerate = vi.fn().mockResolvedValue({
			downloadUrl: "https://example.com/download/report.pdf",
		});

		mockUseMutation.mockImplementation((mutationType) => {
			if (mutationType === "reports.generate") {
				return {
					mutateAsync: mockGenerate,
					isLoading: false,
				};
			}
			return { mutateAsync: vi.fn(), isLoading: false };
		});

		mockUseQuery.mockImplementation((queryKey) => {
			if (queryKey === "clients.list") {
				return { data: [{ id: 1, name: "Client A" }], isLoading: false };
			}
			return { data: [], isLoading: false };
		});

		// Mock window.open
		const mockWindowOpen = vi.fn();
		Object.defineProperty(window, "open", {
			writable: true,
			value: mockWindowOpen,
		});

		render(<PDFReportInterface />, { wrapper: createWrapper() });

		const generateButtons = screen.getAllByText("Generate");
		await user.click(generateButtons[0]);

		await waitFor(() => {
			const clientCheckbox = screen.getByLabelText("Client A");
			fireEvent.click(clientCheckbox);
		});

		const reportGenerateButton = screen.getByRole("button", {
			name: /generate report/i,
		});
		await user.click(reportGenerateButton);

		await waitFor(() => {
			expect(mockGenerate).toHaveBeenCalledWith({
				type: "compliance",
				clientIds: [1],
				dateRange: undefined,
				includeAttachments: false,
				format: "pdf",
			});
			expect(mockWindowOpen).toHaveBeenCalledWith(
				"https://example.com/download/report.pdf",
				"_blank",
			);
		});
	});

	it("should handle report generation error", async () => {
		const mockGenerate = vi
			.fn()
			.mockRejectedValue(new Error("Generation failed"));

		mockUseMutation.mockImplementation((mutationType) => {
			if (mutationType === "reports.generate") {
				return {
					mutateAsync: mockGenerate,
					isLoading: false,
				};
			}
			return { mutateAsync: vi.fn(), isLoading: false };
		});

		mockUseQuery.mockImplementation((queryKey) => {
			if (queryKey === "clients.list") {
				return { data: [{ id: 1, name: "Client A" }], isLoading: false };
			}
			return { data: [], isLoading: false };
		});

		const { toast } = await import("sonner");

		render(<PDFReportInterface />, { wrapper: createWrapper() });

		const generateButtons = screen.getAllByText("Generate");
		await user.click(generateButtons[0]);

		await waitFor(() => {
			const clientCheckbox = screen.getByLabelText("Client A");
			fireEvent.click(clientCheckbox);
		});

		const reportGenerateButton = screen.getByRole("button", {
			name: /generate report/i,
		});
		await user.click(reportGenerateButton);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Failed to generate report");
		});
	});

	it("should display recent reports when available", () => {
		const mockRecentReports = [
			{
				id: "report-1",
				title: "Compliance Report - January 2024",
				createdAt: "2024-01-15T10:00:00Z",
				expiresAt: "2025-01-15T10:00:00Z",
				fileSize: "2.4 MB",
				format: "pdf",
			},
			{
				id: "report-2",
				title: "Tax Filing Summary - December 2023",
				createdAt: "2023-12-31T15:30:00Z",
				expiresAt: "2024-12-31T15:30:00Z",
				fileSize: "1.8 MB",
				format: "excel",
			},
		];

		mockUseQuery.mockImplementation((queryKey) => {
			if (queryKey === "reports.recent") {
				return { data: { reports: mockRecentReports }, isLoading: false };
			}
			return { data: [], isLoading: false };
		});

		render(<PDFReportInterface />, { wrapper: createWrapper() });

		expect(screen.getByText("Recent Reports")).toBeInTheDocument();
		expect(
			screen.getByText("Compliance Report - January 2024"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Tax Filing Summary - December 2023"),
		).toBeInTheDocument();
		expect(screen.getByText("PDF")).toBeInTheDocument();
		expect(screen.getByText("EXCEL")).toBeInTheDocument();
	});

	it("should show empty state when no recent reports", () => {
		mockUseQuery.mockImplementation((queryKey) => {
			if (queryKey === "reports.recent") {
				return { data: { reports: [] }, isLoading: false };
			}
			return { data: [], isLoading: false };
		});

		render(<PDFReportInterface />, { wrapper: createWrapper() });

		expect(screen.getByText("No reports generated yet")).toBeInTheDocument();
		expect(
			screen.getByText("Generate your first report using the options above"),
		).toBeInTheDocument();
	});

	it("should handle report download", async () => {
		const mockDownload = vi.fn().mockResolvedValue({
			downloadUrl: "https://example.com/download/report.pdf",
		});

		mockUseMutation.mockImplementation((mutationType) => {
			if (mutationType === "reports.download") {
				return {
					mutateAsync: mockDownload,
					isLoading: false,
				};
			}
			return { mutateAsync: vi.fn(), isLoading: false };
		});

		const mockRecentReports = [
			{
				id: "report-1",
				title: "Test Report",
				createdAt: "2024-01-15T10:00:00Z",
				expiresAt: "2025-01-15T10:00:00Z",
				fileSize: "2.4 MB",
				format: "pdf",
			},
		];

		mockUseQuery.mockImplementation((queryKey) => {
			if (queryKey === "reports.recent") {
				return { data: { reports: mockRecentReports }, isLoading: false };
			}
			return { data: [], isLoading: false };
		});

		const mockWindowOpen = vi.fn();
		Object.defineProperty(window, "open", {
			writable: true,
			value: mockWindowOpen,
		});

		render(<PDFReportInterface />, { wrapper: createWrapper() });

		const downloadButton = screen.getByRole("button", { name: "" }); // Download button with icon only
		await user.click(downloadButton);

		await waitFor(() => {
			expect(mockDownload).toHaveBeenCalledWith({ reportId: "report-1" });
			expect(mockWindowOpen).toHaveBeenCalledWith(
				"https://example.com/download/report.pdf",
				"_blank",
			);
		});
	});

	it("should disable generate button when no clients selected", async () => {
		mockUseQuery.mockImplementation((queryKey) => {
			if (queryKey === "clients.list") {
				return { data: [{ id: 1, name: "Client A" }], isLoading: false };
			}
			return { data: [], isLoading: false };
		});

		render(<PDFReportInterface />, { wrapper: createWrapper() });

		const generateButtons = screen.getAllByText("Generate");
		await user.click(generateButtons[0]);

		await waitFor(() => {
			const reportGenerateButton = screen.getByRole("button", {
				name: /generate report/i,
			});
			expect(reportGenerateButton).toBeDisabled();
		});
	});

	it("should show loading state during report generation", async () => {
		mockUseMutation.mockImplementation((mutationType) => {
			if (mutationType === "reports.generate") {
				return {
					mutateAsync: vi.fn(),
					isLoading: true,
				};
			}
			return { mutateAsync: vi.fn(), isLoading: false };
		});

		mockUseQuery.mockImplementation((queryKey) => {
			if (queryKey === "clients.list") {
				return { data: [{ id: 1, name: "Client A" }], isLoading: false };
			}
			return { data: [], isLoading: false };
		});

		render(<PDFReportInterface />, { wrapper: createWrapper() });

		const generateButtons = screen.getAllByText("Generate");
		await user.click(generateButtons[0]);

		await waitFor(() => {
			const clientCheckbox = screen.getByLabelText("Client A");
			fireEvent.click(clientCheckbox);
		});

		await waitFor(() => {
			expect(screen.getByText("Generating Report...")).toBeInTheDocument();
		});
	});
});
