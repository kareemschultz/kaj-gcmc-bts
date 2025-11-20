/**
 * OCR Enhancement Service with Guyanese-Specific Recognition
 *
 * Provides advanced OCR capabilities tailored for Guyanese government documents,
 * business records, and accounting documents with local context awareness.
 */

import type { Document, DocumentVersion } from "@GCMC-KAJ/db";

/**
 * Guyanese-specific patterns and configurations
 */
const GUYANESE_PATTERNS = {
  // Tax Identification Numbers
  TIN: /TIN[\s:]?(\d{3}[\-\s]?\d{3}[\-\s]?\d{3})/gi,

  // National Insurance Scheme numbers
  NIS: /NIS[\s:]?([A-Z]{2}\d{8})/gi,

  // Georgetown Registration Area numbers
  GRA: /GRA[\s:]?(\d{6,10})/gi,

  // Deeds and Commercial Registry Authority
  DCRA: /DCRA[\s:]?(\d{4,8})/gi,

  // Guyana Revenue Authority VAT numbers
  VAT: /VAT[\s:]?(\d{9})/gi,

  // Business Registration numbers
  BUSINESS_REG: /(?:Business[\s\-]?Reg[\s\-]?(?:No|Number)?)[\s:]?(\d{4,8})/gi,

  // Guyanese currency amounts
  CURRENCY: /(?:GYD|G\$|\$)[\s]?([\d,]+(?:\.\d{2})?)/gi,

  // Guyanese addresses
  GEORGETOWN_AREAS: /(?:Georgetown|Campbellville|Kitty|Queenstown|Charlestown|Lodge|Ruimveldt|Alberttown|Newtown|Stabroek|Cummingsburg|Werk[\-\s]en[\-\s]Rust)/gi,

  // Common Guyanese government departments
  GOVERNMENT_ENTITIES: /(?:Ministry\s+of\s+[A-Za-z\s,&]+|Department\s+of\s+[A-Za-z\s,&]+|Guyana\s+Revenue\s+Authority|National\s+Insurance\s+Scheme|Deeds\s+and\s+Commercial\s+Registry|Immigration\s+Department)/gi,

  // Guyanese phone numbers
  PHONE: /(?:\+592|592)?[\s\-]?([0-9]{3})[\s\-]?([0-9]{4})/gi,

  // Common document dates in Guyanese format
  DATES: /(?:(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{2,4})|(\d{2,4})[\-\/](\d{1,2})[\-\/](\d{1,2}))/gi,
};

/**
 * Guyanese business and tax terminology dictionary
 */
const GUYANESE_TERMINOLOGY = {
  // Tax-related terms
  TAX_TERMS: [
    "withholding tax", "property tax", "travel tax", "excise tax",
    "corporation tax", "income tax", "vat", "pay as you earn", "paye",
    "capital gains", "stamp duty", "customs duty", "import duty"
  ],

  // Business registration terms
  BUSINESS_TERMS: [
    "sole proprietorship", "partnership", "private company", "public company",
    "cooperative", "non-profit organization", "foreign company",
    "memorandum of association", "articles of incorporation"
  ],

  // Government departments and agencies
  AGENCIES: [
    "guyana revenue authority", "gra", "national insurance scheme", "nis",
    "deeds and commercial registry", "dcra", "bank of guyana", "bog",
    "guyana securities council", "immigration department"
  ],

  // Common document types
  DOCUMENT_TYPES: [
    "tax clearance certificate", "business registration certificate",
    "vat certificate", "import license", "export permit",
    "work permit", "residence permit", "tax return"
  ]
};

/**
 * Document classification patterns for Guyanese documents
 */
const DOCUMENT_CLASSIFICATION_PATTERNS = {
  TAX_RETURN: {
    patterns: [/tax\s+return/gi, /income\s+tax/gi, /corporation\s+tax/gi],
    confidence: 0.8,
    category: "Tax Documents"
  },

  VAT_RETURN: {
    patterns: [/vat\s+return/gi, /value\s+added\s+tax/gi],
    confidence: 0.9,
    category: "Tax Documents"
  },

  BUSINESS_REGISTRATION: {
    patterns: [/business\s+registration/gi, /certificate\s+of\s+incorporation/gi],
    confidence: 0.85,
    category: "Business Documents"
  },

  BANK_STATEMENT: {
    patterns: [/bank\s+statement/gi, /account\s+statement/gi, /transaction\s+history/gi],
    confidence: 0.9,
    category: "Financial Documents"
  },

  INVOICE: {
    patterns: [/invoice/gi, /bill/gi, /receipt/gi],
    confidence: 0.7,
    category: "Financial Documents"
  },

  GOVERNMENT_LETTER: {
    patterns: [...GUYANESE_TERMINOLOGY.AGENCIES.map(agency => new RegExp(agency, 'gi'))],
    confidence: 0.8,
    category: "Government Correspondence"
  }
};

