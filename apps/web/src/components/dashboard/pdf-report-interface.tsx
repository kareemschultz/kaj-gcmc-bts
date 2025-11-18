"use client";

import {
	AlertCircle,
	Calendar,
	Download,
	FileCheck,
	FileText,
	Loader2,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

/**
 * PDF Report Generation Interface
 *
 * Integrates with the Phase 4 storage system to generate and manage PDF reports:
 * - Compliance reports for GRA submissions
 * - Tax filing summaries
 * - Client document packages
 * - Audit trail reports
 * - Penalty calculation reports
 *
 * Features automatic storage, retention policies, and download management
 */

type ReportType =
	| "compliance"
	| "tax_filing"
	| "client_package"
	| "audit_trail"
	| "penalty_calculation";

interface ReportGenerationParams {
	type: ReportType;
	clientIds?: number[];
	dateRange?: {
		from: Date;
		to: Date;
	};
	includeAttachments?: boolean;
	format: "pdf" | "excel";
	template?: string;
}

export function PDFReportInterface() {
	const [isGenerating, setIsGenerating] = useState(false);
	const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	const { data: availableReports } = trpc.reports.availableTypes.useQuery();
	const { data: recentReports } = trpc.reports.recent.useQuery();
	const generateReport = trpc.reports.generate.useMutation();
	const _downloadReport = trpc.reports.download.useMutation();

	const reportTypes = [
		{
			id: "compliance" as const,
			title: "Compliance Report",
			description: "Complete compliance status for GRA submission",
			icon: FileCheck,
			color: "text-success",
			bgColor: "bg-success/10",
			features: [
				"Client compliance scores",
				"Missing documents",
				"Filing status",
				"Penalty summary",
			],
		},
		{
			id: "tax_filing" as const,
			title: "Tax Filing Summary",
			description: "Comprehensive tax filing status report",
			icon: FileText,
			color: "text-brand",
			bgColor: "bg-brand/10",
			features: [
				"GRT filing status",
				"PAYE summaries",
				"Corporation tax",
				"Withholding tax",
			],
		},
		{
			id: "client_package" as const,
			title: "Client Document Package",
			description: "Complete document package for specific clients",
			icon: Users,
			color: "text-accent",
			bgColor: "bg-accent/10",
			features: [
				"Client information",
				"Document copies",
				"Filing history",
				"Contact details",
			],
		},
		{
			id: "audit_trail" as const,
			title: "Audit Trail Report",
			description: "Detailed audit trail for compliance verification",
			icon: Calendar,
			color: "text-info",
			bgColor: "bg-info/10",
			features: [
				"User actions",
				"Document changes",
				"Filing submissions",
				"System logs",
			],
		},
		{
			id: "penalty_calculation" as const,
			title: "Penalty Calculation Report",
			description: "Detailed penalty calculations and payment status",
			icon: AlertCircle,
			color: "text-warning",
			bgColor: "bg-warning/10",
			features: [
				"Penalty calculations",
				"Payment history",
				"Outstanding amounts",
				"Interest charges",
			],
		},
	];

	const handleGenerateReport = async (params: ReportGenerationParams) => {
		setIsGenerating(true);
		try {
			const result = await generateReport.mutateAsync(params);
			toast.success("Report generated successfully!");

			// Automatically start download
			if (result.downloadUrl) {
				window.open(result.downloadUrl, "_blank");
			}
		} catch (error) {
			toast.error("Failed to generate report");
			console.error("Report generation failed:", error);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="font-bold text-2xl">PDF Report Generator</h2>
				<p className="text-muted-foreground">
					Generate compliance and business reports with automatic storage
					management
				</p>
			</div>

			{/* Quick Actions */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{reportTypes.map((report) => (
					<Card
						key={report.id}
						className="cursor-pointer transition-all hover:shadow-md"
					>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<div className={`rounded-lg p-2 ${report.bgColor}`}>
									<report.icon className={`h-5 w-5 ${report.color}`} />
								</div>
								<Button
									size="sm"
									onClick={() => {
										setSelectedReport(report.id);
										setDialogOpen(true);
									}}
								>
									Generate
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<h3 className="mb-2 font-semibold text-base">{report.title}</h3>
							<p className="mb-3 text-muted-foreground text-sm">
								{report.description}
							</p>
							<div className="space-y-1">
								{report.features.map((feature, index) => (
									<div key={index} className="flex items-center gap-2 text-sm">
										<div className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
										{feature}
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Recent Reports */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Reports</CardTitle>
					<CardDescription>
						Recently generated reports with download and management options
					</CardDescription>
				</CardHeader>
				<CardContent>
					<RecentReportsTable reports={recentReports?.reports || []} />
				</CardContent>
			</Card>

			{/* Storage Statistics */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Storage Usage</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">2.4 GB</div>
						<p className="text-muted-foreground text-sm">of 10 GB used</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Reports Generated</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">147</div>
						<p className="text-muted-foreground text-sm">this month</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Retention Policy</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">365</div>
						<p className="text-muted-foreground text-sm">days retention</p>
					</CardContent>
				</Card>
			</div>

			{/* Report Generation Dialog */}
			{selectedReport && (
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-2">
								{reportTypes.find((r) => r.id === selectedReport)?.icon && (
									<ReportIcon
										reportType={selectedReport}
										className={
											reportTypes.find((r) => r.id === selectedReport)?.color ||
											"text-foreground"
										}
									/>
								)}
								{reportTypes.find((r) => r.id === selectedReport)?.title}
							</DialogTitle>
							<DialogDescription>
								{reportTypes.find((r) => r.id === selectedReport)?.description}
							</DialogDescription>
						</DialogHeader>
						<ReportGenerationForm
							reportType={selectedReport}
							onGenerate={(params) => {
								handleGenerateReport(params);
								setDialogOpen(false);
							}}
							isGenerating={isGenerating}
						/>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}

function ReportIcon({
	reportType,
	className,
}: {
	reportType: ReportType;
	className: string;
}) {
	const iconMap = {
		compliance: FileCheck,
		tax_filing: FileText,
		client_package: Users,
		audit_trail: Calendar,
		penalty_calculation: AlertCircle,
	};

	const Icon = iconMap[reportType];
	return <Icon className={`h-5 w-5 ${className}`} />;
}

function ReportGenerationForm({
	reportType,
	onGenerate,
	isGenerating,
}: {
	reportType: ReportType;
	onGenerate: (params: ReportGenerationParams) => void;
	isGenerating: boolean;
}) {
	const [selectedClients, setSelectedClients] = useState<number[]>([]);
	const [dateRange, setDateRange] = useState<
		{ from: Date; to: Date } | undefined
	>();
	const [includeAttachments, setIncludeAttachments] = useState(false);
	const [format, setFormat] = useState<"pdf" | "excel">("pdf");

	const { data: clients } = trpc.clients.list.useQuery();

	const handleSubmit = () => {
		onGenerate({
			type: reportType,
			clientIds: selectedClients,
			dateRange,
			includeAttachments,
			format,
		});
	};

	return (
		<div className="space-y-6">
			{/* Client Selection */}
			<div className="space-y-3">
				<Label>Select Clients</Label>
				<div className="grid max-h-40 gap-2 overflow-y-auto rounded-md border p-3">
					{clients?.map((client) => (
						<div key={client.id} className="flex items-center space-x-2">
							<Checkbox
								id={`client-${client.id}`}
								checked={selectedClients.includes(client.id)}
								onCheckedChange={(checked) => {
									if (checked) {
										setSelectedClients([...selectedClients, client.id]);
									} else {
										setSelectedClients(
											selectedClients.filter((id) => id !== client.id),
										);
									}
								}}
							/>
							<Label htmlFor={`client-${client.id}`} className="text-sm">
								{client.name}
							</Label>
						</div>
					))}
				</div>
			</div>

			{/* Date Range */}
			<div className="space-y-3">
				<Label>Date Range</Label>
				<DateRangePicker value={dateRange} onChange={setDateRange} />
			</div>

			{/* Options */}
			<div className="space-y-4">
				<div className="flex items-center space-x-2">
					<Checkbox
						id="attachments"
						checked={includeAttachments}
						onCheckedChange={setIncludeAttachments}
					/>
					<Label htmlFor="attachments" className="text-sm">
						Include document attachments
					</Label>
				</div>

				<div className="space-y-2">
					<Label>Output Format</Label>
					<Select
						value={format}
						onValueChange={(value: "pdf" | "excel") => setFormat(value)}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="pdf">PDF Document</SelectItem>
							<SelectItem value="excel">Excel Spreadsheet</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Generation Button */}
			<Button
				onClick={handleSubmit}
				disabled={isGenerating || selectedClients.length === 0}
				className="w-full"
			>
				{isGenerating ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Generating Report...
					</>
				) : (
					<>
						<FileText className="mr-2 h-4 w-4" />
						Generate Report
					</>
				)}
			</Button>
		</div>
	);
}

function RecentReportsTable({ reports }: { reports: any[] }) {
	const downloadReport = trpc.reports.download.useMutation();

	const handleDownload = async (reportId: string) => {
		try {
			const result = await downloadReport.mutateAsync({ reportId });
			if (result.downloadUrl) {
				window.open(result.downloadUrl, "_blank");
			}
		} catch (_error) {
			toast.error("Failed to download report");
		}
	};

	if (!reports.length) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				<FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
				<p>No reports generated yet</p>
				<p className="text-sm">
					Generate your first report using the options above
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{reports.map((report) => (
				<div
					key={report.id}
					className="flex items-center justify-between rounded-lg border p-4"
				>
					<div className="flex items-center gap-3">
						<FileText className="h-5 w-5 text-muted-foreground" />
						<div>
							<p className="font-medium text-sm">{report.title}</p>
							<p className="text-muted-foreground text-xs">
								Generated {new Date(report.createdAt).toLocaleDateString()} •
								{report.fileSize} • Expires{" "}
								{new Date(report.expiresAt).toLocaleDateString()}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Badge variant="outline">{report.format.toUpperCase()}</Badge>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => handleDownload(report.id)}
						>
							<Download className="h-4 w-4" />
						</Button>
					</div>
				</div>
			))}
		</div>
	);
}
