/**
 * Transition Workflow Management Service
 *
 * Manages step-by-step migration workflows for traditional accounting practitioners
 * transitioning to digital systems. Provides guided workflows, progress tracking,
 * and training integration to ensure successful platform adoption.
 */

import prisma from "@GCMC-KAJ/db";
import type {
  TransitionWorkflowTemplate,
  TransitionWorkflowExecution,
  Client,
  DocumentMigrationProject
} from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";

/**
 * Workflow types for different transition scenarios
 */
export enum WorkflowType {
  CLIENT_ONBOARDING = "client_onboarding",
  DOCUMENT_MIGRATION = "document_migration",
  SYSTEM_TRAINING = "system_training",
  COMPLIANCE_SETUP = "compliance_setup",
  DATA_VALIDATION = "data_validation",
  TEAM_TRAINING = "team_training",
  LEGACY_CLEANUP = "legacy_cleanup",
  GO_LIVE = "go_live"
}

/**
 * Step types within workflows
 */
export enum StepType {
  MANUAL_TASK = "manual_task",
  DOCUMENT_SCAN = "document_scan",
  DATA_ENTRY = "data_entry",
  SYSTEM_CONFIG = "system_config",
  TRAINING = "training",
  VALIDATION = "validation",
  APPROVAL = "approval",
  NOTIFICATION = "notification"
}

/**
 * Step status tracking
 */
export enum StepStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  SKIPPED = "skipped",
  BLOCKED = "blocked"
}

/**
 * Workflow execution status
 */
export enum WorkflowExecutionStatus {
  PENDING = "pending",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  FAILED = "failed",
  ON_HOLD = "on_hold"
}

/**
 * Workflow step definition
 */
interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  type: StepType;
  estimatedDuration: number; // in minutes
  prerequisiteSteps: string[]; // Step IDs that must complete first
  assignedRole?: string;
  instructions: string;
  checklistItems: string[];
  validationCriteria: {
    field: string;
    condition: string;
    value: any;
  }[];
  resources: {
    type: 'document' | 'video' | 'link' | 'template';
    title: string;
    url?: string;
    content?: string;
  }[];
  automationConfig?: {
    type: 'api_call' | 'email' | 'notification';
    config: Record<string, any>;
  };
  skipConditions?: {
    field: string;
    condition: string;
    value: any;
  }[];
}

/**
 * Workflow template configuration
 */
interface WorkflowTemplateConfig {
  name: string;
  description: string;
  workflowType: WorkflowType;
  clientTypes: string[];
  steps: WorkflowStep[];
  estimatedDuration: number; // Total duration in days
  requiredSkills: string[];
  successCriteria: string[];
  checklistItems: string[];
  resources: string[];
}

/**
 * Step execution result
 */
interface StepExecutionResult {
  stepId: string;
  status: StepStatus;
  completedAt?: Date;
  duration: number; // in minutes
  notes?: string;
  outputs?: Record<string, any>;
  validationResults?: {
    passed: boolean;
    errors: string[];
    warnings: string[];
  };
  nextSteps: string[]; // Next steps to activate
}

/**
 * Progress reporting structure
 */
interface WorkflowProgress {
  executionId: number;
  templateName: string;
  currentStep: {
    id: string;
    title: string;
    status: StepStatus;
    estimatedCompletion: Date;
  };
  overallProgress: {
    totalSteps: number;
    completedSteps: number;
    percentage: number;
    estimatedCompletion: Date;
    timeSpent: number; // in hours
    timeRemaining: number; // in hours
  };
  recentActivities: {
    stepId: string;
    stepTitle: string;
    action: string;
    timestamp: Date;
    user: string;
  }[];
  blockers: {
    stepId: string;
    stepTitle: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
    assignedTo?: string;
  }[];
  upcomingMilestones: {
    stepId: string;
    title: string;
    dueDate: Date;
    priority: string;
  }[];
}

/**
 * Main Transition Workflow Service
 */
export class TransitionWorkflowService {

  // ============================================================================
  // WORKFLOW TEMPLATE MANAGEMENT
  // ============================================================================

