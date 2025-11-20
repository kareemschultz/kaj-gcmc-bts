/**
 * AI-Powered Document Intelligence Service
 *
 * Provides advanced AI capabilities for document analysis, classification,
 * deadline extraction, and compliance validation specifically tailored for
 * Guyanese government and business documents.
 */

import prisma from "@GCMC-KAJ/db";
import type { Document, DocumentVersion } from "@GCMC-KAJ/db";
import { GuyanOCRService } from "./ocrEnhancementService";
import { TRPCError } from "@trpc/server";

/**
 * Document classification confidence levels
 */
export enum ConfidenceLevel {
  VERY_HIGH = "very_high", // 95-100%
  HIGH = "high", // 85-94%
  MEDIUM = "medium", // 70-84%
  LOW = "low", // 50-69%
  VERY_LOW = "very_low" // Below 50%
}

/**
 * Compliance requirement types
 */
export enum ComplianceType {
  GRA_TAX_FILING = "gra_tax_filing",
  NIS_CONTRIBUTION = "nis_contribution",
  VAT_RETURN = "vat_return",
  BUSINESS_REGISTRATION = "business_registration",
  WORK_PERMIT = "work_permit",
  IMPORT_LICENSE = "import_license",
  EXPORT_PERMIT = "export_permit",
  ENVIRONMENTAL_PERMIT = "environmental_permit"
}

/**
 * Document relationship types
 */
export enum RelationshipType {
  SUPPORTING_DOCUMENT = "supporting_document",
  SUPERSEDES = "supersedes",
  REFERENCES = "references",
  AMENDMENT = "amendment",
  RENEWAL = "renewal",
  CANCELLATION = "cancellation"
}

/**
 * AI analysis result structure
 */
interface AIAnalysisResult {
  classification: {
    documentType: string;
    category: string;
    subcategory?: string;
    confidence: ConfidenceLevel;
    governmentAgency?: string;
  };
  extractedData: {
    entities: Record<string, any>;
    amounts: Array<{
      value: number;
      currency: string;
      context: string;
      confidence: number;
    }>;
    dates: Array<{
      date: Date;
      context: string;
      type: 'issue_date' | 'due_date' | 'expiry_date' | 'effective_date';
      confidence: number;
    }>;
    identifiers: {
      tin?: string[];
      nis?: string[];
      gra?: string[];
      vat?: string[];
      businessReg?: string[];
    };
  };
  compliance: {
    requirements: Array<{
      type: ComplianceType;
      status: 'compliant' | 'non_compliant' | 'requires_review';
      deadline?: Date;
      actionRequired?: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    flags: string[];
    recommendations: string[];
  };
  relationships: Array<{
    type: RelationshipType;
    relatedDocumentId?: number;
    description: string;
    confidence: number;
  }>;
  deadlines: Array<{
    date: Date;
    description: string;
    type: 'filing' | 'payment' | 'renewal' | 'submission';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    daysUntilDue: number;
    agency: string;
  }>;
  qualityScore: number;
  processingNotes: string[];
}

/**
 * Smart filing suggestion
 */
interface FilingSuggestion {
  folderPath: string;
  confidence: number;
  reasoning: string;
  tags: string[];
  category: string;
  subcategory?: string;
}

/**
 * Document intelligence insights
 */
interface DocumentInsights {
  summary: string;
  keyFindings: string[];
  riskFactors: string[];
  opportunities: string[];
  nextActions: string[];
  complianceStatus: {
    overall: 'compliant' | 'at_risk' | 'non_compliant';
    details: string[];
  };
}

/**
 * Cross-reference validation result
 */
interface CrossReferenceResult {
  isValid: boolean;
  matches: Array<{
    database: string;
    recordId: string;
    matchType: 'exact' | 'partial' | 'similar';
    confidence: number;
    data: Record<string, any>;
  }>;
  discrepancies: Array<{
    field: string;
    documentValue: any;
    databaseValue: any;
    severity: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
}

/**
 * Guyanese government database endpoints (simulated)
 */
const GOVERNMENT_DATABASES = {
  GRA: {
    TIN_VERIFICATION: '/gra/verify-tin',
    TAX_STATUS: '/gra/tax-status',
    FILING_HISTORY: '/gra/filing-history'
  },
  NIS: {
    CONTRIBUTION_VERIFICATION: '/nis/verify-contribution',
    EMPLOYER_STATUS: '/nis/employer-status'
  },
  DCRA: {
    BUSINESS_REGISTRATION: '/dcra/business-registration',
    COMPANY_STATUS: '/dcra/company-status'
  }
};

/**
 * Main Document Intelligence Service
 */
export class DocumentIntelligenceService {

