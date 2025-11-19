/**
 * Dynamic Form Service for Agency Requirements
 * Handles creation and management of dynamic forms for different regulatory agencies
 */

import type {
  Authority,
  AgencyFormTemplate,
  FormSection,
  FormField,
  FormFieldOption,
  FormValidationRule,
  WorkflowCondition
} from "@GCMC-KAJ/types";

export interface FormInstance {
  templateId: number;
  data: Record<string, unknown>;
  validationErrors: ValidationError[];
  currentStep: number;
  isComplete: boolean;
  metadata: Record<string, unknown>;
}

export interface ValidationError {
  fieldId: string;
  message: string;
  severity: "error" | "warning";
}

export interface FormSubmissionResult {
  isValid: boolean;
  errors: ValidationError[];
  submissionId?: number;
  nextSteps: string[];
}

/**
 * Dynamic Form Service for creating and managing agency-specific forms
 */
export class DynamicFormService {
  constructor(private prisma: any) {}

  /**
   * Create a new form template for an agency
   */
  async createFormTemplate(
    tenantId: number,
    authority: Authority,
    templateData: {
      documentType: string;
      name: string;
      version: string;
      description?: string;
      effectiveDate: Date;
      expiryDate?: Date;
      submissionConfig: {
        method: "online" | "email" | "physical";
        endpoint?: string;
        format: "json" | "xml" | "pdf" | "form_data";
        authentication?: {
          type: "api_key" | "oauth" | "basic" | "certificate";
          config: Record<string, unknown>;
        };
      };
      sections: Array<{
        name: string;
        title: string;
        description?: string;
        order: number;
        isRequired: boolean;
        fields: Array<{
          name: string;
          label: string;
          type: "text" | "number" | "date" | "select" | "multiselect" | "checkbox" | "radio" | "file" | "textarea" | "currency" | "percentage";
          isRequired: boolean;
          placeholder?: string;
          helpText?: string;
          defaultValue?: unknown;
          options?: Array<{
            value: string;
            label: string;
            isDefault?: boolean;
          }>;
          validation?: {
            pattern?: string;
            minLength?: number;
            maxLength?: number;
            min?: number;
            max?: number;
            customRules?: string[];
          };
        }>;
      }>;
      validationRules?: Array<{
        type: "field" | "cross_field" | "business_rule";
        conditions: WorkflowCondition;
        errorMessage: string;
        severity: "error" | "warning";
      }>;
    }
  ): Promise<AgencyFormTemplate> {
    try {
      // Get agency info
      const agencyInfo = await this.prisma.agencyInfo.findFirst({
        where: { tenantId, code: authority }
      });

      if (!agencyInfo) {
        throw new Error(`Agency ${authority} not found`);
      }

      // Create form template
      const template = await this.prisma.agencyFormTemplate.create({
        data: {
          tenantId,
          agencyInfoId: agencyInfo.id,
          authority,
          documentType: templateData.documentType,
          name: templateData.name,
          version: templateData.version,
          description: templateData.description,
          submissionConfig: templateData.submissionConfig,
          isActive: true,
          effectiveDate: templateData.effectiveDate,
          expiryDate: templateData.expiryDate,
        }
      });

      // Create sections and fields
      for (const sectionData of templateData.sections) {
        const section = await this.prisma.formSection.create({
          data: {
            templateId: template.id,
            name: sectionData.name,
            title: sectionData.title,
            description: sectionData.description,
            order: sectionData.order,
            isRequired: sectionData.isRequired,
          }
        });

        for (const fieldData of sectionData.fields) {
          const field = await this.prisma.formField.create({
            data: {
              sectionId: section.id,
              name: fieldData.name,
              label: fieldData.label,
              type: fieldData.type,
              isRequired: fieldData.isRequired,
              placeholder: fieldData.placeholder,
              helpText: fieldData.helpText,
              defaultValue: fieldData.defaultValue,
              validationConfig: fieldData.validation,
            }
          });

          // Create field options if provided
          if (fieldData.options && fieldData.options.length > 0) {
            await this.prisma.formFieldOption.createMany({
              data: fieldData.options.map((option, index) => ({
                fieldId: field.id,
                value: option.value,
                label: option.label,
                isDefault: option.isDefault || false,
                order: index,
              }))
            });
          }
        }
      }

      // Create validation rules
      if (templateData.validationRules && templateData.validationRules.length > 0) {
        await this.prisma.formValidationRule.createMany({
          data: templateData.validationRules.map(rule => ({
            templateId: template.id,
            type: rule.type,
            conditions: rule.conditions,
            errorMessage: rule.errorMessage,
            severity: rule.severity,
            isActive: true,
          }))
        });
      }

      return template as AgencyFormTemplate;

    } catch (error) {
      console.error('Error creating form template:', error);
      throw error;
    }
  }

