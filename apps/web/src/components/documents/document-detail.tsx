"use client";

import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";

interface DocumentDetailProps {
	documentId: number;
}

export function DocumentDetail({ documentId }: DocumentDetailProps) {
	const { data: document, isLoading, error } = trpc.documents.get.useQuery({ id: documentId });

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">Error loading document: {error.message}</p>
					<Link href="/documents">
						<Button variant="outline" className="mt-4">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Documents
						</Button>
					</Link>
				</CardContent>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-64" />
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-32" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-4 w-full mb-2" />
						<Skeleton className="h-4 w-3/4" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!document) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-muted-foreground">Document not found</p>
					<Link href="/documents">
						<Button variant="outline" className="mt-4">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Documents
						</Button>
					</Link>
				</CardContent>
			</Card>
		);
	}

	const getStatusBadge = (status: string) => {
		const variants: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
			valid: "success",
			pending_review: "warning",
			expired: "destructive",
			rejected: "destructive",
		};
		return <Badge variant={variants[status] || "secondary"}>{status.replace("_", " ")}</Badge>;
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Link href="/documents">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Documents
						</Button>
					</Link>
					<h1 className="text-3xl font-bold mt-2">{document.title}</h1>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Document Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<p className="text-sm font-medium text-muted-foreground">Type</p>
							<p className="text-sm">{document.documentType.name}</p>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Status</p>
							<div className="mt-1">{getStatusBadge(document.status)}</div>
						</div>
						{document.client && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Client</p>
								<Link href={`/clients/${document.client.id}`}>
									<p className="text-sm text-blue-600 hover:underline">{document.client.name}</p>
								</Link>
							</div>
						)}
						{document.clientBusiness && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Business</p>
								<p className="text-sm">{document.clientBusiness.name}</p>
							</div>
						)}
						{document.description && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Description</p>
								<p className="text-sm">{document.description}</p>
							</div>
						)}
						{document.authority && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Authority</p>
								<p className="text-sm">{document.authority}</p>
							</div>
						)}
						{document.tags && document.tags.length > 0 && (
							<div>
								<p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
								<div className="flex flex-wrap gap-2">
									{document.tags.map((tag, index) => (
										<Badge key={index} variant="secondary">
											{tag}
										</Badge>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{document.latestVersion && (
					<Card>
						<CardHeader>
							<CardTitle>Current Version</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{document.latestVersion.issueDate && (
								<div>
									<p className="text-sm font-medium text-muted-foreground">Issue Date</p>
									<p className="text-sm">
										{new Date(document.latestVersion.issueDate).toLocaleDateString()}
									</p>
								</div>
							)}
							{document.latestVersion.expiryDate && (
								<div>
									<p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
									<p className="text-sm">
										{new Date(document.latestVersion.expiryDate).toLocaleDateString()}
									</p>
								</div>
							)}
							{document.latestVersion.issuingAuthority && (
								<div>
									<p className="text-sm font-medium text-muted-foreground">Issuing Authority</p>
									<p className="text-sm">{document.latestVersion.issuingAuthority}</p>
								</div>
							)}
							{document.latestVersion.fileSize && (
								<div>
									<p className="text-sm font-medium text-muted-foreground">File Size</p>
									<p className="text-sm">
										{(document.latestVersion.fileSize / 1024 / 1024).toFixed(2)} MB
									</p>
								</div>
							)}
							{document.latestVersion.mimeType && (
								<div>
									<p className="text-sm font-medium text-muted-foreground">File Type</p>
									<p className="text-sm">{document.latestVersion.mimeType}</p>
								</div>
							)}
							<Button className="w-full mt-4">
								<Download className="h-4 w-4 mr-2" />
								Download Document
							</Button>
						</CardContent>
					</Card>
				)}
			</div>

			{document.versions && document.versions.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Version History</CardTitle>
						<CardDescription>{document.versions.length} version(s)</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{document.versions.map((version) => (
								<div
									key={version.id}
									className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
								>
									<div className="flex items-center gap-3">
										<FileText className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="text-sm font-medium">
												Version {version.versionNumber}
												{version.id === document.latestVersion?.id && (
													<Badge variant="secondary" className="ml-2">
														Current
													</Badge>
												)}
											</p>
											<p className="text-xs text-muted-foreground">
												Uploaded: {new Date(version.uploadedAt).toLocaleDateString()}
											</p>
										</div>
									</div>
									<Button variant="outline" size="sm">
										<Download className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
