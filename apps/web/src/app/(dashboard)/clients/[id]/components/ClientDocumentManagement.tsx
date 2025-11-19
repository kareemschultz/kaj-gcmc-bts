"use client";

import {
  Calendar,
  Download,
  Eye,
  File,
  FileText,
  Filter,
  FolderOpen,
  Image,
  Lock,
  MoreVertical,
  Plus,
  Search,
  Shield,
  Tag,
  Trash2,
  Upload,
} from "lucide-react";
import { useState, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  ClientDocument,
  ClientDocumentCategory,
} from "@gcmc-kaj/types";

interface ClientDocumentManagementProps {
  clientId: number;
  documents: ClientDocument[];
  onUpload?: (files: File[]) => void;
  onDownload?: (document: ClientDocument) => void;
  onView?: (document: ClientDocument) => void;
  onDelete?: (documentId: string) => void;
  onUpdateTags?: (documentId: string, tags: string[]) => void;
  className?: string;
}

const DOCUMENT_ICONS = {
  "application/pdf": FileText,
  "application/msword": FileText,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileText,
  "application/vnd.ms-excel": FileText,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FileText,
  "image/jpeg": Image,
  "image/png": Image,
  "image/gif": Image,
  "image/webp": Image,
} as const;

const CATEGORY_COLORS = {
  incorporation: "bg-blue-100 text-blue-800",
  tax_documents: "bg-green-100 text-green-800",
  compliance_certificates: "bg-purple-100 text-purple-800",
  financial_statements: "bg-orange-100 text-orange-800",
  contracts: "bg-red-100 text-red-800",
  correspondence: "bg-gray-100 text-gray-800",
  identification: "bg-yellow-100 text-yellow-800",
  licenses: "bg-indigo-100 text-indigo-800",
  permits: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800",
} as const;

type ViewMode = "grid" | "list";

export function ClientDocumentManagement({
  clientId,
  documents,
  onUpload,
  onDownload,
  onView,
  onDelete,
  onUpdateTags,
  className,
}: ClientDocumentManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ClientDocumentCategory | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "category">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((doc) => doc.category === selectedCategory);
    }

    // Sort documents
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "size":
          comparison = a.size - b.size;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [documents, searchQuery, selectedCategory, sortBy, sortOrder]);

  // Group documents by category for stats
  const documentStats = useMemo(() => {
    const stats: Record<ClientDocumentCategory, number> = {
      incorporation: 0,
      tax_documents: 0,
      compliance_certificates: 0,
      financial_statements: 0,
      contracts: 0,
      correspondence: 0,
      identification: 0,
      licenses: 0,
      permits: 0,
      other: 0,
    };

    documents.forEach((doc) => {
      stats[doc.category]++;
    });

    return stats;
  }, [documents]);

  const formatFileSize = (bytes: number): string => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const getDocumentIcon = (mimeType: string) => {
    const Icon = DOCUMENT_ICONS[mimeType as keyof typeof DOCUMENT_ICONS] || File;
    return Icon;
  };

  const getCategoryColor = (category: ClientDocumentCategory): string => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  };

  const isDocumentExpiringSoon = (doc: ClientDocument): boolean => {
    if (!doc.expiryDate) return false;
    const now = new Date();
    const expiryDate = new Date(doc.expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isDocumentExpired = (doc: ClientDocument): boolean => {
    if (!doc.expiryDate) return false;
    return new Date(doc.expiryDate) < new Date();
  };

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Header and Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{documents.length}</p>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                </div>
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {documents.filter(isDocumentExpired).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Expired</p>
                </div>
                <Calendar className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {documents.filter(isDocumentExpiringSoon).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Expiring Soon</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {documents.filter((doc) => doc.isConfidential).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Confidential</p>
                </div>
                <Lock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory as any}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.keys(CATEGORY_COLORS).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      {documentStats[category as ClientDocumentCategory] > 0 && (
                        <span className="ml-2 text-muted-foreground">
                          ({documentStats[category as ClientDocumentCategory]})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy as any}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>

              {/* Upload Button */}
              {onUpload && (
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
            <CardDescription>
              Manage all client documents with advanced organization and search capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No documents found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory !== "all"
                    ? "No documents match your current filters."
                    : "No documents have been uploaded for this client yet."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => {
                    const Icon = getDocumentIcon(document.mimeType);
                    const isExpired = isDocumentExpired(document);
                    const isExpiringSoon = isDocumentExpiringSoon(document);

                    return (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                              <Icon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium">{document.name}</p>
                              {document.description && (
                                <p className="text-sm text-muted-foreground">
                                  {document.description}
                                </p>
                              )}
                              {document.isConfidential && (
                                <div className="flex items-center text-xs text-amber-600">
                                  <Shield className="mr-1 h-3 w-3" />
                                  Confidential
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={getCategoryColor(document.category)}
                          >
                            {document.category.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatFileSize(document.size)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(document.createdAt)}
                        </TableCell>
                        <TableCell>
                          {document.expiryDate ? (
                            <div className="space-y-1">
                              <p
                                className={cn(
                                  "text-sm",
                                  isExpired
                                    ? "text-red-600 font-medium"
                                    : isExpiringSoon
                                      ? "text-orange-600 font-medium"
                                      : "text-muted-foreground"
                                )}
                              >
                                {formatDate(document.expiryDate)}
                              </p>
                              {isExpired && (
                                <Badge variant="destructive" className="text-xs">
                                  Expired
                                </Badge>
                              )}
                              {isExpiringSoon && !isExpired && (
                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                  Expires Soon
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {document.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {document.tags.length > 2 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-xs">
                                    +{document.tags.length - 2}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    {document.tags.slice(2).map((tag) => (
                                      <div key={tag} className="text-xs">
                                        {tag}
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {onView && (
                                <DropdownMenuItem onClick={() => onView(document)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                              )}
                              {onDownload && (
                                <DropdownMenuItem onClick={() => onDownload(document)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                              )}
                              {onUpdateTags && (
                                <DropdownMenuItem onClick={() => onUpdateTags(document.id, document.tags)}>
                                  <Tag className="mr-2 h-4 w-4" />
                                  Edit Tags
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {onDelete && (
                                <DropdownMenuItem
                                  onClick={() => onDelete(document.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}