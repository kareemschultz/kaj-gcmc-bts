"use client";

import { AlertTriangle, ClipboardList, FileText, Users } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard, ClientCountCard, DocumentCountCard, FilingCountCard } from "@/components/ui/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { motion } from 'framer-motion';

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
					<motion.div
						key={skeletonKey}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1, duration: 0.3 }}
					>
						<DashboardCard
							title=""
							value=""
							icon={Users}
							loading={true}
						/>
					</motion.div>
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
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
			>
				<ClientCountCard
					count={data.counts.clients}
					trend={generateTrend(data.counts.clients)}
				/>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
			>
				<DocumentCountCard
					count={data.counts.documents}
					trend={generateTrend(data.counts.documents)}
				/>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
			>
				<FilingCountCard
					count={data.counts.filings}
					trend={generateTrend(data.counts.filings)}
				/>
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
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
					className={data.alerts.expiringDocuments > 0 ? "ring-2 ring-orange-200 border-orange-300" : ""}
				/>
			</motion.div>
		</div>
	);
}
