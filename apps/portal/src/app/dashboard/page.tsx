"use client";

import { Briefcase, CheckSquare, FileText, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export default function DashboardPage() {
	const { data: dashboardData, isLoading: isDashboardLoading } =
		trpc.portal.dashboard.useQuery();
	const { data: documentsData, isLoading: isDocumentsLoading } =
		trpc.portal.documents.useQuery({ page: 1, pageSize: 5 });
	const { data: filingsData, isLoading: isFilingsLoading } =
		trpc.portal.filings.useQuery({ page: 1, pageSize: 5 });
	const { data: tasksData, isLoading: isTasksLoading } =
		trpc.portal.tasks.useQuery({ page: 1, pageSize: 5 });

	const stats = [
		{
			title: "Total Documents",
			value: dashboardData?.counts.documents ?? 0,
			icon: FileText,
			href: "/documents",
			color: "text-blue-600",
		},
		{
			title: "Active Filings",
			value: dashboardData?.counts.filings ?? 0,
			icon: Briefcase,
			href: "/filings",
			color: "text-green-600",
		},
		{
			title: "Pending Tasks",
			value: dashboardData?.counts.activeTasks ?? 0,
			icon: CheckSquare,
			href: "/tasks",
			color: "text-orange-600",
		},
		{
			title: "Service Requests",
			value: dashboardData?.counts.serviceRequests ?? 0,
			icon: MessageSquare,
			href: "/messages",
			color: "text-purple-600",
		},
	];

	return (
		<div className="container mx-auto space-y-8 p-6">
			<div className="space-y-2">
				<h1 className="font-bold text-3xl">Dashboard</h1>
				<p className="text-muted-foreground">
					Welcome back! Here's an overview of your account.
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{stats.map((stat) => {
					const Icon = stat.icon;
					return (
						<Link key={stat.title} href={stat.href}>
							<Card className="transition-shadow hover:shadow-lg">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="font-medium text-sm">
										{stat.title}
									</CardTitle>
									<Icon className={`h-4 w-4 ${stat.color}`} />
								</CardHeader>
								<CardContent>
									{isDashboardLoading ? (
										<Skeleton className="h-8 w-16" />
									) : (
										<div className="font-bold text-2xl">{stat.value}</div>
									)}
								</CardContent>
							</Card>
						</Link>
					);
				})}
			</div>

			{/* Recent Documents */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Recent Documents</CardTitle>
						<Link
							href="/documents"
							className="text-primary text-sm hover:underline"
						>
							View all
						</Link>
					</div>
				</CardHeader>
				<CardContent>
					{isDocumentsLoading ? (
						<div className="space-y-2">
							{[...Array(3)].map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					) : documentsData?.documents.length === 0 ? (
						<p className="text-center text-muted-foreground text-sm">
							No documents found
						</p>
					) : (
						<div className="space-y-2">
							{documentsData?.documents.slice(0, 5).map((doc) => (
								<div
									key={doc.id}
									className="flex items-center justify-between rounded-lg border p-3"
								>
									<div className="flex items-center gap-3">
										<FileText className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="font-medium">{doc.title}</p>
											<p className="text-muted-foreground text-sm">
												{doc.documentType?.name}
											</p>
										</div>
									</div>
									<Badge
										variant={doc.status === "active" ? "default" : "secondary"}
									>
										{doc.status}
									</Badge>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<div className="grid gap-4 md:grid-cols-2">
				{/* Upcoming Filings */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Upcoming Filings</CardTitle>
							<Link
								href="/filings"
								className="text-primary text-sm hover:underline"
							>
								View all
							</Link>
						</div>
					</CardHeader>
					<CardContent>
						{isFilingsLoading ? (
							<div className="space-y-2">
								{[...Array(3)].map((_, i) => (
									<Skeleton key={i} className="h-12 w-full" />
								))}
							</div>
						) : filingsData?.filings.length === 0 ? (
							<p className="text-center text-muted-foreground text-sm">
								No filings found
							</p>
						) : (
							<div className="space-y-2">
								{filingsData?.filings.slice(0, 5).map((filing) => (
									<div
										key={filing.id}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<div>
											<p className="font-medium">{filing.filingType?.name}</p>
											<p className="text-muted-foreground text-sm">
												Due: {new Date(filing.dueDate).toLocaleDateString()}
											</p>
										</div>
										<Badge>{filing.status}</Badge>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Recent Tasks */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Recent Tasks</CardTitle>
							<Link
								href="/tasks"
								className="text-primary text-sm hover:underline"
							>
								View all
							</Link>
						</div>
					</CardHeader>
					<CardContent>
						{isTasksLoading ? (
							<div className="space-y-2">
								{[...Array(3)].map((_, i) => (
									<Skeleton key={i} className="h-12 w-full" />
								))}
							</div>
						) : tasksData?.tasks.length === 0 ? (
							<p className="text-center text-muted-foreground text-sm">
								No tasks found
							</p>
						) : (
							<div className="space-y-2">
								{tasksData?.tasks.slice(0, 5).map((task) => (
									<div
										key={task.id}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<div>
											<p className="font-medium">{task.title}</p>
											<p className="text-muted-foreground text-sm">
												Due:{" "}
												{task.dueDate
													? new Date(task.dueDate).toLocaleDateString()
													: "No due date"}
											</p>
										</div>
										<Badge
											variant={
												task.status === "completed" ? "default" : "secondary"
											}
										>
											{task.status}
										</Badge>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
