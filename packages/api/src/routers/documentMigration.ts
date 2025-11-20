/**
 * Document Migration tRPC Router
 *
 * Handles hybrid physical-digital document migration operations
 * Supports complete transition from traditional accounting practices
 */

import prisma, { type Prisma } from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { rbacProcedure, router } from "../index";

/**
 * Document Migration Project validation schema
 */
export const migrationProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  clientId: z.number().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  estimatedFileCount: z.number().optional(),
  estimatedDuration: z.number().optional(),
  scanSettings: z.record(z.string(), z.any()).default({}),
  organizationRules: z.record(z.string(), z.any()).default({}),
  qualityStandards: z.record(z.string(), z.any()).default({}),
  assignedTeam: z.array(z.string()).default([]),
  estimatedCost: z.number().optional(),
});

/**
 * Physical Document Record validation schema
 */
export const physicalDocumentSchema = z.object({
  migrationProjectId: z.number(),
  clientId: z.number().optional(),
  physicalLocation: z.string().min(1).max(255),
  fileNumber: z.string().optional(),
  category: z.string().min(1).max(100),
  description: z.string().min(1),
  documentCount: z.number().min(1).default(1),
  estimatedPages: z.number().optional(),
  condition: z.enum(["excellent", "good", "fair", "poor"]).default("good"),
  specialHandling: z.boolean().default(false),
});

/**
 * Migration Task validation schema
 */
export const migrationTaskSchema = z.object({
  migrationProjectId: z.number(),
  physicalDocumentId: z.number().optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  taskType: z.enum(["scanning", "ocr_processing", "quality_review", "data_entry", "filing"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assignedTo: z.string().optional(),
  estimatedDuration: z.number().optional(), // in minutes
  dueDate: z.string().datetime().optional(),
  dependencies: z.array(z.string()).default([]),
  prerequisites: z.record(z.string(), z.any()).optional(),
});

/**
 * Legacy Data Import Job validation schema
 */
export const legacyImportJobSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  sourceSystem: z.string().min(1).max(100),
  sourceLocation: z.string().optional(),
  fieldMapping: z.record(z.string(), z.any()),
  transformationRules: z.record(z.string(), z.any()),
  dataFilters: z.record(z.string(), z.any()).optional(),
  batchSize: z.number().min(1).max(1000).default(100),
  validateData: z.boolean().default(true),
  skipDuplicates: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
  qualityThreshold: z.number().min(0).max(1).default(0.95),
  manualReviewRequired: z.boolean().default(false),
  scheduledStartTime: z.string().datetime().optional(),
});

/**
 * Document Migration router
 */
