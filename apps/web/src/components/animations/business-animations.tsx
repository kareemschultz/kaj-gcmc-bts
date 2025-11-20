/**
 * Business-Specific Animation Components
 * Specialized animations for tax services, compliance, and document management
 */

"use client";

import {
	AnimatePresence,
	motion,
	useSpring,
	useTransform,
} from "framer-motion";
import {
	AlertTriangle,
	Calendar,
	CheckCircle,
	Clock,
	DollarSign,
	FileText,
	Shield,
	TrendingUp,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAnimation, useReducedMotion } from "@/lib/animations/context";
import { cn } from "@/lib/utils";

interface ComplianceScoreProps {
	score: number;
	previousScore?: number;
	size?: "sm" | "md" | "lg";
	animated?: boolean;
	showTrend?: boolean;
}

export function ComplianceScore({
	score,
	previousScore,
	size = "md",
	animated = true,
	showTrend = true,
}: ComplianceScoreProps) {
	const { config } = useAnimation();
	const isReducedMotion = useReducedMotion();
	const [displayScore, setDisplayScore] = useState(previousScore || 0);

	const sizeClasses = {
		sm: "w-16 h-16",
		md: "w-24 h-24",
		lg: "w-32 h-32",
	};

	const textSizes = {
		sm: "text-lg",
		md: "text-2xl",
		lg: "text-3xl",
	};

	const shouldAnimate = animated && !isReducedMotion && config.enabled;

	useEffect(() => {
		if (shouldAnimate) {
			const timer = setTimeout(() => setDisplayScore(score), 100);
			return () => clearTimeout(timer);
		}
		setDisplayScore(score);
	}, [score, shouldAnimate]);

	const circumference = 2 * Math.PI * 45;
	const strokeDasharray = circumference;
	const strokeDashoffset = circumference - (score / 100) * circumference;

	const getScoreColor = (score: number) => {
		if (score >= 90) return "#10b981"; // green
		if (score >= 70) return "#f59e0b"; // yellow
		return "#ef4444"; // red
	};

	const trend = previousScore ? score - previousScore : 0;

	return (
		<div className="relative flex flex-col items-center">
			<div className={cn("relative", sizeClasses[size])}>
				{/* Background Circle */}
				<svg
					className="-rotate-90 h-full w-full transform"
					viewBox="0 0 100 100"
				>
					<circle
						cx="50"
						cy="50"
						r="45"
						stroke="#e5e7eb"
						strokeWidth="8"
						fill="none"
					/>
					<motion.circle
						cx="50"
						cy="50"
						r="45"
						stroke={getScoreColor(score)}
						strokeWidth="8"
						fill="none"
						strokeLinecap="round"
						strokeDasharray={strokeDasharray}
						initial={{
							strokeDashoffset: shouldAnimate
								? circumference
								: strokeDashoffset,
						}}
						animate={{
							strokeDashoffset: strokeDashoffset,
						}}
						transition={{
							duration: shouldAnimate ? 1.5 : 0.1,
							delay: 0.2,
							ease: "easeOut",
						}}
						style={{
							willChange: config.enableGPUAcceleration
								? "stroke-dashoffset"
								: "auto",
						}}
					/>
				</svg>

				{/* Score Text */}
				<div className="absolute inset-0 flex items-center justify-center">
					<motion.span
						className={cn("font-bold", textSizes[size])}
						style={{ color: getScoreColor(score) }}
						animate={
							shouldAnimate
								? {
										scale: [0.8, 1.1, 1],
									}
								: {}
						}
						transition={{
							duration: 0.6,
							delay: 1.2,
							ease: "easeOut",
						}}
					>
						<motion.span
							animate={{ opacity: 1 }}
							initial={{ opacity: 0 }}
							transition={{ duration: 0.3, delay: 1.5 }}
						>
							{Math.round(displayScore)}%
						</motion.span>
					</motion.span>
				</div>
			</div>

			{/* Trend Indicator */}
			{showTrend && previousScore && (
				<motion.div
					className="mt-2 flex items-center text-sm"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 1.8 }}
				>
					<TrendingUp
						className={cn(
							"mr-1 h-4 w-4",
							trend > 0 && "rotate-0 text-green-500",
							trend < 0 && "rotate-180 text-red-500",
							trend === 0 && "text-gray-500",
						)}
					/>
					<span
						className={cn(
							"font-medium",
							trend > 0 && "text-green-600",
							trend < 0 && "text-red-600",
							trend === 0 && "text-gray-600",
						)}
					>
						{trend > 0 ? "+" : ""}
						{trend.toFixed(1)}%
					</span>
				</motion.div>
			)}
		</div>
	);
}

