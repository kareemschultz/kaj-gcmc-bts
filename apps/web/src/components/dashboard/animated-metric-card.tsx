"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { type LucideIcon, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnimatedMetricCardProps {
	title: string;
	value: number;
	previousValue?: number;
	icon: LucideIcon;
	format?: "number" | "currency" | "percentage";
	className?: string;
	delay?: number;
	href?: string;
	subtitle?: string;
	color?: "blue" | "green" | "orange" | "red" | "purple" | "cyan";
	showProgress?: boolean;
	target?: number;
}

export function AnimatedMetricCard({
	title,
	value,
	previousValue,
	icon: Icon,
	format = "number",
	className,
	delay = 0,
	href,
	subtitle,
	color = "blue",
	showProgress = false,
	target,
}: AnimatedMetricCardProps) {
	const [displayValue, setDisplayValue] = useState(0);
	const motionValue = useMotionValue(0);

	// Calculate trend
	const trend = previousValue
		? ((value - previousValue) / previousValue) * 100
		: null;

	// Calculate progress percentage
	const progressPercentage = target ? Math.min((value / target) * 100, 100) : 0;

	// Format value based on type
	const formatValue = (val: number) => {
		switch (format) {
			case "currency":
				return new Intl.NumberFormat("en-US", {
					style: "currency",
					currency: "USD",
					minimumFractionDigits: 0,
					maximumFractionDigits: 0,
				}).format(val);
			case "percentage":
				return `${Math.round(val * 100) / 100}%`;
			default:
				return Math.round(val).toLocaleString();
		}
	};

	// Animate counter
	useEffect(() => {
		const controls = animate(motionValue, value, {
			duration: 1.5,
			delay: delay,
			ease: "easeOut",
			onUpdate: (latest) => {
				setDisplayValue(latest);
			},
		});

		return () => controls.stop();
	}, [value, delay, motionValue]);

	const cardColors = {
		blue: {
			gradient: "from-blue-500/10 to-blue-600/5",
			ring: "ring-blue-500/20",
			icon: "text-blue-600",
			trend: "text-blue-600",
			progress: "bg-blue-500",
		},
		green: {
			gradient: "from-green-500/10 to-green-600/5",
			ring: "ring-green-500/20",
			icon: "text-green-600",
			trend: "text-green-600",
			progress: "bg-green-500",
		},
		orange: {
			gradient: "from-orange-500/10 to-orange-600/5",
			ring: "ring-orange-500/20",
			icon: "text-orange-600",
			trend: "text-orange-600",
			progress: "bg-orange-500",
		},
		red: {
			gradient: "from-red-500/10 to-red-600/5",
			ring: "ring-red-500/20",
			icon: "text-red-600",
			trend: "text-red-600",
			progress: "bg-red-500",
		},
		purple: {
			gradient: "from-purple-500/10 to-purple-600/5",
			ring: "ring-purple-500/20",
			icon: "text-purple-600",
			trend: "text-purple-600",
			progress: "bg-purple-500",
		},
		cyan: {
			gradient: "from-cyan-500/10 to-cyan-600/5",
			ring: "ring-cyan-500/20",
			icon: "text-cyan-600",
			trend: "text-cyan-600",
			progress: "bg-cyan-500",
		},
	};

	const colors = cardColors[color];

	const getTrendIcon = () => {
		if (!trend) return Minus;
		return trend > 0 ? TrendingUp : TrendingDown;
	};

	const getTrendColor = () => {
		if (!trend) return "text-gray-500";
		return trend > 0 ? "text-green-600" : "text-red-600";
	};

	const CardWrapper = href ? motion.a : motion.div;
	const wrapperProps = href ? { href } : {};

	return (
		<CardWrapper
			{...wrapperProps}
			initial={{ opacity: 0, y: 20, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{
				duration: 0.5,
				delay: delay,
				type: "spring",
				bounce: 0.3,
			}}
			whileHover={{
				scale: 1.02,
				y: -4,
				transition: { duration: 0.2 },
			}}
			className={cn(
				"group block cursor-pointer",
				href && "text-inherit no-underline",
			)}
		>
			<Card
				className={cn(
					"relative overflow-hidden border-0 bg-gradient-to-br shadow-sm",
					colors.gradient,
					"transition-all duration-300 hover:shadow-lg",
					colors.ring,
					"ring-1",
					className,
				)}
			>
				<CardContent className="p-6">
					{/* Header with Icon */}
					<div className="mb-4 flex items-center justify-between">
						<div className="flex-1">
							<p className="mb-1 font-medium text-muted-foreground text-sm">
								{title}
							</p>
							{subtitle && (
								<p className="text-muted-foreground/70 text-xs">{subtitle}</p>
							)}
						</div>
						<motion.div
							initial={{ scale: 0, rotate: -180 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{
								duration: 0.6,
								delay: delay + 0.2,
								type: "spring",
								bounce: 0.4,
							}}
							className={cn(
								"rounded-full bg-background/50 p-3 backdrop-blur-sm",
								"shadow-sm ring-1 ring-white/20",
							)}
						>
							<Icon className={cn("h-5 w-5", colors.icon)} />
						</motion.div>
					</div>

					{/* Main Value */}
					<div className="space-y-3">
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: delay + 0.3, duration: 0.5 }}
						>
							<span className="font-bold text-3xl tracking-tight">
								{formatValue(displayValue)}
							</span>
						</motion.div>

						{/* Trend and Progress */}
						<div className="flex items-center justify-between">
							{/* Trend */}
							{trend !== null && (
								<motion.div
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: delay + 0.4, duration: 0.3 }}
									className={cn(
										"flex items-center gap-1 font-medium text-sm",
										getTrendColor(),
									)}
								>
									{(() => {
										const TrendIcon = getTrendIcon();
										return <TrendIcon className="h-4 w-4" />;
									})()}
									<span>{Math.abs(trend).toFixed(1)}%</span>
								</motion.div>
							)}

							{/* Progress Bar */}
							{showProgress && target && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: delay + 0.5, duration: 0.3 }}
									className="ml-4 flex-1"
								>
									<div className="flex items-center gap-2 text-muted-foreground text-xs">
										<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background/50">
											<motion.div
												initial={{ width: 0 }}
												animate={{ width: `${progressPercentage}%` }}
												transition={{
													duration: 1.2,
													delay: delay + 0.6,
													ease: "easeOut",
												}}
												className={cn("h-full rounded-full", colors.progress)}
											/>
										</div>
										<span>{Math.round(progressPercentage)}%</span>
									</div>
								</motion.div>
							)}
						</div>
					</div>

					{/* Animated Background Glow */}
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{
							duration: 2,
							delay: delay + 0.1,
							repeat: Number.POSITIVE_INFINITY,
							repeatType: "reverse",
							ease: "easeInOut",
						}}
						className={cn(
							"-top-4 -right-4 absolute h-24 w-24 rounded-full",
							"bg-gradient-to-r from-white/5 to-white/10",
							"pointer-events-none blur-xl",
						)}
					/>

					{/* Hover Glow Effect */}
					<motion.div
						initial={{ opacity: 0 }}
						whileHover={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
						className={cn(
							"absolute inset-0 bg-gradient-to-r",
							colors.gradient,
							"opacity-0 transition-opacity duration-300 group-hover:opacity-30",
							"pointer-events-none",
						)}
					/>
				</CardContent>
			</Card>
		</CardWrapper>
	);
}

