"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Brain,
  Zap,
  Camera,
  Eye,
  Settings,
  Filter,
  Search,
  Download,
  Share,
  Archive,
  Trash2,
  Star,
  Flag,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Calendar,
  Tag,
  Building,
  Shield,
  Target,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Layers,
  Grid,
  List,
  Plus,
  Minus,
  X,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Info,
  HelpCircle,
  Bookmark,
  Copy,
  Edit3,
  Lock,
  Unlock,
  RefreshCw,
  PlayCircle,
  StopCircle,
  Save,
  Send,
  MessageSquare,
  UserCheck,
  ClipboardList,
  Workflow,
  GitBranch,
  Shuffle,
  FileUp,
  FilePlus,
  FolderOpen,
  Scan,
  ScanLine
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { brandColors, gcmcKajBrand } from '@/styles/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

// Import our smart document components
import { SmartDocumentUploader, AGENCY_CATEGORIES, type DocumentFile as SmartDocumentFile } from './smart-document-uploader';
import { AgencyDocumentSelector, ENHANCED_AGENCY_CATEGORIES, type DocumentTemplate } from './agency-document-selector';
import DocumentPreviewGallery, { type DocumentPreview } from './document-preview-gallery';
import MobileDocumentScanner, { type CapturedDocument, type ScanSettings } from './mobile-document-scanner';
import { DocumentValidation, GUYANESE_VALIDATION_RULES, type ValidationReport } from './document-validation';

// Import existing wizard components
import { WizardProvider, useWizard } from '@/lib/wizard/wizard-context';

// Types for the unified document management system
interface SmartDocument extends SmartDocumentFile {
  // Enhanced properties
  agencyCategory?: string;
  documentTypeId?: string;
  templateId?: string;
  validationReport?: ValidationReport;
  workflowStatus?: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
  assignedTo?: string;
  dueDate?: string;
  notes?: string[];
  attachments?: string[];
  relatedDocuments?: string[];
  digitalSignature?: {
    signed: boolean;
    signedBy?: string;
    signedAt?: string;
    certificate?: string;
  };
  auditTrail?: {
    action: string;
    timestamp: string;
    user: string;
    details?: string;
  }[];
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  assignee?: string;
  dueDate?: string;
  dependencies?: string[];
}

interface DocumentWorkflow {
  id: string;
  name: string;
  description: string;
  agency: string;
  documentType: string;
  steps: WorkflowStep[];
  currentStep: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  estimatedDuration: string;
}

type ViewMode = 'upload' | 'categorize' | 'preview' | 'validate' | 'workflow' | 'scanner';
type LayoutMode = 'modal' | 'sidebar' | 'fullscreen';

interface SmartDocumentManagementProps {
  onDocumentSubmit?: (documents: SmartDocument[]) => Promise<void>;
  onWorkflowComplete?: (workflow: DocumentWorkflow) => void;
  initialDocuments?: SmartDocument[];
  enabledFeatures?: {
    upload: boolean;
    scanner: boolean;
    validation: boolean;
    workflow: boolean;
    preview: boolean;
    categorization: boolean;
  };
  layoutMode?: LayoutMode;
  workflowTemplates?: DocumentWorkflow[];
  className?: string;
}

