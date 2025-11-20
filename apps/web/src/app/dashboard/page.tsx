import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ComplianceOverview } from "@/components/dashboard/compliance-overview";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PageTransition, ScrollReveal, StaggeredList } from "@/lib/animations";
import { authClient } from "@/lib/auth-client";

export default function DashboardPage() {
	// TEMPORARY: Removed server-side session check to allow client-side AuthGuard to handle authentication
	// This fixes the issue where server-side authClient.getSession() was failing and redirecting before
	// the client-side AuthGuard could properly authenticate the user

	// TODO: Re-implement server-side session validation after fixing server-side authClient configuration

	return (
		<PageTransition animationType="business">
			<div className="container mx-auto py-8">
				<ScrollReveal animationType="slideUp">
					<div className="mb-6">
						<h1 className="font-bold text-3xl">Dashboard</h1>
						<p className="text-muted-foreground">
							Welcome back to your dashboard
						</p>
					</div>
				</ScrollReveal>

				<StaggeredList animationType="business" staggerDelay={0.1}>
					{[
						<ScrollReveal key="stats" animationType="slideUp">
							<StatsCards />
						</ScrollReveal>,
						<ScrollReveal
							key="overview"
							animationType="slideLeft"
							threshold={0.2}
						>
							<div className="grid gap-6 md:grid-cols-2">
								<ComplianceOverview />
								<RecentActivity />
							</div>
						</ScrollReveal>,
					]}
				</StaggeredList>
			</div>
		</PageTransition>
	);
}
