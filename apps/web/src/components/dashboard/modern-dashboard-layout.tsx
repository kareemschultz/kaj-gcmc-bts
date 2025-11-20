"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Activity,
	BarChart3,
	Bell,
	Calendar,
	Download,
	FileText,
	Filter,
	LayoutDashboard,
	Maximize2,
	Minimize2,
	Monitor,
	RefreshCw,
	Settings,
	Shield,
	TrendingUp,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { RealTimeChartsGrid } from "./animated-charts";
// Import our dashboard components
import { AdvancedStatsSection } from "./animated-metric-card";
import { BusinessMetricsPanel } from "./business-metrics-panel";
import { ComplianceVisualization } from "./compliance-visualization";
import { PerformanceMonitoring } from "./performance-monitoring";

interface DashboardTabConfig {
	id: string;
	label: string;
	icon: React.ComponentType<any>;
	badge?: number;
	component: React.ComponentType<any>;
	description: string;
}

interface WelcomeHeaderProps {
	userName?: string;
	userEmail?: string;
}

function WelcomeHeader({ userName, userEmail }: WelcomeHeaderProps) {
	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	const getGreeting = () => {
		const hour = currentTime.getHours();
		if (hour < 12) return "Good morning";
		if (hour < 17) return "Good afternoon";
		return "Good evening";
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, ease: "easeOut" }}
			className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 p-8 text-white"
		>
			{/* Background Animation */}
			<motion.div
				animate={{
					backgroundPosition: ["0% 0%", "100% 100%"],
				}}
				transition={{
					duration: 20,
					repeat: Number.POSITIVE_INFINITY,
					repeatType: "reverse",
				}}
				className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20"
				style={{
					backgroundSize: "200% 200%",
				}}
			/>

			{/* Floating Elements */}
			<motion.div
				animate={{
					y: [0, -10, 0],
					rotate: [0, 5, 0],
				}}
				transition={{
					duration: 6,
					repeat: Number.POSITIVE_INFINITY,
					ease: "easeInOut",
				}}
				className="absolute top-4 right-4 h-32 w-32 rounded-full bg-white/10 backdrop-blur-sm"
			/>

			<motion.div
				animate={{
					y: [0, 15, 0],
					rotate: [0, -5, 0],
				}}
				transition={{
					duration: 8,
					repeat: Number.POSITIVE_INFINITY,
					ease: "easeInOut",
					delay: 1,
				}}
				className="absolute right-16 bottom-4 h-20 w-20 rounded-full bg-white/5 backdrop-blur-sm"
			/>

			<div className="relative z-10">
				<div className="flex items-center justify-between">
					<div>
						<motion.h1
							initial={{ opacity: 0, x: -30 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2, duration: 0.6 }}
							className="mb-2 font-bold text-4xl"
						>
							{getGreeting()}, {userName || "Welcome"}!
						</motion.h1>

						<motion.p
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.4, duration: 0.6 }}
							className="mb-4 text-lg text-white/80"
						>
							Here's what's happening with your business today
						</motion.p>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.6, duration: 0.6 }}
							className="flex items-center gap-6 text-sm text-white/60"
						>
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4" />
								<span>{currentTime.toLocaleDateString()}</span>
							</div>
							<div className="flex items-center gap-2">
								<Activity className="h-4 w-4" />
								<span>All systems operational</span>
							</div>
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4" />
								<span>847 active users</span>
							</div>
						</motion.div>
					</div>

					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.8, duration: 0.6 }}
						className="text-right"
					>
						<div className="font-mono text-3xl">
							{currentTime.toLocaleTimeString()}
						</div>
						<div className="mt-1 text-sm text-white/60">
							{Intl.DateTimeFormat("en", {
								weekday: "long",
								timeZoneName: "short",
							}).format(currentTime)}
						</div>
					</motion.div>
				</div>

				{/* Quick Actions */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 1, duration: 0.6 }}
					className="mt-6 flex gap-3"
				>
					<Button
						variant="secondary"
						size="sm"
						className="border-white/20 bg-white/20 text-white hover:bg-white/30"
					>
						<FileText className="mr-2 h-4 w-4" />
						New Filing
					</Button>
					<Button
						variant="secondary"
						size="sm"
						className="border-white/20 bg-white/20 text-white hover:bg-white/30"
					>
						<Download className="mr-2 h-4 w-4" />
						Export Reports
					</Button>
					<Button
						variant="secondary"
						size="sm"
						className="border-white/20 bg-white/20 text-white hover:bg-white/30"
					>
						<Users className="mr-2 h-4 w-4" />
						Client Portal
					</Button>
				</motion.div>
			</div>
		</motion.div>
	);
}

interface AnimatedTabsProps {
	tabs: DashboardTabConfig[];
	activeTab: string;
	onTabChange: (tabId: string) => void;
}

