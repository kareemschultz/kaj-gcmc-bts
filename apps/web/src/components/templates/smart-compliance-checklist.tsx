"use client";

import {
	AlertTriangle,
	CheckCircle,
	Clock,
	FileText,
	HelpCircle,
	Shield,
	Target,
	Users,
	XCircle,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Compliance item types
interface ComplianceItem {
	id: string;
	title: string;
	description: string;
	category: "tax" | "regulatory" | "environmental" | "employment" | "financial";
	priority: "critical" | "high" | "medium" | "low";
	frequency:
		| "daily"
		| "weekly"
		| "monthly"
		| "quarterly"
		| "annually"
		| "as_needed";
	applicableIf: {
		businessType?: string[];
		hasEmployees?: boolean;
		annualRevenue?: string[];
		industry?: string[];
		hasEnvironmentalImpact?: boolean;
	};
	tasks: ComplianceTask[];
	dueDate?: string;
	reminderDays?: number;
	resources: {
		title: string;
		url: string;
		type: "form" | "guide" | "law" | "contact";
	}[];
}

interface ComplianceTask {
	id: string;
	description: string;
	completed: boolean;
	dueDate?: string;
	assignedTo?: string;
	notes?: string;
	evidence?: string[];
}

// Business profile interface
interface BusinessProfile {
	businessType:
		| "sole_proprietorship"
		| "partnership"
		| "company"
		| "ngo"
		| "other";
	hasEmployees: boolean;
	employeeCount: number;
	annualRevenue: "under_100k" | "100k_500k" | "500k_1m" | "1m_5m" | "5m_plus";
	industry: string;
	hasEnvironmentalImpact: boolean;
	operationsStartDate: string;
	regions: string[];
}

// Compliance items database
const complianceItems: ComplianceItem[] = [
	{
		id: "income_tax_filing",
		title: "Income Tax Return Filing",
		description:
			"File annual income tax returns with GRA by the statutory deadline",
		category: "tax",
		priority: "critical",
		frequency: "annually",
		applicableIf: {},
		dueDate: "April 30",
		reminderDays: 60,
		tasks: [
			{
				id: "gather_income_docs",
				description: "Gather all income documentation",
				completed: false,
			},
			{
				id: "calculate_tax_liability",
				description: "Calculate total tax liability",
				completed: false,
			},
			{
				id: "complete_tax_forms",
				description: "Complete and review tax forms",
				completed: false,
			},
			{
				id: "file_return",
				description: "Submit tax return to GRA",
				completed: false,
			},
		],
		resources: [
			{
				title: "GRA Income Tax Forms",
				url: "https://gra.gov.gy/forms",
				type: "form",
			},
			{
				title: "Tax Filing Guide",
				url: "https://gra.gov.gy/guides/income-tax",
				type: "guide",
			},
		],
	},
	{
		id: "vat_registration",
		title: "VAT Registration",
		description: "Register for VAT if annual turnover exceeds threshold",
		category: "tax",
		priority: "high",
		frequency: "as_needed",
		applicableIf: {
			annualRevenue: ["500k_1m", "1m_5m", "5m_plus"],
		},
		tasks: [
			{
				id: "check_vat_threshold",
				description: "Verify if revenue exceeds VAT threshold",
				completed: false,
			},
			{
				id: "prepare_vat_application",
				description: "Prepare VAT registration application",
				completed: false,
			},
			{
				id: "submit_vat_registration",
				description: "Submit registration to GRA",
				completed: false,
			},
		],
		resources: [
			{
				title: "VAT Registration Form",
				url: "https://gra.gov.gy/vat-registration",
				type: "form",
			},
		],
	},
	{
		id: "business_registration",
		title: "Business Registration",
		description: "Register business entity with DCRA",
		category: "regulatory",
		priority: "critical",
		frequency: "as_needed",
		applicableIf: {
			businessType: ["company", "partnership"],
		},
		tasks: [
			{
				id: "reserve_company_name",
				description: "Reserve company name with DCRA",
				completed: false,
			},
			{
				id: "prepare_incorporation_docs",
				description: "Prepare incorporation documents",
				completed: false,
			},
			{
				id: "submit_registration",
				description: "Submit registration application",
				completed: false,
			},
		],
		resources: [
			{
				title: "Company Registration Guide",
				url: "https://dcra.gov.gy/registration",
				type: "guide",
			},
		],
	},
	{
		id: "annual_return",
		title: "Annual Return Filing",
		description: "File annual return with DCRA",
		category: "regulatory",
		priority: "high",
		frequency: "annually",
		applicableIf: {
			businessType: ["company", "partnership"],
		},
		tasks: [
			{
				id: "update_director_info",
				description: "Update director and shareholder information",
				completed: false,
			},
			{
				id: "prepare_annual_return",
				description: "Prepare annual return form",
				completed: false,
			},
			{
				id: "submit_annual_return",
				description: "Submit to DCRA with required fees",
				completed: false,
			},
		],
		resources: [
			{
				title: "Annual Return Form",
				url: "https://dcra.gov.gy/annual-return",
				type: "form",
			},
		],
	},
	{
		id: "nis_registration",
		title: "NIS Registration",
		description: "Register employees with National Insurance Scheme",
		category: "employment",
		priority: "critical",
		frequency: "as_needed",
		applicableIf: {
			hasEmployees: true,
		},
		tasks: [
			{
				id: "register_employer",
				description: "Register as an employer with NIS",
				completed: false,
			},
			{
				id: "register_employees",
				description: "Register all employees",
				completed: false,
			},
			{
				id: "setup_payroll_deductions",
				description: "Set up payroll deduction system",
				completed: false,
			},
		],
		resources: [
			{
				title: "NIS Registration Forms",
				url: "https://nis.gov.gy/registration",
				type: "form",
			},
		],
	},
	{
		id: "monthly_nis_contributions",
		title: "Monthly NIS Contributions",
		description: "Submit monthly NIS contribution returns",
		category: "employment",
		priority: "high",
		frequency: "monthly",
		applicableIf: {
			hasEmployees: true,
		},
		dueDate: "15th of following month",
		reminderDays: 10,
		tasks: [
			{
				id: "calculate_contributions",
				description: "Calculate employer and employee contributions",
				completed: false,
			},
			{
				id: "submit_nis_return",
				description: "Submit monthly NIS return",
				completed: false,
			},
			{
				id: "make_payment",
				description: "Make contribution payment",
				completed: false,
			},
		],
		resources: [
			{
				title: "Monthly Contribution Form",
				url: "https://nis.gov.gy/monthly-contribution",
				type: "form",
			},
		],
	},
	{
		id: "environmental_permit",
		title: "Environmental Permits",
		description: "Obtain required environmental permits from EPA",
		category: "environmental",
		priority: "high",
		frequency: "as_needed",
		applicableIf: {
			hasEnvironmentalImpact: true,
		},
		tasks: [
			{
				id: "environmental_assessment",
				description: "Conduct environmental impact assessment",
				completed: false,
			},
			{
				id: "apply_for_permits",
				description: "Apply for necessary environmental permits",
				completed: false,
			},
			{
				id: "implement_monitoring",
				description: "Implement environmental monitoring",
				completed: false,
			},
		],
		resources: [
			{
				title: "EPA Permit Application",
				url: "https://epa.gov.gy/permits",
				type: "form",
			},
		],
	},
	{
		id: "financial_statements",
		title: "Annual Financial Statements",
		description: "Prepare and file annual audited financial statements",
		category: "financial",
		priority: "high",
		frequency: "annually",
		applicableIf: {
			businessType: ["company"],
			annualRevenue: ["1m_5m", "5m_plus"],
		},
		tasks: [
			{
				id: "engage_auditor",
				description: "Engage qualified external auditor",
				completed: false,
			},
			{
				id: "prepare_statements",
				description: "Prepare draft financial statements",
				completed: false,
			},
			{
				id: "complete_audit",
				description: "Complete external audit",
				completed: false,
			},
			{
				id: "file_statements",
				description: "File with regulatory authorities",
				completed: false,
			},
		],
		resources: [
			{
				title: "Financial Reporting Standards",
				url: "https://dcra.gov.gy/financial-reporting",
				type: "guide",
			},
		],
	},
];

// Smart Compliance Checklist Component
interface SmartComplianceChecklistProps {
	businessProfile?: BusinessProfile;
	onProfileUpdate?: (profile: BusinessProfile) => void;
	onTaskComplete?: (itemId: string, taskId: string, completed: boolean) => void;
	onSaveProgress?: (progress: any) => void;
	readOnly?: boolean;
}

export function SmartComplianceChecklist({
	businessProfile,
	onProfileUpdate,
	onTaskComplete,
	onSaveProgress,
	readOnly = false,
}: SmartComplianceChecklistProps) {
	const [profile, setProfile] = useState<BusinessProfile>(
		businessProfile || {
			businessType: "sole_proprietorship",
			hasEmployees: false,
			employeeCount: 0,
			annualRevenue: "under_100k",
			industry: "",
			hasEnvironmentalImpact: false,
			operationsStartDate: "",
			regions: [],
		},
	);
	const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(
		{},
	);
	const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
	const [showCompleted, setShowCompleted] = useState(true);

	// Filter applicable compliance items based on business profile
	const applicableItems = useMemo(() => {
		return complianceItems
			.filter((item) => {
				const { applicableIf } = item;

				// Check business type
				if (
					applicableIf.businessType &&
					!applicableIf.businessType.includes(profile.businessType)
				) {
					return false;
				}

				// Check employee requirement
				if (
					applicableIf.hasEmployees !== undefined &&
					applicableIf.hasEmployees !== profile.hasEmployees
				) {
					return false;
				}

				// Check annual revenue
				if (
					applicableIf.annualRevenue &&
					!applicableIf.annualRevenue.includes(profile.annualRevenue)
				) {
					return false;
				}

				// Check environmental impact
				if (
					applicableIf.hasEnvironmentalImpact !== undefined &&
					applicableIf.hasEnvironmentalImpact !== profile.hasEnvironmentalImpact
				) {
					return false;
				}

				return true;
			})
			.map((item) => ({
				...item,
				tasks: item.tasks.map((task) => ({
					...task,
					completed: completedTasks[`${item.id}-${task.id}`] || false,
					notes: taskNotes[`${item.id}-${task.id}`] || "",
				})),
			}));
	}, [profile, completedTasks, taskNotes]);

	// Calculate completion statistics
	const stats = useMemo(() => {
		const totalItems = applicableItems.length;
		const totalTasks = applicableItems.reduce(
			(sum, item) => sum + item.tasks.length,
			0,
		);
		const completedTasksCount = applicableItems.reduce(
			(sum, item) => sum + item.tasks.filter((task) => task.completed).length,
			0,
		);
		const completedItemsCount = applicableItems.filter((item) =>
			item.tasks.every((task) => task.completed),
		).length;

		const criticalItems = applicableItems.filter(
			(item) => item.priority === "critical",
		);
		const completedCriticalItems = criticalItems.filter((item) =>
			item.tasks.every((task) => task.completed),
		);

		return {
			totalItems,
			totalTasks,
			completedTasksCount,
			completedItemsCount,
			taskCompletionPercentage:
				totalTasks > 0
					? Math.round((completedTasksCount / totalTasks) * 100)
					: 0,
			itemCompletionPercentage:
				totalItems > 0
					? Math.round((completedItemsCount / totalItems) * 100)
					: 0,
			criticalItemsCount: criticalItems.length,
			completedCriticalItemsCount: completedCriticalItems.length,
		};
	}, [applicableItems]);

	// Handle profile updates
	const handleProfileUpdate = (field: keyof BusinessProfile, value: any) => {
		const updatedProfile = { ...profile, [field]: value };
		setProfile(updatedProfile);
		onProfileUpdate?.(updatedProfile);
	};

	// Handle task completion
	const handleTaskCompletion = (
		itemId: string,
		taskId: string,
		completed: boolean,
	) => {
		const key = `${itemId}-${taskId}`;
		setCompletedTasks((prev) => ({ ...prev, [key]: completed }));
		onTaskComplete?.(itemId, taskId, completed);
	};

	// Handle task notes
	const handleTaskNotes = (itemId: string, taskId: string, notes: string) => {
		const key = `${itemId}-${taskId}`;
		setTaskNotes((prev) => ({ ...prev, [key]: notes }));
	};

	// Get priority color
	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "critical":
				return "text-red-700 bg-red-50 border-red-200";
			case "high":
				return "text-orange-700 bg-orange-50 border-orange-200";
			case "medium":
				return "text-yellow-700 bg-yellow-50 border-yellow-200";
			case "low":
				return "text-green-700 bg-green-50 border-green-200";
			default:
				return "text-gray-700 bg-gray-50 border-gray-200";
		}
	};

	// Get category icon
	const getCategoryIcon = (category: string) => {
		switch (category) {
			case "tax":
				return <FileText className="h-4 w-4" />;
			case "regulatory":
				return <Shield className="h-4 w-4" />;
			case "environmental":
				return <Target className="h-4 w-4" />;
			case "employment":
				return <Users className="h-4 w-4" />;
			case "financial":
				return <FileText className="h-4 w-4" />;
			default:
				return <FileText className="h-4 w-4" />;
		}
	};

	// Auto-save progress
	useEffect(() => {
		if (onSaveProgress) {
			const progress = {
				profile,
				completedTasks,
				taskNotes,
				lastUpdated: new Date().toISOString(),
			};
			onSaveProgress(progress);
		}
	}, [profile, completedTasks, taskNotes, onSaveProgress]);

	return (
		<div className="mx-auto max-w-6xl space-y-6 p-6">
			{/* Header */}
			<div className="text-center">
				<h1 className="font-bold text-3xl text-gray-900">
					Smart Compliance Checklist
				</h1>
				<p className="mt-2 text-gray-600">
					Personalized compliance tracking for your business
				</p>
			</div>

			{/* Business Profile Configuration */}
			{!readOnly && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							Business Profile
						</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						<div>
							<Label>Business Type</Label>
							<Select
								value={profile.businessType}
								onValueChange={(value: any) =>
									handleProfileUpdate("businessType", value)
								}
							>
								<SelectTrigger className="mt-2">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="sole_proprietorship">
										Sole Proprietorship
									</SelectItem>
									<SelectItem value="partnership">Partnership</SelectItem>
									<SelectItem value="company">Company</SelectItem>
									<SelectItem value="ngo">Non-Profit</SelectItem>
									<SelectItem value="other">Other</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label>Annual Revenue</Label>
							<Select
								value={profile.annualRevenue}
								onValueChange={(value: any) =>
									handleProfileUpdate("annualRevenue", value)
								}
							>
								<SelectTrigger className="mt-2">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="under_100k">Under $100K</SelectItem>
									<SelectItem value="100k_500k">$100K - $500K</SelectItem>
									<SelectItem value="500k_1m">$500K - $1M</SelectItem>
									<SelectItem value="1m_5m">$1M - $5M</SelectItem>
									<SelectItem value="5m_plus">Over $5M</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor="industry">Industry</Label>
							<Input
								id="industry"
								value={profile.industry}
								onChange={(e) =>
									handleProfileUpdate("industry", e.target.value)
								}
								placeholder="e.g., Manufacturing, Retail"
								className="mt-2"
							/>
						</div>

						<div className="flex items-center space-x-2">
							<Checkbox
								checked={profile.hasEmployees}
								onCheckedChange={(checked) =>
									handleProfileUpdate("hasEmployees", checked)
								}
							/>
							<Label>Has Employees</Label>
						</div>

						{profile.hasEmployees && (
							<div>
								<Label htmlFor="employeeCount">Number of Employees</Label>
								<Input
									id="employeeCount"
									type="number"
									value={profile.employeeCount}
									onChange={(e) =>
										handleProfileUpdate(
											"employeeCount",
											Number.parseInt(e.target.value) || 0,
										)
									}
									className="mt-2"
								/>
							</div>
						)}

						<div className="flex items-center space-x-2">
							<Checkbox
								checked={profile.hasEnvironmentalImpact}
								onCheckedChange={(checked) =>
									handleProfileUpdate("hasEnvironmentalImpact", checked)
								}
							/>
							<Label>Has Environmental Impact</Label>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Statistics Dashboard */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600 text-sm">Task Completion</p>
								<p className="font-bold text-2xl">
									{stats.taskCompletionPercentage}%
								</p>
							</div>
							<CheckCircle className="h-8 w-8 text-green-500" />
						</div>
						<Progress value={stats.taskCompletionPercentage} className="mt-2" />
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600 text-sm">Compliance Items</p>
								<p className="font-bold text-2xl">
									{stats.completedItemsCount}/{stats.totalItems}
								</p>
							</div>
							<Shield className="h-8 w-8 text-blue-500" />
						</div>
						<Progress value={stats.itemCompletionPercentage} className="mt-2" />
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600 text-sm">Critical Items</p>
								<p className="font-bold text-2xl">
									{stats.completedCriticalItemsCount}/{stats.criticalItemsCount}
								</p>
							</div>
							<AlertTriangle className="h-8 w-8 text-red-500" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600 text-sm">Total Tasks</p>
								<p className="font-bold text-2xl">
									{stats.completedTasksCount}/{stats.totalTasks}
								</p>
							</div>
							<FileText className="h-8 w-8 text-gray-500" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Controls */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<Checkbox
						checked={showCompleted}
						onCheckedChange={setShowCompleted}
					/>
					<Label>Show completed items</Label>
				</div>
				<div className="text-gray-600 text-sm">
					{applicableItems.length} applicable compliance items
				</div>
			</div>

			{/* Compliance Items */}
			<div className="space-y-4">
				{applicableItems
					.filter(
						(item) =>
							showCompleted || !item.tasks.every((task) => task.completed),
					)
					.map((item) => {
						const isCompleted = item.tasks.every((task) => task.completed);
						const completedTasksCount = item.tasks.filter(
							(task) => task.completed,
						).length;

						return (
							<Card
								key={item.id}
								className={`${isCompleted ? "border-green-200 bg-green-50" : ""}`}
							>
								<CardHeader>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<CardTitle className="flex items-center gap-2">
												{getCategoryIcon(item.category)}
												{item.title}
												{isCompleted && (
													<CheckCircle className="h-5 w-5 text-green-500" />
												)}
											</CardTitle>
											<p className="mt-1 text-gray-600 text-sm">
												{item.description}
											</p>
											<div className="mt-2 flex items-center gap-4">
												<span
													className={`rounded border px-2 py-1 text-xs ${getPriorityColor(item.priority)}`}
												>
													{item.priority} priority
												</span>
												<span className="text-gray-500 text-xs">
													{item.frequency}
												</span>
												{item.dueDate && (
													<span className="flex items-center gap-1 text-gray-500 text-xs">
														<Clock className="h-3 w-3" />
														Due: {item.dueDate}
													</span>
												)}
											</div>
										</div>
										<div className="text-right">
											<div className="font-medium text-sm">
												{completedTasksCount}/{item.tasks.length}
											</div>
											<div className="text-gray-500 text-xs">
												tasks complete
											</div>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										<Progress
											value={(completedTasksCount / item.tasks.length) * 100}
											className="h-2"
										/>

										{/* Tasks */}
										<div className="space-y-2">
											{item.tasks.map((task) => (
												<div
													key={task.id}
													className="flex items-start gap-3 rounded-lg border p-3"
												>
													<Checkbox
														checked={task.completed}
														onCheckedChange={(checked) =>
															handleTaskCompletion(
																item.id,
																task.id,
																checked as boolean,
															)
														}
														disabled={readOnly}
													/>
													<div className="flex-1">
														<Label
															className={`text-sm ${task.completed ? "text-gray-500 line-through" : ""}`}
														>
															{task.description}
														</Label>
														{!readOnly && (
															<Textarea
																placeholder="Add notes..."
																value={task.notes}
																onChange={(e) =>
																	handleTaskNotes(
																		item.id,
																		task.id,
																		e.target.value,
																	)
																}
																className="mt-2 text-xs"
																rows={2}
															/>
														)}
													</div>
													{task.completed && (
														<CheckCircle className="mt-1 h-4 w-4 text-green-500" />
													)}
												</div>
											))}
										</div>

										{/* Resources */}
										{item.resources.length > 0 && (
											<div className="border-t pt-3">
												<h4 className="mb-2 font-medium text-sm">Resources</h4>
												<div className="flex flex-wrap gap-2">
													{item.resources.map((resource, index) => (
														<Button
															key={index}
															variant="outline"
															size="sm"
															className="text-xs"
															onClick={() =>
																window.open(resource.url, "_blank")
															}
														>
															{resource.type === "form" && (
																<FileText className="mr-1 h-3 w-3" />
															)}
															{resource.type === "guide" && (
																<HelpCircle className="mr-1 h-3 w-3" />
															)}
															{resource.title}
														</Button>
													))}
												</div>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}
			</div>

			{applicableItems.length === 0 && (
				<Card>
					<CardContent className="py-12 text-center">
						<CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
						<h3 className="font-medium text-gray-900 text-lg">
							No applicable compliance items
						</h3>
						<p className="mt-2 text-gray-600">
							Based on your business profile, no additional compliance items are
							currently required.
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