export function AdvancedStatsSection() {
	// Mock data - replace with real API calls
	const metricsData = [
		{
			title: "Total Revenue",
			value: 156789,
			previousValue: 142350,
			icon: () => (
				<svg
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
					/>
				</svg>
			),
			format: "currency" as const,
			color: "green" as const,
			showProgress: true,
			target: 200000,
			subtitle: "Monthly recurring revenue",
		},
		{
			title: "Active Clients",
			value: 247,
			previousValue: 231,
			icon: () => (
				<svg
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m0 0V9a3 3 0 003-3m-3 6.75V9a3 3 0 003-3m-3 6.75a3 3 0 01-3-3V6a3 3 0 013-3m0 0a3 3 0 013 3v6.75"
					/>
				</svg>
			),
			color: "blue" as const,
			showProgress: true,
			target: 300,
			subtitle: "Engaged client base",
		},
		{
			title: "Compliance Score",
			value: 94.5,
			previousValue: 91.2,
			icon: () => (
				<svg
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			),
			format: "percentage" as const,
			color: "green" as const,
			showProgress: true,
			target: 100,
			subtitle: "Overall compliance health",
		},
		{
			title: "Pending Filings",
			value: 23,
			previousValue: 31,
			icon: () => (
				<svg
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
					/>
				</svg>
			),
			color: "orange" as const,
			subtitle: "Requires attention",
		},
		{
			title: "Processing Time",
			value: 4.2,
			previousValue: 5.8,
			icon: () => (
				<svg
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			),
			color: "cyan" as const,
			subtitle: "Average days to complete",
		},
		{
			title: "Client Satisfaction",
			value: 96.8,
			previousValue: 94.1,
			icon: () => (
				<svg
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
					/>
				</svg>
			),
			format: "percentage" as const,
			color: "purple" as const,
			showProgress: true,
			target: 100,
			subtitle: "Customer feedback score",
		},
	];

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
		>
			{metricsData.map((metric, index) => (
				<AnimatedMetricCard
					key={metric.title}
					{...metric}
					delay={index * 0.1}
				/>
			))}
		</motion.div>
	);
}
