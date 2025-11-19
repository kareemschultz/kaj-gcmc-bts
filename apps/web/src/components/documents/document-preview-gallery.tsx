"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Download,
  Share,
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Grid,
  List,
  Filter,
  Search,
  Star,
  Clock,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit3,
  MessageCircle,
  Tag,
  Calendar,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  Info,
  Bookmark,
  Copy,
  Trash2,
  Archive,
  ExternalLink,
  Layers,
  ScanLine,
  PenTool,
  Highlighter,
  Type,
  Square,
  Circle,
  ArrowRight,
  Undo,
  Redo,
  Save,
  PrinterIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { brandColors, gcmcKajBrand, businessColors } from '@/styles/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toggle } from '@/components/ui/toggle';

// Types for document preview
interface DocumentPreview {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'image' | 'document' | 'spreadsheet';
  size: number;
  uploadDate: string;
  lastModified: string;
  category: string;
  agency: string;
  tags: string[];
  description: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  complianceScore?: number;
  annotations: Annotation[];
  versions: DocumentVersion[];
  permissions: DocumentPermissions;
  metadata: DocumentMetadata;
}

interface Annotation {
  id: string;
  type: 'highlight' | 'comment' | 'stamp' | 'drawing';
  content: string;
  position: { x: number; y: number; width?: number; height?: number };
  author: string;
  timestamp: string;
  color: string;
}

interface DocumentVersion {
  id: string;
  version: string;
  uploadDate: string;
  author: string;
  changes: string;
  url: string;
}

interface DocumentPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canAnnotate: boolean;
  canDownload: boolean;
}

interface DocumentMetadata {
  author?: string;
  createdDate?: string;
  department?: string;
  classification?: 'public' | 'internal' | 'confidential' | 'restricted';
  expiryDate?: string;
  relatedDocuments?: string[];
  workflow?: {
    status: string;
    assignee: string;
    dueDate: string;
  };
}

interface DocumentPreviewGalleryProps {
  documents: DocumentPreview[];
  selectedDocument?: DocumentPreview;
  onDocumentSelect: (document: DocumentPreview) => void;
  onDocumentUpdate?: (document: DocumentPreview) => void;
  onAnnotationAdd?: (documentId: string, annotation: Annotation) => void;
  viewMode?: 'grid' | 'list';
  showToolbar?: boolean;
  showSidebar?: boolean;
  className?: string;
}

type AnnotationTool = 'select' | 'highlight' | 'comment' | 'rectangle' | 'circle' | 'text' | 'pen';