  /**
   * Get form template with all sections and fields
   */
  async getFormTemplate(
    tenantId: number,
    templateId: number
  ): Promise<AgencyFormTemplate | null> {
    try {
      const template = await this.prisma.agencyFormTemplate.findUnique({
        where: { id: templateId },
        include: {
          sections: {
            include: {
              fields: {
                include: {
                  options: {
                    orderBy: { order: 'asc' }
                  }
                }
              }
            },
            orderBy: { order: 'asc' }
          },
          validationRules: {
            where: { isActive: true }
          }
        }
      });

      return template as AgencyFormTemplate | null;

    } catch (error) {
      console.error('Error getting form template:', error);
      return null;
    }
  }

  /**
   * Get form templates for an authority
   */
  async getFormTemplatesForAuthority(
    tenantId: number,
    authority: Authority,
    documentType?: string
  ): Promise<AgencyFormTemplate[]> {
    try {
      const templates = await this.prisma.agencyFormTemplate.findMany({
        where: {
          tenantId,
          authority,
          ...(documentType && { documentType }),
          isActive: true,
          effectiveDate: { lte: new Date() },
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: new Date() } }
          ]
        },
        include: {
          _count: {
            select: {
              sections: true,
              submissions: true
            }
          }
        },
        orderBy: { effectiveDate: 'desc' }
      });

      return templates as AgencyFormTemplate[];

    } catch (error) {
      console.error('Error getting form templates:', error);
      return [];
    }
  }

  /**
   * Create a new form instance from template
   */
  async createFormInstance(
    tenantId: number,
    templateId: number,
    clientId: number,
    initialData?: Record<string, unknown>
  ): Promise<FormInstance> {
    try {
      const template = await this.getFormTemplate(tenantId, templateId);

      if (!template) {
        throw new Error(`Form template ${templateId} not found`);
      }

      // Initialize form data with default values
      const formData: Record<string, unknown> = { ...initialData };

      for (const section of template.sections) {
        for (const field of section.fields) {
          if (field.defaultValue !== null && field.defaultValue !== undefined) {
            formData[field.name] = field.defaultValue;
          }
        }
      }

      const formInstance: FormInstance = {
        templateId,
        data: formData,
        validationErrors: [],
        currentStep: 0,
        isComplete: false,
        metadata: {
          clientId,
          createdAt: new Date(),
          lastModified: new Date(),
        }
      };

      return formInstance;

    } catch (error) {
      console.error('Error creating form instance:', error);
      throw error;
    }
  }

  /**
   * Validate form data against template rules
   */
  async validateFormData(
    tenantId: number,
    templateId: number,
    formData: Record<string, unknown>,
    validatePartial: boolean = false
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    try {
      const template = await this.getFormTemplate(tenantId, templateId);

      if (!template) {
        throw new Error(`Form template ${templateId} not found`);
      }

      // Validate fields
      for (const section of template.sections) {
        for (const field of section.fields) {
          const fieldErrors = await this.validateField(
            field,
            formData[field.name],
            formData,
            validatePartial
          );
          errors.push(...fieldErrors);
        }
      }

      // Validate custom rules
      for (const rule of template.validationRules) {
        const ruleErrors = await this.validateCustomRule(rule, formData);
        errors.push(...ruleErrors);
      }

      return errors;

    } catch (error) {
      console.error('Error validating form data:', error);
      return [{
        fieldId: 'system',
        message: 'System error during validation',
        severity: 'error'
      }];
    }
  }

  /**
   * Submit form data to agency
   */
  async submitForm(
    tenantId: number,
    templateId: number,
    clientId: number,
    formData: Record<string, unknown>,
    submittedBy: string
  ): Promise<FormSubmissionResult> {
    try {
      // Validate form data
      const validationErrors = await this.validateFormData(tenantId, templateId, formData);

      if (validationErrors.length > 0) {
        return {
          isValid: false,
          errors: validationErrors,
          nextSteps: ['Fix validation errors and resubmit']
        };
      }

      const template = await this.getFormTemplate(tenantId, templateId);

      if (!template) {
        throw new Error(`Form template ${templateId} not found`);
      }

      // Get agency info
      const agencyInfo = await this.prisma.agencyInfo.findUnique({
        where: { id: template.agencyInfoId }
      });

      // Create submission record
      const submission = await this.prisma.agencySubmission.create({
        data: {
          tenantId,
          clientId,
          agencyInfoId: template.agencyInfoId,
          templateId: templateId,
          authority: template.authority,
          documentType: template.documentType,
          submissionData: formData,
          status: 'new',
          fees: {
            total: 0,
            currency: 'GYD'
          },
          submittedBy,
          submittedAt: new Date(),
        }
      });

      // Create submission event
      await this.prisma.submissionEvent.create({
        data: {
          submissionId: submission.id,
          type: 'submitted',
          timestamp: new Date(),
          actor: 'staff',
          actorId: submittedBy,
          description: `Form submitted for ${template.documentType}`,
        }
      });

      const nextSteps = this.generateNextSteps(template.authority, template.documentType);

      return {
        isValid: true,
        errors: [],
        submissionId: submission.id,
        nextSteps
      };

    } catch (error) {
      console.error('Error submitting form:', error);
      return {
        isValid: false,
        errors: [{
          fieldId: 'system',
          message: 'Error submitting form. Please try again.',
          severity: 'error'
        }],
        nextSteps: ['Contact support for assistance']
      };
    }
  }

  /**
   * Generate form schema for frontend consumption
   */
  async generateFormSchema(
    tenantId: number,
    templateId: number
  ): Promise<{
    schema: any;
    uiSchema: any;
    metadata: any;
  }> {
    try {
      const template = await this.getFormTemplate(tenantId, templateId);

      if (!template) {
        throw new Error(`Form template ${templateId} not found`);
      }

      // Generate JSON Schema
      const schema = {
        type: 'object',
        title: template.name,
        description: template.description,
        properties: {} as any,
        required: [] as string[]
      };

      // Generate UI Schema
      const uiSchema = {
        'ui:order': [] as string[]
      } as any;

      // Generate metadata
      const metadata = {
        templateId: template.id,
        authority: template.authority,
        documentType: template.documentType,
        version: template.version,
        sections: [] as any[]
      };

      // Process sections and fields
      for (const section of template.sections) {
        const sectionMetadata = {
          name: section.name,
          title: section.title,
          description: section.description,
          isRequired: section.isRequired,
          fields: [] as string[]
        };

        for (const field of section.fields) {
          // Add to schema properties
          schema.properties[field.name] = this.generateFieldSchema(field);

          // Add to required if field is required
          if (field.isRequired) {
            schema.required.push(field.name);
          }

          // Add to UI schema
          uiSchema[field.name] = this.generateFieldUISchema(field);

          // Add to section metadata
          sectionMetadata.fields.push(field.name);
        }

        metadata.sections.push(sectionMetadata);
      }

      return { schema, uiSchema, metadata };

    } catch (error) {
      console.error('Error generating form schema:', error);
      throw error;
    }
  }

  // ===============================
  // PRIVATE HELPER METHODS
  // ===============================

  private async validateField(
    field: any,
    value: unknown,
    formData: Record<string, unknown>,
    validatePartial: boolean
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Check required fields
    if (field.isRequired && !validatePartial) {
      if (value === null || value === undefined || value === '') {
        errors.push({
          fieldId: field.name,
          message: `${field.label} is required`,
          severity: 'error'
        });
        return errors; // Skip other validations if field is empty
      }
    }

    // Skip validation if field is empty and not required
    if (value === null || value === undefined || value === '') {
      return errors;
    }

    // Validate based on field type
    switch (field.type) {
      case 'number':
      case 'currency':
      case 'percentage':
        if (isNaN(Number(value))) {
          errors.push({
            fieldId: field.name,
            message: `${field.label} must be a valid number`,
            severity: 'error'
          });
        }
        break;

      case 'date':
        if (isNaN(Date.parse(String(value)))) {
          errors.push({
            fieldId: field.name,
            message: `${field.label} must be a valid date`,
            severity: 'error'
          });
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          errors.push({
            fieldId: field.name,
            message: `${field.label} must be a valid email address`,
            severity: 'error'
          });
        }
        break;
    }

    // Apply validation config
    if (field.validationConfig) {
      const config = field.validationConfig;
      const stringValue = String(value);

      if (config.pattern) {
        const regex = new RegExp(config.pattern);
        if (!regex.test(stringValue)) {
          errors.push({
            fieldId: field.name,
            message: `${field.label} format is invalid`,
            severity: 'error'
          });
        }
      }

      if (config.minLength && stringValue.length < config.minLength) {
        errors.push({
          fieldId: field.name,
          message: `${field.label} must be at least ${config.minLength} characters`,
          severity: 'error'
        });
      }

      if (config.maxLength && stringValue.length > config.maxLength) {
        errors.push({
          fieldId: field.name,
          message: `${field.label} must not exceed ${config.maxLength} characters`,
          severity: 'error'
        });
      }

      if (config.min !== undefined && Number(value) < config.min) {
        errors.push({
          fieldId: field.name,
          message: `${field.label} must be at least ${config.min}`,
          severity: 'error'
        });
      }

      if (config.max !== undefined && Number(value) > config.max) {
        errors.push({
          fieldId: field.name,
          message: `${field.label} must not exceed ${config.max}`,
          severity: 'error'
        });
      }
    }

    return errors;
  }

  private async validateCustomRule(
    rule: any,
    formData: Record<string, unknown>
  ): Promise<ValidationError[]> {
    // Implement custom rule validation logic here
    // This would evaluate the conditions against the form data
    return [];
  }

  private generateFieldSchema(field: any): any {
    const baseSchema: any = {
      title: field.label,
      description: field.helpText,
    };

    switch (field.type) {
      case 'text':
      case 'textarea':
        baseSchema.type = 'string';
        if (field.type === 'textarea') {
          baseSchema.format = 'textarea';
        }
        break;

      case 'number':
      case 'currency':
      case 'percentage':
        baseSchema.type = 'number';
        break;

      case 'date':
        baseSchema.type = 'string';
        baseSchema.format = 'date';
        break;

      case 'select':
        baseSchema.type = 'string';
        if (field.options) {
          baseSchema.enum = field.options.map((opt: any) => opt.value);
          baseSchema.enumNames = field.options.map((opt: any) => opt.label);
        }
        break;

      case 'multiselect':
        baseSchema.type = 'array';
        baseSchema.items = {
          type: 'string',
          enum: field.options?.map((opt: any) => opt.value) || []
        };
        break;

      case 'checkbox':
        baseSchema.type = 'boolean';
        break;

      case 'file':
        baseSchema.type = 'string';
        baseSchema.format = 'data-url';
        break;

      default:
        baseSchema.type = 'string';
    }

    // Apply validation config
    if (field.validationConfig) {
      const config = field.validationConfig;
      if (config.minLength) baseSchema.minLength = config.minLength;
      if (config.maxLength) baseSchema.maxLength = config.maxLength;
      if (config.min !== undefined) baseSchema.minimum = config.min;
      if (config.max !== undefined) baseSchema.maximum = config.max;
      if (config.pattern) baseSchema.pattern = config.pattern;
    }

    if (field.defaultValue !== null && field.defaultValue !== undefined) {
      baseSchema.default = field.defaultValue;
    }

    return baseSchema;
  }

  private generateFieldUISchema(field: any): any {
    const uiSchema: any = {};

    if (field.placeholder) {
      uiSchema['ui:placeholder'] = field.placeholder;
    }

    if (field.helpText) {
      uiSchema['ui:help'] = field.helpText;
    }

    switch (field.type) {
      case 'textarea':
        uiSchema['ui:widget'] = 'textarea';
        uiSchema['ui:options'] = { rows: 4 };
        break;

      case 'date':
        uiSchema['ui:widget'] = 'date';
        break;

      case 'file':
        uiSchema['ui:widget'] = 'file';
        break;

      case 'currency':
        uiSchema['ui:widget'] = 'updown';
        uiSchema['ui:options'] = {
          inputType: 'number',
          step: 0.01
        };
        break;

      case 'percentage':
        uiSchema['ui:widget'] = 'range';
        uiSchema['ui:options'] = {
          min: 0,
          max: 100,
          step: 1
        };
        break;
    }

    return uiSchema;
  }

  private generateNextSteps(authority: Authority, documentType: string): string[] {
    const nextStepsMap: Record<Authority, Record<string, string[]>> = {
      GRA: {
        VAT_RETURN: [
          'Review submission for accuracy',
          'Pay any amount due within 21 days',
          'Keep supporting documents for 7 years'
        ],
        INCOME_TAX_RETURN: [
          'Review assessment notice',
          'Pay any additional tax due',
          'File objection if needed within 60 days'
        ]
      },
      NIS: {
        EMPLOYEE_CONTRIBUTION: [
          'Pay contributions by month end',
          'Submit monthly summary',
          'Update employee records'
        ]
      },
      DCRA: {
        COMPANY_REGISTRATION: [
          'Pay registration fees',
          'Await certificate of incorporation',
          'Register for tax purposes with GRA'
        ]
      },
      Immigration: {
        WORK_PERMIT: [
          'Pay application fees',
          'Await processing (15-30 days)',
          'Collect permit when approved'
        ]
      }
    };

    return nextStepsMap[authority]?.[documentType] || [
      'Monitor submission status',
      'Respond to any agency requests',
      'Keep supporting documents'
    ];
  }
}

/**
 * Factory function to create dynamic form service
 */
export function createDynamicFormService(prisma: any): DynamicFormService {
  return new DynamicFormService(prisma);
}