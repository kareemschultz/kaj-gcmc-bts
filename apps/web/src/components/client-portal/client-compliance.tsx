"use client";

import {
	AlertTriangle,
	CheckCircle,
	Clock,
	FileCheck,
	Shield,
	TrendingDown,
	TrendingUp,
	Users,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import {
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
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

interface ComplianceItem {
	id: number;
	category: string;
	requirement: string;
	status: "compliant" | "partial" | "non-compliant" | "pending";
	score: number;
	lastUpdated: string;
	nextDeadline?: string;
	description: string;
	actions: string[];
}

interface ClientComplianceProps {
	user: User;
}

// Mock compliance data
const mockComplianceData = {
	overallScore: 85,
	trend: "+5%",
	lastUpdated: "2024-11-19",
	categories: [
		{ name: "Tax Compliance", score: 92, color: "#22c55e" },
		{ name: "Legal Requirements", score: 78, color: "#3b82f6" },
		{ name: "Financial Reporting", score: 88, color: "#8b5cf6" },
		{ name: "Employment Law", score: 85, color: "#f59e0b" },
		{ name: "Environmental", score: 75, color: "#ef4444" },
	],
	monthlyTrend: [
		{ month: "Jun", score: 78 },
		{ month: "Jul", score: 80 },
		{ month: "Aug", score: 82 },
		{ month: "Sep", score: 79 },
		{ month: "Oct", score: 83 },
		{ month: "Nov", score: 85 },
	],
	breakdown: [
		{ name: "Compliant", value: 68, color: "#22c55e" },
		{ name: "Partial", value: 15, color: "#f59e0b" },
		{ name: "Non-Compliant", value: 12, color: "#ef4444" },
		{ name: "Pending", value: 5, color: "#6b7280" },
	],
};

const mockComplianceItems: ComplianceItem[] = [
	{
		id: 1,
		category: "Tax Compliance",
		requirement: "Quarterly Tax Returns",
		status: "compliant",
		score: 100,
		lastUpdated: "2024-11-15",
		nextDeadline: "2024-12-15",
		description: "All quarterly tax returns filed on time",
		actions: ["Review Q4 preparation", "Gather supporting documents"],
	},
	{
		id: 2,
		category: "Legal Requirements",
		requirement: "Business License Renewal",
		status: "pending",
		score: 0,
		lastUpdated: "2024-11-10",
		nextDeadline: "2024-12-31",
		description: "Annual business license renewal pending",
		actions: ["Submit renewal application", "Pay renewal fees"],
	},
	{
		id: 3,
		category: "Financial Reporting",
		requirement: "Annual Financial Statements",
		status: "partial",
		score: 60,
		lastUpdated: "2024-11-01",
		nextDeadline: "2024-12-31",
		description: "Financial statements drafted, pending audit",
		actions: ["Complete audit process", "Submit to authorities"],
	},
	{
		id: 4,
		category: "Employment Law",
		requirement: "NIS Contributions",
		status: "compliant",
		score: 100,
		lastUpdated: "2024-11-18",
		nextDeadline: "2024-12-15",
		description: "All employee NIS contributions up to date",
		actions: ["Prepare December contributions"],
	},
	{
		id: 5,
		category: "Environmental",
		requirement: "Environmental Impact Assessment",
		status: "non-compliant",
		score: 25,
		lastUpdated: "2024-10-15",
		nextDeadline: "2024-11-30",
		description: "Environmental assessment overdue",
		actions: ["Schedule assessment", "Submit required documentation"],
	},
];

const statusColors = {
	compliant: "bg-green-100 text-green-800 border-green-200",
	partial: "bg-yellow-100 text-yellow-800 border-yellow-200",
	"non-compliant": "bg-red-100 text-red-800 border-red-200",
	pending: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusIcons = {
	compliant: <CheckCircle className="h-4 w-4 text-green-600" />,
	partial: <Clock className="h-4 w-4 text-yellow-600" />,
	"non-compliant": <XCircle className="h-4 w-4 text-red-600" />,
	pending: <AlertTriangle className="h-4 w-4 text-gray-600" />,
};

export function ClientCompliance({ user }: ClientComplianceProps) {
	const [selectedCategory, setSelectedCategory] = useState<string>("all");

	const filteredItems = mockComplianceItems.filter(
		(item) => selectedCategory === "all" || item.category === selectedCategory
	);

	const getScoreColor = (score: number) => {
		if (score >= 90) return "text-green-600";
		if (score >= 80) return "text-blue-600";
		if (score >= 70) return "text-yellow-600";
		return "text-red-600";
	};

	const getScoreBg = (score: number) => {
		if (score >= 90) return "bg-green-50 border-green-200";
		if (score >= 80) return "bg-blue-50 border-blue-200";
		if (score >= 70) return "bg-yellow-50 border-yellow-200";
		return "bg-red-50 border-red-200";
	};

	const getTrendIcon = (trend: string) => {
		if (trend.startsWith("+")) {
			return <TrendingUp className="h-4 w-4 text-green-600" />;
		}
		return <TrendingDown className="h-4 w-4 text-red-600" />;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Compliance Dashboard</h1>
					<p className="text-muted-foreground">
						Monitor your business compliance status and requirements
					</p>
				</div>
				<div
					className={`rounded-xl p-6 text-center ${getScoreBg(mockComplianceData.overallScore)}`}
				>
					<div className={`font-bold text-3xl ${getScoreColor(mockComplianceData.overallScore)}`}>
						{mockComplianceData.overallScore}%
					</div>
					<div className="flex items-center justify-center space-x-1 text-sm">
						{getTrendIcon(mockComplianceData.trend)}
						<span>Overall Compliance Score</span>
					</div>
					<p className="text-muted-foreground text-xs">
						{mockComplianceData.trend} from last month
					</p>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{mockComplianceData.breakdown.map((item, index) => (
					<Card key={index}>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-muted-foreground text-sm">{item.name}</p>
									<p className="font-bold text-2xl">{item.value}</p>
								</div>
								<div
									className="h-12 w-12 rounded-full"
									style={{ backgroundColor: `${item.color}20` }}
								>
									<div className="flex h-full items-center justify-center">
										<div
											className="h-6 w-6 rounded-full"
											style={{ backgroundColor: item.color }}
										/>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Main Content */}
			<Tabs defaultValue="overview" className="space-y-6">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="categories">By Category</TabsTrigger>
					<TabsTrigger value="requirements">Requirements</TabsTrigger>
					<TabsTrigger value="actions">Action Items</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Compliance Trend */}
						<Card>
							<CardHeader>
								<CardTitle>Compliance Trend</CardTitle>
								<CardDescription>
									Monthly compliance score over the last 6 months
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<LineChart data={mockComplianceData.monthlyTrend}>
										<XAxis dataKey="month" />
										<YAxis domain={[70, 90]} />
										<Tooltip />
										<Line
											type="monotone"
											dataKey="score"
											stroke="#3b82f6"
											strokeWidth={3}
											dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
										/>
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Compliance Breakdown */}
						<Card>
							<CardHeader>
								<CardTitle>Compliance Status Breakdown</CardTitle>
								<CardDescription>
									Current status distribution across all requirements
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<PieChart>
										<Pie
											data={mockComplianceData.breakdown}
											cx="50%"
											cy="50%"
											innerRadius={60}
											outerRadius={120}
											paddingAngle={5}
											dataKey="value"
										>
											{mockComplianceData.breakdown.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.color} />
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="categories" className="space-y-6">
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{mockComplianceData.categories.map((category, index) => (
							<Card key={index}>
								<CardHeader>
									<CardTitle className="flex items-center justify-between">
										<span>{category.name}</span>
										<Badge className={getScoreBg(category.score).replace("bg-", "bg-").replace("border-", "text-")}>
											{category.score}%
										</Badge>
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<div className="flex justify-between text-sm">
											<span>Compliance Score</span>
											<span className={getScoreColor(category.score)}>
												{category.score}%
											</span>
										</div>
										<Progress value={category.score} className="h-3" />
									</div>
									<div className="space-y-2">
										<div className="flex items-center space-x-2 text-sm">
											<Shield className="h-4 w-4 text-muted-foreground" />
											<span className="text-muted-foreground">
												{Math.floor(category.score / 20)} requirements compliant
											</span>
										</div>
									</div>
									<Button variant="outline" className="w-full">
										View Details
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="requirements" className="space-y-6">
					{/* Filter */}
					<div className="flex items-center space-x-4">
						<span className="text-sm font-medium">Filter by category:</span>
						<div className="flex flex-wrap gap-2">
							<Button
								variant={selectedCategory === "all" ? "default" : "outline"}
								size="sm"
								onClick={() => setSelectedCategory("all")}
							>
								All
							</Button>
							{mockComplianceData.categories.map((category) => (
								<Button
									key={category.name}
									variant={selectedCategory === category.name ? "default" : "outline"}
									size="sm"
									onClick={() => setSelectedCategory(category.name)}
								>
									{category.name}
								</Button>
							))}
						</div>
					</div>

					{/* Requirements List */}
					<div className="space-y-4">
						{filteredItems.map((item) => (
							<Card key={item.id}>
								<CardContent className="p-6">
									<div className="space-y-4">
										<div className="flex items-start justify-between">
											<div className="space-y-2">
												<div className="flex items-center space-x-2">
													{statusIcons[item.status]}
													<h3 className="font-semibold">{item.requirement}</h3>
													<Badge className={statusColors[item.status]}>
														{item.status.replace("-", " ")}
													</Badge>
												</div>
												<p className="text-muted-foreground text-sm">
													{item.description}
												</p>
												<div className="flex items-center space-x-4 text-sm">
													<span className="text-muted-foreground">
														Category: {item.category}
													</span>
													<span className="text-muted-foreground">
														Last updated: {new Date(item.lastUpdated).toLocaleDateString()}
													</span>
													{item.nextDeadline && (
														<span className="text-muted-foreground">
															Next deadline: {new Date(item.nextDeadline).toLocaleDateString()}
														</span>
													)}
												</div>
											</div>
											<div className="text-center">
												<div className={`font-bold text-2xl ${getScoreColor(item.score)}`}>
													{item.score}%
												</div>
												<p className="text-muted-foreground text-sm">Score</p>
											</div>
										</div>

										{item.actions.length > 0 && (
											<div className="space-y-2">
												<h4 className="font-medium text-sm">Required Actions:</h4>
												<ul className="space-y-1">
													{item.actions.map((action, actionIndex) => (
														<li
															key={actionIndex}
															className="flex items-center space-x-2 text-sm"
														>
															<div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
															<span>{action}</span>
														</li>
													))}
												</ul>
											</div>
										)}

										<div className="flex justify-end space-x-2">
											<Button variant="outline" size="sm">
												View Details
											</Button>
											{item.status !== "compliant" && (
												<Button size="sm">
													Take Action
												</Button>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>

				<TabsContent value="actions" className="space-y-6">
					{/* Urgent Actions */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<AlertTriangle className="h-5 w-5 text-red-600" />
								Urgent Actions Required
							</CardTitle>
							<CardDescription>
								Items requiring immediate attention
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{filteredItems
									.filter((item) => item.status === "non-compliant" || item.status === "pending")
									.map((item) => (
										<div
											key={item.id}
											className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4"
										>
											<div>
												<h4 className="font-semibold">{item.requirement}</h4>
												<p className="text-muted-foreground text-sm">{item.category}</p>
												{item.nextDeadline && (
													<p className="text-red-600 text-sm">
														Deadline: {new Date(item.nextDeadline).toLocaleDateString()}
													</p>
												)}
											</div>
											<div className="flex items-center space-x-2">
												<Badge className={statusColors[item.status]}>
													{item.status.replace("-", " ")}
												</Badge>
												<Button variant="destructive" size="sm">
													Take Action
												</Button>
											</div>
										</div>
									))}
							</div>
						</CardContent>
					</Card>

					{/* All Action Items */}
					<Card>
						<CardHeader>
							<CardTitle>All Action Items</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{mockComplianceItems
									.flatMap((item) => item.actions.map((action) => ({ ...item, action })))
									.map((actionItem, index) => (
										<div
											key={index}
											className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
										>
											<div>
												<h4 className="font-medium text-sm">{actionItem.action}</h4>
												<p className="text-muted-foreground text-xs">
													{actionItem.requirement} • {actionItem.category}
												</p>
											</div>
											<div className="flex items-center space-x-2">
												<Badge className={statusColors[actionItem.status]}>
													{actionItem.status.replace("-", " ")}
												</Badge>
												<Button variant="outline" size="sm">
													Complete
												</Button>
											</div>
										</div>
									))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}