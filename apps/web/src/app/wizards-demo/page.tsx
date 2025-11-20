"use client";

import {
	CheckCircle,
	FileCheck,
	FileText,
	Play,
	Settings,
	Shield,
	Upload,
	Users,
	Zap,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
	DynamicTaxForm,
	SmartComplianceChecklist,
	TaxFormTemplateSelector,
} from "@/components/templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	ClientOnboardingWizard,
	ComplianceAssessmentWizard,
	DocumentUploadWizard,
	FilingPreparationWizard,
	ServiceRequestWizard,
} from "@/components/wizards";

interface WizardDemo {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	category: "wizards" | "templates";
	features: string[];
	component: React.ComponentType<any>;
	estimatedTime: string;
	complexity: "Simple" | "Moderate" | "Advanced";
}

const wizardDemos: WizardDemo[] = [
	{
		id: "client-onboarding",
		title: "Client Onboarding Wizard",
		description:
			"Multi-step guided client registration and onboarding process with conditional logic and document collection.",
		icon: <Users className="h-6 w-6" />,
		category: "wizards",
		features: [
			"Conditional step visibility",
			"Real-time validation",
			"Auto-save functionality",
			"Progress tracking",
			"Mobile responsive",
		],
		component: ClientOnboardingWizard,
		estimatedTime: "10-15 minutes",
		complexity: "Moderate",
	},
	{
		id: "document-upload",
		title: "Document Upload Wizard",
		description:
			"Secure document management with categorization, metadata, and compliance tracking.",
		icon: <Upload className="h-6 w-6" />,
		category: "wizards",
		features: [
			"File categorization",
			"Metadata assignment",
			"Access control",
			"Batch upload support",
			"Document validation",
		],
		component: DocumentUploadWizard,
		estimatedTime: "5-10 minutes",
		complexity: "Simple",
	},
	{
		id: "service-request",
		title: "Service Request Wizard",
		description:
			"Comprehensive service booking system with pricing calculation and scheduling integration.",
		icon: <Settings className="h-6 w-6" />,
		category: "wizards",
		features: [
			"Dynamic pricing",
			"Service bundling",
			"Payment integration",
			"Meeting scheduling",
			"Requirements checklist",
		],
		component: ServiceRequestWizard,
		estimatedTime: "15-20 minutes",
		complexity: "Advanced",
	},
	{
		id: "compliance-assessment",
		title: "Compliance Assessment Wizard",
		description:
			"Interactive compliance evaluation with scoring, recommendations, and action plans.",
		icon: <Shield className="h-6 w-6" />,
		category: "wizards",
		features: [
			"Smart questionnaire",
			"Risk assessment",
			"Compliance scoring",
			"Action recommendations",
			"Progress tracking",
		],
		component: ComplianceAssessmentWizard,
		estimatedTime: "20-30 minutes",
		complexity: "Advanced",
	},
	{
		id: "filing-preparation",
		title: "Filing Preparation Wizard",
		description:
			"Step-by-step tax and regulatory filing process with document checklist and submission options.",
		icon: <FileText className="h-6 w-6" />,
		category: "wizards",
		features: [
			"Multi-filing support",
			"Document tracking",
			"Deadline management",
			"Submission options",
			"Fee calculation",
		],
		component: FilingPreparationWizard,
		estimatedTime: "15-25 minutes",
		complexity: "Moderate",
	},
];

const templateDemos: WizardDemo[] = [
	{
		id: "dynamic-tax-form",
		title: "Dynamic Tax Form Template",
		description:
			"Intelligent tax forms that adapt based on client type with auto-calculations and validation.",
		icon: <FileCheck className="h-6 w-6" />,
		category: "templates",
		features: [
			"Conditional fields",
			"Auto-calculations",
			"Real-time validation",
			"Multiple tax types",
			"Save & resume",
		],
		component: DynamicTaxForm,
		estimatedTime: "30-45 minutes",
		complexity: "Advanced",
	},
	{
		id: "smart-compliance-checklist",
		title: "Smart Compliance Checklist",
		description:
			"Adaptive compliance tracking that personalizes based on business profile and requirements.",
		icon: <Zap className="h-6 w-6" />,
		category: "templates",
		features: [
			"Business profiling",
			"Adaptive checklists",
			"Progress tracking",
			"Resource links",
			"Deadline alerts",
		],
		component: SmartComplianceChecklist,
		estimatedTime: "20-30 minutes",
		complexity: "Moderate",
	},
];

