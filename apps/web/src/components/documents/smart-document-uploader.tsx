"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  File,
  X,
  Check,
  AlertCircle,
  Eye,
  Camera,
  Scan,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileImage,
  Brain,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  Star,
  Tag,
  Calendar,
  Building,
  Shield,
  Loader2,
  Search,
  Filter,
  Grid,
  List,
  Download,
  Share,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { brandColors, gcmcKajBrand, businessColors } from '@/styles/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// Types and interfaces
interface DocumentFile {
  id: string;
  file: File;
  progress: number;
  status: 'analyzing' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
  // Smart categorization
  suggestedCategory?: AgencyType;
  suggestedDocumentType?: DocumentType;
  confidence?: number;
  // OCR and analysis
  extractedText?: string;
  detectedFields?: Record<string, string>;
  // Metadata
  tags: string[];
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiryDate?: string;
  relatedClient?: string;
  // Compliance
  complianceScore?: number;
  requiredActions?: string[];
}

type AgencyType = 'GRA' | 'NIS' | 'DCRA' | 'IMMIGRATION' | 'OTHER';

interface DocumentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  templates?: string[];
  validationRules?: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface AgencyCategory {
  id: AgencyType;
  name: string;
  color: string;
  icon: React.ReactNode;
  description: string;
  documentTypes: DocumentType[];
}

// Guyanese regulatory agencies and document types
const AGENCY_CATEGORIES: AgencyCategory[] = [
  {
    id: 'GRA',
    name: 'Guyana Revenue Authority',
    color: brandColors.primary[600],
    icon: <Building className="w-5 h-5" />,
    description: 'Tax returns, VAT certificates, income statements, corporation tax forms',
    documentTypes: [
      {
        id: 'income-tax-return',
        name: 'Income Tax Return',
        description: 'Annual income tax filing documents',
        required: true,
        urgencyLevel: 'high',
        templates: ['Form IT-1', 'Form IT-2'],
        validationRules: ['Must include TIN', 'Filing deadline compliance']
      },
      {
        id: 'vat-return',
        name: 'VAT Return',
        description: 'Value Added Tax quarterly returns',
        required: true,
        urgencyLevel: 'high',
        templates: ['VAT Form 1', 'VAT Form 2']
      },
      {
        id: 'corporation-tax',
        name: 'Corporation Tax Return',
        description: 'Corporate tax filing documents',
        required: true,
        urgencyLevel: 'high'
      },
      {
        id: 'withholding-tax',
        name: 'Withholding Tax Certificate',
        description: 'Tax withholding documentation',
        required: false,
        urgencyLevel: 'medium'
      },
      {
        id: 'gra-correspondence',
        name: 'GRA Correspondence',
        description: 'Letters and notices from GRA',
        required: false,
        urgencyLevel: 'medium'
      }
    ]
  },
  {
    id: 'NIS',
    name: 'National Insurance Scheme',
    color: gcmcKajBrand.emerald[600],
    icon: <Shield className="w-5 h-5" />,
    description: 'Contribution schedules, employee reports, compliance certificates',
    documentTypes: [
      {
        id: 'nis-contribution',
        name: 'NIS Contribution Schedule',
        description: 'Monthly employee contribution reports',
        required: true,
        urgencyLevel: 'high'
      },
      {
        id: 'employee-report',
        name: 'Employee Report',
        description: 'Employee registration and status reports',
        required: true,
        urgencyLevel: 'medium'
      },
      {
        id: 'compliance-certificate',
        name: 'Compliance Certificate',
        description: 'NIS compliance verification documents',
        required: false,
        urgencyLevel: 'low'
      }
    ]
  },
  {
    id: 'DCRA',
    name: 'Deeds & Commercial Registry Authority',
    color: brandColors.warning[600],
    icon: <FileText className="w-5 h-5" />,
    description: 'Registration certificates, annual returns, director resolutions',
    documentTypes: [
      {
        id: 'incorporation-certificate',
        name: 'Certificate of Incorporation',
        description: 'Company incorporation documentation',
        required: true,
        urgencyLevel: 'high'
      },
      {
        id: 'annual-return',
        name: 'Annual Return',
        description: 'Annual company filing requirements',
        required: true,
        urgencyLevel: 'high'
      },
      {
        id: 'director-resolution',
        name: 'Director Resolution',
        description: 'Board resolutions and director changes',
        required: false,
        urgencyLevel: 'medium'
      },
      {
        id: 'registered-office',
        name: 'Registered Office Change',
        description: 'Change of registered office address',
        required: false,
        urgencyLevel: 'low'
      }
    ]
  },
  {
    id: 'IMMIGRATION',
    name: 'Immigration Department',
    color: brandColors.danger[600],
    icon: <FileImage className="w-5 h-5" />,
    description: 'Work permits, visa applications, residency forms',
    documentTypes: [
      {
        id: 'work-permit',
        name: 'Work Permit Application',
        description: 'Work authorization documents',
        required: true,
        urgencyLevel: 'critical'
      },
      {
        id: 'visa-application',
        name: 'Visa Application',
        description: 'Tourist and business visa applications',
        required: true,
        urgencyLevel: 'high'
      },
      {
        id: 'residency-form',
        name: 'Residency Application',
        description: 'Permanent residency applications',
        required: true,
        urgencyLevel: 'critical'
      }
    ]
  },
  {
    id: 'OTHER',
    name: 'Other Documents',
    color: brandColors.gray[600],
    icon: <File className="w-5 h-5" />,
    description: 'General business documents and miscellaneous files',
    documentTypes: [
      {
        id: 'general-contract',
        name: 'General Contract',
        description: 'Business contracts and agreements',
        required: false,
        urgencyLevel: 'low'
      },
      {
        id: 'correspondence',
        name: 'Business Correspondence',
        description: 'General business letters and emails',
        required: false,
        urgencyLevel: 'low'
      }
    ]
  }
];