interface DeadlineWarningProps {
	deadline: Date;
	urgent?: boolean;
	className?: string;
}

export function DeadlineWarning({
	deadline,
	urgent = false,
	className,
}: DeadlineWarningProps) {
	const { config } = useAnimation();
	const isReducedMotion = useReducedMotion();
	const now = new Date();
	const daysLeft = Math.ceil(
		(deadline.getTime() - now.getTime()) / (1000 * 3600 * 24),
	);

	const shouldAnimate = !isReducedMotion && config.enabled;

	const getUrgencyLevel = () => {
		if (urgent || daysLeft <= 3) return "critical";
		if (daysLeft <= 7) return "warning";
		return "normal";
	};

	const urgencyLevel = getUrgencyLevel();

	const animationProps = {
		critical: {
			animate: shouldAnimate
				? {
						backgroundColor: ["#fef2f2", "#fed7d7", "#fef2f2"],
						borderColor: ["#ef4444", "#dc2626", "#ef4444"],
						scale: [1, 1.02, 1],
					}
				: {},
			transition: {
				duration: 1.5,
				repeat: Number.POSITIVE_INFINITY,
				ease: "easeInOut",
			},
		},
		warning: {
			animate: shouldAnimate
				? {
						backgroundColor: ["#fef3c7", "#fed7aa", "#fef3c7"],
					}
				: {},
			transition: {
				duration: 2,
				repeat: Number.POSITIVE_INFINITY,
				ease: "easeInOut",
			},
		},
		normal: {},
	};

	return (
		<motion.div
			className={cn(
				"flex items-center rounded-lg border p-3",
				urgencyLevel === "critical" && "border-red-200 bg-red-50",
				urgencyLevel === "warning" && "border-yellow-200 bg-yellow-50",
				urgencyLevel === "normal" && "border-blue-200 bg-blue-50",
				className,
			)}
			{...animationProps[urgencyLevel]}
			style={{
				willChange: config.enableGPUAcceleration
					? "background-color, transform"
					: "auto",
			}}
		>
			<motion.div
				initial={{ rotate: 0 }}
				animate={
					shouldAnimate && urgencyLevel === "critical"
						? {
								rotate: [0, -5, 5, -5, 5, 0],
							}
						: {}
				}
				transition={{
					duration: 0.5,
					repeat: urgencyLevel === "critical" ? Number.POSITIVE_INFINITY : 0,
					repeatDelay: 3,
				}}
			>
				{urgencyLevel === "critical" ? (
					<AlertTriangle className="mr-3 h-5 w-5 text-red-600" />
				) : (
					<Clock className="mr-3 h-5 w-5 text-yellow-600" />
				)}
			</motion.div>

			<div>
				<p
					className={cn(
						"font-medium text-sm",
						urgencyLevel === "critical" && "text-red-800",
						urgencyLevel === "warning" && "text-yellow-800",
						urgencyLevel === "normal" && "text-blue-800",
					)}
				>
					{daysLeft > 0 ? `${daysLeft} days left` : "Overdue"}
				</p>
				<p
					className={cn(
						"text-xs",
						urgencyLevel === "critical" && "text-red-600",
						urgencyLevel === "warning" && "text-yellow-600",
						urgencyLevel === "normal" && "text-blue-600",
					)}
				>
					Due {deadline.toLocaleDateString()}
				</p>
			</div>
		</motion.div>
	);
}

interface DocumentUploadAnimationProps {
	isUploading: boolean;
	progress: number;
	fileName?: string;
	fileSize?: string;
	success?: boolean;
	error?: string;
}

