/**
 * GCMC-KAJ Business Tax Services - Brand Identity System
 *
 * Complete brand guidelines for consistent design and messaging
 * Professional compliance platform for Guyana business tax services
 */

// Company Information
export const brandIdentity = {
	// Official Company Name
	company: {
		fullName: "GCMC-KAJ Business Tax Services",
		shortName: "GCMC-KAJ",
		tagline: "Your Trusted Partner in Guyana Business Compliance",
		description:
			"Professional business tax services and compliance management for Guyana enterprises",

		// Legal Information
		legal: {
			registeredName: "GCMC-KAJ Business Tax Services Ltd.",
			registrationNumber: "GY-BTS-2024-001", // Example
			address: {
				line1: "123 Main Street",
				line2: "Georgetown",
				city: "Georgetown",
				country: "Guyana",
				postalCode: "GY001",
			},
		},

		// Contact Information
		contact: {
			phone: "+592-XXX-XXXX",
			email: "info@gcmc-kaj.com",
			website: "https://gcmc-kaj.com",
			support: "support@gcmc-kaj.com",
		},
	},

	// Platform Branding
	platform: {
		name: "GCMC-KAJ Compliance Hub",
		version: "2.0",
		shortDescription: "Enterprise Compliance Management Platform",
		longDescription:
			"Comprehensive business tax compliance platform designed specifically for Guyana enterprises, featuring automated filing, document management, and regulatory compliance tracking.",
	},

	// Brand Messaging
	messaging: {
		primaryValue: "Simplifying Guyana Business Compliance",
		keyBenefits: [
			"Automated Tax Filing & Compliance",
			"Real-time Regulatory Updates",
			"Secure Document Management",
			"Expert Compliance Guidance",
			"Multi-Agency Integration",
		],

		missionStatement:
			"To empower Guyana businesses with streamlined tax compliance solutions that ensure regulatory adherence while maximizing operational efficiency.",

		visionStatement:
			"To become the leading digital platform for business compliance in the Caribbean region.",

		coreValues: [
			"Integrity & Transparency",
			"Innovation & Excellence",
			"Client-Centric Service",
			"Regulatory Expertise",
			"Secure & Reliable",
		],
	},

	// Target Audience
	audience: {
		primary: [
			"Small to Medium Enterprises (SMEs) in Guyana",
			"Accounting Firms & Tax Professionals",
			"Corporate Compliance Officers",
			"Business Owners & Entrepreneurs",
		],

		industries: [
			"Mining & Natural Resources",
			"Agriculture & Agro-processing",
			"Manufacturing & Distribution",
			"Financial Services",
			"Tourism & Hospitality",
			"Professional Services",
		],
	},

	// Service Offerings
	services: {
		core: [
			"GRA Tax Filing & Compliance",
			"DCRA Business Registration",
			"NIS Contributions Management",
			"EPA Environmental Compliance",
			"Immigration Work Permit Support",
			"GO-Invest Incentive Applications",
		],

		additional: [
			"Compliance Risk Assessment",
			"Document Management & Storage",
			"Regulatory Change Monitoring",
			"Audit Trail & Reporting",
			"Multi-user Collaboration Tools",
		],
	},

	// Compliance Expertise
	expertise: {
		agencies: [
			{
				code: "GRA",
				name: "Guyana Revenue Authority",
				description: "Income Tax, VAT, and Excise Tax compliance",
			},
			{
				code: "DCRA",
				name: "Deeds & Commercial Registry Authority",
				description: "Business registration and corporate filings",
			},
			{
				code: "NIS",
				name: "National Insurance Scheme",
				description: "Employee contributions and social security",
			},
			{
				code: "EPA",
				name: "Environmental Protection Agency",
				description: "Environmental compliance and permits",
			},
			{
				code: "Immigration",
				name: "Department of Immigration",
				description: "Work permits and immigration compliance",
			},
			{
				code: "GO-Invest",
				name: "Guyana Office for Investment",
				description: "Investment incentives and approvals",
			},
		],
	},
};

// Brand Typography
export const brandTypography = {
	families: {
		primary: "Inter", // Main UI font
		display: "Lexend", // Headers and important text
		monospace: "JetBrains Mono", // Code and data
	},

	weights: {
		light: 300,
		regular: 400,
		medium: 500,
		semibold: 600,
		bold: 700,
		extrabold: 800,
	},

	sizes: {
		// Display sizes for marketing/hero content
		hero: "3.75rem", // 60px
		display: "3rem", // 48px
		headline: "2.25rem", // 36px

		// Content sizes
		title: "1.875rem", // 30px
		subtitle: "1.5rem", // 24px
		large: "1.25rem", // 20px
		body: "1rem", // 16px
		small: "0.875rem", // 14px
		caption: "0.75rem", // 12px
	},

	lineHeights: {
		tight: 1.25,
		normal: 1.5,
		relaxed: 1.75,
	},
};