export function SmartDocumentManagement({
  onDocumentSubmit,
  onWorkflowComplete,
  initialDocuments = [],
  enabledFeatures = {
    upload: true,
    scanner: true,
    validation: true,
    workflow: true,
    preview: true,
    categorization: true
  },
  layoutMode = 'modal',
  workflowTemplates = [],
  className
}: SmartDocumentManagementProps) {
  // State management
  const [documents, setDocuments] = useState<SmartDocument[]>(initialDocuments);
  const [currentView, setCurrentView] = useState<ViewMode>('upload');
  const [selectedDocument, setSelectedDocument] = useState<SmartDocument | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [validationReports, setValidationReports] = useState<ValidationReport[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<DocumentWorkflow | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  // Settings
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [autoValidation, setAutoValidation] = useState(true);
  const [autoWorkflow, setAutoWorkflow] = useState(true);
  const [scannerSettings, setScannerSettings] = useState<ScanSettings>({
    autoCapture: false,
    quality: 'good',
    enhanceContrast: true,
    autoRotate: true,
    autoStraighten: true,
    detectBounds: true,
    flashMode: 'auto',
    resolution: 'high',
    colorMode: 'color',
    compressionLevel: 80
  });

  // Statistics
  const stats = useMemo(() => {
    const totalDocs = documents.length;
    const completedDocs = documents.filter(doc => doc.workflowStatus === 'approved').length;
    const pendingDocs = documents.filter(doc => doc.workflowStatus === 'pending_review').length;
    const errorDocs = validationReports.reduce((count, report) => count + report.errors.length, 0);
    const avgCompliance = validationReports.length > 0
      ? Math.round(validationReports.reduce((sum, report) => sum + report.complianceScore, 0) / validationReports.length)
      : 0;

    const agencyStats = ENHANCED_AGENCY_CATEGORIES.map(agency => ({
      id: agency.id,
      name: agency.shortName,
      count: documents.filter(doc => doc.agencyCategory === agency.id).length,
      color: agency.color
    }));

    return {
      totalDocs,
      completedDocs,
      pendingDocs,
      errorDocs,
      avgCompliance,
      agencyStats
    };
  }, [documents, validationReports]);

  // Handle document upload
  const handleDocumentUpload = useCallback(async (uploadedDocuments: SmartDocumentFile[]) => {
    setIsProcessing(true);
    setProcessingStep('Processing uploaded documents...');
    setProcessingProgress(0);

    try {
      const enhancedDocs: SmartDocument[] = [];

      for (let i = 0; i < uploadedDocuments.length; i++) {
        const doc = uploadedDocuments[i];
        setProcessingProgress(((i + 1) / uploadedDocuments.length) * 100);

        const enhancedDoc: SmartDocument = {
          ...doc,
          agencyCategory: doc.suggestedCategory,
          documentTypeId: doc.suggestedDocumentType?.id,
          workflowStatus: 'draft',
          notes: [],
          attachments: [],
          relatedDocuments: [],
          auditTrail: [
            {
              action: 'uploaded',
              timestamp: new Date().toISOString(),
              user: 'Current User',
              details: `Document uploaded via smart uploader`
            }
          ]
        };

        // Auto-start workflow if enabled
        if (autoWorkflow && enhancedDoc.agencyCategory && enhancedDoc.documentTypeId) {
          const workflow = createWorkflowForDocument(enhancedDoc);
          if (workflow) {
            setActiveWorkflow(workflow);
            enhancedDoc.workflowStatus = 'pending_review';
          }
        }

        enhancedDocs.push(enhancedDoc);

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setDocuments(prev => [...prev, ...enhancedDocs]);

      toast.success(
        `${enhancedDocs.length} document${enhancedDocs.length !== 1 ? 's' : ''} processed successfully`,
        {
          description: autoWorkflow ? 'Workflows automatically initiated' : 'Ready for categorization'
        }
      );

      // Switch to appropriate view
      if (enabledFeatures.validation && autoValidation) {
        setCurrentView('validate');
      } else if (enabledFeatures.categorization) {
        setCurrentView('categorize');
      }

    } catch (error) {
      console.error('Error processing documents:', error);
      toast.error('Failed to process some documents');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setProcessingProgress(0);
    }
  }, [autoWorkflow, autoValidation, enabledFeatures]);

  // Handle document scanning
  const handleDocumentScan = useCallback((scannedDoc: CapturedDocument) => {
    const smartDoc: SmartDocument = {
      id: scannedDoc.id,
      file: new File([scannedDoc.originalImage], `scanned-${scannedDoc.id}.jpg`, { type: 'image/jpeg' }),
      progress: 100,
      status: 'completed',
      url: scannedDoc.processedImage || scannedDoc.originalImage,
      tags: [],
      description: `Scanned document - ${new Date(scannedDoc.timestamp).toLocaleString()}`,
      priority: 'medium',
      complianceScore: scannedDoc.confidence ? Math.round(scannedDoc.confidence * 100) : 75,
      workflowStatus: 'draft',
      notes: [`Scanned using mobile scanner at ${new Date(scannedDoc.timestamp).toLocaleString()}`],
      attachments: [],
      relatedDocuments: [],
      auditTrail: [
        {
          action: 'scanned',
          timestamp: scannedDoc.timestamp,
          user: 'Current User',
          details: `Document scanned using mobile camera with ${scannedDoc.confidence ? Math.round(scannedDoc.confidence * 100) : 75}% confidence`
        }
      ]
    };

    setDocuments(prev => [...prev, smartDoc]);
    setCurrentView('categorize');

    toast.success('Document scanned successfully', {
      description: 'Ready for categorization and processing'
    });
  }, []);

  // Handle validation completion
  const handleValidationComplete = useCallback((reports: ValidationReport[]) => {
    setValidationReports(reports);

    // Update documents with validation results
    setDocuments(prev => prev.map(doc => {
      const report = reports.find(r => r.documentId === doc.id);
      if (report) {
        return {
          ...doc,
          validationReport: report,
          auditTrail: [
            ...(doc.auditTrail || []),
            {
              action: 'validated',
              timestamp: new Date().toISOString(),
              user: 'System',
              details: `Validation completed: ${report.complianceScore}% compliance, ${report.errors.length} errors, ${report.warnings.length} warnings`
            }
          ]
        };
      }
      return doc;
    }));

    const totalErrors = reports.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = reports.reduce((sum, r) => sum + r.warnings.length, 0);

    if (totalErrors > 0) {
      toast.warning(
        `Validation found ${totalErrors} error${totalErrors !== 1 ? 's' : ''}`,
        { description: `Also found ${totalWarnings} warnings` }
      );
    } else if (totalWarnings > 0) {
      toast.success(
        'Validation passed with warnings',
        { description: `${totalWarnings} warning${totalWarnings !== 1 ? 's' : ''} found` }
      );
    } else {
      toast.success('All documents passed validation');
    }
  }, []);

  // Create workflow for document
  const createWorkflowForDocument = useCallback((document: SmartDocument): DocumentWorkflow | null => {
    if (!document.agencyCategory || !document.documentTypeId) return null;

    const agency = ENHANCED_AGENCY_CATEGORIES.find(a => a.id === document.agencyCategory);
    const docType = agency?.documentTypes.find(dt => dt.id === document.documentTypeId);

    if (!agency || !docType) return null;

    const baseSteps: WorkflowStep[] = [
      {
        id: 'review',
        name: 'Document Review',
        description: 'Review document for completeness and accuracy',
        required: true,
        completed: false
      },
      {
        id: 'validation',
        name: 'Compliance Validation',
        description: 'Validate document against regulatory requirements',
        required: true,
        completed: false,
        dependencies: ['review']
      }
    ];

    // Add agency-specific steps
    if (agency.id === 'GRA') {
      baseSteps.push({
        id: 'tax-calculation',
        name: 'Tax Calculation Verification',
        description: 'Verify tax calculations and amounts',
        required: docType.name.toLowerCase().includes('tax'),
        completed: false,
        dependencies: ['validation']
      });
    } else if (agency.id === 'NIS') {
      baseSteps.push({
        id: 'contribution-verification',
        name: 'Contribution Verification',
        description: 'Verify employee contributions and calculations',
        required: docType.name.toLowerCase().includes('contribution'),
        completed: false,
        dependencies: ['validation']
      });
    }

    baseSteps.push({
      id: 'approval',
      name: 'Final Approval',
      description: 'Final approval for submission',
      required: true,
      completed: false,
      dependencies: baseSteps.filter(step => step.required).map(step => step.id)
    });

    return {
      id: `workflow-${document.id}`,
      name: `${agency.name} - ${docType.name}`,
      description: `Processing workflow for ${docType.name} submission to ${agency.name}`,
      agency: agency.id,
      documentType: docType.id,
      steps: baseSteps,
      currentStep: 0,
      status: 'active',
      estimatedDuration: getEstimatedDuration(agency.id, docType.id)
    };
  }, []);

  const getEstimatedDuration = (agency: string, docType: string): string => {
    // Mock duration calculation based on agency and document type
    if (agency === 'IMMIGRATION') return '4-6 weeks';
    if (agency === 'DCRA' && docType.includes('incorporation')) return '2-3 weeks';
    if (agency === 'GRA' && docType.includes('tax')) return '1-2 weeks';
    return '3-5 business days';
  };

  // Handle workflow step completion
  const completeWorkflowStep = useCallback((workflowId: string, stepId: string) => {
    if (!activeWorkflow || activeWorkflow.id !== workflowId) return;

    const updatedWorkflow = {
      ...activeWorkflow,
      steps: activeWorkflow.steps.map(step =>
        step.id === stepId ? { ...step, completed: true } : step
      )
    };

    // Find next step
    const completedStepIndex = activeWorkflow.steps.findIndex(step => step.id === stepId);
    const nextStep = activeWorkflow.steps[completedStepIndex + 1];

    if (nextStep) {
      updatedWorkflow.currentStep = completedStepIndex + 1;
    } else {
      updatedWorkflow.status = 'completed';
      toast.success('Workflow completed successfully');
      onWorkflowComplete?.(updatedWorkflow);
    }

    setActiveWorkflow(updatedWorkflow);
  }, [activeWorkflow, onWorkflowComplete]);

  // Submit documents
  const submitDocuments = useCallback(async () => {
    if (documents.length === 0) {
      toast.error('No documents to submit');
      return;
    }

    try {
      await onDocumentSubmit?.(documents);
      toast.success('Documents submitted successfully');
    } catch (error) {
      toast.error('Failed to submit documents');
      console.error('Submission error:', error);
    }
  }, [documents, onDocumentSubmit]);

  // Render view content
  const renderViewContent = () => {
    switch (currentView) {
      case 'upload':
        return (
          <SmartDocumentUploader
            onUpload={handleDocumentUpload}
            multiple={true}
            enableOCR={true}
            enableMobileCapture={true}
            className="h-full"
          />
        );

      case 'scanner':
        return (
          <MobileDocumentScanner
            onCapture={handleDocumentScan}
            onClose={() => setCurrentView('upload')}
            initialSettings={scannerSettings}
            enableBatchScan={true}
            showProcessing={true}
            className="h-full"
          />
        );

      case 'categorize':
        return (
          <AgencyDocumentSelector
            selectedAgency={selectedAgency}
            selectedDocumentType={selectedDocumentType}
            onAgencyChange={setSelectedAgency}
            onDocumentTypeChange={setSelectedDocumentType}
            onTemplateSelect={(template: DocumentTemplate) => {
              toast.info(`Template selected: ${template.name}`);
            }}
            showTemplates={true}
            showSuggestions={true}
            showStatistics={true}
            className="h-full"
          />
        );

      case 'preview':
        const documentPreviews: DocumentPreview[] = documents.map(doc => ({
          id: doc.id,
          name: doc.file.name,
          url: doc.url || '',
          type: doc.file.type.startsWith('image/') ? 'image' : 'pdf',
          size: doc.file.size,
          uploadDate: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          category: doc.agencyCategory || 'other',
          agency: ENHANCED_AGENCY_CATEGORIES.find(a => a.id === doc.agencyCategory)?.name || 'Other',
          tags: doc.tags || [],
          description: doc.description,
          status: doc.workflowStatus === 'approved' ? 'approved' :
                  doc.workflowStatus === 'rejected' ? 'rejected' :
                  doc.workflowStatus === 'pending_review' ? 'pending' : 'draft',
          complianceScore: doc.complianceScore,
          annotations: [],
          versions: [],
          permissions: {
            canEdit: true,
            canDelete: true,
            canShare: true,
            canAnnotate: true,
            canDownload: true
          },
          metadata: {
            classification: 'internal',
            workflow: activeWorkflow ? {
              status: activeWorkflow.status,
              assignee: 'Current User',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            } : undefined
          }
        }));

        return (
          <DocumentPreviewGallery
            documents={documentPreviews}
            selectedDocument={selectedDocument ? documentPreviews.find(d => d.id === selectedDocument.id) : undefined}
            onDocumentSelect={(doc) => {
              const smartDoc = documents.find(d => d.id === doc.id);
              setSelectedDocument(smartDoc || null);
            }}
            viewMode="grid"
            showToolbar={true}
            showSidebar={true}
            className="h-full"
          />
        );

      case 'validate':
        return (
          <DocumentValidation
            documents={documents.map(doc => ({
              id: doc.id,
              name: doc.file.name,
              size: doc.file.size,
              type: doc.file.type,
              category: doc.agencyCategory,
              agency: ENHANCED_AGENCY_CATEGORIES.find(a => a.id === doc.agencyCategory)?.name,
              tags: doc.tags,
              metadata: doc.metadata
            }))}
            onValidationComplete={handleValidationComplete}
            enableAutoFix={true}
            className="h-full"
          />
        );

      case 'workflow':
        return (
          <WorkflowManagement
            workflow={activeWorkflow}
            documents={documents}
            onStepComplete={completeWorkflowStep}
            onWorkflowUpdate={setActiveWorkflow}
            className="h-full"
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a View</h3>
              <p className="text-gray-600">Choose a view from the navigation to get started</p>
            </div>
          </div>
        );
    }
  };

  // Main render based on layout mode
  if (layoutMode === 'modal') {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Smart Document Manager
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-7xl h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-600" />
              Smart Document Management System
            </DialogTitle>
            <DialogDescription>
              AI-powered document processing for Guyanese regulatory compliance
            </DialogDescription>
          </DialogHeader>
          <SmartDocumentInterface />
        </DialogContent>
      </Dialog>
    );
  }

  if (layoutMode === 'sidebar') {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:w-[800px] p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" />
              Document Manager
            </SheetTitle>
          </SheetHeader>
          <SmartDocumentInterface />
        </SheetContent>
      </Sheet>
    );
  }

  // Fullscreen layout
  return (
    <div className={cn("h-full bg-gray-50", className)}>
      <SmartDocumentInterface />
    </div>
  );

  // Internal interface component
  function SmartDocumentInterface() {
    return (
      <div className="flex flex-col h-full">
        {/* Processing Overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            >
              <Card className="bg-white">
                <CardContent className="p-6 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 mx-auto mb-4"
                  >
                    <Brain className="w-full h-full text-blue-600" />
                  </motion.div>
                  <p className="font-medium mb-2">{processingStep}</p>
                  <Progress value={processingProgress} className="w-64 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {Math.round(processingProgress)}% complete
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="p-6 border-b bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Smart Document Management</h1>
              <p className="text-muted-foreground">
                Intelligent processing for Guyanese regulatory compliance
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {stats.totalDocs} documents
              </Badge>
              <Badge variant="outline" className="text-xs">
                {stats.avgCompliance}% avg compliance
              </Badge>
              {documents.length > 0 && (
                <Button onClick={submitDocuments}>
                  <Send className="w-4 h-4 mr-2" />
                  Submit All
                </Button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            {enabledFeatures.upload && (
              <Button
                variant={currentView === 'upload' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('upload')}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            )}

            {enabledFeatures.scanner && (
              <Button
                variant={currentView === 'scanner' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('scanner')}
              >
                <Camera className="w-4 h-4 mr-2" />
                Scanner
              </Button>
            )}

            {enabledFeatures.categorization && (
              <Button
                variant={currentView === 'categorize' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('categorize')}
              >
                <Building className="w-4 h-4 mr-2" />
                Categorize
              </Button>
            )}

            {enabledFeatures.preview && (
              <Button
                variant={currentView === 'preview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('preview')}
                disabled={documents.length === 0}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}

            {enabledFeatures.validation && (
              <Button
                variant={currentView === 'validate' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('validate')}
                disabled={documents.length === 0}
              >
                <Shield className="w-4 h-4 mr-2" />
                Validate
              </Button>
            )}

            {enabledFeatures.workflow && (
              <Button
                variant={currentView === 'workflow' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('workflow')}
                disabled={!activeWorkflow}
              >
                <Workflow className="w-4 h-4 mr-2" />
                Workflow
              </Button>
            )}

            <Separator orientation="vertical" className="h-6 mx-2" />

            {/* Settings */}
            <SmartDocumentSettings
              autoValidation={autoValidation}
              onAutoValidationChange={setAutoValidation}
              autoWorkflow={autoWorkflow}
              onAutoWorkflowChange={setAutoWorkflow}
              scannerSettings={scannerSettings}
              onScannerSettingsChange={setScannerSettings}
            />
          </div>
        </div>

        {/* Stats Bar */}
        {documents.length > 0 && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-blue-600">{stats.totalDocs}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-green-600">{stats.completedDocs}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-yellow-600">{stats.pendingDocs}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-red-600">{stats.errorDocs}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-purple-600">{stats.avgCompliance}%</p>
                <p className="text-xs text-muted-foreground">Compliance</p>
              </div>
              <div className="text-center">
                <div className="flex gap-1 justify-center">
                  {stats.agencyStats.slice(0, 4).map(agency => (
                    <TooltipProvider key={agency.id}>
                      <Tooltip>
                        <TooltipTrigger>
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: agency.color }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          {agency.name}: {agency.count}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Agencies</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {renderViewContent()}
        </div>
      </div>
    );
  }
}

// Settings Component
interface SmartDocumentSettingsProps {
  autoValidation: boolean;
  onAutoValidationChange: (enabled: boolean) => void;
  autoWorkflow: boolean;
  onAutoWorkflowChange: (enabled: boolean) => void;
  scannerSettings: ScanSettings;
  onScannerSettingsChange: (settings: ScanSettings) => void;
}

function SmartDocumentSettings({
  autoValidation,
  onAutoValidationChange,
  autoWorkflow,
  onAutoWorkflowChange,
  scannerSettings,
  onScannerSettingsChange
}: SmartDocumentSettingsProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Smart Document Settings</DialogTitle>
          <DialogDescription>
            Configure automated features and processing options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Automation</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-validation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically validate documents after upload
                  </p>
                </div>
                <Switch
                  checked={autoValidation}
                  onCheckedChange={onAutoValidationChange}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-workflow</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically start workflows based on document type
                  </p>
                </div>
                <Switch
                  checked={autoWorkflow}
                  onCheckedChange={onAutoWorkflowChange}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium">Scanner Settings</h3>
            <div className="space-y-3">
              <div>
                <Label>Quality</Label>
                <Select
                  value={scannerSettings.quality}
                  onValueChange={(value) => onScannerSettingsChange({
                    ...scannerSettings,
                    quality: value as any
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft (fast)</SelectItem>
                    <SelectItem value="good">Good (balanced)</SelectItem>
                    <SelectItem value="excellent">Excellent (slow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Auto-capture</Label>
                <Switch
                  checked={scannerSettings.autoCapture}
                  onCheckedChange={(checked) => onScannerSettingsChange({
                    ...scannerSettings,
                    autoCapture: checked
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Enhance contrast</Label>
                <Switch
                  checked={scannerSettings.enhanceContrast}
                  onCheckedChange={(checked) => onScannerSettingsChange({
                    ...scannerSettings,
                    enhanceContrast: checked
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Workflow Management Component
interface WorkflowManagementProps {
  workflow: DocumentWorkflow | null;
  documents: SmartDocument[];
  onStepComplete: (workflowId: string, stepId: string) => void;
  onWorkflowUpdate: (workflow: DocumentWorkflow) => void;
  className?: string;
}

function WorkflowManagement({
  workflow,
  documents,
  onStepComplete,
  onWorkflowUpdate,
  className
}: WorkflowManagementProps) {
  if (!workflow) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center">
          <Workflow className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Workflow</h3>
          <p className="text-gray-600">Upload and categorize documents to start a workflow</p>
        </div>
      </div>
    );
  }

  const completedSteps = workflow.steps.filter(step => step.completed).length;
  const progress = (completedSteps / workflow.steps.length) * 100;

  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-blue-600" />
                {workflow.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{workflow.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={
                workflow.status === 'completed' ? 'default' :
                workflow.status === 'active' ? 'secondary' : 'outline'
              }>
                {workflow.status}
              </Badge>
              <Badge variant="outline">
                {workflow.estimatedDuration}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{completedSteps}/{workflow.steps.length} steps</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building className="w-4 h-4" />
                {ENHANCED_AGENCY_CATEGORIES.find(a => a.id === workflow.agency)?.name}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Started today
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <div className="space-y-4">
        {workflow.steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn(
              "transition-all duration-200",
              step.completed ? "border-green-200 bg-green-50" :
              index === workflow.currentStep ? "border-blue-200 bg-blue-50" :
              "border-gray-200"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      step.completed ? "bg-green-600 text-white" :
                      index === workflow.currentStep ? "bg-blue-600 text-white" :
                      "bg-gray-200 text-gray-600"
                    )}>
                      {step.completed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    <div>
                      <h3 className={cn(
                        "font-medium",
                        step.completed ? "text-green-900" :
                        index === workflow.currentStep ? "text-blue-900" :
                        "text-gray-900"
                      )}>
                        {step.name}
                        {step.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {step.dependencies && step.dependencies.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Depends on: {step.dependencies.map(dep =>
                            workflow.steps.find(s => s.id === dep)?.name
                          ).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {step.assignee && (
                      <Badge variant="outline" className="text-xs">
                        {step.assignee}
                      </Badge>
                    )}

                    {step.dueDate && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(step.dueDate).toLocaleDateString()}
                      </Badge>
                    )}

                    {!step.completed && index === workflow.currentStep && (
                      <Button
                        size="sm"
                        onClick={() => onStepComplete(workflow.id, step.id)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default SmartDocumentManagement;
export { type SmartDocument, type DocumentWorkflow };