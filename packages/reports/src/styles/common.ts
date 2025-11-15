/**
 * Common PDF Styles
 *
 * Shared styles for all PDF reports using @react-pdf/renderer
 */

import { StyleSheet } from '@react-pdf/renderer';

export const colors = {
	primary: '#2563eb',      // Blue
	secondary: '#64748b',    // Slate
	success: '#10b981',      // Green
	warning: '#f59e0b',      // Amber
	danger: '#ef4444',       // Red
	text: '#1e293b',         // Dark slate
	textLight: '#64748b',    // Light slate
	border: '#e2e8f0',       // Light border
	background: '#f8fafc',   // Light background
	white: '#ffffff',
};

export const commonStyles = StyleSheet.create({
	// Page layout
	page: {
		padding: 40,
		fontSize: 10,
		fontFamily: 'Helvetica',
		color: colors.text,
		backgroundColor: colors.white,
	},

	// Headers
	pageHeader: {
		marginBottom: 20,
		paddingBottom: 15,
		borderBottom: `2pt solid ${colors.border}`,
	},

	reportTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: colors.primary,
		marginBottom: 8,
	},

	companyName: {
		fontSize: 14,
		fontWeight: 'bold',
		color: colors.text,
		marginBottom: 4,
	},

	subtitle: {
		fontSize: 11,
		color: colors.textLight,
		marginBottom: 4,
	},

	// Sections
	section: {
		marginBottom: 20,
	},

	sectionTitle: {
		fontSize: 14,
		fontWeight: 'bold',
		color: colors.text,
		marginBottom: 10,
		paddingBottom: 5,
		borderBottom: `1pt solid ${colors.border}`,
	},

	// Client info
	infoRow: {
		flexDirection: 'row',
		marginBottom: 6,
	},

	infoLabel: {
		width: '30%',
		fontSize: 10,
		fontWeight: 'bold',
		color: colors.text,
	},

	infoValue: {
		width: '70%',
		fontSize: 10,
		color: colors.text,
	},

	// Tables
	table: {
		width: '100%',
		borderWidth: 1,
		borderColor: colors.border,
		borderStyle: 'solid',
		marginBottom: 15,
	},

	tableHeader: {
		flexDirection: 'row',
		backgroundColor: colors.background,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		borderBottomStyle: 'solid',
		fontWeight: 'bold',
		padding: 8,
	},

	tableRow: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		borderBottomStyle: 'solid',
		padding: 8,
		minHeight: 30,
	},

	tableRowLast: {
		flexDirection: 'row',
		padding: 8,
		minHeight: 30,
	},

	tableCell: {
		fontSize: 9,
		padding: 4,
		textAlign: 'left',
	},

	tableCellHeader: {
		fontSize: 9,
		fontWeight: 'bold',
		padding: 4,
		textAlign: 'left',
	},

	// Status badges
	badge: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 4,
		fontSize: 8,
		fontWeight: 'bold',
		textAlign: 'center',
	},

	badgeSuccess: {
		backgroundColor: colors.success,
		color: colors.white,
	},

	badgeWarning: {
		backgroundColor: colors.warning,
		color: colors.white,
	},

	badgeDanger: {
		backgroundColor: colors.danger,
		color: colors.white,
	},

	badgeSecondary: {
		backgroundColor: colors.secondary,
		color: colors.white,
	},

	// Footer
	pageFooter: {
		position: 'absolute',
		bottom: 30,
		left: 40,
		right: 40,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingTop: 10,
		borderTop: `1pt solid ${colors.border}`,
		fontSize: 8,
		color: colors.textLight,
	},

	// Stats/Summary boxes
	statsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 20,
		gap: 10,
	},

	statBox: {
		flex: 1,
		padding: 12,
		backgroundColor: colors.background,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: colors.border,
		borderStyle: 'solid',
	},

	statLabel: {
		fontSize: 9,
		color: colors.textLight,
		marginBottom: 4,
	},

	statValue: {
		fontSize: 18,
		fontWeight: 'bold',
		color: colors.primary,
	},

	// Lists
	list: {
		marginBottom: 10,
	},

	listItem: {
		flexDirection: 'row',
		marginBottom: 6,
	},

	listBullet: {
		width: 15,
		fontSize: 10,
	},

	listContent: {
		flex: 1,
		fontSize: 10,
	},

	// Compliance score
	scoreContainer: {
		alignItems: 'center',
		marginBottom: 20,
		padding: 20,
		backgroundColor: colors.background,
		borderRadius: 4,
	},

	scoreValue: {
		fontSize: 48,
		fontWeight: 'bold',
		marginBottom: 5,
	},

	scoreLabel: {
		fontSize: 12,
		color: colors.textLight,
	},

	// Warnings and highlights
	warningBox: {
		padding: 12,
		backgroundColor: '#fef3c7',
		borderLeftWidth: 3,
		borderLeftColor: colors.warning,
		borderLeftStyle: 'solid',
		marginBottom: 10,
	},

	dangerBox: {
		padding: 12,
		backgroundColor: '#fee2e2',
		borderLeftWidth: 3,
		borderLeftColor: colors.danger,
		borderLeftStyle: 'solid',
		marginBottom: 10,
	},

	successBox: {
		padding: 12,
		backgroundColor: '#d1fae5',
		borderLeftWidth: 3,
		borderLeftColor: colors.success,
		borderLeftStyle: 'solid',
		marginBottom: 10,
	},
});

/**
 * Get status badge style based on status value
 */
export function getStatusStyle(status: string) {
	const statusLower = status.toLowerCase();

	if (statusLower.includes('valid') || statusLower.includes('approved') || statusLower.includes('completed')) {
		return [commonStyles.badge, commonStyles.badgeSuccess];
	}

	if (statusLower.includes('pending') || statusLower.includes('progress')) {
		return [commonStyles.badge, commonStyles.badgeWarning];
	}

	if (statusLower.includes('expired') || statusLower.includes('overdue') || statusLower.includes('rejected')) {
		return [commonStyles.badge, commonStyles.badgeDanger];
	}

	return [commonStyles.badge, commonStyles.badgeSecondary];
}

/**
 * Get compliance score color
 */
export function getScoreColor(score: number): string {
	if (score >= 80) return colors.success;
	if (score >= 60) return colors.warning;
	return colors.danger;
}
