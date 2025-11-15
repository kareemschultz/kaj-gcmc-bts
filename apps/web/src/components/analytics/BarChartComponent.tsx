"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface BarChartData {
	[key: string]: string | number;
}

interface BarChartComponentProps {
	data: BarChartData[];
	bars: Array<{
		dataKey: string;
		fill?: string;
		name?: string;
	}>;
	xAxisKey: string;
	height?: number;
	showGrid?: boolean;
	showLegend?: boolean;
	layout?: "horizontal" | "vertical";
	className?: string;
}

const COLORS = [
	"#3b82f6",
	"#10b981",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
	"#ec4899",
];

export function BarChartComponent({
	data,
	bars,
	xAxisKey,
	height = 300,
	showGrid = true,
	showLegend = true,
	layout = "horizontal",
	className = "",
}: BarChartComponentProps) {
	return (
		<div className={className}>
			<ResponsiveContainer width="100%" height={height}>
				<BarChart data={data} layout={layout}>
					{showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
					<XAxis
						dataKey={xAxisKey}
						stroke="currentColor"
						fontSize={12}
						tickLine={false}
						axisLine={false}
						type={layout === "horizontal" ? "category" : "number"}
					/>
					<YAxis
						stroke="currentColor"
						fontSize={12}
						tickLine={false}
						axisLine={false}
						type={layout === "horizontal" ? "number" : "category"}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: "hsl(var(--popover))",
							border: "1px solid hsl(var(--border))",
							borderRadius: "6px",
						}}
					/>
					{showLegend && <Legend />}
					{bars.map((bar, index) => (
						<Bar
							key={bar.dataKey}
							dataKey={bar.dataKey}
							fill={bar.fill || COLORS[index % COLORS.length]}
							name={bar.name || bar.dataKey}
							radius={[4, 4, 0, 0]}
						/>
					))}
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
