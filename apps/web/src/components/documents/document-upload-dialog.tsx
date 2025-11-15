"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DocumentUploadDialog({ open, onOpenChange }: DocumentUploadDialogProps) {
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);

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

		setUploading(true);
		setProgress(0);

		try {
			// Simulate upload progress
			const interval = setInterval(() => {
				setProgress((prev) => {
					if (prev >= 90) {
						clearInterval(interval);
						return prev;
					}
					return prev + 10;
				});
			}, 200);

			// TODO: Implement actual file upload using tRPC documentUpload.createUploadUrl
			// This is a placeholder for the upload logic
			await new Promise((resolve) => setTimeout(resolve, 2000));

			clearInterval(interval);
			setProgress(100);

			toast.success("Document uploaded successfully");
			onOpenChange(false);
			setFile(null);
			setProgress(0);
		} catch (error) {
			toast.error("Failed to upload document");
			console.error(error);
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
						Select a file to upload. Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
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
							<p className="text-sm text-muted-foreground mt-2">
								Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
							</p>
						)}
					</div>

					{uploading && (
						<div className="space-y-2">
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div
									className="bg-blue-600 h-2 rounded-full transition-all duration-300"
									style={{ width: `${progress}%` }}
								/>
							</div>
							<p className="text-sm text-center text-muted-foreground">Uploading... {progress}%</p>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
						Cancel
					</Button>
					<Button onClick={handleUpload} disabled={!file || uploading}>
						<Upload className="h-4 w-4 mr-2" />
						Upload
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
