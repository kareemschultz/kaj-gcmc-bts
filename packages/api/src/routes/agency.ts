/**
 * Agency-Specific API Routes for Guyanese Regulatory System
 * Handles all agency-related operations, compliance tracking, and submissions
 */

import { z } from "zod";
import { router, protectedProcedure, cachedRbacProcedure, rbacProcedure } from "../index";
import { createAgencyValidationService } from "../services/AgencyValidationService";
import { createSmartDocumentService } from "../services/SmartDocumentService";
import type { Authority, AgencyCategory, DocumentCategory, ClientType } from "@GCMC-KAJ/types";

// ===============================
// VALIDATION SCHEMAS
// ===============================

const AuthorityEnum = z.enum([
  "GRA", "NIS", "DCRA", "Immigration", "MOL", "EPA", "GSB", "BOG", "MOH",
  "NDIA", "GWI", "GPL", "GuyOil", "GGMC", "MARAD", "GCAA", "CFU",
  "GoInvest", "GGB", "GPF", "CARICOM", "CUSTOMS", "FORESTRY", "LANDS",
  "TRANSPORT", "TOURISM", "AGRICULTURE", "EDUCATION", "SOCIAL_SERVICES"
]);

const AgencyCategoryEnum = z.enum([
  "tax_revenue", "registration", "compliance", "permits_licenses",
  "immigration", "environmental", "financial", "utilities",
  "natural_resources", "transport", "health_safety", "education",
  "social_services", "gaming_tourism"
]);

const DocumentCategoryEnum = z.enum([
  "incorporation", "tax_filing", "compliance_certificate", "permit_license",
  "financial_statement", "regulatory_filing", "identification",
  "operational_document", "legal_document", "correspondence",
  "application_form", "renewal_document", "amendment_document",
  "termination_document", "inspection_report", "other"
]);

const ClientTypeEnum = z.enum(["individual", "company", "partnership"]);

// ===============================
// AGENCY INFORMATION ROUTES
// ===============================