export default function WizardsDemo() {
	const [activeDemo, setActiveDemo] = useState<string | null>(null);
	const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

	const handleWizardComplete = (data: any) => {
		console.log("Wizard completed with data:", data);
		toast.success("Wizard completed successfully!");
		setActiveDemo(null);
	};

	const handleWizardExit = () => {
		setActiveDemo(null);
		toast.info("Wizard closed");
	};

	const renderDemo = (demo: WizardDemo) => {
		if (!activeDemo || activeDemo !== demo.id) return null;

		const DemoComponent = demo.component;

		// Special handling for different component types
		switch (demo.id) {
			case "dynamic-tax-form":
				return (
					<div className="fixed inset-0 z-50 overflow-auto bg-white">
						<div className="p-4">
							<div className="mb-6 flex items-center justify-between">
								<h2 className="font-bold text-2xl">Dynamic Tax Form Demo</h2>
								<Button onClick={handleWizardExit} variant="outline">
									Close Demo
								</Button>
							</div>
							{!selectedTemplate ? (
								<TaxFormTemplateSelector
									onTemplateSelect={setSelectedTemplate}
								/>
							) : (
								<DemoComponent
									template={selectedTemplate}
									onSubmit={(data: any) => {
										console.log("Form submitted:", data);
										toast.success("Tax form submitted successfully!");
										setSelectedTemplate(null);
										setActiveDemo(null);
									}}
									onSave={(data: any) => {
										console.log("Form saved:", data);
										toast.success("Progress saved");
									}}
								/>
							)}
						</div>
					</div>
				);

			case "smart-compliance-checklist":
				return (
					<div className="fixed inset-0 z-50 overflow-auto bg-white">
						<div className="p-4">
							<div className="mb-6 flex items-center justify-between">
								<h2 className="font-bold text-2xl">
									Smart Compliance Checklist Demo
								</h2>
								<Button onClick={handleWizardExit} variant="outline">
									Close Demo
								</Button>
							</div>
							<DemoComponent
								onTaskComplete={(
									itemId: string,
									taskId: string,
									completed: boolean,
								) => {
									console.log("Task updated:", { itemId, taskId, completed });
								}}
								onSaveProgress={(progress: any) => {
									console.log("Progress saved:", progress);
								}}
							/>
						</div>
					</div>
				);

			default:
				return (
					<DemoComponent
						onComplete={handleWizardComplete}
						onExit={handleWizardExit}
					/>
				);
		}
	};

	const getComplexityColor = (complexity: string) => {
		switch (complexity) {
			case "Simple":
				return "bg-green-100 text-green-800";
			case "Moderate":
				return "bg-yellow-100 text-yellow-800";
			case "Advanced":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
			{/* Render active demo */}
			{activeDemo &&
				renderDemo(
					[...wizardDemos, ...templateDemos].find((d) => d.id === activeDemo)!,
				)}

			{/* Main content */}
			<div className="container mx-auto px-6 py-12">
				{/* Header */}
				<div className="mb-12 text-center">
					<h1 className="mb-4 font-bold text-4xl text-gray-900">
						GCMC-KAJ Wizard & Template Showcase
					</h1>
					<p className="mx-auto max-w-3xl text-gray-600 text-xl">
						Explore our comprehensive collection of interactive wizards and
						smart templates designed to streamline business tax services and
						compliance workflows.
					</p>
				</div>

				{/* Features Overview */}
				<div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
					<Card className="text-center">
						<CardContent className="pt-6">
							<Zap className="mx-auto mb-4 h-12 w-12 text-blue-600" />
							<h3 className="mb-2 font-semibold text-lg">Smart & Adaptive</h3>
							<p className="text-gray-600">
								Forms and workflows that adapt based on user inputs and business
								requirements
							</p>
						</CardContent>
					</Card>

					<Card className="text-center">
						<CardContent className="pt-6">
							<Shield className="mx-auto mb-4 h-12 w-12 text-green-600" />
							<h3 className="mb-2 font-semibold text-lg">Compliance Focused</h3>
							<p className="text-gray-600">
								Built-in validation and compliance checks for Guyanese business
								regulations
							</p>
						</CardContent>
					</Card>

					<Card className="text-center">
						<CardContent className="pt-6">
							<CheckCircle className="mx-auto mb-4 h-12 w-12 text-purple-600" />
							<h3 className="mb-2 font-semibold text-lg">User-Friendly</h3>
							<p className="text-gray-600">
								Intuitive interfaces with progress tracking and mobile
								optimization
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Demos */}
				<Tabs defaultValue="wizards" className="w-full">
					<TabsList className="mb-8 grid w-full grid-cols-2">
						<TabsTrigger value="wizards">Interactive Wizards</TabsTrigger>
						<TabsTrigger value="templates">Smart Templates</TabsTrigger>
					</TabsList>

					<TabsContent value="wizards" className="space-y-6">
						<div className="mb-8 text-center">
							<h2 className="mb-2 font-bold text-2xl text-gray-900">
								Interactive Wizards
							</h2>
							<p className="text-gray-600">
								Multi-step guided processes for complex business workflows
							</p>
						</div>

						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{wizardDemos.map((demo) => (
								<Card
									key={demo.id}
									className="transition-shadow hover:shadow-lg"
								>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												{demo.icon}
												<CardTitle className="text-lg">{demo.title}</CardTitle>
											</div>
											<Badge className={getComplexityColor(demo.complexity)}>
												{demo.complexity}
											</Badge>
										</div>
									</CardHeader>
									<CardContent>
										<p className="mb-4 text-gray-600">{demo.description}</p>

										<div className="space-y-3">
											<div>
												<h4 className="mb-1 font-medium text-sm">Features:</h4>
												<ul className="space-y-1 text-gray-600 text-sm">
													{demo.features.map((feature, index) => (
														<li key={index} className="flex items-center gap-2">
															<CheckCircle className="h-3 w-3 text-green-500" />
															{feature}
														</li>
													))}
												</ul>
											</div>

											<div className="flex justify-between text-gray-500 text-sm">
												<span>Est. Time: {demo.estimatedTime}</span>
											</div>

											<Button
												onClick={() => setActiveDemo(demo.id)}
												className="mt-4 w-full"
											>
												<Play className="mr-2 h-4 w-4" />
												Try Demo
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>

					<TabsContent value="templates" className="space-y-6">
						<div className="mb-8 text-center">
							<h2 className="mb-2 font-bold text-2xl text-gray-900">
								Smart Templates
							</h2>
							<p className="text-gray-600">
								Adaptive forms and interfaces that customize based on user needs
							</p>
						</div>

						<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
							{templateDemos.map((demo) => (
								<Card
									key={demo.id}
									className="transition-shadow hover:shadow-lg"
								>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												{demo.icon}
												<CardTitle className="text-lg">{demo.title}</CardTitle>
											</div>
											<Badge className={getComplexityColor(demo.complexity)}>
												{demo.complexity}
											</Badge>
										</div>
									</CardHeader>
									<CardContent>
										<p className="mb-4 text-gray-600">{demo.description}</p>

										<div className="space-y-3">
											<div>
												<h4 className="mb-1 font-medium text-sm">Features:</h4>
												<ul className="space-y-1 text-gray-600 text-sm">
													{demo.features.map((feature, index) => (
														<li key={index} className="flex items-center gap-2">
															<CheckCircle className="h-3 w-3 text-green-500" />
															{feature}
														</li>
													))}
												</ul>
											</div>

											<div className="flex justify-between text-gray-500 text-sm">
												<span>Est. Time: {demo.estimatedTime}</span>
											</div>

											<Button
												onClick={() => setActiveDemo(demo.id)}
												className="mt-4 w-full"
											>
												<Play className="mr-2 h-4 w-4" />
												Try Demo
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</TabsContent>
				</Tabs>

				{/* Technical Features */}
				<div className="mt-16">
					<div className="mb-8 text-center">
						<h2 className="mb-2 font-bold text-2xl text-gray-900">
							Technical Features
						</h2>
						<p className="text-gray-600">
							Built with modern technologies for optimal performance and user
							experience
						</p>
					</div>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardContent className="pt-6 text-center">
								<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
									<Zap className="h-6 w-6 text-blue-600" />
								</div>
								<h3 className="mb-2 font-semibold">State Management</h3>
								<p className="text-gray-600 text-sm">
									React Context for wizard state with auto-save
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="pt-6 text-center">
								<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
									<Shield className="h-6 w-6 text-green-600" />
								</div>
								<h3 className="mb-2 font-semibold">Validation</h3>
								<p className="text-gray-600 text-sm">
									Zod schemas for type-safe form validation
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="pt-6 text-center">
								<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
									<FileText className="h-6 w-6 text-purple-600" />
								</div>
								<h3 className="mb-2 font-semibold">Storage</h3>
								<p className="text-gray-600 text-sm">
									Local & server storage with sync capabilities
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="pt-6 text-center">
								<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
									<Settings className="h-6 w-6 text-orange-600" />
								</div>
								<h3 className="mb-2 font-semibold">Customizable</h3>
								<p className="text-gray-600 text-sm">
									Configurable steps, validation, and styling
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
