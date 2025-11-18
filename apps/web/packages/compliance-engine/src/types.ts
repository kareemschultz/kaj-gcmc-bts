/**
 * Compliance Engine Types
 * 
 * Core types for Guyana business compliance
 */

export type GuyanaAgency = 'GRA' | 'NIS' | 'DCRA' | 'GO_INVEST' | 'EPA' | 'IMMIGRATION';

export type BusinessType = 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'CORPORATION' | 'COOPERATIVE' | 'BRANCH' | 'SUBSIDIARY';

export type FilingType = 'QUARTERLY' | 'MONTHLY' | 'ANNUAL' | 'ADHOC' | 'TRIGGER_BASED';

export type ComplianceLevel = 'COMPLIANT' | 'MINOR_ISSUES' | 'MAJOR_ISSUES' | 'NON_COMPLIANT' | 'CRITICAL';

export interface GuyanaBusinessProfile {
  businessId: string;
  businessType: BusinessType;
  sector: string;
  registrationDate: Date;
  tinNumber?: string;
  nisNumber?: string;
  vatRegistered: boolean;
  employeeCount: number;
  annualRevenue: number;
  location: {
    region: string;
    municipality?: string;
  };
}

export interface ComplianceRequirement {
  id: string;
  agency: GuyanaAgency;
  name: string;
  description: string;
  frequency: FilingType;
  dueDate: Date;
  isRequired: boolean;
  applicableBusinessTypes: BusinessType[];
  minimumRevenue?: number;
  minimumEmployees?: number;
}

export interface ComplianceResult {
  requirementId: string;
  agency: GuyanaAgency;
  level: ComplianceLevel;
  score: number; // 0-100
  dueDate: Date;
  lastFiledDate?: Date;
  daysOverdue?: number;
  penalties?: number;
  notes: string[];
}

export interface TaxCalculationInput {
  grossIncome: number;
  deductions: number;
  period: 'monthly' | 'quarterly' | 'annual';
  businessType: BusinessType;
  employeeCount: number;
}

export interface TaxCalculationResult {
  corporateTax: number;
  vat: number;
  witholdingTax: number;
  totalTax: number;
  nisContribution: number;
  penalties: number;
  totalDue: number;
}

export interface FilingDeadline {
  agency: GuyanaAgency;
  filingType: string;
  dueDate: Date;
  description: string;
  isOverdue: boolean;
  daysUntilDue: number;
  penalties?: {
    daily: number;
    maximum: number;
    current: number;
  };
}

export interface ComplianceScore {
  overall: number; // 0-100
  byAgency: Record<GuyanaAgency, number>;
  level: ComplianceLevel;
  criticalIssues: number;
  lastCalculated: Date;
}