  /**
   * Create a new workflow template
   */
  static async createWorkflowTemplate(
    tenantId: number,
    templateConfig: WorkflowTemplateConfig,
    userId: string
  ): Promise<TransitionWorkflowTemplate> {

    // Validate workflow steps
    this.validateWorkflowSteps(templateConfig.steps);

    const template = await prisma.transitionWorkflowTemplate.create({
      data: {
        tenantId,
        name: templateConfig.name,
        description: templateConfig.description,
        workflowType: templateConfig.workflowType,
        clientTypes: templateConfig.clientTypes,
        steps: templateConfig.steps,
        estimatedDuration: templateConfig.estimatedDuration,
        requiredSkills: templateConfig.requiredSkills,
        checklistItems: templateConfig.checklistItems,
        successCriteria: templateConfig.successCriteria,
        metadata: {
          resources: templateConfig.resources,
          version: "1.0"
        },
        createdBy: userId,
      }
    });

    return template;
  }

  /**
   * Get predefined workflow templates for common scenarios
   */
  static getPredefinedTemplates(): WorkflowTemplateConfig[] {
    return [
      {
        name: "Traditional Accounting Practice Digital Transition",
        description: "Complete workflow for transitioning from physical file management to digital platform",
        workflowType: WorkflowType.DOCUMENT_MIGRATION,
        clientTypes: ["individual", "small_business", "company"],
        estimatedDuration: 45, // 45 days
        requiredSkills: ["document_scanning", "data_entry", "client_communication"],
        successCriteria: [
          "All physical documents digitized",
          "Client portal access configured",
          "Staff trained on new system",
          "Legacy system data migrated",
          "Quality assurance completed"
        ],
        checklistItems: [
          "Physical document inventory completed",
          "Digital filing structure created",
          "OCR processing quality verified",
          "Client approval received",
          "Backup procedures tested"
        ],
        resources: [
          "Document scanning guidelines",
          "OCR best practices",
          "Client communication templates",
          "Quality control checklists"
        ],
        steps: [
          {
            id: "inventory_assessment",
            title: "Physical Document Inventory Assessment",
            description: "Catalog and assess all physical documents for digitization",
            type: StepType.MANUAL_TASK,
            estimatedDuration: 480, // 8 hours
            prerequisiteSteps: [],
            assignedRole: "document_specialist",
            instructions: "Complete a comprehensive inventory of all client physical documents, categorizing by type, condition, and priority for digitization.",
            checklistItems: [
              "Count total documents by category",
              "Assess document condition (excellent, good, fair, poor)",
              "Identify special handling requirements",
              "Create location mapping (cabinet, drawer, folder)",
              "Flag documents requiring immediate attention"
            ],
            validationCriteria: [
              {
                field: "total_documents",
                condition: "greater_than",
                value: 0
              },
              {
                field: "categories_identified",
                condition: "greater_than",
                value: 3
              }
            ],
            resources: [
              {
                type: "template",
                title: "Document Inventory Spreadsheet",
                content: "Excel template for cataloging physical documents"
              },
              {
                type: "video",
                title: "Document Assessment Training",
                url: "https://training.gcmckaj.com/document-assessment"
              }
            ]
          },

          {
            id: "digital_structure_setup",
            title: "Digital Filing Structure Setup",
            description: "Create organized digital folder structure mirroring familiar file cabinet organization",
            type: StepType.SYSTEM_CONFIG,
            estimatedDuration: 240, // 4 hours
            prerequisiteSteps: ["inventory_assessment"],
            assignedRole: "system_admin",
            instructions: "Set up digital folder hierarchy that follows traditional filing cabinet structure to ensure familiar navigation for staff.",
            checklistItems: [
              "Create client folder structure",
              "Set up document type categories",
              "Configure access permissions",
              "Test folder navigation",
              "Document naming conventions established"
            ],
            validationCriteria: [
              {
                field: "folder_structure_created",
                condition: "equals",
                value: true
              }
            ],
            resources: [
              {
                type: "document",
                title: "Digital Filing Best Practices",
                content: "Guidelines for organizing digital documents"
              }
            ]
          },

          {
            id: "scanning_workflow_setup",
            title: "Document Scanning Workflow Configuration",
            description: "Configure OCR settings and scanning procedures optimized for Guyanese documents",
            type: StepType.SYSTEM_CONFIG,
            estimatedDuration: 120, // 2 hours
            prerequisiteSteps: ["digital_structure_setup"],
            assignedRole: "technical_specialist",
            instructions: "Configure scanning equipment and OCR software for optimal recognition of Guyanese government forms, business documents, and local content.",
            checklistItems: [
              "Scanner resolution set to 600 DPI minimum",
              "OCR language settings configured for English",
              "Guyanese document templates loaded",
              "Quality control thresholds set",
              "Batch processing workflows activated"
            ],
            validationCriteria: [
              {
                field: "ocr_accuracy_threshold",
                condition: "greater_than",
                value: 85
              }
            ],
            resources: [
              {
                type: "document",
                title: "Guyanese OCR Configuration Guide",
                content: "Specific settings for optimal OCR accuracy on local documents"
              }
            ]
          },

          {
            id: "staff_training_basic",
            title: "Basic Staff Training Session",
            description: "Train staff on new digital workflows while maintaining familiarity with traditional processes",
            type: StepType.TRAINING,
            estimatedDuration: 360, // 6 hours
            prerequisiteSteps: ["scanning_workflow_setup"],
            assignedRole: "training_coordinator",
            instructions: "Conduct hands-on training that bridges traditional filing methods with digital workflows, ensuring staff comfort with the transition.",
            checklistItems: [
              "Digital navigation training completed",
              "Document upload procedures practiced",
              "Search and retrieval methods demonstrated",
              "Quality control processes learned",
              "Backup procedures understood"
            ],
            validationCriteria: [
              {
                field: "staff_competency_score",
                condition: "greater_than",
                value: 80
              }
            ],
            resources: [
              {
                type: "video",
                title: "Digital Transition Training Series",
                url: "https://training.gcmckaj.com/basic-digital-workflow"
              },
              {
                type: "template",
                title: "Training Progress Tracker",
                content: "Template for tracking individual staff progress"
              }
            ]
          },

          {
            id: "pilot_scanning_batch",
            title: "Pilot Document Scanning Batch",
            description: "Process a small batch of documents to test and refine the digitization workflow",
            type: StepType.DOCUMENT_SCAN,
            estimatedDuration: 480, // 8 hours
            prerequisiteSteps: ["staff_training_basic"],
            assignedRole: "document_specialist",
            instructions: "Select 50-100 representative documents for pilot scanning to identify any workflow issues and train staff on real documents.",
            checklistItems: [
              "Pilot batch documents selected",
              "Scanning completed with quality checks",
              "OCR accuracy verified",
              "Digital filing completed",
              "Process improvements identified"
            ],
            validationCriteria: [
              {
                field: "pilot_documents_processed",
                condition: "greater_than",
                value: 50
              },
              {
                field: "average_quality_score",
                condition: "greater_than",
                value: 90
              }
            ],
            resources: [
              {
                type: "template",
                title: "Pilot Batch Evaluation Form",
                content: "Form for recording pilot batch results and improvements"
              }
            ]
          },

          {
            id: "client_portal_setup",
            title: "Client Portal Configuration",
            description: "Set up client access to their digitized documents with familiar navigation",
            type: StepType.SYSTEM_CONFIG,
            estimatedDuration: 180, // 3 hours
            prerequisiteSteps: ["pilot_scanning_batch"],
            assignedRole: "system_admin",
            instructions: "Configure client portal with intuitive navigation that mimics traditional document organization, ensuring clients can easily find their documents.",
            checklistItems: [
              "Client accounts created",
              "Document access permissions set",
              "Navigation customized for client familiarity",
              "Mobile access configured",
              "Support documentation provided"
            ],
            validationCriteria: [
              {
                field: "portal_accessible",
                condition: "equals",
                value: true
              }
            ],
            resources: [
              {
                type: "document",
                title: "Client Portal Configuration Guide",
                content: "Step-by-step portal setup instructions"
              }
            ]
          },

          {
            id: "legacy_data_migration",
            title: "Legacy System Data Migration",
            description: "Migrate existing client data from spreadsheets, QuickBooks, or other legacy systems",
            type: StepType.DATA_ENTRY,
            estimatedDuration: 720, // 12 hours
            prerequisiteSteps: ["client_portal_setup"],
            assignedRole: "data_specialist",
            instructions: "Import and validate existing client data from legacy systems, ensuring data integrity and completeness.",
            checklistItems: [
              "Legacy data exported and cleaned",
              "Data mapping validated",
              "Import process executed",
              "Data quality verified",
              "Duplicate records resolved"
            ],
            validationCriteria: [
              {
                field: "data_accuracy_rate",
                condition: "greater_than",
                value: 95
              }
            ],
            resources: [
              {
                type: "template",
                title: "Legacy Data Migration Checklist",
                content: "Comprehensive checklist for data migration process"
              }
            ]
          },

          {
            id: "bulk_document_processing",
            title: "Bulk Document Digitization",
            description: "Process the majority of physical documents using established workflows",
            type: StepType.DOCUMENT_SCAN,
            estimatedDuration: 2400, // 40 hours (spread over multiple days)
            prerequisiteSteps: ["legacy_data_migration"],
            assignedRole: "document_team",
            instructions: "Execute full-scale document digitization using proven workflows from pilot phase, maintaining quality and efficiency standards.",
            checklistItems: [
              "Batch processing schedules created",
              "Quality control checkpoints implemented",
              "Progress tracking systems active",
              "Client notification procedures followed",
              "Exception handling processes tested"
            ],
            validationCriteria: [
              {
                field: "processing_completion_rate",
                condition: "greater_than",
                value: 95
              }
            ],
            resources: [
              {
                type: "template",
                title: "Bulk Processing Tracker",
                content: "Spreadsheet for tracking bulk digitization progress"
              }
            ]
          },

          {
            id: "quality_assurance_review",
            title: "Comprehensive Quality Assurance",
            description: "Systematic review of all digitized documents and data integrity",
            type: StepType.VALIDATION,
            estimatedDuration: 480, // 8 hours
            prerequisiteSteps: ["bulk_document_processing"],
            assignedRole: "quality_specialist",
            instructions: "Conduct thorough quality review of digitized documents, data accuracy, and system functionality before client rollout.",
            checklistItems: [
              "Random document sampling completed",
              "OCR accuracy verification performed",
              "Data integrity checks passed",
              "System performance validated",
              "Client access testing successful"
            ],
            validationCriteria: [
              {
                field: "quality_score",
                condition: "greater_than",
                value: 95
              }
            ],
            resources: [
              {
                type: "template",
                title: "QA Review Checklist",
                content: "Comprehensive quality assurance checklist"
              }
            ]
          },

          {
            id: "client_transition_training",
            title: "Client Transition Training",
            description: "Train clients on accessing and using their new digital document portal",
            type: StepType.TRAINING,
            estimatedDuration: 240, // 4 hours
            prerequisiteSteps: ["quality_assurance_review"],
            assignedRole: "client_success_specialist",
            instructions: "Provide personalized training to clients on their new digital portal, ensuring comfort and competence with the new system.",
            checklistItems: [
              "Individual client training sessions scheduled",
              "Portal navigation demonstrated",
              "Document search training provided",
              "Mobile access configured",
              "Support resources shared"
            ],
            validationCriteria: [
              {
                field: "client_satisfaction_score",
                condition: "greater_than",
                value: 80
              }
            ],
            resources: [
              {
                type: "video",
                title: "Client Portal User Guide",
                url: "https://training.gcmckaj.com/client-portal-guide"
              }
            ]
          },

          {
            id: "go_live_execution",
            title: "Go-Live and System Activation",
            description: "Activate the new digital system and transition from legacy processes",
            type: StepType.SYSTEM_CONFIG,
            estimatedDuration: 180, // 3 hours
            prerequisiteSteps: ["client_transition_training"],
            assignedRole: "project_manager",
            instructions: "Execute the transition to full digital operations, ensuring all systems are operational and all stakeholders are ready.",
            checklistItems: [
              "System cutover completed",
              "All stakeholders notified",
              "Support procedures activated",
              "Monitoring systems enabled",
              "Rollback procedures ready"
            ],
            validationCriteria: [
              {
                field: "system_operational",
                condition: "equals",
                value: true
              }
            ],
            resources: [
              {
                type: "template",
                title: "Go-Live Checklist",
                content: "Final checklist for system activation"
              }
            ]
          },

          {
            id: "post_transition_support",
            title: "Post-Transition Support Period",
            description: "Provide intensive support during the first weeks after go-live",
            type: StepType.MANUAL_TASK,
            estimatedDuration: 720, // 12 hours (spread over 2 weeks)
            prerequisiteSteps: ["go_live_execution"],
            assignedRole: "support_team",
            instructions: "Provide enhanced support during the critical first weeks after transition, ensuring rapid resolution of any issues.",
            checklistItems: [
              "Daily check-ins scheduled",
              "Issue tracking system active",
              "Performance monitoring in place",
              "User feedback collection ongoing",
              "Process refinements implemented"
            ],
            validationCriteria: [
              {
                field: "system_stability",
                condition: "greater_than",
                value: 95
              }
            ],
            resources: [
              {
                type: "template",
                title: "Post-Go-Live Support Log",
                content: "Template for tracking post-transition support activities"
              }
            ]
          }
        ]
      },

      // Additional simplified templates for different scenarios
      {
        name: "Individual Client Digital Onboarding",
        description: "Streamlined workflow for onboarding individual clients to digital platform",
        workflowType: WorkflowType.CLIENT_ONBOARDING,
        clientTypes: ["individual"],
        estimatedDuration: 7, // 1 week
        requiredSkills: ["client_communication", "system_navigation"],
        successCriteria: [
          "Client portal access configured",
          "Documents uploaded and organized",
          "Client trained on basic features"
        ],
        checklistItems: [
          "Account created",
          "Initial documents uploaded",
          "Navigation training completed"
        ],
        resources: ["Quick start guide", "Video tutorials"],
        steps: [
          {
            id: "account_setup",
            title: "Client Account Setup",
            description: "Create client account and configure basic settings",
            type: StepType.SYSTEM_CONFIG,
            estimatedDuration: 30,
            prerequisiteSteps: [],
            assignedRole: "admin",
            instructions: "Set up new client account with appropriate permissions and settings.",
            checklistItems: [
              "Account created",
              "Permissions configured",
              "Welcome email sent"
            ],
            validationCriteria: [
              {
                field: "account_active",
                condition: "equals",
                value: true
              }
            ],
            resources: [
              {
                type: "template",
                title: "Account Setup Checklist",
                content: "Step-by-step account creation guide"
              }
            ]
          }
        ]
      }
    ];
  }

