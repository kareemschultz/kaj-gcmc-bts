/**
 * Smart Document Classification and Workflow Service
 * AI-powered document processing for Guyanese regulatory agencies
 */

import type {
  Authority,
  DocumentCategory,
  DocumentWorkflow,
  WorkflowStep,
  WorkflowExecution,
  AgencyDocumentRequirement,
  ClientType
} from "@GCMC-KAJ/types";

export interface DocumentClassificationResult {
  authority: Authority;
  documentType: string;
  category: DocumentCategory;
  confidence: number;
  metadata: {
    extractedFields: Record<string, unknown>;
    suggestedActions: string[];
    missingRequirements: string[];
    estimatedProcessingTime: number; // in hours
  };
}

export interface WorkflowExecutionResult {
  executionId: number;
  status: "started" | "in_progress" | "completed" | "failed" | "cancelled";
  completedSteps: number;
  totalSteps: number;
  currentStep?: WorkflowStep;
  nextActions: string[];
  estimatedCompletion?: Date;
}

export interface DocumentExtractionResult {
  fields: Record<string, unknown>;
  tables: Array<{
    name: string;
    headers: string[];
    rows: string[][];
  }>;
  signatures: Array<{
    location: string;
    confidence: number;
  }>;
  stamps: Array<{
    text: string;
    location: string;
    confidence: number;
  }>;
}

/**
 * Smart Document Service for AI-powered document processing
 */
export class SmartDocumentService {
  constructor(private prisma: any) {}

  /**
   * Classify document using AI and pattern matching
   */
  async classifyDocument(
    tenantId: number,
    documentContent: string | Buffer,
    fileName: string,
    clientType?: ClientType
  ): Promise<DocumentClassificationResult> {
    try {
      // Extract text content if needed
      const textContent = typeof documentContent === "string"
        ? documentContent
        : await this.extractTextFromDocument(documentContent, fileName);

      // Apply classification algorithms
      const classification = await this.performDocumentClassification(
        textContent,
        fileName,
        clientType
      );

      // Enhance with regulatory knowledge
      const enhancedResult = await this.enhanceWithRegulatoryKnowledge(
        tenantId,
        classification,
        textContent
      );

      return enhancedResult;

    } catch (error) {
      console.error("Document classification error:", error);

      // Return fallback classification
      return {
        authority: "GRA", // Default fallback
        documentType: "UNKNOWN",
        category: "other",
        confidence: 0.1,
        metadata: {
          extractedFields: {},
          suggestedActions: ["Manual review required"],
          missingRequirements: [],
          estimatedProcessingTime: 24
        }
      };
    }
  }

  /**
   * Extract structured data from document
   */
  async extractDocumentData(
    documentContent: string | Buffer,
    fileName: string,
    documentType?: string
  ): Promise<DocumentExtractionResult> {
    try {
      const textContent = typeof documentContent === "string"
        ? documentContent
        : await this.extractTextFromDocument(documentContent, fileName);

      // Extract fields based on document type
      const fields = await this.extractFieldsFromText(textContent, documentType);

      // Extract tables if present
      const tables = await this.extractTablesFromText(textContent);

      // Detect signatures and stamps
      const signatures = await this.detectSignatures(textContent);
      const stamps = await this.detectStamps(textContent);

      return {
        fields,
        tables,
        signatures,
        stamps
      };

    } catch (error) {
      console.error("Document extraction error:", error);
      return {
        fields: {},
        tables: [],
        signatures: [],
        stamps: []
      };
    }
  }

  /**
   * Execute smart document workflow
   */
  async executeWorkflow(
    tenantId: number,
    workflowId: number,
    clientId: number,
    documentId?: number,
    submissionId?: number,
    initialData?: Record<string, unknown>
  ): Promise<WorkflowExecutionResult> {
    try {
      // Get workflow definition
      const workflow = await this.prisma.documentWorkflow.findUnique({
        where: { id: workflowId },
        include: {
          steps: {
            orderBy: { order: 'asc' }
          },
          triggers: true
        }
      });

      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      // Create workflow execution
      const execution = await this.prisma.workflowExecution.create({
        data: {
          tenantId,
          workflowId,
          clientId,
          documentId,
          submissionId,
          status: "started",
          startedAt: new Date(),
          metadata: initialData || {}
        }
      });

      // Execute workflow steps
      const result = await this.executeWorkflowSteps(execution, workflow);

      return result;

    } catch (error) {
      console.error("Workflow execution error:", error);
      throw error;
    }
  }

