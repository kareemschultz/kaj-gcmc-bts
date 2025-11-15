"use client";

import { Briefcase, Calendar, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export default function FilingsPage() {
	const [page, setPage] = useState(1);
	const [searchTerm, setSearchTerm] = useState("");
	const pageSize = 20;

	const { data, isLoading } = trpc.portal.filings.useQuery({
		page,
		pageSize,
	});

	const filteredFilings =
		data?.filings.filter(
			(filing) =>
				filing.filingType?.name
					.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				filing.status.toLowerCase().includes(searchTerm.toLowerCase()),
		) || [];

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case "completed":
				return "default";
			case "pending":
				return "secondary";
			case "in_progress":
				return "outline";
			default:
				return "secondary";
		}
	};

	return (
		<div className="container mx-auto space-y-6 p-6">
			<div className="space-y-2">
				<h1 className="font-bold text-3xl">My Filings</h1>
				<p className="text-muted-foreground">
					Track all your tax filings and compliance submissions
				</p>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search filings..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="pl-10"
				/>
			</div>

			{/* Filings List */}
			<Card>
				<CardHeader>
					<CardTitle>All Filings ({data?.pagination.total || 0})</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-2">
							{[...Array(5)].map((_, i) => (
								<Skeleton /* biome-ignore lint/suspicious/noArrayIndexKey: skeleton loaders are temporary UI elements that do not persist */
									key={`skeleton-${i}`}
									className="h-20 w-full"
								/>
							))}
						</div>
					) : filteredFilings.length === 0 ? (
						<div className="py-12 text-center">
							<Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
							<p className="mt-4 text-muted-foreground">No filings found</p>
						</div>
					) : (
						<div className="space-y-2">
							{filteredFilings.map((filing) => (
								<div
									key={filing.id}
									className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent"
								>
									<div className="flex items-center gap-4">
										<Briefcase className="h-8 w-8 text-green-600" />
										<div className="space-y-1">
											<p className="font-medium">{filing.filingType?.name}</p>
											<div className="flex items-center gap-2 text-muted-foreground text-sm">
												<Calendar className="h-3 w-3" />
												<span>
													Due: {new Date(filing.dueDate).toLocaleDateString()}
												</span>
												{filing.filedDate && (
													<>
														<span>•</span>
														<span>
															Filed:{" "}
															{new Date(filing.filedDate).toLocaleDateString()}
														</span>
													</>
												)}
											</div>
											{filing.notes && (
												<p className="text-muted-foreground text-sm">
													{filing.notes}
												</p>
											)}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Badge variant={getStatusColor(filing.status)}>
											{filing.status}
										</Badge>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Pagination */}
					{data && data.pagination.totalPages > 1 && (
						<div className="mt-4 flex items-center justify-between">
							<p className="text-muted-foreground text-sm">
								Page {page} of {data.pagination.totalPages}
							</p>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={page === 1}
									onClick={() => setPage((p) => Math.max(1, p - 1))}
								>
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={page === data.pagination.totalPages}
									onClick={() =>
										setPage((p) => Math.min(data.pagination.totalPages, p + 1))
									}
								>
									Next
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