export function DocumentUploadAnimation({
	isUploading,
	progress,
	fileName,
	fileSize,
	success = false,
	error,
}: DocumentUploadAnimationProps) {
	const { config } = useAnimation();
	const isReducedMotion = useReducedMotion();

	const shouldAnimate = !isReducedMotion && config.enabled;

	return (
		<motion.div
			className="rounded-lg border-2 border-gray-300 border-dashed p-4"
			animate={
				shouldAnimate && isUploading
					? {
							borderColor: ["#d1d5db", "#3b82f6", "#d1d5db"],
						}
					: {}
			}
			transition={{
				duration: 1.5,
				repeat: isUploading ? Number.POSITIVE_INFINITY : 0,
				ease: "easeInOut",
			}}
		>
			<div className="flex items-center">
				<motion.div
					className="flex-shrink-0"
					animate={
						shouldAnimate && isUploading
							? {
									scale: [1, 1.1, 1],
									rotate: [0, 5, -5, 0],
								}
							: {}
					}
					transition={{
						duration: 2,
						repeat: isUploading ? Number.POSITIVE_INFINITY : 0,
						ease: "easeInOut",
					}}
				>
					<FileText
						className={cn(
							"h-8 w-8",
							isUploading && "text-blue-500",
							success && "text-green-500",
							error && "text-red-500",
							!isUploading && !success && !error && "text-gray-400",
						)}
					/>
				</motion.div>

				<div className="ml-3 flex-1">
					{fileName && (
						<p className="font-medium text-gray-900 text-sm">{fileName}</p>
					)}
					{fileSize && <p className="text-gray-500 text-xs">{fileSize}</p>}

					{isUploading && (
						<motion.div
							className="mt-2"
							initial={{ opacity: 0, scaleX: 0 }}
							animate={{ opacity: 1, scaleX: 1 }}
							transition={{ duration: 0.3 }}
						>
							<div className="h-2 w-full rounded-full bg-gray-200">
								<motion.div
									className="h-2 rounded-full bg-blue-600"
									initial={{ width: "0%" }}
									animate={{ width: `${progress}%` }}
									transition={{ duration: 0.3, ease: "easeOut" }}
								/>
							</div>
							<p className="mt-1 text-gray-600 text-xs">{progress}% uploaded</p>
						</motion.div>
					)}

					{success && (
						<motion.div
							className="mt-2 flex items-center text-green-600"
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.3 }}
						>
							<CheckCircle className="mr-1 h-4 w-4" />
							<span className="text-xs">Upload complete</span>
						</motion.div>
					)}

					{error && (
						<motion.div
							className="mt-2 text-red-600"
							initial={{ opacity: 0, x: [0, -5, 5, 0] }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5 }}
						>
							<p className="text-xs">{error}</p>
						</motion.div>
					)}
				</div>
			</div>
		</motion.div>
	);
}

interface MonetaryValueProps {
	value: number;
	previousValue?: number;
	currency?: string;
	animated?: boolean;
	precision?: number;
	size?: "sm" | "md" | "lg";
}

export function MonetaryValue({
	value,
	previousValue,
	currency = "$",
	animated = true,
	precision = 2,
	size = "md",
}: MonetaryValueProps) {
	const { config } = useAnimation();
	const isReducedMotion = useReducedMotion();
	const [displayValue, setDisplayValue] = useState(previousValue || 0);

	const sizeClasses = {
		sm: "text-lg",
		md: "text-2xl",
		lg: "text-4xl",
	};

	const shouldAnimate = animated && !isReducedMotion && config.enabled;

	useEffect(() => {
		if (!shouldAnimate) {
			setDisplayValue(value);
			return;
		}

		const startValue = previousValue || 0;
		const endValue = value;
		const duration = 1000; // 1 second
		const startTime = Date.now();

		const animate = () => {
			const now = Date.now();
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Easing function
			const easeOutQuart = 1 - (1 - progress) ** 4;

			const currentValue = startValue + (endValue - startValue) * easeOutQuart;
			setDisplayValue(currentValue);

			if (progress < 1) {
				requestAnimationFrame(animate);
			}
		};

		requestAnimationFrame(animate);
	}, [value, previousValue, shouldAnimate]);

	const trend = previousValue ? value - previousValue : 0;
	const isPositiveTrend = trend > 0;

	return (
		<motion.div
			className="inline-flex items-baseline"
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: shouldAnimate ? 0.3 : 0.1 }}
		>
			<motion.span
				className={cn(
					"font-bold",
					sizeClasses[size],
					isPositiveTrend && previousValue && "text-green-600",
					!isPositiveTrend && previousValue && trend < 0 && "text-red-600",
				)}
				animate={
					shouldAnimate && Math.abs(trend) > 0
						? {
								scale: [1, 1.05, 1],
							}
						: {}
				}
				transition={{
					duration: 0.4,
					delay: 0.8,
					ease: "easeOut",
				}}
			>
				{currency}
				{displayValue.toLocaleString(undefined, {
					minimumFractionDigits: precision,
					maximumFractionDigits: precision,
				})}
			</motion.span>

			{previousValue && Math.abs(trend) > 0.01 && (
				<motion.span
					className={cn(
						"ml-2 font-medium text-sm",
						isPositiveTrend ? "text-green-600" : "text-red-600",
					)}
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.3, delay: 1.2 }}
				>
					{isPositiveTrend ? "↗" : "↘"}
					{currency}
					{Math.abs(trend).toLocaleString(undefined, {
						minimumFractionDigits: precision,
						maximumFractionDigits: precision,
					})}
				</motion.span>
			)}
		</motion.div>
	);
}

