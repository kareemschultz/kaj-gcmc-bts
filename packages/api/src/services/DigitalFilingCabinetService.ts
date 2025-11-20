/**
 * Digital Filing Cabinet Service
 * Replaces physical file cabinets with intelligent digital document organization
 * Mimics the traditional accounting practice filing system but with smart features
 */

import { prisma } from '@gcmc-kaj/db'
import type { Document, Client, DocumentType } from '@gcmc-kaj/db'

export interface PhysicalFileStructure {
  cabinetName: string // "Client Files", "Tax Returns 2024", "Business Registrations"
  folderName: string  // "John Doe", "Smith Ltd", "GRA Returns"
  subFolder?: string  // "2024 Returns", "Quarterly VAT", "Personal Documents"
  documentType: string // "Passport Copy", "VAT Return", "Business License"
}

export interface DocumentClassification {
  agency: 'GRA' | 'NIS' | 'DCRA' | 'IMMIGRATION' | 'PERSONAL' | 'BUSINESS'
  category: 'IDENTIFICATION' | 'TAX_RETURN' | 'REGISTRATION' | 'PERMIT' | 'FINANCIAL' | 'CORRESPONDENCE'
  importance: 'CRITICAL' | 'IMPORTANT' | 'REFERENCE' | 'ARCHIVE'
  retention: 'PERMANENT' | '7_YEARS' | '5_YEARS' | '3_YEARS' | '1_YEAR'
  accessibility: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUAL' | 'RARE'
}

export interface SmartDocumentMetadata {
  originalFileName: string
  uploadDate: Date
  clientId: string
  physicalLocation?: string // For migration: "Cabinet A, Drawer 2, Folder 'John Doe'"
  digitalPath: string
  classification: DocumentClassification
  relatedServices: string[] // ['GRA_VAT', 'NIS_MONTHLY', 'DCRA_ANNUAL']
  expiryDate?: Date
  reminderDates: Date[]
  tags: string[]
  searchableContent?: string // OCR extracted text
  relatedDocuments: string[] // Document IDs
  workflowStatus?: 'PENDING_REVIEW' | 'APPROVED' | 'FILED' | 'NEEDS_UPDATE'
}

export class DigitalFilingCabinetService {

  /**
   * Create standard filing cabinet structure for new practice
   */
  static async setupStandardFilingStructure(tenantId: string) {
    const standardStructure = [
      // Main client files (like physical client folders)
      {
        name: "Active Client Files",
        description: "Current active clients - like the main client cabinet",
        category: "CLIENT_FILES",
        isDefault: true,
        structure: {
          organizationMethod: "BY_CLIENT",
          subFolders: ["Current Year", "Previous Years", "Personal Documents", "Business Documents"]
        }
      },

      // GRA filing cabinet
      {
        name: "GRA Tax Returns",
        description: "All GRA related filings - VAT, PAYE, Income Tax",
        category: "GRA_FILINGS",
        isDefault: true,
        structure: {
          organizationMethod: "BY_YEAR_AND_TYPE",
          subFolders: ["VAT Returns", "PAYE Returns", "Income Tax Returns", "Corporate Tax"]
        }
      },

      // NIS filing cabinet
      {
        name: "NIS Contributions & Returns",
        description: "All NIS related documents and filings",
        category: "NIS_FILINGS",
        isDefault: true,
        structure: {
          organizationMethod: "BY_CLIENT_AND_DATE",
          subFolders: ["Monthly Returns", "Annual Returns", "Employer Registration", "Employee Records"]
        }
      },

      // DCRA business registration cabinet
      {
        name: "Business Registrations & DCRA",
        description: "Business incorporation, registration, annual returns",
        category: "DCRA_FILINGS",
        isDefault: true,
        structure: {
          organizationMethod: "BY_BUSINESS",
          subFolders: ["Incorporation Documents", "Annual Returns", "Name Reservations", "Amendments"]
        }
      },

      // Correspondence and general
      {
        name: "Correspondence & Communications",
        description: "Letters to/from agencies, client communications",
        category: "CORRESPONDENCE",
        isDefault: true,
        structure: {
          organizationMethod: "BY_DATE",
          subFolders: ["Government Agencies", "Client Communications", "Internal Memos"]
        }
      }
    ]

    const createdStructures = []
    for (const structure of standardStructure) {
      const docType = await prisma.documentType.create({
        data: {
          tenantId,
          name: structure.name,
          description: structure.description,
          category: structure.category,
          isRequired: false,
          allowedFileTypes: JSON.stringify(['pdf', 'jpg', 'png', 'doc', 'docx', 'xls', 'xlsx']),
          maxFileSize: 10 * 1024 * 1024, // 10MB
          metadata: structure.structure
        }
      })
      createdStructures.push(docType)
    }

    return createdStructures
  }

