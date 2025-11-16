"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Loading component for chart
function ChartSkeleton({ height = 300 }: { height?: number }) {
	return (
		<div className="w-full space-y-3" style={{ height }}>
			<Skeleton className="h-full w-full" />
		</div>
	);
}

// Dynamically import LineChartComponent with loading state
const LineChartComponent = dynamic(
	() =>
		import("../LineChartComponent").then((mod) => ({
			default: mod.LineChartComponent,
		})),
	{
		loading: () => <ChartSkeleton />,
		ssr: false,
	},
);

export { LineChartComponent };