/**
 * OCR confidence scoring based on Guyanese context
 */
interface OCRConfidenceFactors {
  patternMatches: number;
  terminologyMatches: number;
  structureScore: number;
  clarityScore: number;
}

/**
 * Enhanced OCR result with Guyanese-specific data
 */
export interface EnhancedOCRResult {
  extractedText: string;
  confidenceScore: number;
  detectedLanguage: string;
  extractedEntities: {
    tin?: string[];
    nis?: string[];
    gra?: string[];
    vat?: string[];
    phone?: string[];
    addresses?: string[];
    amounts?: string[];
    dates?: string[];
    governmentEntities?: string[];
  };
  documentClassification: {
    type: string;
    category: string;
    confidence: number;
  };
  complianceFlags: {
    graCompliance: boolean;
    nisCompliance: boolean;
    vatCompliance: boolean;
    taxCompliance: boolean;
    flags: string[];
  };
  qualityMetrics: {
    textClarity: number;
    documentStructure: number;
    informationCompleteness: number;
  };
  suggestedActions: string[];
}

/**
 * Main OCR Enhancement Service
 */
export class GuyanOCRService {

  /**
   * Process document with enhanced OCR and Guyanese-specific recognition
   */
  static async enhanceOCR(
    documentBuffer: Buffer,
    documentType?: string,
    clientInfo?: { type: string; sector?: string }
  ): Promise<EnhancedOCRResult> {

    // Step 1: Basic OCR extraction (placeholder for actual OCR engine)
    const rawText = await this.performBasicOCR(documentBuffer);

    // Step 2: Extract Guyanese-specific entities
    const extractedEntities = this.extractGuyanEntities(rawText);

    // Step 3: Classify document type
    const documentClassification = this.classifyDocument(rawText, documentType);

    // Step 4: Check compliance requirements
    const complianceFlags = this.checkComplianceRequirements(
      rawText,
      extractedEntities,
      documentClassification,
      clientInfo
    );

    // Step 5: Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(rawText, extractedEntities);

    // Step 6: Calculate overall confidence
    const confidenceScore = this.calculateConfidenceScore({
      patternMatches: Object.keys(extractedEntities).length,
      terminologyMatches: this.countTerminologyMatches(rawText),
      structureScore: qualityMetrics.documentStructure,
      clarityScore: qualityMetrics.textClarity
    });

    // Step 7: Generate suggested actions
    const suggestedActions = this.generateSuggestedActions(
      complianceFlags,
      qualityMetrics,
      documentClassification
    );

    return {
      extractedText: rawText,
      confidenceScore,
      detectedLanguage: 'en', // Primarily English in Guyana
      extractedEntities,
      documentClassification,
      complianceFlags,
      qualityMetrics,
      suggestedActions
    };
  }

  /**
   * Basic OCR extraction (placeholder for Tesseract.js or cloud OCR)
   */
  private static async performBasicOCR(buffer: Buffer): Promise<string> {
    // TODO: Integrate with Tesseract.js or cloud OCR service
    // For now, return placeholder text
    return "PLACEHOLDER OCR TEXT - INTEGRATION NEEDED";
  }

  /**
   * Extract Guyanese-specific entities from text
   */
  private static extractGuyanEntities(text: string): EnhancedOCRResult['extractedEntities'] {
    return {
      tin: this.extractMatches(text, GUYANESE_PATTERNS.TIN),
      nis: this.extractMatches(text, GUYANESE_PATTERNS.NIS),
      gra: this.extractMatches(text, GUYANESE_PATTERNS.GRA),
      vat: this.extractMatches(text, GUYANESE_PATTERNS.VAT),
      phone: this.extractMatches(text, GUYANESE_PATTERNS.PHONE),
      addresses: this.extractMatches(text, GUYANESE_PATTERNS.GEORGETOWN_AREAS),
      amounts: this.extractMatches(text, GUYANESE_PATTERNS.CURRENCY),
      dates: this.extractMatches(text, GUYANESE_PATTERNS.DATES),
      governmentEntities: this.extractMatches(text, GUYANESE_PATTERNS.GOVERNMENT_ENTITIES)
    };
  }

