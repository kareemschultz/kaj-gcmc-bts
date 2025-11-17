"use client";

import * as React from "react";
import { Upload, File, X, FileText, Image, Video, Music, Archive, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface FileWithPreview extends File {
	preview?: string;
	id?: string;
}

interface FileUploadProps {
	onFilesChange: (files: FileWithPreview[]) => void;
	accept?: string;
	maxFiles?: number;
	maxSize?: number; // in bytes
	multiple?: boolean;
	disabled?: boolean;
	className?: string;
	children?: React.ReactNode;
	showPreview?: boolean;
	allowRemove?: boolean;
}

export function FileUpload({
	onFilesChange,
	accept,
	maxFiles = 10,
	maxSize = 10 * 1024 * 1024, // 10MB default
	multiple = true,
	disabled = false,
	className,
	children,
	showPreview = true,
	allowRemove = true,
}: FileUploadProps) {
	const [files, setFiles] = React.useState<FileWithPreview[]>([]);
	const [dragActive, setDragActive] = React.useState(false);
	const [errors, setErrors] = React.useState<string[]>([]);
	const inputRef = React.useRef<HTMLInputElement>(null);

	const handleDrag = React.useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	}, []);

	const validateFiles = React.useCallback((fileList: File[]): { validFiles: FileWithPreview[]; errors: string[] } => {
		const validFiles: FileWithPreview[] = [];
		const newErrors: string[] = [];

		for (const file of fileList) {
			// Check file size
			if (file.size > maxSize) {
				newErrors.push(`${file.name} is too large (max ${formatFileSize(maxSize)})`);
				continue;
			}

			// Check file count
			if (files.length + validFiles.length >= maxFiles) {
				newErrors.push(`Maximum ${maxFiles} files allowed`);
				break;
			}

			// Check file type if accept is specified
			if (accept) {
				const acceptedTypes = accept.split(',').map(type => type.trim());
				const isAccepted = acceptedTypes.some(type => {
					if (type.startsWith('.')) {
						return file.name.toLowerCase().endsWith(type.toLowerCase());
					}
					return file.type.match(type.replace('*', '.*'));
				});

				if (!isAccepted) {
					newErrors.push(`${file.name} is not an accepted file type`);
					continue;
				}
			}

			// Add preview for images
			const fileWithPreview: FileWithPreview = {
				...file,
				id: Math.random().toString(36).substr(2, 9),
			};

			if (file.type.startsWith('image/')) {
				fileWithPreview.preview = URL.createObjectURL(file);
			}

			validFiles.push(fileWithPreview);
		}

		return { validFiles, errors: newErrors };
	}, [files.length, maxFiles, maxSize, accept]);

	const handleDrop = React.useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (disabled) return;

		const droppedFiles = Array.from(e.dataTransfer.files);
		const { validFiles, errors } = validateFiles(droppedFiles);

		if (validFiles.length > 0) {
			const newFiles = multiple ? [...files, ...validFiles] : validFiles;
			setFiles(newFiles);
			onFilesChange(newFiles);
		}

		setErrors(errors);
	}, [disabled, files, multiple, onFilesChange, validateFiles]);

	const handleFileInput = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return;

		const selectedFiles = Array.from(e.target.files);
		const { validFiles, errors } = validateFiles(selectedFiles);

		if (validFiles.length > 0) {
			const newFiles = multiple ? [...files, ...validFiles] : validFiles;
			setFiles(newFiles);
			onFilesChange(newFiles);
		}

		setErrors(errors);
		e.target.value = ''; // Reset input
	}, [files, multiple, onFilesChange, validateFiles]);

	const removeFile = React.useCallback((fileToRemove: FileWithPreview) => {
		if (fileToRemove.preview) {
			URL.revokeObjectURL(fileToRemove.preview);
		}
		const newFiles = files.filter(file => file.id !== fileToRemove.id);
		setFiles(newFiles);
		onFilesChange(newFiles);
	}, [files, onFilesChange]);

	const openFileDialog = React.useCallback(() => {
		inputRef.current?.click();
	}, []);

	// Cleanup previews on unmount
	React.useEffect(() => {
		return () => {
			files.forEach(file => {
				if (file.preview) {
					URL.revokeObjectURL(file.preview);
				}
			});
		};
	}, []);

	return (
		<div className={cn("w-full", className)}>
			{/* Upload Area */}
			<Card
				className={cn(
					"relative border-2 border-dashed transition-colors",
					dragActive && "border-primary bg-primary/5",
					disabled && "opacity-50 cursor-not-allowed",
					!disabled && "cursor-pointer hover:border-primary/50"
				)}
				onDragEnter={handleDrag}
				onDragLeave={handleDrag}
				onDragOver={handleDrag}
				onDrop={handleDrop}
				onClick={!disabled ? openFileDialog : undefined}
			>
				<CardContent className="flex flex-col items-center justify-center p-6 text-center">
					<input
						ref={inputRef}
						type="file"
						accept={accept}
						multiple={multiple}
						onChange={handleFileInput}
						disabled={disabled}
						className="hidden"
					/>

					{children || (
						<>
							<Upload className="h-10 w-10 text-muted-foreground mb-4" />
							<div className="space-y-2">
								<p className="text-sm font-medium">
									Drop files here or click to browse
								</p>
								<p className="text-xs text-muted-foreground">
									{accept && `Accepted formats: ${accept}`}
									{maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
									{maxFiles > 1 && ` • Max files: ${maxFiles}`}
								</p>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Error Messages */}
			{errors.length > 0 && (
				<div className="mt-4 space-y-1">
					{errors.map((error, index) => (
						<div key={index} className="flex items-center gap-2 text-sm text-destructive">
							<AlertCircle className="h-4 w-4" />
							<span>{error}</span>
						</div>
					))}
				</div>
			)}

			{/* File Previews */}
			{showPreview && files.length > 0 && (
				<div className="mt-4">
					<h4 className="text-sm font-medium mb-2">
						Uploaded Files ({files.length})
					</h4>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{files.map((file) => (
							<FilePreview
								key={file.id}
								file={file}
								onRemove={allowRemove ? () => removeFile(file) : undefined}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

interface FilePreviewProps {
	file: FileWithPreview;
	onRemove?: () => void;
}

function FilePreview({ file, onRemove }: FilePreviewProps) {
	const isImage = file.type.startsWith('image/');
	const isVideo = file.type.startsWith('video/');
	const isAudio = file.type.startsWith('audio/');
	const isArchive = ['application/zip', 'application/x-rar-compressed', 'application/x-tar'].includes(file.type);

	const getFileIcon = () => {
		if (isImage) return Image;
		if (isVideo) return Video;
		if (isAudio) return Music;
		if (isArchive) return Archive;
		return FileText;
	};

	const FileIcon = getFileIcon();

	return (
		<Card className="relative">
			<CardContent className="p-3">
				<div className="flex items-start gap-3">
					{/* File Preview/Icon */}
					<div className="flex-shrink-0">
						{isImage && file.preview ? (
							<div className="relative h-12 w-12 overflow-hidden rounded-md">
								<img
									src={file.preview}
									alt={file.name}
									className="h-full w-full object-cover"
								/>
							</div>
						) : (
							<div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
								<FileIcon className="h-6 w-6 text-muted-foreground" />
							</div>
						)}
					</div>

					{/* File Info */}
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium" title={file.name}>
							{file.name}
						</p>
						<div className="flex items-center gap-2 mt-1">
							<Badge variant="secondary" className="text-xs">
								{formatFileSize(file.size)}
							</Badge>
							<Badge variant="outline" className="text-xs">
								{getFileExtension(file.name)}
							</Badge>
						</div>
					</div>

					{/* Remove Button */}
					{onRemove && (
						<Button
							size="sm"
							variant="ghost"
							className="h-6 w-6 p-0"
							onClick={(e) => {
								e.stopPropagation();
								onRemove();
							}}
						>
							<X className="h-4 w-4" />
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

// Utility functions
function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(filename: string): string {
	return filename.split('.').pop()?.toUpperCase() || '';
}