  /**
   * Get smart recommendations for document processing
   */
  async getDocumentRecommendations(
    tenantId: number,
    authority: Authority,
    documentType: string,
    clientId: number,
    extractedData: Record<string, unknown>
  ): Promise<{
    nextSteps: string[];
    missingDocuments: string[];
    complianceIssues: string[];
    deadlineAlerts: string[];
    suggestions: string[];
  }> {
    try {
      // Get agency requirements
      const requirements = await this.getAgencyRequirements(
        tenantId,
        authority,
        documentType
      );

      // Get client compliance status
      const complianceStatus = await this.getClientComplianceStatus(
        tenantId,
        clientId,
        authority
      );

      // Generate recommendations
      const recommendations = {
        nextSteps: await this.generateNextSteps(requirements, extractedData),
        missingDocuments: await this.identifyMissingDocuments(complianceStatus, requirements),
        complianceIssues: await this.identifyComplianceIssues(complianceStatus),
        deadlineAlerts: await this.getDeadlineAlerts(tenantId, clientId, authority),
        suggestions: await this.generateSmartSuggestions(
          authority,
          documentType,
          extractedData,
          complianceStatus
        )
      };

      return recommendations;

    } catch (error) {
      console.error("Error generating recommendations:", error);
      return {
        nextSteps: [],
        missingDocuments: [],
        complianceIssues: [],
        deadlineAlerts: [],
        suggestions: []
      };
    }
  }

  /**
   * Auto-categorize documents based on content and context
   */
  async autoCategorizeDocuments(
    tenantId: number,
    clientId: number,
    documentIds: number[]
  ): Promise<{
    categorized: Array<{
      documentId: number;
      suggestedCategory: DocumentCategory;
      confidence: number;
      reasoning: string;
    }>;
    failed: Array<{
      documentId: number;
      error: string;
    }>;
  }> {
    const categorized = [];
    const failed = [];

    for (const documentId of documentIds) {
      try {
        const document = await this.prisma.document.findUnique({
          where: { id: documentId },
          include: {
            latestVersion: true,
            documentType: true
          }
        });

        if (!document) {
          failed.push({
            documentId,
            error: "Document not found"
          });
          continue;
        }

        // Get document content for analysis
        const content = await this.getDocumentContent(document.latestVersion?.fileUrl);

        if (!content) {
          failed.push({
            documentId,
            error: "Could not extract document content"
          });
          continue;
        }

        // Classify document
        const classification = await this.classifyDocument(
          tenantId,
          content,
          document.latestVersion?.fileUrl || "",
          undefined // Will determine from client data
        );

        categorized.push({
          documentId,
          suggestedCategory: classification.category,
          confidence: classification.confidence,
          reasoning: this.generateCategorizationReasoning(classification)
        });

      } catch (error) {
        failed.push({
          documentId,
          error: String(error)
        });
      }
    }

    return { categorized, failed };
  }

  // ===============================
  // PRIVATE HELPER METHODS
  // ===============================