  // ============================================================================
  // WORKFLOW EXECUTION
  // ============================================================================

  /**
   * Start a new workflow execution from a template
   */
  static async startWorkflowExecution(
    tenantId: number,
    templateId: number,
    executionConfig: {
      name: string;
      clientId?: number;
      migrationProjectId?: number;
      assignedTo?: string;
      supervisorId?: string;
      scheduledStart?: Date;
      customizations?: {
        skipSteps?: string[];
        additionalSteps?: WorkflowStep[];
        modifiedSteps?: Partial<WorkflowStep>[];
      };
    },
    userId: string
  ): Promise<TransitionWorkflowExecution> {

    const template = await prisma.transitionWorkflowTemplate.findUnique({
      where: { id: templateId, tenantId }
    });

    if (!template) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workflow template not found"
      });
    }

    // Process template steps with customizations
    let steps = [...(template.steps as WorkflowStep[])];

    if (executionConfig.customizations) {
      const { skipSteps, additionalSteps, modifiedSteps } = executionConfig.customizations;

      // Remove skipped steps
      if (skipSteps) {
        steps = steps.filter(step => !skipSteps.includes(step.id));
      }

      // Add additional steps
      if (additionalSteps) {
        steps = [...steps, ...additionalSteps];
      }

      // Modify existing steps
      if (modifiedSteps) {
        modifiedSteps.forEach(modification => {
          const stepIndex = steps.findIndex(step => step.id === modification.id);
          if (stepIndex >= 0) {
            steps[stepIndex] = { ...steps[stepIndex], ...modification };
          }
        });
      }
    }

    // Initialize step statuses
    const stepStatuses = steps.map(step => ({
      stepId: step.id,
      status: StepStatus.PENDING,
      assignedTo: step.assignedRole,
      notes: "",
      completedAt: null,
      outputs: {}
    }));

    // Activate first steps (those with no prerequisites)
    const firstSteps = steps.filter(step => step.prerequisiteSteps.length === 0);
    firstSteps.forEach(step => {
      const statusIndex = stepStatuses.findIndex(s => s.stepId === step.id);
      if (statusIndex >= 0) {
        stepStatuses[statusIndex].status = StepStatus.IN_PROGRESS;
      }
    });

    const execution = await prisma.transitionWorkflowExecution.create({
      data: {
        tenantId,
        templateId,
        clientId: executionConfig.clientId,
        migrationProjectId: executionConfig.migrationProjectId,
        name: executionConfig.name,
        status: WorkflowExecutionStatus.ACTIVE,
        totalSteps: steps.length,
        currentStepIndex: 0,
        assignedTo: executionConfig.assignedTo,
        supervisorId: executionConfig.supervisorId,
        startedAt: new Date(),
        scheduledCompletion: this.calculateScheduledCompletion(steps, executionConfig.scheduledStart),
        stepStatuses: stepStatuses,
        metadata: {
          customizations: executionConfig.customizations,
          steps: steps
        }
      }
    });

    // Update template usage statistics
    await prisma.transitionWorkflowTemplate.update({
      where: { id: templateId },
      data: {
        timesUsed: { increment: 1 }
      }
    });

    return execution;
  }

  /**
   * Execute a workflow step
   */
  static async executeStep(
    tenantId: number,
    executionId: number,
    stepId: string,
    execution: {
      notes?: string;
      outputs?: Record<string, any>;
      duration?: number;
      validationOverride?: boolean;
    },
    userId: string
  ): Promise<StepExecutionResult> {

    const workflowExecution = await prisma.transitionWorkflowExecution.findUnique({
      where: { id: executionId, tenantId }
    });

    if (!workflowExecution) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workflow execution not found"
      });
    }

    const steps = (workflowExecution.metadata as any).steps as WorkflowStep[];
    const stepStatuses = workflowExecution.stepStatuses as any[];

    const step = steps.find(s => s.id === stepId);
    const stepStatusIndex = stepStatuses.findIndex(s => s.stepId === stepId);

    if (!step || stepStatusIndex < 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Step not found in workflow"
      });
    }

    const stepStatus = stepStatuses[stepStatusIndex];

    if (stepStatus.status !== StepStatus.IN_PROGRESS) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Step is not in progress"
      });
    }

    // Validate step completion (unless overridden)
    let validationResults = { passed: true, errors: [], warnings: [] };

    if (!execution.validationOverride && step.validationCriteria) {
      validationResults = await this.validateStepCompletion(
        step,
        execution.outputs || {},
        workflowExecution
      );
    }

    const completedAt = new Date();
    const actualDuration = execution.duration || step.estimatedDuration;

    // Update step status
    stepStatus.status = validationResults.passed ? StepStatus.COMPLETED : StepStatus.FAILED;
    stepStatus.completedAt = completedAt;
    stepStatus.notes = execution.notes || "";
    stepStatus.outputs = execution.outputs || {};

    // Determine next steps to activate
    const nextSteps: string[] = [];

    if (validationResults.passed) {
      // Find steps that have this step as a prerequisite
      const dependentSteps = steps.filter(s => s.prerequisiteSteps.includes(stepId));

      for (const dependentStep of dependentSteps) {
        // Check if all prerequisites for this dependent step are completed
        const allPrerequisitesCompleted = dependentStep.prerequisiteSteps.every(prereqId => {
          const prereqStatus = stepStatuses.find(s => s.stepId === prereqId);
          return prereqStatus?.status === StepStatus.COMPLETED;
        });

        if (allPrerequisitesCompleted) {
          // Check skip conditions
          const shouldSkip = await this.evaluateSkipConditions(
            dependentStep,
            workflowExecution
          );

          if (shouldSkip) {
            // Mark step as skipped
            const dependentStatusIndex = stepStatuses.findIndex(s => s.stepId === dependentStep.id);
            if (dependentStatusIndex >= 0) {
              stepStatuses[dependentStatusIndex].status = StepStatus.SKIPPED;
            }
          } else {
            // Activate the step
            const dependentStatusIndex = stepStatuses.findIndex(s => s.stepId === dependentStep.id);
            if (dependentStatusIndex >= 0) {
              stepStatuses[dependentStatusIndex].status = StepStatus.IN_PROGRESS;
              nextSteps.push(dependentStep.id);
            }
          }
        }
      }
    }

    // Calculate overall progress
    const completedSteps = stepStatuses.filter(s =>
      s.status === StepStatus.COMPLETED || s.status === StepStatus.SKIPPED
    ).length;

    const progressPercentage = Math.round((completedSteps / steps.length) * 100);

    // Check if workflow is complete
    const workflowComplete = completedSteps === steps.length;
    const workflowStatus = workflowComplete
      ? WorkflowExecutionStatus.COMPLETED
      : WorkflowExecutionStatus.ACTIVE;

    // Update workflow execution
    const updatedExecution = await prisma.transitionWorkflowExecution.update({
      where: { id: executionId },
      data: {
        stepStatuses: stepStatuses,
        completedSteps,
        progressPercentage,
        status: workflowStatus,
        actualCompletion: workflowComplete ? completedAt : undefined,
        updatedAt: new Date(),
      }
    });

    // Execute automation if configured
    if (step.automationConfig && validationResults.passed) {
      await this.executeStepAutomation(step.automationConfig, workflowExecution, execution.outputs);
    }

    // Update template statistics
    if (validationResults.passed) {
      await this.updateTemplateStatistics(workflowExecution.templateId, actualDuration);
    }

    return {
      stepId,
      status: stepStatus.status as StepStatus,
      completedAt: completedAt,
      duration: actualDuration,
      notes: execution.notes,
      outputs: execution.outputs,
      validationResults,
      nextSteps
    };
  }

  /**
   * Get workflow progress report
   */
  static async getWorkflowProgress(
    tenantId: number,
    executionId: number
  ): Promise<WorkflowProgress> {

    const execution = await prisma.transitionWorkflowExecution.findUnique({
      where: { id: executionId, tenantId },
      include: {
        template: true,
        client: { select: { id: true, name: true } }
      }
    });

    if (!execution) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workflow execution not found"
      });
    }

    const steps = (execution.metadata as any).steps as WorkflowStep[];
    const stepStatuses = execution.stepStatuses as any[];

    // Find current step
    const currentStepStatus = stepStatuses.find(s => s.status === StepStatus.IN_PROGRESS);
    const currentStep = currentStepStatus
      ? steps.find(s => s.id === currentStepStatus.stepId)
      : null;

    // Calculate time metrics
    const startTime = execution.startedAt?.getTime() || Date.now();
    const currentTime = Date.now();
    const timeSpent = (currentTime - startTime) / (1000 * 60 * 60); // hours

    const remainingSteps = stepStatuses.filter(s => s.status === StepStatus.PENDING).length;
    const avgTimePerStep = timeSpent / Math.max(1, execution.completedSteps);
    const timeRemaining = remainingSteps * avgTimePerStep;

    // Get recent activities (simulated - would come from audit logs in real system)
    const recentActivities = stepStatuses
      .filter(s => s.completedAt)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 5)
      .map(s => {
        const step = steps.find(st => st.id === s.stepId);
        return {
          stepId: s.stepId,
          stepTitle: step?.title || "Unknown Step",
          action: "completed",
          timestamp: new Date(s.completedAt),
          user: s.assignedTo || "System"
        };
      });

    // Identify blockers
    const blockers = stepStatuses
      .filter(s => s.status === StepStatus.FAILED || s.status === StepStatus.BLOCKED)
      .map(s => {
        const step = steps.find(st => st.id === s.stepId);
        return {
          stepId: s.stepId,
          stepTitle: step?.title || "Unknown Step",
          reason: s.notes || "Step failed validation",
          priority: "high" as const,
          assignedTo: s.assignedTo
        };
      });

    // Upcoming milestones
    const upcomingMilestones = stepStatuses
      .filter(s => s.status === StepStatus.PENDING)
      .slice(0, 3)
      .map(s => {
        const step = steps.find(st => st.id === s.stepId);
        const estimatedStart = new Date(currentTime + (steps.indexOf(step!) * 24 * 60 * 60 * 1000));

        return {
          stepId: s.stepId,
          title: step?.title || "Unknown Step",
          dueDate: estimatedStart,
          priority: step?.type === StepType.APPROVAL ? "high" : "medium"
        };
      });

    return {
      executionId: execution.id,
      templateName: execution.template.name,
      currentStep: currentStep && currentStepStatus ? {
        id: currentStep.id,
        title: currentStep.title,
        status: currentStepStatus.status as StepStatus,
        estimatedCompletion: new Date(currentTime + (currentStep.estimatedDuration * 60 * 1000))
      } : {
        id: "none",
        title: "Workflow Complete",
        status: StepStatus.COMPLETED,
        estimatedCompletion: new Date()
      },
      overallProgress: {
        totalSteps: execution.totalSteps,
        completedSteps: execution.completedSteps,
        percentage: execution.progressPercentage,
        estimatedCompletion: execution.scheduledCompletion || new Date(),
        timeSpent,
        timeRemaining
      },
      recentActivities,
      blockers,
      upcomingMilestones
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private static validateWorkflowSteps(steps: WorkflowStep[]): void {
    const stepIds = new Set(steps.map(s => s.id));

    for (const step of steps) {
      // Validate prerequisites exist
      for (const prerequisite of step.prerequisiteSteps) {
        if (!stepIds.has(prerequisite)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Step ${step.id} references non-existent prerequisite ${prerequisite}`
          });
        }
      }

      // Check for circular dependencies (simplified check)
      if (step.prerequisiteSteps.includes(step.id)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Step ${step.id} cannot be a prerequisite of itself`
        });
      }
    }
  }

  private static calculateScheduledCompletion(
    steps: WorkflowStep[],
    startDate?: Date
  ): Date {
    const start = startDate || new Date();
    const totalMinutes = steps.reduce((sum, step) => sum + step.estimatedDuration, 0);
    const totalDays = Math.ceil(totalMinutes / (8 * 60)); // 8-hour work days

    const completion = new Date(start);
    completion.setDate(completion.getDate() + totalDays);

    return completion;
  }

  private static async validateStepCompletion(
    step: WorkflowStep,
    outputs: Record<string, any>,
    execution: TransitionWorkflowExecution
  ): Promise<{ passed: boolean; errors: string[]; warnings: string[] }> {

    const errors: string[] = [];
    const warnings: string[] = [];

    for (const criteria of step.validationCriteria) {
      const value = outputs[criteria.field];

      switch (criteria.condition) {
        case "greater_than":
          if (!value || value <= criteria.value) {
            errors.push(`${criteria.field} must be greater than ${criteria.value}`);
          }
          break;

        case "equals":
          if (value !== criteria.value) {
            errors.push(`${criteria.field} must equal ${criteria.value}`);
          }
          break;

        case "exists":
          if (!value) {
            errors.push(`${criteria.field} is required`);
          }
          break;
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings
    };
  }

  private static async evaluateSkipConditions(
    step: WorkflowStep,
    execution: TransitionWorkflowExecution
  ): Promise<boolean> {

    if (!step.skipConditions || step.skipConditions.length === 0) {
      return false;
    }

    // Simple skip condition evaluation (would be more complex in real system)
    for (const condition of step.skipConditions) {
      // Implementation would depend on the specific condition types
      // For now, always return false (don't skip)
    }

    return false;
  }

  private static async executeStepAutomation(
    automationConfig: WorkflowStep['automationConfig'],
    execution: TransitionWorkflowExecution,
    outputs?: Record<string, any>
  ): Promise<void> {

    if (!automationConfig) return;

    switch (automationConfig.type) {
      case "notification":
        // Send notification to relevant parties
        await this.sendWorkflowNotification(execution, automationConfig.config);
        break;

      case "email":
        // Send email update
        await this.sendWorkflowEmail(execution, automationConfig.config);
        break;

      case "api_call":
        // Make API call to external system
        await this.makeWorkflowApiCall(execution, automationConfig.config, outputs);
        break;
    }
  }

  private static async sendWorkflowNotification(
    execution: TransitionWorkflowExecution,
    config: Record<string, any>
  ): Promise<void> {
    // Implementation for sending notifications
    // Would integrate with notification service
  }

  private static async sendWorkflowEmail(
    execution: TransitionWorkflowExecution,
    config: Record<string, any>
  ): Promise<void> {
    // Implementation for sending emails
    // Would integrate with email service
  }

  private static async makeWorkflowApiCall(
    execution: TransitionWorkflowExecution,
    config: Record<string, any>,
    outputs?: Record<string, any>
  ): Promise<void> {
    // Implementation for making API calls
    // Could trigger other system processes
  }

  private static async updateTemplateStatistics(
    templateId: number,
    stepDuration: number
  ): Promise<void> {

    // Update template with actual execution data for better estimates
    const template = await prisma.transitionWorkflowTemplate.findUnique({
      where: { id: templateId }
    });

    if (template) {
      // Simple running average calculation
      // In real system, would be more sophisticated
      const currentAvg = template.averageDuration || 0;
      const newAvg = currentAvg > 0
        ? (currentAvg + stepDuration) / 2
        : stepDuration;

      await prisma.transitionWorkflowTemplate.update({
        where: { id: templateId },
        data: {
          averageDuration: Math.round(newAvg)
        }
      });
    }
  }
}