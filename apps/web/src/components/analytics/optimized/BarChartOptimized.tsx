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

// Dynamically import BarChartComponent with loading state
const BarChartComponent = dynamic(
	() =>
		import("../BarChartComponent").then((mod) => ({
			default: mod.BarChartComponent,
		})),
	{
		loading: () => <ChartSkeleton />,
		ssr: false,
	},
);

export { BarChartComponent };
