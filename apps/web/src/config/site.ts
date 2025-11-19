/**
 * Site Configuration
 *
 * Centralized configuration for site-wide branding, metadata, and constants
 * Used across the application for consistent branding and SEO
 */

import { brandIdentity } from '@/styles/brand-identity';

export const siteConfig = {
  // Basic Site Information
  name: brandIdentity.company.fullName,
  shortName: brandIdentity.company.shortName,
  description: brandIdentity.platform.longDescription,
  tagline: brandIdentity.company.tagline,
  url: "https://gcmc-kaj.com",

  // Contact Information
  contact: brandIdentity.company.contact,

  // Navigation Structure
  navigation: {
    main: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: "layout-dashboard",
      },
      {
        title: "Clients",
        href: "/clients",
        icon: "users",
      },
      {
        title: "Documents",
        href: "/documents",
        icon: "file-text",
      },
      {
        title: "Tax Filings",
        href: "/filings",
        icon: "clipboard-list",
      },
      {
        title: "Compliance Hub",
        href: "/guyana-compliance",
        icon: "shield-check",
      },
      {
        title: "Reports & Analytics",
        href: "/analytics",
        icon: "bar-chart-3",
      },
    ],

    footer: [
      {
        title: "Platform",
        links: [
          { title: "Features", href: "/features" },
          { title: "Pricing", href: "/pricing" },
          { title: "Security", href: "/security" },
          { title: "Compliance", href: "/compliance" },
        ],
      },
      {
        title: "Services",
        links: [
          { title: "GRA Tax Filing", href: "/services/gra" },
          { title: "DCRA Registration", href: "/services/dcra" },
          { title: "NIS Management", href: "/services/nis" },
          { title: "EPA Compliance", href: "/services/epa" },
        ],
      },
      {
        title: "Support",
        links: [
          { title: "Help Center", href: "/help" },
          { title: "API Documentation", href: "/docs" },
          { title: "Status Page", href: "/status" },
          { title: "Contact Us", href: "/contact" },
        ],
      },
      {
        title: "Legal",
        links: [
          { title: "Privacy Policy", href: "/privacy" },
          { title: "Terms of Service", href: "/terms" },
          { title: "Cookie Policy", href: "/cookies" },
          { title: "Disclaimer", href: "/disclaimer" },
        ],
      },
    ],
  },

  // SEO and Meta Information
  meta: {
    title: {
      default: `${brandIdentity.company.fullName} | Guyana Compliance Platform`,
      template: `%s | ${brandIdentity.company.shortName}`,
    },
    description: brandIdentity.platform.longDescription,
    keywords: [
      "Guyana tax services",
      "business compliance Guyana",
      "GRA tax filing",
      "DCRA business registration",
      "NIS contributions management",
      "EPA environmental compliance",
      "Guyana Revenue Authority",
      "business tax consulting",
      "compliance management platform",
      "Georgetown tax services",
      "Guyana business services",
      "automated tax filing",
      "regulatory compliance software",
      "enterprise tax solutions",
    ],
    authors: [
      {
        name: brandIdentity.company.fullName,
        url: "https://gcmc-kaj.com",
      },
    ],
    creator: brandIdentity.company.fullName,
    robots: "index, follow",
    language: "en-GY",
    region: "GY",
    countryName: "Guyana",
  },

  // OpenGraph Configuration
  openGraph: {
    type: "website",
    title: `${brandIdentity.company.fullName} | Your Trusted Partner in Guyana Business Compliance`,
    description: brandIdentity.messaging.primaryValue,
    siteName: brandIdentity.platform.name,
    locale: "en_GY",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${brandIdentity.company.fullName} - Professional Business Tax Services`,
      },
    ],
  },

  // Twitter/X Configuration
  twitter: {
    card: "summary_large_image",
    title: brandIdentity.company.fullName,
    description: brandIdentity.company.tagline,
    images: ["/twitter-image.jpg"],
    creator: "@gcmckaj",
    site: "@gcmckaj",
  },

  // Feature Flags
  features: {
    analytics: true,
    notifications: true,
    darkMode: false, // Disabled for professional consistency
    multiLanguage: false, // Future enhancement
    beta: false,
  },

  // External Links
  links: {
    github: "https://github.com/gcmc-kaj",
    linkedin: "https://linkedin.com/company/gcmc-kaj",
    twitter: "https://twitter.com/gcmckaj",
    facebook: "https://facebook.com/gcmckaj",

    // Guyana Government Links
    gra: "https://gra.gov.gy",
    dcra: "https://dcra.gy",
    nis: "https://nis.org.gy",
    epa: "https://epa.gov.gy",
    immigration: "https://dpi.gov.gy/immigration",
    goInvest: "https://goinvest.gov.gy",
  },

  // Business Information
  business: {
    address: brandIdentity.company.legal.address,
    registrationNumber: brandIdentity.company.legal.registrationNumber,
    operatingHours: {
      weekdays: "Monday - Friday: 8:00 AM - 5:00 PM (GMT-4)",
      weekends: "Saturday: 9:00 AM - 1:00 PM (GMT-4)",
      holidays: "Closed on public holidays",
    },
    timezone: "America/Guyana",
    currency: "GYD",
    locale: "en-GY",
  },

  // Service Areas
  serviceAreas: {
    primary: ["Georgetown", "New Amsterdam", "Linden"],
    secondary: ["Anna Regina", "Mahdia", "Lethem", "Mabaruma"],
    coverage: "Nationwide service available",
  },

  // Compliance Agencies
  agencies: brandIdentity.expertise.agencies,

  // Professional Services
  services: brandIdentity.services,

  // Legal Disclaimers
  disclaimers: {
    general: "Professional services subject to applicable laws and regulations of Guyana.",
    liability: "GCMC-KAJ Business Tax Services provides professional consulting services. Clients remain responsible for the accuracy of information provided and compliance with all applicable laws.",
    confidentiality: "All client information is treated with strict confidentiality in accordance with professional standards and privacy regulations.",
  },

  // Version Information
  version: brandIdentity.platform.version,
  lastUpdated: new Date().toISOString(),
  copyright: `© ${new Date().getFullYear()} ${brandIdentity.company.fullName}. All rights reserved.`,
};

// Export individual pieces for easy access
export const {
  name,
  shortName,
  description,
  tagline,
  url,
  contact,
  navigation,
  meta,
  openGraph,
  twitter,
  features,
  links,
  business,
  services,
  agencies,
  version,
  copyright,
} = siteConfig;

export default siteConfig;