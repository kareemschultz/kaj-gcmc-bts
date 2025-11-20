"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	AlertTriangle,
	ArrowRight,
	BookOpen,
	Building,
	Calendar,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Clock,
	Download,
	ExternalLink,
	File,
	FileImage,
	FileText,
	Filter,
	Info,
	Search,
	Shield,
	Star,
	Tag,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { brandColors, businessColors, gcmcKajBrand } from "@/styles/brand";

// Enhanced types for intelligent categorization
interface DocumentTemplate {
	id: string;
	name: string;
	description: string;
	downloadUrl?: string;
	requiredFields: string[];
	exampleFields: Record<string, string>;
	validationRules: ValidationRule[];
	deadline?: {
		type: "annual" | "quarterly" | "monthly" | "periodic";
		description: string;
		daysNotice: number;
	};
}

interface ValidationRule {
	field: string;
	type: "required" | "format" | "range" | "custom";
	rule: string;
	message: string;
	severity: "error" | "warning" | "info";
}

interface SmartSuggestion {
	type: "category" | "document_type" | "template" | "deadline" | "related";
	title: string;
	description: string;
	confidence: number;
	action?: () => void;
	icon?: React.ReactNode;
}

// Enhanced Guyanese agency categories with detailed document types
const ENHANCED_AGENCY_CATEGORIES = [
	{
		id: "GRA",
		name: "Guyana Revenue Authority",
		shortName: "GRA",
		color: brandColors.primary[600],
		bgColor: brandColors.primary[50],
		icon: <Building className="h-6 w-6" />,
		description: "Tax administration and revenue collection authority",
		website: "https://gra.gov.gy",
		contactInfo: {
			phone: "+592-227-8222",
			email: "info@gra.gov.gy",
			address: "Commissioner-General, Guyana Revenue Authority",
		},
		documentTypes: [
			{
				id: "income-tax-return",
				name: "Income Tax Return",
				description: "Annual individual income tax filing",
				required: true,
				urgencyLevel: "critical" as const,
				deadline: {
					type: "annual" as const,
					description: "Due by April 30th annually",
					daysNotice: 30,
				},
				templates: [
					{
						id: "it-1-form",
						name: "Form IT-1 (Individual)",
						description: "Standard individual income tax return form",
						downloadUrl: "/templates/gra/form-it-1.pdf",
						requiredFields: [
							"TIN",
							"Full Name",
							"Address",
							"Income Details",
							"Tax Computation",
						],
						exampleFields: {
							TIN: "123456789",
							"Full Name": "John Doe",
							Address: "123 Main St, Georgetown",
							"Total Income": "GYD 2,400,000",
							"Tax Due": "GYD 240,000",
						},
						validationRules: [
							{
								field: "TIN",
								type: "required",
								rule: "must_be_present",
								message: "Taxpayer Identification Number is required",
								severity: "error",
							},
							{
								field: "TIN",
								type: "format",
								rule: "numeric_9_digits",
								message: "TIN must be 9 digits",
								severity: "error",
							},
						],
					},
				],
				estimatedProcessingTime: "5-10 business days",
				fees: "No filing fee",
				recentUpdates: [
					{
						date: "2024-01-15",
						update: "New digital filing system launched",
					},
				],
			},
			{
				id: "vat-return",
				name: "VAT Return",
				description: "Value Added Tax quarterly return",
				required: true,
				urgencyLevel: "high" as const,
				deadline: {
					type: "quarterly" as const,
					description: "Due 21 days after quarter end",
					daysNotice: 14,
				},
				templates: [
					{
						id: "vat-form-1",
						name: "VAT Return Form",
						description: "Standard VAT return filing form",
						downloadUrl: "/templates/gra/vat-return.pdf",
						requiredFields: [
							"VAT Number",
							"Business Name",
							"Period",
							"Sales",
							"Purchases",
							"VAT Due",
						],
						exampleFields: {
							"VAT Number": "VAT123456789",
							"Business Name": "ACME Corp Ltd",
							Period: "Q1 2024",
							"Total Sales": "GYD 5,000,000",
							"VAT Collected": "GYD 750,000",
						},
						validationRules: [
							{
								field: "VAT Number",
								type: "required",
								rule: "must_be_present",
								message: "VAT registration number is required",
								severity: "error",
							},
						],
					},
				],
			},
			{
				id: "corporation-tax",
				name: "Corporation Tax Return",
				description: "Annual corporate income tax filing",
				required: true,
				urgencyLevel: "high" as const,
				templates: [
					{
						id: "corp-tax-form",
						name: "Corporation Tax Form",
						description: "Annual corporate tax return",
						downloadUrl: "/templates/gra/corp-tax-return.pdf",
						requiredFields: [
							"Company TIN",
							"Company Name",
							"Financial Statements",
							"Tax Computation",
						],
						exampleFields: {
							"Company TIN": "CORP123456789",
							"Company Name": "ACME Corporation Ltd",
							"Gross Income": "GYD 15,000,000",
							"Taxable Income": "GYD 12,000,000",
						},
						validationRules: [],
					},
				],
			},
			{
				id: "withholding-tax",
				name: "Withholding Tax Certificate",
				description: "Tax withholding documentation for payments",
				required: false,
				urgencyLevel: "medium" as const,
			},
			{
				id: "excise-tax",
				name: "Excise Tax Return",
				description: "Excise tax on specific goods and services",
				required: false,
				urgencyLevel: "medium" as const,
			},
		],
		recentDocuments: 15,
		complianceScore: 85,
		pendingDeadlines: 2,
	},
	{
		id: "NIS",
		name: "National Insurance Scheme",
		shortName: "NIS",
		color: gcmcKajBrand.emerald[600],
		bgColor: gcmcKajBrand.emerald[50],
		icon: <Shield className="h-6 w-6" />,
		description: "Social security and employee benefits administration",
		website: "https://nis.gov.gy",
		contactInfo: {
			phone: "+592-227-3461",
			email: "info@nis.gov.gy",
			address: "National Insurance Scheme, Brickdam, Georgetown",
		},
		documentTypes: [
			{
				id: "nis-contribution",
				name: "NIS Contribution Schedule",
				description: "Monthly employee and employer contribution report",
				required: true,
				urgencyLevel: "high" as const,
				deadline: {
					type: "monthly" as const,
					description: "Due by 15th of following month",
					daysNotice: 7,
				},
				templates: [
					{
						id: "nis-contribution-form",
						name: "Monthly Contribution Form",
						description: "Employee contribution schedule and payment",
						downloadUrl: "/templates/nis/contribution-schedule.pdf",
						requiredFields: [
							"Employer Number",
							"Period",
							"Employee List",
							"Wages",
							"Contributions",
						],
						exampleFields: {
							"Employer Number": "EMP123456",
							Period: "January 2024",
							"Total Employees": "25",
							"Total Wages": "GYD 1,500,000",
							"Total Contributions": "GYD 195,000",
						},
						validationRules: [],
					},
				],
			},
			{
				id: "employee-registration",
				name: "Employee Registration",
				description: "New employee NIS registration",
				required: true,
				urgencyLevel: "medium" as const,
				templates: [
					{
						id: "employee-reg-form",
						name: "Employee Registration Form",
						description: "Register new employee with NIS",
						downloadUrl: "/templates/nis/employee-registration.pdf",
						requiredFields: [
							"Employee Name",
							"Date of Birth",
							"Address",
							"Position",
							"Salary",
						],
						exampleFields: {
							"Employee Name": "Jane Smith",
							"Date of Birth": "1990-05-15",
							"NIS Number": "123456789",
							Position: "Accountant",
							"Monthly Salary": "GYD 180,000",
						},
						validationRules: [],
					},
				],
			},
			{
				id: "employer-registration",
				name: "Employer Registration",
				description: "Register business as NIS employer",
				required: true,
				urgencyLevel: "high" as const,
			},
			{
				id: "benefit-claim",
				name: "Benefit Claim",
				description: "Employee benefit claim forms",
				required: false,
				urgencyLevel: "medium" as const,
			},
		],
		recentDocuments: 8,
		complianceScore: 92,
		pendingDeadlines: 1,
	},
	{
		id: "DCRA",
		name: "Deeds & Commercial Registry Authority",
		shortName: "DCRA",
		color: brandColors.warning[600],
		bgColor: brandColors.warning[50],
		icon: <FileText className="h-6 w-6" />,
		description: "Company registration and commercial records",
		website: "https://dcra.gov.gy",
		contactInfo: {
			phone: "+592-226-3428",
			email: "info@dcra.gov.gy",
			address: "DCRA Building, 1 Church Street, Georgetown",
		},
		documentTypes: [
			{
				id: "incorporation-certificate",
				name: "Certificate of Incorporation",
				description: "Company incorporation documentation",
				required: true,
				urgencyLevel: "critical" as const,
				templates: [
					{
						id: "incorporation-application",
						name: "Incorporation Application",
						description: "Application for company incorporation",
						downloadUrl: "/templates/dcra/incorporation-application.pdf",
						requiredFields: [
							"Company Name",
							"Directors",
							"Share Capital",
							"Registered Address",
							"Business Activities",
						],
						exampleFields: {
							"Company Name": "ACME Solutions Ltd",
							"Authorized Share Capital": "GYD 1,000,000",
							"Registered Address": "123 Business St, Georgetown",
							"Business Activities": "Professional Services",
							"Number of Directors": "3",
						},
						validationRules: [],
					},
				],
			},
			{
				id: "annual-return",
				name: "Annual Return",
				description: "Annual company filing requirement",
				required: true,
				urgencyLevel: "high" as const,
				deadline: {
					type: "annual" as const,
					description: "Due within 42 days of AGM",
					daysNotice: 21,
				},
			},
			{
				id: "director-resolution",
				name: "Director Resolution",
				description: "Board resolutions and director changes",
				required: false,
				urgencyLevel: "medium" as const,
			},
			{
				id: "change-registered-office",
				name: "Change of Registered Office",
				description: "Notification of registered office address change",
				required: false,
				urgencyLevel: "low" as const,
			},
			{
				id: "share-transfer",
				name: "Share Transfer",
				description: "Transfer of company shares",
				required: false,
				urgencyLevel: "medium" as const,
			},
		],
		recentDocuments: 12,
		complianceScore: 78,
		pendingDeadlines: 3,
	},
	{
		id: "IMMIGRATION",
		name: "Immigration Department",
		shortName: "Immigration",
		color: brandColors.danger[600],
		bgColor: brandColors.danger[50],
		icon: <FileImage className="h-6 w-6" />,
		description: "Immigration services and work authorization",
		website: "https://dpi.gov.gy/immigration",
		contactInfo: {
			phone: "+592-226-1166",
			email: "immigration@dpi.gov.gy",
			address: "Immigration Department, Camp & Bent Streets, Georgetown",
		},
		documentTypes: [
			{
				id: "work-permit",
				name: "Work Permit Application",
				description: "Application for foreign worker authorization",
				required: true,
				urgencyLevel: "critical" as const,
				templates: [
					{
						id: "work-permit-application",
						name: "Work Permit Application Form",
						description: "Application for work permit authorization",
						downloadUrl: "/templates/immigration/work-permit-application.pdf",
						requiredFields: [
							"Applicant Name",
							"Passport Details",
							"Employer Details",
							"Position",
							"Contract Period",
						],
						exampleFields: {
							"Applicant Name": "John International",
							"Passport Number": "A12345678",
							Employer: "ACME Corporation Ltd",
							Position: "Technical Manager",
							"Contract Period": "2 years",
						},
						validationRules: [],
					},
				],
				estimatedProcessingTime: "4-6 weeks",
				fees: "USD $150",
			},
			{
				id: "visa-application",
				name: "Visa Application",
				description: "Tourist and business visa applications",
				required: true,
				urgencyLevel: "high" as const,
				estimatedProcessingTime: "2-3 weeks",
				fees: "USD $25-100",
			},
			{
				id: "residency-application",
				name: "Permanent Residency Application",
				description: "Application for permanent resident status",
				required: true,
				urgencyLevel: "critical" as const,
				estimatedProcessingTime: "6-12 months",
				fees: "USD $500",
			},
			{
				id: "passport-renewal",
				name: "Passport Renewal",
				description: "Guyanese passport renewal application",
				required: false,
				urgencyLevel: "medium" as const,
			},
		],
		recentDocuments: 6,
		complianceScore: 88,
		pendingDeadlines: 2,
	},
] as const;

