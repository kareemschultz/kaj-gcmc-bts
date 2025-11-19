/**
 * Agency-Specific Form Templates for Guyanese Regulatory Authorities
 * Comprehensive templates for all 29 agencies with specific form configurations
 */

import type {
  AgencyFormTemplate,
  FormConfiguration,
  FormField,
  FormSection,
  FormStep,
  ValidationRule,
  Authority,
  AgencyCategory,
  DocumentCategory,
  ClientType
} from "./types";

// Template generation utilities
const createBaseField = (overrides: Partial<FormField>): FormField => ({
  id: "",
  type: "text",
  name: "",
  label: "",
  order: 0,
  required: false,
  ...overrides
} as FormField);

const createSection = (id: string, title: string, fields: string[], order: number): FormSection => ({
  id,
  title,
  order,
  fields
});

const createStep = (id: string, title: string, sections: string[], order: number): FormStep => ({
  id,
  title,
  order,
  sections,
  navigation: { allowSkip: false, allowBack: true }
});

// GRA (Guyana Revenue Authority) Templates
const GRA_TEMPLATES: AgencyFormTemplate[] = [
  {
    id: "gra-vat-return",
    authority: "GRA",
    category: "tax_revenue",
    documentType: "vat_return",
    name: "VAT Return Form",
    description: "Monthly/Quarterly VAT return for registered businesses",
    version: "1.0",
    isOfficial: true,
    isActive: true,
    effectiveDate: new Date("2024-01-01"),
    usageCount: 0,
    complianceVersion: "2024.1",
    validationRules: [],
    requiredFields: ["business_reg", "vat_reg", "return_period", "gross_sales", "vat_collected"],
    createdBy: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
    configuration: {
      id: "gra-vat-return",
      name: "VAT Return Form",
      title: "Value Added Tax (VAT) Return",
      description: "Submit your monthly or quarterly VAT return to the Guyana Revenue Authority",
      version: "1.0",
      authority: "GRA",
      documentType: "vat_return",
      category: "tax_filing",
      applicableClientTypes: ["company", "partnership"],
      fields: [
        {
          ...createBaseField({
            id: "business_reg",
            type: "business_reg",
            name: "business_registration",
            label: "Business Registration Number",
            required: true,
            order: 1,
            validationRules: [
              {
                id: "dcra_format",
                type: "guyaneseSpecific",
                message: "Business registration must be in DCRA format (RC######)",
                severity: "error"
              }
            ]
          })
        },
        {
          ...createBaseField({
            id: "vat_reg",
            type: "text",
            name: "vat_registration",
            label: "VAT Registration Number",
            required: true,
            order: 2,
            validationRules: [
              {
                id: "vat_format",
                type: "pattern",
                value: "^VAT[0-9]{8}$",
                message: "VAT registration must start with 'VAT' followed by 8 digits",
                severity: "error"
              }
            ]
          })
        },
        {
          ...createBaseField({
            id: "return_period",
            type: "select",
            name: "return_period",
            label: "Return Period",
            required: true,
            order: 3,
            options: [
              { value: "2024-01", label: "January 2024" },
              { value: "2024-02", label: "February 2024" },
              { value: "2024-03", label: "March 2024" },
              { value: "2024-q1", label: "Q1 2024" },
              { value: "2024-q2", label: "Q2 2024" }
            ]
          })
        },
        {
          ...createBaseField({
            id: "gross_sales",
            type: "currency",
            name: "gross_sales",
            label: "Gross Sales (GYD)",
            required: true,
            order: 4,
            currency: "GYD"
          })
        },
        {
          ...createBaseField({
            id: "vat_collected",
            type: "calculated",
            name: "vat_collected",
            label: "VAT Collected",
            required: true,
            order: 5,
            calculation: {
              id: "vat_calc",
              type: "vat_calculation",
              parameters: { baseAmount: "gross_sales", vatType: "standard" },
              guyaneseCalculation: {
                authority: "GRA",
                calculationType: "vat_standard",
                rates: { standard: 0.14 }
              }
            },
            dependsOn: ["gross_sales"]
          })
        }
      ],
      sections: [
        createSection("business_info", "Business Information", ["business_reg", "vat_reg"], 1),
        createSection("return_details", "Return Details", ["return_period"], 2),
        createSection("vat_calculation", "VAT Calculation", ["gross_sales", "vat_collected"], 3)
      ],
      steps: [
        createStep("step_1", "Business Details", ["business_info"], 1),
        createStep("step_2", "Return Period", ["return_details"], 2),
        createStep("step_3", "VAT Calculation", ["vat_calculation"], 3)
      ],
      saveAndResume: true,
      autoSave: true,
      autoSaveInterval: 30,
      allowPartialSubmission: false,
      requiresReview: true,
      submissionConfig: {
        method: "api",
        endpoint: "/api/gra/vat-return",
        postSubmissionActions: [
          {
            type: "email",
            config: {
              template: "vat_return_confirmation",
              to: ["taxpayer@email.com"]
            }
          }
        ]
      },
      isActive: true,
      createdBy: "system",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  {
    id: "gra-income-tax-individual",
    authority: "GRA",
    category: "tax_revenue",
    documentType: "income_tax_return",
    name: "Individual Income Tax Return",
    description: "Annual income tax return for individual taxpayers",
    version: "1.0",
    isOfficial: true,
    isActive: true,
    effectiveDate: new Date("2024-01-01"),
    usageCount: 0,
    complianceVersion: "2024.1",
    validationRules: [],
    requiredFields: ["tin", "full_name", "tax_year", "total_income"],
    createdBy: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
    configuration: {
      id: "gra-income-tax-individual",
      name: "Individual Income Tax Return",
      title: "Individual Income Tax Return",
      description: "Annual income tax return for individual taxpayers in Guyana",
      version: "1.0",
      authority: "GRA",
      documentType: "income_tax_return",
      category: "tax_filing",
      applicableClientTypes: ["individual"],
      fields: [
        {
          ...createBaseField({
            id: "tin",
            type: "tax_id",
            name: "tax_identification_number",
            label: "Tax Identification Number (TIN)",
            required: true,
            order: 1
          })
        },
        {
          ...createBaseField({
            id: "full_name",
            type: "text",
            name: "full_name",
            label: "Full Legal Name",
            required: true,
            order: 2,
            maxLength: 100
          })
        },
        {
          ...createBaseField({
            id: "tax_year",
            type: "select",
            name: "tax_year",
            label: "Tax Year",
            required: true,
            order: 3,
            options: [
              { value: "2023", label: "2023" },
              { value: "2024", label: "2024" }
            ]
          })
        },
        {
          ...createBaseField({
            id: "employment_income",
            type: "currency",
            name: "employment_income",
            label: "Employment Income (GYD)",
            required: false,
            order: 4,
            currency: "GYD"
          })
        },
        {
          ...createBaseField({
            id: "business_income",
            type: "currency",
            name: "business_income",
            label: "Business/Self-Employment Income (GYD)",
            required: false,
            order: 5,
            currency: "GYD"
          })
        },
        {
          ...createBaseField({
            id: "total_income",
            type: "calculated",
            name: "total_income",
            label: "Total Income",
            required: true,
            order: 6,
            calculation: {
              id: "total_income_calc",
              type: "sum",
              parameters: { fields: ["employment_income", "business_income"] }
            },
            dependsOn: ["employment_income", "business_income"]
          })
        },
        {
          ...createBaseField({
            id: "income_tax",
            type: "calculated",
            name: "income_tax",
            label: "Income Tax Due",
            required: true,
            order: 7,
            calculation: {
              id: "income_tax_calc",
              type: "custom_formula",
              parameters: {
                formula: "calculateIncomeTax(total_income)"
              },
              guyaneseCalculation: {
                authority: "GRA",
                calculationType: "income_tax",
                rates: {
                  bracket1: 0,
                  bracket2: 0.28,
                  bracket3: 0.40
                },
                thresholds: {
                  bracket1: 780000,
                  bracket2: 1560000
                },
                allowances: {
                  personal: 780000
                }
              }
            },
            dependsOn: ["total_income"]
          })
        }
      ],
      sections: [
        createSection("taxpayer_info", "Taxpayer Information", ["tin", "full_name", "tax_year"], 1),
        createSection("income_sources", "Income Sources", ["employment_income", "business_income", "total_income"], 2),
        createSection("tax_calculation", "Tax Calculation", ["income_tax"], 3)
      ],
      steps: [
        createStep("step_1", "Personal Details", ["taxpayer_info"], 1),
        createStep("step_2", "Income Information", ["income_sources"], 2),
        createStep("step_3", "Tax Calculation", ["tax_calculation"], 3)
      ],
      saveAndResume: true,
      autoSave: true,
      autoSaveInterval: 60,
      allowPartialSubmission: true,
      requiresReview: true,
      submissionConfig: {
        method: "api",
        endpoint: "/api/gra/income-tax-return"
      },
      isActive: true,
      createdBy: "system",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
];

// NIS (National Insurance Scheme) Templates
const NIS_TEMPLATES: AgencyFormTemplate[] = [
  {
    id: "nis-employer-return",
    authority: "NIS",
    category: "social_services",
    documentType: "employer_return",
    name: "NIS Employer Monthly Return",
    description: "Monthly return for employers to report employee contributions",
    version: "1.0",
    isOfficial: true,
    isActive: true,
    effectiveDate: new Date("2024-01-01"),
    usageCount: 0,
    complianceVersion: "2024.1",
    validationRules: [],
    requiredFields: ["employer_reg", "return_period", "employee_list"],
    createdBy: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
    configuration: {
      id: "nis-employer-return",
      name: "NIS Employer Return",
      title: "National Insurance Scheme Employer Monthly Return",
      description: "Submit monthly employee contributions to the National Insurance Scheme",
      version: "1.0",
      authority: "NIS",
      documentType: "employer_return",
      category: "compliance_certificate",
      applicableClientTypes: ["company", "partnership"],
      fields: [
        {
          ...createBaseField({
            id: "employer_reg",
            type: "text",
            name: "employer_registration",
            label: "Employer Registration Number",
            required: true,
            order: 1,
            pattern: "^EMP[0-9]{6}$"
          })
        },
        {
          ...createBaseField({
            id: "return_period",
            type: "date",
            name: "return_period",
            label: "Return Period (Month/Year)",
            required: true,
            order: 2
          })
        },
        {
          ...createBaseField({
            id: "total_employees",
            type: "number",
            name: "total_employees",
            label: "Total Number of Employees",
            required: true,
            order: 3,
            min: 1
          })
        },
        {
          ...createBaseField({
            id: "total_wages",
            type: "currency",
            name: "total_wages",
            label: "Total Wages Paid (GYD)",
            required: true,
            order: 4,
            currency: "GYD"
          })
        },
        {
          ...createBaseField({
            id: "employee_contributions",
            type: "calculated",
            name: "employee_contributions",
            label: "Employee Contributions",
            required: true,
            order: 5,
            calculation: {
              id: "employee_nis_calc",
              type: "nis_calculation",
              parameters: {
                salary: "total_wages",
                contributionType: "employee",
                period: "monthly"
              },
              guyaneseCalculation: {
                authority: "NIS",
                calculationType: "employee_contribution",
                rates: { employee: 0.056 }
              }
            },
            dependsOn: ["total_wages"]
          })
        },
        {
          ...createBaseField({
            id: "employer_contributions",
            type: "calculated",
            name: "employer_contributions",
            label: "Employer Contributions",
            required: true,
            order: 6,
            calculation: {
              id: "employer_nis_calc",
              type: "nis_calculation",
              parameters: {
                salary: "total_wages",
                contributionType: "employer",
                period: "monthly"
              },
              guyaneseCalculation: {
                authority: "NIS",
                calculationType: "employer_contribution",
                rates: { employer: 0.072 }
              }
            },
            dependsOn: ["total_wages"]
          })
        }
      ],
      sections: [
        createSection("employer_info", "Employer Information", ["employer_reg", "return_period"], 1),
        createSection("employee_summary", "Employee Summary", ["total_employees", "total_wages"], 2),
        createSection("contributions", "NIS Contributions", ["employee_contributions", "employer_contributions"], 3)
      ],
      steps: [
        createStep("step_1", "Employer Details", ["employer_info"], 1),
        createStep("step_2", "Employee Summary", ["employee_summary"], 2),
        createStep("step_3", "Contributions", ["contributions"], 3)
      ],
      saveAndResume: true,
      autoSave: true,
      autoSaveInterval: 30,
      allowPartialSubmission: false,
      requiresReview: true,
      submissionConfig: {
        method: "api",
        endpoint: "/api/nis/employer-return"
      },
      isActive: true,
      createdBy: "system",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
];

// DCRA (Deeds and Commercial Registry Authority) Templates
const DCRA_TEMPLATES: AgencyFormTemplate[] = [
  {
    id: "dcra-company-incorporation",
    authority: "DCRA",
    category: "registration",
    documentType: "company_incorporation",
    name: "Company Incorporation Form",
    description: "Form for incorporating a new company in Guyana",
    version: "1.0",
    isOfficial: true,
    isActive: true,
    effectiveDate: new Date("2024-01-01"),
    usageCount: 0,
    complianceVersion: "2024.1",
    validationRules: [],
    requiredFields: ["company_name", "company_type", "registered_office", "directors"],
    createdBy: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
    configuration: {
      id: "dcra-company-incorporation",
      name: "Company Incorporation",
      title: "Application for Company Incorporation",
      description: "Register a new company with the Deeds and Commercial Registry Authority",
      version: "1.0",
      authority: "DCRA",
      documentType: "company_incorporation",
      category: "incorporation",
      applicableClientTypes: ["company"],
      fields: [
        {
          ...createBaseField({
            id: "company_name",
            type: "text",
            name: "company_name",
            label: "Proposed Company Name",
            required: true,
            order: 1,
            maxLength: 100
          })
        },
        {
          ...createBaseField({
            id: "company_type",
            type: "select",
            name: "company_type",
            label: "Company Type",
            required: true,
            order: 2,
            options: [
              { value: "private_limited", label: "Private Limited Company" },
              { value: "public_limited", label: "Public Limited Company" },
              { value: "unlimited", label: "Unlimited Company" },
              { value: "guarantee", label: "Company Limited by Guarantee" }
            ]
          })
        },
        {
          ...createBaseField({
            id: "registered_office",
            type: "textarea",
            name: "registered_office",
            label: "Registered Office Address",
            required: true,
            order: 3,
            maxLength: 500
          })
        },
        {
          ...createBaseField({
            id: "share_capital",
            type: "currency",
            name: "share_capital",
            label: "Authorized Share Capital (GYD)",
            required: true,
            order: 4,
            currency: "GYD",
            min: 1000
          })
        },
        {
          ...createBaseField({
            id: "incorporation_fee",
            type: "calculated",
            name: "incorporation_fee",
            label: "Incorporation Fee",
            required: true,
            order: 5,
            calculation: {
              id: "dcra_fee_calc",
              type: "fee_calculation",
              parameters: {
                feeType: "registration",
                entityType: "company"
              },
              guyaneseCalculation: {
                authority: "DCRA",
                calculationType: "incorporation_fee",
                rates: { company: 25000 }
              }
            }
          })
        }
      ],
      sections: [
        createSection("company_details", "Company Details", ["company_name", "company_type"], 1),
        createSection("address_capital", "Address and Capital", ["registered_office", "share_capital"], 2),
        createSection("fees", "Fees", ["incorporation_fee"], 3)
      ],
      steps: [
        createStep("step_1", "Company Information", ["company_details"], 1),
        createStep("step_2", "Details", ["address_capital"], 2),
        createStep("step_3", "Review and Payment", ["fees"], 3)
      ],
      saveAndResume: true,
      autoSave: true,
      autoSaveInterval: 60,
      allowPartialSubmission: true,
      requiresReview: true,
      submissionConfig: {
        method: "api",
        endpoint: "/api/dcra/company-incorporation"
      },
      isActive: true,
      createdBy: "system",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
];

// Immigration Templates
const IMMIGRATION_TEMPLATES: AgencyFormTemplate[] = [
  {
    id: "immigration-work-permit",
    authority: "Immigration",
    category: "permits_licenses",
    documentType: "work_permit",
    name: "Work Permit Application",
    description: "Application for work permit for foreign nationals",
    version: "1.0",
    isOfficial: true,
    isActive: true,
    effectiveDate: new Date("2024-01-01"),
    usageCount: 0,
    complianceVersion: "2024.1",
    validationRules: [],
    requiredFields: ["passport", "full_name", "nationality", "employer", "position"],
    createdBy: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
    configuration: {
      id: "immigration-work-permit",
      name: "Work Permit Application",
      title: "Application for Work Permit",
      description: "Apply for a work permit to work legally in Guyana",
      version: "1.0",
      authority: "Immigration",
      documentType: "work_permit",
      category: "permit_license",
      applicableClientTypes: ["individual"],
      fields: [
        {
          ...createBaseField({
            id: "passport",
            type: "passport",
            name: "passport_number",
            label: "Passport Number",
            required: true,
            order: 1
          })
        },
        {
          ...createBaseField({
            id: "full_name",
            type: "text",
            name: "full_name",
            label: "Full Name (as on passport)",
            required: true,
            order: 2,
            maxLength: 100
          })
        },
        {
          ...createBaseField({
            id: "nationality",
            type: "select",
            name: "nationality",
            label: "Nationality",
            required: true,
            order: 3,
            options: [
              { value: "US", label: "United States" },
              { value: "CA", label: "Canada" },
              { value: "UK", label: "United Kingdom" },
              { value: "IN", label: "India" },
              { value: "CN", label: "China" },
              { value: "BR", label: "Brazil" }
            ]
          })
        },
        {
          ...createBaseField({
            id: "employer",
            type: "text",
            name: "employer_name",
            label: "Employer/Sponsoring Organization",
            required: true,
            order: 4,
            maxLength: 200
          })
        },
        {
          ...createBaseField({
            id: "position",
            type: "text",
            name: "job_position",
            label: "Position/Job Title",
            required: true,
            order: 5,
            maxLength: 100
          })
        }
      ],
      sections: [
        createSection("personal_info", "Personal Information", ["passport", "full_name", "nationality"], 1),
        createSection("employment_info", "Employment Information", ["employer", "position"], 2)
      ],
      steps: [
        createStep("step_1", "Personal Details", ["personal_info"], 1),
        createStep("step_2", "Employment Details", ["employment_info"], 2)
      ],
      saveAndResume: true,
      autoSave: true,
      autoSaveInterval: 120,
      allowPartialSubmission: true,
      requiresReview: true,
      submissionConfig: {
        method: "api",
        endpoint: "/api/immigration/work-permit"
      },
      isActive: true,
      createdBy: "system",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
];

// Compile all templates
export const AGENCY_FORM_TEMPLATES: Record<Authority, AgencyFormTemplate[]> = {
  GRA: GRA_TEMPLATES,
  NIS: NIS_TEMPLATES,
  DCRA: DCRA_TEMPLATES,
  Immigration: IMMIGRATION_TEMPLATES,

  // Additional agencies (templates to be expanded)
  MOL: [],
  EPA: [],
  GSB: [],
  BOG: [],
  MOH: [],
  NDIA: [],
  GWI: [],
  GPL: [],
  GuyOil: [],
  GGMC: [],
  MARAD: [],
  GCAA: [],
  CFU: [],
  GoInvest: [],
  GGB: [],
  GPF: [],
  CARICOM: [],
  CUSTOMS: [],
  FORESTRY: [],
  LANDS: [],
  TRANSPORT: [],
  TOURISM: [],
  AGRICULTURE: [],
  EDUCATION: [],
  SOCIAL_SERVICES: []
};

/**
 * Get all templates for a specific authority
 */
export const getTemplatesForAuthority = (authority: Authority): AgencyFormTemplate[] => {
  return AGENCY_FORM_TEMPLATES[authority] || [];
};

/**
 * Get template by ID
 */
export const getTemplateById = (templateId: string): AgencyFormTemplate | null => {
  for (const templates of Object.values(AGENCY_FORM_TEMPLATES)) {
    const template = templates.find(t => t.id === templateId);
    if (template) return template;
  }
  return null;
};

/**
 * Get templates by document type
 */
export const getTemplatesByType = (documentType: string): AgencyFormTemplate[] => {
  const templates: AgencyFormTemplate[] = [];
  for (const authorityTemplates of Object.values(AGENCY_FORM_TEMPLATES)) {
    templates.push(...authorityTemplates.filter(t => t.documentType === documentType));
  }
  return templates;
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: AgencyCategory): AgencyFormTemplate[] => {
  const templates: AgencyFormTemplate[] = [];
  for (const authorityTemplates of Object.values(AGENCY_FORM_TEMPLATES)) {
    templates.push(...authorityTemplates.filter(t => t.category === category));
  }
  return templates;
};

/**
 * Get templates applicable for client type
 */
export const getTemplatesForClientType = (clientType: ClientType): AgencyFormTemplate[] => {
  const templates: AgencyFormTemplate[] = [];
  for (const authorityTemplates of Object.values(AGENCY_FORM_TEMPLATES)) {
    templates.push(...authorityTemplates.filter(t =>
      t.configuration.applicableClientTypes.includes(clientType)
    ));
  }
  return templates;
};

/**
 * Create a new template based on existing one
 */
export const createTemplateFromBase = (
  baseTemplate: AgencyFormTemplate,
  customizations: Partial<FormConfiguration>
): AgencyFormTemplate => {
  const newTemplate: AgencyFormTemplate = {
    ...baseTemplate,
    id: `${baseTemplate.id}-custom-${Date.now()}`,
    name: `${baseTemplate.name} (Custom)`,
    isOfficial: false,
    version: "1.0-custom",
    configuration: {
      ...baseTemplate.configuration,
      ...customizations,
      id: `${baseTemplate.configuration.id}-custom-${Date.now()}`,
      name: `${baseTemplate.configuration.name} (Custom)`,
      version: "1.0-custom"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return newTemplate;
};

/**
 * Validate template configuration
 */
export const validateTemplate = (template: AgencyFormTemplate): {
  isValid: boolean;
  errors: string[];
  warnings: string[]
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!template.id) errors.push("Template ID is required");
  if (!template.name) errors.push("Template name is required");
  if (!template.authority) errors.push("Authority is required");
  if (!template.configuration) errors.push("Form configuration is required");

  // Check configuration
  if (template.configuration) {
    if (!template.configuration.fields || template.configuration.fields.length === 0) {
      errors.push("At least one field is required");
    }

    // Check for duplicate field IDs
    const fieldIds = template.configuration.fields.map(f => f.id);
    const duplicateIds = fieldIds.filter((id, index) => fieldIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate field IDs: ${duplicateIds.join(", ")}`);
    }

    // Check required fields exist
    template.requiredFields.forEach(fieldName => {
      const fieldExists = template.configuration.fields.some(f => f.name === fieldName);
      if (!fieldExists) {
        errors.push(`Required field '${fieldName}' not found in form configuration`);
      }
    });

    // Warnings
    if (!template.configuration.submissionConfig.endpoint) {
      warnings.push("No submission endpoint configured");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Get template statistics
 */
export const getTemplateStats = (): {
  totalTemplates: number;
  templatesByAuthority: Record<Authority, number>;
  templatesByCategory: Record<AgencyCategory, number>;
  mostUsedTemplates: Array<{ id: string; name: string; usageCount: number }>;
} => {
  let totalTemplates = 0;
  const templatesByAuthority: Record<Authority, number> = {} as Record<Authority, number>;
  const templatesByCategory: Record<AgencyCategory, number> = {} as Record<AgencyCategory, number>;
  const allTemplates: AgencyFormTemplate[] = [];

  // Count templates
  Object.entries(AGENCY_FORM_TEMPLATES).forEach(([authority, templates]) => {
    templatesByAuthority[authority as Authority] = templates.length;
    totalTemplates += templates.length;
    allTemplates.push(...templates);

    templates.forEach(template => {
      templatesByCategory[template.category] = (templatesByCategory[template.category] || 0) + 1;
    });
  });

  // Get most used templates
  const mostUsedTemplates = allTemplates
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 10)
    .map(t => ({
      id: t.id,
      name: t.name,
      usageCount: t.usageCount
    }));

  return {
    totalTemplates,
    templatesByAuthority,
    templatesByCategory,
    mostUsedTemplates
  };
};