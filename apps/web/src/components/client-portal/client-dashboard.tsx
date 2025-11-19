"use client";

import {
	AlertTriangle,
	ArrowRight,
	Calendar,
	CheckCircle,
	CreditCard,
	FileText,
	MessageCircle,
	Plus,
	TrendingUp,
	Upload,
	Users,
	Clock,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
	name?: string;
	email?: string;
	image?: string;
}

interface ClientDashboardProps {
	user: User;
}

// Mock data - in real app this would come from API
const mockData = {
	complianceScore: 85,
	pendingTasks: 7,
	upcomingDeadlines: 3,
	unreadMessages: 5,
	recentDocuments: [
		{
			id: 1,
			name: "Tax Certificate 2024",
			type: "PDF",
			uploadedAt: "2 hours ago",
			status: "processed",
		},
		{
			id: 2,
			name: "Business License Renewal",
			type: "PDF",
			uploadedAt: "1 day ago",
			status: "pending",
		},
		{
			id: 3,
			name: "Financial Statement Q3",
			type: "PDF",
			uploadedAt: "3 days ago",
			status: "approved",
		},
	],
	upcomingEvents: [
		{
			id: 1,
			title: "Quarterly Tax Filing",
			date: "Dec 15, 2024",
			daysLeft: 5,
			priority: "high",
		},
		{
			id: 2,
			title: "Business License Renewal",
			date: "Jan 10, 2025",
			daysLeft: 31,
			priority: "medium",
		},
		{
			id: 3,
			title: "NIS Contribution Review",
			date: "Jan 25, 2025",
			daysLeft: 46,
			priority: "low",
		},
	],
	complianceHistory: [
		{ month: "Jul", score: 78 },
		{ month: "Aug", score: 82 },
		{ month: "Sep", score: 79 },
		{ month: "Oct", score: 85 },
		{ month: "Nov", score: 88 },
		{ month: "Dec", score: 85 },
	],
	recentActivity: [
		{
			id: 1,
			action: "Document uploaded",
			item: "Tax Certificate 2024",
			timestamp: "2 hours ago",
			icon: Upload,
		},
		{
			id: 2,
			action: "Message received",
			item: "Filing deadline reminder",
			timestamp: "4 hours ago",
			icon: MessageCircle,
		},
		{
			id: 3,
			action: "Payment processed",
			item: "Service fee for tax filing",
			timestamp: "1 day ago",
			icon: CreditCard,
		},
		{
			id: 4,
			action: "Document approved",
			item: "Business License Application",
			timestamp: "2 days ago",
			icon: CheckCircle,
		},
	],
};

