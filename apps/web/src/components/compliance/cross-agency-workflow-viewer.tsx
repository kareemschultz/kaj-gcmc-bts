"use client";

import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	Clock,
	Download,
	Eye,
	Filter,
	GitBranch,
	Network,
	PauseCircle,
	PlayCircle,
	Plus,
	RefreshCw,
	Route,
	Shuffle,
	Users,
	Workflow,
	Zap,
} from "lucide-react";
import { useState } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * Cross-Agency Workflow Viewer
 *
 * Comprehensive visualization and management of workflows that span multiple agencies:
 * - Dependency visualization with interactive workflow mapping
 * - Process orchestration with stage-by-stage tracking
 * - Bottleneck identification and optimization recommendations
 * - Real-time status updates across all agencies
 * - Automated escalation and notification systems
 * - Performance analytics and improvement suggestions
 */

interface CrossAgencyWorkflowProps {
	className?: string;
}

interface WorkflowStep {
	id: string;
	agency: "GRA" | "NIS" | "DCRA" | "Immigration";
	stepName: string;
	description: string;
	status: "pending" | "in_progress" | "completed" | "blocked" | "failed";
	estimatedDuration: number;
	actualDuration?: number;
	dependencies: string[];
	assignee?: string;
	dueDate: string;
	completedDate?: string;
}

interface CrossAgencyWorkflow {
	id: string;
	workflowName: string;
	clientName: string;
	workflowType:
		| "Business Setup"
		| "Employee Onboarding"
		| "Investment Application"
		| "Compliance Audit"
		| "License Renewal";
	startDate: string;
	estimatedCompletion: string;
	actualCompletion?: string;
	status: "draft" | "active" | "completed" | "paused" | "cancelled";
	priority: "low" | "medium" | "high" | "critical";
	overallProgress: number;
	steps: WorkflowStep[];
	blockers: number;
	dependencies: number;
}

interface WorkflowDependency {
	id: string;
	fromAgency: string;
	toAgency: string;
	dependencyType: "document" | "approval" | "payment" | "registration";
	description: string;
	status: "waiting" | "resolved" | "blocked";
}

const mockWorkflows: CrossAgencyWorkflow[] = [
	{
		id: "1",
		workflowName: "New Business Complete Setup",
		clientName: "Tech Innovations Ltd",
		workflowType: "Business Setup",
		startDate: "2024-11-15",
		estimatedCompletion: "2024-12-30",
		status: "active",
		priority: "high",
		overallProgress: 65,
		blockers: 1,
		dependencies: 3,
		steps: [
			{
				id: "1a",
				agency: "DCRA",
				stepName: "Business Registration",
				description: "Register new company with DCRA",
				status: "completed",
				estimatedDuration: 7,
				actualDuration: 5,
				dependencies: [],
				assignee: "DCRA Officer",
				dueDate: "2024-11-22",
				completedDate: "2024-11-20",
			},
			{
				id: "1b",
				agency: "GRA",
				stepName: "Tax Registration",
				description: "Register for GRA tax obligations",
				status: "completed",
				estimatedDuration: 5,
				actualDuration: 3,
				dependencies: ["1a"],
				assignee: "GRA Officer",
				dueDate: "2024-11-27",
				completedDate: "2024-11-23",
			},
			{
				id: "1c",
				agency: "NIS",
				stepName: "Employer Registration",
				description: "Register as employer with NIS",
				status: "in_progress",
				estimatedDuration: 3,
				dependencies: ["1a"],
				assignee: "NIS Officer",
				dueDate: "2024-11-25",
			},
			{
				id: "1d",
				agency: "Immigration",
				stepName: "Work Permit Processing",
				description: "Process work permits for foreign employees",
				status: "blocked",
				estimatedDuration: 14,
				dependencies: ["1a", "1b"],
				assignee: "Immigration Officer",
				dueDate: "2024-12-10",
			},
		],
	},
	{
		id: "2",
		workflowName: "Foreign Employee Onboarding",
		clientName: "ABC Trading Ltd",
		workflowType: "Employee Onboarding",
		startDate: "2024-11-20",
		estimatedCompletion: "2024-12-20",
		status: "active",
		priority: "medium",
		overallProgress: 25,
		blockers: 0,
		dependencies: 2,
		steps: [
			{
				id: "2a",
				agency: "Immigration",
				stepName: "Work Permit Application",
				description: "Submit work permit application",
				status: "in_progress",
				estimatedDuration: 14,
				dependencies: [],
				assignee: "Immigration Officer",
				dueDate: "2024-12-04",
			},
			{
				id: "2b",
				agency: "NIS",
				stepName: "Employee Registration",
				description: "Register employee with NIS",
				status: "pending",
				estimatedDuration: 2,
				dependencies: ["2a"],
				dueDate: "2024-12-06",
			},
		],
	},
];

