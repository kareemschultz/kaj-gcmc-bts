/**
 * Legacy Integration Bridge Service
 *
 * Handles bulk data migration from legacy accounting systems to GCMC-KAJ platform.
 * Supports QuickBooks, Excel spreadsheets, paper records, and other legacy systems
 * commonly used by traditional accounting practices in Guyana.
 */

import prisma from "@GCMC-KAJ/db";
import type { LegacyDataImportJob, LegacyDataImportRecord, Client } from "@GCMC-KAJ/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

/**
 * Supported legacy system types
 */
export enum LegacySystemType {
  QUICKBOOKS_DESKTOP = "quickbooks_desktop",
  QUICKBOOKS_ONLINE = "quickbooks_online",
  EXCEL_SPREADSHEET = "excel_spreadsheet",
  CSV_FILES = "csv_files",
  PAPER_RECORDS = "paper_records",
  SAGE_50 = "sage_50",
  SIMPLY_ACCOUNTING = "simply_accounting",
  CUSTOM_DATABASE = "custom_database",
  MANUAL_RECORDS = "manual_records"
}

/**
 * Data mapping strategies
 */
export enum MappingStrategy {
  AUTO_DETECT = "auto_detect",
  TEMPLATE_BASED = "template_based",
  CUSTOM_MAPPING = "custom_mapping",
  AI_ASSISTED = "ai_assisted"
}

/**
 * Transformation rule types
 */
export enum TransformationType {
  FIELD_RENAME = "field_rename",
  DATA_TYPE_CONVERSION = "data_type_conversion",
  VALUE_MAPPING = "value_mapping",
  FORMAT_STANDARDIZATION = "format_standardization",
  VALIDATION = "validation",
  ENRICHMENT = "enrichment"
}

/**
 * Legacy system connection configuration
 */
interface LegacySystemConfig {
  type: LegacySystemType;
  connectionString?: string;
  filePath?: string;
  credentials?: {
    username?: string;
    password?: string;
    apiKey?: string;
    token?: string;
  };
  settings?: Record<string, any>;
}

/**
 * Field mapping configuration
 */
interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: {
    type: TransformationType;
    parameters: Record<string, any>;
  };
  required: boolean;
  defaultValue?: any;
}

/**
 * Data validation rule
 */
interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  parameters: Record<string, any>;
  errorMessage: string;
}

/**
 * Import progress callback
 */
type ProgressCallback = (progress: {
  jobId: number;
  phase: string;
  completed: number;
  total: number;
  percentage: number;
  message: string;
}) => void;

/**
 * Legacy data record with validation results
 */
interface ProcessedRecord {
  originalData: Record<string, any>;
  transformedData: Record<string, any>;
  validationResults: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    qualityScore: number;
  };
  duplicateInfo?: {
    isDuplicate: boolean;
    duplicateOf?: number;
    similarity: number;
  };
  targetEntity: 'client' | 'document' | 'transaction' | 'business' | 'contact';
  importStatus: 'pending' | 'processed' | 'failed' | 'skipped';
}

/**
 * Main Legacy Integration Service
 */
export class LegacyIntegrationService {

  /**
   * Create and configure a new legacy data import job
   */
  static async createImportJob(
    tenantId: number,
    jobConfig: {
      name: string;
      description?: string;
      systemType: LegacySystemType;
      systemConfig: LegacySystemConfig;
      fieldMappings: FieldMapping[];
      validationRules: ValidationRule[];
      importSettings: {
        batchSize?: number;
        validateData?: boolean;
        skipDuplicates?: boolean;
        updateExisting?: boolean;
        qualityThreshold?: number;
        manualReviewRequired?: boolean;
      };
      scheduledStartTime?: Date;
    },
    userId: string
  ): Promise<LegacyDataImportJob> {

    // Validate system configuration
    await this.validateSystemConfig(jobConfig.systemConfig);

    // Create transformation rules from field mappings
    const transformationRules = this.buildTransformationRules(
      jobConfig.fieldMappings,
      jobConfig.validationRules
    );

    const job = await prisma.legacyDataImportJob.create({
      data: {
        tenantId,
        name: jobConfig.name,
        description: jobConfig.description,
        sourceSystem: jobConfig.systemType,
        sourceLocation: jobConfig.systemConfig.filePath || jobConfig.systemConfig.connectionString,
        fieldMapping: {
          mappings: jobConfig.fieldMappings,
          strategy: MappingStrategy.CUSTOM_MAPPING
        },
        transformationRules,
        dataFilters: {}, // Can be extended for filtering rules
        batchSize: jobConfig.importSettings.batchSize || 100,
        validateData: jobConfig.importSettings.validateData ?? true,
        skipDuplicates: jobConfig.importSettings.skipDuplicates ?? true,
        updateExisting: jobConfig.importSettings.updateExisting ?? false,
        qualityThreshold: jobConfig.importSettings.qualityThreshold || 0.95,
        manualReviewRequired: jobConfig.importSettings.manualReviewRequired ?? false,
        scheduledStartTime: jobConfig.scheduledStartTime,
        metadata: {
          systemConfig: jobConfig.systemConfig,
          validationRules: jobConfig.validationRules
        },
        createdBy: userId,
      }
    });

    return job;
  }

