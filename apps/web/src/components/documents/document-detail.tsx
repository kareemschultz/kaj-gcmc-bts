"use client";

import { ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

interface DocumentDetailProps {
	documentId: number;
}

export function DocumentDetail({ documentId }: DocumentDetailProps) {
	const {
		data: document,
		isLoading,
		error,
	} = trpc.documents.get.useQuery({ id: documentId });

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">
						Error loading document: {error.message}
					</p>
					<Link href="/documents">
						<Button variant="outline" className="mt-4">
							<ArrowLeft className="mr-2 h-4 w-4" />
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
						<Skeleton className="mb-2 h-4 w-full" />
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
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Documents
						</Button>
					</Link>
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

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Link href="/documents">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Documents
						</Button>
					</Link>
					<h1 className="mt-2 font-bold text-3xl">{document.title}</h1>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Document Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<p className="font-medium text-muted-foreground text-sm">Type</p>
							<p className="text-sm">{document.documentType.name}</p>
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-sm">
								Status
							</p>
							<div className="mt-1">{getStatusBadge(document.status)}</div>
						</div>
						{document.client && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Client
								</p>
								<Link href={`/clients/${document.client.id}`}>
									<p className="text-blue-600 text-sm hover:underline">
										{document.client.name}
									</p>
								</Link>
							</div>
						)}
						{document.clientBusiness && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Business
								</p>
								<p className="text-sm">{document.clientBusiness.name}</p>
							</div>
						)}
						{document.description && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Description
								</p>
								<p className="text-sm">{document.description}</p>
							</div>
						)}
						{document.authority && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Authority
								</p>
								<p className="text-sm">{document.authority}</p>
							</div>
						)}
						{document.tags && document.tags.length > 0 && (
							<div>
								<p className="mb-2 font-medium text-muted-foreground text-sm">
									Tags
								</p>
								<div className="flex flex-wrap gap-2">
									{document.tags.map((tag: string, index: number) => (
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
									<p className="font-medium text-muted-foreground text-sm">
										Issue Date
									</p>
									<p className="text-sm">
										{new Date(
											document.latestVersion.issueDate,
										).toLocaleDateString()}
									</p>
								</div>
							)}
							{document.latestVersion.expiryDate && (
								<div>
									<p className="font-medium text-muted-foreground text-sm">
										Expiry Date
									</p>
									<p className="text-sm">
										{new Date(
											document.latestVersion.expiryDate,
										).toLocaleDateString()}
									</p>
								</div>
							)}
							{document.latestVersion.issuingAuthority && (
								<div>
									<p className="font-medium text-muted-foreground text-sm">
										Issuing Authority
									</p>
									<p className="text-sm">
										{document.latestVersion.issuingAuthority}
									</p>
								</div>
							)}
							{document.latestVersion.fileSize && (
								<div>
									<p className="font-medium text-muted-foreground text-sm">
										File Size
									</p>
									<p className="text-sm">
										{(document.latestVersion.fileSize / 1024 / 1024).toFixed(2)}{" "}
										MB
									</p>
								</div>
							)}
							{document.latestVersion.mimeType && (
								<div>
									<p className="font-medium text-muted-foreground text-sm">
										File Type
									</p>
									<p className="text-sm">{document.latestVersion.mimeType}</p>
								</div>
							)}
							<Button className="mt-4 w-full">
								<Download className="mr-2 h-4 w-4" />
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
						<CardDescription>
							{document.versions.length} version(s)
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{document.versions.map(
								(version: (typeof document.versions)[number]) => (
									<div
										key={version.id}
										className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
									>
										<div className="flex items-center gap-3">
											<FileText className="h-5 w-5 text-muted-foreground" />
											<div>
												<p className="font-medium text-sm">
													Version {version.versionNumber}
													{version.id === document.latestVersion?.id && (
														<Badge variant="secondary" className="ml-2">
															Current
														</Badge>
													)}
												</p>
												<p className="text-muted-foreground text-xs">
													Uploaded:{" "}
													{new Date(version.uploadedAt).toLocaleDateString()}
												</p>
											</div>
										</div>
										<Button variant="outline" size="sm">
											<Download className="h-4 w-4" />
										</Button>
									</div>
								),
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