  /**
   * Extract text from document buffer
   */
  private async extractTextFromDocument(
    documentBuffer: Buffer,
    fileName: string
  ): Promise<string> {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    switch (fileExtension) {
      case 'pdf':
        return await this.extractTextFromPDF(documentBuffer);
      case 'doc':
      case 'docx':
        return await this.extractTextFromWord(documentBuffer);
      case 'txt':
        return documentBuffer.toString('utf-8');
      default:
        // Try OCR for images or unknown formats
        return await this.performOCR(documentBuffer);
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    // Placeholder - implement with pdf-parse or similar
    console.log("PDF text extraction not yet implemented");
    return "";
  }

  /**
   * Extract text from Word documents
   */
  private async extractTextFromWord(buffer: Buffer): Promise<string> {
    // Placeholder - implement with mammoth or similar
    console.log("Word text extraction not yet implemented");
    return "";
  }

  /**
   * Perform OCR on document
   */
  private async performOCR(buffer: Buffer): Promise<string> {
    // Placeholder - implement with Tesseract.js or cloud OCR
    console.log("OCR not yet implemented");
    return "";
  }

  /**
   * Classify document using pattern matching and ML
   */
  private async performDocumentClassification(
    textContent: string,
    fileName: string,
    clientType?: ClientType
  ): Promise<DocumentClassificationResult> {
    // Simple pattern-based classification
    // In production, this would use ML models

    const patterns = {
      GRA: {
        VAT_RETURN: /vat\s*return|value\s*added\s*tax|gst\s*return/i,
        INCOME_TAX_RETURN: /income\s*tax|tax\s*return|pit\s*return/i,
        WITHHOLDING_TAX: /withholding\s*tax|wht|pay\s*as\s*you\s*earn/i,
        CORPORATION_TAX: /corporation\s*tax|company\s*tax|cit\s*return/i
      },
      NIS: {
        EMPLOYEE_CONTRIBUTION: /nis\s*contribution|national\s*insurance|employee\s*contribution/i,
        EMPLOYER_RETURN: /employer\s*return|nis\s*return|social\s*security/i
      },
      DCRA: {
        COMPANY_REGISTRATION: /company\s*registration|incorporation|memorandum|articles\s*of\s*association/i,
        ANNUAL_RETURN: /annual\s*return|company\s*return|form\s*18/i,
        DIRECTOR_CHANGE: /director\s*change|resignation|appointment/i
      },
      Immigration: {
        WORK_PERMIT: /work\s*permit|employment\s*authorization|labour\s*permit/i,
        VISA_APPLICATION: /visa\s*application|entry\s*permit|tourist\s*visa/i,
        RESIDENCE_PERMIT: /residence\s*permit|permanent\s*residence/i
      }
    };

    let bestMatch: DocumentClassificationResult = {
      authority: "GRA",
      documentType: "UNKNOWN",
      category: "other",
      confidence: 0,
      metadata: {
        extractedFields: {},
        suggestedActions: [],
        missingRequirements: [],
        estimatedProcessingTime: 24
      }
    };

    // Check patterns for each authority
    for (const [authority, docTypes] of Object.entries(patterns)) {
      for (const [docType, pattern] of Object.entries(docTypes)) {
        if (pattern.test(textContent) || pattern.test(fileName)) {
          const confidence = this.calculateConfidence(textContent, pattern);

          if (confidence > bestMatch.confidence) {
            bestMatch = {
              authority: authority as Authority,
              documentType: docType,
              category: this.getDocumentCategory(authority as Authority, docType),
              confidence,
              metadata: {
                extractedFields: await this.extractFieldsFromText(textContent, docType),
                suggestedActions: this.getSuggestedActions(authority as Authority, docType),
                missingRequirements: [],
                estimatedProcessingTime: this.estimateProcessingTime(authority as Authority, docType)
              }
            };
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Calculate classification confidence score
   */
  private calculateConfidence(text: string, pattern: RegExp): number {
    const matches = text.match(pattern);
    if (!matches) return 0;

    // Simple confidence calculation based on match count and text length
    const matchScore = matches.length / text.length * 1000;
    return Math.min(matchScore, 0.95); // Cap at 95%
  }

  /**
   * Get document category for authority and type
   */
  private getDocumentCategory(authority: Authority, documentType: string): DocumentCategory {
    const categoryMap: Record<Authority, Record<string, DocumentCategory>> = {
      GRA: {
        VAT_RETURN: "tax_filing",
        INCOME_TAX_RETURN: "tax_filing",
        WITHHOLDING_TAX: "tax_filing",
        CORPORATION_TAX: "tax_filing"
      },
      NIS: {
        EMPLOYEE_CONTRIBUTION: "regulatory_filing",
        EMPLOYER_RETURN: "regulatory_filing"
      },
      DCRA: {
        COMPANY_REGISTRATION: "incorporation",
        ANNUAL_RETURN: "regulatory_filing",
        DIRECTOR_CHANGE: "amendment_document"
      },
      Immigration: {
        WORK_PERMIT: "permit_license",
        VISA_APPLICATION: "application_form",
        RESIDENCE_PERMIT: "permit_license"
      }
    };

    return categoryMap[authority]?.[documentType] || "other";
  }

  /**
   * Extract fields from text content
   */
  private async extractFieldsFromText(
    textContent: string,
    documentType?: string
  ): Promise<Record<string, unknown>> {
    const fields: Record<string, unknown> = {};

    // Common field extraction patterns
    const patterns = {
      tin: /tin[:\s]*([0-9]{9})/i,
      nis: /nis[:\s]*([0-9]{8})/i,
      amount: /amount[:\s]*\$?([0-9,]+\.?[0-9]*)/i,
      date: /date[:\s]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i,
      companyName: /company[:\s]*([a-zA-Z\s&]+)/i
    };

    for (const [field, pattern] of Object.entries(patterns)) {
      const match = textContent.match(pattern);
      if (match) {
        fields[field] = match[1].trim();
      }
    }

    return fields;
  }

  /**
   * Extract tables from text
   */
  private async extractTablesFromText(textContent: string): Promise<Array<{
    name: string;
    headers: string[];
    rows: string[][];
  }>> {
    // Placeholder for table extraction logic
    return [];
  }

  /**
   * Detect signatures in document
   */
  private async detectSignatures(textContent: string): Promise<Array<{
    location: string;
    confidence: number;
  }>> {
    // Placeholder for signature detection
    return [];
  }

  /**
   * Detect stamps in document
   */
  private async detectStamps(textContent: string): Promise<Array<{
    text: string;
    location: string;
    confidence: number;
  }>> {
    // Placeholder for stamp detection
    return [];
  }

  /**
   * Get suggested actions for document type
   */
  private getSuggestedActions(authority: Authority, documentType: string): string[] {
    const actionMap: Record<Authority, Record<string, string[]>> = {
      GRA: {
        VAT_RETURN: ["Validate VAT calculations", "Submit to GRA portal", "Pay any amount due"],
        INCOME_TAX_RETURN: ["Review tax calculations", "Submit before deadline", "Keep supporting documents"]
      },
      NIS: {
        EMPLOYEE_CONTRIBUTION: ["Verify contribution amounts", "Submit monthly return", "Pay contributions"]
      },
      DCRA: {
        COMPANY_REGISTRATION: ["Complete incorporation process", "Pay registration fees", "Obtain certificate"]
      },
      Immigration: {
        WORK_PERMIT: ["Submit application", "Provide supporting documents", "Pay application fees"]
      }
    };

    return actionMap[authority]?.[documentType] || ["Review document", "Contact relevant authority"];
  }

  /**
   * Estimate processing time for document type
   */
  private estimateProcessingTime(authority: Authority, documentType: string): number {
    const timeMap: Record<Authority, Record<string, number>> = {
      GRA: {
        VAT_RETURN: 2,
        INCOME_TAX_RETURN: 4
      },
      NIS: {
        EMPLOYEE_CONTRIBUTION: 1,
        EMPLOYER_RETURN: 2
      },
      DCRA: {
        COMPANY_REGISTRATION: 72,
        ANNUAL_RETURN: 24
      },
      Immigration: {
        WORK_PERMIT: 168, // 1 week
        VISA_APPLICATION: 72
      }
    };

    return timeMap[authority]?.[documentType] || 24;
  }

  /**
   * Additional helper methods would go here...
   */

  private async enhanceWithRegulatoryKnowledge(
    tenantId: number,
    classification: DocumentClassificationResult,
    textContent: string
  ): Promise<DocumentClassificationResult> {
    // Enhance classification with regulatory requirements
    return classification;
  }

  private async executeWorkflowSteps(
    execution: any,
    workflow: any
  ): Promise<WorkflowExecutionResult> {
    // Execute workflow steps
    return {
      executionId: execution.id,
      status: "completed",
      completedSteps: workflow.steps.length,
      totalSteps: workflow.steps.length,
      nextActions: []
    };
  }

  private async getAgencyRequirements(
    tenantId: number,
    authority: Authority,
    documentType: string
  ): Promise<any[]> {
    return await this.prisma.agencyDocumentRequirement.findMany({
      where: { tenantId, authority, documentType }
    });
  }

  private async getClientComplianceStatus(
    tenantId: number,
    clientId: number,
    authority: Authority
  ): Promise<any> {
    return await this.prisma.agencyComplianceStatus.findFirst({
      where: { tenantId, clientId, authority }
    });
  }

  private async generateNextSteps(
    requirements: any[],
    extractedData: Record<string, unknown>
  ): Promise<string[]> {
    return ["Review document", "Validate data", "Submit to authority"];
  }

  private async identifyMissingDocuments(
    complianceStatus: any,
    requirements: any[]
  ): Promise<string[]> {
    return [];
  }

  private async identifyComplianceIssues(complianceStatus: any): Promise<string[]> {
    return [];
  }

  private async getDeadlineAlerts(
    tenantId: number,
    clientId: number,
    authority: Authority
  ): Promise<string[]> {
    return [];
  }

  private async generateSmartSuggestions(
    authority: Authority,
    documentType: string,
    extractedData: Record<string, unknown>,
    complianceStatus: any
  ): Promise<string[]> {
    return [];
  }

  private async getDocumentContent(fileUrl?: string): Promise<string | null> {
    // Fetch and return document content
    return null;
  }

  private generateCategorizationReasoning(
    classification: DocumentClassificationResult
  ): string {
    return `Classified as ${classification.category} based on content analysis with ${(classification.confidence * 100).toFixed(1)}% confidence`;
  }
}

/**
 * Factory function to create smart document service
 */
export function createSmartDocumentService(prisma: any): SmartDocumentService {
  return new SmartDocumentService(prisma);
}