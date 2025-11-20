/**
 * Dynamic Client Service Manager
 * Handles flexible service packages and client-specific compliance needs
 * Replaces physical filing system with intelligent digital organization
 */

import { prisma } from '@gcmc-kaj/db'
import type {
  ServicePackage,
  ClientServiceSubscription,
  SubscriptionStatus,
  Client,
  ClientTypeTemplate
} from '@gcmc-kaj/db'

export interface ClientServiceNeed {
  clientId: string
  serviceType: 'GRA' | 'NIS' | 'DCRA' | 'IMMIGRATION'
  specificServices: string[]
  frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'AS_NEEDED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  dueDate?: Date
  notes?: string
}

export interface ServicePackageTemplate {
  name: string
  description: string
  targetClientType: 'INDIVIDUAL' | 'SMALL_BUSINESS' | 'CORPORATION' | 'NON_PROFIT'
  services: {
    gra?: {
      vat?: boolean
      paye?: boolean
      incomeTax?: boolean
      corporateTax?: boolean
    }
    nis?: {
      monthlyReturns?: boolean
      annualReturns?: boolean
      employerReg?: boolean
      employeeReg?: boolean
    }
    dcra?: {
      businessReg?: boolean
      companyIncorp?: boolean
      annualReturns?: boolean
      nameReservation?: boolean
    }
    immigration?: {
      workPermits?: boolean
      visaApplications?: boolean
      renewals?: boolean
    }
  }
  pricing: {
    monthlyFee?: number
    perFilingFee?: number
    setupFee?: number
  }
}

export class DynamicClientServiceManager {
  /**
   * Create service packages that match traditional client file organization
   */
  static async createStandardServicePackages(tenantId: string) {
    const standardPackages: ServicePackageTemplate[] = [
      {
        name: "Individual Tax Only",
        description: "Basic individual income tax filing - like the 'Personal Tax' folder",
        targetClientType: 'INDIVIDUAL',
        services: {
          gra: { incomeTax: true, vat: false, paye: false, corporateTax: false },
          nis: { monthlyReturns: false, annualReturns: true, employerReg: false, employeeReg: false }
        },
        pricing: { perFilingFee: 15000, setupFee: 5000 } // GYD
      },
      {
        name: "Small Business Starter",
        description: "Basic business registration + GRA setup - like the 'New Business' folder",
        targetClientType: 'SMALL_BUSINESS',
        services: {
          gra: { vat: true, incomeTax: true, paye: false, corporateTax: false },
          nis: { employerReg: true, monthlyReturns: true, annualReturns: true, employeeReg: false },
          dcra: { businessReg: true, annualReturns: true, nameReservation: false, companyIncorp: false }
        },
        pricing: { monthlyFee: 25000, setupFee: 50000 }
      },
      {
        name: "Full Business Compliance",
        description: "Complete business services - like the 'Corporate Clients' cabinet",
        targetClientType: 'CORPORATION',
        services: {
          gra: { vat: true, paye: true, incomeTax: true, corporateTax: true },
          nis: { employerReg: true, monthlyReturns: true, annualReturns: true, employeeReg: true },
          dcra: { businessReg: true, companyIncorp: true, annualReturns: true, nameReservation: true },
          immigration: { workPermits: true, visaApplications: false, renewals: true }
        },
        pricing: { monthlyFee: 75000, perFilingFee: 10000, setupFee: 100000 }
      },
      {
        name: "GRA Only Service",
        description: "Just GRA tax filings - like the 'Tax Returns Only' folder",
        targetClientType: 'INDIVIDUAL',
        services: {
          gra: { vat: true, paye: false, incomeTax: true, corporateTax: false },
          nis: { monthlyReturns: false, annualReturns: false, employerReg: false, employeeReg: false }
        },
        pricing: { perFilingFee: 12000, setupFee: 3000 }
      },
      {
        name: "NIS Compliance Only",
        description: "Just NIS filings and contributions - like the 'NIS Only' folder",
        targetClientType: 'SMALL_BUSINESS',
        services: {
          gra: { vat: false, paye: false, incomeTax: false, corporateTax: false },
          nis: { employerReg: true, monthlyReturns: true, annualReturns: true, employeeReg: true }
        },
        pricing: { monthlyFee: 15000, setupFee: 20000 }
      }
    ]

    const createdPackages = []
    for (const template of standardPackages) {
      const pkg = await prisma.servicePackage.create({
        data: {
          tenantId,
          name: template.name,
          description: template.description,

          // Map service inclusions
          includesGRA: !!template.services.gra,
          includesNIS: !!template.services.nis,
          includesDCRA: !!template.services.dcra,
          includesImmig: !!template.services.immigration,

          // GRA services
          graVAT: template.services.gra?.vat || false,
          graPAYE: template.services.gra?.paye || false,
          graIncomeTax: template.services.gra?.incomeTax || false,
          graCorporateTax: template.services.gra?.corporateTax || false,

          // NIS services
          nisMonthlyReturns: template.services.nis?.monthlyReturns || false,
          nisAnnualReturns: template.services.nis?.annualReturns || false,
          nisEmployerReg: template.services.nis?.employerReg || false,
          nisEmployeeReg: template.services.nis?.employeeReg || false,

          // DCRA services
          dcraBusinessReg: template.services.dcra?.businessReg || false,
          dcraCompanyIncorp: template.services.dcra?.companyIncorp || false,
          dcraAnnualReturns: template.services.dcra?.annualReturns || false,
          dcraNameReserv: template.services.dcra?.nameReservation || false,

          // Pricing
          monthlyFee: template.pricing.monthlyFee,
          perFilingFee: template.pricing.perFilingFee,
          setupFee: template.pricing.setupFee
        }
      })
      createdPackages.push(pkg)
    }

    return createdPackages
  }