export const agencyRouter = router({
  /**
   * Get all agencies with their basic information
   */
  getAgencies: cachedRbacProcedure("agencies", "list", { ttl: 3600 })
    .input(z.object({
      category: AgencyCategoryEnum.optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { prisma, tenantId } = ctx;

      const agencies = await prisma.agencyInfo.findMany({
        where: {
          tenantId,
          ...(input.category && { category: input.category }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
        orderBy: [
          { priority: 'desc' },
          { name: 'asc' }
        ],
        include: {
          _count: {
            select: {
              documentRequirements: true,
              submissions: true,
              deadlines: true
            }
          }
        }
      });

      return agencies;
    }),

  /**
   * Get detailed agency information
   */
  getAgencyDetails: cachedRbacProcedure("agencies", "view", { ttl: 1800 })
    .input(z.object({
      authority: AuthorityEnum,
    }))
    .query(async ({ ctx, input }) => {
      const { prisma, tenantId } = ctx;

      const agency = await prisma.agencyInfo.findFirst({
        where: {
          tenantId,
          code: input.authority,
        },
        include: {
          documentRequirements: {
            where: { isRequired: true },
            orderBy: { documentType: 'asc' }
          },
          integrationConfigs: true,
          formTemplates: {
            where: { isActive: true },
            orderBy: { effectiveDate: 'desc' }
          }
        }
      });

      if (!agency) {
        throw new Error(`Agency ${input.authority} not found`);
      }

      return agency;
    }),

  /**
   * Update agency configuration
   */
  updateAgency: rbacProcedure("agencies", "update")
    .input(z.object({
      authority: AuthorityEnum,
      name: z.string().optional(),
      fullName: z.string().optional(),
      description: z.string().optional(),
      website: z.string().optional(),
      contactInfo: z.record(z.unknown()).optional(),
      onlinePortal: z.record(z.unknown()).optional(),
      isActive: z.boolean().optional(),
      priority: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, tenantId } = ctx;

      const { authority, ...updateData } = input;

      const agency = await prisma.agencyInfo.upsert({
        where: {
          tenantId_code: {
            tenantId,
            code: authority
          }
        },
        update: updateData,
        create: {
          tenantId,
          code: authority,
          category: "compliance", // Default category
          ...updateData,
          name: updateData.name || authority,
          fullName: updateData.fullName || authority,
          description: updateData.description || `${authority} regulatory agency`
        }
      });

      return agency;
    }),

  // ===============================
  // DOCUMENT REQUIREMENTS ROUTES
  // ===============================

  /**
   * Get document requirements for an authority
   */
  getDocumentRequirements: cachedRbacProcedure("agencies", "view", { ttl: 1800 })
    .input(z.object({
      authority: AuthorityEnum,
      documentType: z.string().optional(),
      category: DocumentCategoryEnum.optional(),
      clientType: ClientTypeEnum.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { prisma, tenantId } = ctx;

      const requirements = await prisma.agencyDocumentRequirement.findMany({
        where: {
          tenantId,
          authority: input.authority,
          ...(input.documentType && { documentType: input.documentType }),
          ...(input.category && { category: input.category }),
          ...(input.clientType && {
            applicableClientTypes: {
              has: input.clientType
            }
          }),
        },
        include: {
          validationRules: {
            where: { isActive: true },
            orderBy: { id: 'asc' }
          }
        },
        orderBy: { documentType: 'asc' }
      });

      return requirements;
    }),

  /**
   * Create or update document requirement
   */
  upsertDocumentRequirement: rbacProcedure("agencies", "update")
    .input(z.object({
      id: z.number().optional(),
      authority: AuthorityEnum,
      documentType: z.string(),
      category: DocumentCategoryEnum,
      name: z.string(),
      description: z.string(),
      isRequired: z.boolean().default(true),
      frequency: z.string().optional(),
      dueDateConfig: z.record(z.unknown()).optional(),
      validityPeriod: z.record(z.unknown()).optional(),
      reminderSchedule: z.record(z.unknown()).optional(),
      penalties: z.record(z.unknown()).optional(),
      submissionMethods: z.array(z.string()),
      supportingDocuments: z.array(z.string()).default([]),
      applicableClientTypes: z.array(ClientTypeEnum),
      validationRules: z.array(z.object({
        name: z.string(),
        ruleType: z.enum(["required_field", "format", "size", "date_range", "calculation", "cross_reference"]),
        field: z.string().optional(),
        conditions: z.record(z.unknown()),
        errorMessage: z.string(),
        severity: z.enum(["error", "warning", "info"]),
      })).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, tenantId } = ctx;

      const { validationRules, id, ...requirementData } = input;

      // Get agency info
      const agencyInfo = await prisma.agencyInfo.findFirst({
        where: {
          tenantId,
          code: input.authority
        }
      });

      if (!agencyInfo) {
        throw new Error(`Agency ${input.authority} not configured`);
      }

      // Upsert document requirement
      const requirement = await prisma.agencyDocumentRequirement.upsert({
        where: id ? { id } : {
          tenantId_authority_documentType: {
            tenantId,
            authority: input.authority,
            documentType: input.documentType
          }
        },
        update: {
          ...requirementData,
          agencyInfoId: agencyInfo.id,
        },
        create: {
          tenantId,
          agencyInfoId: agencyInfo.id,
          ...requirementData,
        }
      });

      // Update validation rules
      if (validationRules.length > 0) {
        // Delete existing rules
        await prisma.documentValidationRule.deleteMany({
          where: { requirementId: requirement.id }
        });

        // Create new rules
        await prisma.documentValidationRule.createMany({
          data: validationRules.map(rule => ({
            requirementId: requirement.id,
            ...rule,
            isActive: true
          }))
        });
      }

      return requirement;
    }),

  // ===============================
  // DOCUMENT VALIDATION ROUTES
  // ===============================

  /**
   * Validate document against agency rules
   */
  validateDocument: rbacProcedure("documents", "validate")
    .input(z.object({
      authority: AuthorityEnum,
      documentType: z.string(),
      documentCategory: DocumentCategoryEnum.optional(),
      documentData: z.record(z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, tenantId } = ctx;

      const validationService = createAgencyValidationService(prisma);

      const result = await validationService.validateDocument(
        tenantId,
        input.authority,
        input.documentType,
        input.documentData,
        input.documentCategory
      );

      return result;
    }),

  /**
   * Classify document using AI
   */
  classifyDocument: rbacProcedure("documents", "classify")
    .input(z.object({
      documentContent: z.string(),
      fileName: z.string(),
      clientType: ClientTypeEnum.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, tenantId } = ctx;

      const smartDocService = createSmartDocumentService(prisma);

      const classification = await smartDocService.classifyDocument(
        tenantId,
        input.documentContent,
        input.fileName,
        input.clientType
      );

      return classification;
    }),

  /**
   * Extract structured data from document
   */
  extractDocumentData: rbacProcedure("documents", "extract")
    .input(z.object({
      documentContent: z.string(),
      fileName: z.string(),
      documentType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const smartDocService = createSmartDocumentService(prisma);

      const extractedData = await smartDocService.extractDocumentData(
        input.documentContent,
        input.fileName,
        input.documentType
      );

      return extractedData;
    }),

  // ===============================
  // COMPLIANCE STATUS ROUTES
  // ===============================

  /**
   * Get client compliance status for specific authority
   */
  getClientComplianceStatus: cachedRbacProcedure("compliance", "view", { ttl: 300 })
    .input(z.object({
      clientId: z.number(),
      authority: AuthorityEnum.optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { prisma, tenantId } = ctx;

      const whereClause: any = {
        tenantId,
        clientId: input.clientId,
      };

      if (input.authority) {
        whereClause.authority = input.authority;
      }

      const complianceStatuses = await prisma.agencyComplianceStatus.findMany({
        where: whereClause,
        include: {
          agencyInfo: true,
          requirementStatuses: {
            include: {
              requirement: true
            }
          }
        },
        orderBy: { lastAssessment: 'desc' }
      });

      return complianceStatuses;
    }),

  /**
   * Update client compliance status
   */
  updateComplianceStatus: rbacProcedure("compliance", "update")
    .input(z.object({
      clientId: z.number(),
      authority: AuthorityEnum,
      overallStatus: z.enum(["green", "amber", "red"]),
      score: z.number().min(0).max(100),
      recommendations: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, tenantId } = ctx;

      const agencyInfo = await prisma.agencyInfo.findFirst({
        where: {
          tenantId,
          code: input.authority
        }
      });

      if (!agencyInfo) {
        throw new Error(`Agency ${input.authority} not found`);
      }

      const complianceStatus = await prisma.agencyComplianceStatus.upsert({
        where: {
          tenantId_clientId_agencyInfoId: {
            tenantId,
            clientId: input.clientId,
            agencyInfoId: agencyInfo.id
          }
        },
        update: {
          overallStatus: input.overallStatus,
          score: input.score,
          recommendations: input.recommendations,
          lastAssessment: new Date(),
        },
        create: {
          tenantId,
          clientId: input.clientId,
          agencyInfoId: agencyInfo.id,
          authority: input.authority,
          overallStatus: input.overallStatus,
          score: input.score,
          recommendations: input.recommendations,
          lastAssessment: new Date(),
        }
      });

      return complianceStatus;
    }),

  // ===============================
  // DEADLINE MANAGEMENT ROUTES
  // ===============================

  /**
   * Get upcoming deadlines
   */
  getUpcomingDeadlines: cachedRbacProcedure("deadlines", "view", { ttl: 300 })
    .input(z.object({
      clientId: z.number().optional(),
      authority: AuthorityEnum.optional(),
      status: z.enum(["upcoming", "due_today", "overdue"]).optional(),
      daysAhead: z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      const { prisma, tenantId } = ctx;

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + input.daysAhead);

      const deadlines = await prisma.agencyDeadline.findMany({
        where: {
          tenantId,
          ...(input.clientId && { clientId: input.clientId }),
          ...(input.authority && { authority: input.authority }),
          ...(input.status && { status: input.status }),
          dueDate: {
            lte: futureDate
          }
        },
        include: {
          client: {
            select: { id: true, name: true, type: true }
          },
          agencyInfo: {
            select: { name: true, code: true }
          },
          requirement: {
            select: { name: true, documentType: true }
          },
          assignedTo: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: [
          { dueDate: 'asc' },
          { priority: 'desc' }
        ]
      });

      return deadlines;
    }),

  /**
   * Create deadline
   */
  createDeadline: rbacProcedure("deadlines", "create")
    .input(z.object({
      clientId: z.number(),
      authority: AuthorityEnum,
      requirementId: z.number(),
      documentType: z.string(),
      description: z.string(),
      dueDate: z.date(),
      priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
      assignedToId: z.string().optional(),
      estimatedCompletionTime: z.number().optional(),
      dependencies: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, tenantId } = ctx;

      const agencyInfo = await prisma.agencyInfo.findFirst({
        where: {
          tenantId,
          code: input.authority
        }
      });

      if (!agencyInfo) {
        throw new Error(`Agency ${input.authority} not found`);
      }

      const deadline = await prisma.agencyDeadline.create({
        data: {
          tenantId,
          clientId: input.clientId,
          agencyInfoId: agencyInfo.id,
          requirementId: input.requirementId,
          authority: input.authority,
          documentType: input.documentType,
          description: input.description,
          dueDate: input.dueDate,
          priority: input.priority,
          status: "upcoming",
          assignedToId: input.assignedToId,
          estimatedCompletionTime: input.estimatedCompletionTime,
          dependencies: input.dependencies,
        }
      });

      return deadline;
    }),

  /**
   * Update deadline status
   */
  updateDeadlineStatus: rbacProcedure("deadlines", "update")
    .input(z.object({
      deadlineId: z.number(),
      status: z.enum(["upcoming", "due_today", "overdue"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      const deadline = await prisma.agencyDeadline.update({
        where: { id: input.deadlineId },
        data: {
          status: input.status,
          ...(input.notes && {
            metadata: {
              notes: input.notes,
              updatedAt: new Date().toISOString()
            }
          })
        }
      });

      return deadline;
    }),

  // ===============================
  // SUBMISSION TRACKING ROUTES
  // ===============================

  /**
   * Get agency submissions
   */
  getSubmissions: cachedRbacProcedure("submissions", "view", { ttl: 300 })
    .input(z.object({
      clientId: z.number().optional(),
      authority: AuthorityEnum.optional(),
      status: z.string().optional(),
      dateRange: z.object({
        start: z.date(),
        end: z.date(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { prisma, tenantId } = ctx;

      const submissions = await prisma.agencySubmission.findMany({
        where: {
          tenantId,
          ...(input.clientId && { clientId: input.clientId }),
          ...(input.authority && { authority: input.authority }),
          ...(input.status && { status: input.status }),
          ...(input.dateRange && {
            submittedAt: {
              gte: input.dateRange.start,
              lte: input.dateRange.end,
            }
          }),
        },
        include: {
          client: {
            select: { id: true, name: true, type: true }
          },
          agencyInfo: {
            select: { name: true, code: true }
          },
          template: {
            select: { name: true, version: true }
          },
          events: {
            orderBy: { timestamp: 'desc' },
            take: 5
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return submissions;
    }),

  /**
   * Create agency submission
   */
  createSubmission: rbacProcedure("submissions", "create")
    .input(z.object({
      clientId: z.number(),
      authority: AuthorityEnum,
      documentType: z.string(),
      templateId: z.number().optional(),
      submissionData: z.record(z.unknown()),
      referenceNumber: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, tenantId, user } = ctx;

      const agencyInfo = await prisma.agencyInfo.findFirst({
        where: {
          tenantId,
          code: input.authority
        }
      });

      if (!agencyInfo) {
        throw new Error(`Agency ${input.authority} not found`);
      }

      const submission = await prisma.agencySubmission.create({
        data: {
          tenantId,
          clientId: input.clientId,
          agencyInfoId: agencyInfo.id,
          templateId: input.templateId,
          authority: input.authority,
          documentType: input.documentType,
          submissionData: input.submissionData,
          status: "new",
          referenceNumber: input.referenceNumber,
          fees: {
            total: 0,
            currency: "GYD"
          },
          submittedBy: user.id,
        }
      });

      // Create initial event
      await prisma.submissionEvent.create({
        data: {
          submissionId: submission.id,
          type: "submitted",
          timestamp: new Date(),
          actor: "staff",
          actorId: user.id,
          description: "Submission created",
        }
      });

      return submission;
    }),

  /**
   * Update submission status
   */
  updateSubmissionStatus: rbacProcedure("submissions", "update")
    .input(z.object({
      submissionId: z.number(),
      status: z.string(),
      agencyResponse: z.record(z.unknown()).optional(),
      rejectionReason: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, user } = ctx;

      const submission = await prisma.agencySubmission.update({
        where: { id: input.submissionId },
        data: {
          status: input.status,
          ...(input.agencyResponse && { agencyResponse: input.agencyResponse }),
          ...(input.rejectionReason && { rejectionReason: input.rejectionReason }),
          ...(input.notes && { internalNotes: input.notes }),
          ...(input.status === "approved" && { approvedAt: new Date() }),
          ...(input.status === "rejected" && { rejectedAt: new Date() }),
          processedBy: user.id,
          processedAt: new Date(),
        }
      });

      // Create status change event
      await prisma.submissionEvent.create({
        data: {
          submissionId: input.submissionId,
          type: input.status,
          timestamp: new Date(),
          actor: "staff",
          actorId: user.id,
          description: `Submission status changed to ${input.status}`,
        }
      });

      return submission;
    }),

  // ===============================
  // ANALYTICS AND REPORTING ROUTES
  // ===============================

  /**
   * Get agency performance metrics
   */
  getAgencyMetrics: cachedRbacProcedure("analytics", "view", { ttl: 1800 })
    .input(z.object({
      authority: AuthorityEnum,
      period: z.object({
        start: z.date(),
        end: z.date(),
      }),
      clientId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { prisma, tenantId } = ctx;

      // Get submission metrics
      const submissions = await prisma.agencySubmission.findMany({
        where: {
          tenantId,
          authority: input.authority,
          ...(input.clientId && { clientId: input.clientId }),
          submittedAt: {
            gte: input.period.start,
            lte: input.period.end,
          }
        }
      });

      // Get compliance metrics
      const complianceStatuses = await prisma.agencyComplianceStatus.findMany({
        where: {
          tenantId,
          authority: input.authority,
          ...(input.clientId && { clientId: input.clientId }),
        }
      });

      // Get deadline metrics
      const deadlines = await prisma.agencyDeadline.findMany({
        where: {
          tenantId,
          authority: input.authority,
          ...(input.clientId && { clientId: input.clientId }),
          dueDate: {
            gte: input.period.start,
            lte: input.period.end,
          }
        }
      });

      // Calculate metrics
      const metrics = {
        authority: input.authority,
        period: input.period,
        submissions: {
          total: submissions.length,
          approved: submissions.filter(s => s.status === "approved").length,
          rejected: submissions.filter(s => s.status === "rejected").length,
          pending: submissions.filter(s =>
            ["new", "in_progress", "under_review"].includes(s.status)
          ).length,
          averageProcessingTime: 0, // TODO: Calculate based on submission events
        },
        compliance: {
          onTimeSubmissions: submissions.filter(s =>
            s.submittedAt && s.submittedAt <= new Date()
          ).length,
          lateSubmissions: submissions.filter(s =>
            s.submittedAt && s.submittedAt > new Date()
          ).length,
          overdueItems: deadlines.filter(d =>
            d.status === "overdue"
          ).length,
          averageComplianceScore: complianceStatuses.reduce((sum, cs) =>
            sum + cs.score, 0
          ) / (complianceStatuses.length || 1),
        },
        penalties: {
          totalPenalties: 0, // TODO: Calculate from overdue items
          penaltyEvents: 0,
          averagePenalty: 0,
        }
      };

      return metrics;
    }),

  /**
   * Get compliance dashboard data
   */
  getComplianceDashboard: cachedRbacProcedure("analytics", "view", { ttl: 600 })
    .input(z.object({
      clientId: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { prisma, tenantId } = ctx;

      // Get all agency compliance statuses
      const complianceStatuses = await prisma.agencyComplianceStatus.findMany({
        where: {
          tenantId,
          ...(input.clientId && { clientId: input.clientId }),
        },
        include: {
          agencyInfo: true,
          client: {
            select: { id: true, name: true, type: true }
          }
        }
      });

      // Get upcoming deadlines
      const upcomingDeadlines = await prisma.agencyDeadline.findMany({
        where: {
          tenantId,
          ...(input.clientId && { clientId: input.clientId }),
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        },
        include: {
          agencyInfo: true,
          client: {
            select: { id: true, name: true, type: true }
          }
        },
        orderBy: { dueDate: 'asc' },
        take: 10
      });

      // Get active alerts
      const alerts = await prisma.complianceAlert.findMany({
        where: {
          tenantId,
          ...(input.clientId && { clientId: input.clientId }),
          acknowledged: false,
        },
        include: {
          agencyInfo: true,
          client: {
            select: { id: true, name: true, type: true }
          }
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 20
      });

      // Calculate summary statistics
      const summary = {
        totalClients: input.clientId ? 1 : await prisma.client.count({ where: { tenantId } }),
        greenCompliance: complianceStatuses.filter(cs => cs.overallStatus === "green").length,
        amberCompliance: complianceStatuses.filter(cs => cs.overallStatus === "amber").length,
        redCompliance: complianceStatuses.filter(cs => cs.overallStatus === "red").length,
        upcomingDeadlines: upcomingDeadlines.length,
        criticalAlerts: alerts.filter(a => a.severity === "critical").length,
        averageComplianceScore: complianceStatuses.reduce((sum, cs) =>
          sum + cs.score, 0
        ) / (complianceStatuses.length || 1),
      };

      return {
        summary,
        complianceStatuses,
        upcomingDeadlines,
        alerts,
      };
    }),
});