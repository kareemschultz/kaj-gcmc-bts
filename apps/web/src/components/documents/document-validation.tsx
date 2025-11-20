"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Activity,
	AlertCircle,
	AlertTriangle,
	Archive,
	BarChart3,
	Building,
	Calendar,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Clock,
	Copy,
	Download,
	Edit3,
	Eye,
	FileCheck,
	FileText,
	FileX,
	Filter,
	Flag,
	Info,
	Layers,
	Lock,
	MoreHorizontal,
	PieChart,
	RefreshCw,
	Scan,
	Search,
	Settings,
	Share,
	Shield,
	Star,
	Tag,
	Target,
	Trash2,
	TrendingUp,
	Unlock,
	Upload,
	User,
	XCircle,
	Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { brandColors, businessColors, gcmcKajBrand } from "@/styles/brand";

// Validation types
interface ValidationRule {
	id: string;
	name: string;
	type: "required" | "format" | "size" | "content" | "compliance" | "security";
	severity: "error" | "warning" | "info";
	description: string;
	validator: (file: DocumentFile, metadata?: any) => ValidationResult;
	autoFix?: (file: DocumentFile) => DocumentFile;
	category: "format" | "content" | "security" | "compliance" | "quality";
}

interface ValidationResult {
	passed: boolean;
	message: string;
	suggestion?: string;
	autoFixable?: boolean;
	details?: Record<string, any>;
}

interface DocumentFile {
	id: string;
	name: string;
	size: number;
	type: string;
	content?: string;
	metadata?: Record<string, any>;
	tags?: string[];
	category?: string;
	agency?: string;
}

interface ValidationReport {
	documentId: string;
	documentName: string;
	totalChecks: number;
	passedChecks: number;
	errors: ValidationError[];
	warnings: ValidationWarning[];
	suggestions: ValidationSuggestion[];
	complianceScore: number;
	validationDate: string;
	processingTime: number;
}

interface ValidationError {
	ruleId: string;
	ruleName: string;
	message: string;
	severity: "error" | "warning" | "info";
	autoFixable: boolean;
	category: string;
	suggestion?: string;
}

interface ValidationWarning extends ValidationError {
	ignorable: boolean;
}

interface ValidationSuggestion {
	type: "improvement" | "optimization" | "compliance";
	title: string;
	description: string;
	impact: "low" | "medium" | "high";
	implementable: boolean;
}