// Props interface
interface AgencyDocumentSelectorProps {
	selectedAgency?: string;
	selectedDocumentType?: string;
	onAgencyChange?: (agency: string) => void;
	onDocumentTypeChange?: (documentType: string) => void;
	onTemplateSelect?: (template: DocumentTemplate) => void;
	showTemplates?: boolean;
	showSuggestions?: boolean;
	showStatistics?: boolean;
	className?: string;
}

export function AgencyDocumentSelector({
	selectedAgency,
	selectedDocumentType,
	onAgencyChange,
	onDocumentTypeChange,
	onTemplateSelect,
	showTemplates = true,
	showSuggestions = true,
	showStatistics = true,
	className,
}: AgencyDocumentSelectorProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [expandedAgencies, setExpandedAgencies] = useState<Set<string>>(
		new Set(),
	);
	const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>(
		[],
	);

	// Filter agencies based on search term
	const filteredAgencies = useMemo(() => {
		if (!searchTerm.trim()) return ENHANCED_AGENCY_CATEGORIES;

		return ENHANCED_AGENCY_CATEGORIES.filter(
			(agency) =>
				agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				agency.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				agency.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
				agency.documentTypes.some(
					(doc) =>
						doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
						doc.description.toLowerCase().includes(searchTerm.toLowerCase()),
				),
		);
	}, [searchTerm]);

	// Get selected agency data
	const selectedAgencyData = ENHANCED_AGENCY_CATEGORIES.find(
		(agency) => agency.id === selectedAgency,
	);

	// Get document types for selected agency
	const availableDocumentTypes = selectedAgencyData?.documentTypes || [];

	// Get selected document type data
	const selectedDocumentTypeData = availableDocumentTypes.find(
		(doc) => doc.id === selectedDocumentType,
	);

	// Generate smart suggestions based on current selection
	useEffect(() => {
		const suggestions: SmartSuggestion[] = [];

		// Suggest based on urgency
		if (selectedAgencyData) {
			const urgentDocs = selectedAgencyData.documentTypes.filter(
				(doc) => doc.urgencyLevel === "critical" || doc.urgencyLevel === "high",
			);

			if (urgentDocs.length > 0 && !selectedDocumentType) {
				suggestions.push({
					type: "document_type",
					title: "Urgent Documents Available",
					description: `${urgentDocs.length} high-priority documents need attention`,
					confidence: 0.9,
					icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
				});
			}
		}

		// Suggest templates if document type is selected
		if (
			selectedDocumentTypeData?.templates &&
			selectedDocumentTypeData.templates.length > 0
		) {
			suggestions.push({
				type: "template",
				title: "Templates Available",
				description: `${selectedDocumentTypeData.templates.length} form templates ready for download`,
				confidence: 0.85,
				icon: <Download className="h-4 w-4 text-blue-500" />,
			});
		}

		// Suggest deadline awareness
		if (selectedDocumentTypeData?.deadline) {
			suggestions.push({
				type: "deadline",
				title: "Deadline Information",
				description: selectedDocumentTypeData.deadline.description,
				confidence: 0.8,
				icon: <Clock className="h-4 w-4 text-red-500" />,
			});
		}

		setSmartSuggestions(suggestions);
	}, [
		selectedAgency,
		selectedDocumentType,
		selectedAgencyData,
		selectedDocumentTypeData,
	]);

	// Toggle agency expansion
	const toggleAgencyExpansion = (agencyId: string) => {
		setExpandedAgencies((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(agencyId)) {
				newSet.delete(agencyId);
			} else {
				newSet.add(agencyId);
			}
			return newSet;
		});
	};

	return (
		<div className={cn("space-y-6", className)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="flex items-center gap-2 font-semibold text-2xl text-gray-900">
						<Zap className="h-6 w-6 text-blue-600" />
						Agency Document Selector
					</h2>
					<p className="text-muted-foreground">
						Intelligent categorization for Guyanese regulatory compliance
					</p>
				</div>

				{showStatistics && (
					<div className="flex items-center gap-4">
						<div className="text-center">
							<p className="font-bold text-2xl text-blue-600">
								{ENHANCED_AGENCY_CATEGORIES.length}
							</p>
							<p className="text-muted-foreground text-xs">Agencies</p>
						</div>
						<Separator orientation="vertical" className="h-8" />
						<div className="text-center">
							<p className="font-bold text-2xl text-green-600">
								{ENHANCED_AGENCY_CATEGORIES.reduce(
									(sum, agency) => sum + agency.documentTypes.length,
									0,
								)}
							</p>
							<p className="text-muted-foreground text-xs">Document Types</p>
						</div>
					</div>
				)}
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
				<Input
					placeholder="Search agencies, documents, or requirements..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="pl-9"
				/>
			</div>

			{/* Smart Suggestions */}
			{showSuggestions && smartSuggestions.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="space-y-2"
				>
					<h3 className="flex items-center gap-2 font-medium text-gray-900 text-sm">
						<Star className="h-4 w-4 text-yellow-500" />
						Smart Suggestions
					</h3>
					<div className="grid gap-2">
						{smartSuggestions.map((suggestion, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1 }}
								className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3"
							>
								{suggestion.icon}
								<div className="flex-1">
									<p className="font-medium text-sm">{suggestion.title}</p>
									<p className="text-muted-foreground text-xs">
										{suggestion.description}
									</p>
								</div>
								<Badge variant="secondary" className="text-xs">
									{Math.round(suggestion.confidence * 100)}% match
								</Badge>
							</motion.div>
						))}
					</div>
				</motion.div>
			)}

			{/* Agency Selection */}
			<Tabs
				value={selectedAgency}
				onValueChange={onAgencyChange}
				className="w-full"
			>
				<TabsList className="grid h-auto w-full grid-cols-4 p-1">
					{ENHANCED_AGENCY_CATEGORIES.map((agency) => (
						<TabsTrigger
							key={agency.id}
							value={agency.id}
							className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-white"
						>
							<div
								className="flex h-10 w-10 items-center justify-center rounded-lg"
								style={{ backgroundColor: agency.bgColor }}
							>
								{agency.icon}
							</div>
							<span className="font-medium text-xs">{agency.shortName}</span>
							{agency.pendingDeadlines > 0 && (
								<Badge variant="destructive" className="h-4 px-1 text-xs">
									{agency.pendingDeadlines}
								</Badge>
							)}
						</TabsTrigger>
					))}
				</TabsList>

				{ENHANCED_AGENCY_CATEGORIES.map((agency) => (
					<TabsContent key={agency.id} value={agency.id} className="space-y-6">
						{/* Agency Information */}
						<Card>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div
											className="flex h-12 w-12 items-center justify-center rounded-lg"
											style={{ backgroundColor: agency.bgColor }}
										>
											{agency.icon}
										</div>
										<div>
											<CardTitle className="text-xl">{agency.name}</CardTitle>
											<p className="text-muted-foreground">
												{agency.description}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-2">
										<Button variant="outline" size="sm">
											<ExternalLink className="mr-1 h-4 w-4" />
											Website
										</Button>
										<Button variant="outline" size="sm">
											<Info className="mr-1 h-4 w-4" />
											Contact
										</Button>
									</div>
								</div>

								{showStatistics && (
									<div className="mt-4 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
										<div className="text-center">
											<p className="font-semibold text-blue-600 text-lg">
												{agency.recentDocuments}
											</p>
											<p className="text-muted-foreground text-xs">
												Recent Documents
											</p>
										</div>
										<div className="text-center">
											<p className="font-semibold text-green-600 text-lg">
												{agency.complianceScore}%
											</p>
											<p className="text-muted-foreground text-xs">
												Compliance Score
											</p>
										</div>
										<div className="text-center">
											<p className="font-semibold text-lg text-orange-600">
												{agency.pendingDeadlines}
											</p>
											<p className="text-muted-foreground text-xs">
												Pending Deadlines
											</p>
										</div>
									</div>
								)}
							</CardHeader>
						</Card>

						{/* Document Types */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									Document Types ({agency.documentTypes.length})
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{agency.documentTypes.map((documentType) => (
										<motion.div
											key={documentType.id}
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className={cn(
												"cursor-pointer rounded-lg border p-4 transition-all",
												selectedDocumentType === documentType.id
													? "border-blue-500 bg-blue-50 shadow-md"
													: "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
											)}
											onClick={() => onDocumentTypeChange?.(documentType.id)}
										>
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<div className="mb-2 flex items-center gap-2">
														<h3 className="font-medium">{documentType.name}</h3>
														{documentType.required && (
															<Badge variant="destructive" className="text-xs">
																Required
															</Badge>
														)}
														<Badge
															variant={
																documentType.urgencyLevel === "critical"
																	? "destructive"
																	: documentType.urgencyLevel === "high"
																		? "default"
																		: documentType.urgencyLevel === "medium"
																			? "secondary"
																			: "outline"
															}
															className="text-xs"
														>
															{documentType.urgencyLevel}
														</Badge>
													</div>
													<p className="mb-2 text-muted-foreground text-sm">
														{documentType.description}
													</p>

													{documentType.deadline && (
														<div className="flex items-center gap-2 text-orange-600 text-xs">
															<Clock className="h-3 w-3" />
															{documentType.deadline.description}
														</div>
													)}

													{documentType.estimatedProcessingTime && (
														<div className="mt-1 flex items-center gap-2 text-gray-600 text-xs">
															<TrendingUp className="h-3 w-3" />
															Processing: {documentType.estimatedProcessingTime}
														</div>
													)}

													{documentType.fees && (
														<div className="mt-1 flex items-center gap-2 text-gray-600 text-xs">
															<Tag className="h-3 w-3" />
															Fees: {documentType.fees}
														</div>
													)}
												</div>

												<div className="flex items-center gap-2">
													{documentType.templates &&
														documentType.templates.length > 0 && (
															<Badge variant="outline" className="text-xs">
																{documentType.templates.length} template
																{documentType.templates.length !== 1 ? "s" : ""}
															</Badge>
														)}
													<ChevronRight className="h-4 w-4 text-gray-400" />
												</div>
											</div>
										</motion.div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Templates Section */}
						{showTemplates &&
							selectedDocumentTypeData &&
							selectedDocumentTypeData.templates && (
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Download className="h-5 w-5" />
											Available Templates
										</CardTitle>
										<p className="text-muted-foreground text-sm">
											Pre-filled forms and templates for{" "}
											{selectedDocumentTypeData.name}
										</p>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											{selectedDocumentTypeData.templates.map(
												(template, index) => (
													<motion.div
														key={template.id}
														initial={{ opacity: 0, y: 10 }}
														animate={{ opacity: 1, y: 0 }}
														transition={{ delay: index * 0.1 }}
														className="rounded-lg border p-4 transition-colors hover:bg-gray-50"
													>
														<div className="flex items-start justify-between">
															<div className="flex-1">
																<h4 className="mb-1 font-medium">
																	{template.name}
																</h4>
																<p className="mb-3 text-muted-foreground text-sm">
																	{template.description}
																</p>

																<div className="space-y-2">
																	<div>
																		<Label className="text-gray-600 text-xs">
																			Required Fields:
																		</Label>
																		<div className="mt-1 flex flex-wrap gap-1">
																			{template.requiredFields
																				.slice(0, 4)
																				.map((field) => (
																					<Badge
																						key={field}
																						variant="outline"
																						className="text-xs"
																					>
																						{field}
																					</Badge>
																				))}
																			{template.requiredFields.length > 4 && (
																				<Badge
																					variant="outline"
																					className="text-xs"
																				>
																					+{template.requiredFields.length - 4}{" "}
																					more
																				</Badge>
																			)}
																		</div>
																	</div>

																	<Collapsible>
																		<CollapsibleTrigger asChild>
																			<Button
																				variant="ghost"
																				size="sm"
																				className="h-auto p-1 text-xs"
																			>
																				<ChevronDown className="mr-1 h-3 w-3" />
																				Example Values
																			</Button>
																		</CollapsibleTrigger>
																		<CollapsibleContent>
																			<div className="mt-2 space-y-1 rounded bg-gray-50 p-2 text-xs">
																				{Object.entries(
																					template.exampleFields,
																				).map(([key, value]) => (
																					<div
																						key={key}
																						className="flex justify-between"
																					>
																						<span className="text-gray-600">
																							{key}:
																						</span>
																						<span className="font-mono">
																							{value}
																						</span>
																					</div>
																				))}
																			</div>
																		</CollapsibleContent>
																	</Collapsible>
																</div>
															</div>

															<div className="ml-4 flex flex-col gap-2">
																<Button
																	size="sm"
																	onClick={() => onTemplateSelect?.(template)}
																>
																	<Download className="mr-1 h-3 w-3" />
																	Download
																</Button>
																<Button variant="outline" size="sm">
																	<BookOpen className="mr-1 h-3 w-3" />
																	Guide
																</Button>
															</div>
														</div>
													</motion.div>
												),
											)}
										</div>
									</CardContent>
								</Card>
							)}
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}

// Export enhanced agency categories for use in other components
export { ENHANCED_AGENCY_CATEGORIES };
export type { DocumentTemplate, SmartSuggestion };
