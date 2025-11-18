"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";

interface DocumentUploadDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	documentId?: number;
	onUploadComplete?: () => void;
}

export function DocumentUploadDialog({
	open,
	onOpenChange,
	documentId,
	onUploadComplete,
}: DocumentUploadDialogProps) {
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);

	// tRPC mutations
	const requestUploadUrlMutation =
		trpc.documentUpload.requestUploadUrl.useMutation();
	const completeUploadMutation =
		trpc.documentUpload.completeUpload.useMutation();

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			setFile(selectedFile);
		}
	};

	const handleUpload = async () => {
		if (!file) {
			toast.error("Please select a file to upload");
			return;
		}

		if (!documentId) {
			toast.error("Document ID is required for upload");
			return;
		}

		setUploading(true);
		setProgress(10);

		try {
			// Step 1: Request upload URL
			const uploadUrlResponse = await requestUploadUrlMutation.mutateAsync({
				documentId,
				fileName: file.name,
				fileType: file.type,
				fileSize: file.size,
			});

			setProgress(25);

			// Step 2: Upload file to presigned URL
			const formData = new FormData();
			formData.append("file", file);

			const uploadResponse = await fetch(uploadUrlResponse.uploadUrl, {
				method: "PUT",
				body: file,
				headers: {
					"Content-Type": file.type,
				},
			});

			if (!uploadResponse.ok) {
				throw new Error("Upload to storage failed");
			}

			setProgress(75);

			// Step 3: Complete the upload
			await completeUploadMutation.mutateAsync({
				documentId,
				fileKey: uploadUrlResponse.fileKey,
				fileSize: file.size,
				mimeType: file.type,
				metadata: {
					originalFileName: file.name,
					uploadedAt: new Date().toISOString(),
				},
			});

			setProgress(100);

			toast.success("Document uploaded successfully");
			onOpenChange(false);
			setFile(null);
			setProgress(0);

			// Call completion callback if provided
			onUploadComplete?.();
		} catch (error) {
			toast.error("Failed to upload document");
			console.error("Upload error:", error);
		} finally {
			setUploading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Upload Document</DialogTitle>
					<DialogDescription>
						Select a file to upload. Supported formats: PDF, DOC, DOCX, XLS,
						XLSX, JPG, PNG
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<Label htmlFor="file">File</Label>
						<Input
							id="file"
							type="file"
							onChange={handleFileChange}
							accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
							disabled={uploading}
						/>
						{file && (
							<p className="mt-2 text-muted-foreground text-sm">
								Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
								MB)
							</p>
						)}
					</div>

					{uploading && (
						<div className="space-y-2">
							<div className="h-2 w-full rounded-full bg-slate-200">
								<div
									className="h-2 rounded-full bg-blue-600 transition-all duration-300"
									style={{ width: `${progress}%` }}
								/>
							</div>
							<p className="text-center text-muted-foreground text-sm">
								Uploading... {progress}%
							</p>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={uploading}
					>
						Cancel
					</Button>
					<Button onClick={handleUpload} disabled={!file || uploading}>
						<Upload className="mr-2 h-4 w-4" />
						Upload
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
