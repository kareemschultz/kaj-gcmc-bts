"use client";

import {
	Download,
	Eye,
	FileIcon,
	Filter,
	Grid3X3,
	List,
	MoreHorizontal,
	Plus,
	Search,
	Share,
	Trash2,
	Upload,
} from "lucide-react";
import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUpload } from "./document-upload";

interface User {
	name?: string;
	email?: string;
	image?: string;
}

interface Document {
	id: number;
	name: string;
	type: string;
	category: string;
	size: string;
	uploadedAt: string;
	status: "pending" | "approved" | "rejected" | "processing";
	tags: string[];
	description?: string;
}

interface ClientDocumentsProps {
	user: User;
}

// Mock document data
const mockDocuments: Document[] = [
	{
		id: 1,
		name: "Tax Certificate 2024.pdf",
		type: "PDF",
		category: "Tax Documents",
		size: "2.3 MB",
		uploadedAt: "2024-11-19",
		status: "approved",
		tags: ["tax", "certificate", "2024"],
		description: "Annual tax certificate for business operations",
	},
	{
		id: 2,
		name: "Business License.pdf",
		type: "PDF",
		category: "Legal Documents",
		size: "1.8 MB",
		uploadedAt: "2024-11-18",
		status: "pending",
		tags: ["license", "business", "legal"],
		description: "Business operating license renewal application",
	},
	{
		id: 3,
		name: "Financial Statement Q3.xlsx",
		type: "Excel",
		category: "Financial",
		size: "4.2 MB",
		uploadedAt: "2024-11-17",
		status: "approved",
		tags: ["financial", "quarterly", "statements"],
		description: "Third quarter financial statements",
	},
	{
		id: 4,
		name: "Insurance Policy.pdf",
		type: "PDF",
		category: "Insurance",
		size: "1.5 MB",
		uploadedAt: "2024-11-16",
		status: "processing",
		tags: ["insurance", "policy"],
		description: "Business insurance policy documentation",
	},
	{
		id: 5,
		name: "Contract Agreement.docx",
		type: "Word",
		category: "Legal Documents",
		size: "890 KB",
		uploadedAt: "2024-11-15",
		status: "rejected",
		tags: ["contract", "agreement"],
		description: "Service provider contract agreement",
	},
	{
		id: 6,
		name: "Employee Records.xlsx",
		type: "Excel",
		category: "HR Documents",
		size: "3.1 MB",
		uploadedAt: "2024-11-14",
		status: "approved",
		tags: ["hr", "employees", "records"],
		description: "Employee information and records",
	},
];

const categories = [
	"All Documents",
	"Tax Documents",
	"Legal Documents",
	"Financial",
	"Insurance",
	"HR Documents",
];

const statusColors = {
	approved: "bg-green-100 text-green-800 border-green-200",
	pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
	rejected: "bg-red-100 text-red-800 border-red-200",
	processing: "bg-blue-100 text-blue-800 border-blue-200",
};

