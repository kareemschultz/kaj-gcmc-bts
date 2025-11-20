/**
 * Dynamic Services Router
 * API for flexible client service management
 * Handles the digital transformation of traditional file-based practice
 */

import { z } from 'zod'
import { router, protectedProcedure } from '../index'
import { DynamicClientServiceManager } from '../services/DynamicClientServiceManager'
import { prisma } from '@gcmc-kaj/db'

// Input validation schemas
const ServicePackageCreateSchema = z.object({
  name: z.string().min(1, 'Package name is required'),
  description: z.string().optional(),

  // Service inclusions
  includesGRA: z.boolean().default(false),
  includesNIS: z.boolean().default(false),
  includesDCRA: z.boolean().default(false),
  includesImmig: z.boolean().default(false),

  // GRA specific services
  graVAT: z.boolean().default(false),
  graPAYE: z.boolean().default(false),
  graIncomeTax: z.boolean().default(false),
  graCorporateTax: z.boolean().default(false),

  // NIS specific services
  nisMonthlyReturns: z.boolean().default(false),
  nisAnnualReturns: z.boolean().default(false),
  nisEmployerReg: z.boolean().default(false),
  nisEmployeeReg: z.boolean().default(false),

  // DCRA specific services
  dcraBusinessReg: z.boolean().default(false),
  dcraCompanyIncorp: z.boolean().default(false),
  dcraAnnualReturns: z.boolean().default(false),
  dcraNameReserv: z.boolean().default(false),

  // Pricing
  monthlyFee: z.number().optional(),
  perFilingFee: z.number().optional(),
  setupFee: z.number().optional()
})

const ClientSubscriptionSchema = z.object({
  clientId: z.string(),
  packageId: z.string(),
  customServices: z.object({
    gra: z.any().optional(),
    nis: z.any().optional(),
    dcra: z.any().optional(),
    immigration: z.any().optional()
  }).optional(),
  customPricing: z.object({
    monthlyFee: z.number().optional(),
    perFilingFee: z.number().optional(),
    discountPercent: z.number().min(0).max(100).optional()
  }).optional()
})