interface StatusChangeAnimationProps {
	status: "pending" | "processing" | "approved" | "rejected" | "completed";
	previousStatus?: string;
	label?: string;
	animated?: boolean;
}

export function StatusChangeAnimation({
	status,
	previousStatus,
	label,
	animated = true,
}: StatusChangeAnimationProps) {
	const { config } = useAnimation();
	const isReducedMotion = useReducedMotion();

	const statusConfig = {
		pending: {
			color: "text-yellow-600",
			bgColor: "bg-yellow-100",
			borderColor: "border-yellow-200",
			icon: Clock,
		},
		processing: {
			color: "text-blue-600",
			bgColor: "bg-blue-100",
			borderColor: "border-blue-200",
			icon: Shield,
		},
		approved: {
			color: "text-green-600",
			bgColor: "bg-green-100",
			borderColor: "border-green-200",
			icon: CheckCircle,
		},
		rejected: {
			color: "text-red-600",
			bgColor: "bg-red-100",
			borderColor: "border-red-200",
			icon: AlertTriangle,
		},
		completed: {
			color: "text-green-600",
			bgColor: "bg-green-100",
			borderColor: "border-green-200",
			icon: CheckCircle,
		},
	};

	const currentConfig = statusConfig[status];
	const Icon = currentConfig.icon;
	const hasChanged = previousStatus && previousStatus !== status;
	const shouldAnimate = animated && !isReducedMotion && config.enabled;

	return (
		<motion.div
			className={cn(
				"inline-flex items-center rounded-full border px-3 py-1 font-medium text-sm",
				currentConfig.bgColor,
				currentConfig.borderColor,
				currentConfig.color,
			)}
			initial={
				shouldAnimate && hasChanged
					? {
							scale: 0.8,
							opacity: 0,
							x: -20,
						}
					: {}
			}
			animate={{
				scale: 1,
				opacity: 1,
				x: 0,
			}}
			transition={{
				duration: shouldAnimate ? 0.4 : 0.1,
				ease: "easeOut",
				delay: shouldAnimate ? 0.1 : 0,
			}}
			style={{
				willChange: config.enableGPUAcceleration
					? "transform, opacity"
					: "opacity",
			}}
		>
			<motion.div
				initial={shouldAnimate && hasChanged ? { rotate: -90, scale: 0 } : {}}
				animate={{ rotate: 0, scale: 1 }}
				transition={{
					duration: shouldAnimate ? 0.3 : 0.1,
					delay: shouldAnimate ? 0.2 : 0,
				}}
			>
				<Icon className="mr-2 h-4 w-4" />
			</motion.div>

			<motion.span
				initial={shouldAnimate && hasChanged ? { opacity: 0 } : {}}
				animate={{ opacity: 1 }}
				transition={{
					duration: shouldAnimate ? 0.2 : 0.1,
					delay: shouldAnimate ? 0.3 : 0,
				}}
			>
				{label || status.charAt(0).toUpperCase() + status.slice(1)}
			</motion.span>
		</motion.div>
	);
}
