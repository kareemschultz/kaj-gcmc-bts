import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Eye, File, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { brandColors } from "@/styles/brand";

interface DocumentFile {
	id: string;
	file: File;
	progress: number;
	status: "uploading" | "completed" | "error";
	url?: string;
	error?: string;
}

interface DocumentUploadProps {
	onUpload?: (files: File[]) => Promise<void>;
	onFileUploaded?: (file: DocumentFile) => void;
	acceptedTypes?: string[];
	maxSize?: number; // in MB
	multiple?: boolean;
	className?: string;
}

export function DocumentUpload({
	onUpload,
	onFileUploaded,
	acceptedTypes = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"],
	maxSize = 10,
	multiple = true,
	className,
}: DocumentUploadProps) {
	const [files, setFiles] = useState<DocumentFile[]>([]);
	const [isDragOver, setIsDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const validateFile = (file: File): string | null => {
		const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
		if (!acceptedTypes.includes(fileExtension)) {
			return `File type ${fileExtension} is not supported`;
		}
		if (file.size > maxSize * 1024 * 1024) {
			return `File size exceeds ${maxSize}MB limit`;
		}
		return null;
	};

	const processFiles = useCallback(
		async (fileList: FileList) => {
			const newFiles: DocumentFile[] = [];

			Array.from(fileList).forEach((file) => {
				const error = validateFile(file);
				if (error) {
					toast.error(error);
					return;
				}

				const documentFile: DocumentFile = {
					id: Math.random().toString(36).substr(2, 9),
					file,
					progress: 0,
					status: "uploading",
				};

				newFiles.push(documentFile);
			});

			if (newFiles.length === 0) return;

			setFiles((prev) => [...prev, ...newFiles]);

			// Simulate upload progress and call onUpload if provided
			for (const documentFile of newFiles) {
				try {
					// Simulate upload progress
					const progressInterval = setInterval(() => {
						setFiles((prev) =>
							prev.map((f) =>
								f.id === documentFile.id
									? {
											...f,
											progress: Math.min(f.progress + Math.random() * 30, 95),
										}
									: f,
							),
						);
					}, 200);

					// Call the actual upload function if provided
					if (onUpload) {
						await onUpload([documentFile.file]);
					}

					// Complete the upload
					clearInterval(progressInterval);
					setFiles((prev) =>
						prev.map((f) =>
							f.id === documentFile.id
								? {
										...f,
										progress: 100,
										status: "completed",
										url: URL.createObjectURL(f.file),
									}
								: f,
						),
					);

					if (onFileUploaded) {
						onFileUploaded({
							...documentFile,
							progress: 100,
							status: "completed",
							url: URL.createObjectURL(documentFile.file),
						});
					}

					toast.success(`${documentFile.file.name} uploaded successfully`);
				} catch (error) {
					setFiles((prev) =>
						prev.map((f) =>
							f.id === documentFile.id
								? { ...f, status: "error", error: "Upload failed" }
								: f,
						),
					);
					toast.error(`Failed to upload ${documentFile.file.name}`);
				}
			}
		},
		[onUpload, onFileUploaded, acceptedTypes, maxSize],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragOver(false);
			const files = e.dataTransfer.files;
			if (files.length > 0) {
				processFiles(files);
			}
		},
		[processFiles],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
	}, []);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (files && files.length > 0) {
				processFiles(files);
			}
		},
		[processFiles],
	);

	const removeFile = useCallback((id: string) => {
		setFiles((prev) => prev.filter((f) => f.id !== id));
	}, []);

	const openFileDialog = () => {
		fileInputRef.current?.click();
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Number.parseFloat((bytes / k ** i).toFixed(2)) + " " + sizes[i];
	};

	const getFileIcon = (fileName: string) => {
		const extension = fileName.split(".").pop()?.toLowerCase();
		if (["jpg", "jpeg", "png", "gif", "svg"].includes(extension || "")) {
			return "🖼️";
		}
		if (["pdf"].includes(extension || "")) {
			return "📄";
		}
		if (["doc", "docx"].includes(extension || "")) {
			return "📝";
		}
		return "📎";
	};

	return (
		<div className={cn("space-y-4", className)}>
			{/* Drop Zone */}
			<motion.div
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onClick={openFileDialog}
				className={cn(
					"relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-all duration-300",
					"hover:border-primary/50 hover:bg-primary/5",
					isDragOver
						? "scale-105 border-primary bg-primary/10"
						: "border-gray-300 bg-gray-50",
				)}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
			>
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex flex-col items-center gap-4"
				>
					<motion.div
						animate={{
							rotate: isDragOver ? 180 : 0,
							scale: isDragOver ? 1.2 : 1,
						}}
						transition={{ duration: 0.3 }}
						className={cn(
							"flex h-16 w-16 items-center justify-center rounded-full",
							"border border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5",
						)}
					>
						<Upload className="h-8 w-8 text-primary" />
					</motion.div>

					<div>
						<h3 className="mb-2 font-semibold text-gray-900 text-lg">
							{isDragOver ? "Drop files here" : "Upload Documents"}
						</h3>
						<p className="mb-2 text-gray-600">
							Drag and drop files here, or click to browse
						</p>
						<p className="text-gray-500 text-sm">
							Supports: {acceptedTypes.join(", ")} • Max size: {maxSize}MB
							{multiple && " • Multiple files allowed"}
						</p>
					</div>
				</motion.div>

				<input
					ref={fileInputRef}
					type="file"
					accept={acceptedTypes.join(",")}
					multiple={multiple}
					onChange={handleFileSelect}
					className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
				/>
			</motion.div>

			{/* File List */}
			<AnimatePresence mode="popLayout">
				{files.length > 0 && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="space-y-3"
					>
						<h4 className="flex items-center gap-2 font-semibold text-gray-900">
							<File className="h-5 w-5" />
							Uploaded Files ({files.length})
						</h4>

						{files.map((file, index) => (
							<motion.div
								key={file.id}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: 20 }}
								transition={{ delay: index * 0.1 }}
								className="rounded-lg border bg-white p-4 shadow-sm"
							>
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0">
										<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg">
											{getFileIcon(file.file.name)}
										</div>
									</div>

									<div className="min-w-0 flex-1">
										<div className="mb-2 flex items-center justify-between">
											<p className="truncate font-medium text-gray-900 text-sm">
												{file.file.name}
											</p>
											<div className="flex items-center gap-2">
												{file.status === "completed" && file.url && (
													<button
														onClick={() => window.open(file.url, "_blank")}
														className="p-1 text-gray-500 transition-colors hover:text-gray-700"
													>
														<Eye className="h-4 w-4" />
													</button>
												)}
												<button
													onClick={() => removeFile(file.id)}
													className="p-1 text-gray-500 transition-colors hover:text-red-500"
												>
													<X className="h-4 w-4" />
												</button>
											</div>
										</div>

										<div className="flex items-center justify-between text-gray-500 text-sm">
											<span>{formatFileSize(file.file.size)}</span>
											<div className="flex items-center gap-2">
												{file.status === "uploading" && (
													<>
														<motion.div
															className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent"
															animate={{ rotate: 360 }}
															transition={{
																duration: 1,
																repeat: Number.POSITIVE_INFINITY,
																ease: "linear",
															}}
														/>
														<span>{Math.round(file.progress)}%</span>
													</>
												)}
												{file.status === "completed" && (
													<div className="flex items-center gap-1 text-green-600">
														<Check className="h-4 w-4" />
														<span>Complete</span>
													</div>
												)}
												{file.status === "error" && (
													<div className="flex items-center gap-1 text-red-600">
														<AlertCircle className="h-4 w-4" />
														<span>Error</span>
													</div>
												)}
											</div>
										</div>

										{/* Progress Bar */}
										{file.status === "uploading" && (
											<div className="mt-2">
												<div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
													<motion.div
														className="h-full bg-gradient-to-r from-primary/80 to-primary"
														initial={{ width: 0 }}
														animate={{ width: `${file.progress}%` }}
														transition={{ duration: 0.3, ease: "easeOut" }}
													/>
												</div>
											</div>
										)}

										{file.error && (
											<p className="mt-2 text-red-600 text-sm">{file.error}</p>
										)}
									</div>
								</div>
							</motion.div>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// Quick upload button for simple use cases
export function QuickDocumentUpload({
	onUpload,
	label = "Upload Document",
	variant = "primary",
}: {
	onUpload?: (file: File) => Promise<void>;
	label?: string;
	variant?: "primary" | "secondary" | "outline";
}) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !onUpload) return;

		setUploading(true);
		try {
			await onUpload(file);
			toast.success(`${file.name} uploaded successfully`);
		} catch (error) {
			toast.error("Upload failed");
		} finally {
			setUploading(false);
		}
	};

	const variantStyles = {
		primary: "bg-primary text-white hover:bg-primary/90",
		secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
		outline:
			"border border-input bg-background hover:bg-accent hover:text-accent-foreground",
	};

	return (
		<>
			<motion.button
				onClick={() => fileInputRef.current?.click()}
				disabled={uploading}
				className={cn(
					"inline-flex items-center gap-2 rounded-md px-4 py-2 font-medium transition-colors",
					"disabled:cursor-not-allowed disabled:opacity-50",
					variantStyles[variant],
				)}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
			>
				{uploading ? (
					<motion.div
						className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
						animate={{ rotate: 360 }}
						transition={{
							duration: 1,
							repeat: Number.POSITIVE_INFINITY,
							ease: "linear",
						}}
					/>
				) : (
					<Upload className="h-4 w-4" />
				)}
				{uploading ? "Uploading..." : label}
			</motion.button>

			<input
				ref={fileInputRef}
				type="file"
				accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
				onChange={handleFileSelect}
				className="hidden"
			/>
		</>
	);
}
