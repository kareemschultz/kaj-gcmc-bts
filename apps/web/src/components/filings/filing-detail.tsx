"use client";

import { ArrowLeft, CheckCircle, FileText } from "lucide-react";
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

interface FilingDetailProps {
	filingId: number;
}

export function FilingDetail({ filingId }: FilingDetailProps) {
	const {
		data: filing,
		isLoading,
		error,
	} = trpc.filings.get.useQuery({ id: filingId });

	if (error) {
		return (
			<Card>
				<CardContent className="pt-6">
					<p className="text-destructive">
						Error loading filing: {error.message}
					</p>
					<Link href="/filings">
						<Button variant="outline" className="mt-4">
							<ArrowLeft className="mr-2 h-4 w-4" />
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
						<Skeleton className="mb-2 h-4 w-full" />
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
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Filings
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

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Link href="/filings">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Filings
						</Button>
					</Link>
					<h1 className="mt-2 font-bold text-3xl">{filing.filingType.name}</h1>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Filing Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div>
							<p className="font-medium text-muted-foreground text-sm">Type</p>
							<p className="text-sm">{filing.filingType.name}</p>
						</div>
						<div>
							<p className="font-medium text-muted-foreground text-sm">
								Status
							</p>
							<div className="mt-1">{getStatusBadge(filing.status)}</div>
						</div>
						{filing.client && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Client
								</p>
								<Link href={`/clients/${filing.client.id}`}>
									<p className="text-blue-600 text-sm hover:underline">
										{filing.client.name}
									</p>
								</Link>
							</div>
						)}
						{filing.clientBusiness && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Business
								</p>
								<p className="text-sm">{filing.clientBusiness.name}</p>
							</div>
						)}
						{filing.periodLabel && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Period
								</p>
								<p className="text-sm">{filing.periodLabel}</p>
							</div>
						)}
						{filing.periodStart && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Period Start
								</p>
								<p className="text-sm">
									{new Date(filing.periodStart).toLocaleDateString()}
								</p>
							</div>
						)}
						{filing.periodEnd && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Period End
								</p>
								<p className="text-sm">
									{new Date(filing.periodEnd).toLocaleDateString()}
								</p>
							</div>
						)}
						{filing.referenceNumber && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Reference Number
								</p>
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
								<p className="font-medium text-muted-foreground text-sm">
									Tax Amount
								</p>
								<p className="text-sm">
									$
									{filing.taxAmount.toLocaleString(undefined, {
										minimumFractionDigits: 2,
									})}
								</p>
							</div>
						)}
						{filing.penalties !== null && filing.penalties > 0 && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Penalties
								</p>
								<p className="text-destructive text-sm">
									$
									{filing.penalties.toLocaleString(undefined, {
										minimumFractionDigits: 2,
									})}
								</p>
							</div>
						)}
						{filing.interest !== null && filing.interest > 0 && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Interest
								</p>
								<p className="text-destructive text-sm">
									$
									{filing.interest.toLocaleString(undefined, {
										minimumFractionDigits: 2,
									})}
								</p>
							</div>
						)}
						{filing.total !== null && (
							<div className="border-t pt-3">
								<p className="font-medium text-muted-foreground text-sm">
									Total
								</p>
								<p className="font-bold text-lg">
									$
									{filing.total.toLocaleString(undefined, {
										minimumFractionDigits: 2,
									})}
								</p>
							</div>
						)}
						{filing.submissionDate && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Submission Date
								</p>
								<p className="text-sm">
									{new Date(filing.submissionDate).toLocaleDateString()}
								</p>
							</div>
						)}
						{filing.approvalDate && (
							<div>
								<p className="font-medium text-muted-foreground text-sm">
									Approval Date
								</p>
								<p className="text-sm">
									{new Date(filing.approvalDate).toLocaleDateString()}
								</p>
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
						<p className="whitespace-pre-wrap text-sm">
							{filing.internalNotes}
						</p>
					</CardContent>
				</Card>
			)}

			{filing.documents && filing.documents.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Attached Documents</CardTitle>
						<CardDescription>
							{filing.documents.length} document(s)
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{filing.documents.map(
								(filingDoc: (typeof filing.documents)[number]) => (
									<Link
										key={filingDoc.id}
										href={`/documents/${filingDoc.document.id}`}
									>
										<div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
											<div className="flex items-center gap-3">
												<FileText className="h-5 w-5 text-muted-foreground" />
												<div>
													<p className="font-medium text-sm">
														{filingDoc.document.title}
													</p>
													<p className="text-muted-foreground text-xs">
														{filingDoc.document.documentType.name}
													</p>
												</div>
											</div>
										</div>
									</Link>
								),
							)}
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
							{filing.tasks.map((task: (typeof filing.tasks)[number]) => (
								<div
									key={task.id}
									className="flex items-center justify-between rounded-lg border p-3"
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
											<p className="font-medium text-sm">{task.title}</p>
											<p className="text-muted-foreground text-xs">
												{task.assignedTo?.name || "Unassigned"}
											</p>
										</div>
									</div>
									<Badge
										variant={
											task.status === "completed" ? "success" : "secondary"
										}
									>
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
