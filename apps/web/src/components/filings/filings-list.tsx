"use client";

import { AlertTriangle, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export function FilingsList() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState<string>("");

	const { data, isLoading, error } = trpc.filings.list.useQuery({
		search,
		status: status || undefined,
		page,
		pageSize: 20,
	});

	// Get overdue filings
	const { data: overdueFiling } = trpc.filings.overdue.useQuery();

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">
						Error loading filings: {error.message}
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
			draft: "secondary",
			prepared: "secondary",
			submitted: "warning",
			approved: "success",
			rejected: "destructive",
			overdue: "destructive",
			archived: "secondary",
		};
		return (
			<Badge variant={variants[status] || "secondary"}>
				{status.replace("_", " ")}
			</Badge>
		);
	};

	const isOverdue = (filingId: number) => {
		return overdueFiling?.some(
			(filing: (typeof overdueFiling)[number]) => filing.id === filingId,
		);
	};

	return (
		<div className="space-y-4">
			{overdueFiling && overdueFiling.length > 0 && (
				<Card className="border-red-500 bg-red-50">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-red-900">
							<AlertTriangle className="h-5 w-5" />
							Overdue Filings
						</CardTitle>
						<CardDescription className="text-red-800">
							{overdueFiling.length} overdue filing(s) require immediate
							attention
						</CardDescription>
					</CardHeader>
				</Card>
			)}

			<div className="flex flex-wrap gap-4">
				<div className="relative min-w-[200px] flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
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
				<Select
					value={status}
					onChange={(e) => {
						setStatus(e.target.value);
						setPage(1);
					}}
				>
					<option value="">All Status</option>
					<option value="draft">Draft</option>
					<option value="prepared">Prepared</option>
					<option value="submitted">Submitted</option>
					<option value="approved">Approved</option>
					<option value="rejected">Rejected</option>
					<option value="overdue">Overdue</option>
					<option value="archived">Archived</option>
				</Select>
				<Link href="/filings/new">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						New Filing
					</Button>
				</Link>
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
						{data?.filings.map((filing: (typeof data.filings)[number]) => (
							<Link key={filing.id} href={`/filings/${filing.id}`}>
								<Card
									className={`cursor-pointer transition-shadow hover:shadow-lg ${
										isOverdue(filing.id) ? "border-red-500" : ""
									}`}
								>
									<CardHeader>
										<div className="flex items-start justify-between">
											<CardTitle className="text-lg">
												{filing.filingType.name}
											</CardTitle>
											{isOverdue(filing.id) && (
												<AlertTriangle className="h-4 w-4 text-red-500" />
											)}
										</div>
										<CardDescription>
											{filing.periodLabel || "No period specified"}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-2 text-sm">
											{filing.client && (
												<p className="text-muted-foreground">
													Client: {filing.client.name}
												</p>
											)}
											<div className="flex items-center gap-2">
												<span>Status:</span>
												{getStatusBadge(filing.status)}
											</div>
											{filing.periodEnd && (
												<p className="text-muted-foreground text-xs">
													Period End:{" "}
													{new Date(filing.periodEnd).toLocaleDateString()}
												</p>
											)}
											{filing.referenceNumber && (
												<p className="text-muted-foreground text-xs">
													Ref: {filing.referenceNumber}
												</p>
											)}
											<div className="mt-3 flex gap-4 text-muted-foreground text-xs">
												<span>{filing._count.documents} doc(s)</span>
												<span>{filing._count.tasks} task(s)</span>
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>

					{data && data.filings.length === 0 && (
						<Card>
							<CardContent className="pt-6 text-center text-muted-foreground">
								No filings found. Create your first filing to get started.
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
