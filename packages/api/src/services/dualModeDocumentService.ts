/**
 * Dual-Mode Document Management Service
 *
 * Manages documents that exist in both physical and digital forms during
 * the transition from traditional accounting practices to digital systems.
 * Provides seamless integration and synchronization between physical file
 * cabinets and digital document management.
 */

import prisma from "@GCMC-KAJ/db";
import type { Document, DocumentVersion, PhysicalDocumentRecord, DocumentSyncStatus } from "@GCMC-KAJ/db";
import { GuyanOCRService } from "./ocrEnhancementService";
import { TRPCError } from "@trpc/server";

/**
 * Document existence modes
 */
export enum DocumentMode {
  PHYSICAL_ONLY = "physical_only",
  DIGITAL_ONLY = "digital_only",
  DUAL_MODE = "dual_mode", // Exists in both forms
  TRANSITIONING = "transitioning", // Being converted
}

/**
 * Sync status types
 */
export enum SyncStatus {
  SYNCED = "synced",
  PENDING = "pending",
  CONFLICT = "conflict",
  FAILED = "failed",
  MANUAL_REVIEW = "manual_review",
}

/**
 * Document conflict types
 */
export enum ConflictType {
  VERSION_MISMATCH = "version_mismatch",
  CONTENT_DIFFERENCE = "content_difference",
  METADATA_CONFLICT = "metadata_conflict",
  MISSING_PHYSICAL = "missing_physical",
  MISSING_DIGITAL = "missing_digital",
}

/**
 * Physical file cabinet organization structure
 */
interface FileCabinetStructure {
  cabinet: string;
  drawer: string;
  folder: string;
  position?: string;
  section?: string;
}

/**
 * Document version comparison result
 */
interface VersionComparisonResult {
  isMatch: boolean;
  confidence: number;
  differences: {
    type: 'content' | 'metadata' | 'format';
    field: string;
    physicalValue: any;
    digitalValue: any;
    significance: 'low' | 'medium' | 'high';
  }[];
  recommendation: 'accept_digital' | 'accept_physical' | 'manual_review';
}

/**
 * Migration progress tracking
 */
interface MigrationProgress {
  totalDocuments: number;
  scannedDocuments: number;
  processedDocuments: number;
  syncedDocuments: number;
  conflictDocuments: number;
  completionPercentage: number;
  estimatedTimeRemaining: number; // in hours
}

/**
 * Main Dual-Mode Document Service
 */
export class DualModeDocumentService {

