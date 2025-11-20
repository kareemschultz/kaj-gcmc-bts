export const brandColors = {
	// Primary - Professional Blue
	primary: {
		50: "#eff6ff",
		100: "#dbeafe",
		200: "#bfdbfe",
		300: "#93c5fd",
		400: "#60a5fa",
		500: "#3b82f6", // Main
		600: "#2563eb",
		700: "#1d4ed8",
		800: "#1e40af",
		900: "#1e3a8a",
	},
	// Accent - Compliance Green
	accent: {
		50: "#f0fdf4",
		100: "#dcfce7",
		200: "#bbf7d0",
		300: "#86efac",
		400: "#4ade80",
		500: "#22c55e", // Main
		600: "#16a34a",
		700: "#15803d",
		800: "#166534",
		900: "#14532d",
	},
	// Warning - Expiry Orange
	warning: {
		50: "#fffbeb",
		100: "#fef3c7",
		200: "#fde68a",
		300: "#fcd34d",
		400: "#fbbf24",
		500: "#f59e0b", // Main
		600: "#d97706",
		700: "#b45309",
		800: "#92400e",
		900: "#78350f",
	},
	// Danger - Overdue Red
	danger: {
		50: "#fef2f2",
		100: "#fee2e2",
		200: "#fecaca",
		300: "#fca5a5",
		400: "#f87171",
		500: "#ef4444", // Main
		600: "#dc2626",
		700: "#b91c1c",
		800: "#991b1b",
		900: "#7f1d1d",
	},
	// Neutral - Professional Gray
	gray: {
		50: "#f9fafb",
		100: "#f3f4f6",
		200: "#e5e7eb",
		300: "#d1d5db",
		400: "#9ca3af",
		500: "#6b7280",
		600: "#4b5563",
		700: "#374151",
		800: "#1f2937",
		900: "#111827",
	},
};

export const complianceColors = {
	excellent: "#22c55e", // 90-100% - Green
	good: "#84cc16", // 70-89% - Light Green
	fair: "#f59e0b", // 50-69% - Orange
	poor: "#ef4444", // 0-49% - Red
	critical: "#dc2626", // Critical issues - Dark Red
};

export const gcmcKajBrand = {
	// Professional emerald-based palette for GCMC-KAJ
	emerald: {
		50: "#ecfdf5",
		100: "#d1fae5",
		200: "#a7f3d0",
		300: "#6ee7b7",
		400: "#34d399",
		500: "#10b981", // Main GCMC-KAJ green
		600: "#059669",
		700: "#047857",
		800: "#065f46",
		900: "#064e3b",
	},
	// Supporting colors for the brand
	slate: {
		50: "#f8fafc",
		100: "#f1f5f9",
		200: "#e2e8f0",
		300: "#cbd5e1",
		400: "#94a3b8",
		500: "#64748b",
		600: "#475569",
		700: "#334155",
		800: "#1e293b",
		900: "#0f172a",
	},
};

// Business context colors for compliance dashboard
export const businessColors = {
	revenue: {
		positive: "#22c55e",
		negative: "#ef4444",
		neutral: "#6b7280",
	},
	compliance: {
		excellent: "#22c55e",
		good: "#84cc16",
		warning: "#f59e0b",
		critical: "#ef4444",
	},
	filing: {
		submitted: "#22c55e",
		pending: "#f59e0b",
		overdue: "#ef4444",
		draft: "#6b7280",
	},
	document: {
		active: "#22c55e",
		expiring: "#f59e0b",
		expired: "#ef4444",
		archived: "#6b7280",
	},
};

// Typography scale for consistent text hierarchy
export const typography = {
	scale: {
		xs: "0.75rem", // 12px
		sm: "0.875rem", // 14px
		base: "1rem", // 16px
		lg: "1.125rem", // 18px
		xl: "1.25rem", // 20px
		"2xl": "1.5rem", // 24px
		"3xl": "1.875rem", // 30px
		"4xl": "2.25rem", // 36px
		"5xl": "3rem", // 48px
		"6xl": "3.75rem", // 60px
	},
	weight: {
		light: "300",
		normal: "400",
		medium: "500",
		semibold: "600",
		bold: "700",
		extrabold: "800",
	},
	family: {
		sans: ["Inter", "system-ui", "sans-serif"],
		display: ["Lexend", "sans-serif"],
		mono: ["JetBrains Mono", "Consolas", "monospace"],
	},
};

// Component styling utilities
export const componentStyles = {
	shadow: {
		sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
		base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
		md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
		lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
		xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
	},
	borderRadius: {
		sm: "0.125rem", // 2px
		base: "0.25rem", // 4px
		md: "0.375rem", // 6px
		lg: "0.5rem", // 8px
		xl: "0.75rem", // 12px
		"2xl": "1rem", // 16px
		full: "9999px",
	},
	spacing: {
		xs: "0.25rem", // 4px
		sm: "0.5rem", // 8px
		base: "1rem", // 16px
		lg: "1.5rem", // 24px
		xl: "2rem", // 32px
		"2xl": "3rem", // 48px
		"3xl": "4rem", // 64px
	},
};

// Dashboard specific color mappings
export const dashboardColors = {
	cards: {
		background: "white",
		border: "#e5e7eb",
		hover: "#f9fafb",
		shadow: componentStyles.shadow.base,
	},
	chart: {
		primary: brandColors.primary[500],
		secondary: brandColors.accent[500],
		tertiary: brandColors.warning[500],
		quaternary: brandColors.danger[500],
		grid: "#f3f4f6",
		axis: "#6b7280",
	},
	status: {
		online: "#22c55e",
		offline: "#ef4444",
		pending: "#f59e0b",
		processing: "#3b82f6",
	},
};

// Chart color schemes for analytics components
export const chartColorSchemes = {
	primary: [
		brandColors.primary[500],
		brandColors.accent[500],
		brandColors.warning[500],
		brandColors.danger[500],
		gcmcKajBrand.emerald[500],
		brandColors.gray[500],
	],
	compliance: [
		complianceColors.excellent,
		complianceColors.good,
		complianceColors.fair,
		complianceColors.poor,
		complianceColors.critical,
	],
	business: [
		businessColors.revenue.positive,
		businessColors.compliance.excellent,
		businessColors.filing.submitted,
		businessColors.document.active,
		businessColors.revenue.negative,
		businessColors.compliance.critical,
	],
	dashboard: [
		dashboardColors.chart.primary,
		dashboardColors.chart.secondary,
		dashboardColors.chart.tertiary,
		dashboardColors.chart.quaternary,
	],
};