const mockDependencies: WorkflowDependency[] = [
	{
		id: "1",
		fromAgency: "DCRA",
		toAgency: "GRA",
		dependencyType: "document",
		description:
			"Business registration certificate required for tax registration",
		status: "resolved",
	},
	{
		id: "2",
		fromAgency: "GRA",
		toAgency: "Immigration",
		dependencyType: "document",
		description: "Tax registration number required for work permit",
		status: "resolved",
	},
	{
		id: "3",
		fromAgency: "Immigration",
		toAgency: "NIS",
		dependencyType: "document",
		description: "Work permit approval required for NIS registration",
		status: "waiting",
	},
];

export function CrossAgencyWorkflowViewer({
	className,
}: CrossAgencyWorkflowProps) {
	const [selectedWorkflow, setSelectedWorkflow] = useState<string>("all");
	const [viewMode, setViewMode] = useState<"list" | "diagram" | "timeline">(
		"list",
	);

	const activeWorkflows = mockWorkflows.filter(
		(w) => w.status === "active",
	).length;
	const totalBlockers = mockWorkflows.reduce((sum, w) => sum + w.blockers, 0);
	const avgProgress =
		mockWorkflows.reduce((sum, w) => sum + w.overallProgress, 0) /
		mockWorkflows.length;
	const pendingDependencies = mockDependencies.filter(
		(d) => d.status === "waiting",
	).length;

	return (
		<div className={cn("space-y-6", className)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="flex items-center gap-3 font-bold text-3xl tracking-tight">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-sm text-white">
							<Network className="h-6 w-6" />
						</div>
						Cross-Agency Workflows
					</h2>
					<p className="text-lg text-muted-foreground">
						Visualize and manage complex workflows across multiple agencies
					</p>
				</div>
				<div className="flex gap-2">
					<Select value={viewMode} onValueChange={setViewMode}>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="list">List View</SelectItem>
							<SelectItem value="diagram">Diagram</SelectItem>
							<SelectItem value="timeline">Timeline</SelectItem>
						</SelectContent>
					</Select>
					<Button variant="outline">
						<Download className="mr-2 h-4 w-4" />
						Export
					</Button>
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						New Workflow
					</Button>
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card className="border-l-4 border-l-blue-500">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Active Workflows
						</CardTitle>
						<Workflow className="h-4 w-4 text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{activeWorkflows}</div>
						<p className="text-muted-foreground text-xs">Currently running</p>
					</CardContent>
				</Card>

				<Card className="border-l-4 border-l-green-500">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Average Progress
						</CardTitle>
						<RefreshCw className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{avgProgress.toFixed(1)}%</div>
						<Progress value={avgProgress} className="mt-2 h-2" />
						<p className="text-muted-foreground text-xs">
							Across all workflows
						</p>
					</CardContent>
				</Card>

				<Card
					className={cn(
						"border-l-4",
						totalBlockers > 0 ? "border-l-destructive" : "border-l-success",
					)}
				>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Current Blockers
						</CardTitle>
						<AlertTriangle
							className={cn(
								"h-4 w-4",
								totalBlockers > 0 ? "text-destructive" : "text-success",
							)}
						/>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{totalBlockers}</div>
						<p className="text-muted-foreground text-xs">
							Requiring intervention
						</p>
						{totalBlockers > 0 && (
							<Badge variant="destructive" className="mt-2">
								Action Required
							</Badge>
						)}
					</CardContent>
				</Card>

				<Card
					className={cn(
						"border-l-4",
						pendingDependencies > 0 ? "border-l-warning" : "border-l-success",
					)}
				>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Pending Dependencies
						</CardTitle>
						<GitBranch
							className={cn(
								"h-4 w-4",
								pendingDependencies > 0 ? "text-warning" : "text-success",
							)}
						/>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{pendingDependencies}</div>
						<p className="text-muted-foreground text-xs">Awaiting resolution</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="overview" className="space-y-6">
				<TabsList>
					<TabsTrigger value="overview">Workflow Overview</TabsTrigger>
					<TabsTrigger value="dependencies">Dependencies</TabsTrigger>
					<TabsTrigger value="performance">Performance Analytics</TabsTrigger>
					<TabsTrigger value="optimization">Optimization</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					{viewMode === "list" && <WorkflowListView />}
					{viewMode === "diagram" && <WorkflowDiagramView />}
					{viewMode === "timeline" && <WorkflowTimelineView />}
				</TabsContent>

				<TabsContent value="dependencies" className="space-y-6">
					<DependencyManager />
				</TabsContent>

				<TabsContent value="performance" className="space-y-6">
					<PerformanceAnalytics />
				</TabsContent>

				<TabsContent value="optimization" className="space-y-6">
					<OptimizationRecommendations />
				</TabsContent>
			</Tabs>
		</div>
	);
}

function WorkflowListView() {
	return (
		<div className="space-y-4">
			{mockWorkflows.map((workflow) => (
				<WorkflowCard key={workflow.id} workflow={workflow} />
			))}
		</div>
	);
}

function WorkflowCard({ workflow }: { workflow: CrossAgencyWorkflow }) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Badge
							variant={
								workflow.status === "completed"
									? "success"
									: workflow.status === "active"
										? "info"
										: workflow.status === "paused"
											? "warning"
											: workflow.status === "cancelled"
												? "destructive"
												: "outline"
							}
						>
							{workflow.status.charAt(0).toUpperCase() +
								workflow.status.slice(1)}
						</Badge>
						<div>
							<CardTitle className="text-base">
								{workflow.workflowName}
							</CardTitle>
							<CardDescription>
								{workflow.clientName} - {workflow.workflowType}
							</CardDescription>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Badge
							variant={
								workflow.priority === "critical"
									? "destructive"
									: workflow.priority === "high"
										? "warning"
										: workflow.priority === "medium"
											? "info"
											: "outline"
							}
						>
							{workflow.priority.charAt(0).toUpperCase() +
								workflow.priority.slice(1)}{" "}
							Priority
						</Badge>
						<Button variant="outline" size="sm">
							<Eye className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{/* Progress Overview */}
					<div>
						<div className="mb-2 flex justify-between text-sm">
							<span>Overall Progress</span>
							<span className="font-medium">{workflow.overallProgress}%</span>
						</div>
						<Progress value={workflow.overallProgress} className="h-3" />
						<div className="mt-1 flex justify-between text-muted-foreground text-xs">
							<span>Started: {workflow.startDate}</span>
							<span>Est. Completion: {workflow.estimatedCompletion}</span>
						</div>
					</div>

					{/* Workflow Steps */}
					<div className="space-y-2">
						<h4 className="font-medium text-sm">Workflow Steps</h4>
						<div className="grid gap-2">
							{workflow.steps.map((step, index) => (
								<WorkflowStepItem
									key={step.id}
									step={step}
									isLast={index === workflow.steps.length - 1}
								/>
							))}
						</div>
					</div>

					{/* Issues */}
					{(workflow.blockers > 0 || workflow.dependencies > 0) && (
						<div className="flex gap-4 text-sm">
							{workflow.blockers > 0 && (
								<div className="flex items-center gap-1 text-destructive">
									<AlertTriangle className="h-3 w-3" />
									<span>
										{workflow.blockers} blocker
										{workflow.blockers !== 1 ? "s" : ""}
									</span>
								</div>
							)}
							{workflow.dependencies > 0 && (
								<div className="flex items-center gap-1 text-warning">
									<GitBranch className="h-3 w-3" />
									<span>{workflow.dependencies} pending dependencies</span>
								</div>
							)}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function WorkflowStepItem({
	step,
	isLast,
}: {
	step: WorkflowStep;
	isLast: boolean;
}) {
	const agencyColors = {
		GRA: "bg-emerald-100 text-emerald-700",
		NIS: "bg-blue-100 text-blue-700",
		DCRA: "bg-amber-100 text-amber-700",
		Immigration: "bg-purple-100 text-purple-700",
	};

	return (
		<div className="flex items-center gap-3">
			<div className="flex flex-col items-center">
				<div
					className={cn(
						"h-3 w-3 rounded-full",
						step.status === "completed"
							? "bg-success"
							: step.status === "in_progress"
								? "bg-info"
								: step.status === "blocked"
									? "bg-destructive"
									: step.status === "failed"
										? "bg-destructive"
										: "bg-muted",
					)}
				/>
				{!isLast && <div className="mt-1 h-8 w-px bg-muted" />}
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							"rounded px-2 py-1 font-medium text-xs",
							agencyColors[step.agency],
						)}
					>
						{step.agency}
					</span>
					<span className="font-medium text-sm">{step.stepName}</span>
					<Badge
						variant={
							step.status === "completed"
								? "success"
								: step.status === "in_progress"
									? "info"
									: step.status === "blocked"
										? "destructive"
										: step.status === "failed"
											? "destructive"
											: "outline"
						}
						className="text-xs"
					>
						{step.status.replace("_", " ")}
					</Badge>
				</div>
				<p className="text-muted-foreground text-xs">{step.description}</p>
				<div className="mt-1 flex gap-4 text-muted-foreground text-xs">
					<span>Due: {step.dueDate}</span>
					{step.assignee && <span>Assignee: {step.assignee}</span>}
					{step.actualDuration && (
						<span>Completed in: {step.actualDuration} days</span>
					)}
				</div>
			</div>
		</div>
	);
}

function WorkflowDiagramView() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Workflow Diagram</CardTitle>
				<CardDescription>
					Interactive visualization of workflow dependencies and connections
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-center py-12">
					<div className="text-center">
						<Network className="mx-auto h-16 w-16 text-muted-foreground" />
						<p className="mt-4 text-muted-foreground">
							Interactive workflow diagram would be implemented here using a
							library like React Flow or D3.js to show agency relationships,
							dependencies, and process flow.
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function WorkflowTimelineView() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Timeline View</CardTitle>
				<CardDescription>
					Chronological view of workflow progress and milestones
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-6">
					{mockWorkflows.map((workflow) => (
						<div key={workflow.id} className="border-muted border-l-2 pl-4">
							<div className="mb-2 flex items-center gap-2">
								<h4 className="font-medium">{workflow.workflowName}</h4>
								<Badge variant="outline">{workflow.clientName}</Badge>
							</div>
							<div className="space-y-2">
								{workflow.steps.map((step) => (
									<div
										key={step.id}
										className="flex items-center gap-2 text-sm"
									>
										<div
											className={cn(
												"h-2 w-2 rounded-full",
												step.status === "completed"
													? "bg-success"
													: step.status === "in_progress"
														? "bg-info"
														: "bg-muted",
											)}
										/>
										<span>{step.stepName}</span>
										<span className="text-muted-foreground">
											({step.agency})
										</span>
										{step.completedDate && (
											<span className="text-muted-foreground text-xs">
												- Completed {step.completedDate}
											</span>
										)}
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function DependencyManager() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Dependency Management</CardTitle>
				<CardDescription>
					Track and resolve cross-agency dependencies
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{mockDependencies.map((dependency) => (
						<DependencyCard key={dependency.id} dependency={dependency} />
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function DependencyCard({ dependency }: { dependency: WorkflowDependency }) {
	return (
		<div className="flex items-center gap-4 rounded-lg border p-4">
			<div className="flex items-center gap-2">
				<Badge variant="outline">{dependency.fromAgency}</Badge>
				<ArrowRight className="h-4 w-4 text-muted-foreground" />
				<Badge variant="outline">{dependency.toAgency}</Badge>
			</div>
			<div className="flex-1">
				<p className="font-medium text-sm">{dependency.description}</p>
				<p className="text-muted-foreground text-xs">
					Type:{" "}
					{dependency.dependencyType.charAt(0).toUpperCase() +
						dependency.dependencyType.slice(1)}
				</p>
			</div>
			<Badge
				variant={
					dependency.status === "resolved"
						? "success"
						: dependency.status === "blocked"
							? "destructive"
							: "warning"
				}
			>
				{dependency.status.charAt(0).toUpperCase() + dependency.status.slice(1)}
			</Badge>
		</div>
	);
}

function PerformanceAnalytics() {
	return (
		<div className="grid gap-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Processing Times by Agency</CardTitle>
					<CardDescription>Average completion times</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[
							{ agency: "DCRA", avgTime: 5.2, target: 7, trend: "improving" },
							{ agency: "GRA", avgTime: 3.8, target: 5, trend: "stable" },
							{ agency: "NIS", avgTime: 2.1, target: 3, trend: "improving" },
							{
								agency: "Immigration",
								avgTime: 18.5,
								target: 14,
								trend: "declining",
							},
						].map((item) => (
							<div
								key={item.agency}
								className="flex items-center justify-between"
							>
								<div className="flex items-center gap-2">
									<span className="font-medium">{item.agency}</span>
									<Badge
										variant={
											item.trend === "improving"
												? "success"
												: item.trend === "declining"
													? "destructive"
													: "outline"
										}
									>
										{item.trend}
									</Badge>
								</div>
								<div className="text-right">
									<div className="font-medium">{item.avgTime} days</div>
									<div className="text-muted-foreground text-xs">
										Target: {item.target} days
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Bottleneck Analysis</CardTitle>
					<CardDescription>Common workflow bottlenecks</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[
							{
								issue: "Document verification delays",
								frequency: "High",
								impact: "Medium",
							},
							{
								issue: "Inter-agency communication gaps",
								frequency: "Medium",
								impact: "High",
							},
							{
								issue: "Missing documentation",
								frequency: "High",
								impact: "Low",
							},
							{
								issue: "Approval process delays",
								frequency: "Low",
								impact: "High",
							},
						].map((item, index) => (
							<div key={index} className="flex items-center justify-between">
								<span className="text-sm">{item.issue}</span>
								<div className="flex gap-2">
									<Badge
										variant={
											item.frequency === "High"
												? "destructive"
												: item.frequency === "Medium"
													? "warning"
													: "outline"
										}
									>
										{item.frequency}
									</Badge>
									<Badge
										variant={
											item.impact === "High"
												? "destructive"
												: item.impact === "Medium"
													? "warning"
													: "outline"
										}
									>
										{item.impact} Impact
									</Badge>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function OptimizationRecommendations() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Optimization Recommendations</CardTitle>
				<CardDescription>
					AI-powered suggestions to improve workflow efficiency
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{[
						{
							title: "Parallel Processing Opportunity",
							description:
								"GRA and NIS registrations can be processed simultaneously after DCRA approval",
							impact: "High",
							effort: "Low",
							savings: "3-5 days",
						},
						{
							title: "Document Pre-validation",
							description:
								"Implement automated document checking before submission to reduce rejections",
							impact: "Medium",
							effort: "Medium",
							savings: "2-3 days",
						},
						{
							title: "API Integration",
							description:
								"Direct system integration between agencies to reduce manual data entry",
							impact: "High",
							effort: "High",
							savings: "7-10 days",
						},
					].map((rec, index) => (
						<div key={index} className="rounded-lg border p-4">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<h4 className="font-medium">{rec.title}</h4>
									<p className="mt-1 text-muted-foreground text-sm">
										{rec.description}
									</p>
									<div className="mt-2 flex gap-2">
										<Badge variant={rec.impact === "High" ? "success" : "info"}>
											{rec.impact} Impact
										</Badge>
										<Badge
											variant={
												rec.effort === "Low"
													? "success"
													: rec.effort === "Medium"
														? "warning"
														: "destructive"
											}
										>
											{rec.effort} Effort
										</Badge>
									</div>
								</div>
								<div className="text-right">
									<div className="font-medium text-success">-{rec.savings}</div>
									<div className="text-muted-foreground text-xs">
										time savings
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