// Logo & Visual Identity
export const visualIdentity = {
	logo: {
		primary: {
			description: "Full horizontal logo with company name",
			usage: "Headers, business cards, official documents",
			minWidth: "200px",
		},

		mark: {
			description: "Icon/symbol only version",
			usage: "Favicons, app icons, small spaces",
			minWidth: "32px",
		},

		stacked: {
			description: "Vertical layout for square spaces",
			usage: "Social media profiles, square formats",
			minWidth: "120px",
		},
	},

	iconography: {
		style: "Line-based with subtle fills",
		strokeWidth: "1.5px",
		cornerRadius: "2px",
		library: "Lucide React",

		primaryIcons: {
			compliance: "shield-check",
			filing: "file-text",
			documents: "folder",
			clients: "users",
			reports: "bar-chart-3",
			settings: "settings",
			security: "lock",
			alerts: "alert-triangle",
		},
	},

	imagery: {
		style: "Professional photography with warm, approachable tones",
		subjects: ["Business professionals", "Modern offices", "Guyana landmarks"],
		treatment: "Clean, bright, minimally processed",
		aspectRatios: ["16:9", "4:3", "1:1"],
	},
};

// Voice & Tone Guidelines
export const voiceAndTone = {
	voice: {
		personality: "Professional yet approachable, knowledgeable, trustworthy",
		characteristics: [
			"Expert but not intimidating",
			"Efficient but caring",
			"Formal but friendly",
			"Clear and concise",
			"Solution-oriented",
		],
	},

	toneByContext: {
		marketing: "Confident and inspiring, highlighting benefits",
		onboarding: "Welcoming and supportive, guiding users",
		help: "Patient and thorough, problem-solving focused",
		alerts: "Clear and urgent when necessary, reassuring when possible",
		success: "Congratulatory and encouraging",
		errors: "Apologetic but solution-focused",
	},

	languageGuidelines: {
		doUse: [
			"Active voice",
			"Plain language explanations",
			"Specific, concrete benefits",
			"Industry-standard terminology",
			"Positive framing",
		],

		avoid: [
			"Jargon without explanation",
			"Overly technical language",
			"Negative or fear-based messaging",
			"Vague promises",
			"Passive voice",
		],
	},
};

// Application Naming Conventions
export const namingConventions = {
	navigation: {
		dashboard: "Dashboard",
		clients: "Clients",
		documents: "Documents",
		filings: "Tax Filings",
		compliance: "Compliance Hub",
		reports: "Reports & Analytics",
		settings: "Settings",
		profile: "My Profile",
		help: "Help & Support",
	},

	actions: {
		create: "Add New",
		edit: "Edit",
		delete: "Remove",
		submit: "Submit Filing",
		upload: "Upload Document",
		download: "Download",
		export: "Export Report",
		save: "Save Changes",
		cancel: "Cancel",
		back: "Go Back",
	},

	statusLabels: {
		active: "Active",
		pending: "Pending Review",
		submitted: "Submitted",
		approved: "Approved",
		rejected: "Needs Attention",
		expired: "Expired",
		overdue: "Overdue",
		complete: "Completed",
		draft: "Draft",
	},

	formLabels: {
		businessName: "Business Name",
		registrationNumber: "Registration Number",
		taxIdentificationNumber: "TIN",
		contactPerson: "Primary Contact",
		emailAddress: "Email Address",
		phoneNumber: "Phone Number",
		businessAddress: "Business Address",
		businessType: "Business Type",
		industry: "Industry Sector",
	},
};

// Marketing Copy Templates
export const marketingCopy = {
	headlines: {
		hero: "Simplify Your Guyana Business Compliance",
		features: "Everything You Need for Tax Compliance Success",
		benefits: "Focus on Growing Your Business, We Handle the Compliance",
	},

	callsToAction: {
		primary: "Get Started Today",
		secondary: "Schedule a Demo",
		tertiary: "Learn More",
		contact: "Contact Our Experts",
		trial: "Start Free Trial",
	},

	valuePropositions: [
		"Streamline tax filing across all major Guyana agencies",
		"Reduce compliance risk with automated deadline tracking",
		"Save time with intelligent document management",
		"Access expert guidance from certified professionals",
		"Ensure audit readiness with comprehensive record keeping",
	],

	testimonials: {
		categories: ["SME Owners", "Accounting Firms", "Compliance Officers"],
		themes: [
			"Time Savings",
			"Risk Reduction",
			"Professional Service",
			"Ease of Use",
		],
	},
};

export default brandIdentity;
