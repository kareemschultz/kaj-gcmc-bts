// Smart Document Upload System - Export Index
// Complete intelligent document upload system with agency-aware categorization for GCMC-KAJ Business Tax Services

export type {
	DocumentTemplate,
	SmartSuggestion,
} from "./agency-document-selector";
export {
	AgencyDocumentSelector,
	ENHANCED_AGENCY_CATEGORIES,
} from "./agency-document-selector";
export type { Annotation, DocumentPreview } from "./document-preview-gallery";
export { default as DocumentPreviewGallery } from "./document-preview-gallery";
export type {
	DocumentFile as ValidatedDocumentFile,
	ValidationReport,
	ValidationRule,
} from "./document-validation";
export {
	DocumentValidation,
	GUYANESE_VALIDATION_RULES,
} from "./document-validation";
export type { CapturedDocument, ScanSettings } from "./mobile-document-scanner";
export { default as MobileDocumentScanner } from "./mobile-document-scanner";
export type {
	DocumentWorkflow,
	SmartDocument,
} from "./smart-document-management";
export { default as SmartDocumentManagement } from "./smart-document-management";
export type {
	AgencyType,
	DocumentFile as SmartDocumentFile,
	DocumentType,
} from "./smart-document-uploader";
// Main Components
export {
	AGENCY_CATEGORIES,
	SmartDocumentUploader,
} from "./smart-document-uploader";

// Utility Functions
export const documentUtils = {
	formatFileSize: (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Number.parseFloat((bytes / k ** i).toFixed(2)) + " " + sizes[i];
	},

	getFileIcon: (fileName: string): string => {
		const extension = fileName.split(".").pop()?.toLowerCase();
		switch (extension) {
			case "pdf":
				return "📄";
			case "doc":
			case "docx":
				return "📝";
			case "xls":
			case "xlsx":
				return "📊";
			case "jpg":
			case "jpeg":
			case "png":
				return "🖼️";
			default:
				return "📎";
		}
	},

	validateFileType: (
		fileName: string,
		acceptedTypes: string[] = [
			".pdf",
			".doc",
			".docx",
			".jpg",
			".jpeg",
			".png",
			".xlsx",
			".xls",
		],
	): boolean => {
		const fileExtension = `.${fileName.split(".").pop()?.toLowerCase()}`;
		return acceptedTypes.includes(fileExtension);
	},

	getAgencyColor: (agencyId: string): string => {
		const agency = ENHANCED_AGENCY_CATEGORIES.find((a) => a.id === agencyId);
		return agency?.color || "#6b7280";
	},

	getComplianceLevel: (
		score: number,
	): { level: string; color: string; description: string } => {
		if (score >= 90) {
			return {
				level: "Excellent",
				color: "#22c55e",
				description: "Fully compliant with all requirements",
			};
		}
		if (score >= 80) {
			return {
				level: "Good",
				color: "#84cc16",
				description: "Mostly compliant with minor issues",
			};
		}
		if (score >= 70) {
			return {
				level: "Fair",
				color: "#f59e0b",
				description: "Some compliance issues need attention",
			};
		}
		if (score >= 60) {
			return {
				level: "Poor",
				color: "#ef4444",
				description: "Multiple compliance issues found",
			};
		}
		return {
			level: "Critical",
			color: "#dc2626",
			description: "Major compliance failures detected",
		};
	},
};

// Constants
export const SUPPORTED_FILE_TYPES = [
	".pdf",
	".doc",
	".docx",
	".jpg",
	".jpeg",
	".png",
	".xlsx",
	".xls",
];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const GUYANESE_AGENCIES = ENHANCED_AGENCY_CATEGORIES.map((agency) => ({
	id: agency.id,
	name: agency.name,
	shortName: agency.shortName,
	color: agency.color,
}));

// Feature Flags
export const FEATURE_FLAGS = {
	ENABLE_OCR: true,
	ENABLE_MOBILE_SCANNER: true,
	ENABLE_AUTO_VALIDATION: true,
	ENABLE_WORKFLOW_AUTOMATION: true,
	ENABLE_AI_SUGGESTIONS: true,
	ENABLE_BATCH_PROCESSING: true,
	ENABLE_REAL_TIME_COLLABORATION: true,
};

// Default Settings
export const DEFAULT_SETTINGS = {
	uploader: {
		maxSize: MAX_FILE_SIZE,
		acceptedTypes: SUPPORTED_FILE_TYPES,
		multiple: true,
		enableOCR: true,
		enableMobileCapture: true,
	},
	scanner: {
		autoCapture: false,
		quality: "good" as const,
		enhanceContrast: true,
		autoRotate: true,
		autoStraighten: true,
		detectBounds: true,
		flashMode: "auto" as const,
		resolution: "high" as const,
		colorMode: "color" as const,
		compressionLevel: 80,
	},
	validation: {
		enableAutoFix: true,
		autoValidation: true,
		enabledRules: GUYANESE_VALIDATION_RULES.map((rule) => rule.id),
	},
	workflow: {
		autoWorkflow: true,
		notificationEnabled: true,
		deadlineReminders: true,
		collaborativeReview: false,
	},
};

// Error Messages
export const ERROR_MESSAGES = {
	FILE_TOO_LARGE: "File size exceeds the maximum limit of 50MB",
	INVALID_FILE_TYPE:
		"File type is not supported. Please use PDF, DOC, DOCX, JPG, PNG, XLS, or XLSX files",
	UPLOAD_FAILED: "Failed to upload file. Please try again",
	VALIDATION_FAILED:
		"Document validation failed. Please check the requirements",
	SCANNER_NOT_SUPPORTED: "Camera scanner is not supported on this device",
	NETWORK_ERROR: "Network error. Please check your connection and try again",
	PERMISSION_DENIED:
		"Camera permission denied. Please enable camera access to use the scanner",
	PROCESSING_TIMEOUT:
		"Document processing timed out. Please try again with a smaller file",
};

// Success Messages
export const SUCCESS_MESSAGES = {
	UPLOAD_COMPLETE: "Document uploaded successfully",
	VALIDATION_PASSED: "All validation checks passed",
	WORKFLOW_STARTED: "Document workflow initiated",
	SCAN_COMPLETE: "Document scanned successfully",
	SUBMISSION_COMPLETE: "Documents submitted for processing",
	AUTO_FIX_APPLIED: "Automatic fixes applied successfully",
};

// Analytics Events
export const ANALYTICS_EVENTS = {
	DOCUMENT_UPLOADED: "document_uploaded",
	DOCUMENT_SCANNED: "document_scanned",
	VALIDATION_COMPLETED: "validation_completed",
	WORKFLOW_STARTED: "workflow_started",
	AGENCY_SELECTED: "agency_selected",
	TEMPLATE_DOWNLOADED: "template_downloaded",
	AUTO_FIX_APPLIED: "auto_fix_applied",
	SUBMISSION_COMPLETED: "submission_completed",
};

export default {
	SmartDocumentUploader,
	AgencyDocumentSelector,
	DocumentPreviewGallery,
	MobileDocumentScanner,
	DocumentValidation,
	SmartDocumentManagement,
	utils: documentUtils,
	constants: {
		SUPPORTED_FILE_TYPES,
		MAX_FILE_SIZE,
		GUYANESE_AGENCIES,
		FEATURE_FLAGS,
		DEFAULT_SETTINGS,
		ERROR_MESSAGES,
		SUCCESS_MESSAGES,
		ANALYTICS_EVENTS,
	},
};
