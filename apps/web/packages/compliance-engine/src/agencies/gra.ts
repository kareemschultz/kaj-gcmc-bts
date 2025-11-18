/**
 * GRA (Guyana Revenue Authority) Compliance Module
 * 
 * Handles all tax-related compliance requirements including:
 * - Corporate Income Tax
 * - Value Added Tax (VAT)
 * - Withholding Tax
 * - Property Tax
 * - Excise Tax
 */

import { addDays, addMonths, addQuarters, addYears, isAfter, isBefore } from 'date-fns';
import type { 
  GuyanaBusinessProfile, 
  ComplianceRequirement, 
  ComplianceResult, 
  TaxCalculationInput, 
  TaxCalculationResult,
  FilingDeadline,
  BusinessType 
} from '../types';

export const GRA_AGENCY = 'GRA';

/**
 * GRA Tax Rates (2024 - Guyana)
 */
export const GRA_TAX_RATES = {
  CORPORATE_TAX: {
    STANDARD: 0.25, // 25%
    SMALL_BUSINESS: 0.10, // 10% for businesses with turnover < GYD 15M
    MANUFACTURING: 0.20, // 20% for manufacturing
  },
  VAT: {
    STANDARD: 0.14, // 14%
    ZERO_RATED: 0.00, // Exports, essential items
    EXEMPT: 0.00, // Financial services, education, health
  },
  WITHHOLDING_TAX: {
    DIVIDENDS: 0.20, // 20%
    INTEREST: 0.20, // 20%
    ROYALTIES: 0.15, // 15%
    RENT: 0.10, // 10%
    SERVICES: 0.05, // 5%
  },
  PROPERTY_TAX: {
    RESIDENTIAL: 0.0075, // 0.75% of assessed value
    COMMERCIAL: 0.01, // 1% of assessed value
  }
};

/**
 * GRA Filing Requirements by Business Type
 */
export const GRA_FILING_REQUIREMENTS: ComplianceRequirement[] = [
  {
    id: 'GRA_CIT_ANNUAL',
    agency: 'GRA',
    name: 'Corporate Income Tax Return',
    description: 'Annual corporate income tax filing',
    frequency: 'ANNUAL',
    dueDate: new Date(), // Will be calculated dynamically
    isRequired: true,
    applicableBusinessTypes: ['CORPORATION', 'BRANCH', 'SUBSIDIARY'],
    minimumRevenue: 0,
  },
  {
    id: 'GRA_VAT_MONTHLY',
    agency: 'GRA',
    name: 'VAT Return',
    description: 'Monthly VAT return for registered businesses',
    frequency: 'MONTHLY',
    dueDate: new Date(),
    isRequired: true,
    applicableBusinessTypes: ['CORPORATION', 'PARTNERSHIP', 'SOLE_PROPRIETORSHIP'],
    minimumRevenue: 10000000, // GYD 10M threshold for VAT registration
  },
  {
    id: 'GRA_WHT_MONTHLY',
    agency: 'GRA',
    name: 'Withholding Tax Return',
    description: 'Monthly withholding tax remittance',
    frequency: 'MONTHLY',
    dueDate: new Date(),
    isRequired: true,
    applicableBusinessTypes: ['CORPORATION', 'BRANCH', 'SUBSIDIARY'],
    minimumEmployees: 1,
  },
  {
    id: 'GRA_PROPERTY_ANNUAL',
    agency: 'GRA',
    name: 'Property Tax Return',
    description: 'Annual property tax assessment',
    frequency: 'ANNUAL',
    dueDate: new Date(),
    isRequired: true,
    applicableBusinessTypes: ['CORPORATION', 'PARTNERSHIP', 'SOLE_PROPRIETORSHIP'],
  }
];

/**
 * Calculate GRA filing deadlines based on business profile
 */