  // ============================================================================
  // AI CLASSIFICATION AND ANALYSIS
  // ============================================================================

  /**
   * Perform comprehensive AI analysis of a document
   */
  static async analyzeDocument(
    tenantId: number,
    documentId: number,
    options: {
      includeOCR?: boolean;
      includeCrossReference?: boolean;
      includeCompliance?: boolean;
    } = {}
  ): Promise<AIAnalysisResult> {

    const document = await prisma.document.findUnique({
      where: { id: documentId, tenantId },
      include: {
        latestVersion: true,
        client: true,
        documentType: true
      }
    });

    if (!document || !document.latestVersion) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Document or document version not found"
      });
    }

    let ocrResult: any = null;

    // Perform OCR if requested and not already done
    if (options.includeOCR && !document.latestVersion.ocrText) {
      // TODO: Get document file and process with OCR
      // ocrResult = await GuyanOCRService.enhanceOCR(documentBuffer);
    } else if (document.latestVersion.ocrText) {
      // Use existing OCR data
      ocrResult = {
        extractedText: document.latestVersion.ocrText,
        extractedEntities: document.extractedEntities || {},
        documentClassification: document.aiClassification || {},
        complianceFlags: document.complianceFlags || {},
        confidenceScore: document.ocrConfidenceScore || 0
      };
    }

    // Perform AI classification
    const classification = await this.classifyDocument(
      ocrResult?.extractedText || document.title,
      document.documentType,
      document.client
    );

    // Extract structured data
    const extractedData = await this.extractStructuredData(
      ocrResult?.extractedText || "",
      ocrResult?.extractedEntities || {},
      classification
    );

    // Analyze compliance requirements
    const compliance = options.includeCompliance
      ? await this.analyzeCompliance(extractedData, classification, document.client)
      : { requirements: [], flags: [], recommendations: [] };

    // Find document relationships
    const relationships = await this.findDocumentRelationships(
      document,
      extractedData,
      classification
    );

    // Extract and analyze deadlines
    const deadlines = await this.extractDeadlines(
      extractedData,
      classification,
      compliance.requirements
    );

    // Calculate overall quality score
    const qualityScore = this.calculateIntelligenceQuality(
      classification,
      extractedData,
      compliance,
      ocrResult?.confidenceScore || 0
    );