interface SmartDocumentUploaderProps {
  onUpload?: (files: DocumentFile[]) => Promise<void>;
  onFileUploaded?: (file: DocumentFile) => void;
  onComplete?: (files: DocumentFile[]) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  multiple?: boolean;
  showPreview?: boolean;
  enableOCR?: boolean;
  enableMobileCapture?: boolean;
  className?: string;
}

export function SmartDocumentUploader({
  onUpload,
  onFileUploaded,
  onComplete,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xlsx', '.xls'],
  maxSize = 50,
  multiple = true,
  showPreview = true,
  enableOCR = true,
  enableMobileCapture = true,
  className
}: SmartDocumentUploaderProps) {
  // State management
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAgency, setSelectedAgency] = useState<AgencyType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Smart categorization using file content analysis
  const analyzeDocument = useCallback(async (file: File): Promise<Partial<DocumentFile>> => {
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    // Simple heuristic-based categorization
    let suggestedCategory: AgencyType = 'OTHER';
    let suggestedDocumentType: DocumentType | undefined;
    let confidence = 0.3;

    // Analyze filename for keywords
    if (fileName.includes('tax') || fileName.includes('gra') || fileName.includes('income')) {
      suggestedCategory = 'GRA';
      confidence = 0.8;
      if (fileName.includes('income')) {
        suggestedDocumentType = AGENCY_CATEGORIES[0].documentTypes.find(t => t.id === 'income-tax-return');
      } else if (fileName.includes('vat')) {
        suggestedDocumentType = AGENCY_CATEGORIES[0].documentTypes.find(t => t.id === 'vat-return');
      }
    } else if (fileName.includes('nis') || fileName.includes('contribution') || fileName.includes('employee')) {
      suggestedCategory = 'NIS';
      confidence = 0.8;
    } else if (fileName.includes('incorporation') || fileName.includes('annual') || fileName.includes('dcra')) {
      suggestedCategory = 'DCRA';
      confidence = 0.8;
    } else if (fileName.includes('visa') || fileName.includes('permit') || fileName.includes('immigration')) {
      suggestedCategory = 'IMMIGRATION';
      confidence = 0.9;
    }

    // Mock OCR extraction for demonstration
    const extractedText = enableOCR ? `Extracted text from ${file.name}...` : '';

    return {
      suggestedCategory,
      suggestedDocumentType,
      confidence,
      extractedText,
      detectedFields: {
        'Document Type': suggestedDocumentType?.name || 'Unknown',
        'Agency': AGENCY_CATEGORIES.find(a => a.id === suggestedCategory)?.name || 'Other'
      },
      tags: [],
      description: '',
      priority: suggestedDocumentType?.urgencyLevel === 'critical' ? 'urgent' :
                 suggestedDocumentType?.urgencyLevel === 'high' ? 'high' : 'medium',
      complianceScore: Math.floor(Math.random() * 40) + 60 // Mock score 60-100
    };
  }, [enableOCR]);

  // File validation
  const validateFile = (file: File): string | null => {
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type ${fileExtension} is not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds ${maxSize}MB limit`;
    }
    return null;
  };

  // Process uploaded files
  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: DocumentFile[] = [];
    setIsAnalyzing(true);

    for (const file of Array.from(fileList)) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }

      const analysis = await analyzeDocument(file);

      const documentFile: DocumentFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: 'analyzing',
        tags: [],
        description: '',
        priority: 'medium',
        ...analysis
      };

      newFiles.push(documentFile);
    }

    if (newFiles.length === 0) {
      setIsAnalyzing(false);
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate processing each file
    for (const documentFile of newFiles) {
      try {
        // Start upload simulation
        setFiles(prev => prev.map(f =>
          f.id === documentFile.id ? { ...f, status: 'uploading' } : f
        ));

        // Progress simulation
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f =>
            f.id === documentFile.id
              ? { ...f, progress: Math.min(f.progress + Math.random() * 25, 95) }
              : f
          ));
        }, 300);

        // Simulate upload time
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

        // Complete the upload
        clearInterval(progressInterval);
        setFiles(prev => prev.map(f =>
          f.id === documentFile.id
            ? {
                ...f,
                progress: 100,
                status: 'completed',
                url: URL.createObjectURL(f.file),
                requiredActions: generateRequiredActions(f)
              }
            : f
        ));

        if (onFileUploaded) {
          onFileUploaded({
            ...documentFile,
            progress: 100,
            status: 'completed',
            url: URL.createObjectURL(documentFile.file)
          });
        }

        toast.success(
          `${documentFile.file.name} uploaded successfully`,
          {
            description: `Categorized as ${AGENCY_CATEGORIES.find(a => a.id === documentFile.suggestedCategory)?.name} document`
          }
        );
      } catch (error) {
        setFiles(prev => prev.map(f =>
          f.id === documentFile.id
            ? { ...f, status: 'error', error: 'Upload failed' }
            : f
        ));
        toast.error(`Failed to upload ${documentFile.file.name}`);
      }
    }

    setIsAnalyzing(false);
  }, [analyzeDocument, validateFile, acceptedTypes, maxSize, onFileUploaded]);

  // Generate compliance requirements based on document
  const generateRequiredActions = (file: DocumentFile): string[] => {
    const actions: string[] = [];

    if (file.suggestedCategory === 'GRA') {
      actions.push('Verify TIN number is included');
      actions.push('Check filing deadline compliance');
    }
    if (file.suggestedCategory === 'NIS') {
      actions.push('Validate employee contribution amounts');
    }
    if (!file.description.trim()) {
      actions.push('Add document description');
    }
    if (file.tags.length === 0) {
      actions.push('Add relevant tags for organization');
    }

    return actions;
  };

  // Drag and drop handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  // File management
  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateFile = useCallback((id: string, updates: Partial<DocumentFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  // UI helpers
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, category?: AgencyType) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension || '')) {
      return <ImageIcon className="w-6 h-6 text-purple-600" />;
    }
    if (['pdf'].includes(extension || '')) {
      return <FileText className="w-6 h-6 text-red-600" />;
    }
    if (['doc', 'docx'].includes(extension || '')) {
      return <FileText className="w-6 h-6 text-blue-600" />;
    }
    if (['xls', 'xlsx'].includes(extension || '')) {
      return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
    }
    return <File className="w-6 h-6 text-gray-600" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: DocumentFile['status']) => {
    switch (status) {
      case 'analyzing':
        return <Brain className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  // Filter files based on agency and search
  const filteredFiles = files.filter(file => {
    const matchesAgency = selectedAgency === 'ALL' || file.suggestedCategory === selectedAgency;
    const matchesSearch = searchTerm === '' ||
      file.file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesAgency && matchesSearch;
  });

  // Calculate completion stats
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const totalFiles = files.length;
  const averageComplianceScore = files.length > 0
    ? Math.round(files.reduce((sum, f) => sum + (f.complianceScore || 0), 0) / files.length)
    : 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Upload Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <motion.div
              className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-5 h-5 text-blue-600" />
            </motion.div>
            Smart Document Upload
            {isAnalyzing && (
              <Badge variant="secondary" className="ml-2">
                <Brain className="w-3 h-3 mr-1" />
                AI Analyzing...
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Intelligent document categorization with agency-specific processing for Guyanese regulatory compliance
          </p>
        </CardHeader>
        <CardContent>
          {/* Drop Zone */}
          <motion.div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileDialog}
            className={cn(
              "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300",
              "hover:border-primary/50 hover:bg-primary/5",
              isDragOver
                ? "border-primary bg-primary/10 scale-105 shadow-lg"
                : "border-gray-300 bg-gray-50"
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
                  scale: isDragOver ? 1.2 : 1
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20"
                )}
              >
                <Upload className="w-8 h-8 text-primary" />
              </motion.div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  {isDragOver ? 'Drop files here' : 'Upload Documents'}
                  <Brain className="w-5 h-5 text-blue-500" />
                </h3>
                <p className="text-gray-600 mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-white rounded border">AI-Powered</span>
                  <span className="px-2 py-1 bg-white rounded border">Auto-Categorization</span>
                  {enableOCR && <span className="px-2 py-1 bg-white rounded border">OCR Enabled</span>}
                  {enableMobileCapture && <span className="px-2 py-1 bg-white rounded border">Mobile Capture</span>}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Supports: {acceptedTypes.join(', ')} • Max size: {maxSize}MB
                  {multiple && ' • Multiple files allowed'}
                </p>
              </div>
            </motion.div>

            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes.join(',')}
              multiple={multiple}
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </motion.div>

          {/* Quick Actions */}
          {enableMobileCapture && (
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Implement camera capture */}}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Camera Capture
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Implement document scanner */}}
                className="flex items-center gap-2"
              >
                <Scan className="w-4 h-4" />
                Document Scanner
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Management Interface */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <File className="w-5 h-5" />
                  Uploaded Documents ({totalFiles})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {completedFiles}/{totalFiles} processed • {averageComplianceScore}% avg. compliance
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRequirements(!showRequirements)}
                >
                  <Info className="w-4 h-4 mr-1" />
                  Requirements
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={selectedAgency} onValueChange={(value: AgencyType | 'ALL') => setSelectedAgency(value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      All Agencies
                    </div>
                  </SelectItem>
                  {AGENCY_CATEGORIES.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      <div className="flex items-center gap-2">
                        {agency.icon}
                        {agency.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Requirements Checker */}
            {showRequirements && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <ComplianceRequirementsChecker
                  documents={files}
                  selectedAgency={selectedAgency}
                />
              </motion.div>
            )}

            {/* Document Grid/List */}
            <div className={cn(
              "space-y-4",
              viewMode === 'grid' && "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 space-y-0"
            )}>
              <AnimatePresence mode="popLayout">
                {filteredFiles.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <DocumentFileCard
                      file={file}
                      viewMode={viewMode}
                      onUpdate={(updates) => updateFile(file.id, updates)}
                      onRemove={() => removeFile(file.id)}
                      showPreview={showPreview}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Document file card component
interface DocumentFileCardProps {
  file: DocumentFile;
  viewMode: 'grid' | 'list';
  onUpdate: (updates: Partial<DocumentFile>) => void;
  onRemove: () => void;
  showPreview: boolean;
}

function DocumentFileCard({
  file,
  viewMode,
  onUpdate,
  onRemove,
  showPreview
}: DocumentFileCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const agency = AGENCY_CATEGORIES.find(a => a.id === file.suggestedCategory);

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      viewMode === 'list' && "p-4",
      file.status === 'error' && "border-red-200 bg-red-50",
      file.status === 'completed' && "border-green-200"
    )}>
      <CardContent className={cn("p-4", viewMode === 'list' && "p-0")}>
        <div className={cn(
          "space-y-3",
          viewMode === 'list' && "flex items-center justify-between space-y-0"
        )}>
          {/* File Header */}
          <div className={cn(
            "flex items-start gap-3",
            viewMode === 'list' && "flex-1"
          )}>
            <div className="flex-shrink-0">
              <div className="relative">
                {getFileIcon(file.file.name, file.suggestedCategory)}
                <div className="absolute -top-1 -right-1">
                  {getStatusIcon(file.status)}
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm truncate">
                  {file.file.name}
                </h4>
                <div className="flex items-center gap-1 ml-2">
                  {file.confidence && file.confidence > 0.7 && (
                    <Star className="w-3 h-3 text-yellow-500" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRemove}
                    className="h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span>{formatFileSize(file.file.size)}</span>
                <Separator orientation="vertical" className="h-3" />
                <Badge
                  variant="secondary"
                  className={`text-xs ${getPriorityColor(file.priority)}`}
                >
                  {file.priority}
                </Badge>
                {file.complianceScore && (
                  <>
                    <Separator orientation="vertical" className="h-3" />
                    <span className={cn(
                      "font-medium",
                      file.complianceScore >= 80 ? "text-green-600" :
                      file.complianceScore >= 60 ? "text-yellow-600" : "text-red-600"
                    )}>
                      {file.complianceScore}% compliance
                    </span>
                  </>
                )}
              </div>

              {/* Agency and Document Type */}
              {agency && (
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs border"
                    style={{
                      backgroundColor: `${agency.color}15`,
                      borderColor: `${agency.color}30`,
                      color: agency.color
                    }}
                  >
                    {agency.icon}
                    {agency.name}
                  </div>
                  {file.suggestedDocumentType && (
                    <Badge variant="outline" className="text-xs">
                      {file.suggestedDocumentType.name}
                    </Badge>
                  )}
                </div>
              )}

              {/* Progress Bar */}
              {file.status === 'uploading' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Uploading...</span>
                    <span>{Math.round(file.progress)}%</span>
                  </div>
                  <Progress value={file.progress} className="h-1" />
                </div>
              )}

              {file.status === 'analyzing' && (
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <Brain className="w-3 h-3 animate-pulse" />
                  Analyzing document...
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={cn(
            "flex items-center justify-between",
            viewMode === 'grid' && "mt-3 pt-3 border-t"
          )}>
            <div className="flex items-center gap-1">
              {file.status === 'completed' && showPreview && file.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </Button>
              )}

              {viewMode === 'grid' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <Info className="w-3 h-3 mr-1" />
                  Details
                </Button>
              )}
            </div>

            {file.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{file.tags.length}</span>
              </div>
            )}
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {showDetails && viewMode === 'grid' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-3 border-t"
              >
                <div className="space-y-2">
                  <Label htmlFor={`description-${file.id}`} className="text-xs">
                    Description
                  </Label>
                  <Textarea
                    id={`description-${file.id}`}
                    placeholder="Add description..."
                    value={file.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    className="text-sm"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tags-${file.id}`} className="text-xs">
                    Tags
                  </Label>
                  <Input
                    id={`tags-${file.id}`}
                    placeholder="Add tags (comma-separated)..."
                    value={file.tags.join(', ')}
                    onChange={(e) => onUpdate({
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    })}
                    className="text-sm"
                  />
                </div>

                {file.requiredActions && file.requiredActions.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-orange-600">Required Actions</Label>
                    <ul className="text-xs space-y-1">
                      {file.requiredActions.map((action, i) => (
                        <li key={i} className="flex items-center gap-2 text-orange-700">
                          <AlertTriangle className="w-3 h-3" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

// Compliance Requirements Checker Component
interface ComplianceRequirementsCheckerProps {
  documents: DocumentFile[];
  selectedAgency: AgencyType | 'ALL';
}

function ComplianceRequirementsChecker({
  documents,
  selectedAgency
}: ComplianceRequirementsCheckerProps) {
  const getAgencyRequirements = (agencyId: AgencyType) => {
    const agency = AGENCY_CATEGORIES.find(a => a.id === agencyId);
    return agency?.documentTypes.filter(dt => dt.required) || [];
  };

  const getDocumentStatus = (docType: DocumentType) => {
    const hasDoc = documents.some(doc =>
      doc.suggestedDocumentType?.id === docType.id && doc.status === 'completed'
    );
    return hasDoc ? 'complete' : 'missing';
  };

  const agenciesToCheck = selectedAgency === 'ALL'
    ? AGENCY_CATEGORIES.filter(a => a.id !== 'OTHER')
    : AGENCY_CATEGORIES.filter(a => a.id === selectedAgency);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Compliance Requirements Checker
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track required documents for regulatory compliance
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={agenciesToCheck[0]?.id} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {agenciesToCheck.map((agency) => (
              <TabsTrigger key={agency.id} value={agency.id} className="text-xs">
                {agency.name.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>

          {agenciesToCheck.map((agency) => (
            <TabsContent key={agency.id} value={agency.id} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                {agency.icon}
                <h3 className="font-medium">{agency.name}</h3>
              </div>

              <div className="space-y-2">
                {getAgencyRequirements(agency.id).map((docType) => {
                  const status = getDocumentStatus(docType);
                  return (
                    <div
                      key={docType.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        status === 'complete'
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {status === 'complete' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{docType.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {docType.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={docType.urgencyLevel === 'critical' ? 'destructive' :
                                   docType.urgencyLevel === 'high' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {docType.urgencyLevel}
                        </Badge>
                        <Badge
                          variant={status === 'complete' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {getAgencyRequirements(agency.id).length === 0 && (
                <p className="text-center text-muted-foreground py-6">
                  No required documents for this agency
                </p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to get file icon
function getFileIcon(fileName: string): React.ReactNode {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension || '')) {
    return <ImageIcon className="w-6 h-6 text-purple-600" />;
  }
  if (['pdf'].includes(extension || '')) {
    return <FileText className="w-6 h-6 text-red-600" />;
  }
  if (['doc', 'docx'].includes(extension || '')) {
    return <FileText className="w-6 h-6 text-blue-600" />;
  }
  if (['xls', 'xlsx'].includes(extension || '')) {
    return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
  }
  return <File className="w-6 h-6 text-gray-600" />;
}

// Export main component and utilities
export { AGENCY_CATEGORIES, type DocumentFile, type AgencyType, type DocumentType };