  /**
   * Initialize dual-mode tracking for an existing document
   */
  static async initializeDualMode(
    tenantId: number,
    documentId: number,
    physicalLocation: FileCabinetStructure,
    userId: string
  ): Promise<DocumentSyncStatus> {

    // Verify document exists and belongs to tenant
    const document = await prisma.document.findUnique({
      where: { id: documentId, tenantId },
      include: { physicalRecords: true, syncStatus: true }
    });

    if (!document) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Document not found"
      });
    }

    // Check if already in dual mode
    if (document.syncStatus.length > 0) {
      return document.syncStatus[0];
    }

    // Create or find corresponding physical document record
    let physicalRecord = document.physicalRecords.find(r =>
      r.physicalLocation === this.formatPhysicalLocation(physicalLocation)
    );

    if (!physicalRecord) {
      // Create a new physical document record for existing digital document
      physicalRecord = await prisma.physicalDocumentRecord.create({
        data: {
          tenantId,
          migrationProjectId: 0, // Will need to be set or create a default project
          clientId: document.clientId,
          physicalLocation: this.formatPhysicalLocation(physicalLocation),
          category: document.documentType?.name || "General",
          description: document.title,
          migrationStatus: "completed", // Already exists digitally
          digitalDocumentId: documentId,
        }
      });
    }

    // Create sync status
    const syncStatus = await prisma.documentSyncStatus.create({
      data: {
        tenantId,
        digitalDocumentId: documentId,
        physicalDocumentId: physicalRecord.id,
        syncStatus: SyncStatus.SYNCED,
        lastSyncDate: new Date(),
        digitalVersion: "1.0",
        physicalVersion: "1.0",
      }
    });

    // Update document to indicate it's in dual mode
    await prisma.document.update({
      where: { id: documentId },
      data: {
        sourceType: "dual_mode",
        physicalLocation: this.formatPhysicalLocation(physicalLocation),
        updatedAt: new Date(),
      }
    });

    return syncStatus;
  }

  /**
   * Create a new document that exists in both physical and digital forms
   */
  static async createDualModeDocument(
    tenantId: number,
    clientId: number,
    documentData: {
      title: string;
      description?: string;
      documentTypeId: number;
      physicalLocation: FileCabinetStructure;
      digitalFile?: Buffer;
      scannedFrom?: 'physical';
    },
    userId: string
  ): Promise<{ document: Document; syncStatus: DocumentSyncStatus }> {

    // Create the digital document
    const document = await prisma.document.create({
      data: {
        tenantId,
        clientId,
        documentTypeId: documentData.documentTypeId,
        title: documentData.title,
        description: documentData.description,
        status: "pending_review",
        sourceType: DocumentMode.DUAL_MODE,
        physicalLocation: this.formatPhysicalLocation(documentData.physicalLocation),
        migrationDate: new Date(),
      }
    });

    // Create physical document record
    const physicalRecord = await prisma.physicalDocumentRecord.create({
      data: {
        tenantId,
        migrationProjectId: 0, // Will need proper project ID
        clientId,
        physicalLocation: this.formatPhysicalLocation(documentData.physicalLocation),
        category: "General", // Will need to be determined
        description: documentData.title,
        digitalDocumentId: document.id,
        migrationStatus: "completed",
        scanDate: new Date(),
        scannedBy: userId,
      }
    });

    // If digital file provided, process it with OCR
    if (documentData.digitalFile) {
      await this.processDigitalVersion(
        document.id,
        documentData.digitalFile,
        tenantId,
        userId
      );
    }

    // Create sync status
    const syncStatus = await prisma.documentSyncStatus.create({
      data: {
        tenantId,
        digitalDocumentId: document.id,
        physicalDocumentId: physicalRecord.id,
        syncStatus: SyncStatus.SYNCED,
        lastSyncDate: new Date(),
        digitalVersion: "1.0",
        physicalVersion: "1.0",
      }
    });

    return { document, syncStatus };
  }

  /**
   * Process and analyze digital version of document
   */
  private static async processDigitalVersion(
    documentId: number,
    fileBuffer: Buffer,
    tenantId: number,
    userId: string
  ): Promise<DocumentVersion> {

    // Perform OCR with Guyanese-specific enhancements
    const ocrResult = await GuyanOCRService.enhanceOCR(fileBuffer);

    // Create document version
    const version = await prisma.documentVersion.create({
      data: {
        documentId,
        fileUrl: `temp-storage/${documentId}-${Date.now()}.pdf`, // TODO: Actual file storage
        storageProvider: "minio",
        fileSize: fileBuffer.length,
        mimeType: "application/pdf",
        ocrText: ocrResult.extractedText,
        aiSummary: this.generateDocumentSummary(ocrResult),
        metadata: {
          ocrConfidence: ocrResult.confidenceScore,
          extractedEntities: ocrResult.extractedEntities,
          documentClassification: ocrResult.documentClassification,
          complianceFlags: ocrResult.complianceFlags,
          qualityMetrics: ocrResult.qualityMetrics,
          suggestedActions: ocrResult.suggestedActions,
        },
        uploadedAt: new Date(),
        isLatest: true,
      }
    });

    // Update document with OCR insights
    await prisma.document.update({
      where: { id: documentId },
      data: {
        latestVersionId: version.id,
        ocrConfidenceScore: ocrResult.confidenceScore,
        aiClassification: ocrResult.documentClassification,
        extractedEntities: ocrResult.extractedEntities,
        complianceFlags: ocrResult.complianceFlags,
        updatedAt: new Date(),
      }
    });

    return version;
  }

  /**
   * Compare physical and digital versions for synchronization
   */
  static async compareVersions(
    tenantId: number,
    syncStatusId: number,
    physicalChanges?: {
      lastModified: Date;
      condition: string;
      notes?: string;
    },
    digitalChanges?: {
      newVersionId: number;
      lastModified: Date;
    }
  ): Promise<VersionComparisonResult> {

    const syncStatus = await prisma.documentSyncStatus.findUnique({
      where: { id: syncStatusId, tenantId },
      include: {
        digitalDocument: {
          include: { latestVersion: true }
        },
        physicalDocument: true
      }
    });

    if (!syncStatus) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Sync status not found"
      });
    }

    const differences: VersionComparisonResult['differences'] = [];

    // Compare last modified dates
    const physicalLastModified = physicalChanges?.lastModified ||
                                syncStatus.physicalDocument?.updatedAt || new Date(0);
    const digitalLastModified = digitalChanges?.lastModified ||
                               syncStatus.digitalDocument.updatedAt;

    if (Math.abs(physicalLastModified.getTime() - digitalLastModified.getTime()) > 86400000) { // 24 hours
      differences.push({
        type: 'metadata',
        field: 'lastModified',
        physicalValue: physicalLastModified,
        digitalValue: digitalLastModified,
        significance: 'medium'
      });
    }

    // Compare document condition/quality
    if (physicalChanges?.condition && physicalChanges.condition !== 'good') {
      differences.push({
        type: 'content',
        field: 'condition',
        physicalValue: physicalChanges.condition,
        digitalValue: 'digitally_preserved',
        significance: physicalChanges.condition === 'poor' ? 'high' : 'low'
      });
    }

    // Determine confidence and recommendation
    const confidence = this.calculateComparisonConfidence(differences);
    const recommendation = this.determineRecommendation(differences);

    return {
      isMatch: differences.length === 0 || confidence > 0.8,
      confidence,
      differences,
      recommendation
    };
  }

  /**
   * Synchronize physical and digital versions
   */
  static async synchronizeVersions(
    tenantId: number,
    syncStatusId: number,
    resolution: 'prefer_digital' | 'prefer_physical' | 'merge' | 'manual_review',
    userId: string,
    notes?: string
  ): Promise<DocumentSyncStatus> {

    const syncStatus = await prisma.documentSyncStatus.findUnique({
      where: { id: syncStatusId, tenantId },
      include: {
        digitalDocument: true,
        physicalDocument: true
      }
    });

    if (!syncStatus) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Sync status not found"
      });
    }

    let updatedSyncStatus: DocumentSyncStatus;

    switch (resolution) {
      case 'prefer_digital':
        updatedSyncStatus = await this.applyDigitalVersion(syncStatus, userId, notes);
        break;

      case 'prefer_physical':
        updatedSyncStatus = await this.applyPhysicalVersion(syncStatus, userId, notes);
        break;

      case 'merge':
        updatedSyncStatus = await this.mergeVersions(syncStatus, userId, notes);
        break;

      case 'manual_review':
        updatedSyncStatus = await prisma.documentSyncStatus.update({
          where: { id: syncStatusId },
          data: {
            syncStatus: SyncStatus.MANUAL_REVIEW,
            conflictResolution: 'manual_review',
            resolvedBy: userId,
            resolvedAt: new Date(),
            updatedAt: new Date(),
          }
        });
        break;
    }

    return updatedSyncStatus;
  }

  /**
   * Get migration progress for client or project
   */
  static async getMigrationProgress(
    tenantId: number,
    clientId?: number,
    projectId?: number
  ): Promise<MigrationProgress> {

    const where: any = { tenantId };
    if (clientId) where.clientId = clientId;
    if (projectId) where.migrationProjectId = projectId;

    const [
      totalPhysical,
      scannedCount,
      processedCount,
      syncedCount,
      conflictCount
    ] = await Promise.all([
      prisma.physicalDocumentRecord.count({ where }),
      prisma.physicalDocumentRecord.count({
        where: { ...where, migrationStatus: { in: ['scanning', 'processing', 'completed'] } }
      }),
      prisma.physicalDocumentRecord.count({
        where: { ...where, migrationStatus: 'completed' }
      }),
      prisma.documentSyncStatus.count({
        where: { tenantId, syncStatus: SyncStatus.SYNCED }
      }),
      prisma.documentSyncStatus.count({
        where: { tenantId, syncStatus: SyncStatus.CONFLICT }
      })
    ]);

    const completionPercentage = totalPhysical > 0
      ? Math.round((processedCount / totalPhysical) * 100)
      : 0;

    // Estimate time remaining based on processing rate
    const remainingDocuments = totalPhysical - processedCount;
    const estimatedTimeRemaining = remainingDocuments * 0.5; // 30 minutes per document estimate

    return {
      totalDocuments: totalPhysical,
      scannedDocuments: scannedCount,
      processedDocuments: processedCount,
      syncedDocuments: syncedCount,
      conflictDocuments: conflictCount,
      completionPercentage,
      estimatedTimeRemaining
    };
  }

  /**
   * Handle document disposal after successful digitization
   */
  static async schedulePhysicalDisposal(
    tenantId: number,
    physicalDocumentId: number,
    disposalMethod: 'return_to_client' | 'secure_destruction' | 'archive',
    scheduledDate: Date,
    userId: string,
    notes?: string
  ): Promise<PhysicalDocumentRecord> {

    const physicalDoc = await prisma.physicalDocumentRecord.findUnique({
      where: { id: physicalDocumentId, tenantId },
      include: { digitalDocument: true }
    });

    if (!physicalDoc) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Physical document not found"
      });
    }

    // Verify document has been successfully digitized
    if (!physicalDoc.digitalDocument || physicalDoc.migrationStatus !== 'completed') {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Document must be completed and digitized before disposal"
      });
    }

    const updated = await prisma.physicalDocumentRecord.update({
      where: { id: physicalDocumentId },
      data: {
        disposalScheduled: true,
        disposalDate: scheduledDate,
        disposalMethod,
        disposalApprovalBy: userId,
        updatedAt: new Date(),
        processingNotes: notes || physicalDoc.processingNotes,
      }
    });

    return updated;
  }

  /**
   * Client notification system for document status changes
   */
  static async notifyClientOfChanges(
    tenantId: number,
    clientId: number,
    changeType: 'digitization_complete' | 'sync_conflict' | 'disposal_scheduled' | 'access_ready',
    documentIds: number[],
    method: 'email' | 'sms' | 'portal_message' = 'email'
  ): Promise<void> {

    const client = await prisma.client.findUnique({
      where: { id: clientId, tenantId }
    });

    if (!client) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Client not found"
      });
    }

    // Create notification record
    const notificationMessage = this.generateClientNotificationMessage(
      changeType,
      documentIds.length,
      client.name
    );

    await prisma.notification.create({
      data: {
        tenantId,
        recipientUserId: clientId.toString(), // This would need proper user ID mapping
        type: method,
        channelStatus: 'pending',
        message: notificationMessage,
        metadata: {
          changeType,
          documentIds,
          clientId
        }
      }
    });

    // Update sync status notifications if applicable
    if (changeType === 'sync_conflict' || changeType === 'access_ready') {
      await prisma.documentSyncStatus.updateMany({
        where: {
          tenantId,
          digitalDocumentId: { in: documentIds }
        },
        data: {
          clientNotified: true,
          clientNotifiedAt: new Date(),
          notificationMethod: method
        }
      });
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private static formatPhysicalLocation(location: FileCabinetStructure): string {
    const parts = [location.cabinet, location.drawer, location.folder];
    if (location.section) parts.push(location.section);
    if (location.position) parts.push(location.position);

    return parts.join(' > ');
  }

  private static generateDocumentSummary(ocrResult: any): string {
    const classification = ocrResult.documentClassification;
    const entities = ocrResult.extractedEntities;

    let summary = `Document Type: ${classification.type || 'Unknown'}\n`;
    summary += `Category: ${classification.category || 'General'}\n`;
    summary += `Confidence: ${Math.round(ocrResult.confidenceScore * 100)}%\n\n`;

    if (entities.tin?.length) {
      summary += `TIN Numbers: ${entities.tin.join(', ')}\n`;
    }
    if (entities.amounts?.length) {
      summary += `Amounts Found: ${entities.amounts.slice(0, 3).join(', ')}\n`;
    }
    if (entities.dates?.length) {
      summary += `Dates Found: ${entities.dates.slice(0, 3).join(', ')}\n`;
    }

    return summary;
  }

  private static calculateComparisonConfidence(differences: any[]): number {
    if (differences.length === 0) return 1.0;

    const highSigDiffs = differences.filter(d => d.significance === 'high').length;
    const mediumSigDiffs = differences.filter(d => d.significance === 'medium').length;
    const lowSigDiffs = differences.filter(d => d.significance === 'low').length;

    // Weight differences by significance
    const weightedDifferences = (highSigDiffs * 0.5) + (mediumSigDiffs * 0.3) + (lowSigDiffs * 0.1);
    return Math.max(0, 1 - weightedDifferences);
  }

  private static determineRecommendation(differences: any[]): VersionComparisonResult['recommendation'] {
    const hasHighSig = differences.some(d => d.significance === 'high');
    const hasMediumSig = differences.some(d => d.significance === 'medium');

    if (hasHighSig) return 'manual_review';
    if (hasMediumSig || differences.length > 3) return 'manual_review';
    return 'accept_digital';
  }

  private static async applyDigitalVersion(
    syncStatus: any,
    userId: string,
    notes?: string
  ): Promise<DocumentSyncStatus> {

    return prisma.documentSyncStatus.update({
      where: { id: syncStatus.id },
      data: {
        syncStatus: SyncStatus.SYNCED,
        conflictResolution: 'prefer_digital',
        resolvedBy: userId,
        resolvedAt: new Date(),
        lastSyncDate: new Date(),
        digitalVersion: (parseInt(syncStatus.digitalVersion || "1") + 1).toString(),
        updatedAt: new Date(),
      }
    });
  }

  private static async applyPhysicalVersion(
    syncStatus: any,
    userId: string,
    notes?: string
  ): Promise<DocumentSyncStatus> {

    return prisma.documentSyncStatus.update({
      where: { id: syncStatus.id },
      data: {
        syncStatus: SyncStatus.SYNCED,
        conflictResolution: 'prefer_physical',
        resolvedBy: userId,
        resolvedAt: new Date(),
        lastSyncDate: new Date(),
        physicalVersion: (parseInt(syncStatus.physicalVersion || "1") + 1).toString(),
        updatedAt: new Date(),
      }
    });
  }

  private static async mergeVersions(
    syncStatus: any,
    userId: string,
    notes?: string
  ): Promise<DocumentSyncStatus> {

    // For merge, we'll create a new version that combines both
    return prisma.documentSyncStatus.update({
      where: { id: syncStatus.id },
      data: {
        syncStatus: SyncStatus.SYNCED,
        conflictResolution: 'merge',
        resolvedBy: userId,
        resolvedAt: new Date(),
        lastSyncDate: new Date(),
        syncVersion: syncStatus.syncVersion + 1,
        updatedAt: new Date(),
      }
    });
  }

  private static generateClientNotificationMessage(
    changeType: string,
    documentCount: number,
    clientName: string
  ): string {

    const docText = documentCount === 1 ? 'document' : 'documents';

    switch (changeType) {
      case 'digitization_complete':
        return `Dear ${clientName}, we've successfully digitized ${documentCount} ${docText} from your physical files. They are now available in your digital portal.`;

      case 'sync_conflict':
        return `Dear ${clientName}, we've detected discrepancies in ${documentCount} ${docText} between physical and digital versions. Please review and approve the resolution.`;

      case 'disposal_scheduled':
        return `Dear ${clientName}, ${documentCount} physical ${docText} have been successfully digitized and are scheduled for disposal/return as requested.`;

      case 'access_ready':
        return `Dear ${clientName}, your ${documentCount} migrated ${docText} are now fully accessible through our digital platform.`;

      default:
        return `Dear ${clientName}, there has been an update regarding ${documentCount} of your ${docText}.`;
    }
  }
}