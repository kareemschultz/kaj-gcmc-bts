"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ComplianceGauge,
	DashboardComplianceOverview,
} from "@/components/ui/compliance-gauge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

const COMPLIANCE_SKELETON_KEYS = [
	"compliance-skeleton-0",
	"compliance-skeleton-1",
	"compliance-skeleton-2",
];

export function ComplianceOverview() {
	const { data, isLoading } = trpc.dashboard.complianceOverview.useQuery();

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Compliance Overview</CardTitle>
					<CardDescription>
						Client compliance score distribution
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{COMPLIANCE_SKELETON_KEYS.map((skeletonKey) => (
							<Skeleton key={skeletonKey} className="h-12 w-full" />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!data) {
		return null;
	}

	const total = data.total;

	// Calculate overall compliance score
	const overallScore =
		total > 0
			? (data.byLevel.high * 100 +
					data.byLevel.medium * 70 +
					data.byLevel.low * 30) /
				total
			: 0;

	const levels = [
		{
			label: "Excellent (90-100%)",
			count: data.byLevel.high,
			percentage: total > 0 ? (data.byLevel.high / total) * 100 : 0,
			variant: "success" as const,
			color: "bg-green-500",
		},
		{
			label: "Good (70-89%)",
			count: data.byLevel.medium,
			percentage: total > 0 ? (data.byLevel.medium / total) * 100 : 0,
			variant: "warning" as const,
			color: "bg-yellow-500",
		},
		{
			label: "Needs Improvement (<70%)",
			count: data.byLevel.low,
			percentage: total > 0 ? (data.byLevel.low / total) * 100 : 0,
			variant: "destructive" as const,
			color: "bg-red-500",
		},
	];

	// Mock agency data for demonstration
	const agencies = [
		{
			name: "GRA (Guyana Revenue Authority)",
			score: 85,
			requirements: { total: 12, completed: 10, overdue: 1 },
		},
		{
			name: "DCRA (Deeds & Commercial Registry)",
			score: 92,
			requirements: { total: 8, completed: 8, overdue: 0 },
		},
		{
			name: "NIS (National Insurance Scheme)",
			score: 78,
			requirements: { total: 6, completed: 5, overdue: 1 },
		},
		{
			name: "EPA (Environmental Protection)",
			score: 95,
			requirements: { total: 4, completed: 4, overdue: 0 },
		},
	];

	if (total === 0) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
			>
				<DashboardComplianceOverview overallScore={0} agencies={agencies} />
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<Card className="border-l-4 border-l-green-500">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								Compliance Dashboard
							</CardTitle>
							<CardDescription>
								Overall compliance score and agency breakdown
							</CardDescription>
						</div>
						<div className="text-right">
							<div className="font-bold text-2xl text-green-600">
								{overallScore.toFixed(0)}%
							</div>
							<div className="text-muted-foreground text-sm">Overall Score</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid gap-6 md:grid-cols-2">
						{/* Overall Compliance Gauge */}
						<div className="flex flex-col items-center">
							<h3 className="mb-4 font-medium text-gray-700 text-lg">
								Portfolio Health
							</h3>
							<ComplianceGauge score={overallScore} size="lg" />
						</div>

						{/* Client Distribution */}
						<div className="space-y-4">
							<h3 className="mb-4 font-medium text-gray-700 text-lg">
								Client Distribution
							</h3>
							{levels.map((level, index) => (
								<motion.div
									key={level.label}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: index * 0.1, duration: 0.3 }}
									className="space-y-2"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Badge variant={level.variant} className="min-w-fit">
												{level.label.split(" (")[0]}
											</Badge>
											<span className="text-muted-foreground text-sm">
												{level.count} client{level.count !== 1 ? "s" : ""}
											</span>
										</div>
										<span className="font-medium text-sm">
											{level.percentage.toFixed(1)}%
										</span>
									</div>
									<div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
										<motion.div
											className={`${level.color} h-3 rounded-full`}
											initial={{ width: 0 }}
											animate={{ width: `${level.percentage}%` }}
											transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
										/>
									</div>
								</motion.div>
							))}
						</div>
					</div>

					{/* Recent Scores */}
					{data.recentScores && data.recentScores.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4, duration: 0.3 }}
							className="mt-8 border-t pt-6"
						>
							<h4 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
								Recent Client Scores
								<Badge variant="outline" className="text-xs">
									{data.recentScores.length} total
								</Badge>
							</h4>
							<div className="grid gap-3 md:grid-cols-2">
								{data.recentScores
									.slice(0, 6)
									.map((score: (typeof data.recentScores)[number], index) => (
										<motion.div
											key={score.id}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05, duration: 0.2 }}
											className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
										>
											<span className="font-medium text-gray-900 text-sm">
												{score.client.name}
											</span>
											<div className="flex items-center gap-2">
												<ComplianceGauge
													score={score.score}
													size="sm"
													showLabel={false}
													animated={false}
												/>
												<Badge
													variant={
														score.level === "high"
															? "success"
															: score.level === "medium"
																? "warning"
																: "destructive"
													}
													className="text-xs"
												>
													{score.score.toFixed(0)}%
												</Badge>
											</div>
										</motion.div>
									))}
							</div>
						</motion.div>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
}
