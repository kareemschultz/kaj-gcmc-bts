/**
 * Animation Accessibility Controls
 * User controls for animation preferences and accessibility features
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Accessibility,
	Eye,
	EyeOff,
	Monitor,
	Settings,
	Smartphone,
	Volume2,
	VolumeX,
	Zap,
	ZapOff,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAnimation } from "@/lib/animations/context";
import { cn } from "@/lib/utils";

interface AccessibilityControlsProps {
	className?: string;
	showPerformanceMetrics?: boolean;
}

export function AccessibilityControls({
	className,
	showPerformanceMetrics = false,
}: AccessibilityControlsProps) {
	const { config, updateConfig, getPerformanceMetrics } = useAnimation();
	const [isOpen, setIsOpen] = useState(false);
	const [performanceMetrics, setPerformanceMetrics] = useState(
		getPerformanceMetrics(),
	);

	useEffect(() => {
		if (showPerformanceMetrics) {
			const interval = setInterval(() => {
				setPerformanceMetrics(getPerformanceMetrics());
			}, 1000);

			return () => clearInterval(interval);
		}
	}, [showPerformanceMetrics, getPerformanceMetrics]);

	// Check for user's system preferences
	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		const colorSchemeQuery = window.matchMedia("(prefers-contrast: high)");

		const handleMotionChange = () => {
			updateConfig({ reduceMotion: mediaQuery.matches });
		};

		const handleContrastChange = () => {
			updateConfig({ highContrast: colorSchemeQuery.matches });
		};

		mediaQuery.addEventListener("change", handleMotionChange);
		colorSchemeQuery.addEventListener("change", handleContrastChange);

		// Set initial values
		updateConfig({
			reduceMotion: mediaQuery.matches,
			highContrast: colorSchemeQuery.matches,
		});

		return () => {
			mediaQuery.removeEventListener("change", handleMotionChange);
			colorSchemeQuery.removeEventListener("change", handleContrastChange);
		};
	}, [updateConfig]);

	const handleToggleAnimations = () => {
		updateConfig({ enabled: !config.enabled });
	};

	const handleToggleReducedMotion = () => {
		updateConfig({ reduceMotion: !config.reduceMotion });
	};

	const handleToggleGPUAcceleration = () => {
		updateConfig({ enableGPUAcceleration: !config.enableGPUAcceleration });
	};

	const handleToggleProgressAnimations = () => {
		updateConfig({ showProgressAnimations: !config.showProgressAnimations });
	};

	const handleToggleDataVisualization = () => {
		updateConfig({
			enableDataVisualizationAnimations:
				!config.enableDataVisualizationAnimations,
		});
	};

	const handleToggleFormValidation = () => {
		updateConfig({
			enableFormValidationAnimations: !config.enableFormValidationAnimations,
		});
	};

	const handleSpeedChange = (speed: "slow" | "normal" | "fast") => {
		updateConfig({ defaultSpeed: speed });
	};

	const getPerformanceStatus = () => {
		const avgFrameRate = performanceMetrics.frameRate;
		if (avgFrameRate >= 55) return { status: "excellent", color: "green" };
		if (avgFrameRate >= 45) return { status: "good", color: "yellow" };
		return { status: "poor", color: "red" };
	};

	return (
		<div className={cn("relative", className)}>
			<Button
				variant="outline"
				size="sm"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2"
				aria-label="Animation accessibility controls"
			>
				<Settings className="h-4 w-4" />
				Animations
				{showPerformanceMetrics && (
					<Badge
						variant="outline"
						className={cn(
							"text-xs",
							getPerformanceStatus().color === "green" &&
								"border-green-500 text-green-700",
							getPerformanceStatus().color === "yellow" &&
								"border-yellow-500 text-yellow-700",
							getPerformanceStatus().color === "red" &&
								"border-red-500 text-red-700",
						)}
					>
						{Math.round(performanceMetrics.frameRate)}fps
					</Badge>
				)}
			</Button>

			<AnimatePresence>
				{isOpen && (
					<>
						{/* Backdrop */}
						<motion.div
							className="fixed inset-0 z-40 bg-black/20"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setIsOpen(false)}
						/>

						{/* Controls Panel */}
						<motion.div
							className="absolute top-full right-0 z-50 mt-2 w-80 rounded-lg border bg-white p-4 shadow-lg"
							initial={{ opacity: 0, scale: 0.95, y: -10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: -10 }}
							transition={{ duration: 0.2, ease: "easeOut" }}
						>
							<div className="space-y-4">
								{/* Header */}
								<div className="flex items-center justify-between">
									<h3 className="font-semibold text-lg">Animation Settings</h3>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setIsOpen(false)}
										aria-label="Close animation controls"
									>
										×
									</Button>
								</div>

								{/* Performance Metrics */}
								{showPerformanceMetrics && (
									<div className="rounded-lg bg-gray-50 p-3">
										<h4 className="mb-2 flex items-center gap-2 font-medium text-sm">
											<Monitor className="h-4 w-4" />
											Performance
										</h4>
										<div className="grid grid-cols-2 gap-2 text-xs">
											<div>
												<span className="text-gray-600">Frame Rate:</span>
												<span className="ml-1 font-medium">
													{Math.round(performanceMetrics.frameRate)}fps
												</span>
											</div>
											<div>
												<span className="text-gray-600">Animations:</span>
												<span className="ml-1 font-medium">
													{performanceMetrics.animationCount}
												</span>
											</div>
											<div>
												<span className="text-gray-600">Memory:</span>
												<span className="ml-1 font-medium">
													{Math.round(
														performanceMetrics.memoryUsage / 1024 / 1024,
													)}
													MB
												</span>
											</div>
											<div>
												<span className="text-gray-600">Dropped:</span>
												<span className="ml-1 font-medium">
													{performanceMetrics.droppedFrames}
												</span>
											</div>
										</div>
									</div>
								)}

								{/* Main Controls */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Label
											htmlFor="animations-enabled"
											className="flex items-center gap-2"
										>
											{config.enabled ? (
												<Eye className="h-4 w-4" />
											) : (
												<EyeOff className="h-4 w-4" />
											)}
											Enable Animations
										</Label>
										<Switch
											id="animations-enabled"
											checked={config.enabled}
											onCheckedChange={handleToggleAnimations}
										/>
									</div>

									<div className="flex items-center justify-between">
										<Label
											htmlFor="reduced-motion"
											className="flex items-center gap-2"
										>
											<Accessibility className="h-4 w-4" />
											Reduced Motion
										</Label>
										<Switch
											id="reduced-motion"
											checked={config.reduceMotion}
											onCheckedChange={handleToggleReducedMotion}
										/>
									</div>

									<div className="flex items-center justify-between">
										<Label
											htmlFor="gpu-acceleration"
											className="flex items-center gap-2"
										>
											{config.enableGPUAcceleration ? (
												<Zap className="h-4 w-4" />
											) : (
												<ZapOff className="h-4 w-4" />
											)}
											GPU Acceleration
										</Label>
										<Switch
											id="gpu-acceleration"
											checked={config.enableGPUAcceleration}
											onCheckedChange={handleToggleGPUAcceleration}
										/>
									</div>
								</div>

								{/* Animation Speed */}
								<div>
									<Label className="mb-2 block font-medium text-sm">
										Animation Speed
									</Label>
									<div className="flex gap-2">
										{(["slow", "normal", "fast"] as const).map((speed) => (
											<Button
												key={speed}
												variant={
													config.defaultSpeed === speed ? "default" : "outline"
												}
												size="sm"
												onClick={() => handleSpeedChange(speed)}
												className="flex-1 capitalize"
											>
												{speed}
											</Button>
										))}
									</div>
								</div>

								{/* Feature-Specific Controls */}
								<div className="space-y-3 border-t pt-3">
									<h4 className="font-medium text-sm">Feature Controls</h4>

									<div className="flex items-center justify-between">
										<Label htmlFor="progress-animations" className="text-sm">
											Progress Animations
										</Label>
										<Switch
											id="progress-animations"
											checked={config.showProgressAnimations}
											onCheckedChange={handleToggleProgressAnimations}
										/>
									</div>

									<div className="flex items-center justify-between">
										<Label htmlFor="data-viz-animations" className="text-sm">
											Data Visualization
										</Label>
										<Switch
											id="data-viz-animations"
											checked={config.enableDataVisualizationAnimations}
											onCheckedChange={handleToggleDataVisualization}
										/>
									</div>

									<div className="flex items-center justify-between">
										<Label
											htmlFor="form-validation-animations"
											className="text-sm"
										>
											Form Validation
										</Label>
										<Switch
											id="form-validation-animations"
											checked={config.enableFormValidationAnimations}
											onCheckedChange={handleToggleFormValidation}
										/>
									</div>
								</div>

								{/* Device Info */}
								<div className="border-t pt-3">
									<div className="flex items-center gap-2 text-gray-600 text-xs">
										<Smartphone className="h-3 w-3" />
										<span>
											{typeof navigator !== "undefined" &&
											"ontouchstart" in window
												? "Touch Device"
												: "Desktop Device"}
										</span>
									</div>
								</div>

								{/* Reset Button */}
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										updateConfig({
											enabled: true,
											reduceMotion: false,
											enableGPUAcceleration: true,
											defaultSpeed: "normal",
											showProgressAnimations: true,
											enableDataVisualizationAnimations: true,
											enableFormValidationAnimations: true,
										});
									}}
									className="w-full"
								>
									Reset to Defaults
								</Button>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}

// Screen reader announcements for animation changes
export function AnimationAnnouncer() {
	const { config } = useAnimation();
	const [announcement, setAnnouncement] = useState("");

	useEffect(() => {
		const messages: string[] = [];

		if (!config.enabled) {
			messages.push("Animations disabled");
		} else {
			if (config.reduceMotion) {
				messages.push("Reduced motion enabled");
			}
			if (!config.enableGPUAcceleration) {
				messages.push("GPU acceleration disabled");
			}
		}

		if (messages.length > 0) {
			setAnnouncement(messages.join(", "));
		}
	}, [config]);

	return (
		<div
			role="status"
			aria-live="polite"
			aria-label="Animation settings status"
			className="sr-only"
		>
			{announcement}
		</div>
	);
}

// Custom hook for keyboard navigation of animated elements
export function useKeyboardNavigation() {
	const { config } = useAnimation();

	const createKeyboardHandler = (onActivate: () => void) => {
		return {
			onKeyDown: (event: React.KeyboardEvent) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onActivate();
				}
			},
			tabIndex: 0,
			"aria-label": config.enabled
				? "Interactive element with animations"
				: "Interactive element",
		};
	};

	return { createKeyboardHandler };
}