// Guyanese compliance validation rules
const GUYANESE_VALIDATION_RULES: ValidationRule[] = [
	// GRA (Guyana Revenue Authority) Rules
	{
		id: "gra-tin-required",
		name: "TIN Number Required",
		type: "required",
		severity: "error",
		description: "Tax documents must include a valid TIN number",
		category: "compliance",
		validator: (file) => {
			const hasTin = file.content?.includes("TIN") || file.metadata?.tin;
			return {
				passed: hasTin,
				message: hasTin
					? "TIN number found"
					: "TIN number is required for tax documents",
				suggestion:
					"Ensure your Taxpayer Identification Number is clearly visible",
				autoFixable: false,
			};
		},
	},
	{
		id: "gra-filing-deadline",
		name: "Filing Deadline Compliance",
		type: "compliance",
		severity: "warning",
		description: "Check if document meets GRA filing deadlines",
		category: "compliance",
		validator: (file) => {
			const currentDate = new Date();
			const taxDeadline = new Date(currentDate.getFullYear(), 3, 30); // April 30

			return {
				passed: currentDate <= taxDeadline,
				message:
					currentDate <= taxDeadline
						? `Filing deadline not yet passed (due ${taxDeadline.toLocaleDateString()})`
						: `Filing deadline has passed (was ${taxDeadline.toLocaleDateString()})`,
				suggestion: "File as soon as possible to avoid penalties",
				autoFixable: false,
			};
		},
	},

	// NIS (National Insurance Scheme) Rules
	{
		id: "nis-employer-number",
		name: "NIS Employer Number",
		type: "required",
		severity: "error",
		description: "NIS documents must include employer registration number",
		category: "compliance",
		validator: (file) => {
			const hasEmployerNumber =
				file.content?.includes("EMP") || file.metadata?.employerNumber;
			return {
				passed: hasEmployerNumber,
				message: hasEmployerNumber
					? "Employer number found"
					: "NIS employer number is required",
				suggestion: "Include your NIS employer registration number",
				autoFixable: false,
			};
		},
	},

	// DCRA (Deeds & Commercial Registry Authority) Rules
	{
		id: "dcra-company-number",
		name: "Company Registration Number",
		type: "required",
		severity: "error",
		description: "Company documents must include registration number",
		category: "compliance",
		validator: (file) => {
			const hasRegNumber =
				file.content?.includes("REG") || file.metadata?.registrationNumber;
			return {
				passed: hasRegNumber,
				message: hasRegNumber
					? "Company registration number found"
					: "Company registration number is required",
				suggestion: "Include your DCRA company registration number",
				autoFixable: false,
			};
		},
	},

	// File Format Rules
	{
		id: "file-size-limit",
		name: "File Size Limit",
		type: "size",
		severity: "error",
		description: "File must not exceed 50MB",
		category: "format",
		validator: (file) => {
			const maxSize = 50 * 1024 * 1024; // 50MB
			return {
				passed: file.size <= maxSize,
				message:
					file.size <= maxSize
						? `File size acceptable (${(file.size / 1024 / 1024).toFixed(2)}MB)`
						: `File size exceeds limit (${(file.size / 1024 / 1024).toFixed(2)}MB > 50MB)`,
				suggestion: "Compress or split the file",
				autoFixable: false,
			};
		},
	},
	{
		id: "supported-format",
		name: "Supported File Format",
		type: "format",
		severity: "error",
		description: "File must be in a supported format",
		category: "format",
		validator: (file) => {
			const supportedFormats = [
				"pdf",
				"doc",
				"docx",
				"jpg",
				"jpeg",
				"png",
				"xlsx",
				"xls",
			];
			const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
			return {
				passed: supportedFormats.includes(fileExtension),
				message: supportedFormats.includes(fileExtension)
					? `Supported format (${fileExtension.toUpperCase()})`
					: `Unsupported format (${fileExtension.toUpperCase()})`,
				suggestion: `Convert to: ${supportedFormats.join(", ").toUpperCase()}`,
				autoFixable: false,
			};
		},
	},

	// Content Quality Rules
	{
		id: "image-quality",
		name: "Image Quality Check",
		type: "content",
		severity: "warning",
		description: "Image documents should be clear and readable",
		category: "quality",
		validator: (file) => {
			// Mock quality check - would use actual image analysis
			const isImage = ["jpg", "jpeg", "png"].includes(
				file.name.split(".").pop()?.toLowerCase() || "",
			);
			if (!isImage) return { passed: true, message: "Not an image file" };

			const mockQuality = Math.random(); // 0-1
			return {
				passed: mockQuality > 0.6,
				message:
					mockQuality > 0.8
						? "Excellent image quality"
						: mockQuality > 0.6
							? "Good image quality"
							: "Poor image quality",
				suggestion: "Retake photo with better lighting or higher resolution",
				autoFixable: false,
			};
		},
	},

	// Security Rules
	{
		id: "password-protection",
		name: "Password Protection",
		type: "security",
		severity: "info",
		description: "Sensitive documents should be password protected",
		category: "security",
		validator: (file) => {
			const isSensitive =
				file.metadata?.confidential || file.category === "tax_documents";
			const isProtected = file.metadata?.passwordProtected;

			if (!isSensitive)
				return { passed: true, message: "Not a sensitive document" };

			return {
				passed: isProtected || false,
				message: isProtected
					? "Document is password protected"
					: "Sensitive document without password protection",
				suggestion:
					"Consider adding password protection for sensitive documents",
				autoFixable: false,
			};
		},
	},

	// Metadata Rules
	{
		id: "document-title",
		name: "Document Title",
		type: "required",
		severity: "warning",
		description: "Document should have a descriptive title",
		category: "content",
		validator: (file) => {
			const hasTitle = file.metadata?.title || file.name.length > 10;
			return {
				passed: hasTitle,
				message: hasTitle
					? "Document has title"
					: "Document lacks descriptive title",
				suggestion: "Add a descriptive title for better organization",
				autoFixable: true,
			};
		},
		autoFix: (file) => ({
			...file,
			metadata: {
				...file.metadata,
				title: `Generated title for ${file.name}`,
			},
		}),
	},
];