  /**
   * Assign service package to client based on their needs
   */
  static async subscribeClientToServices(
    tenantId: string,
    clientId: string,
    packageId: string,
    customServices?: any
  ) {
    return await prisma.clientServiceSubscription.create({
      data: {
        tenantId,
        clientId,
        packageId,
        customGRAServices: customServices?.gra,
        customNISServices: customServices?.nis,
        customDCRAServices: customServices?.dcra,
        customImmigServices: customServices?.immigration,
        status: 'ACTIVE',
        startDate: new Date(),
        nextBillingDate: this.calculateNextBillingDate()
      },
      include: {
        package: true,
        client: true
      }
    })
  }

  /**
   * Get client's active services - like opening their physical file
   */
  static async getClientActiveServices(clientId: string) {
    const subscriptions = await prisma.clientServiceSubscription.findMany({
      where: {
        clientId,
        status: 'ACTIVE'
      },
      include: {
        package: true,
        client: true
      }
    })

    // Transform into easily usable format
    return subscriptions.map(sub => ({
      subscriptionId: sub.id,
      packageName: sub.package.name,
      services: {
        gra: {
          included: sub.package.includesGRA,
          vat: sub.package.graVAT,
          paye: sub.package.graPAYE,
          incomeTax: sub.package.graIncomeTax,
          corporateTax: sub.package.graCorporateTax,
          custom: sub.customGRAServices
        },
        nis: {
          included: sub.package.includesNIS,
          monthlyReturns: sub.package.nisMonthlyReturns,
          annualReturns: sub.package.nisAnnualReturns,
          employerReg: sub.package.nisEmployerReg,
          employeeReg: sub.package.nisEmployeeReg,
          custom: sub.customNISServices
        },
        dcra: {
          included: sub.package.includesDCRA,
          businessReg: sub.package.dcraBusinessReg,
          companyIncorp: sub.package.dcraCompanyIncorp,
          annualReturns: sub.package.dcraAnnualReturns,
          nameReservation: sub.package.dcraNameReserv,
          custom: sub.customDCRAServices
        },
        immigration: {
          included: sub.package.includesImmig,
          custom: sub.customImmigServices
        }
      },
      billing: {
        monthlyFee: sub.customMonthlyFee || sub.package.monthlyFee,
        perFilingFee: sub.customPerFilingFee || sub.package.perFilingFee,
        nextBillingDate: sub.nextBillingDate
      },
      subscription: sub
    }))
  }

