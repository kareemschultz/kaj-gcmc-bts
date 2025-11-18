import { ArrowRight, Building2, Calendar, FileText } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ComplianceOverview } from "@/components/dashboard/compliance-overview";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TaxFilingStatusGrid } from "@/components/dashboard/tax-filing-widgets";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default async function DashboardPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
			throw: true,
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="container mx-auto py-8">
			<div className="mb-6">
				<h1 className="font-bold text-3xl">Dashboard</h1>
				<p className="text-muted-foreground">
					Welcome back, {session.user.name || session.user.email}
				</p>
			</div>

			<div className="space-y-6">
				{/* Main Stats */}
				<StatsCards />

				{/* Guyana Compliance Quick Access */}
				<Card className="border-l-4 border-l-brand bg-gradient-to-r from-brand/5 to-transparent">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="flex items-center gap-2">
									<Building2 className="h-5 w-5 text-brand" />
									Guyana Tax Compliance
								</CardTitle>
								<CardDescription>
									Quick access to GRA filing status, tax deadlines, and
									compliance tools
								</CardDescription>
							</div>
							<div className="flex gap-2">
								<Link href="/guyana-compliance">
									<Button variant="outline" size="sm">
										<Calendar className="mr-2 h-4 w-4" />
										View Full Dashboard
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</Link>
								<Link href="/reports">
									<Button size="sm">
										<FileText className="mr-2 h-4 w-4" />
										Generate Reports
									</Button>
								</Link>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<TaxFilingStatusGrid />
					</CardContent>
				</Card>

				{/* Existing Dashboard Components */}
				<div className="grid gap-6 md:grid-cols-2">
					<ComplianceOverview />
					<RecentActivity />
				</div>
			</div>
		</div>
	);
}