interface DocumentValidationProps {
	documents: DocumentFile[];
	onValidationComplete?: (reports: ValidationReport[]) => void;
	onDocumentUpdate?: (document: DocumentFile) => void;
	enableAutoFix?: boolean;
	customRules?: ValidationRule[];
	className?: string;
}

export function DocumentValidation({
	documents,
	onValidationComplete,
	onDocumentUpdate,
	enableAutoFix = true,
	customRules = [],
	className,
}: DocumentValidationProps) {
	const [validationReports, setValidationReports] = useState<
		ValidationReport[]
	>([]);
	const [isValidating, setIsValidating] = useState(false);
	const [validationProgress, setValidationProgress] = useState(0);
	const [selectedReport, setSelectedReport] = useState<ValidationReport | null>(
		null,
	);
	const [filterSeverity, setFilterSeverity] = useState<string>("all");
	const [filterCategory, setFilterCategory] = useState<string>("all");
	const [searchTerm, setSearchTerm] = useState("");
	const [showDetails, setShowDetails] = useState<Set<string>>(new Set());
	const [enabledRules, setEnabledRules] = useState<Set<string>>(
		new Set(GUYANESE_VALIDATION_RULES.map((rule) => rule.id)),
	);

	// Combined validation rules
	const allRules = useMemo(
		() => [...GUYANESE_VALIDATION_RULES, ...customRules],
		[customRules],
	);

	// Active rules based on enabledRules
	const activeRules = useMemo(
		() => allRules.filter((rule) => enabledRules.has(rule.id)),
		[allRules, enabledRules],
	);

	// Run validation for all documents
	const runValidation = async () => {
		if (documents.length === 0) return;

		setIsValidating(true);
		setValidationProgress(0);

		const reports: ValidationReport[] = [];

		for (let i = 0; i < documents.length; i++) {
			const document = documents[i];
			const startTime = Date.now();

			const errors: ValidationError[] = [];
			const warnings: ValidationWarning[] = [];
			const suggestions: ValidationSuggestion[] = [];

			let passedChecks = 0;

			// Run each validation rule
			for (const rule of activeRules) {
				try {
					const result = rule.validator(document, document.metadata);

					if (result.passed) {
						passedChecks++;
					} else {
						const validationItem = {
							ruleId: rule.id,
							ruleName: rule.name,
							message: result.message,
							severity: rule.severity,
							autoFixable: result.autoFixable || false,
							category: rule.category,
							suggestion: result.suggestion,
						};

						if (rule.severity === "error") {
							errors.push(validationItem);
						} else if (rule.severity === "warning") {
							warnings.push({ ...validationItem, ignorable: true });
						}
					}

					// Add suggestions based on validation results
					if (result.suggestion) {
						suggestions.push({
							type: "improvement",
							title: rule.name,
							description: result.suggestion,
							impact: rule.severity === "error" ? "high" : "medium",
							implementable: result.autoFixable || false,
						});
					}
				} catch (error) {
					console.error(`Validation rule ${rule.id} failed:`, error);
				}
			}

			// Calculate compliance score
			const complianceScore = Math.round(
				(passedChecks / activeRules.length) * 100,
			);

			const report: ValidationReport = {
				documentId: document.id,
				documentName: document.name,
				totalChecks: activeRules.length,
				passedChecks,
				errors,
				warnings,
				suggestions,
				complianceScore,
				validationDate: new Date().toISOString(),
				processingTime: Date.now() - startTime,
			};

			reports.push(report);

			// Update progress
			setValidationProgress(((i + 1) / documents.length) * 100);

			// Small delay to show progress
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		setValidationReports(reports);
		setIsValidating(false);
		onValidationComplete?.(reports);

		// Show summary toast
		const totalErrors = reports.reduce((sum, r) => sum + r.errors.length, 0);
		const totalWarnings = reports.reduce(
			(sum, r) => sum + r.warnings.length,
			0,
		);
		const avgCompliance = Math.round(
			reports.reduce((sum, r) => sum + r.complianceScore, 0) / reports.length,
		);

		toast.success(
			`Validation complete: ${totalErrors} errors, ${totalWarnings} warnings`,
			{ description: `Average compliance score: ${avgCompliance}%` },
		);
	};

	// Auto-fix function
	const runAutoFix = async (reportId: string) => {
		const report = validationReports.find((r) => r.documentId === reportId);
		if (!report) return;

		const document = documents.find((d) => d.id === reportId);
		if (!document) return;

		let fixedDocument = { ...document };
		let fixesApplied = 0;

		for (const error of report.errors) {
			if (error.autoFixable) {
				const rule = activeRules.find((r) => r.id === error.ruleId);
				if (rule?.autoFix) {
					fixedDocument = rule.autoFix(fixedDocument);
					fixesApplied++;
				}
			}
		}

		if (fixesApplied > 0) {
			onDocumentUpdate?.(fixedDocument);
			toast.success(`Applied ${fixesApplied} automatic fixes`);

			// Re-run validation for this document
			setTimeout(() => runValidation(), 500);
		}
	};

	// Filter reports
	const filteredReports = useMemo(() => {
		return validationReports.filter((report) => {
			const matchesSearch =
				searchTerm === "" ||
				report.documentName.toLowerCase().includes(searchTerm.toLowerCase());

			const matchesSeverity =
				filterSeverity === "all" ||
				(filterSeverity === "error" && report.errors.length > 0) ||
				(filterSeverity === "warning" && report.warnings.length > 0) ||
				(filterSeverity === "passed" &&
					report.errors.length === 0 &&
					report.warnings.length === 0);

			const matchesCategory =
				filterCategory === "all" ||
				[...report.errors, ...report.warnings].some(
					(item) => item.category === filterCategory,
				);

			return matchesSearch && matchesSeverity && matchesCategory;
		});
	}, [validationReports, searchTerm, filterSeverity, filterCategory]);

	// Stats
	const stats = useMemo(() => {
		const totalDocuments = validationReports.length;
		const totalErrors = validationReports.reduce(
			(sum, r) => sum + r.errors.length,
			0,
		);
		const totalWarnings = validationReports.reduce(
			(sum, r) => sum + r.warnings.length,
			0,
		);
		const avgCompliance =
			totalDocuments > 0
				? Math.round(
						validationReports.reduce((sum, r) => sum + r.complianceScore, 0) /
							totalDocuments,
					)
				: 0;
		const passedDocuments = validationReports.filter(
			(r) => r.errors.length === 0,
		).length;

		return {
			totalDocuments,
			totalErrors,
			totalWarnings,
			avgCompliance,
			passedDocuments,
		};
	}, [validationReports]);

	// Run validation when documents change
	useEffect(() => {
		if (documents.length > 0) {
			runValidation();
		}
	}, [documents.length, enabledRules]);

	return (
		<div className={cn("space-y-6", className)}>
			{/* Header with stats */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-6 w-6 text-blue-600" />
								Document Validation
							</CardTitle>
							<p className="text-muted-foreground text-sm">
								Comprehensive compliance and quality checking for Guyanese
								regulatory requirements
							</p>
						</div>

						<Button
							onClick={runValidation}
							disabled={isValidating || documents.length === 0}
						>
							{isValidating ? (
								<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Scan className="mr-2 h-4 w-4" />
							)}
							{isValidating ? "Validating..." : "Run Validation"}
						</Button>
					</div>
				</CardHeader>

				<CardContent>
					{/* Progress bar during validation */}
					{isValidating && (
						<div className="mb-6">
							<div className="mb-2 flex justify-between text-sm">
								<span>Validating documents...</span>
								<span>{Math.round(validationProgress)}%</span>
							</div>
							<Progress value={validationProgress} className="h-2" />
						</div>
					)}

					{/* Statistics */}
					<div className="grid grid-cols-2 gap-4 md:grid-cols-5">
						<div className="text-center">
							<p className="font-bold text-2xl text-blue-600">
								{stats.totalDocuments}
							</p>
							<p className="text-muted-foreground text-xs">Documents</p>
						</div>
						<div className="text-center">
							<p className="font-bold text-2xl text-green-600">
								{stats.passedDocuments}
							</p>
							<p className="text-muted-foreground text-xs">Passed</p>
						</div>
						<div className="text-center">
							<p className="font-bold text-2xl text-red-600">
								{stats.totalErrors}
							</p>
							<p className="text-muted-foreground text-xs">Errors</p>
						</div>
						<div className="text-center">
							<p className="font-bold text-2xl text-yellow-600">
								{stats.totalWarnings}
							</p>
							<p className="text-muted-foreground text-xs">Warnings</p>
						</div>
						<div className="text-center">
							<p className="font-bold text-2xl text-purple-600">
								{stats.avgCompliance}%
							</p>
							<p className="text-muted-foreground text-xs">Avg Compliance</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Controls and Filters */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-col gap-4 sm:flex-row">
						<div className="flex-1">
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
								<Input
									placeholder="Search validation reports..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-9"
								/>
							</div>
						</div>

						<Select value={filterSeverity} onValueChange={setFilterSeverity}>
							<SelectTrigger className="w-[150px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Issues</SelectItem>
								<SelectItem value="error">Errors Only</SelectItem>
								<SelectItem value="warning">Warnings Only</SelectItem>
								<SelectItem value="passed">Passed Only</SelectItem>
							</SelectContent>
						</Select>

						<Select value={filterCategory} onValueChange={setFilterCategory}>
							<SelectTrigger className="w-[150px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Categories</SelectItem>
								<SelectItem value="compliance">Compliance</SelectItem>
								<SelectItem value="format">Format</SelectItem>
								<SelectItem value="security">Security</SelectItem>
								<SelectItem value="quality">Quality</SelectItem>
								<SelectItem value="content">Content</SelectItem>
							</SelectContent>
						</Select>

						<ValidationRulesConfig
							rules={allRules}
							enabledRules={enabledRules}
							onEnabledRulesChange={setEnabledRules}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Validation Reports */}
			<div className="space-y-4">
				{filteredReports.map((report, index) => (
					<motion.div
						key={report.documentId}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
					>
						<ValidationReportCard
							report={report}
							onAutoFix={enableAutoFix ? runAutoFix : undefined}
							showDetails={showDetails.has(report.documentId)}
							onToggleDetails={() => {
								const newShowDetails = new Set(showDetails);
								if (newShowDetails.has(report.documentId)) {
									newShowDetails.delete(report.documentId);
								} else {
									newShowDetails.add(report.documentId);
								}
								setShowDetails(newShowDetails);
							}}
						/>
					</motion.div>
				))}

				{filteredReports.length === 0 && validationReports.length > 0 && (
					<Card>
						<CardContent className="p-8 text-center">
							<Search className="mx-auto mb-4 h-12 w-12 text-gray-300" />
							<h3 className="mb-2 font-medium text-gray-900 text-lg">
								No matching reports
							</h3>
							<p className="text-gray-600">
								Try adjusting your search criteria
							</p>
						</CardContent>
					</Card>
				)}

				{documents.length === 0 && (
					<Card>
						<CardContent className="p-8 text-center">
							<FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
							<h3 className="mb-2 font-medium text-gray-900 text-lg">
								No documents to validate
							</h3>
							<p className="text-gray-600">
								Upload some documents to see validation results
							</p>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}

// Validation Report Card Component
interface ValidationReportCardProps {
	report: ValidationReport;
	onAutoFix?: (documentId: string) => void;
	showDetails: boolean;
	onToggleDetails: () => void;
}

function ValidationReportCard({
	report,
	onAutoFix,
	showDetails,
	onToggleDetails,
}: ValidationReportCardProps) {
	const getComplianceColor = (score: number) => {
		if (score >= 90) return "text-green-600";
		if (score >= 70) return "text-yellow-600";
		return "text-red-600";
	};

	const getComplianceBackground = (score: number) => {
		if (score >= 90) return "bg-green-500";
		if (score >= 70) return "bg-yellow-500";
		return "bg-red-500";
	};

	const autoFixableErrors = report.errors.filter((e) => e.autoFixable).length;

	return (
		<Card
			className={cn(
				"transition-all duration-200",
				report.errors.length > 0
					? "border-red-200 bg-red-50"
					: report.warnings.length > 0
						? "border-yellow-200 bg-yellow-50"
						: "border-green-200 bg-green-50",
			)}
		>
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2">
							{report.errors.length > 0 ? (
								<XCircle className="h-5 w-5 text-red-600" />
							) : report.warnings.length > 0 ? (
								<AlertTriangle className="h-5 w-5 text-yellow-600" />
							) : (
								<CheckCircle className="h-5 w-5 text-green-600" />
							)}
							<h3 className="truncate font-medium" title={report.documentName}>
								{report.documentName}
							</h3>
						</div>

						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className={cn(
									"text-xs",
									getComplianceColor(report.complianceScore),
								)}
							>
								{report.complianceScore}% compliant
							</Badge>

							{report.errors.length > 0 && (
								<Badge variant="destructive" className="text-xs">
									{report.errors.length} error
									{report.errors.length !== 1 ? "s" : ""}
								</Badge>
							)}

							{report.warnings.length > 0 && (
								<Badge
									variant="secondary"
									className="bg-yellow-100 text-xs text-yellow-800"
								>
									{report.warnings.length} warning
									{report.warnings.length !== 1 ? "s" : ""}
								</Badge>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2">
						<div className="text-right">
							<p className="font-medium text-sm">
								{report.passedChecks}/{report.totalChecks}
							</p>
							<p className="text-muted-foreground text-xs">checks passed</p>
						</div>

						<div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200">
							<div
								className={cn(
									"h-full transition-all",
									getComplianceBackground(report.complianceScore),
								)}
								style={{ width: `${report.complianceScore}%` }}
							/>
						</div>

						<div className="flex items-center gap-1">
							{onAutoFix && autoFixableErrors > 0 && (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												size="sm"
												onClick={() => onAutoFix(report.documentId)}
											>
												<Zap className="mr-1 h-3 w-3" />
												Fix ({autoFixableErrors})
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											Auto-fix {autoFixableErrors} error
											{autoFixableErrors !== 1 ? "s" : ""}
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}

							<Button variant="ghost" size="sm" onClick={onToggleDetails}>
								{showDetails ? (
									<ChevronDown className="h-4 w-4" />
								) : (
									<ChevronRight className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>
				</div>

				<AnimatePresence>
					{showDetails && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="mt-4 space-y-4"
						>
							<Separator />

							<Tabs defaultValue="issues" className="w-full">
								<TabsList className="grid w-full grid-cols-3">
									<TabsTrigger value="issues">
										Issues ({report.errors.length + report.warnings.length})
									</TabsTrigger>
									<TabsTrigger value="suggestions">
										Suggestions ({report.suggestions.length})
									</TabsTrigger>
									<TabsTrigger value="details">Details</TabsTrigger>
								</TabsList>

								<TabsContent value="issues" className="space-y-3">
									{/* Errors */}
									{report.errors.map((error, index) => (
										<div
											key={`error-${index}`}
											className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3"
										>
											<XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
											<div className="flex-1">
												<div className="flex items-center justify-between">
													<p className="font-medium text-red-900">
														{error.ruleName}
													</p>
													<div className="flex items-center gap-2">
														<Badge variant="destructive" className="text-xs">
															{error.severity}
														</Badge>
														{error.autoFixable && (
															<Badge variant="outline" className="text-xs">
																Auto-fixable
															</Badge>
														)}
													</div>
												</div>
												<p className="text-red-700 text-sm">{error.message}</p>
												{error.suggestion && (
													<p className="mt-1 text-red-600 text-xs">
														💡 {error.suggestion}
													</p>
												)}
											</div>
										</div>
									))}

									{/* Warnings */}
									{report.warnings.map((warning, index) => (
										<div
											key={`warning-${index}`}
											className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3"
										>
											<AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
											<div className="flex-1">
												<div className="flex items-center justify-between">
													<p className="font-medium text-yellow-900">
														{warning.ruleName}
													</p>
													<Badge
														variant="outline"
														className="bg-yellow-100 text-xs text-yellow-800"
													>
														{warning.severity}
													</Badge>
												</div>
												<p className="text-sm text-yellow-700">
													{warning.message}
												</p>
												{warning.suggestion && (
													<p className="mt-1 text-xs text-yellow-600">
														💡 {warning.suggestion}
													</p>
												)}
											</div>
										</div>
									))}

									{report.errors.length === 0 &&
										report.warnings.length === 0 && (
											<div className="py-6 text-center">
												<CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
												<p className="font-medium text-green-700">
													All validation checks passed!
												</p>
											</div>
										)}
								</TabsContent>

								<TabsContent value="suggestions" className="space-y-3">
									{report.suggestions.map((suggestion, index) => (
										<div
											key={`suggestion-${index}`}
											className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3"
										>
											<Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
											<div className="flex-1">
												<div className="flex items-center justify-between">
													<p className="font-medium text-blue-900">
														{suggestion.title}
													</p>
													<div className="flex items-center gap-1">
														<Badge
															variant="outline"
															className={cn(
																"text-xs",
																suggestion.impact === "high"
																	? "border-red-300 text-red-700"
																	: suggestion.impact === "medium"
																		? "border-yellow-300 text-yellow-700"
																		: "border-green-300 text-green-700",
															)}
														>
															{suggestion.impact} impact
														</Badge>
														{suggestion.implementable && (
															<Star className="h-3 w-3 text-blue-600" />
														)}
													</div>
												</div>
												<p className="text-blue-700 text-sm">
													{suggestion.description}
												</p>
											</div>
										</div>
									))}

									{report.suggestions.length === 0 && (
										<div className="py-6 text-center">
											<Target className="mx-auto mb-2 h-8 w-8 text-gray-400" />
											<p className="text-gray-600">No additional suggestions</p>
										</div>
									)}
								</TabsContent>

								<TabsContent value="details" className="space-y-4">
									<div className="grid grid-cols-2 gap-4 text-sm">
										<div>
											<Label>Validation Date</Label>
											<p className="text-muted-foreground">
												{new Date(report.validationDate).toLocaleString()}
											</p>
										</div>
										<div>
											<Label>Processing Time</Label>
											<p className="text-muted-foreground">
												{report.processingTime}ms
											</p>
										</div>
										<div>
											<Label>Total Checks</Label>
											<p className="text-muted-foreground">
												{report.totalChecks}
											</p>
										</div>
										<div>
											<Label>Passed Checks</Label>
											<p className="text-muted-foreground">
												{report.passedChecks}
											</p>
										</div>
									</div>
								</TabsContent>
							</Tabs>
						</motion.div>
					)}
				</AnimatePresence>
			</CardContent>
		</Card>
	);
}

// Validation Rules Configuration Component
interface ValidationRulesConfigProps {
	rules: ValidationRule[];
	enabledRules: Set<string>;
	onEnabledRulesChange: (enabledRules: Set<string>) => void;
}

function ValidationRulesConfig({
	rules,
	enabledRules,
	onEnabledRulesChange,
}: ValidationRulesConfigProps) {
	const [isOpen, setIsOpen] = useState(false);

	const toggleRule = (ruleId: string) => {
		const newEnabledRules = new Set(enabledRules);
		if (newEnabledRules.has(ruleId)) {
			newEnabledRules.delete(ruleId);
		} else {
			newEnabledRules.add(ruleId);
		}
		onEnabledRulesChange(newEnabledRules);
	};

	const toggleAll = (enable: boolean) => {
		if (enable) {
			onEnabledRulesChange(new Set(rules.map((r) => r.id)));
		} else {
			onEnabledRulesChange(new Set());
		}
	};

	const rulesByCategory = rules.reduce(
		(acc, rule) => {
			if (!acc[rule.category]) {
				acc[rule.category] = [];
			}
			acc[rule.category].push(rule);
			return acc;
		},
		{} as Record<string, ValidationRule[]>,
	);

	return (
		<div className="relative">
			<Button variant="outline" onClick={() => setIsOpen(!isOpen)}>
				<Settings className="mr-2 h-4 w-4" />
				Rules ({enabledRules.size}/{rules.length})
			</Button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, y: 10, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 10, scale: 0.95 }}
						className="absolute top-full right-0 z-50 mt-2 w-96 rounded-lg border bg-white shadow-xl"
					>
						<div className="border-b p-4">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="font-semibold">Validation Rules</h3>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setIsOpen(false)}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>

							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => toggleAll(true)}
								>
									Enable All
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => toggleAll(false)}
								>
									Disable All
								</Button>
							</div>
						</div>

						<ScrollArea className="max-h-96">
							<div className="space-y-4 p-4">
								{Object.entries(rulesByCategory).map(
									([category, categoryRules]) => (
										<div key={category}>
											<h4 className="mb-2 font-medium text-sm capitalize">
												{category} ({categoryRules.length})
											</h4>
											<div className="space-y-2">
												{categoryRules.map((rule) => (
													<div
														key={rule.id}
														className="flex items-start gap-3 rounded p-2 hover:bg-gray-50"
													>
														<Checkbox
															checked={enabledRules.has(rule.id)}
															onCheckedChange={() => toggleRule(rule.id)}
														/>
														<div className="flex-1">
															<div className="flex items-center gap-2">
																<p className="font-medium text-sm">
																	{rule.name}
																</p>
																<Badge
																	variant="outline"
																	className={cn(
																		"text-xs",
																		rule.severity === "error"
																			? "border-red-300 text-red-700"
																			: rule.severity === "warning"
																				? "border-yellow-300 text-yellow-700"
																				: "border-blue-300 text-blue-700",
																	)}
																>
																	{rule.severity}
																</Badge>
															</div>
															<p className="text-muted-foreground text-xs">
																{rule.description}
															</p>
														</div>
													</div>
												))}
											</div>
										</div>
									),
								)}
							</div>
						</ScrollArea>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export { GUYANESE_VALIDATION_RULES };
export type { ValidationRule, ValidationReport, DocumentFile };
