"use client";

import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function ComplianceOverview() {
	const { data, isLoading } = trpc.dashboard.complianceOverview.useQuery();

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Compliance Overview</CardTitle>
					<CardDescription>Client compliance score distribution</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<Skeleton key={i} className="h-12 w-full" />
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
	const levels = [
		{
			label: "High Compliance",
			count: data.byLevel.high,
			percentage: total > 0 ? (data.byLevel.high / total) * 100 : 0,
			variant: "success" as const,
			color: "bg-green-500",
		},
		{
			label: "Medium Compliance",
			count: data.byLevel.medium,
			percentage: total > 0 ? (data.byLevel.medium / total) * 100 : 0,
			variant: "warning" as const,
			color: "bg-yellow-500",
		},
		{
			label: "Low Compliance",
			count: data.byLevel.low,
			percentage: total > 0 ? (data.byLevel.low / total) * 100 : 0,
			variant: "destructive" as const,
			color: "bg-red-500",
		},
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Compliance Overview</CardTitle>
				<CardDescription>Client compliance score distribution</CardDescription>
			</CardHeader>
			<CardContent>
				{total === 0 ? (
					<p className="text-sm text-muted-foreground">No compliance scores available yet</p>
				) : (
					<div className="space-y-4">
						{levels.map((level) => (
							<div key={level.label} className="space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Badge variant={level.variant}>{level.label}</Badge>
										<span className="text-sm text-muted-foreground">
											{level.count} client{level.count !== 1 ? "s" : ""}
										</span>
									</div>
									<span className="text-sm font-medium">
										{level.percentage.toFixed(1)}%
									</span>
								</div>
								<div className="w-full bg-gray-200 rounded-full h-2">
									<div
										className={`${level.color} h-2 rounded-full transition-all duration-300`}
										style={{ width: `${level.percentage}%` }}
									/>
								</div>
							</div>
						))}
					</div>
				)}

				{data.recentScores && data.recentScores.length > 0 && (
					<div className="mt-6 pt-6 border-t">
						<h4 className="text-sm font-medium mb-3">Recent Scores</h4>
						<div className="space-y-2">
							{data.recentScores.slice(0, 5).map((score) => (
								<div key={score.id} className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">{score.client.name}</span>
									<Badge
										variant={
											score.level === "high"
												? "success"
												: score.level === "medium"
													? "warning"
													: "destructive"
										}
									>
										{score.score.toFixed(1)}%
									</Badge>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