export function ClientDashboard({ user }: ClientDashboardProps) {
	const [selectedTab, setSelectedTab] = useState("overview");

	const getComplianceColor = (score: number) => {
		if (score >= 90) return "text-emerald-600";
		if (score >= 80) return "text-blue-600";
		if (score >= 70) return "text-yellow-600";
		return "text-red-600";
	};

	const getComplianceBg = (score: number) => {
		if (score >= 90) return "bg-emerald-50 border-emerald-200";
		if (score >= 80) return "bg-blue-50 border-blue-200";
		if (score >= 70) return "bg-yellow-50 border-yellow-200";
		return "bg-red-50 border-red-200";
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high":
				return "destructive";
			case "medium":
				return "secondary";
			default:
				return "outline";
		}
	};

	return (
		<div className="space-y-8">
			{/* Welcome Header */}
			<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white">
				<div className="absolute inset-0 bg-black/10" />
				<div className="relative z-10">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="font-bold text-3xl">
								Welcome back, {user.name?.split(" ")[0] || "User"}!
							</h1>
							<p className="mt-2 text-blue-100">
								Let's keep your business compliant and growing
							</p>
						</div>
						<div className="hidden md:block">
							<div
								className={cn(
									"rounded-xl p-4 text-center",
									getComplianceBg(mockData.complianceScore)
								)}
							>
								<div
									className={cn(
										"font-bold text-3xl",
										getComplianceColor(mockData.complianceScore)
									)}
								>
									{mockData.complianceScore}%
								</div>
								<p className="text-muted-foreground text-sm">
									Compliance Score
								</p>
							</div>
						</div>
					</div>
				</div>
				{/* Decorative Elements */}
				<div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
				<div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10" />
			</div>

			{/* Quick Stats */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				<Card className="transition-all duration-200 hover:scale-105 hover:shadow-lg">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Pending Tasks</p>
								<p className="font-bold text-2xl">{mockData.pendingTasks}</p>
							</div>
							<div className="rounded-full bg-orange-100 p-3">
								<Clock className="h-6 w-6 text-orange-600" />
							</div>
						</div>
						<div className="mt-4 flex items-center text-sm">
							<Badge variant="secondary" className="bg-orange-50 text-orange-700">
								3 high priority
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card className="transition-all duration-200 hover:scale-105 hover:shadow-lg">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Deadlines</p>
								<p className="font-bold text-2xl">{mockData.upcomingDeadlines}</p>
							</div>
							<div className="rounded-full bg-red-100 p-3">
								<Calendar className="h-6 w-6 text-red-600" />
							</div>
						</div>
						<div className="mt-4 flex items-center text-sm">
							<Badge variant="destructive">Next in 5 days</Badge>
						</div>
					</CardContent>
				</Card>

				<Card className="transition-all duration-200 hover:scale-105 hover:shadow-lg">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Messages</p>
								<p className="font-bold text-2xl">{mockData.unreadMessages}</p>
							</div>
							<div className="rounded-full bg-blue-100 p-3">
								<MessageCircle className="h-6 w-6 text-blue-600" />
							</div>
						</div>
						<div className="mt-4 flex items-center text-sm">
							<Badge className="bg-blue-50 text-blue-700">2 from advisor</Badge>
						</div>
					</CardContent>
				</Card>

				<Card className="transition-all duration-200 hover:scale-105 hover:shadow-lg">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Documents</p>
								<p className="font-bold text-2xl">
									{mockData.recentDocuments.length}
								</p>
							</div>
							<div className="rounded-full bg-green-100 p-3">
								<FileText className="h-6 w-6 text-green-600" />
							</div>
						</div>
						<div className="mt-4 flex items-center text-sm">
							<Badge variant="default" className="bg-green-50 text-green-700">
								1 pending review
							</Badge>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Tabs */}
			<Tabs value={selectedTab} onValueChange={setSelectedTab}>
				<TabsList className="grid w-full grid-cols-3 lg:w-fit">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="tasks">Tasks & Deadlines</TabsTrigger>
					<TabsTrigger value="activity">Recent Activity</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="mt-6 space-y-6">
					<div className="grid gap-6 lg:grid-cols-3">
						{/* Compliance Trend */}
						<Card className="lg:col-span-2">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<TrendingUp className="h-5 w-5 text-blue-600" />
									Compliance Trend
								</CardTitle>
								<CardDescription>
									Your compliance score over the last 6 months
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={200}>
									<AreaChart data={mockData.complianceHistory}>
										<defs>
											<linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
												<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
											</linearGradient>
										</defs>
										<XAxis dataKey="month" />
										<YAxis domain={[60, 100]} />
										<Tooltip />
										<Area
											type="monotone"
											dataKey="score"
											stroke="#3b82f6"
											strokeWidth={3}
											fillOpacity={1}
											fill="url(#colorScore)"
										/>
									</AreaChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Quick Actions */}
						<Card>
							<CardHeader>
								<CardTitle>Quick Actions</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<Link href="/client-portal/documents">
									<Button variant="outline" className="w-full justify-start">
										<Upload className="mr-2 h-4 w-4" />
										Upload Document
									</Button>
								</Link>
								<Link href="/client-portal/messages">
									<Button variant="outline" className="w-full justify-start">
										<MessageCircle className="mr-2 h-4 w-4" />
										Send Message
									</Button>
								</Link>
								<Link href="/client-portal/calendar">
									<Button variant="outline" className="w-full justify-start">
										<Calendar className="mr-2 h-4 w-4" />
										View Calendar
									</Button>
								</Link>
								<Link href="/client-portal/support">
									<Button className="w-full justify-start">
										<Plus className="mr-2 h-4 w-4" />
										Request Service
									</Button>
								</Link>
							</CardContent>
						</Card>
					</div>

					{/* Recent Documents */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Recent Documents</CardTitle>
								<CardDescription>
									Your latest uploaded documents
								</CardDescription>
							</div>
							<Link href="/client-portal/documents">
								<Button variant="outline" size="sm">
									View All
									<ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							</Link>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{mockData.recentDocuments.map((doc) => (
									<div
										key={doc.id}
										className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
									>
										<div className="flex items-center space-x-4">
											<div className="rounded-lg bg-blue-100 p-2">
												<FileText className="h-4 w-4 text-blue-600" />
											</div>
											<div>
												<p className="font-medium">{doc.name}</p>
												<p className="text-muted-foreground text-sm">
													{doc.type} • {doc.uploadedAt}
												</p>
											</div>
										</div>
										<Badge
											variant={
												doc.status === "approved"
													? "default"
													: doc.status === "processed"
														? "secondary"
														: "outline"
											}
										>
											{doc.status}
										</Badge>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="tasks" className="mt-6">
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Upcoming Deadlines */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<AlertTriangle className="h-5 w-5 text-amber-600" />
									Upcoming Deadlines
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{mockData.upcomingEvents.map((event) => (
									<div
										key={event.id}
										className="flex items-center justify-between rounded-lg border p-4"
									>
										<div>
											<p className="font-medium">{event.title}</p>
											<p className="text-muted-foreground text-sm">
												{event.date}
											</p>
										</div>
										<div className="text-right">
											<Badge variant={getPriorityColor(event.priority)}>
												{event.daysLeft} days
											</Badge>
										</div>
									</div>
								))}
							</CardContent>
						</Card>

						{/* Compliance Progress */}
						<Card>
							<CardHeader>
								<CardTitle>Compliance Progress</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Tax Filings</span>
										<span>90%</span>
									</div>
									<Progress value={90} className="h-2" />
								</div>
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Document Management</span>
										<span>85%</span>
									</div>
									<Progress value={85} className="h-2" />
								</div>
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Regulatory Compliance</span>
										<span>78%</span>
									</div>
									<Progress value={78} className="h-2" />
								</div>
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span>Payment Status</span>
										<span>92%</span>
									</div>
									<Progress value={92} className="h-2" />
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="activity" className="mt-6">
					<Card>
						<CardHeader>
							<CardTitle>Recent Activity</CardTitle>
							<CardDescription>
								Your latest account activities and updates
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{mockData.recentActivity.map((activity) => {
									const IconComponent = activity.icon;
									return (
										<div
											key={activity.id}
											className="flex items-start space-x-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
										>
											<div className="rounded-full bg-primary/10 p-2">
												<IconComponent className="h-4 w-4 text-primary" />
											</div>
											<div className="flex-1 space-y-1">
												<p className="text-sm">
													<span className="font-medium">{activity.action}</span>{" "}
													<span className="text-muted-foreground">
														{activity.item}
													</span>
												</p>
												<p className="text-muted-foreground text-xs">
													{activity.timestamp}
												</p>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

// Utility function to conditionally combine class names
function cn(...classes: (string | undefined)[]): string {
	return classes.filter(Boolean).join(" ");
}