  /**
   * Extract pattern matches from text
   */
  private static extractMatches(text: string, pattern: RegExp): string[] {
    const matches = text.match(pattern);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Classify document type based on content
   */
  private static classifyDocument(
    text: string,
    hintType?: string
  ): EnhancedOCRResult['documentClassification'] {

    let bestMatch = {
      type: 'Unknown',
      category: 'General',
      confidence: 0
    };

    // Check against known patterns
    for (const [type, config] of Object.entries(DOCUMENT_CLASSIFICATION_PATTERNS)) {
      let matchScore = 0;

      for (const pattern of config.patterns) {
        const matches = text.match(pattern);
        if (matches) {
          matchScore += matches.length * 0.2;
        }
      }

      const confidence = Math.min(matchScore * config.confidence, 1.0);

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          type,
          category: config.category,
          confidence
        };
      }
    }

    // Use hint type if no strong classification found
    if (bestMatch.confidence < 0.5 && hintType) {
      bestMatch.type = hintType;
      bestMatch.confidence = 0.5;
    }

    return bestMatch;
  }

  /**
   * Check compliance requirements for Guyanese regulations
   */
  private static checkComplianceRequirements(
    text: string,
    entities: EnhancedOCRResult['extractedEntities'],
    classification: EnhancedOCRResult['documentClassification'],
    clientInfo?: { type: string; sector?: string }
  ): EnhancedOCRResult['complianceFlags'] {

    const flags: string[] = [];
    let graCompliance = true;
    let nisCompliance = true;
    let vatCompliance = true;
    let taxCompliance = true;

    // Check for required GRA numbers
    if (classification.category === 'Tax Documents') {
      if (!entities.tin || entities.tin.length === 0) {
        flags.push('Missing TIN (Tax Identification Number)');
        graCompliance = false;
      }

      if (!entities.gra || entities.gra.length === 0) {
        flags.push('Missing GRA registration number');
        graCompliance = false;
      }
    }

    // Check for VAT requirements
    if (classification.type.includes('VAT') || text.toLowerCase().includes('vat')) {
      if (!entities.vat || entities.vat.length === 0) {
        flags.push('Missing VAT registration number');
        vatCompliance = false;
      }
    }

    // Check for NIS requirements for employment-related documents
    if (text.toLowerCase().includes('employ') || text.toLowerCase().includes('salary')) {
      if (!entities.nis || entities.nis.length === 0) {
        flags.push('Missing NIS number for employment document');
        nisCompliance = false;
      }
    }

    // Client-specific checks
    if (clientInfo?.type === 'company') {
      if (!entities.tin || entities.tin.length === 0) {
        flags.push('Company must have TIN registration');
        taxCompliance = false;
      }
    }

    return {
      graCompliance,
      nisCompliance,
      vatCompliance,
      taxCompliance,
      flags
    };
  }

  /**
   * Calculate quality metrics for the OCR result
   */
  private static calculateQualityMetrics(
    text: string,
    entities: EnhancedOCRResult['extractedEntities']
  ): EnhancedOCRResult['qualityMetrics'] {

    // Text clarity based on readability and special characters
    const specialCharRatio = (text.match(/[^a-zA-Z0-9\s\-.,]/g) || []).length / text.length;
    const textClarity = Math.max(0, 1 - (specialCharRatio * 2));

    // Document structure based on detected patterns
    const totalEntities = Object.values(entities).reduce((sum, arr) => sum + (arr?.length || 0), 0);
    const documentStructure = Math.min(totalEntities * 0.1, 1.0);

    // Information completeness based on expected fields
    const hasDateInfo = (entities.dates?.length || 0) > 0;
    const hasAmountInfo = (entities.amounts?.length || 0) > 0;
    const hasIdentifierInfo = (entities.tin?.length || 0) + (entities.nis?.length || 0) +
                             (entities.gra?.length || 0) > 0;

    const completenessScore = (
      (hasDateInfo ? 0.33 : 0) +
      (hasAmountInfo ? 0.33 : 0) +
      (hasIdentifierInfo ? 0.34 : 0)
    );

    return {
      textClarity: Math.round(textClarity * 100) / 100,
      documentStructure: Math.round(documentStructure * 100) / 100,
      informationCompleteness: Math.round(completenessScore * 100) / 100
    };
  }

  /**
   * Count terminology matches in text
   */
  private static countTerminologyMatches(text: string): number {
    const lowerText = text.toLowerCase();
    let matches = 0;

    for (const terms of Object.values(GUYANESE_TERMINOLOGY)) {
      for (const term of terms) {
        if (lowerText.includes(term.toLowerCase())) {
          matches++;
        }
      }
    }

    return matches;
  }

  /**
   * Calculate overall confidence score
   */
  private static calculateConfidenceScore(factors: OCRConfidenceFactors): number {
    const {
      patternMatches,
      terminologyMatches,
      structureScore,
      clarityScore
    } = factors;

    // Weighted average of confidence factors
    const patternWeight = Math.min(patternMatches * 0.15, 0.3);
    const terminologyWeight = Math.min(terminologyMatches * 0.05, 0.2);
    const structureWeight = structureScore * 0.25;
    const clarityWeight = clarityScore * 0.25;

    const confidence = patternWeight + terminologyWeight + structureWeight + clarityWeight;
    return Math.round(Math.min(confidence, 1.0) * 100) / 100;
  }

  /**
   * Generate suggested actions based on analysis
   */
  private static generateSuggestedActions(
    complianceFlags: EnhancedOCRResult['complianceFlags'],
    qualityMetrics: EnhancedOCRResult['qualityMetrics'],
    classification: EnhancedOCRResult['documentClassification']
  ): string[] {

    const actions: string[] = [];

    // Quality-based suggestions
    if (qualityMetrics.textClarity < 0.7) {
      actions.push('Consider re-scanning document at higher resolution for better text clarity');
    }

    if (qualityMetrics.informationCompleteness < 0.5) {
      actions.push('Document appears incomplete - verify all required sections are present');
    }

    // Compliance-based suggestions
    if (!complianceFlags.graCompliance) {
      actions.push('Ensure GRA registration numbers are clearly visible and complete');
    }

    if (!complianceFlags.taxCompliance) {
      actions.push('Verify TIN (Tax Identification Number) is present and valid');
    }

    if (!complianceFlags.vatCompliance) {
      actions.push('Check VAT registration number for completeness');
    }

    // Classification-based suggestions
    if (classification.confidence < 0.6) {
      actions.push('Document type unclear - consider adding metadata or re-categorizing');
    }

    // Specific document type suggestions
    switch (classification.category) {
      case 'Tax Documents':
        actions.push('Verify all tax-related identifiers and amounts are accurate');
        break;
      case 'Financial Documents':
        actions.push('Cross-reference financial amounts with supporting documentation');
        break;
      case 'Government Correspondence':
        actions.push('File in appropriate government agency folder for easy retrieval');
        break;
    }

    return actions;
  }
}