  /**
   * Get what services are needed for a client based on upcoming deadlines
   */
  static async getClientServiceNeeds(clientId: string, daysAhead: number = 30) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        filings: {
          where: {
            dueDate: {
              gte: new Date(),
              lte: new Date(Date.now() + (daysAhead * 24 * 60 * 60 * 1000))
            },
            status: {
              in: ['DRAFT', 'PREPARED', 'SUBMITTED']
            }
          }
        },
        documents: {
          where: {
            expiryDate: {
              gte: new Date(),
              lte: new Date(Date.now() + (daysAhead * 24 * 60 * 60 * 1000))
            }
          }
        }
      }
    })

    if (!client) return []

    const needs: ClientServiceNeed[] = []

    // Check for upcoming GRA filings
    const graFilings = client.filings.filter(f =>
      f.filingTypeId.includes('GRA') || f.authority === 'GRA'
    )
    if (graFilings.length > 0) {
      needs.push({
        clientId,
        serviceType: 'GRA',
        specificServices: graFilings.map(f => f.filingTypeId),
        frequency: 'QUARTERLY',
        priority: 'HIGH',
        dueDate: graFilings[0].dueDate,
        notes: `${graFilings.length} GRA filing(s) due`
      })
    }

    // Check for NIS requirements
    const nisFilings = client.filings.filter(f =>
      f.filingTypeId.includes('NIS') || f.authority === 'NIS'
    )
    if (nisFilings.length > 0) {
      needs.push({
        clientId,
        serviceType: 'NIS',
        specificServices: nisFilings.map(f => f.filingTypeId),
        frequency: 'MONTHLY',
        priority: 'MEDIUM',
        dueDate: nisFilings[0].dueDate,
        notes: `${nisFilings.length} NIS filing(s) due`
      })
    }

    // Check for expiring documents
    const expiringDocs = client.documents
    if (expiringDocs.length > 0) {
      needs.push({
        clientId,
        serviceType: 'DCRA',
        specificServices: ['document_renewal'],
        frequency: 'AS_NEEDED',
        priority: 'LOW',
        dueDate: expiringDocs[0].expiryDate,
        notes: `${expiringDocs.length} document(s) expiring`
      })
    }

    return needs
  }

  /**
   * Calculate next billing date based on service frequency
   */
  private static calculateNextBillingDate(): Date {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return nextMonth
  }

  /**
   * Recommend service package based on client profile
   */
  static async recommendServicePackage(
    tenantId: string,
    clientType: 'INDIVIDUAL' | 'SMALL_BUSINESS' | 'CORPORATION',
    businessType?: string,
    employeeCount?: number
  ) {
    const packages = await prisma.servicePackage.findMany({
      where: { tenantId, isActive: true }
    })

    // Simple recommendation logic (can be enhanced with ML later)
    if (clientType === 'INDIVIDUAL') {
      return packages.find(p => p.name.includes('Individual'))
    }

    if (clientType === 'SMALL_BUSINESS') {
      if (employeeCount && employeeCount > 5) {
        return packages.find(p => p.name.includes('Full Business'))
      }
      return packages.find(p => p.name.includes('Small Business'))
    }

    if (clientType === 'CORPORATION') {
      return packages.find(p => p.name.includes('Full Business') || p.name.includes('Corporate'))
    }

    return packages[0] // Default to first package
  }
}

export default DynamicClientServiceManager