    return {
      classification,
      extractedData,
      compliance,
      relationships,
      deadlines,
      qualityScore,
      processingNotes: []
    };
  }

  /**
   * Generate smart filing suggestions based on document content
   */
  static async generateFilingSuggestions(
    documentContent: string,
    clientInfo: any,
    existingStructure?: any
  ): Promise<FilingSuggestion[]> {

    const suggestions: FilingSuggestion[] = [];

    // Analyze document content for classification
    const contentAnalysis = await this.analyzeContentForFiling(documentContent);

    // Generate suggestions based on content
    if (contentAnalysis.documentType.includes('tax')) {
      suggestions.push({
        folderPath: `/Clients/${clientInfo.name}/Tax Documents/${new Date().getFullYear()}`,
        confidence: 0.9,
        reasoning: "Document contains tax-related content and keywords",
        tags: ["tax", "filing", contentAnalysis.year || "current"],
        category: "Tax Documents",
        subcategory: contentAnalysis.taxType
      });
    }

    if (contentAnalysis.documentType.includes('business')) {
      suggestions.push({
        folderPath: `/Clients/${clientInfo.name}/Business Documents/Registration`,
        confidence: 0.85,
        reasoning: "Document appears to be business registration or corporate document",
        tags: ["business", "registration", "corporate"],
        category: "Business Documents",
        subcategory: "Registration"
      });
    }

    if (contentAnalysis.documentType.includes('financial')) {
      suggestions.push({
        folderPath: `/Clients/${clientInfo.name}/Financial Documents/${contentAnalysis.period || "Current"}`,
        confidence: 0.8,
        reasoning: "Document contains financial information and amounts",
        tags: ["financial", "statements", contentAnalysis.period || "current"],
        category: "Financial Documents",
        subcategory: contentAnalysis.financialType
      });
    }

    // Government correspondence
    if (contentAnalysis.governmentAgency) {
      suggestions.push({
        folderPath: `/Clients/${clientInfo.name}/Government Correspondence/${contentAnalysis.governmentAgency}`,
        confidence: 0.95,
        reasoning: `Document identified as correspondence from ${contentAnalysis.governmentAgency}`,
        tags: ["government", "correspondence", contentAnalysis.governmentAgency.toLowerCase()],
        category: "Government Documents",
        subcategory: contentAnalysis.governmentAgency
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract deadlines from government documents
   */
  static async extractGovernmentDeadlines(
    documentContent: string,
    documentType: string
  ): Promise<Array<{
    date: Date;
    description: string;
    agency: string;
    priority: string;
    consequences: string;
  }>> {

    const deadlines: any[] = [];

    // Common Guyanese government deadline patterns
    const deadlinePatterns = {
      GRA_TAX_FILING: {
        pattern: /tax\s+return.*due.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
        agency: "Guyana Revenue Authority",
        priority: "high",
        consequences: "Late filing penalties and interest charges"
      },
      VAT_RETURN: {
        pattern: /vat\s+return.*due.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
        agency: "Guyana Revenue Authority",
        priority: "high",
        consequences: "VAT penalties and business license suspension risk"
      },
      NIS_CONTRIBUTION: {
        pattern: /nis\s+contribution.*due.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
        agency: "National Insurance Scheme",
        priority: "high",
        consequences: "Employer penalties and employee benefit suspension"
      },
      BUSINESS_RENEWAL: {
        pattern: /business\s+registration.*renew.*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
        agency: "Deeds and Commercial Registry Authority",
        priority: "medium",
        consequences: "Business registration lapse and operational restrictions"
      }
    };

    for (const [type, config] of Object.entries(deadlinePatterns)) {
      const matches = documentContent.matchAll(config.pattern);

      for (const match of matches) {
        const dateStr = match[1];
        const date = this.parseGuyanDate(dateStr);

        if (date) {
          deadlines.push({
            date,
            description: `${type.replace(/_/g, ' ')} deadline`,
            agency: config.agency,
            priority: config.priority,
            consequences: config.consequences
          });
        }
      }
    }

    return deadlines;
  }

  /**
   * Cross-reference document data with government databases
   */
  static async crossReferenceWithGovernmentDatabases(
    extractedData: any,
    documentType: string
  ): Promise<CrossReferenceResult> {

    const matches: any[] = [];
    const discrepancies: any[] = [];
    const recommendations: string[] = [];

    // Simulate cross-referencing with GRA database
    if (extractedData.identifiers.tin) {
      for (const tin of extractedData.identifiers.tin) {
        try {
          const graMatch = await this.queryGRADatabase(tin, 'TIN_VERIFICATION');
          if (graMatch) {
            matches.push({
              database: "GRA",
              recordId: tin,
              matchType: "exact",
              confidence: 0.95,
              data: graMatch
            });

            // Check for discrepancies
            if (graMatch.taxStatus !== 'current') {
              discrepancies.push({
                field: "tax_status",
                documentValue: "active",
                databaseValue: graMatch.taxStatus,
                severity: "high"
              });
              recommendations.push("Update tax status with GRA before proceeding");
            }
          }
        } catch (error) {
          recommendations.push(`Unable to verify TIN ${tin} with GRA database`);
        }
      }
    }

    // Simulate cross-referencing with NIS database
    if (extractedData.identifiers.nis) {
      for (const nis of extractedData.identifiers.nis) {
        try {
          const nisMatch = await this.queryNISDatabase(nis, 'CONTRIBUTION_VERIFICATION');
          if (nisMatch) {
            matches.push({
              database: "NIS",
              recordId: nis,
              matchType: "exact",
              confidence: 0.9,
              data: nisMatch
            });

            // Check contribution status
            if (nisMatch.contributionStatus !== 'up_to_date') {
              discrepancies.push({
                field: "contribution_status",
                documentValue: "current",
                databaseValue: nisMatch.contributionStatus,
                severity: "medium"
              });
            }
          }
        } catch (error) {
          recommendations.push(`Unable to verify NIS number ${nis}`);
        }
      }
    }

    const isValid = discrepancies.filter(d => d.severity === 'high').length === 0;

    return {
      isValid,
      matches,
      discrepancies,
      recommendations
    };
  }

  /**
   * Generate document insights and recommendations
   */
  static async generateDocumentInsights(
    document: any,
    analysis: AIAnalysisResult
  ): Promise<DocumentInsights> {

    const keyFindings: string[] = [];
    const riskFactors: string[] = [];
    const opportunities: string[] = [];
    const nextActions: string[] = [];

    // Analyze classification confidence
    if (analysis.classification.confidence === ConfidenceLevel.VERY_LOW) {
      riskFactors.push("Document classification confidence is very low - manual review recommended");
    }

    // Check compliance status
    const highRiskCompliance = analysis.compliance.requirements.filter(r =>
      r.severity === 'critical' && r.status === 'non_compliant'
    );

    if (highRiskCompliance.length > 0) {
      riskFactors.push(`${highRiskCompliance.length} critical compliance issues identified`);
      nextActions.push("Address critical compliance issues immediately");
    }

    // Check upcoming deadlines
    const urgentDeadlines = analysis.deadlines.filter(d =>
      d.daysUntilDue <= 7 && d.priority === 'urgent'
    );

    if (urgentDeadlines.length > 0) {
      riskFactors.push(`${urgentDeadlines.length} urgent deadlines within 7 days`);
      nextActions.push("Prepare submissions for urgent deadlines");
    }

    // Identify opportunities
    if (analysis.extractedData.amounts.some(a => a.value > 100000)) {
      opportunities.push("Large financial amounts detected - consider tax optimization strategies");
    }

    if (analysis.classification.documentType.includes('business')) {
      opportunities.push("Business document - review for expansion or investment opportunities");
    }

    // Generate key findings
    if (analysis.extractedData.identifiers.tin?.length) {
      keyFindings.push(`TIN numbers identified: ${analysis.extractedData.identifiers.tin.join(', ')}`);
    }

    if (analysis.extractedData.amounts.length > 0) {
      const totalAmount = analysis.extractedData.amounts.reduce((sum, a) => sum + a.value, 0);
      keyFindings.push(`Total financial amounts: GY$${totalAmount.toLocaleString()}`);
    }

    // Determine overall compliance status
    const criticalIssues = analysis.compliance.requirements.filter(r => r.severity === 'critical').length;
    const nonCompliantIssues = analysis.compliance.requirements.filter(r => r.status === 'non_compliant').length;

    let complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
    let complianceDetails: string[] = [];

    if (criticalIssues > 0) {
      complianceStatus = 'non_compliant';
      complianceDetails.push(`${criticalIssues} critical compliance issues`);
    } else if (nonCompliantIssues > 0) {
      complianceStatus = 'at_risk';
      complianceDetails.push(`${nonCompliantIssues} compliance issues need attention`);
    } else {
      complianceStatus = 'compliant';
      complianceDetails.push("All compliance requirements met");
    }

    return {
      summary: this.generateDocumentSummary(document, analysis),
      keyFindings,
      riskFactors,
      opportunities,
      nextActions,
      complianceStatus: {
        overall: complianceStatus,
        details: complianceDetails
      }
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private static async classifyDocument(
    content: string,
    documentType: any,
    client: any
  ): Promise<AIAnalysisResult['classification']> {

    // Simple rule-based classification (would use ML in production)
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('tax return') || lowerContent.includes('income tax')) {
      return {
        documentType: "Tax Return",
        category: "Tax Documents",
        subcategory: "Income Tax",
        confidence: ConfidenceLevel.HIGH,
        governmentAgency: "Guyana Revenue Authority"
      };
    }

    if (lowerContent.includes('vat') || lowerContent.includes('value added tax')) {
      return {
        documentType: "VAT Return",
        category: "Tax Documents",
        subcategory: "VAT",
        confidence: ConfidenceLevel.HIGH,
        governmentAgency: "Guyana Revenue Authority"
      };
    }

    if (lowerContent.includes('business registration') || lowerContent.includes('certificate of incorporation')) {
      return {
        documentType: "Business Registration",
        category: "Business Documents",
        subcategory: "Registration",
        confidence: ConfidenceLevel.MEDIUM,
        governmentAgency: "Deeds and Commercial Registry Authority"
      };
    }

    return {
      documentType: documentType?.name || "Unknown",
      category: "General",
      confidence: ConfidenceLevel.LOW
    };
  }

  private static async extractStructuredData(
    content: string,
    entities: any,
    classification: any
  ): Promise<AIAnalysisResult['extractedData']> {

    // Extract amounts
    const amounts = this.extractAmounts(content);

    // Extract dates
    const dates = this.extractDates(content);

    return {
      entities: entities || {},
      amounts,
      dates,
      identifiers: entities || {}
    };
  }

  private static extractAmounts(content: string): Array<{
    value: number;
    currency: string;
    context: string;
    confidence: number;
  }> {

    const amounts: any[] = [];
    const amountPatterns = [
      /(?:GYD|G\$|\$)[\s]?([\d,]+(?:\.\d{2})?)/gi,
      /(?:amount|total|sum)[\s:]+(?:GYD|G\$|\$)?[\s]?([\d,]+(?:\.\d{2})?)/gi
    ];

    for (const pattern of amountPatterns) {
      const matches = content.matchAll(pattern);

      for (const match of matches) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(value)) {
          amounts.push({
            value,
            currency: "GYD",
            context: match[0],
            confidence: 0.8
          });
        }
      }
    }

    return amounts;
  }

  private static extractDates(content: string): Array<{
    date: Date;
    context: string;
    type: 'issue_date' | 'due_date' | 'expiry_date' | 'effective_date';
    confidence: number;
  }> {

    const dates: any[] = [];
    const datePatterns = [
      { pattern: /due[\s:]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi, type: 'due_date' },
      { pattern: /expir\w*[\s:]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi, type: 'expiry_date' },
      { pattern: /issue[\s:]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi, type: 'issue_date' },
      { pattern: /effective[\s:]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi, type: 'effective_date' }
    ];

    for (const { pattern, type } of datePatterns) {
      const matches = content.matchAll(pattern);

      for (const match of matches) {
        const date = this.parseGuyanDate(match[1]);
        if (date) {
          dates.push({
            date,
            context: match[0],
            type,
            confidence: 0.8
          });
        }
      }
    }

    return dates;
  }

  private static async analyzeCompliance(
    extractedData: any,
    classification: any,
    client: any
  ): Promise<AIAnalysisResult['compliance']> {

    const requirements: any[] = [];
    const flags: string[] = [];
    const recommendations: string[] = [];

    // Tax compliance analysis
    if (classification.category === "Tax Documents") {
      requirements.push({
        type: ComplianceType.GRA_TAX_FILING,
        status: extractedData.identifiers.tin ? 'compliant' : 'non_compliant',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        actionRequired: "Ensure TIN is valid and filing is submitted on time",
        severity: "high"
      });

      if (!extractedData.identifiers.tin) {
        flags.push("Missing TIN number in tax document");
        recommendations.push("Verify client TIN registration with GRA");
      }
    }

    // Business compliance analysis
    if (classification.category === "Business Documents") {
      requirements.push({
        type: ComplianceType.BUSINESS_REGISTRATION,
        status: 'requires_review',
        actionRequired: "Verify current business registration status",
        severity: "medium"
      });
    }

    return {
      requirements,
      flags,
      recommendations
    };
  }

  private static async findDocumentRelationships(
    document: any,
    extractedData: any,
    classification: any
  ): Promise<AIAnalysisResult['relationships']> {

    const relationships: any[] = [];

    // Find related documents by TIN
    if (extractedData.identifiers.tin) {
      const relatedDocs = await prisma.document.findMany({
        where: {
          tenantId: document.tenantId,
          id: { not: document.id },
          extractedEntities: {
            path: ['tin'],
            array_contains: extractedData.identifiers.tin
          }
        },
        take: 5
      });

      for (const relatedDoc of relatedDocs) {
        relationships.push({
          type: RelationshipType.REFERENCES,
          relatedDocumentId: relatedDoc.id,
          description: `Related document with same TIN`,
          confidence: 0.8
        });
      }
    }

    return relationships;
  }

  private static async extractDeadlines(
    extractedData: any,
    classification: any,
    complianceRequirements: any[]
  ): Promise<AIAnalysisResult['deadlines']> {

    const deadlines: any[] = [];

    // Extract deadlines from dates
    for (const dateInfo of extractedData.dates) {
      if (dateInfo.type === 'due_date') {
        const daysUntilDue = Math.ceil(
          (dateInfo.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        deadlines.push({
          date: dateInfo.date,
          description: `Document due date: ${dateInfo.context}`,
          type: 'filing',
          priority: daysUntilDue <= 7 ? 'urgent' : daysUntilDue <= 30 ? 'high' : 'medium',
          daysUntilDue,
          agency: classification.governmentAgency || 'Unknown'
        });
      }
    }

    // Add compliance deadlines
    for (const requirement of complianceRequirements) {
      if (requirement.deadline) {
        const daysUntilDue = Math.ceil(
          (requirement.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        deadlines.push({
          date: requirement.deadline,
          description: requirement.actionRequired || 'Compliance deadline',
          type: 'filing',
          priority: requirement.severity === 'critical' ? 'urgent' : 'high',
          daysUntilDue,
          agency: this.getAgencyForComplianceType(requirement.type)
        });
      }
    }

    return deadlines;
  }

  private static calculateIntelligenceQuality(
    classification: any,
    extractedData: any,
    compliance: any,
    ocrConfidence: number
  ): number {

    let score = 0;

    // Classification quality (30%)
    const classificationScore = this.getConfidenceScore(classification.confidence);
    score += classificationScore * 0.3;

    // Data extraction quality (25%)
    const dataExtractionScore = Math.min(
      (extractedData.entities.length * 0.1 +
       extractedData.amounts.length * 0.1 +
       extractedData.dates.length * 0.1), 1.0
    );
    score += dataExtractionScore * 0.25;

    // OCR quality (25%)
    score += (ocrConfidence || 0) * 0.25;

    // Compliance analysis quality (20%)
    const complianceScore = compliance.requirements.length > 0 ? 1.0 : 0.5;
    score += complianceScore * 0.2;

    return Math.round(score * 100) / 100;
  }

  private static getConfidenceScore(confidence: ConfidenceLevel): number {
    switch (confidence) {
      case ConfidenceLevel.VERY_HIGH: return 1.0;
      case ConfidenceLevel.HIGH: return 0.85;
      case ConfidenceLevel.MEDIUM: return 0.7;
      case ConfidenceLevel.LOW: return 0.5;
      case ConfidenceLevel.VERY_LOW: return 0.3;
      default: return 0.5;
    }
  }

  private static async analyzeContentForFiling(content: string): Promise<any> {
    const lowerContent = content.toLowerCase();

    const analysis: any = {
      documentType: [],
      year: null,
      period: null,
      governmentAgency: null,
      taxType: null,
      financialType: null
    };

    // Document type detection
    if (lowerContent.includes('tax')) analysis.documentType.push('tax');
    if (lowerContent.includes('business')) analysis.documentType.push('business');
    if (lowerContent.includes('financial') || lowerContent.includes('statement')) {
      analysis.documentType.push('financial');
    }

    // Year extraction
    const yearMatch = content.match(/20\d{2}/);
    if (yearMatch) analysis.year = yearMatch[0];

    // Government agency detection
    if (lowerContent.includes('guyana revenue authority') || lowerContent.includes('gra')) {
      analysis.governmentAgency = 'GRA';
    }
    if (lowerContent.includes('national insurance') || lowerContent.includes('nis')) {
      analysis.governmentAgency = 'NIS';
    }

    return analysis;
  }

  private static parseGuyanDate(dateStr: string): Date | null {
    // Try various date formats common in Guyana
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        // For DD/MM/YYYY and DD-MM-YYYY formats
        if (format === formats[0] || format === formats[1]) {
          const day = parseInt(match[1]);
          const month = parseInt(match[2]) - 1; // JavaScript months are 0-based
          const year = parseInt(match[3]);
          return new Date(year, month, day);
        }
        // For YYYY/MM/DD and YYYY-MM-DD formats
        else {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1;
          const day = parseInt(match[3]);
          return new Date(year, month, day);
        }
      }
    }

    return null;
  }

  private static async queryGRADatabase(tin: string, endpoint: string): Promise<any> {
    // Simulate GRA database query
    // In production, this would be actual API calls to government systems
    return {
      tin,
      taxStatus: 'current',
      lastFiling: '2024-03-15',
      outstandingLiabilities: 0
    };
  }

  private static async queryNISDatabase(nis: string, endpoint: string): Promise<any> {
    // Simulate NIS database query
    return {
      nis,
      contributionStatus: 'up_to_date',
      lastContribution: '2024-10-31',
      employeeCount: 5
    };
  }

  private static getAgencyForComplianceType(type: ComplianceType): string {
    switch (type) {
      case ComplianceType.GRA_TAX_FILING:
      case ComplianceType.VAT_RETURN:
        return "Guyana Revenue Authority";
      case ComplianceType.NIS_CONTRIBUTION:
        return "National Insurance Scheme";
      case ComplianceType.BUSINESS_REGISTRATION:
        return "Deeds and Commercial Registry Authority";
      default:
        return "Government Agency";
    }
  }

  private static generateDocumentSummary(document: any, analysis: AIAnalysisResult): string {
    const classification = analysis.classification;
    const extractedData = analysis.extractedData;

    let summary = `Document Type: ${classification.documentType}\n`;
    summary += `Category: ${classification.category}\n`;
    summary += `Confidence: ${classification.confidence}\n\n`;

    if (extractedData.identifiers.tin?.length) {
      summary += `TIN Numbers: ${extractedData.identifiers.tin.join(', ')}\n`;
    }

    if (extractedData.amounts.length > 0) {
      const totalAmount = extractedData.amounts.reduce((sum, a) => sum + a.value, 0);
      summary += `Financial Amounts: GY$${totalAmount.toLocaleString()}\n`;
    }

    if (analysis.deadlines.length > 0) {
      const nextDeadline = analysis.deadlines[0];
      summary += `Next Deadline: ${nextDeadline.description} - ${nextDeadline.date.toLocaleDateString()}\n`;
    }

    if (analysis.compliance.flags.length > 0) {
      summary += `\nCompliance Issues: ${analysis.compliance.flags.length}\n`;
    }

    return summary;
  }
}