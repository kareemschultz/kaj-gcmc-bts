"use client";

import { Download, FileText, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export default function DocumentsPage() {
	const [page, setPage] = useState(1);
	const [searchTerm, setSearchTerm] = useState("");
	const pageSize = 20;

	const { data, isLoading } = trpc.portal.documents.useQuery({
		page,
		pageSize,
	});

	const filteredDocuments =
		data?.documents.filter(
			(doc) =>
				doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				doc.documentType?.name.toLowerCase().includes(searchTerm.toLowerCase()),
		) || [];

	return (
		<div className="container mx-auto space-y-6 p-6">
			<div className="space-y-2">
				<h1 className="font-bold text-3xl">My Documents</h1>
				<p className="text-muted-foreground">
					View and download all your documents
				</p>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search documents..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="pl-10"
				/>
			</div>

			{/* Documents List */}
			<Card>
				<CardHeader>
					<CardTitle>All Documents ({data?.pagination.total || 0})</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-2">
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className="h-16 w-full" />
							))}
						</div>
					) : filteredDocuments.length === 0 ? (
						<div className="py-12 text-center">
							<FileText className="mx-auto h-12 w-12 text-muted-foreground" />
							<p className="mt-4 text-muted-foreground">No documents found</p>
						</div>
					) : (
						<div className="space-y-2">
							{filteredDocuments.map((doc) => (
								<div
									key={doc.id}
									className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent"
								>
									<div className="flex items-center gap-4">
										<FileText className="h-8 w-8 text-blue-600" />
										<div>
											<p className="font-medium">{doc.title}</p>
											<div className="flex items-center gap-2 text-muted-foreground text-sm">
												<span>{doc.documentType?.name}</span>
												<span>•</span>
												<span>
													{new Date(doc.createdAt).toLocaleDateString()}
												</span>
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Badge
											variant={
												doc.status === "active" ? "default" : "secondary"
											}
										>
											{doc.status}
										</Badge>
										{doc.latestVersion && (
											<Button variant="outline" size="sm">
												<Download className="mr-2 h-4 w-4" />
												Download
											</Button>
										)}
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
