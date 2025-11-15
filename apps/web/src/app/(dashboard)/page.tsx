import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ComplianceOverview } from "@/components/dashboard/compliance-overview";
import { RecentActivity } from "@/components/dashboard/recent-activity";

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
				<h1 className="text-3xl font-bold">Dashboard</h1>
				<p className="text-muted-foreground">Welcome back, {session.user.name || session.user.email}</p>
			</div>

			<div className="space-y-6">
				<StatsCards />
				<div className="grid gap-6 md:grid-cols-2">
					<ComplianceOverview />
					<RecentActivity />
				</div>
			</div>
		</div>
	);
}
