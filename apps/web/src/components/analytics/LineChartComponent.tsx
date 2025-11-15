"use client";

import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface LineChartData {
	[key: string]: string | number;
}

interface LineChartComponentProps {
	data: LineChartData[];
	lines: Array<{
		dataKey: string;
		stroke?: string;
		name?: string;
	}>;
	xAxisKey: string;
	height?: number;
	showGrid?: boolean;
	showLegend?: boolean;
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

export function LineChartComponent({
	data,
	lines,
	xAxisKey,
	height = 300,
	showGrid = true,
	showLegend = true,
	className = "",
}: LineChartComponentProps) {
	return (
		<div className={className}>
			<ResponsiveContainer width="100%" height={height}>
				<LineChart data={data}>
					{showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
					<XAxis
						dataKey={xAxisKey}
						stroke="currentColor"
						fontSize={12}
						tickLine={false}
						axisLine={false}
					/>
					<YAxis
						stroke="currentColor"
						fontSize={12}
						tickLine={false}
						axisLine={false}
						tickFormatter={(value) => `${value}`}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: "hsl(var(--popover))",
							border: "1px solid hsl(var(--border))",
							borderRadius: "6px",
						}}
					/>
					{showLegend && <Legend />}
					{lines.map((line, index) => (
						<Line
							key={line.dataKey}
							type="monotone"
							dataKey={line.dataKey}
							stroke={line.stroke || COLORS[index % COLORS.length]}
							strokeWidth={2}
							name={line.name || line.dataKey}
							dot={false}
						/>
					))}
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
