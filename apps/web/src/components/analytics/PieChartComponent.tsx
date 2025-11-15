"use client";

import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

interface PieChartData {
	name: string;
	value: number;
}

interface PieChartComponentProps {
	data: PieChartData[];
	height?: number;
	showLegend?: boolean;
	innerRadius?: number;
	outerRadius?: number;
	colors?: string[];
	className?: string;
}

const DEFAULT_COLORS = [
	"#3b82f6",
	"#10b981",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
	"#ec4899",
	"#06b6d4",
	"#84cc16",
];

export function PieChartComponent({
	data,
	height = 300,
	showLegend = true,
	innerRadius = 0,
	outerRadius = 80,
	colors = DEFAULT_COLORS,
	className = "",
}: PieChartComponentProps) {
	return (
		<div className={className}>
			<ResponsiveContainer width="100%" height={height}>
				<PieChart>
					<Pie
						data={data}
						cx="50%"
						cy="50%"
						innerRadius={innerRadius}
						outerRadius={outerRadius}
						fill="#8884d8"
						paddingAngle={2}
						dataKey="value"
						label={({ name, percent }) =>
							`${name}: ${(percent * 100).toFixed(0)}%`
						}
					>
						{data.map((_entry, index) => (
							<Cell
								// biome-ignore lint/suspicious/noArrayIndexKey: chart data is stable and order-dependent
								key={`cell-${index}`}
								fill={colors[index % colors.length]}
							/>
						))}
					</Pie>
					<Tooltip
						contentStyle={{
							backgroundColor: "hsl(var(--popover))",
							border: "1px solid hsl(var(--border))",
							borderRadius: "6px",
						}}
					/>
					{showLegend && <Legend />}
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}