  /**
   * Automatically classify uploaded document based on content and context
   */
  static classifyDocument(
    fileName: string,
    fileContent?: string,
    clientContext?: any,
    uploadContext?: any
  ): DocumentClassification {

    const lowerFileName = fileName.toLowerCase()
    const content = fileContent?.toLowerCase() || ''

    // Determine agency
    let agency: DocumentClassification['agency'] = 'PERSONAL'
    if (lowerFileName.includes('gra') || content.includes('revenue authority') ||
        lowerFileName.includes('vat') || lowerFileName.includes('paye')) {
      agency = 'GRA'
    } else if (lowerFileName.includes('nis') || content.includes('national insurance')) {
      agency = 'NIS'
    } else if (lowerFileName.includes('dcra') || content.includes('commercial registry') ||
               lowerFileName.includes('incorporation') || lowerFileName.includes('business reg')) {
      agency = 'DCRA'
    } else if (lowerFileName.includes('immigration') || lowerFileName.includes('passport') ||
               lowerFileName.includes('visa') || lowerFileName.includes('work permit')) {
      agency = 'IMMIGRATION'
    } else if (clientContext?.businessType) {
      agency = 'BUSINESS'
    }

    // Determine category
    let category: DocumentClassification['category'] = 'REFERENCE'
    if (lowerFileName.includes('return') || lowerFileName.includes('filing')) {
      category = 'TAX_RETURN'
    } else if (lowerFileName.includes('registration') || lowerFileName.includes('license')) {
      category = 'REGISTRATION'
    } else if (lowerFileName.includes('passport') || lowerFileName.includes('id') ||
               lowerFileName.includes('national_id')) {
      category = 'IDENTIFICATION'
    } else if (lowerFileName.includes('permit') || lowerFileName.includes('certificate')) {
      category = 'PERMIT'
    } else if (lowerFileName.includes('bank') || lowerFileName.includes('financial') ||
               lowerFileName.includes('statement')) {
      category = 'FINANCIAL'
    } else if (lowerFileName.includes('letter') || lowerFileName.includes('correspondence')) {
      category = 'CORRESPONDENCE'
    }

    // Determine importance
    let importance: DocumentClassification['importance'] = 'REFERENCE'
    if (category === 'IDENTIFICATION' || category === 'REGISTRATION' ||
        (agency === 'GRA' && category === 'TAX_RETURN')) {
      importance = 'CRITICAL'
    } else if (agency === 'NIS' || category === 'PERMIT') {
      importance = 'IMPORTANT'
    }

    // Determine retention period
    let retention: DocumentClassification['retention'] = '3_YEARS'
    if (importance === 'CRITICAL' || agency === 'GRA') {
      retention = '7_YEARS'
    } else if (category === 'IDENTIFICATION' || category === 'REGISTRATION') {
      retention = 'PERMANENT'
    } else if (agency === 'NIS') {
      retention = '5_YEARS'
    }

    // Determine access frequency
    let accessibility: DocumentClassification['accessibility'] = 'MONTHLY'
    if (agency === 'GRA' && content.includes('monthly')) {
      accessibility = 'MONTHLY'
    } else if (agency === 'GRA' && content.includes('quarterly')) {
      accessibility = 'QUARTERLY' as any // Will add to enum
    } else if (category === 'IDENTIFICATION') {
      accessibility = 'WEEKLY'
    } else if (importance === 'CRITICAL') {
      accessibility = 'DAILY'
    } else {
      accessibility = 'RARE'
    }

    return {
      agency,
      category,
      importance,
      retention,
      accessibility
    }
  }