export function calculateGRADeadlines(business: GuyanaBusinessProfile): FilingDeadline[] {
  const deadlines: FilingDeadline[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Corporate Income Tax - Due March 31st following year-end
  if (['CORPORATION', 'BRANCH', 'SUBSIDIARY'].includes(business.businessType)) {
    const citDueDate = new Date(currentYear + 1, 2, 31); // March 31
    deadlines.push({
      agency: 'GRA',
      filingType: 'Corporate Income Tax',
      dueDate: citDueDate,
      description: 'Annual corporate income tax return',
      isOverdue: isBefore(citDueDate, now),
      daysUntilDue: Math.ceil((citDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      penalties: {
        daily: 5000, // GYD 5,000 per day
        maximum: 500000, // GYD 500,000
        current: 0,
      }
    });
  }

  // VAT Returns - Due 15th of following month
  if (business.annualRevenue >= 10000000) {
    const vatDueDate = addDays(addMonths(new Date(currentYear, now.getMonth(), 1), 1), 14);
    deadlines.push({
      agency: 'GRA',
      filingType: 'VAT Return',
      dueDate: vatDueDate,
      description: 'Monthly VAT return and payment',
      isOverdue: isBefore(vatDueDate, now),
      daysUntilDue: Math.ceil((vatDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      penalties: {
        daily: 2000, // GYD 2,000 per day
        maximum: 200000, // GYD 200,000
        current: 0,
      }
    });
  }

  // Withholding Tax - Due 15th of following month
  if (business.employeeCount > 0) {
    const whtDueDate = addDays(addMonths(new Date(currentYear, now.getMonth(), 1), 1), 14);
    deadlines.push({
      agency: 'GRA',
      filingType: 'Withholding Tax',
      dueDate: whtDueDate,
      description: 'Monthly withholding tax remittance',
      isOverdue: isBefore(whtDueDate, now),
      daysUntilDue: Math.ceil((whtDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      penalties: {
        daily: 1000, // GYD 1,000 per day
        maximum: 100000, // GYD 100,000
        current: 0,
      }
    });
  }

  return deadlines;
}

/**
 * Calculate GRA tax obligations
 */
export function calculateGRATaxes(input: TaxCalculationInput): TaxCalculationResult {
  const { grossIncome, deductions, businessType, employeeCount } = input;
  const taxableIncome = Math.max(0, grossIncome - deductions);

  // Corporate Tax Calculation
  let corporateRate = GRA_TAX_RATES.CORPORATE_TAX.STANDARD;
  if (grossIncome < 15000000) { // Small business threshold
    corporateRate = GRA_TAX_RATES.CORPORATE_TAX.SMALL_BUSINESS;
  }
  
  const corporateTax = taxableIncome * corporateRate;

  // VAT Calculation (on gross income if VAT registered)
  const vatRate = grossIncome >= 10000000 ? GRA_TAX_RATES.VAT.STANDARD : 0;
  const vat = grossIncome * vatRate;

  // Withholding Tax (estimated based on payments)
  const estimatedPayments = grossIncome * 0.1; // Assume 10% of income is subject to WHT
  const witholdingTax = estimatedPayments * GRA_TAX_RATES.WITHHOLDING_TAX.SERVICES;

  // Calculate penalties for late filing (if applicable)
  const penalties = 0; // Would be calculated based on late filing history

  const totalTax = corporateTax + vat + witholdingTax;
  
  return {
    corporateTax,
    vat,
    witholdingTax,
    totalTax,
    nisContribution: 0, // NIS calculated separately
    penalties,
    totalDue: totalTax + penalties,
  };
}

/**
 * Assess GRA compliance for a business
 */
export function assessGRACompliance(
  business: GuyanaBusinessProfile,
  filingHistory: any[] = []
): ComplianceResult {
  const deadlines = calculateGRADeadlines(business);
  const overdueFilings = deadlines.filter(d => d.isOverdue);
  
  let score = 100;
  let level: any = 'COMPLIANT';
  const notes: string[] = [];

  // Deduct points for overdue filings
  if (overdueFilings.length > 0) {
    score -= overdueFilings.length * 20;
    notes.push(`${overdueFilings.length} overdue filing(s) with GRA`);
    
    if (score < 70) level = 'MAJOR_ISSUES';
    else if (score < 85) level = 'MINOR_ISSUES';
  }

  // Check registration requirements
  if (business.annualRevenue >= 10000000 && !business.vatRegistered) {
    score -= 30;
    level = 'CRITICAL';
    notes.push('Business must register for VAT (revenue exceeds GYD 10M)');
  }

  if (!business.tinNumber) {
    score -= 25;
    level = 'CRITICAL';
    notes.push('Business must obtain TIN (Tax Identification Number)');
  }

  return {
    requirementId: 'GRA_OVERALL',
    agency: 'GRA',
    level,
    score: Math.max(0, score),
    dueDate: deadlines[0]?.dueDate || new Date(),
    daysOverdue: overdueFilings.length > 0 ? Math.max(...overdueFilings.map(d => -d.daysUntilDue)) : 0,
    penalties: overdueFilings.reduce((sum, d) => sum + (d.penalties?.current || 0), 0),
    notes,
  };
}

/**
 * Get specific GRA tax forms and requirements
 */
export function getGRAForms(businessType: BusinessType) {
  const forms = {
    'CORPORATION': [
      'Form CIT-1: Corporate Income Tax Return',
      'Form VAT-1: Value Added Tax Return',
      'Form WHT-1: Withholding Tax Return',
      'Form PT-1: Property Tax Return',
    ],
    'PARTNERSHIP': [
      'Form PIT-1: Partnership Income Tax Return',
      'Form VAT-1: Value Added Tax Return',
      'Form PT-1: Property Tax Return',
    ],
    'SOLE_PROPRIETORSHIP': [
      'Form PIT-1: Personal Income Tax Return',
      'Form VAT-1: Value Added Tax Return (if applicable)',
      'Form PT-1: Property Tax Return',
    ],
  };

  return forms[businessType] || [];
}
