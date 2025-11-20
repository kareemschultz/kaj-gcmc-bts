"use client";

import {
	CheckCircle,
	FileText,
	FolderOpen,
	Shield,
	Upload,
	Users,
} from "lucide-react";
import React, { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	useStepData,
	WizardProvider,
	type WizardStep,
} from "@/lib/wizard/wizard-context";
import { WizardLayout } from "./wizard-layout";

// Validation schemas
const documentTypeSchema = z.object({
	category: z.enum([
		"tax_documents",
		"business_registration",
		"financial_statements",
		"compliance_certificates",
		"legal_documents",
		"other",
	]),
	subcategory: z.string().optional(),
	description: z.string().min(1, "Document description is required"),
	isConfidential: z.boolean().default(false),
	retentionPeriod: z
		.enum(["1_year", "3_years", "7_years", "permanent"])
		.default("7_years"),
});

const documentUploadSchema = z.object({
	files: z.array(z.string()).min(1, "At least one file must be uploaded"),
	tags: z.array(z.string()).optional(),
	notes: z.string().optional(),
});

const metadataSchema = z.object({
	documentDate: z.string().optional(),
	expiryDate: z.string().optional(),
	relatedClient: z.string().optional(),
	relatedMatter: z.string().optional(),
	authorizedViewers: z.array(z.string()).optional(),
	customFields: z.record(z.string()).optional(),
});

const reviewSchema = z.object({
	confirmAccuracy: z
		.boolean()
		.refine((val) => val, "Please confirm document accuracy"),
	confirmCompliance: z
		.boolean()
		.refine((val) => val, "Please confirm compliance"),
	notifyClient: z.boolean().default(true),
});