/**
 * Utility functions for OCR enhancement
 */
export class OCRUtils {

  /**
   * Validate extracted Guyanese identification numbers
   */
  static validateGuyanID(type: 'TIN' | 'NIS' | 'GRA' | 'VAT', value: string): boolean {
    const cleanValue = value.replace(/[\s\-]/g, '');

    switch (type) {
      case 'TIN':
        return /^\d{9}$/.test(cleanValue);
      case 'NIS':
        return /^[A-Z]{2}\d{8}$/.test(cleanValue);
      case 'GRA':
        return /^\d{6,10}$/.test(cleanValue);
      case 'VAT':
        return /^\d{9}$/.test(cleanValue);
      default:
        return false;
    }
  }

  /**
   * Format Guyanese currency amounts
   */
  static formatGuyanCurrency(amount: string): string {
    const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ''));
    if (isNaN(numericAmount)) return amount;

    return `GY$${numericAmount.toLocaleString('en-GY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Standardize Guyanese phone numbers
   */
  static formatGuyanPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 7) {
      return `+592-${digits.substring(0, 3)}-${digits.substring(3)}`;
    } else if (digits.length === 10 && digits.startsWith('592')) {
      return `+${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6)}`;
    }

    return phone; // Return original if format doesn't match
  }

  /**
   * Extract and validate dates from Guyanese documents
   */
  static parseGuyanDate(dateString: string): Date | null {
    // Try various Guyanese date formats
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    ];

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        const [, part1, part2, part3] = match;

        // Try DD/MM/YYYY format first (common in Guyana)
        if (format === formats[0] || format === formats[1]) {
          const day = parseInt(part1);
          const month = parseInt(part2) - 1; // JavaScript months are 0-based
          const year = parseInt(part3);

          const date = new Date(year, month, day);
          if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return date;
          }
        }

        // Try YYYY-MM-DD format
        if (format === formats[2] || format === formats[3]) {
          const year = parseInt(part1);
          const month = parseInt(part2) - 1;
          const day = parseInt(part3);

          const date = new Date(year, month, day);
          if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return date;
          }
        }
      }
    }

    return null;
  }
}