export const dynamicServicesRouter = router({

  /**
   * Set up standard service packages for a new practice
   * Like organizing the main file cabinet categories
   */
  setupStandardPackages: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.tenantId) {
        throw new Error('Tenant ID required')
      }

      const packages = await DynamicClientServiceManager.createStandardServicePackages(ctx.tenantId)

      return {
        success: true,
        packages,
        message: `Created ${packages.length} standard service packages`
      }
    }),

  /**
   * Get all service packages for the practice
   */
  getServicePackages: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.tenantId) return []

      return await prisma.servicePackage.findMany({
        where: {
          tenantId: ctx.tenantId,
          isActive: true
        },
        orderBy: { name: 'asc' }
      })
    }),

  /**
   * Create a custom service package
   */
  createServicePackage: protectedProcedure
    .input(ServicePackageCreateSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new Error('Tenant ID required')
      }

      return await prisma.servicePackage.create({
        data: {
          ...input,
          tenantId: ctx.tenantId,
          createdBy: ctx.user?.id
        }
      })
    }),

  /**
   * Subscribe client to a service package
   * Like creating a new client folder with specific service needs
   */
  subscribeClientToPackage: protectedProcedure
    .input(ClientSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new Error('Tenant ID required')
      }

      // Check if client already has this subscription
      const existing = await prisma.clientServiceSubscription.findUnique({
        where: {
          clientId_packageId: {
            clientId: input.clientId,
            packageId: input.packageId
          }
        }
      })

      if (existing) {
        throw new Error('Client is already subscribed to this package')
      }

      return await DynamicClientServiceManager.subscribeClientToServices(
        ctx.tenantId,
        input.clientId,
        input.packageId,
        input.customServices
      )
    }),

  /**
   * Get client's active service subscriptions
   * Like opening a client's file to see what services they have
   */
  getClientServices: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ input }) => {
      return await DynamicClientServiceManager.getClientActiveServices(input.clientId)
    }),

  /**
   * Get what services are needed for a client soon
   * Like checking what deadlines are coming up in their file
   */
  getClientServiceNeeds: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      daysAhead: z.number().default(30)
    }))
    .query(async ({ input }) => {
      return await DynamicClientServiceManager.getClientServiceNeeds(
        input.clientId,
        input.daysAhead
      )
    }),

  /**
   * Get service package recommendation for a client
   * Like suggesting what file folder type a new client should have
   */
  recommendPackageForClient: protectedProcedure
    .input(z.object({
      clientType: z.enum(['INDIVIDUAL', 'SMALL_BUSINESS', 'CORPORATION']),
      businessType: z.string().optional(),
      employeeCount: z.number().optional(),
      hasExistingBusiness: z.boolean().default(false),
      needsImmigrationServices: z.boolean().default(false)
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) return null

      return await DynamicClientServiceManager.recommendServicePackage(
        ctx.tenantId,
        input.clientType,
        input.businessType,
        input.employeeCount
      )
    }),

  /**
   * Update client subscription (modify services)
   * Like reorganizing what's in a client's file folder
   */
  updateClientSubscription: protectedProcedure
    .input(z.object({
      subscriptionId: z.string(),
      customServices: z.any().optional(),
      customPricing: z.object({
        monthlyFee: z.number().optional(),
        perFilingFee: z.number().optional(),
        discountPercent: z.number().optional()
      }).optional(),
      status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      return await prisma.clientServiceSubscription.update({
        where: { id: input.subscriptionId },
        data: {
          customGRAServices: input.customServices?.gra,
          customNISServices: input.customServices?.nis,
          customDCRAServices: input.customServices?.dcra,
          customImmigServices: input.customServices?.immigration,
          customMonthlyFee: input.customPricing?.monthlyFee,
          customPerFilingFee: input.customPricing?.perFilingFee,
          discountPercent: input.customPricing?.discountPercent,
          status: input.status,
          notes: input.notes,
          updatedAt: new Date()
        },
        include: {
          package: true,
          client: true
        }
      })
    }),

  /**
   * Get dashboard data for service management
   */
  getServicesDashboard: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.tenantId) {
        return {
          totalPackages: 0,
          activeSubscriptions: 0,
          totalRevenue: 0,
          upcomingRenewals: 0
        }
      }

      // Get counts and statistics
      const [totalPackages, activeSubscriptions, upcomingRenewals] = await Promise.all([
        prisma.servicePackage.count({
          where: { tenantId: ctx.tenantId, isActive: true }
        }),
        prisma.clientServiceSubscription.count({
          where: { tenantId: ctx.tenantId, status: 'ACTIVE' }
        }),
        prisma.clientServiceSubscription.count({
          where: {
            tenantId: ctx.tenantId,
            status: 'ACTIVE',
            nextBillingDate: {
              lte: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // Next 7 days
            }
          }
        })
      ])

      // Calculate total monthly revenue
      const subscriptions = await prisma.clientServiceSubscription.findMany({
        where: { tenantId: ctx.tenantId, status: 'ACTIVE' },
        include: { package: true }
      })

      const totalRevenue = subscriptions.reduce((total, sub) => {
        const fee = sub.customMonthlyFee || sub.package.monthlyFee || 0
        return total + Number(fee)
      }, 0)

      return {
        totalPackages,
        activeSubscriptions,
        totalRevenue,
        upcomingRenewals
      }
    }),

  /**
   * Get clients who need service attention
   * Like checking which client files need immediate work
   */
  getClientsNeedingAttention: protectedProcedure
    .input(z.object({
      priority: z.enum(['ALL', 'HIGH', 'MEDIUM', 'LOW']).default('ALL'),
      daysAhead: z.number().default(14)
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.tenantId) return []

      // Get all active clients with subscriptions
      const clients = await prisma.client.findMany({
        where: {
          tenantId: ctx.tenantId,
          isActive: true
        },
        include: {
          serviceSubscriptions: {
            where: { status: 'ACTIVE' },
            include: { package: true }
          }
        }
      })

      const needsAttention = []
      for (const client of clients) {
        const needs = await DynamicClientServiceManager.getClientServiceNeeds(
          client.id,
          input.daysAhead
        )

        if (needs.length > 0) {
          const filteredNeeds = input.priority === 'ALL'
            ? needs
            : needs.filter(n => n.priority === input.priority)

          if (filteredNeeds.length > 0) {
            needsAttention.push({
              client,
              needs: filteredNeeds,
              urgentCount: needs.filter(n => n.priority === 'HIGH').length,
              totalNeeds: needs.length
            })
          }
        }
      }

      return needsAttention.sort((a, b) => b.urgentCount - a.urgentCount)
    })
})

export default dynamicServicesRouter