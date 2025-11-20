"use client";

import { motion } from "framer-motion";
import {
	ArrowRight,
	Award,
	BarChart3,
	Book,
	Brain,
	Building,
	Camera,
	CheckCircle,
	Eye,
	FileCheck,
	FileText,
	Globe,
	HeadphonesIcon,
	Layers,
	PlayCircle,
	ScanLine,
	Shield,
	Star,
	Target,
	TrendingUp,
	Upload,
	Users,
	Workflow,
	Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AgencyDocumentSelector } from "@/components/documents/agency-document-selector";
import DocumentPreviewGallery from "@/components/documents/document-preview-gallery";
import { DocumentValidation } from "@/components/documents/document-validation";
import MobileDocumentScanner from "@/components/documents/mobile-document-scanner";
import SmartDocumentManagement, {
	type SmartDocument,
} from "@/components/documents/smart-document-management";
import { SmartDocumentUploader } from "@/components/documents/smart-document-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brandColors, gcmcKajBrand } from "@/styles/brand";

export default function SmartDocumentsDemoPage() {
	const [activeDemo, setActiveDemo] = useState<string>("overview");
	const [demoDocuments, setDemoDocuments] = useState<SmartDocument[]>([]);

	// Mock data for demo
	const demoStats = {
		totalDocuments: 1247,
		processedToday: 89,
		avgComplianceScore: 94,
		timesSaved: "15 hours",
		agenciesSupported: 4,
		validationRules: 25,
		successRate: 98.7,
		userSatisfaction: 4.9,
	};

	const features = [
		{
			icon: <Brain className="h-6 w-6" />,
			title: "AI-Powered Categorization",
			description:
				"Automatically categorizes documents using intelligent analysis",
			color: brandColors.primary[600],
		},
		{
			icon: <Shield className="h-6 w-6" />,
			title: "Guyanese Compliance",
			description:
				"Built-in validation for GRA, NIS, DCRA, and Immigration requirements",
			color: gcmcKajBrand.emerald[600],
		},
		{
			icon: <Camera className="h-6 w-6" />,
			title: "Mobile Document Scanner",
			description: "Capture documents using your mobile device camera",
			color: brandColors.warning[600],
		},
		{
			icon: <Eye className="h-6 w-6" />,
			title: "Rich Preview Gallery",
			description: "Preview, annotate, and edit documents with advanced tools",
			color: brandColors.danger[600],
		},
		{
			icon: <FileCheck className="h-6 w-6" />,
			title: "Smart Validation",
			description: "Comprehensive validation with auto-fix capabilities",
			color: brandColors.primary[700],
		},
		{
			icon: <Workflow className="h-6 w-6" />,
			title: "Workflow Automation",
			description: "Automated approval workflows for different document types",
			color: gcmcKajBrand.emerald[700],
		},
	];

	const agencies = [
		{
			id: "GRA",
			name: "Guyana Revenue Authority",
			description: "Tax returns, VAT certificates, income statements",
			documents: 524,
			compliance: 96,
			color: brandColors.primary[600],
		},
		{
			id: "NIS",
			name: "National Insurance Scheme",
			description: "Contribution schedules, employee reports",
			documents: 312,
			compliance: 94,
			color: gcmcKajBrand.emerald[600],
		},
		{
			id: "DCRA",
			name: "Deeds & Commercial Registry",
			description: "Registration certificates, annual returns",
			documents: 287,
			compliance: 92,
			color: brandColors.warning[600],
		},
		{
			id: "IMMIGRATION",
			name: "Immigration Department",
			description: "Work permits, visa applications",
			documents: 124,
			compliance: 98,
			color: brandColors.danger[600],
		},
	];

	const benefits = [
		{
			icon: <TrendingUp className="h-8 w-8" />,
			title: "95% Faster Processing",
			description:
				"Dramatically reduce document processing time with AI automation",
			metric: "15 hours saved daily",
		},
		{
			icon: <Target className="h-8 w-8" />,
			title: "99.2% Accuracy",
			description:
				"Near-perfect accuracy in document categorization and validation",
			metric: "99.2% success rate",
		},
		{
			icon: <Shield className="h-8 w-8" />,
			title: "100% Compliant",
			description:
				"Built-in compliance checks for all Guyanese regulatory requirements",
			metric: "Zero violations",
		},
		{
			icon: <Users className="h-8 w-8" />,
			title: "500+ Satisfied Users",
			description:
				"Trusted by businesses across Guyana for their document needs",
			metric: "4.9/5 rating",
		},
	];

	const handleDemoSubmit = async (documents: SmartDocument[]) => {
		setDemoDocuments(documents);
		toast.success(
			`Demo: ${documents.length} documents submitted successfully!`,
		);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
			{/* Hero Section */}
			<section className="px-6 py-20 text-center">
				<div className="mx-auto max-w-6xl">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
					>
						<div className="mb-6 flex items-center justify-center gap-3">
							<div className="rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 p-3">
								<Brain className="h-8 w-8 text-white" />
							</div>
							<h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-bold text-5xl text-transparent">
								Smart Document Upload
							</h1>
						</div>

						<p className="mx-auto mb-8 max-w-3xl text-gray-600 text-xl">
							Intelligent, agency-aware document management system with
							AI-powered categorization, compliance validation, and automated
							workflows for Guyanese regulatory requirements.
						</p>

						<div className="mb-12 flex items-center justify-center gap-4">
							<Badge variant="outline" className="px-4 py-2 text-sm">
								<Zap className="mr-2 h-4 w-4 text-yellow-500" />
								AI-Powered
							</Badge>
							<Badge variant="outline" className="px-4 py-2 text-sm">
								<Globe className="mr-2 h-4 w-4 text-green-500" />
								Guyana Compliant
							</Badge>
							<Badge variant="outline" className="px-4 py-2 text-sm">
								<Star className="mr-2 h-4 w-4 text-purple-500" />
								Enterprise Ready
							</Badge>
						</div>

						<div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-4">
							<Card className="text-center">
								<CardContent className="p-6">
									<div className="mb-2 font-bold text-3xl text-blue-600">
										{demoStats.totalDocuments.toLocaleString()}
									</div>
									<div className="text-gray-600 text-sm">
										Documents Processed
									</div>
								</CardContent>
							</Card>
							<Card className="text-center">
								<CardContent className="p-6">
									<div className="mb-2 font-bold text-3xl text-green-600">
										{demoStats.avgComplianceScore}%
									</div>
									<div className="text-gray-600 text-sm">
										Avg Compliance Score
									</div>
								</CardContent>
							</Card>
							<Card className="text-center">
								<CardContent className="p-6">
									<div className="mb-2 font-bold text-3xl text-purple-600">
										{demoStats.timesSaved}
									</div>
									<div className="text-gray-600 text-sm">Time Saved Daily</div>
								</CardContent>
							</Card>
							<Card className="text-center">
								<CardContent className="p-6">
									<div className="mb-2 font-bold text-3xl text-orange-600">
										{demoStats.successRate}%
									</div>
									<div className="text-gray-600 text-sm">Success Rate</div>
								</CardContent>
							</Card>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Features Section */}
			<section className="px-6 py-20">
				<div className="mx-auto max-w-6xl">
					<div className="mb-12 text-center">
						<h2 className="mb-4 font-bold text-3xl text-gray-900">
							Intelligent Document Management Features
						</h2>
						<p className="text-gray-600 text-lg">
							Everything you need for efficient, compliant document processing
						</p>
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
						{features.map((feature, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
							>
								<Card className="h-full transition-shadow hover:shadow-lg">
									<CardContent className="p-6">
										<div
											className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg"
											style={{
												backgroundColor: `${feature.color}15`,
												color: feature.color,
											}}
										>
											{feature.icon}
										</div>
										<h3 className="mb-2 font-semibold text-gray-900 text-lg">
											{feature.title}
										</h3>
										<p className="text-gray-600">{feature.description}</p>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Interactive Demo Section */}
			<section className="bg-white px-6 py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-12 text-center">
						<h2 className="mb-4 font-bold text-3xl text-gray-900">
							Interactive Demo
						</h2>
						<p className="text-gray-600 text-lg">
							Try out the smart document management system
						</p>
					</div>

					<Tabs
						value={activeDemo}
						onValueChange={setActiveDemo}
						className="w-full"
					>
						<TabsList className="grid w-full grid-cols-7">
							<TabsTrigger value="overview">Overview</TabsTrigger>
							<TabsTrigger value="uploader">Smart Upload</TabsTrigger>
							<TabsTrigger value="categorize">Categorization</TabsTrigger>
							<TabsTrigger value="scanner">Mobile Scanner</TabsTrigger>
							<TabsTrigger value="validation">Validation</TabsTrigger>
							<TabsTrigger value="preview">Preview Gallery</TabsTrigger>
							<TabsTrigger value="workflow">Workflow</TabsTrigger>
						</TabsList>

						<div className="mt-8">
							<TabsContent value="overview" className="space-y-6">
								<SmartDocumentManagement
									onDocumentSubmit={handleDemoSubmit}
									layoutMode="fullscreen"
									className="h-[600px] rounded-lg border shadow-lg"
								/>
							</TabsContent>

							<TabsContent value="uploader" className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Upload className="h-5 w-5 text-blue-600" />
											Smart Document Uploader Demo
										</CardTitle>
									</CardHeader>
									<CardContent>
										<SmartDocumentUploader
											multiple={true}
											enableOCR={true}
											enableMobileCapture={true}
											onUpload={async (files) => {
												toast.success(`Demo: ${files.length} files uploaded!`);
											}}
											className="h-[400px]"
										/>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="categorize" className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Building className="h-5 w-5 text-green-600" />
											Agency Document Selector Demo
										</CardTitle>
									</CardHeader>
									<CardContent>
										<AgencyDocumentSelector
											showTemplates={true}
											showSuggestions={true}
											showStatistics={true}
											onTemplateSelect={(template) => {
												toast.info(`Template selected: ${template.name}`);
											}}
											className="h-[500px]"
										/>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="scanner" className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Camera className="h-5 w-5 text-purple-600" />
											Mobile Document Scanner Demo
										</CardTitle>
									</CardHeader>
									<CardContent className="p-0">
										<div className="h-[600px] overflow-hidden rounded-lg bg-black">
											<div className="flex h-full items-center justify-center text-white">
												<div className="text-center">
													<Camera className="mx-auto mb-4 h-16 w-16 text-gray-400" />
													<h3 className="mb-2 font-semibold text-xl">
														Camera Scanner
													</h3>
													<p className="mb-4 text-gray-400">
														Click to enable camera access
													</p>
													<Button
														variant="outline"
														className="border-white text-white"
													>
														<PlayCircle className="mr-2 h-4 w-4" />
														Start Scanner
													</Button>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="validation" className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Shield className="h-5 w-5 text-red-600" />
											Document Validation Demo
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex h-[500px] items-center justify-center text-center">
											<div>
												<Shield className="mx-auto mb-4 h-16 w-16 text-gray-300" />
												<h3 className="mb-2 font-medium text-gray-900 text-lg">
													Document Validation
												</h3>
												<p className="mb-4 text-gray-600">
													Upload documents to see comprehensive validation with
													Guyanese compliance checks
												</p>
												<div className="grid grid-cols-2 gap-4 text-sm">
													<div className="text-center">
														<div className="font-bold text-2xl text-green-600">
															25
														</div>
														<div className="text-gray-600">
															Validation Rules
														</div>
													</div>
													<div className="text-center">
														<div className="font-bold text-2xl text-blue-600">
															4
														</div>
														<div className="text-gray-600">
															Agencies Covered
														</div>
													</div>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="preview" className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Eye className="h-5 w-5 text-indigo-600" />
											Document Preview Gallery Demo
										</CardTitle>
									</CardHeader>
									<CardContent className="p-0">
										<div className="flex h-[600px] items-center justify-center rounded-lg bg-gray-100">
											<div className="text-center">
												<Eye className="mx-auto mb-4 h-16 w-16 text-gray-300" />
												<h3 className="mb-2 font-medium text-gray-900 text-lg">
													Document Preview
												</h3>
												<p className="text-gray-600">
													Rich document viewer with annotation and editing
													capabilities
												</p>
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="workflow" className="space-y-6">
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Workflow className="h-5 w-5 text-orange-600" />
											Workflow Management Demo
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex h-[500px] items-center justify-center text-center">
											<div>
												<Workflow className="mx-auto mb-4 h-16 w-16 text-gray-300" />
												<h3 className="mb-2 font-medium text-gray-900 text-lg">
													Automated Workflows
												</h3>
												<p className="mb-4 text-gray-600">
													Smart workflows automatically adapt to document types
													and agency requirements
												</p>
												<div className="grid grid-cols-3 gap-4 text-sm">
													<div className="text-center">
														<div className="font-bold text-blue-600 text-xl">
															Auto
														</div>
														<div className="text-gray-600">Routing</div>
													</div>
													<div className="text-center">
														<div className="font-bold text-green-600 text-xl">
															Smart
														</div>
														<div className="text-gray-600">Approvals</div>
													</div>
													<div className="text-center">
														<div className="font-bold text-purple-600 text-xl">
															Real-time
														</div>
														<div className="text-gray-600">Updates</div>
													</div>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>
						</div>
					</Tabs>
				</div>
			</section>

			{/* Agencies Section */}
			<section className="px-6 py-20">
				<div className="mx-auto max-w-6xl">
					<div className="mb-12 text-center">
						<h2 className="mb-4 font-bold text-3xl text-gray-900">
							Supported Guyanese Agencies
						</h2>
						<p className="text-gray-600 text-lg">
							Built-in support for all major regulatory bodies
						</p>
					</div>

					<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
						{agencies.map((agency, index) => (
							<motion.div
								key={agency.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
							>
								<Card className="h-full">
									<CardContent className="p-6 text-center">
										<div
											className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
											style={{ backgroundColor: `${agency.color}15` }}
										>
											<Building
												className="h-6 w-6"
												style={{ color: agency.color }}
											/>
										</div>
										<h3 className="mb-2 font-semibold text-gray-900">
											{agency.name}
										</h3>
										<p className="mb-4 text-gray-600 text-sm">
											{agency.description}
										</p>

										<div className="space-y-2">
											<div className="flex justify-between text-sm">
												<span className="text-gray-600">Documents:</span>
												<span className="font-medium">{agency.documents}</span>
											</div>
											<div className="flex justify-between text-sm">
												<span className="text-gray-600">Compliance:</span>
												<span className="font-medium text-green-600">
													{agency.compliance}%
												</span>
											</div>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Benefits Section */}
			<section className="bg-gray-900 px-6 py-20 text-white">
				<div className="mx-auto max-w-6xl">
					<div className="mb-12 text-center">
						<h2 className="mb-4 font-bold text-3xl">Why Choose Our System?</h2>
						<p className="text-gray-300 text-lg">
							Measurable benefits that transform your document workflow
						</p>
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
						{benefits.map((benefit, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.2 }}
								className="text-center"
							>
								<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
									{benefit.icon}
								</div>
								<h3 className="mb-2 font-semibold text-xl">{benefit.title}</h3>
								<p className="mb-4 text-gray-300">{benefit.description}</p>
								<div className="font-bold text-2xl text-yellow-400">
									{benefit.metric}
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-20 text-white">
				<div className="mx-auto max-w-4xl text-center">
					<h2 className="mb-6 font-bold text-3xl md:text-4xl">
						Ready to Transform Your Document Workflow?
					</h2>
					<p className="mb-8 text-blue-100 text-xl">
						Join hundreds of Guyanese businesses already using our intelligent
						document management system
					</p>

					<div className="flex flex-col justify-center gap-4 sm:flex-row">
						<Button size="lg" variant="secondary">
							<PlayCircle className="mr-2 h-5 w-5" />
							Try Live Demo
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="border-white text-white hover:bg-white hover:text-blue-600"
						>
							<Book className="mr-2 h-5 w-5" />
							View Documentation
						</Button>
						<Button
							size="lg"
							variant="outline"
							className="border-white text-white hover:bg-white hover:text-blue-600"
						>
							<HeadphonesIcon className="mr-2 h-5 w-5" />
							Contact Support
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