  /**
   * Create digital folder structure for client (like creating a physical file)
   */
  static async createClientDigitalFolder(tenantId: string, clientId: string) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { businesses: true }
    })

    if (!client) throw new Error('Client not found')

    const folderStructure = {
      clientId,
      mainFolder: `${client.firstName} ${client.lastName}`,
      subFolders: [
        "Personal Documents",
        "Tax Returns",
        "Business Documents",
        "Correspondence",
        "Compliance & Filings",
        "Renewal Reminders"
      ],
      businessFolders: client.businesses.map(b => ({
        businessId: b.id,
        folderName: b.companyName || b.tradingName,
        subFolders: ["Registration Documents", "Annual Returns", "Tax Filings", "Permits & Licenses"]
      }))
    }

    // Store folder structure in client metadata
    await prisma.client.update({
      where: { id: clientId },
      data: {
        metadata: folderStructure
      }
    })

    return folderStructure
  }

  /**
   * Smart document upload with automatic organization
   */
  static async uploadAndOrganizeDocument(
    tenantId: string,
    clientId: string,
    file: {
      name: string
      content: Buffer
      mimeType: string
      size: number
    },
    additionalMetadata?: Partial<SmartDocumentMetadata>
  ) {

    // Extract text content for classification (simulate OCR)
    const extractedText = this.simulateOCR(file.content, file.name)

    // Get client context for better classification
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { businesses: true }
    })

    // Classify the document
    const classification = this.classifyDocument(
      file.name,
      extractedText,
      client
    )

    // Determine digital file path (mimics physical file location)
    const digitalPath = this.generateDigitalPath(client, classification, file.name)

    // Calculate reminder dates based on document type
    const reminderDates = this.calculateReminderDates(classification)

    // Find related services
    const relatedServices = this.identifyRelatedServices(classification, extractedText)

    // Create document metadata
    const documentMetadata: SmartDocumentMetadata = {
      originalFileName: file.name,
      uploadDate: new Date(),
      clientId,
      digitalPath,
      classification,
      relatedServices,
      reminderDates,
      tags: this.generateTags(file.name, extractedText, classification),
      searchableContent: extractedText,
      relatedDocuments: [],
      workflowStatus: 'PENDING_REVIEW',
      ...additionalMetadata
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        tenantId,
        clientId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.mimeType,
        filePath: digitalPath,
        metadata: documentMetadata,
        tags: documentMetadata.tags,
        expiryDate: documentMetadata.expiryDate,
        // Store file content would go to MinIO in real implementation
        notes: `Auto-classified as ${classification.agency} ${classification.category}`
      }
    })

    // Create reminders for expiry dates
    for (const reminderDate of reminderDates) {
      if (reminderDate > new Date()) {
        await this.createDocumentReminder(tenantId, document.id, reminderDate)
      }
    }

    return {
      document,
      classification,
      digitalPath,
      reminderDates,
      relatedServices
    }
  }

  /**
   * Generate digital file path (mimics physical filing location)
   */
  private static generateDigitalPath(client: any, classification: DocumentClassification, fileName: string): string {
    const clientName = `${client.firstName}_${client.lastName}`.replace(/\s+/g, '_')
    const year = new Date().getFullYear()

    let basePath = ''

    switch (classification.agency) {
      case 'GRA':
        basePath = `GRA_Filings/${year}/${clientName}/${classification.category}`
        break
      case 'NIS':
        basePath = `NIS_Filings/${year}/${clientName}/${classification.category}`
        break
      case 'DCRA':
        basePath = `DCRA_Business/${clientName}/${classification.category}`
        break
      case 'IMMIGRATION':
        basePath = `Immigration/${clientName}/${classification.category}`
        break
      default:
        basePath = `Client_Files/${clientName}/${classification.category}`
    }

    return `${basePath}/${fileName}`
  }

  /**
   * Simulate OCR text extraction (would use real OCR in production)
   */
  private static simulateOCR(content: Buffer, fileName: string): string {
    // In real implementation, use OCR service like AWS Textract or Google Vision
    // For now, extract info from filename and simulate common document content

    const lowerName = fileName.toLowerCase()
    let extractedText = `Document: ${fileName}\n`

    if (lowerName.includes('vat')) {
      extractedText += "VAT Return Form\nGuyana Revenue Authority\nTax Identification Number\nQuarterly Return"
    } else if (lowerName.includes('nis')) {
      extractedText += "National Insurance Scheme\nEmployer Contribution\nEmployee Records\nMonthly Return"
    } else if (lowerName.includes('passport')) {
      extractedText += "Republic of Guyana\nPassport\nIdentification Document\nPersonal Information"
    } else if (lowerName.includes('business') || lowerName.includes('registration')) {
      extractedText += "Business Registration\nDeeds and Commercial Registry\nCompany Information\nRegistration Certificate"
    }

    return extractedText
  }

  /**
   * Calculate reminder dates for document expiry and renewals
   */
  private static calculateReminderDates(classification: DocumentClassification): Date[] {
    const reminders: Date[] = []
    const now = new Date()

    if (classification.agency === 'GRA') {
      // GRA quarterly reminders
      reminders.push(new Date(now.getFullYear(), now.getMonth() + 3, 1))
      reminders.push(new Date(now.getFullYear(), now.getMonth() + 6, 1))
    } else if (classification.agency === 'NIS') {
      // NIS monthly reminders
      reminders.push(new Date(now.getFullYear(), now.getMonth() + 1, 15))
    } else if (classification.category === 'PERMIT') {
      // Annual renewal reminders
      reminders.push(new Date(now.getFullYear() + 1, now.getMonth(), now.getDate() - 30))
      reminders.push(new Date(now.getFullYear() + 1, now.getMonth(), now.getDate() - 7))
    }

    return reminders
  }

  /**
   * Identify which services this document relates to
   */
  private static identifyRelatedServices(
    classification: DocumentClassification,
    content: string
  ): string[] {
    const services: string[] = []

    if (classification.agency === 'GRA') {
      if (content.includes('VAT') || content.includes('vat')) {
        services.push('GRA_VAT_QUARTERLY')
      }
      if (content.includes('PAYE') || content.includes('payroll')) {
        services.push('GRA_PAYE_MONTHLY')
      }
      if (content.includes('Income Tax')) {
        services.push('GRA_INCOME_TAX_ANNUAL')
      }
    }

    if (classification.agency === 'NIS') {
      services.push('NIS_MONTHLY_RETURNS')
      if (content.includes('annual')) {
        services.push('NIS_ANNUAL_RETURNS')
      }
    }

    if (classification.agency === 'DCRA') {
      services.push('DCRA_ANNUAL_RETURNS')
      if (content.includes('incorporation')) {
        services.push('DCRA_BUSINESS_REGISTRATION')
      }
    }

    return services
  }

  /**
   * Generate searchable tags for document
   */
  private static generateTags(fileName: string, content: string, classification: DocumentClassification): string[] {
    const tags: string[] = [
      classification.agency.toLowerCase(),
      classification.category.toLowerCase(),
      classification.importance.toLowerCase()
    ]

    // Extract year from filename or content
    const yearMatch = fileName.match(/20\d{2}/) || content.match(/20\d{2}/)
    if (yearMatch) {
      tags.push(yearMatch[0])
    }

    // Add specific service tags
    if (content.includes('VAT')) tags.push('vat')
    if (content.includes('PAYE')) tags.push('paye')
    if (content.includes('NIS')) tags.push('nis')
    if (content.includes('passport')) tags.push('passport')
    if (content.includes('business')) tags.push('business')

    return tags
  }

  /**
   * Create reminder for document expiry or renewal
   */
  private static async createDocumentReminder(
    tenantId: string,
    documentId: string,
    reminderDate: Date
  ) {
    return await prisma.notification.create({
      data: {
        tenantId,
        title: "Document Renewal Reminder",
        message: "A client document requires attention",
        type: "DOCUMENT_REMINDER",
        scheduledFor: reminderDate,
        metadata: { documentId },
        isRead: false
      }
    })
  }

  /**
   * Search documents (like searching through physical files)
   */
  static async searchDocuments(
    tenantId: string,
    query: string,
    filters?: {
      clientId?: string
      agency?: string
      category?: string
      dateFrom?: Date
      dateTo?: Date
    }
  ) {
    const searchConditions: any = {
      tenantId,
      OR: [
        { fileName: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query.toLowerCase()] } }
      ]
    }

    if (filters?.clientId) searchConditions.clientId = filters.clientId
    if (filters?.dateFrom) searchConditions.createdAt = { gte: filters.dateFrom }
    if (filters?.dateTo) {
      searchConditions.createdAt = searchConditions.createdAt || {}
      searchConditions.createdAt.lte = filters.dateTo
    }

    return await prisma.document.findMany({
      where: searchConditions,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}

export default DigitalFilingCabinetService