export function ClientDocuments({ user }: ClientDocumentsProps) {
	const [documents, setDocuments] = useState<Document[]>(mockDocuments);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All Documents");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

	// Filter documents based on search term and category
	const filteredDocuments = documents.filter((doc) => {
		const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

		const matchesCategory = selectedCategory === "All Documents" || doc.category === selectedCategory;

		return matchesSearch && matchesCategory;
	});

	// Handle file upload completion
	const handleUploadComplete = useCallback((uploadedFiles: any[]) => {
		const newDocuments = uploadedFiles.map((file, index) => ({
			id: documents.length + index + 1,
			name: file.name,
			type: file.type,
			category: "Uncategorized",
			size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
			uploadedAt: new Date().toISOString().split('T')[0],
			status: "pending" as const,
			tags: ["new"],
			description: "Recently uploaded document",
		}));

		setDocuments(prev => [...newDocuments, ...prev]);
		setUploadDialogOpen(false);
	}, [documents.length]);

	// Get document icon based on type
	const getDocumentIcon = (type: string) => {
		const iconClass = "h-8 w-8";
		switch (type.toLowerCase()) {
			case "pdf":
				return <div className={`${iconClass} bg-red-100 rounded-lg flex items-center justify-center`}>
					<FileIcon className="h-4 w-4 text-red-600" />
				</div>;
			case "excel":
			case "xlsx":
				return <div className={`${iconClass} bg-green-100 rounded-lg flex items-center justify-center`}>
					<FileIcon className="h-4 w-4 text-green-600" />
				</div>;
			case "word":
			case "docx":
				return <div className={`${iconClass} bg-blue-100 rounded-lg flex items-center justify-center`}>
					<FileIcon className="h-4 w-4 text-blue-600" />
				</div>;
			default:
				return <div className={`${iconClass} bg-gray-100 rounded-lg flex items-center justify-center`}>
					<FileIcon className="h-4 w-4 text-gray-600" />
				</div>;
		}
	};

	// Document statistics
	const stats = {
		total: documents.length,
		approved: documents.filter(d => d.status === "approved").length,
		pending: documents.filter(d => d.status === "pending").length,
		rejected: documents.filter(d => d.status === "rejected").length,
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Documents</h1>
					<p className="text-muted-foreground">
						Upload, manage, and track all your business documents
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
						<DialogTrigger asChild>
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Upload Document
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl">
							<DialogHeader>
								<DialogTitle>Upload Documents</DialogTitle>
								<DialogDescription>
									Upload your business documents for processing and storage
								</DialogDescription>
							</DialogHeader>
							<DocumentUpload onUploadComplete={handleUploadComplete} />
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Statistics Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Total Documents</p>
								<p className="font-bold text-2xl">{stats.total}</p>
							</div>
							<div className="rounded-full bg-blue-100 p-3">
								<FileIcon className="h-6 w-6 text-blue-600" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Approved</p>
								<p className="font-bold text-2xl">{stats.approved}</p>
							</div>
							<div className="rounded-full bg-green-100 p-3">
								<FileIcon className="h-6 w-6 text-green-600" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Pending Review</p>
								<p className="font-bold text-2xl">{stats.pending}</p>
							</div>
							<div className="rounded-full bg-yellow-100 p-3">
								<FileIcon className="h-6 w-6 text-yellow-600" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-muted-foreground text-sm">Need Attention</p>
								<p className="font-bold text-2xl">{stats.rejected}</p>
							</div>
							<div className="rounded-full bg-red-100 p-3">
								<FileIcon className="h-6 w-6 text-red-600" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Controls */}
			<div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-4 md:space-y-0">
				<div className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search documents..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>
				<div className="flex items-center space-x-2">
					<Select value={selectedCategory} onValueChange={setSelectedCategory}>
						<SelectTrigger className="w-48">
							<Filter className="mr-2 h-4 w-4" />
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{categories.map((category) => (
								<SelectItem key={category} value={category}>
									{category}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="flex rounded-md border">
						<Button
							variant={viewMode === "grid" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("grid")}
							className="rounded-r-none"
						>
							<Grid3X3 className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === "list" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("list")}
							className="rounded-l-none"
						>
							<List className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>

			{/* Documents Grid/List */}
			{viewMode === "grid" ? (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filteredDocuments.map((document) => (
						<Card key={document.id} className="group transition-all duration-200 hover:shadow-lg">
							<CardHeader className="space-y-3">
								<div className="flex items-start justify-between">
									{getDocumentIcon(document.type)}
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem>
												<Eye className="mr-2 h-4 w-4" />
												Preview
											</DropdownMenuItem>
											<DropdownMenuItem>
												<Download className="mr-2 h-4 w-4" />
												Download
											</DropdownMenuItem>
											<DropdownMenuItem>
												<Share className="mr-2 h-4 w-4" />
												Share
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem className="text-red-600">
												<Trash2 className="mr-2 h-4 w-4" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								<div>
									<h3 className="font-semibold text-sm leading-none">{document.name}</h3>
									<p className="text-muted-foreground text-xs">{document.size}</p>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								<Badge className={statusColors[document.status]}>
									{document.status}
								</Badge>
								<p className="text-muted-foreground text-sm">
									{document.description}
								</p>
								<div className="flex flex-wrap gap-1">
									{document.tags.slice(0, 2).map((tag) => (
										<Badge key={tag} variant="outline" className="text-xs">
											{tag}
										</Badge>
									))}
									{document.tags.length > 2 && (
										<Badge variant="outline" className="text-xs">
											+{document.tags.length - 2}
										</Badge>
									)}
								</div>
								<p className="text-muted-foreground text-xs">
									Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Card>
					<CardContent className="p-0">
						<div className="space-y-0">
							{filteredDocuments.map((document, index) => (
								<div
									key={document.id}
									className={`flex items-center justify-between p-4 hover:bg-muted/50 ${
										index !== filteredDocuments.length - 1 ? "border-b" : ""
									}`}
								>
									<div className="flex items-center space-x-4">
										{getDocumentIcon(document.type)}
										<div>
											<h3 className="font-medium text-sm">{document.name}</h3>
											<p className="text-muted-foreground text-xs">
												{document.category} • {document.size} • {new Date(document.uploadedAt).toLocaleDateString()}
											</p>
										</div>
									</div>
									<div className="flex items-center space-x-4">
										<Badge className={statusColors[document.status]}>
											{document.status}
										</Badge>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem>
													<Eye className="mr-2 h-4 w-4" />
													Preview
												</DropdownMenuItem>
												<DropdownMenuItem>
													<Download className="mr-2 h-4 w-4" />
													Download
												</DropdownMenuItem>
												<DropdownMenuItem>
													<Share className="mr-2 h-4 w-4" />
													Share
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem className="text-red-600">
													<Trash2 className="mr-2 h-4 w-4" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Empty State */}
			{filteredDocuments.length === 0 && (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<Upload className="mb-4 h-12 w-12 text-muted-foreground" />
						<h3 className="mb-2 font-semibold text-lg">No documents found</h3>
						<p className="mb-4 text-center text-muted-foreground">
							{searchTerm || selectedCategory !== "All Documents"
								? "Try adjusting your search or filter criteria"
								: "Get started by uploading your first document"}
						</p>
						{!searchTerm && selectedCategory === "All Documents" && (
							<Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
								<DialogTrigger asChild>
									<Button>
										<Upload className="mr-2 h-4 w-4" />
										Upload Document
									</Button>
								</DialogTrigger>
								<DialogContent className="max-w-2xl">
									<DialogHeader>
										<DialogTitle>Upload Documents</DialogTitle>
										<DialogDescription>
											Upload your business documents for processing and storage
										</DialogDescription>
									</DialogHeader>
									<DocumentUpload onUploadComplete={handleUploadComplete} />
								</DialogContent>
							</Dialog>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}