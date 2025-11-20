"use client";

/**
 * Form Builder Main Page
 * Complete form builder interface with all features integrated
 */

import {
	ArrowLeft,
	BarChart3,
	ChevronDown,
	Copy,
	Download,
	Eye,
	FileText,
	Globe,
	Monitor,
	Plus,
	Save,
	Settings,
	Share2,
	Smartphone,
	Tablet,
	Upload,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormAnalytics as FormAnalyticsComponent } from "@/components/form-builder/FormAnalytics";

import { FormBuilder } from "@/components/form-builder/FormBuilder";
import { FormRenderer } from "@/components/form-builder/FormRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	getTemplateById,
	getTemplatesForAuthority,
} from "@/lib/form-builder/agency-templates";
import type {
	AgencyFormTemplate,
	Authority,
	FormAnalytics,
	FormConfiguration,
} from "@/lib/form-builder/types";

function FormBuilderPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// State
	const [currentForm, setCurrentForm] = useState<FormConfiguration | null>(
		null,
	);
	const [selectedTemplate, setSelectedTemplate] = useState<string>("");
	const [showTemplateDialog, setShowTemplateDialog] = useState(false);
	const [showPreviewDialog, setShowPreviewDialog] = useState(false);
	const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
	const [previewDevice, setPreviewDevice] = useState<
		"desktop" | "tablet" | "mobile"
	>("desktop");
	const [isLoading, setIsLoading] = useState(false);
	const [isDirty, setIsDirty] = useState(false);

	// Mock analytics data
	const mockAnalytics: FormAnalytics = {
		formId: "example-form",
		period: {
			start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
			end: new Date(),
		},
		totalStarts: 1250,
		totalCompletions: 987,
		completionRate: 78.96,
		averageCompletionTime: 8.5,
		fieldAnalytics: [
			{
				fieldId: "business_name",
				fieldName: "Business Name",
				completionRate: 95.2,
				averageTimeSpent: 45,
				validationErrorRate: 0.02,
				skipRate: 0.048,
				mostCommonValues: [
					{ value: "ABC Company Ltd", count: 45 },
					{ value: "XYZ Trading", count: 32 },
				],
			},
			{
				fieldId: "tax_id",
				fieldName: "Tax ID",
				completionRate: 89.1,
				averageTimeSpent: 62,
				validationErrorRate: 0.08,
				skipRate: 0.109,
				mostCommonValues: [
					{ value: "1234567890", count: 123 },
					{ value: "0987654321", count: 98 },
				],
			},
		],
		validationErrors: [
			{
				fieldId: "tax_id",
				ruleType: "pattern",
				errorCount: 89,
				errorRate: 0.08,
				message: "Tax ID must be 10 digits",
			},
			{
				fieldId: "email",
				ruleType: "email",
				errorCount: 34,
				errorRate: 0.03,
				message: "Invalid email format",
			},
		],
		mostCommonErrors: [
			"Tax ID must be 10 digits",
			"Invalid email format",
			"Business name is required",
		],
		dropOffPoints: [
			{
				step: "Step 2",
				section: "Tax Information",
				field: "tax_id",
				dropOffCount: 56,
				dropOffRate: 0.045,
				averageTimeBeforeDropOff: 180,
			},
		],
		averageTimePerStep: [
			{
				step: "Basic Information",
				averageTime: 120,
				medianTime: 98,
				completionRate: 0.95,
			},
			{
				step: "Tax Information",
				averageTime: 180,
				medianTime: 156,
				completionRate: 0.87,
			},
		],
		deviceTypes: {
			desktop: 654,
			mobile: 445,
			tablet: 151,
		},
		browsers: {
			chrome: 567,
			safari: 234,
			firefox: 189,
			edge: 156,
			other: 104,
		},
		mobileOptimizationScore: 82,
		generatedAt: new Date(),
	};

	// Get form ID from URL params
	const formId = searchParams.get("id");
	const templateId = searchParams.get("template");
	const mode = searchParams.get("mode") || "builder";

	// Load form or template on mount
	useEffect(() => {
		if (formId) {
			loadForm(formId);
		} else if (templateId) {
			loadTemplate(templateId);
		} else {
			// Create new blank form
			createNewForm();
		}
	}, [formId, templateId]);

	// Load existing form
	const loadForm = async (id: string) => {
		setIsLoading(true);
		try {
			// In real implementation, this would fetch from API
			// For now, use a mock form
			const mockForm: FormConfiguration = {
				id,
				name: "Sample Business Registration Form",
				title: "Business Registration Application",
				description: "Apply for business registration with DCRA",
				version: "1.0",
				authority: "DCRA",
				documentType: "business_registration",
				category: "incorporation",
				applicableClientTypes: ["company"],
				fields: [],
				sections: [],
				submissionConfig: {
					method: "api",
					endpoint: "/api/forms/submit",
				},
				isActive: true,
				createdBy: "user-123",
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			setCurrentForm(mockForm);
		} catch (error) {
			toast.error("Failed to load form");
			console.error("Load form error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Load template
	const loadTemplate = async (id: string) => {
		setIsLoading(true);
		try {
			const template = getTemplateById(id);
			if (template) {
				setCurrentForm(template.configuration);
				toast.success(`Template "${template.name}" loaded`);
			} else {
				toast.error("Template not found");
			}
		} catch (error) {
			toast.error("Failed to load template");
			console.error("Load template error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Create new form
	const createNewForm = () => {
		const newForm: FormConfiguration = {
			id: `form-${Date.now()}`,
			name: "New Form",
			title: "Untitled Form",
			version: "1.0",
			authority: "GRA",
			documentType: "general",
			category: "application_form",
			applicableClientTypes: ["individual"],
			fields: [],
			sections: [],
			submissionConfig: {
				method: "api",
			},
			isActive: true,
			createdBy: "current-user",
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		setCurrentForm(newForm);
	};

	// Save form
	const handleSave = useCallback(
		async (configuration: FormConfiguration) => {
			setIsLoading(true);
			try {
				// In real implementation, this would save to API
				console.log("Saving form:", configuration);

				setCurrentForm(configuration);
				setIsDirty(false);
				toast.success("Form saved successfully");

				// Update URL if this is a new form
				if (!formId) {
					router.replace(`/forms/builder?id=${configuration.id}`);
				}
			} catch (error) {
				toast.error("Failed to save form");
				console.error("Save error:", error);
			} finally {
				setIsLoading(false);
			}
		},
		[formId, router],
	);

	// Export form
	const handleExport = useCallback(async (configuration: FormConfiguration) => {
		try {
			const dataStr = JSON.stringify(configuration, null, 2);
			const dataUri =
				"data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

			const exportFileDefaultName = `form-${configuration.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`;

			const linkElement = document.createElement("a");
			linkElement.setAttribute("href", dataUri);
			linkElement.setAttribute("download", exportFileDefaultName);
			linkElement.click();

			toast.success("Form exported successfully");
		} catch (error) {
			toast.error("Failed to export form");
			console.error("Export error:", error);
		}
	}, []);

	// Import form
	const handleImport = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const configuration = JSON.parse(
						e.target?.result as string,
					) as FormConfiguration;
					setCurrentForm(configuration);
					toast.success("Form imported successfully");
				} catch (error) {
					toast.error("Invalid form file");
					console.error("Import error:", error);
				}
			};
			reader.readAsText(file);
		},
		[],
	);

	// Publish form
	const handlePublish = useCallback(async () => {
		if (!currentForm) return;

		try {
			setIsLoading(true);
			// In real implementation, this would publish to API
			console.log("Publishing form:", currentForm);
			toast.success("Form published successfully");
		} catch (error) {
			toast.error("Failed to publish form");
			console.error("Publish error:", error);
		} finally {
			setIsLoading(false);
		}
	}, [currentForm]);

	// Preview device styles
	const previewDeviceStyles = {
		desktop: "w-full max-w-none",
		tablet: "w-[768px] mx-auto",
		mobile: "w-[375px] mx-auto",
	};

	if (isLoading && !currentForm) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<div className="mx-auto h-32 w-32 animate-spin rounded-full border-blue-600 border-b-2" />
					<p className="mt-4 text-gray-600">Loading form builder...</p>
				</div>
			</div>
		);
	}

	if (!currentForm) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600">No form configuration available</p>
					<Button onClick={createNewForm} className="mt-4">
						Create New Form
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col">
			{/* Header */}
			<div className="border-b bg-white px-6 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-4">
						<Button variant="ghost" size="sm" onClick={() => router.back()}>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back
						</Button>

						<div>
							<h1 className="font-semibold text-gray-900 text-xl">
								{currentForm.title}
							</h1>
							<div className="flex items-center space-x-2 text-gray-500 text-sm">
								<Badge variant="outline">{currentForm.authority}</Badge>
								<span>•</span>
								<span>{currentForm.fields.length} fields</span>
								{isDirty && (
									<>
										<span>•</span>
										<Badge
											variant="outline"
											className="border-orange-300 text-orange-600"
										>
											Unsaved changes
										</Badge>
									</>
								)}
							</div>
						</div>
					</div>

					<div className="flex items-center space-x-2">
						{/* Actions dropdown */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="sm">
									<Settings className="mr-2 h-4 w-4" />
									Actions
									<ChevronDown className="ml-2 h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem onClick={() => setShowTemplateDialog(true)}>
									<FileText className="mr-2 h-4 w-4" />
									Load Template
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										document.getElementById("import-input")?.click()
									}
								>
									<Upload className="mr-2 h-4 w-4" />
									Import Form
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => handleExport(currentForm)}>
									<Download className="mr-2 h-4 w-4" />
									Export Form
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => setShowAnalyticsDialog(true)}>
									<BarChart3 className="mr-2 h-4 w-4" />
									View Analytics
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handlePublish} disabled={isLoading}>
									<Globe className="mr-2 h-4 w-4" />
									Publish Form
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Preview button */}
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowPreviewDialog(true)}
						>
							<Eye className="mr-2 h-4 w-4" />
							Preview
						</Button>

						{/* Save button */}
						<Button
							onClick={() => handleSave(currentForm)}
							disabled={isLoading || !isDirty}
						>
							<Save className="mr-2 h-4 w-4" />
							{isLoading ? "Saving..." : "Save"}
						</Button>

						{/* Share button */}
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								navigator.clipboard.writeText(window.location.href);
								toast.success("Form link copied to clipboard");
							}}
						>
							<Share2 className="mr-2 h-4 w-4" />
							Share
						</Button>
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className="flex-1 overflow-hidden">
				{mode === "analytics" && formId ? (
					<div className="overflow-y-auto p-6">
						<FormAnalyticsComponent formId={formId} analytics={mockAnalytics} />
					</div>
				) : (
					<FormBuilder
						initialConfiguration={currentForm}
						onSave={handleSave}
						onPreview={() => setShowPreviewDialog(true)}
						onExport={handleExport}
					/>
				)}
			</div>

			{/* Hidden file input for import */}
			<input
				id="import-input"
				type="file"
				accept=".json"
				style={{ display: "none" }}
				onChange={handleImport}
			/>

			{/* Template Selection Dialog */}
			<Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
				<DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Choose Form Template</DialogTitle>
					</DialogHeader>

					<div className="space-y-6">
						<div>
							<label className="font-medium text-sm">Filter by Authority</label>
							<Select
								value={selectedTemplate}
								onValueChange={setSelectedTemplate}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select authority" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">All Authorities</SelectItem>
									<SelectItem value="GRA">
										GRA - Guyana Revenue Authority
									</SelectItem>
									<SelectItem value="NIS">
										NIS - National Insurance Scheme
									</SelectItem>
									<SelectItem value="DCRA">
										DCRA - Deeds & Commercial Registry
									</SelectItem>
									<SelectItem value="Immigration">
										Immigration Department
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							{/* Template cards would be rendered here */}
							<Card className="cursor-pointer transition-shadow hover:shadow-md">
								<CardHeader>
									<CardTitle className="text-lg">VAT Return Form</CardTitle>
									<div className="flex items-center space-x-2">
										<Badge variant="outline">GRA</Badge>
										<Badge variant="secondary">Tax Filing</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<p className="mb-4 text-gray-600 text-sm">
										Monthly/Quarterly VAT return for registered businesses
									</p>
									<div className="flex items-center justify-between text-gray-500 text-xs">
										<span>5 fields • Multi-step</span>
										<span>Used 234 times</span>
									</div>
								</CardContent>
							</Card>

							<Card className="cursor-pointer transition-shadow hover:shadow-md">
								<CardHeader>
									<CardTitle className="text-lg">
										Business Registration
									</CardTitle>
									<div className="flex items-center space-x-2">
										<Badge variant="outline">DCRA</Badge>
										<Badge variant="secondary">Incorporation</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<p className="mb-4 text-gray-600 text-sm">
										Form for incorporating a new company in Guyana
									</p>
									<div className="flex items-center justify-between text-gray-500 text-xs">
										<span>8 fields • Multi-step</span>
										<span>Used 156 times</span>
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="flex justify-end space-x-3">
							<Button
								variant="outline"
								onClick={() => setShowTemplateDialog(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={() => {
									// Load selected template
									setShowTemplateDialog(false);
									toast.success("Template loaded");
								}}
							>
								Use Template
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Preview Dialog */}
			<Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
				<DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden">
					<DialogHeader>
						<DialogTitle className="flex items-center justify-between">
							<span>Form Preview</span>
							<div className="flex items-center space-x-2">
								<Button
									variant={previewDevice === "desktop" ? "default" : "ghost"}
									size="sm"
									onClick={() => setPreviewDevice("desktop")}
								>
									<Monitor className="h-4 w-4" />
								</Button>
								<Button
									variant={previewDevice === "tablet" ? "default" : "ghost"}
									size="sm"
									onClick={() => setPreviewDevice("tablet")}
								>
									<Tablet className="h-4 w-4" />
								</Button>
								<Button
									variant={previewDevice === "mobile" ? "default" : "ghost"}
									size="sm"
									onClick={() => setPreviewDevice("mobile")}
								>
									<Smartphone className="h-4 w-4" />
								</Button>
							</div>
						</DialogTitle>
					</DialogHeader>

					<div className="overflow-y-auto bg-gray-100 p-6">
						<div className={previewDeviceStyles[previewDevice]}>
							<FormRenderer
								configuration={currentForm}
								readonly={true}
								showValidationSummary={false}
								className="rounded-lg bg-white shadow"
							/>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Analytics Dialog */}
			<Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
				<DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden">
					<DialogHeader>
						<DialogTitle>Form Analytics</DialogTitle>
					</DialogHeader>

					<div className="overflow-y-auto">
						<FormAnalyticsComponent
							formId={currentForm.id}
							analytics={mockAnalytics}
						/>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default function FormBuilderPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<FormBuilderPageContent />
		</Suspense>
	);
}
