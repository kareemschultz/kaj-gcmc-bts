"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import {
	Activity,
	AlertTriangle,
	BarChart3,
	CheckCircle,
	Clock,
	DollarSign,
	FileText,
	Target,
	TrendingDown,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
	value: number;
	maxValue?: number;
	size?: number;
	strokeWidth?: number;
	className?: string;
	color?: string;
	label?: string;
	showValue?: boolean;
	animationDuration?: number;
	delay?: number;
}

function CircularProgress({
	value,
	maxValue = 100,
	size = 120,
	strokeWidth = 8,
	className,
	color = "#3B82F6",
	label,
	showValue = true,
	animationDuration = 1.5,
	delay = 0,
}: CircularProgressProps) {
	const [animatedValue, setAnimatedValue] = useState(0);
	const percentage = (value / maxValue) * 100;
	const circumference = 2 * Math.PI * (size / 2 - strokeWidth);
	const offset = circumference - (animatedValue / 100) * circumference;

	useEffect(() => {
		const timer = setTimeout(() => {
			setAnimatedValue(percentage);
		}, delay * 1000);

		return () => clearTimeout(timer);
	}, [percentage, delay]);

	return (
		<motion.div
			initial={{ scale: 0, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{
				duration: 0.6,
				delay: delay,
				type: "spring",
				bounce: 0.3,
			}}
			className={cn("relative flex flex-col items-center", className)}
		>
			<div className="relative">
				<svg width={size} height={size} className="-rotate-90 transform">
					{/* Background circle */}
					<circle
						cx={size / 2}
						cy={size / 2}
						r={size / 2 - strokeWidth}
						stroke="currentColor"
						strokeWidth={strokeWidth}
						fill="none"
						className="text-gray-200 dark:text-gray-700"
					/>

					{/* Progress circle */}
					<motion.circle
						cx={size / 2}
						cy={size / 2}
						r={size / 2 - strokeWidth}
						stroke={color}
						strokeWidth={strokeWidth}
						fill="none"
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={offset}
						style={{
							strokeDashoffset: offset,
							transition: `stroke-dashoffset ${animationDuration}s ease-in-out`,
						}}
					/>
				</svg>

				{/* Center content */}
				<div className="absolute inset-0 flex flex-col items-center justify-center">
					{showValue && (
						<motion.span
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: delay + 0.5, duration: 0.5 }}
							className="font-bold text-2xl"
							style={{ color }}
						>
							{Math.round(animatedValue)}%
						</motion.span>
					)}
				</div>
			</div>

			{label && (
				<motion.p
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: delay + 0.7, duration: 0.3 }}
					className="mt-2 text-center font-medium text-muted-foreground text-sm"
				>
					{label}
				</motion.p>
			)}
		</motion.div>
	);
}

interface AnimatedGaugeProps {
	title: string;
	value: number;
	maxValue?: number;
	unit?: string;
	target?: number;
	color?: string;
	size?: "sm" | "md" | "lg";
	delay?: number;
}

function AnimatedGauge({
	title,
	value,
	maxValue = 100,
	unit = "%",
	target,
	color = "#10B981",
	size = "md",
	delay = 0,
}: AnimatedGaugeProps) {
	const sizeMap = {
		sm: 80,
		md: 100,
		lg: 120,
	};

	const strokeMap = {
		sm: 6,
		md: 8,
		lg: 10,
	};

	return (
		<Card className="border-0 bg-gradient-to-br from-white to-gray-50/50 shadow-lg ring-1 ring-gray-200/50 dark:from-gray-900 dark:to-gray-800/50 dark:ring-gray-700/50">
			<CardContent className="p-6">
				<div className="flex flex-col items-center space-y-4">
					<h3 className="text-center font-semibold text-lg">{title}</h3>

					<CircularProgress
						value={value}
						maxValue={maxValue}
						size={sizeMap[size]}
						strokeWidth={strokeMap[size]}
						color={color}
						animationDuration={1.5}
						delay={delay}
					/>

					<div className="space-y-1 text-center">
						<motion.p
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: delay + 0.5, duration: 0.5 }}
							className="font-bold text-3xl"
							style={{ color }}
						>
							{value}
							{unit}
						</motion.p>

						{target && (
							<motion.p
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: delay + 0.7, duration: 0.3 }}
								className="flex items-center justify-center gap-1 text-muted-foreground text-sm"
							>
								<Target className="h-3 w-3" />
								Target: {target}
								{unit}
							</motion.p>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