export function DocumentPreviewGallery({
  documents,
  selectedDocument,
  onDocumentSelect,
  onDocumentUpdate,
  onAnnotationAdd,
  viewMode = 'grid',
  showToolbar = true,
  showSidebar = true,
  className
}: DocumentPreviewGalleryProps) {
  // State management
  const [currentViewMode, setCurrentViewMode] = useState<'grid' | 'list'>(viewMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeAnnotationTool, setActiveAnnotationTool] = useState<AnnotationTool>('select');
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'info' | 'annotations' | 'versions' | 'activity'>('info');

  const previewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Filter and sort documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' ||
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'size':
        return b.size - a.size;
      case 'date':
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  // Get unique categories and statuses for filters
  const categories = [...new Set(documents.map(doc => doc.category))];
  const statuses = [...new Set(documents.map(doc => doc.status))];

  // Document preview functions
  const getFileIcon = (type: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const iconClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

    switch (type) {
      case 'pdf':
        return <FileText className={cn(iconClass, 'text-red-600')} />;
      case 'image':
        return <ImageIcon className={cn(iconClass, 'text-purple-600')} />;
      case 'spreadsheet':
        return <FileSpreadsheet className={cn(iconClass, 'text-green-600')} />;
      case 'document':
        return <FileText className={cn(iconClass, 'text-blue-600')} />;
      default:
        return <FileText className={cn(iconClass, 'text-gray-600')} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Preview controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetView = () => {
    setZoomLevel(100);
    setRotation(0);
  };

  // Annotation functions
  const addAnnotation = useCallback((annotation: Omit<Annotation, 'id' | 'timestamp' | 'author'>) => {
    if (!selectedDocument) return;

    const newAnnotation: Annotation = {
      ...annotation,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      author: 'Current User' // Would come from auth context
    };

    onAnnotationAdd?.(selectedDocument.id, newAnnotation);
  }, [selectedDocument, onAnnotationAdd]);

  // Navigation
  const selectNextDocument = () => {
    if (!selectedDocument) return;
    const currentIndex = sortedDocuments.findIndex(doc => doc.id === selectedDocument.id);
    const nextIndex = (currentIndex + 1) % sortedDocuments.length;
    onDocumentSelect(sortedDocuments[nextIndex]);
  };

  const selectPrevDocument = () => {
    if (!selectedDocument) return;
    const currentIndex = sortedDocuments.findIndex(doc => doc.id === selectedDocument.id);
    const prevIndex = (currentIndex - 1 + sortedDocuments.length) % sortedDocuments.length;
    onDocumentSelect(sortedDocuments[prevIndex]);
  };

  return (
    <div className={cn("flex h-full bg-gray-50", className)}>
      {/* Document List Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Search and Filters */}
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Documents</h2>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentViewMode(currentViewMode === 'grid' ? 'list' : 'grid')}
                    >
                      {currentViewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Switch to {currentViewMode === 'grid' ? 'list' : 'grid'} view
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="size">Sort by Size</SelectItem>
              <SelectItem value="status">Sort by Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Document List */}
        <ScrollArea className="flex-1">
          <div className={cn(
            "p-4 space-y-2",
            currentViewMode === 'grid' && "grid grid-cols-2 gap-2 space-y-0"
          )}>
            <AnimatePresence mode="popLayout">
              {sortedDocuments.map((document, index) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onDocumentSelect(document)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                    selectedDocument?.id === document.id
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  {currentViewMode === 'grid' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        {getFileIcon(document.type)}
                        <Badge className={cn("text-xs", getStatusColor(document.status))}>
                          {document.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium text-sm truncate" title={document.name}>
                          {document.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(document.size)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatDate(document.uploadDate)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {getFileIcon(document.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm truncate" title={document.name}>
                            {document.name}
                          </p>
                          <Badge className={cn("text-xs ml-2", getStatusColor(document.status))}>
                            {document.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatFileSize(document.size)}</span>
                          <span>{formatDate(document.uploadDate)}</span>
                        </div>
                        {document.complianceScore && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-16 h-1 bg-gray-200 rounded">
                              <div
                                className={cn(
                                  "h-full rounded",
                                  document.complianceScore >= 80 ? "bg-green-500" :
                                  document.complianceScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                                )}
                                style={{ width: `${document.complianceScore}%` }}
                              />
                            </div>
                            <span className="text-xs">{document.complianceScore}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        {showToolbar && selectedDocument && (
          <div className="bg-white border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectPrevDocument}
                    disabled={sortedDocuments.length <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    {sortedDocuments.findIndex(doc => doc.id === selectedDocument.id) + 1} of {sortedDocuments.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectNextDocument}
                    disabled={sortedDocuments.length <= 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm min-w-[60px] text-center">{zoomLevel}%</span>
                  <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleRotate}>
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Annotation Tools */}
                <div className="flex items-center gap-1">
                  <Toggle
                    pressed={activeAnnotationTool === 'select'}
                    onPressedChange={() => setActiveAnnotationTool('select')}
                    size="sm"
                  >
                    <Move className="w-4 h-4" />
                  </Toggle>
                  <Toggle
                    pressed={activeAnnotationTool === 'highlight'}
                    onPressedChange={() => setActiveAnnotationTool('highlight')}
                    size="sm"
                  >
                    <Highlighter className="w-4 h-4" />
                  </Toggle>
                  <Toggle
                    pressed={activeAnnotationTool === 'comment'}
                    onPressedChange={() => setActiveAnnotationTool('comment')}
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Toggle>
                  <Toggle
                    pressed={activeAnnotationTool === 'text'}
                    onPressedChange={() => setActiveAnnotationTool('text')}
                    size="sm"
                  >
                    <Type className="w-4 h-4" />
                  </Toggle>
                </div>

                <Separator orientation="vertical" className="h-6" />

                <Toggle
                  pressed={showAnnotations}
                  onPressedChange={setShowAnnotations}
                  size="sm"
                >
                  <Layers className="w-4 h-4" />
                </Toggle>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <PrinterIcon className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFullscreen}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Properties
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1">
          {/* Document Preview */}
          <div
            ref={previewRef}
            className={cn(
              "flex-1 bg-gray-100 flex items-center justify-center p-8 relative overflow-auto",
              isFullscreen && "fixed inset-0 z-50 bg-black"
            )}
          >
            {selectedDocument ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-white shadow-lg rounded-lg overflow-hidden max-w-full max-h-full"
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
              >
                <div className="w-[800px] h-[1000px] bg-white flex items-center justify-center border">
                  {selectedDocument.type === 'image' ? (
                    <img
                      src={selectedDocument.url}
                      alt={selectedDocument.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-8">
                      {getFileIcon(selectedDocument.type, 'lg')}
                      <h3 className="mt-4 font-medium">{selectedDocument.name}</h3>
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedDocument.type.toUpperCase()} Preview
                      </p>
                      <Button className="mt-4" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in Application
                      </Button>
                    </div>
                  )}

                  {/* Annotation Overlay */}
                  {showAnnotations && (
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 pointer-events-auto"
                      width={800}
                      height={1000}
                    />
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No Document Selected</p>
                <p className="text-sm">Select a document from the list to preview</p>
              </div>
            )}
          </div>

          {/* Document Information Sidebar */}
          {showSidebar && selectedDocument && (
            <div className="w-80 bg-white border-l flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold truncate" title={selectedDocument.name}>
                  {selectedDocument.name}
                </h3>
                <p className="text-sm text-gray-600">{selectedDocument.category}</p>
              </div>

              <Tabs value={sidebarTab} onValueChange={(value) => setSidebarTab(value as any)} className="flex-1">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
                  <TabsTrigger value="annotations" className="text-xs">
                    Notes
                    {selectedDocument.annotations.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs px-1">
                        {selectedDocument.annotations.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="versions" className="text-xs">Versions</TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-hidden">
                  <TabsContent value="info" className="h-full">
                    <ScrollArea className="h-full p-4">
                      <DocumentInfoPanel document={selectedDocument} />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="annotations" className="h-full">
                    <ScrollArea className="h-full p-4">
                      <DocumentAnnotationsPanel
                        document={selectedDocument}
                        onAnnotationAdd={addAnnotation}
                      />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="versions" className="h-full">
                    <ScrollArea className="h-full p-4">
                      <DocumentVersionsPanel document={selectedDocument} />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="activity" className="h-full">
                    <ScrollArea className="h-full p-4">
                      <DocumentActivityPanel document={selectedDocument} />
                    </ScrollArea>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Document Info Panel Component
function DocumentInfoPanel({ document }: { document: DocumentPreview }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Basic Information</h4>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Size:</span>
            <span>{formatFileSize(document.size)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Type:</span>
            <span className="uppercase">{document.type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Uploaded:</span>
            <span>{formatDate(document.uploadDate)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Modified:</span>
            <span>{formatDate(document.lastModified)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Status:</span>
            <Badge className={getStatusColor(document.status)}>
              {document.status}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="font-medium mb-3">Classification</h4>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Agency:</span>
            <span>{document.agency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Category:</span>
            <span>{document.category}</span>
          </div>
          {document.metadata.classification && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Classification:</span>
              <Badge variant="outline" className="text-xs">
                {document.metadata.classification}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {document.complianceScore && (
        <>
          <Separator />
          <div>
            <h4 className="font-medium mb-3">Compliance</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Score:</span>
                <span className={cn(
                  "font-medium",
                  document.complianceScore >= 80 ? "text-green-600" :
                  document.complianceScore >= 60 ? "text-yellow-600" : "text-red-600"
                )}>
                  {document.complianceScore}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div
                  className={cn(
                    "h-full rounded",
                    document.complianceScore >= 80 ? "bg-green-500" :
                    document.complianceScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${document.complianceScore}%` }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <Separator />

      <div>
        <h4 className="font-medium mb-3">Tags</h4>
        <div className="flex flex-wrap gap-1">
          {document.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {document.tags.length === 0 && (
            <p className="text-sm text-gray-500">No tags added</p>
          )}
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="font-medium mb-3">Description</h4>
        <p className="text-sm text-gray-700">
          {document.description || 'No description provided'}
        </p>
      </div>
    </div>
  );
}

// Document Annotations Panel Component
function DocumentAnnotationsPanel({
  document,
  onAnnotationAdd
}: {
  document: DocumentPreview;
  onAnnotationAdd: (annotation: Omit<Annotation, 'id' | 'timestamp' | 'author'>) => void;
}) {
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    onAnnotationAdd({
      type: 'comment',
      content: newComment,
      position: { x: 50, y: 50 },
      color: '#3b82f6'
    });

    setNewComment('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-3">Add Comment</h4>
        <div className="space-y-2">
          <Textarea
            placeholder="Add your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button onClick={handleAddComment} size="sm" disabled={!newComment.trim()}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Add Comment
          </Button>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="font-medium mb-3">
          Annotations ({document.annotations.length})
        </h4>
        <div className="space-y-3">
          {document.annotations.map((annotation) => (
            <div key={annotation.id} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: annotation.color }}
                  />
                  <span className="text-sm font-medium capitalize">
                    {annotation.type}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(annotation.timestamp)}
                </span>
              </div>
              <p className="text-sm text-gray-700">{annotation.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                By {annotation.author}
              </p>
            </div>
          ))}

          {document.annotations.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No annotations yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Document Versions Panel Component
function DocumentVersionsPanel({ document }: { document: DocumentPreview }) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Version History</h4>
      <div className="space-y-3">
        {document.versions.map((version) => (
          <div key={version.id} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">v{version.version}</span>
              <span className="text-xs text-gray-500">
                {formatDate(version.uploadDate)}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{version.changes}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">By {version.author}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm">
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
                <Button variant="ghost" size="sm">
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
              </div>
            </div>
          </div>
        ))}

        {document.versions.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No version history available
          </p>
        )}
      </div>
    </div>
  );
}

// Document Activity Panel Component
function DocumentActivityPanel({ document }: { document: DocumentPreview }) {
  const activities = [
    { action: 'uploaded', user: 'John Doe', timestamp: document.uploadDate },
    { action: 'viewed', user: 'Jane Smith', timestamp: document.lastModified },
    // Mock additional activities
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Recent Activity</h4>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium">{activity.user}</span>
                {' '}
                {activity.action} this document
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export { type DocumentPreview, type Annotation };
export default DocumentPreviewGallery;