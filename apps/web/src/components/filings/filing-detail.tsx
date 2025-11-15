"use client";

import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle } from "lucide-react";

interface FilingDetailProps {
	filingId: number;
}

export function FilingDetail({ filingId }: FilingDetailProps) {
	const { data: filing, isLoading, error } = trpc.filings.get.useQuery({ id: filingId });

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">Error loading filing: {error.message}</p>
					<Link href="/filings">
						<Button variant="outline" className="mt-4">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Filings
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

	if (!filing) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-muted-foreground">Filing not found</p>
					<Link href="/filings">
						<Button variant="outline" className="mt-4">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Filings
						</Button>
					</Link>
				</CardContent>
			</Card>
		);
	}

	const getStatusBadge = (status: string) => {
		const variants: Record<string, "success" | "warning" | "destructive" | "secondary" | "info"> = {
			draft: "secondary",
			prepared: "info",
			submitted: "warning",
			approved: "success",
			rejected: "destructive",
			overdue: "destructive",
			archived: "secondary",
		};
		return <Badge variant={variants[status] || "secondary"}>{status.replace("_", " ")}</Badge>;
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Link href="/filings">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Filings
						</Button>
					</Link>
					<h1 className="text-3xl font-bold mt-2">{filing.filingType.name}</h1>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Filing Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<p className="text-sm font-medium text-muted-foreground">Type</p>
							<p className="text-sm">{filing.filingType.name}</p>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">Status</p>
							<div className="mt-1">{getStatusBadge(filing.status)}</div>
						</div>
						{filing.client && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Client</p>
								<Link href={`/clients/${filing.client.id}`}>
									<p className="text-sm text-blue-600 hover:underline">{filing.client.name}</p>
								</Link>
							</div>
						)}
						{filing.clientBusiness && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Business</p>
								<p className="text-sm">{filing.clientBusiness.name}</p>
							</div>
						)}
						{filing.periodLabel && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Period</p>
								<p className="text-sm">{filing.periodLabel}</p>
							</div>
						)}
						{filing.periodStart && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Period Start</p>
								<p className="text-sm">{new Date(filing.periodStart).toLocaleDateString()}</p>
							</div>
						)}
						{filing.periodEnd && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Period End</p>
								<p className="text-sm">{new Date(filing.periodEnd).toLocaleDateString()}</p>
							</div>
						)}
						{filing.referenceNumber && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Reference Number</p>
								<p className="text-sm">{filing.referenceNumber}</p>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Financial Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{filing.taxAmount !== null && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Tax Amount</p>
								<p className="text-sm">
									${filing.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
								</p>
							</div>
						)}
						{filing.penalties !== null && filing.penalties > 0 && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Penalties</p>
								<p className="text-sm text-destructive">
									${filing.penalties.toLocaleString(undefined, { minimumFractionDigits: 2 })}
								</p>
							</div>
						)}
						{filing.interest !== null && filing.interest > 0 && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Interest</p>
								<p className="text-sm text-destructive">
									${filing.interest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
								</p>
							</div>
						)}
						{filing.total !== null && (
							<div className="pt-3 border-t">
								<p className="text-sm font-medium text-muted-foreground">Total</p>
								<p className="text-lg font-bold">
									${filing.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
								</p>
							</div>
						)}
						{filing.submissionDate && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Submission Date</p>
								<p className="text-sm">{new Date(filing.submissionDate).toLocaleDateString()}</p>
							</div>
						)}
						{filing.approvalDate && (
							<div>
								<p className="text-sm font-medium text-muted-foreground">Approval Date</p>
								<p className="text-sm">{new Date(filing.approvalDate).toLocaleDateString()}</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{filing.internalNotes && (
				<Card>
					<CardHeader>
						<CardTitle>Internal Notes</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm whitespace-pre-wrap">{filing.internalNotes}</p>
					</CardContent>
				</Card>
			)}

			{filing.documents && filing.documents.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Attached Documents</CardTitle>
						<CardDescription>{filing.documents.length} document(s)</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{filing.documents.map((filingDoc) => (
								<Link key={filingDoc.id} href={`/documents/${filingDoc.document.id}`}>
									<div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
										<div className="flex items-center gap-3">
											<FileText className="h-5 w-5 text-muted-foreground" />
											<div>
												<p className="text-sm font-medium">{filingDoc.document.title}</p>
												<p className="text-xs text-muted-foreground">
													{filingDoc.document.documentType.name}
												</p>
											</div>
										</div>
									</div>
								</Link>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{filing.tasks && filing.tasks.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Related Tasks</CardTitle>
						<CardDescription>{filing.tasks.length} task(s)</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{filing.tasks.map((task) => (
								<div
									key={task.id}
									className="flex items-center justify-between p-3 border rounded-lg"
								>
									<div className="flex items-center gap-3">
										<CheckCircle
											className={`h-5 w-5 ${
												task.status === "completed"
													? "text-green-500"
													: "text-muted-foreground"
											}`}
										/>
										<div>
											<p className="text-sm font-medium">{task.title}</p>
											<p className="text-xs text-muted-foreground">
												{task.assignedTo?.name || "Unassigned"}
											</p>
										</div>
									</div>
									<Badge variant={task.status === "completed" ? "success" : "secondary"}>
										{task.status.replace("_", " ")}
									</Badge>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