interface MetricCardProps {
	title: string;
	value: string;
	change?: number;
	icon: React.ComponentType<any>;
	progress?: number;
	color?: string;
	delay?: number;
}

function AnimatedMetricCard({
	title,
	value,
	change,
	icon: Icon,
	progress,
	color = "#3B82F6",
	delay = 0,
}: MetricCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: 0.5,
				delay: delay,
				type: "spring",
				bounce: 0.2,
			}}
		>
			<Card className="border-0 bg-gradient-to-br from-white to-gray-50/50 shadow-lg ring-1 ring-gray-200/50 transition-all duration-300 hover:shadow-xl dark:from-gray-900 dark:to-gray-800/50 dark:ring-gray-700/50">
				<CardContent className="p-6">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<p className="mb-2 font-medium text-muted-foreground text-sm">
								{title}
							</p>
							<motion.p
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: delay + 0.2, duration: 0.5 }}
								className="mb-1 font-bold text-2xl"
							>
								{value}
							</motion.p>

							{change !== undefined && (
								<motion.div
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: delay + 0.3, duration: 0.3 }}
									className={cn(
										"flex items-center gap-1 font-medium text-sm",
										change >= 0 ? "text-green-600" : "text-red-600",
									)}
								>
									{change >= 0 ? (
										<TrendingUp className="h-4 w-4" />
									) : (
										<TrendingDown className="h-4 w-4" />
									)}
									<span>{Math.abs(change).toFixed(1)}%</span>
								</motion.div>
							)}

							{progress !== undefined && (
								<motion.div
									initial={{ opacity: 0, scaleX: 0 }}
									animate={{ opacity: 1, scaleX: 1 }}
									transition={{ delay: delay + 0.4, duration: 0.8 }}
									className="mt-3"
								>
									<div className="mb-1 flex items-center justify-between text-muted-foreground text-xs">
										<span>Progress</span>
										<span>{progress}%</span>
									</div>
									<div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${progress}%` }}
											transition={{ delay: delay + 0.5, duration: 1 }}
											className="h-2 rounded-full"
											style={{ backgroundColor: color }}
										/>
									</div>
								</motion.div>
							)}
						</div>

						<motion.div
							initial={{ scale: 0, rotate: -180 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{
								duration: 0.6,
								delay: delay + 0.1,
								type: "spring",
								bounce: 0.4,
							}}
							className="rounded-full p-3"
							style={{ backgroundColor: `${color}20` }}
						>
							<Icon className="h-6 w-6" style={{ color }} />
						</motion.div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}

export function BusinessMetricsPanel() {
	const kpiData = [
		{
			title: "Monthly Revenue",
			value: "$147,329",
			change: 12.3,
			icon: DollarSign,
			progress: 85,
			color: "#10B981",
		},
		{
			title: "Active Clients",
			value: "2,847",
			change: 8.7,
			icon: Users,
			progress: 78,
			color: "#3B82F6",
		},
		{
			title: "Completed Filings",
			value: "1,234",
			change: -2.1,
			icon: FileText,
			progress: 92,
			color: "#F59E0B",
		},
		{
			title: "Response Time",
			value: "1.2h",
			change: -15.4,
			icon: Clock,
			progress: 88,
			color: "#8B5CF6",
		},
		{
			title: "Compliance Rate",
			value: "98.7%",
			change: 3.2,
			icon: CheckCircle,
			progress: 99,
			color: "#10B981",
		},
		{
			title: "Active Issues",
			value: "23",
			change: -12.8,
			icon: AlertTriangle,
			progress: 45,
			color: "#EF4444",
		},
	];

	const gaugeData = [
		{
			title: "System Performance",
			value: 94,
			target: 95,
			color: "#10B981",
		},
		{
			title: "Client Satisfaction",
			value: 87,
			target: 90,
			color: "#3B82F6",
		},
		{
			title: "Processing Efficiency",
			value: 91,
			target: 95,
			color: "#F59E0B",
		},
		{
			title: "Security Score",
			value: 99,
			target: 100,
			color: "#8B5CF6",
		},
	];

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className="space-y-8"
		>
			{/* Header */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="flex items-center justify-between"
			>
				<div>
					<h2 className="font-bold text-2xl">Business Metrics</h2>
					<p className="text-muted-foreground">
						Real-time performance indicators and key business metrics
					</p>
				</div>
				<Badge variant="outline" className="flex items-center gap-2">
					<Activity className="h-3 w-3" />
					Live Data
				</Badge>
			</motion.div>

			{/* KPI Cards Grid */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{kpiData.map((kpi, index) => (
					<AnimatedMetricCard key={kpi.title} {...kpi} delay={index * 0.1} />
				))}
			</div>

			{/* Performance Gauges */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.6, duration: 0.5 }}
			>
				<h3 className="mb-6 flex items-center gap-2 font-semibold text-xl">
					<BarChart3 className="h-5 w-5" />
					Performance Gauges
				</h3>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					{gaugeData.map((gauge, index) => (
						<AnimatedGauge
							key={gauge.title}
							{...gauge}
							delay={0.7 + index * 0.1}
						/>
					))}
				</div>
			</motion.div>

			{/* Quick Stats */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 1, duration: 0.5 }}
				className="grid gap-4 md:grid-cols-4"
			>
				<Card className="border-blue-200 bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:border-blue-800">
					<CardContent className="p-4 text-center">
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 1.1, duration: 0.3 }}
						>
							<Zap className="mx-auto mb-2 h-8 w-8 text-blue-600" />
							<p className="font-bold text-2xl text-blue-600">99.9%</p>
							<p className="text-muted-foreground text-sm">Uptime</p>
						</motion.div>
					</CardContent>
				</Card>

				<Card className="border-green-200 bg-gradient-to-br from-green-500/10 to-green-600/5 dark:border-green-800">
					<CardContent className="p-4 text-center">
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 1.2, duration: 0.3 }}
						>
							<Target className="mx-auto mb-2 h-8 w-8 text-green-600" />
							<p className="font-bold text-2xl text-green-600">142</p>
							<p className="text-muted-foreground text-sm">Goals Met</p>
						</motion.div>
					</CardContent>
				</Card>

				<Card className="border-orange-200 bg-gradient-to-br from-orange-500/10 to-orange-600/5 dark:border-orange-800">
					<CardContent className="p-4 text-center">
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 1.3, duration: 0.3 }}
						>
							<Clock className="mx-auto mb-2 h-8 w-8 text-orange-600" />
							<p className="font-bold text-2xl text-orange-600">2.3s</p>
							<p className="text-muted-foreground text-sm">Avg Load</p>
						</motion.div>
					</CardContent>
				</Card>

				<Card className="border-purple-200 bg-gradient-to-br from-purple-500/10 to-purple-600/5 dark:border-purple-800">
					<CardContent className="p-4 text-center">
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 1.4, duration: 0.3 }}
						>
							<Activity className="mx-auto mb-2 h-8 w-8 text-purple-600" />
							<p className="font-bold text-2xl text-purple-600">847</p>
							<p className="text-muted-foreground text-sm">Active Users</p>
						</motion.div>
					</CardContent>
				</Card>
			</motion.div>
		</motion.div>
	);
}
