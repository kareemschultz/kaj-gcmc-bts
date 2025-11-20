"use client";

import {
	AlertCircle,
	CheckCircle,
	FileIcon,
	Loader2,
	Upload,
	X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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

interface UploadedFile {
	file: File;
	id: string;
	progress: number;
	status: "pending" | "uploading" | "completed" | "error";
	category: string;
	description: string;
	tags: string[];
}

interface DocumentUploadProps {
	onUploadComplete: (files: UploadedFile[]) => void;
}

const documentCategories = [
	"Tax Documents",
	"Legal Documents",
	"Financial",
	"Insurance",
	"HR Documents",
	"Compliance",
	"Other",
];

const maxFileSize = 10 * 1024 * 1024; // 10MB
const acceptedFileTypes = {
	"application/pdf": [".pdf"],
	"application/msword": [".doc"],
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
		".docx",
	],
	"application/vnd.ms-excel": [".xls"],
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
		".xlsx",
	],
	"image/jpeg": [".jpg", ".jpeg"],
	"image/png": [".png"],
};

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
	const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
	const [isUploading, setIsUploading] = useState(false);

	const onDrop = useCallback((acceptedFiles: File[]) => {
		const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
			file,
			id: Math.random().toString(36).substring(7),
			progress: 0,
			status: "pending",
			category: "Other",
			description: "",
			tags: [],
		}));

		setUploadedFiles((prev) => [...prev, ...newFiles]);
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: acceptedFileTypes,
		maxSize: maxFileSize,
		multiple: true,
	});

	const updateFile = (id: string, updates: Partial<UploadedFile>) => {
		setUploadedFiles((prev) =>
			prev.map((file) => (file.id === id ? { ...file, ...updates } : file)),
		);
	};

	const removeFile = (id: string) => {
		setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
	};

	const simulateUpload = async (file: UploadedFile) => {
		updateFile(file.id, { status: "uploading", progress: 0 });

		// Simulate upload progress
		for (let progress = 0; progress <= 100; progress += 10) {
			await new Promise((resolve) => setTimeout(resolve, 100));
			updateFile(file.id, { progress });
		}

		// Simulate processing delay
		await new Promise((resolve) => setTimeout(resolve, 500));
		updateFile(file.id, { status: "completed" });
	};

	const handleUpload = async () => {
		if (uploadedFiles.length === 0) return;

		setIsUploading(true);

		try {
			// Upload files one by one
			for (const file of uploadedFiles) {
				if (file.status === "pending") {
					await simulateUpload(file);
				}
			}

			// Call completion handler
			onUploadComplete(uploadedFiles);
		} catch (error) {
			console.error("Upload failed:", error);
		} finally {
			setIsUploading(false);
		}
	};

	const canUpload =
		uploadedFiles.length > 0 &&
		uploadedFiles.every(
			(file) =>
				file.category && file.category !== "" && file.status !== "uploading",
		);

	const getFileIcon = (fileName: string) => {
		const extension = fileName.split(".").pop()?.toLowerCase();
		const iconClass = "h-8 w-8";

		switch (extension) {
			case "pdf":
				return (
					<div
						className={`${iconClass} flex items-center justify-center rounded-lg bg-red-100`}
					>
						<FileIcon className="h-4 w-4 text-red-600" />
					</div>
				);
			case "xls":
			case "xlsx":
				return (
					<div
						className={`${iconClass} flex items-center justify-center rounded-lg bg-green-100`}
					>
						<FileIcon className="h-4 w-4 text-green-600" />
					</div>
				);
			case "doc":
			case "docx":
				return (
					<div
						className={`${iconClass} flex items-center justify-center rounded-lg bg-blue-100`}
					>
						<FileIcon className="h-4 w-4 text-blue-600" />
					</div>
				);
			case "jpg":
			case "jpeg":
			case "png":
				return (
					<div
						className={`${iconClass} flex items-center justify-center rounded-lg bg-purple-100`}
					>
						<FileIcon className="h-4 w-4 text-purple-600" />
					</div>
				);
			default:
				return (
					<div
						className={`${iconClass} flex items-center justify-center rounded-lg bg-gray-100`}
					>
						<FileIcon className="h-4 w-4 text-gray-600" />
					</div>
				);
		}
	};

	return (
		<div className="space-y-6">
			{/* Upload Zone */}
			<Card>
				<CardContent className="p-6">
					<div
						{...getRootProps()}
						className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
							isDragActive
								? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
								: "border-gray-300 hover:border-gray-400"
						}`}
					>
						<input {...getInputProps()} />
						<Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
						{isDragActive ? (
							<div>
								<p className="font-medium text-blue-600">Drop files here...</p>
								<p className="text-muted-foreground text-sm">
									Release to upload your documents
								</p>
							</div>
						) : (
							<div>
								<p className="font-medium">
									Drag & drop files here, or click to select
								</p>
								<p className="text-muted-foreground text-sm">
									Supports: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (max 10MB each)
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* File List */}
			{uploadedFiles.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center justify-between">
							<span>Uploaded Files ({uploadedFiles.length})</span>
							<Button
								onClick={handleUpload}
								disabled={!canUpload || isUploading}
								size="sm"
							>
								{isUploading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Uploading...
									</>
								) : (
									<>
										<Upload className="mr-2 h-4 w-4" />
										Upload All
									</>
								)}
							</Button>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{uploadedFiles.map((uploadedFile) => (
							<Card key={uploadedFile.id} className="p-4">
								<div className="space-y-4">
									{/* File Info Header */}
									<div className="flex items-start justify-between">
										<div className="flex items-center space-x-3">
											{getFileIcon(uploadedFile.file.name)}
											<div>
												<p className="font-medium text-sm">
													{uploadedFile.file.name}
												</p>
												<p className="text-muted-foreground text-xs">
													{(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB
												</p>
											</div>
										</div>
										<div className="flex items-center space-x-2">
											{uploadedFile.status === "completed" && (
												<CheckCircle className="h-5 w-5 text-green-600" />
											)}
											{uploadedFile.status === "error" && (
												<AlertCircle className="h-5 w-5 text-red-600" />
											)}
											{uploadedFile.status === "uploading" && (
												<Loader2 className="h-5 w-5 animate-spin text-blue-600" />
											)}
											<Button
												variant="ghost"
												size="icon"
												onClick={() => removeFile(uploadedFile.id)}
												disabled={uploadedFile.status === "uploading"}
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									</div>

									{/* Upload Progress */}
									{uploadedFile.status === "uploading" && (
										<div className="space-y-2">
											<div className="flex justify-between text-sm">
												<span>Uploading...</span>
												<span>{uploadedFile.progress}%</span>
											</div>
											<Progress value={uploadedFile.progress} className="h-2" />
										</div>
									)}

									{/* File Details Form */}
									{uploadedFile.status !== "uploading" && (
										<div className="grid gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<Label htmlFor={`category-${uploadedFile.id}`}>
													Category *
												</Label>
												<Select
													value={uploadedFile.category}
													onValueChange={(value) =>
														updateFile(uploadedFile.id, { category: value })
													}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select category" />
													</SelectTrigger>
													<SelectContent>
														{documentCategories.map((category) => (
															<SelectItem key={category} value={category}>
																{category}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											<div className="space-y-2">
												<Label htmlFor={`tags-${uploadedFile.id}`}>
													Tags (optional)
												</Label>
												<Input
													id={`tags-${uploadedFile.id}`}
													placeholder="Enter tags separated by commas"
													value={uploadedFile.tags.join(", ")}
													onChange={(e) =>
														updateFile(uploadedFile.id, {
															tags: e.target.value
																.split(",")
																.map((tag) => tag.trim())
																.filter(Boolean),
														})
													}
												/>
											</div>

											<div className="space-y-2 md:col-span-2">
												<Label htmlFor={`description-${uploadedFile.id}`}>
													Description (optional)
												</Label>
												<Textarea
													id={`description-${uploadedFile.id}`}
													placeholder="Describe this document..."
													value={uploadedFile.description}
													onChange={(e) =>
														updateFile(uploadedFile.id, {
															description: e.target.value,
														})
													}
													rows={2}
												/>
											</div>
										</div>
									)}

									{/* Status Badge */}
									<div className="flex items-center justify-between">
										<Badge
											variant={
												uploadedFile.status === "completed"
													? "default"
													: uploadedFile.status === "error"
														? "destructive"
														: uploadedFile.status === "uploading"
															? "secondary"
															: "outline"
											}
										>
											{uploadedFile.status === "completed" && "Upload Complete"}
											{uploadedFile.status === "error" && "Upload Failed"}
											{uploadedFile.status === "uploading" && "Uploading..."}
											{uploadedFile.status === "pending" && "Ready to Upload"}
										</Badge>

										{uploadedFile.tags.length > 0 && (
											<div className="flex flex-wrap gap-1">
												{uploadedFile.tags.slice(0, 3).map((tag) => (
													<Badge
														key={tag}
														variant="outline"
														className="text-xs"
													>
														{tag}
													</Badge>
												))}
												{uploadedFile.tags.length > 3 && (
													<Badge variant="outline" className="text-xs">
														+{uploadedFile.tags.length - 3}
													</Badge>
												)}
											</div>
										)}
									</div>
								</div>
							</Card>
						))}
					</CardContent>
				</Card>
			)}

			{/* Upload Tips */}
			<Card className="bg-blue-50 dark:bg-blue-950/20">
				<CardContent className="p-6">
					<h3 className="mb-3 font-semibold text-blue-900 dark:text-blue-100">
						Upload Tips
					</h3>
					<ul className="space-y-2 text-blue-800 text-sm dark:text-blue-200">
						<li>• Ensure all documents are clear and legible</li>
						<li>• Use descriptive file names for easier organization</li>
						<li>• Add relevant tags to improve searchability</li>
						<li>• Select the correct category for faster processing</li>
						<li>• Maximum file size is 10MB per document</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
