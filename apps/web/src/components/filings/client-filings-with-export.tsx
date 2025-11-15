"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ReportDownloadButton } from "@/components/reports/ReportDownloadButton";
import Link from "next/link";
import { Plus, Search, AlertTriangle } from "lucide-react";

interface ClientFilingsWithExportProps {
	clientId: number;
}

/**
 * Client-specific Filings List with Export Functionality
 *
 * This component shows filings for a specific client and includes
 * an export button to download a PDF report of all filings
 */
export function ClientFilingsWithExport({ clientId }: ClientFilingsWithExportProps) {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState<string>("");

	const { data, isLoading, error } = trpc.filings.list.useQuery({
		clientId,
		search,
		status: status || undefined,
		page,
		pageSize: 20,
	});

	// Get overdue filings for this client
	const { data: overdueFilings } = trpc.filings.overdue.useQuery({
		clientId,
	});

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">Error loading filings: {error.message}</p>
				</CardContent>
			</Card>
		);
	}

	const getStatusBadge = (status: string) => {
		const variants: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
			draft: "secondary",
			prepared: "secondary",
			submitted: "warning",
			approved: "success",
			rejected: "destructive",
			overdue: "destructive",
			archived: "secondary",
		};
		return <Badge variant={variants[status] || "secondary"}>{status.replace("_", " ")}</Badge>;
	};

	const isOverdue = (filingId: number) => {
		return overdueFilings?.some((filing) => filing.id === filingId);
	};

	return (
		<div className="space-y-4">
			{overdueFilings && overdueFilings.length > 0 && (
				<Card className="border-red-500 bg-red-50">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-red-900">
							<AlertTriangle className="h-5 w-5" />
							Overdue Filings
						</CardTitle>
						<CardDescription className="text-red-800">
							{overdueFilings.length} overdue filing(s) require immediate attention
						</CardDescription>
					</CardHeader>
				</Card>
			)}

			<div className="flex gap-4 flex-wrap justify-between items-center">
				<div className="flex gap-4 flex-1">
					<div className="relative flex-1 min-w-[200px]">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search filings..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							className="pl-9"
						/>
					</div>
				</div>

				{/* Export Filings Summary Button */}
				<ReportDownloadButton
					clientId={clientId}
					reportType="filings_summary"
					variant="outline"
					size="default"
					label="Export Filings Summary"
				/>
			</div>

			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<Card key={i}>
							<CardHeader>
								<Skeleton className="h-6 w-32" />
								<Skeleton className="h-4 w-24" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-4 w-full mb-2" />
								<Skeleton className="h-4 w-3/4" />
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{data?.filings.map((filing) => (
							<Link key={filing.id} href={`/filings/${filing.id}`}>
								<Card
									className={`hover:shadow-lg transition-shadow cursor-pointer ${
										isOverdue(filing.id) ? "border-red-500" : ""
									}`}
								>
									<CardHeader>
										<div className="flex items-start justify-between">
											<CardTitle className="text-lg">{filing.filingType.name}</CardTitle>
											{isOverdue(filing.id) && (
												<AlertTriangle className="h-4 w-4 text-red-500" />
											)}
										</div>
										<CardDescription>
											{filing.periodLabel ||
												(filing.periodStart
													? new Date(filing.periodStart).toLocaleDateString()
													: "N/A")}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-2 text-sm">
											<div className="flex items-center gap-2">
												<span>Status:</span>
												{getStatusBadge(filing.status)}
											</div>
											{filing.submissionDate && (
												<p className="text-muted-foreground text-xs">
													Submitted: {new Date(filing.submissionDate).toLocaleDateString()}
												</p>
											)}
											{filing.total !== null && (
												<p className="text-muted-foreground text-xs">
													Total: ${filing.total.toFixed(2)}
												</p>
											)}
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>

					{data && data.filings.length === 0 && (
						<Card>
							<CardContent className="pt-6 text-center text-muted-foreground">
								No filings found.
							</CardContent>
						</Card>
					)}

					{data && data.pagination.totalPages > 1 && (
						<div className="flex justify-center gap-2 mt-6">
							<Button
								variant="outline"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
							>
								Previous
							</Button>
							<span className="flex items-center px-4">
								Page {page} of {data.pagination.totalPages}
							</span>
							<Button
								variant="outline"
								onClick={() => setPage((p) => p + 1)}
								disabled={page >= data.pagination.totalPages}
							>
								Next
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
