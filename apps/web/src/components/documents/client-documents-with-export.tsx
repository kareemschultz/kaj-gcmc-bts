"use client";

import { AlertTriangle, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ReportDownloadButton } from "@/components/reports/ReportDownloadButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

interface ClientDocumentsWithExportProps {
	clientId: number;
}

/**
 * Client-specific Documents List with Export Functionality
 *
 * This component shows documents for a specific client and includes
 * an export button to download a PDF report of all documents
 */
export function ClientDocumentsWithExport({
	clientId,
}: ClientDocumentsWithExportProps) {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [status, _setStatus] = useState<string>("");

	const { data, isLoading, error } = trpc.documents.list.useQuery({
		clientId,
		search,
		status: status || undefined,
		page,
		pageSize: 20,
	});

	// Get expiring documents for this client
	const { data: expiringDocs } = trpc.documents.expiring.useQuery({
		days: 30,
	});

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">
						Error loading documents: {error.message}
					</p>
				</CardContent>
			</Card>
		);
	}

	const getStatusBadge = (status: string) => {
		const variants: Record<
			string,
			"success" | "warning" | "destructive" | "secondary"
		> = {
			valid: "success",
			pending_review: "warning",
			expired: "destructive",
			rejected: "destructive",
		};
		return (
			<Badge variant={variants[status] || "secondary"}>
				{status.replace("_", " ")}
			</Badge>
		);
	};

	const isExpiringSoon = (documentId: number) => {
		return expiringDocs?.some(
			(doc: (typeof expiringDocs)[number]) => doc.id === documentId,
		);
	};

	return (
		<div className="space-y-4">
			{expiringDocs && expiringDocs.length > 0 && (
				<Card className="border-yellow-500 bg-yellow-50">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-yellow-900">
							<AlertTriangle className="h-5 w-5" />
							Expiring Documents
						</CardTitle>
						<CardDescription className="text-yellow-800">
							{expiringDocs.length} document(s) expiring in the next 30 days
						</CardDescription>
					</CardHeader>
				</Card>
			)}

			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex flex-1 gap-4">
					<div className="relative min-w-[200px] flex-1">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search documents..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							className="pl-9"
						/>
					</div>
				</div>

				{/* Export Documents List Button */}
				<ReportDownloadButton
					clientId={clientId}
					reportType="documents_list"
					variant="outline"
					size="default"
					label="Export Documents List"
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
								<Skeleton className="mb-2 h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{data?.documents.map(
							(document: (typeof data.documents)[number]) => (
								<Link key={document.id} href={`/documents/${document.id}`}>
									<Card
										className={`cursor-pointer transition-shadow hover:shadow-lg ${
											isExpiringSoon(document.id) ? "border-yellow-500" : ""
										}`}
									>
										<CardHeader>
											<div className="flex items-start justify-between">
												<CardTitle className="text-lg">
													{document.title}
												</CardTitle>
												{isExpiringSoon(document.id) && (
													<AlertTriangle className="h-4 w-4 text-yellow-500" />
												)}
											</div>
											<CardDescription>
												{document.documentType.name}
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-2 text-sm">
												<div className="flex items-center gap-2">
													<span>Status:</span>
													{getStatusBadge(document.status)}
												</div>
												{document.latestVersion?.expiryDate && (
													<p className="text-muted-foreground text-xs">
														Expires:{" "}
														{new Date(
															document.latestVersion.expiryDate,
														).toLocaleDateString()}
													</p>
												)}
												<div className="mt-3 flex gap-4 text-muted-foreground text-xs">
													<span>{document._count.versions} version(s)</span>
												</div>
											</div>
										</CardContent>
									</Card>
								</Link>
							),
						)}
					</div>

					{data && data.documents.length === 0 && (
						<Card>
							<CardContent className="pt-6 text-center text-muted-foreground">
								No documents found.
							</CardContent>
						</Card>
					)}

					{data && data.pagination.totalPages > 1 && (
						<div className="mt-6 flex justify-center gap-2">
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