  /**
   * Execute a legacy data import job
   */
  static async executeImportJob(
    tenantId: number,
    jobId: number,
    progressCallback?: ProgressCallback
  ): Promise<{
    success: boolean;
    totalProcessed: number;
    successfulRecords: number;
    failedRecords: number;
    warnings: string[];
    errors: string[];
  }> {

    const job = await prisma.legacyDataImportJob.findUnique({
      where: { id: jobId, tenantId }
    });

    if (!job) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Import job not found"
      });
    }

    // Update job status to running
    await prisma.legacyDataImportJob.update({
      where: { id: jobId },
      data: {
        status: "running",
        actualStartTime: new Date()
      }
    });

    let totalProcessed = 0;
    let successfulRecords = 0;
    let failedRecords = 0;
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Phase 1: Extract data from legacy system
      progressCallback?.({
        jobId,
        phase: "extraction",
        completed: 0,
        total: 100,
        percentage: 0,
        message: "Connecting to legacy system..."
      });

      const rawData = await this.extractDataFromLegacySystem(
        job.sourceSystem as LegacySystemType,
        job.metadata as any,
        job.dataFilters as any
      );

      if (!rawData || rawData.length === 0) {
        throw new Error("No data found in legacy system");
      }

      // Update total records estimate
      await prisma.legacyDataImportJob.update({
        where: { id: jobId },
        data: { totalRecords: rawData.length }
      });

      // Phase 2: Transform and validate data
      progressCallback?.({
        jobId,
        phase: "transformation",
        completed: 0,
        total: rawData.length,
        percentage: 10,
        message: "Transforming data..."
      });

      const processedRecords: ProcessedRecord[] = [];

      for (let i = 0; i < rawData.length; i += job.batchSize) {
        const batch = rawData.slice(i, i + job.batchSize);

        for (const record of batch) {
          try {
            const processed = await this.processRecord(
              record,
              job.fieldMapping as any,
              job.transformationRules as any,
              job.metadata as any
            );

            processedRecords.push(processed);

            if (!processed.validationResults.isValid) {
              warnings.push(`Record ${i + 1}: ${processed.validationResults.errors.join(', ')}`);
            }

          } catch (error) {
            errors.push(`Record ${i + 1}: ${error.message}`);
            failedRecords++;
          }
        }

        totalProcessed = Math.min(i + job.batchSize, rawData.length);

        progressCallback?.({
          jobId,
          phase: "transformation",
          completed: totalProcessed,
          total: rawData.length,
          percentage: 10 + (totalProcessed / rawData.length) * 30,
          message: `Processed ${totalProcessed} of ${rawData.length} records...`
        });

        // Update job progress
        await prisma.legacyDataImportJob.update({
          where: { id: jobId },
          data: {
            processedRecords: totalProcessed,
            failedRecords,
            updatedAt: new Date()
          }
        });
      }

      // Phase 3: Duplicate detection
      progressCallback?.({
        jobId,
        phase: "duplicate_detection",
        completed: 0,
        total: processedRecords.length,
        percentage: 45,
        message: "Detecting duplicates..."
      });

      await this.detectDuplicates(processedRecords, tenantId);

      // Phase 4: Import valid records
      progressCallback?.({
        jobId,
        phase: "import",
        completed: 0,
        total: processedRecords.length,
        percentage: 60,
        message: "Importing records..."
      });

      const validRecords = processedRecords.filter(r =>
        r.validationResults.isValid &&
        r.validationResults.qualityScore >= job.qualityThreshold &&
        (!job.skipDuplicates || !r.duplicateInfo?.isDuplicate)
      );

      for (let i = 0; i < validRecords.length; i += job.batchSize) {
        const batch = validRecords.slice(i, i + job.batchSize);

        for (const record of batch) {
          try {
            await this.importRecord(record, tenantId, jobId);
            successfulRecords++;
            record.importStatus = 'processed';
          } catch (error) {
            errors.push(`Import failed for record: ${error.message}`);
            record.importStatus = 'failed';
            failedRecords++;
          }
        }

        const importedCount = Math.min(i + job.batchSize, validRecords.length);

        progressCallback?.({
          jobId,
          phase: "import",
          completed: importedCount,
          total: validRecords.length,
          percentage: 60 + (importedCount / validRecords.length) * 35,
          message: `Imported ${importedCount} of ${validRecords.length} valid records...`
        });
      }

      // Phase 5: Create import records for tracking
      await this.createImportRecords(processedRecords, tenantId, jobId);

      // Complete the job
      const completionTime = new Date();
      const duration = completionTime.getTime() - job.actualStartTime!.getTime();

      await prisma.legacyDataImportJob.update({
        where: { id: jobId },
        data: {
          status: "completed",
          completionTime,
          successfulRecords,
          failedRecords,
          processedRecords: totalProcessed,
          importSummary: {
            totalExtracted: rawData.length,
            validRecords: validRecords.length,
            duplicatesFound: processedRecords.filter(r => r.duplicateInfo?.isDuplicate).length,
            qualityIssues: processedRecords.filter(r => r.validationResults.qualityScore < job.qualityThreshold).length,
            duration: duration
          },
          errorLog: errors,
          warningLog: warnings
        }
      });

      progressCallback?.({
        jobId,
        phase: "completed",
        completed: totalProcessed,
        total: totalProcessed,
        percentage: 100,
        message: "Import completed successfully!"
      });

      return {
        success: true,
        totalProcessed,
        successfulRecords,
        failedRecords,
        warnings,
        errors
      };

    } catch (error) {
      // Handle job failure
      await prisma.legacyDataImportJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          errorLog: [...errors, error.message],
          completionTime: new Date()
        }
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Import job failed: ${error.message}`
      });
    }
  }

  /**
   * Get predefined mapping templates for common legacy systems
   */
  static getMappingTemplates(systemType: LegacySystemType): {
    clientMappings: FieldMapping[];
    businessMappings: FieldMapping[];
    documentMappings: FieldMapping[];
  } {

    const templates = {
      [LegacySystemType.QUICKBOOKS_DESKTOP]: {
        clientMappings: [
          {
            sourceField: "Customer_Name",
            targetField: "name",
            required: true,
            transformation: {
              type: TransformationType.FORMAT_STANDARDIZATION,
              parameters: { trim: true, titleCase: true }
            }
          },
          {
            sourceField: "Customer_Email",
            targetField: "email",
            required: false,
            transformation: {
              type: TransformationType.VALIDATION,
              parameters: { format: "email" }
            }
          },
          {
            sourceField: "Customer_Phone",
            targetField: "phone",
            required: false,
            transformation: {
              type: TransformationType.FORMAT_STANDARDIZATION,
              parameters: { phoneFormat: "guyanese" }
            }
          },
          {
            sourceField: "Customer_Type",
            targetField: "type",
            required: true,
            transformation: {
              type: TransformationType.VALUE_MAPPING,
              parameters: {
                mapping: {
                  "Individual": "individual",
                  "Company": "company",
                  "Corporation": "company",
                  "Partnership": "partnership"
                }
              }
            }
          }
        ],
        businessMappings: [
          {
            sourceField: "Company_Name",
            targetField: "name",
            required: true,
            transformation: {
              type: TransformationType.FORMAT_STANDARDIZATION,
              parameters: { trim: true, titleCase: true }
            }
          },
          {
            sourceField: "Business_Type",
            targetField: "businessType",
            required: false,
            transformation: {
              type: TransformationType.VALUE_MAPPING,
              parameters: {
                mapping: {
                  "Corp": "corporation",
                  "LLC": "limited_liability",
                  "Partnership": "partnership",
                  "Sole Prop": "sole_proprietorship"
                }
              }
            }
          }
        ],
        documentMappings: [
          {
            sourceField: "Transaction_Date",
            targetField: "date",
            required: true,
            transformation: {
              type: TransformationType.DATA_TYPE_CONVERSION,
              parameters: { fromType: "string", toType: "date", format: "MM/DD/YYYY" }
            }
          },
          {
            sourceField: "Transaction_Amount",
            targetField: "amount",
            required: true,
            transformation: {
              type: TransformationType.DATA_TYPE_CONVERSION,
              parameters: { fromType: "string", toType: "number", currency: "GYD" }
            }
          }
        ]
      },

      [LegacySystemType.EXCEL_SPREADSHEET]: {
        clientMappings: [
          {
            sourceField: "Client Name",
            targetField: "name",
            required: true,
            transformation: {
              type: TransformationType.FORMAT_STANDARDIZATION,
              parameters: { trim: true, titleCase: true }
            }
          },
          {
            sourceField: "Email Address",
            targetField: "email",
            required: false,
            transformation: {
              type: TransformationType.VALIDATION,
              parameters: { format: "email" }
            }
          },
          {
            sourceField: "TIN Number",
            targetField: "tin",
            required: false,
            transformation: {
              type: TransformationType.FORMAT_STANDARDIZATION,
              parameters: { format: "guyanese_tin" }
            }
          }
        ],
        businessMappings: [
          {
            sourceField: "Business Name",
            targetField: "name",
            required: true,
            transformation: {
              type: TransformationType.FORMAT_STANDARDIZATION,
              parameters: { trim: true, titleCase: true }
            }
          }
        ],
        documentMappings: [
          {
            sourceField: "Date",
            targetField: "date",
            required: true,
            transformation: {
              type: TransformationType.DATA_TYPE_CONVERSION,
              parameters: { fromType: "string", toType: "date", format: "auto" }
            }
          }
        ]
      }
    };

    return templates[systemType] || {
      clientMappings: [],
      businessMappings: [],
      documentMappings: []
    };
  }

  /**
   * Analyze legacy data file and suggest mappings
   */
  static async analyzeDataStructure(
    fileBuffer: Buffer,
    systemType: LegacySystemType
  ): Promise<{
    detectedFields: string[];
    suggestedMappings: FieldMapping[];
    dataQualityReport: {
      totalRecords: number;
      completeness: Record<string, number>;
      dataTypes: Record<string, string>;
      duplicateRate: number;
      qualityScore: number;
    };
  }> {

    // Parse the file based on system type
    const rawData = await this.parseDataFile(fileBuffer, systemType);

    if (!rawData || rawData.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No data found in the provided file"
      });
    }

    const detectedFields = Object.keys(rawData[0]);
    const templates = this.getMappingTemplates(systemType);

    // Suggest mappings based on field name similarity
    const suggestedMappings: FieldMapping[] = [];

    for (const field of detectedFields) {
      const suggestion = this.findBestMapping(field, templates);
      if (suggestion) {
        suggestedMappings.push(suggestion);
      }
    }

    // Analyze data quality
    const dataQualityReport = this.analyzeDataQuality(rawData, detectedFields);

    return {
      detectedFields,
      suggestedMappings,
      dataQualityReport
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private static async validateSystemConfig(config: LegacySystemConfig): Promise<void> {
    switch (config.type) {
      case LegacySystemType.EXCEL_SPREADSHEET:
      case LegacySystemType.CSV_FILES:
        if (!config.filePath) {
          throw new Error("File path is required for file-based imports");
        }
        break;

      case LegacySystemType.QUICKBOOKS_DESKTOP:
        if (!config.filePath) {
          throw new Error("QuickBooks file path is required");
        }
        break;

      case LegacySystemType.CUSTOM_DATABASE:
        if (!config.connectionString) {
          throw new Error("Database connection string is required");
        }
        break;
    }
  }

  private static buildTransformationRules(
    mappings: FieldMapping[],
    validationRules: ValidationRule[]
  ): Record<string, any> {

    const rules: Record<string, any> = {
      fieldTransformations: {},
      validations: {},
      enrichments: {}
    };

    // Build transformation rules from mappings
    for (const mapping of mappings) {
      if (mapping.transformation) {
        rules.fieldTransformations[mapping.sourceField] = {
          targetField: mapping.targetField,
          type: mapping.transformation.type,
          parameters: mapping.transformation.parameters,
          required: mapping.required,
          defaultValue: mapping.defaultValue
        };
      }
    }

    // Add validation rules
    for (const validation of validationRules) {
      rules.validations[validation.field] = {
        type: validation.type,
        parameters: validation.parameters,
        errorMessage: validation.errorMessage
      };
    }

    return rules;
  }

  private static async extractDataFromLegacySystem(
    systemType: LegacySystemType,
    config: any,
    filters: any
  ): Promise<Record<string, any>[]> {

    switch (systemType) {
      case LegacySystemType.EXCEL_SPREADSHEET:
      case LegacySystemType.CSV_FILES:
        // TODO: Implement Excel/CSV parsing
        return []; // Placeholder

      case LegacySystemType.QUICKBOOKS_DESKTOP:
        // TODO: Implement QuickBooks data extraction
        return []; // Placeholder

      default:
        throw new Error(`Unsupported system type: ${systemType}`);
    }
  }

  private static async processRecord(
    record: Record<string, any>,
    mappings: any,
    transformations: any,
    config: any
  ): Promise<ProcessedRecord> {

    const transformedData: Record<string, any> = {};
    const validationResults = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      qualityScore: 1.0
    };

    // Apply transformations
    for (const [sourceField, transformation] of Object.entries(transformations.fieldTransformations)) {
      const value = record[sourceField];

      try {
        const transformedValue = await this.applyTransformation(value, transformation as any);
        transformedData[(transformation as any).targetField] = transformedValue;
      } catch (error) {
        validationResults.errors.push(`Transformation failed for ${sourceField}: ${error.message}`);
        validationResults.isValid = false;
      }
    }

    // Apply validations
    for (const [field, validation] of Object.entries(transformations.validations)) {
      try {
        await this.validateField(transformedData[field], validation as any);
      } catch (error) {
        validationResults.errors.push(`Validation failed for ${field}: ${error.message}`);
        validationResults.isValid = false;
      }
    }

    // Calculate quality score
    validationResults.qualityScore = this.calculateRecordQuality(transformedData, validationResults);

    return {
      originalData: record,
      transformedData,
      validationResults,
      targetEntity: this.determineTargetEntity(transformedData),
      importStatus: 'pending'
    };
  }

  private static async applyTransformation(value: any, transformation: any): Promise<any> {
    switch (transformation.type) {
      case TransformationType.FORMAT_STANDARDIZATION:
        return this.standardizeFormat(value, transformation.parameters);

      case TransformationType.DATA_TYPE_CONVERSION:
        return this.convertDataType(value, transformation.parameters);

      case TransformationType.VALUE_MAPPING:
        return this.mapValue(value, transformation.parameters);

      default:
        return value;
    }
  }

  private static standardizeFormat(value: any, params: any): any {
    if (typeof value === 'string') {
      let result = value;

      if (params.trim) result = result.trim();
      if (params.titleCase) {
        result = result.replace(/\w\S*/g, (txt) =>
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      }
      if (params.phoneFormat === 'guyanese') {
        // Format Guyanese phone numbers
        const digits = result.replace(/\D/g, '');
        if (digits.length === 7) {
          result = `+592-${digits.substring(0, 3)}-${digits.substring(3)}`;
        }
      }
      if (params.format === 'guyanese_tin') {
        // Format TIN numbers
        const digits = result.replace(/\D/g, '');
        if (digits.length === 9) {
          result = `${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6)}`;
        }
      }

      return result;
    }

    return value;
  }

  private static convertDataType(value: any, params: any): any {
    switch (params.toType) {
      case 'date':
        if (params.format === 'auto') {
          return new Date(value);
        }
        // TODO: Implement specific date format parsing
        return new Date(value);

      case 'number':
        if (params.currency) {
          const numStr = value.toString().replace(/[^\d.-]/g, '');
          return parseFloat(numStr);
        }
        return Number(value);

      default:
        return value;
    }
  }

  private static mapValue(value: any, params: any): any {
    if (params.mapping && params.mapping[value]) {
      return params.mapping[value];
    }
    return value;
  }

  private static async validateField(value: any, validation: any): Promise<void> {
    switch (validation.type) {
      case 'required':
        if (!value || value === '') {
          throw new Error(validation.errorMessage);
        }
        break;

      case 'format':
        if (validation.parameters.format === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (value && !emailRegex.test(value)) {
            throw new Error(validation.errorMessage);
          }
        }
        break;
    }
  }

  private static calculateRecordQuality(data: Record<string, any>, validation: any): number {
    let score = 1.0;

    // Reduce score for each error
    score -= validation.errors.length * 0.2;

    // Reduce score for missing important fields
    const importantFields = ['name', 'email', 'type'];
    for (const field of importantFields) {
      if (!data[field]) {
        score -= 0.1;
      }
    }

    return Math.max(0, score);
  }

  private static determineTargetEntity(data: Record<string, any>): ProcessedRecord['targetEntity'] {
    if (data.name && (data.type || data.email)) {
      return 'client';
    }
    if (data.businessName || data.companyName) {
      return 'business';
    }
    if (data.amount || data.date) {
      return 'transaction';
    }
    return 'client'; // Default fallback
  }

  private static async detectDuplicates(records: ProcessedRecord[], tenantId: number): Promise<void> {
    // TODO: Implement duplicate detection algorithm
    // For now, just mark as no duplicates
    records.forEach(record => {
      record.duplicateInfo = {
        isDuplicate: false,
        similarity: 0
      };
    });
  }

  private static async importRecord(
    record: ProcessedRecord,
    tenantId: number,
    jobId: number
  ): Promise<void> {

    switch (record.targetEntity) {
      case 'client':
        await this.importClientRecord(record, tenantId);
        break;

      case 'business':
        await this.importBusinessRecord(record, tenantId);
        break;

      case 'transaction':
        await this.importTransactionRecord(record, tenantId);
        break;
    }
  }

  private static async importClientRecord(record: ProcessedRecord, tenantId: number): Promise<Client> {
    return prisma.client.create({
      data: {
        tenantId,
        name: record.transformedData.name,
        email: record.transformedData.email,
        phone: record.transformedData.phone,
        type: record.transformedData.type || 'individual',
        tin: record.transformedData.tin,
        address: record.transformedData.address,
        migrationStatus: 'completed',
        legacySystemInfo: {
          sourceSystem: 'legacy_import',
          originalData: record.originalData
        }
      }
    });
  }

  private static async importBusinessRecord(record: ProcessedRecord, tenantId: number): Promise<void> {
    // TODO: Implement business record import
  }

  private static async importTransactionRecord(record: ProcessedRecord, tenantId: number): Promise<void> {
    // TODO: Implement transaction record import
  }

  private static async createImportRecords(
    records: ProcessedRecord[],
    tenantId: number,
    jobId: number
  ): Promise<void> {

    const importRecords = records.map((record, index) => ({
      tenantId,
      importJobId: jobId,
      sourceRecordId: index.toString(),
      recordType: record.targetEntity,
      status: record.importStatus,
      sourceData: record.originalData,
      transformedData: record.transformedData,
      qualityScore: record.validationResults.qualityScore,
      validationErrors: record.validationResults.errors,
      validationWarnings: record.validationResults.warnings,
      isDuplicate: record.duplicateInfo?.isDuplicate || false,
      processedAt: record.importStatus === 'processed' ? new Date() : undefined,
    }));

    // Batch insert import records
    for (let i = 0; i < importRecords.length; i += 100) {
      const batch = importRecords.slice(i, i + 100);
      await prisma.legacyDataImportRecord.createMany({
        data: batch
      });
    }
  }

  private static async parseDataFile(buffer: Buffer, systemType: LegacySystemType): Promise<Record<string, any>[]> {
    // TODO: Implement actual file parsing based on system type
    // For now, return placeholder data
    return [];
  }

  private static findBestMapping(fieldName: string, templates: any): FieldMapping | null {
    const allMappings = [
      ...templates.clientMappings,
      ...templates.businessMappings,
      ...templates.documentMappings
    ];

    // Simple string similarity matching
    for (const mapping of allMappings) {
      if (fieldName.toLowerCase().includes(mapping.sourceField.toLowerCase()) ||
          mapping.sourceField.toLowerCase().includes(fieldName.toLowerCase())) {
        return {
          ...mapping,
          sourceField: fieldName
        };
      }
    }

    return null;
  }

  private static analyzeDataQuality(
    data: Record<string, any>[],
    fields: string[]
  ): any {

    const totalRecords = data.length;
    const completeness: Record<string, number> = {};
    const dataTypes: Record<string, string> = {};

    // Calculate completeness for each field
    for (const field of fields) {
      const nonEmptyCount = data.filter(record =>
        record[field] !== null &&
        record[field] !== undefined &&
        record[field] !== ''
      ).length;

      completeness[field] = nonEmptyCount / totalRecords;

      // Determine data type
      const sampleValue = data.find(r => r[field])?.field;
      dataTypes[field] = typeof sampleValue || 'unknown';
    }

    // Simple duplicate detection
    const uniqueRecords = new Set(data.map(r => JSON.stringify(r)));
    const duplicateRate = 1 - (uniqueRecords.size / totalRecords);

    // Calculate overall quality score
    const avgCompleteness = Object.values(completeness).reduce((a, b) => a + b, 0) / fields.length;
    const qualityScore = (avgCompleteness * 0.7) + ((1 - duplicateRate) * 0.3);

    return {
      totalRecords,
      completeness,
      dataTypes,
      duplicateRate,
      qualityScore
    };
  }
}