export const documentMigrationRouter = router({
  // ============================================================================
  // MIGRATION PROJECTS
  // ============================================================================

  /**
   * List migration projects with filtering and pagination
   * Requires: documents:view permission
   */
  projects: router({
    list: rbacProcedure("documents", "view")
      .input(
        z
          .object({
            clientId: z.number().optional(),
            status: z.string().optional(),
            priority: z.string().optional(),
            search: z.string().optional(),
            page: z.number().default(1),
            pageSize: z.number().default(20),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        const {
          clientId,
          status,
          priority,
          search = "",
          page = 1,
          pageSize = 20,
        } = input || {};

        const skip = (page - 1) * pageSize;

        const where: Prisma.DocumentMigrationProjectWhereInput = {
          tenantId: ctx.tenantId,
        };

        if (clientId) where.clientId = clientId;
        if (status) where.status = status;
        if (priority) where.priority = priority;

        if (search) {
          where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ];
        }

        const [projects, total] = await Promise.all([
          prisma.documentMigrationProject.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
            include: {
              client: {
                select: { id: true, name: true },
              },
              _count: {
                select: {
                  physicalDocuments: true,
                  migrationTasks: true,
                },
              },
            },
          }),
          prisma.documentMigrationProject.count({ where }),
        ]);

        return {
          projects,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        };
      }),

    /**
     * Get single migration project by ID
     * Requires: documents:view permission
     */
    get: rbacProcedure("documents", "view")
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await prisma.documentMigrationProject.findUnique({
          where: {
            id: input.id,
            tenantId: ctx.tenantId,
          },
          include: {
            client: true,
            physicalDocuments: {
              include: {
                digitalDocument: {
                  select: { id: true, title: true, status: true },
                },
              },
            },
            migrationTasks: {
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            progressLogs: {
              orderBy: { timestamp: "desc" },
              take: 20,
              include: {
                actor: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        });

        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Migration project not found",
          });
        }

        return project;
      }),

    /**
     * Create new migration project
     * Requires: documents:create permission
     */
    create: rbacProcedure("documents", "create")
      .input(migrationProjectSchema)
      .mutation(async ({ ctx, input }) => {
        // Verify client belongs to tenant if provided
        if (input.clientId) {
          const client = await prisma.client.findUnique({
            where: { id: input.clientId, tenantId: ctx.tenantId },
          });

          if (!client) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Client not found",
            });
          }
        }

        const project = await prisma.documentMigrationProject.create({
          data: {
            ...input,
            tenantId: ctx.tenantId,
            status: "planning",
            createdBy: ctx.user.id,
          },
          include: {
            client: true,
          },
        });

        // Create initial progress log
        await prisma.migrationProgressLog.create({
          data: {
            tenantId: ctx.tenantId,
            migrationProjectId: project.id,
            eventType: "project_created",
            eventDescription: "Migration project created",
            actorId: ctx.user.id,
          },
        });

        return project;
      }),

    /**
     * Update migration project
     * Requires: documents:edit permission
     */
    update: rbacProcedure("documents", "edit")
      .input(
        z.object({
          id: z.number(),
          data: migrationProjectSchema.partial(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await prisma.documentMigrationProject.findUnique({
          where: { id: input.id, tenantId: ctx.tenantId },
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Migration project not found",
          });
        }

        const updated = await prisma.documentMigrationProject.update({
          where: { id: input.id },
          data: {
            ...input.data,
            updatedAt: new Date(),
          },
          include: {
            client: true,
          },
        });

        // Log the update
        await prisma.migrationProgressLog.create({
          data: {
            tenantId: ctx.tenantId,
            migrationProjectId: updated.id,
            eventType: "project_updated",
            eventDescription: "Migration project settings updated",
            actorId: ctx.user.id,
          },
        });

        return updated;
      }),

    /**
     * Get migration project statistics
     * Requires: documents:view permission
     */
    stats: rbacProcedure("documents", "view")
      .input(z.object({ projectId: z.number() }))
      .query(async ({ ctx, input }) => {
        const project = await prisma.documentMigrationProject.findUnique({
          where: { id: input.projectId, tenantId: ctx.tenantId },
          include: {
            _count: {
              select: {
                physicalDocuments: true,
                migrationTasks: true,
              },
            },
          },
        });

        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Migration project not found",
          });
        }

        const [taskStats, documentStats] = await Promise.all([
          prisma.documentMigrationTask.groupBy({
            by: ["status"],
            where: {
              migrationProjectId: input.projectId,
              tenantId: ctx.tenantId,
            },
            _count: true,
          }),
          prisma.physicalDocumentRecord.groupBy({
            by: ["migrationStatus"],
            where: {
              migrationProjectId: input.projectId,
              tenantId: ctx.tenantId,
            },
            _count: true,
          }),
        ]);

        const totalProgress = project.totalPhysicalFiles > 0
          ? Math.round((project.processedFiles / project.totalPhysicalFiles) * 100)
          : 0;

        return {
          project: {
            id: project.id,
            name: project.name,
            status: project.status,
            totalFiles: project.totalPhysicalFiles,
            scannedFiles: project.scannedFiles,
            processedFiles: project.processedFiles,
            qualityApprovedFiles: project.qualityApprovedFiles,
            progressPercentage: totalProgress,
          },
          taskStats,
          documentStats,
          totalTasks: project._count.migrationTasks,
          totalDocuments: project._count.physicalDocuments,
        };
      }),
  }),

  // ============================================================================
  // PHYSICAL DOCUMENTS
  // ============================================================================

  physicalDocuments: router({
    /**
     * List physical documents for a migration project
     * Requires: documents:view permission
     */
    list: rbacProcedure("documents", "view")
      .input(
        z.object({
          migrationProjectId: z.number(),
          migrationStatus: z.string().optional(),
          physicalLocation: z.string().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { migrationProjectId, migrationStatus, physicalLocation, page, pageSize } = input;
        const skip = (page - 1) * pageSize;

        const where: Prisma.PhysicalDocumentRecordWhereInput = {
          tenantId: ctx.tenantId,
          migrationProjectId,
        };

        if (migrationStatus) where.migrationStatus = migrationStatus;
        if (physicalLocation) {
          where.physicalLocation = { contains: physicalLocation, mode: "insensitive" };
        }

        const [documents, total] = await Promise.all([
          prisma.physicalDocumentRecord.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
            include: {
              client: { select: { id: true, name: true } },
              digitalDocument: { select: { id: true, title: true, status: true } },
            },
          }),
          prisma.physicalDocumentRecord.count({ where }),
        ]);

        return {
          documents,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        };
      }),

    /**
     * Create new physical document record
     * Requires: documents:create permission
     */
    create: rbacProcedure("documents", "create")
      .input(physicalDocumentSchema)
      .mutation(async ({ ctx, input }) => {
        // Verify migration project exists and belongs to tenant
        const project = await prisma.documentMigrationProject.findUnique({
          where: { id: input.migrationProjectId, tenantId: ctx.tenantId },
        });

        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Migration project not found",
          });
        }

        const document = await prisma.physicalDocumentRecord.create({
          data: {
            ...input,
            tenantId: ctx.tenantId,
          },
          include: {
            client: true,
            migrationProject: true,
          },
        });

        // Update project file count
        await prisma.documentMigrationProject.update({
          where: { id: input.migrationProjectId },
          data: {
            totalPhysicalFiles: {
              increment: input.documentCount,
            },
            lastActivity: new Date(),
          },
        });

        // Log the activity
        await prisma.migrationProgressLog.create({
          data: {
            tenantId: ctx.tenantId,
            migrationProjectId: input.migrationProjectId,
            eventType: "document_added",
            eventDescription: `Physical document added: ${input.description}`,
            actorId: ctx.user.id,
          },
        });

        return document;
      }),

    /**
     * Update physical document status
     * Requires: documents:edit permission
     */
    updateStatus: rbacProcedure("documents", "edit")
      .input(
        z.object({
          id: z.number(),
          migrationStatus: z.enum(["pending", "scanning", "processing", "completed", "failed"]),
          notes: z.string().optional(),
          qualityScore: z.number().min(0).max(100).optional(),
          digitalDocumentId: z.number().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await prisma.physicalDocumentRecord.findUnique({
          where: { id: input.id, tenantId: ctx.tenantId },
          include: { migrationProject: true },
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Physical document not found",
          });
        }

        const updateData: any = {
          migrationStatus: input.migrationStatus,
          updatedAt: new Date(),
        };

        // Set appropriate timestamps based on status
        switch (input.migrationStatus) {
          case "scanning":
            updateData.scanDate = new Date();
            updateData.scannedBy = ctx.user.id;
            break;
          case "processing":
            updateData.processedDate = new Date();
            updateData.processedBy = ctx.user.id;
            break;
          case "completed":
            updateData.qualityCheckDate = new Date();
            updateData.qualityCheckedBy = ctx.user.id;
            if (input.qualityScore) updateData.qualityScore = input.qualityScore;
            if (input.digitalDocumentId) updateData.digitalDocumentId = input.digitalDocumentId;
            break;
        }

        if (input.notes) {
          switch (input.migrationStatus) {
            case "scanning":
              updateData.scanNotes = input.notes;
              break;
            case "processing":
              updateData.processingNotes = input.notes;
              break;
            case "completed":
              updateData.qualityNotes = input.notes;
              break;
          }
        }

        const updated = await prisma.physicalDocumentRecord.update({
          where: { id: input.id },
          data: updateData,
        });

        // Update project counters
        const projectUpdates: any = { lastActivity: new Date() };

        if (input.migrationStatus === "scanning" && existing.migrationStatus !== "scanning") {
          projectUpdates.scannedFiles = { increment: 1 };
        }
        if (input.migrationStatus === "processing" && existing.migrationStatus !== "processing") {
          projectUpdates.processedFiles = { increment: 1 };
        }
        if (input.migrationStatus === "completed" && existing.migrationStatus !== "completed") {
          projectUpdates.qualityApprovedFiles = { increment: 1 };
        }

        await prisma.documentMigrationProject.update({
          where: { id: existing.migrationProjectId },
          data: projectUpdates,
        });

        // Log the status change
        await prisma.migrationProgressLog.create({
          data: {
            tenantId: ctx.tenantId,
            migrationProjectId: existing.migrationProjectId,
            eventType: "status_changed",
            eventDescription: `Document status changed to ${input.migrationStatus}: ${existing.description}`,
            actorId: ctx.user.id,
            eventData: {
              documentId: input.id,
              oldStatus: existing.migrationStatus,
              newStatus: input.migrationStatus,
            },
          },
        });

        return updated;
      }),
  }),

  // ============================================================================
  // MIGRATION TASKS
  // ============================================================================

  tasks: router({
    /**
     * List migration tasks
     * Requires: tasks:view permission
     */
    list: rbacProcedure("tasks", "view")
      .input(
        z.object({
          migrationProjectId: z.number().optional(),
          assignedTo: z.string().optional(),
          status: z.string().optional(),
          taskType: z.string().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { page, pageSize, ...filters } = input;
        const skip = (page - 1) * pageSize;

        const where: Prisma.DocumentMigrationTaskWhereInput = {
          tenantId: ctx.tenantId,
          ...filters,
        };

        const [tasks, total] = await Promise.all([
          prisma.documentMigrationTask.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
            include: {
              migrationProject: {
                select: { id: true, name: true },
              },
              physicalDocument: {
                select: { id: true, description: true, physicalLocation: true },
              },
            },
          }),
          prisma.documentMigrationTask.count({ where }),
        ]);

        return {
          tasks,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        };
      }),

    /**
     * Create new migration task
     * Requires: tasks:create permission
     */
    create: rbacProcedure("tasks", "create")
      .input(migrationTaskSchema)
      .mutation(async ({ ctx, input }) => {
        const task = await prisma.documentMigrationTask.create({
          data: {
            ...input,
            tenantId: ctx.tenantId,
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          },
          include: {
            migrationProject: true,
            physicalDocument: true,
          },
        });

        // Log task creation
        await prisma.migrationProgressLog.create({
          data: {
            tenantId: ctx.tenantId,
            migrationProjectId: input.migrationProjectId,
            eventType: "task_created",
            eventDescription: `Task created: ${input.title}`,
            actorId: ctx.user.id,
            eventData: {
              taskId: task.id,
              taskType: input.taskType,
            },
          },
        });

        return task;
      }),

    /**
     * Update task status and progress
     * Requires: tasks:edit permission
     */
    updateStatus: rbacProcedure("tasks", "edit")
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "in_progress", "completed", "failed", "cancelled"]),
          progressPercentage: z.number().min(0).max(100).optional(),
          notes: z.string().optional(),
          qualityScore: z.number().min(0).max(100).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await prisma.documentMigrationTask.findUnique({
          where: { id: input.id, tenantId: ctx.tenantId },
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Migration task not found",
          });
        }

        const updateData: any = {
          status: input.status,
          updatedAt: new Date(),
        };

        if (input.progressPercentage !== undefined) {
          updateData.progressPercentage = input.progressPercentage;
        }

        if (input.notes) {
          updateData.notes = input.notes;
        }

        if (input.qualityScore) {
          updateData.qualityScore = input.qualityScore;
        }

        // Set timestamps based on status
        if (input.status === "in_progress" && existing.status !== "in_progress") {
          updateData.startedAt = new Date();
        }
        if (["completed", "failed", "cancelled"].includes(input.status) && !existing.completedAt) {
          updateData.completedAt = new Date();
        }

        const updated = await prisma.documentMigrationTask.update({
          where: { id: input.id },
          data: updateData,
        });

        // Log status change
        await prisma.migrationProgressLog.create({
          data: {
            tenantId: ctx.tenantId,
            migrationProjectId: existing.migrationProjectId,
            eventType: "task_status_changed",
            eventDescription: `Task status changed: ${existing.title}`,
            actorId: ctx.user.id,
            eventData: {
              taskId: input.id,
              oldStatus: existing.status,
              newStatus: input.status,
            },
          },
        });

        return updated;
      }),
  }),

  // ============================================================================
  // LEGACY DATA IMPORT
  // ============================================================================

  legacyImport: router({
    /**
     * List legacy import jobs
     * Requires: documents:view permission
     */
    jobs: rbacProcedure("documents", "view")
      .input(
        z.object({
          status: z.string().optional(),
          sourceSystem: z.string().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { page, pageSize, ...filters } = input;
        const skip = (page - 1) * pageSize;

        const where: Prisma.LegacyDataImportJobWhereInput = {
          tenantId: ctx.tenantId,
          ...filters,
        };

        const [jobs, total] = await Promise.all([
          prisma.legacyDataImportJob.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
            include: {
              _count: {
                select: { importRecords: true },
              },
            },
          }),
          prisma.legacyDataImportJob.count({ where }),
        ]);

        return {
          jobs,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        };
      }),

    /**
     * Create new legacy import job
     * Requires: documents:create permission
     */
    createJob: rbacProcedure("documents", "create")
      .input(legacyImportJobSchema)
      .mutation(async ({ ctx, input }) => {
        const job = await prisma.legacyDataImportJob.create({
          data: {
            ...input,
            tenantId: ctx.tenantId,
            createdBy: ctx.user.id,
            scheduledStartTime: input.scheduledStartTime
              ? new Date(input.scheduledStartTime)
              : undefined,
          },
        });

        return job;
      }),

    /**
     * Get import job progress
     * Requires: documents:view permission
     */
    getJobProgress: rbacProcedure("documents", "view")
      .input(z.object({ jobId: z.number() }))
      .query(async ({ ctx, input }) => {
        const job = await prisma.legacyDataImportJob.findUnique({
          where: { id: input.jobId, tenantId: ctx.tenantId },
          include: {
            _count: { select: { importRecords: true } },
          },
        });

        if (!job) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Import job not found",
          });
        }

        const recordStats = await prisma.legacyDataImportRecord.groupBy({
          by: ["status"],
          where: { importJobId: input.jobId, tenantId: ctx.tenantId },
          _count: true,
        });

        const progressPercentage = job.totalRecords && job.totalRecords > 0
          ? Math.round((job.processedRecords / job.totalRecords) * 100)
          : 0;

        return {
          job,
          recordStats,
          progressPercentage,
          totalRecords: job._count.importRecords,
        };
      }),
  }),

  // ============================================================================
  // DOCUMENT SYNC STATUS
  // ============================================================================

  sync: router({
    /**
     * Get sync conflicts that need resolution
     * Requires: documents:view permission
     */
    conflicts: rbacProcedure("documents", "view")
      .input(
        z.object({
          syncStatus: z.string().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { page, pageSize, syncStatus } = input;
        const skip = (page - 1) * pageSize;

        const where: Prisma.DocumentSyncStatusWhereInput = {
          tenantId: ctx.tenantId,
          syncStatus: syncStatus || "conflict",
        };

        const [conflicts, total] = await Promise.all([
          prisma.documentSyncStatus.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
            include: {
              digitalDocument: {
                select: { id: true, title: true, status: true },
              },
              physicalDocument: {
                select: { id: true, description: true, physicalLocation: true },
              },
            },
          }),
          prisma.documentSyncStatus.count({ where }),
        ]);

        return {
          conflicts,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        };
      }),

    /**
     * Resolve sync conflict
     * Requires: documents:edit permission
     */
    resolveConflict: rbacProcedure("documents", "edit")
      .input(
        z.object({
          id: z.number(),
          conflictResolution: z.enum(["manual_review", "prefer_digital", "prefer_physical"]),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const conflict = await prisma.documentSyncStatus.findUnique({
          where: { id: input.id, tenantId: ctx.tenantId },
        });

        if (!conflict) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Sync conflict not found",
          });
        }

        const updated = await prisma.documentSyncStatus.update({
          where: { id: input.id },
          data: {
            conflictResolution: input.conflictResolution,
            syncStatus: "synced",
            resolvedBy: ctx.user.id,
            resolvedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        return updated;
      }),
  }),
});