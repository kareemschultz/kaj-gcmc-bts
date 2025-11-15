/**
 * Reports Package - Main Exports
 *
 * PDF report generation for KAJ-GCMC platform
 */

// Export report generator functions
export {
	generateClientFileReport,
	generateComplianceReport,
	generateDocumentsListReport,
	generateFilingsSummaryReport,
	generateServiceHistoryReport,
} from './generator';

// Export PDF templates (for custom usage if needed)
export { ClientFileReport } from './templates/ClientFileReport';
export { ComplianceReport } from './templates/ComplianceReport';
export { DocumentsListReport } from './templates/DocumentsListReport';
export { FilingsSummaryReport } from './templates/FilingsSummaryReport';
export { ServiceHistoryReport } from './templates/ServiceHistoryReport';

// Export common styles and utilities
export { colors, commonStyles, getScoreColor, getStatusStyle } from './styles/common';