function AnimatedTabs({ tabs, activeTab, onTabChange }: AnimatedTabsProps) {
	return (
		<Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="mb-8"
			>
				<TabsList className="grid w-full grid-cols-5 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
					{tabs.map((tab, index) => (
						<motion.div
							key={tab.id}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: index * 0.1, duration: 0.3 }}
						>
							<TabsTrigger
								value={tab.id}
								className="relative flex items-center gap-2 rounded-lg px-4 py-3 font-medium text-sm transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
							>
								<tab.icon className="h-4 w-4" />
								<span className="hidden sm:inline">{tab.label}</span>
								{tab.badge && tab.badge > 0 && (
									<Badge
										variant="secondary"
										className="ml-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
									>
										{tab.badge}
									</Badge>
								)}
							</TabsTrigger>
						</motion.div>
					))}
				</TabsList>

				{/* Tab Description */}
				<motion.div
					key={activeTab}
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
					className="mt-4 text-center"
				>
					<p className="text-muted-foreground">
						{tabs.find((tab) => tab.id === activeTab)?.description}
					</p>
				</motion.div>
			</motion.div>

			{/* Tab Content with Animation */}
			<AnimatePresence mode="wait">
				{tabs.map((tab) => (
					<TabsContent key={tab.id} value={tab.id} className="space-y-6">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.5, ease: "easeOut" }}
						>
							<tab.component />
						</motion.div>
					</TabsContent>
				))}
			</AnimatePresence>
		</Tabs>
	);
}

interface ModernDashboardLayoutProps {
	userName?: string;
	userEmail?: string;
}

export function ModernDashboardLayout({
	userName,
	userEmail,
}: ModernDashboardLayoutProps) {
	const [activeTab, setActiveTab] = useState("overview");
	const [isFullscreen, setIsFullscreen] = useState(false);

	const dashboardTabs: DashboardTabConfig[] = [
		{
			id: "overview",
			label: "Overview",
			icon: LayoutDashboard,
			component: AdvancedStatsSection,
			description:
				"Get a high-level view of your key business metrics and performance indicators",
		},
		{
			id: "analytics",
			label: "Analytics",
			icon: TrendingUp,
			component: RealTimeChartsGrid,
			description: "Dive deep into data visualizations and trending analysis",
		},
		{
			id: "business",
			label: "Business",
			icon: BarChart3,
			badge: 3,
			component: BusinessMetricsPanel,
			description:
				"Monitor business KPIs, goals, and operational metrics in real-time",
		},
		{
			id: "compliance",
			label: "Compliance",
			icon: Shield,
			component: ComplianceVisualization,
			description:
				"Track compliance scores, regulatory requirements, and audit results",
		},
		{
			id: "performance",
			label: "Performance",
			icon: Monitor,
			badge: 2,
			component: PerformanceMonitoring,
			description:
				"System performance monitoring with real-time metrics and alerts",
		},
	];

	const toggleFullscreen = () => {
		setIsFullscreen(!isFullscreen);
		if (!isFullscreen) {
			document.documentElement.requestFullscreen?.();
		} else {
			document.exitFullscreen?.();
		}
	};

	return (
		<div
			className={cn(
				"min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100",
				"dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
				"transition-all duration-500",
				isFullscreen && "p-0",
			)}
		>
			<div className="container mx-auto max-w-7xl p-6">
				{/* Header Controls */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="mb-6 flex items-center justify-between"
				>
					<div className="flex items-center gap-4">
						<Badge variant="outline" className="flex items-center gap-2">
							<div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
							Live Dashboard
						</Badge>
					</div>

					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							size="sm"
							onClick={() => window.location.reload()}
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							Refresh
						</Button>

						<Button variant="outline" size="sm" onClick={toggleFullscreen}>
							{isFullscreen ? (
								<Minimize2 className="mr-2 h-4 w-4" />
							) : (
								<Maximize2 className="mr-2 h-4 w-4" />
							)}
							{isFullscreen ? "Exit" : "Fullscreen"}
						</Button>

						<Button variant="outline" size="sm">
							<Bell className="mr-2 h-4 w-4" />
							Alerts
							<Badge variant="secondary" className="ml-2">
								2
							</Badge>
						</Button>
					</div>
				</motion.div>

				{/* Welcome Header */}
				<WelcomeHeader userName={userName} userEmail={userEmail} />

				{/* Animated Tabs Dashboard */}
				<AnimatedTabs
					tabs={dashboardTabs}
					activeTab={activeTab}
					onTabChange={setActiveTab}
				/>

				{/* Footer */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 1, duration: 0.5 }}
					className="mt-12 border-gray-200 border-t pt-6 dark:border-gray-700"
				>
					<div className="flex items-center justify-between text-muted-foreground text-sm">
						<div>
							© 2024 GCMC-KAJ Business Tax Services. All rights reserved.
						</div>
						<div className="flex items-center gap-4">
							<span>Last updated: {new Date().toLocaleString()}</span>
							<Badge variant="outline" className="text-xs">
								v2.1.0
							</Badge>
						</div>
					</div>
				</motion.div>
			</div>
		</div>
	);
}
