"use client";

import { AlertTriangle, ClipboardList, FileText, Users } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard, ClientCountCard, DocumentCountCard, FilingCountCard } from "@/components/ui/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { AnimatedCard, MonetaryValue, DeadlineWarning, LoadingOverlay } from "@/lib/animations";

const DASHBOARD_SKELETON_KEYS = Array.from(
	{ length: 4 },
	(_, index) => `stats-card-skeleton-${index}`,
);

export function StatsCards() {
	const { data, isLoading } = trpc.dashboard.overview.useQuery();

	if (isLoading) {
		return (
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				{DASHBOARD_SKELETON_KEYS.map((skeletonKey, index) => (
					<AnimatedCard
						key={skeletonKey}
						animationType="business"
						staggerDelay={index * 0.1}
						loading={true}
					>
						<DashboardCard
							title=""
							value=""
							icon={Users}
							loading={true}
						/>
					</AnimatedCard>
				))}
			</div>
		);
	}

	if (!data) {
		return null;
	}

	// Generate trend data (simulate growth/decline)
	const generateTrend = (currentValue: number, previousValue?: number) => {
		if (!previousValue) {
			// Generate realistic trend for demo
			const growth = Math.floor(Math.random() * 20) - 5; // -5% to +15%
			return {
				value: growth,
				positive: growth > 0
			};
		}
		const change = ((currentValue - previousValue) / previousValue) * 100;
		return {
			value: Math.round(change),
			positive: change > 0
		};
	};

	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
			<AnimatedCard
				animationType="business"
				staggerDelay={0.1}
				interactive={true}
				elevation="medium"
			>
				<ClientCountCard
					count={data.counts.clients}
					trend={generateTrend(data.counts.clients)}
				/>
			</AnimatedCard>

			<AnimatedCard
				animationType="business"
				staggerDelay={0.2}
				interactive={true}
				elevation="medium"
			>
				<DocumentCountCard
					count={data.counts.documents}
					trend={generateTrend(data.counts.documents)}
				/>
			</AnimatedCard>

			<AnimatedCard
				animationType="business"
				staggerDelay={0.3}
				interactive={true}
				elevation="medium"
			>
				<FilingCountCard
					count={data.counts.filings}
					trend={generateTrend(data.counts.filings)}
				/>
			</AnimatedCard>

			<AnimatedCard
				animationType={data.alerts.expiringDocuments > 0 ? "glow" : "business"}
				staggerDelay={0.4}
				interactive={true}
				elevation={data.alerts.expiringDocuments > 0 ? "high" : "medium"}
				className={data.alerts.expiringDocuments > 0 ? "ring-2 ring-orange-200 border-orange-300" : ""}
			>
				<DashboardCard
					title="Expiring Documents"
					value={data.alerts.expiringDocuments}
					icon={AlertTriangle}
					trend={data.alerts.expiringDocuments > 0 ? {
						value: data.alerts.expiringDocuments,
						positive: false
					} : undefined}
					href="/documents?status=expiring"
				/>
			</AnimatedCard>
		</div>
	);
}