// Step 1: Document Type and Category
function DocumentTypeStep() {
	const [data, setData] = useStepData("document-type");

	const handleChange = (field: string, value: string | boolean) => {
		setData({ ...data, [field]: value });
	};

	const categoryOptions = [
		{
			value: "tax_documents",
			label: "Tax Documents",
			description: "Tax returns, assessments, correspondence",
			subcategories: [
				"Income Tax Returns",
				"VAT Returns",
				"Withholding Tax",
				"Tax Assessments",
				"GRA Correspondence",
			],
		},
		{
			value: "business_registration",
			label: "Business Registration",
			description: "Incorporation documents, licenses",
			subcategories: [
				"Certificate of Incorporation",
				"Business License",
				"Trade License",
				"Professional License",
			],
		},
		{
			value: "financial_statements",
			label: "Financial Statements",
			description: "Audited accounts, management reports",
			subcategories: [
				"Audited Financial Statements",
				"Management Accounts",
				"Bank Statements",
				"Trial Balance",
			],
		},
		{
			value: "compliance_certificates",
			label: "Compliance Certificates",
			description: "Regulatory compliance documents",
			subcategories: [
				"NIS Compliance",
				"EPA Permits",
				"Health Certificates",
				"Safety Certificates",
			],
		},
		{
			value: "legal_documents",
			label: "Legal Documents",
			description: "Contracts, agreements, legal notices",
			subcategories: [
				"Contracts",
				"Agreements",
				"Legal Notices",
				"Court Documents",
			],
		},
		{
			value: "other",
			label: "Other Documents",
			description: "Miscellaneous business documents",
			subcategories: ["Correspondence", "Reports", "Presentations", "Other"],
		},
	];

	const selectedCategory = categoryOptions.find(
		(cat) => cat.value === data.category,
	);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FolderOpen className="h-5 w-5" />
						Document Category
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div>
							<Label>Document Category</Label>
							<Select
								value={data.category || ""}
								onValueChange={(value) => handleChange("category", value)}
							>
								<SelectTrigger className="mt-2">
									<SelectValue placeholder="Select document category" />
								</SelectTrigger>
								<SelectContent>
									{categoryOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											<div>
												<div className="font-medium">{option.label}</div>
												<div className="text-gray-600 text-sm">
													{option.description}
												</div>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{selectedCategory && (
							<div>
								<Label>Document Subcategory</Label>
								<Select
									value={data.subcategory || ""}
									onValueChange={(value) => handleChange("subcategory", value)}
								>
									<SelectTrigger className="mt-2">
										<SelectValue placeholder="Select document subcategory" />
									</SelectTrigger>
									<SelectContent>
										{selectedCategory.subcategories.map((subcat) => (
											<SelectItem key={subcat} value={subcat}>
												{subcat}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						<div>
							<Label htmlFor="description">Document Description</Label>
							<Textarea
								id="description"
								placeholder="Provide a detailed description of the document(s)"
								value={data.description || ""}
								onChange={(e) => handleChange("description", e.target.value)}
								className="mt-2"
								rows={3}
							/>
						</div>

						<div className="space-y-4">
							<div className="flex items-start space-x-3">
								<Checkbox
									checked={data.isConfidential || false}
									onCheckedChange={(checked) =>
										handleChange("isConfidential", checked)
									}
								/>
								<div>
									<Label>Confidential Document</Label>
									<p className="mt-1 text-gray-600 text-sm">
										Mark as confidential for restricted access
									</p>
								</div>
							</div>

							<div>
								<Label>Retention Period</Label>
								<Select
									value={data.retentionPeriod || "7_years"}
									onValueChange={(value) =>
										handleChange("retentionPeriod", value)
									}
								>
									<SelectTrigger className="mt-2">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="1_year">1 Year</SelectItem>
										<SelectItem value="3_years">3 Years</SelectItem>
										<SelectItem value="7_years">
											7 Years (Recommended)
										</SelectItem>
										<SelectItem value="permanent">Permanent</SelectItem>
									</SelectContent>
								</Select>
								<p className="mt-1 text-gray-600 text-sm">
									Legal requirement for tax documents is 7 years
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Step 2: Upload Documents
function DocumentUploadStep() {
	const [data, setData] = useStepData("document-upload");
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
	const [tags, setTags] = useState<string[]>(data.tags || []);
	const [newTag, setNewTag] = useState("");

	const handleFileUpload = (files: File[]) => {
		setUploadedFiles(files);
		setData({
			...data,
			files: files.map((f) => f.name),
		});
	};

	const addTag = () => {
		if (newTag.trim() && !tags.includes(newTag.trim())) {
			const updatedTags = [...tags, newTag.trim()];
			setTags(updatedTags);
			setData({ ...data, tags: updatedTags });
			setNewTag("");
		}
	};

	const removeTag = (tagToRemove: string) => {
		const updatedTags = tags.filter((tag) => tag !== tagToRemove);
		setTags(updatedTags);
		setData({ ...data, tags: updatedTags });
	};

	const handleNotesChange = (notes: string) => {
		setData({ ...data, notes });
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Upload className="h-5 w-5" />
						Upload Documents
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						{/* File Upload Area */}
						<div className="rounded-lg border-2 border-gray-300 border-dashed p-8 text-center transition-colors hover:border-gray-400">
							<Upload className="mx-auto h-16 w-16 text-gray-400" />
							<div className="mt-4">
								<Label
									htmlFor="file-upload"
									className="inline-flex cursor-pointer items-center rounded-md border border-transparent bg-blue-600 px-6 py-3 font-medium text-base text-white hover:bg-blue-700"
								>
									Choose Files
								</Label>
								<Input
									id="file-upload"
									type="file"
									multiple
									accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
									className="hidden"
									onChange={(e) => {
										const files = Array.from(e.target.files || []);
										handleFileUpload(files);
									}}
								/>
								<p className="mt-2 text-gray-500 text-sm">
									Drag and drop files here, or click to select
								</p>
								<p className="mt-1 text-gray-400 text-xs">
									Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (max
									50MB each)
								</p>
							</div>
						</div>

						{/* Uploaded Files List */}
						{uploadedFiles.length > 0 && (
							<Card className="border border-green-200 bg-green-50">
								<CardHeader className="pb-3">
									<CardTitle className="text-base text-green-900">
										Uploaded Files
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-0">
									<ul className="space-y-2">
										{uploadedFiles.map((file, index) => (
											<li
												key={index}
												className="flex items-center gap-3 text-sm"
											>
												<FileText className="h-4 w-4 text-green-600" />
												<span className="flex-1">{file.name}</span>
												<span className="text-gray-600">
													{(file.size / 1024 / 1024).toFixed(2)} MB
												</span>
												<CheckCircle className="h-4 w-4 text-green-600" />
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						)}

						{/* Tags */}
						<div>
							<Label>Tags (Optional)</Label>
							<div className="mt-2 space-y-2">
								<div className="flex gap-2">
									<Input
										placeholder="Add a tag..."
										value={newTag}
										onChange={(e) => setNewTag(e.target.value)}
										onKeyPress={(e) => e.key === "Enter" && addTag()}
									/>
									<Button onClick={addTag} disabled={!newTag.trim()}>
										Add
									</Button>
								</div>
								{tags.length > 0 && (
									<div className="flex flex-wrap gap-2">
										{tags.map((tag) => (
											<span
												key={tag}
												className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-blue-800 text-sm"
											>
												{tag}
												<button
													onClick={() => removeTag(tag)}
													className="text-blue-600 hover:text-blue-800"
												>
													×
												</button>
											</span>
										))}
									</div>
								)}
							</div>
							<p className="mt-1 text-gray-600 text-sm">
								Tags help organize and find documents later
							</p>
						</div>

						{/* Notes */}
						<div>
							<Label htmlFor="notes">Additional Notes (Optional)</Label>
							<Textarea
								id="notes"
								placeholder="Any additional information about these documents..."
								value={data.notes || ""}
								onChange={(e) => handleNotesChange(e.target.value)}
								className="mt-2"
								rows={3}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Step 3: Document Metadata
function MetadataStep() {
	const [data, setData] = useStepData("metadata");

	const handleChange = (field: string, value: string | string[]) => {
		setData({ ...data, [field]: value });
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Document Metadata
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<Label htmlFor="documentDate">Document Date</Label>
							<Input
								id="documentDate"
								type="date"
								value={data.documentDate || ""}
								onChange={(e) => handleChange("documentDate", e.target.value)}
								className="mt-2"
							/>
							<p className="mt-1 text-gray-600 text-sm">
								The date when the document was created or issued
							</p>
						</div>

						<div>
							<Label htmlFor="expiryDate">Expiry Date (if applicable)</Label>
							<Input
								id="expiryDate"
								type="date"
								value={data.expiryDate || ""}
								onChange={(e) => handleChange("expiryDate", e.target.value)}
								className="mt-2"
							/>
							<p className="mt-1 text-gray-600 text-sm">
								For licenses, certificates, or time-sensitive documents
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<Label htmlFor="relatedClient">Related Client</Label>
							<Select
								value={data.relatedClient || ""}
								onValueChange={(value) => handleChange("relatedClient", value)}
							>
								<SelectTrigger className="mt-2">
									<SelectValue placeholder="Select client (optional)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="client_001">ACME Corporation</SelectItem>
									<SelectItem value="client_002">TechStart LLC</SelectItem>
									<SelectItem value="client_003">Green Energy Ltd</SelectItem>
									<SelectItem value="general">General/Internal</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label htmlFor="relatedMatter">Related Matter/Case</Label>
							<Input
								id="relatedMatter"
								placeholder="e.g., 2024 Tax Filing, License Renewal"
								value={data.relatedMatter || ""}
								onChange={(e) => handleChange("relatedMatter", e.target.value)}
								className="mt-2"
							/>
						</div>
					</div>

					<div>
						<Label>Authorized Viewers</Label>
						<div className="mt-2 space-y-2">
							<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
								{[
									"All Team Members",
									"Compliance Team Only",
									"Management Only",
									"Client Access Allowed",
									"Restricted Access",
								].map((option) => (
									<div key={option} className="flex items-center space-x-2">
										<Checkbox
											checked={
												data.authorizedViewers?.includes(option) || false
											}
											onCheckedChange={(checked) => {
												const current = data.authorizedViewers || [];
												if (checked) {
													handleChange("authorizedViewers", [
														...current,
														option,
													]);
												} else {
													handleChange(
														"authorizedViewers",
														current.filter((v) => v !== option),
													);
												}
											}}
										/>
										<Label className="text-sm">{option}</Label>
									</div>
								))}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Step 4: Review and Submit
function ReviewStep() {
	const [data, setData] = useStepData("review");
	const [typeData] = useStepData("document-type");
	const [uploadData] = useStepData("document-upload");
	const [metaData] = useStepData("metadata");

	const handleChange = (field: string, value: boolean) => {
		setData({ ...data, [field]: value });
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Document Summary
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<h4 className="mb-2 font-medium">Document Information</h4>
						<div className="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span className="text-gray-600">Category:</span>{" "}
								{typeData.category?.replace("_", " ")}
							</div>
							<div>
								<span className="text-gray-600">Subcategory:</span>{" "}
								{typeData.subcategory}
							</div>
							<div>
								<span className="text-gray-600">Confidential:</span>{" "}
								{typeData.isConfidential ? "Yes" : "No"}
							</div>
							<div>
								<span className="text-gray-600">Retention:</span>{" "}
								{typeData.retentionPeriod?.replace("_", " ")}
							</div>
						</div>
						<div className="mt-2">
							<span className="text-gray-600">Description:</span>{" "}
							{typeData.description}
						</div>
					</div>

					<div>
						<h4 className="mb-2 font-medium">Uploaded Files</h4>
						<ul className="space-y-1">
							{uploadData.files?.map((file: string, index: number) => (
								<li key={index} className="flex items-center gap-2 text-sm">
									<FileText className="h-4 w-4 text-gray-500" />
									{file}
								</li>
							))}
						</ul>
						{uploadData.tags?.length > 0 && (
							<div className="mt-2">
								<span className="text-gray-600 text-sm">Tags:</span>
								<div className="mt-1 flex flex-wrap gap-1">
									{uploadData.tags.map((tag: string) => (
										<span
											key={tag}
											className="rounded bg-blue-100 px-2 py-1 text-blue-800 text-xs"
										>
											{tag}
										</span>
									))}
								</div>
							</div>
						)}
					</div>

					{(metaData.documentDate || metaData.relatedClient) && (
						<div>
							<h4 className="mb-2 font-medium">Metadata</h4>
							<div className="grid grid-cols-2 gap-4 text-sm">
								{metaData.documentDate && (
									<div>
										<span className="text-gray-600">Document Date:</span>{" "}
										{metaData.documentDate}
									</div>
								)}
								{metaData.expiryDate && (
									<div>
										<span className="text-gray-600">Expiry Date:</span>{" "}
										{metaData.expiryDate}
									</div>
								)}
								{metaData.relatedClient && (
									<div>
										<span className="text-gray-600">Client:</span>{" "}
										{metaData.relatedClient}
									</div>
								)}
								{metaData.relatedMatter && (
									<div>
										<span className="text-gray-600">Matter:</span>{" "}
										{metaData.relatedMatter}
									</div>
								)}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Confirmation</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-start space-x-3">
						<Checkbox
							checked={data.confirmAccuracy || false}
							onCheckedChange={(checked) =>
								handleChange("confirmAccuracy", checked as boolean)
							}
						/>
						<div>
							<Label>I confirm the accuracy of the document information</Label>
							<p className="mt-1 text-gray-600 text-sm">
								All information provided is accurate and complete
							</p>
						</div>
					</div>

					<div className="flex items-start space-x-3">
						<Checkbox
							checked={data.confirmCompliance || false}
							onCheckedChange={(checked) =>
								handleChange("confirmCompliance", checked as boolean)
							}
						/>
						<div>
							<Label>
								I confirm compliance with document retention policies
							</Label>
							<p className="mt-1 text-gray-600 text-sm">
								Documents comply with regulatory and company retention
								requirements
							</p>
						</div>
					</div>

					<div className="flex items-start space-x-3">
						<Checkbox
							checked={data.notifyClient || false}
							onCheckedChange={(checked) =>
								handleChange("notifyClient", checked as boolean)
							}
						/>
						<div>
							<Label>Notify client of document upload (if applicable)</Label>
							<p className="mt-1 text-gray-600 text-sm">
								Send notification email to the client about these documents
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

const wizardSteps: WizardStep[] = [
	{
		id: "document-type",
		title: "Document Type",
		description: "Categorize your documents",
		icon: <FolderOpen className="h-6 w-6" />,
		validation: documentTypeSchema,
		component: DocumentTypeStep,
	},
	{
		id: "document-upload",
		title: "Upload Files",
		description: "Upload and tag documents",
		icon: <Upload className="h-6 w-6" />,
		validation: documentUploadSchema,
		component: DocumentUploadStep,
	},
	{
		id: "metadata",
		title: "Metadata",
		description: "Add document details",
		icon: <FileText className="h-6 w-6" />,
		validation: metadataSchema,
		component: MetadataStep,
		canSkip: true,
	},
	{
		id: "review",
		title: "Review",
		description: "Confirm and submit",
		icon: <CheckCircle className="h-6 w-6" />,
		validation: reviewSchema,
		component: ReviewStep,
	},
];

interface DocumentUploadWizardProps {
	onComplete?: (data: any) => Promise<void>;
	onExit?: () => void;
}

export function DocumentUploadWizard({
	onComplete,
	onExit,
}: DocumentUploadWizardProps) {
	const handleSave = async (data: any, sessionId: string) => {
		localStorage.setItem(`doc-wizard-${sessionId}`, JSON.stringify(data));
	};

	const handleLoad = async (sessionId: string) => {
		const saved = localStorage.getItem(`doc-wizard-${sessionId}`);
		return saved ? JSON.parse(saved) : null;
	};

	return (
		<WizardProvider
			steps={wizardSteps}
			onComplete={onComplete}
			onSave={handleSave}
			onLoad={handleLoad}
		>
			<WizardLayout
				title="Document Upload"
				subtitle="Secure document management for GCMC-KAJ clients"
				onExit={onExit}
			>
				<DocumentUploadWizardContent />
			</WizardLayout>
		</WizardProvider>
	);
}

function DocumentUploadWizardContent() {
	const { currentStep } = useWizard();
	const StepComponent = currentStep.component;
	return <StepComponent />;
}
