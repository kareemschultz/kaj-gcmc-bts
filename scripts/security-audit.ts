#!/usr/bin/env bun

/**
 * KAJ-GCMC Platform Security Audit Script
 *
 * Comprehensive security assessment and validation for production deployment
 * Checks authentication, authorization, input validation, and compliance measures
 */

import { runSecurityChecklist, SECURITY_CONFIG, validateProductionConfig } from "@GCMC-KAJ/auth/security-middleware";
import prisma from "@GCMC-KAJ/db";

interface SecurityAuditResult {
	timestamp: string;
	environment: string;
	overallScore: number;
	categories: {
		authentication: { score: number; issues: string[] };
		authorization: { score: number; issues: string[] };
		dataProtection: { score: number; issues: string[] };
		infrastructure: { score: number; issues: string[] };
		compliance: { score: number; issues: string[] };
	};
	recommendations: string[];
	criticalIssues: string[];
}

class SecurityAuditor {
	private results: SecurityAuditResult;

	constructor() {
		this.results = {
			timestamp: new Date().toISOString(),
			environment: process.env.NODE_ENV || "development",
			overallScore: 0,
			categories: {
				authentication: { score: 0, issues: [] },
				authorization: { score: 0, issues: [] },
				dataProtection: { score: 0, issues: [] },
				infrastructure: { score: 0, issues: [] },
				compliance: { score: 0, issues: [] },
			},
			recommendations: [],
			criticalIssues: [],
		};
	}

	async runCompleteAudit(): Promise<SecurityAuditResult> {
		console.log("🔒 KAJ-GCMC Platform Security Audit");
		console.log("=" .repeat(50));

		await this.auditAuthentication();
		await this.auditAuthorization();
		await this.auditDataProtection();
		await this.auditInfrastructure();
		await this.auditCompliance();

		this.calculateOverallScore();
		this.generateRecommendations();

		return this.results;
	}

	private async auditAuthentication(): Promise<void> {
		console.log("\n🔐 Auditing Authentication Security...");
		let score = 100;
		const issues: string[] = [];

		// Check password strength requirements
		if (!process.env.MIN_PASSWORD_LENGTH || Number.parseInt(process.env.MIN_PASSWORD_LENGTH, 10) < 12) {
			score -= 15;
			issues.push("Minimum password length should be 12 characters");
		}

		// Check session configuration
		if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
			score -= 20;
			issues.push("NEXTAUTH_SECRET must be at least 32 characters");
			this.results.criticalIssues.push("Weak authentication secret");
		}

		// Check cookie security
		if (process.env.NODE_ENV === "production") {
			if (!process.env.COOKIE_SECURE || process.env.COOKIE_SECURE !== "true") {
				score -= 10;
				issues.push("Secure cookies not enforced in production");
			}
			if (!process.env.COOKIE_DOMAIN) {
				score -= 5;
				issues.push("Cookie domain not configured for production");
			}
		}

		// Check rate limiting
		try {
			const rateLimitConfig = SECURITY_CONFIG.rateLimit;
			if (rateLimitConfig.maxRequests > 1000) {
				score -= 5;
				issues.push("Rate limiting might be too permissive");
			}
		} catch (_error) {
			score -= 10;
			issues.push("Rate limiting configuration not accessible");
		}

		// Check account lockout policy
		if (!process.env.MAX_LOGIN_ATTEMPTS || Number.parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) > 10) {
			score -= 10;
			issues.push("Account lockout policy is too permissive");
		}

		// Check CSRF protection
		if (!process.env.CSRF_SECRET) {
			score -= 15;
			issues.push("CSRF protection not properly configured");
		}

		this.results.categories.authentication = { score: Math.max(0, score), issues };
		console.log(`   Authentication Score: ${this.results.categories.authentication.score}/100`);
	}

	private async auditAuthorization(): Promise<void> {
		console.log("\n🛡️  Auditing Authorization & Access Control...");
		let score = 100;
		const issues: string[] = [];

		try {
			// Check RBAC implementation
			const roles = await prisma.role.findMany({
				include: { permissions: true },
			});

			if (roles.length < 5) {
				score -= 10;
				issues.push("Limited role definitions may indicate incomplete RBAC");
			}

			// Check for roles without permissions
			const rolesWithoutPermissions = roles.filter(role => role.permissions.length === 0);
			if (rolesWithoutPermissions.length > 0) {
				score -= 15;
				issues.push(`${rolesWithoutPermissions.length} roles found without any permissions`);
			}

			// Check for overly permissive roles
			const adminRoles = roles.filter(role =>
				role.permissions.some(p => p.module === "*" && p.action === "*")
			);
			if (adminRoles.length > 2) {
				score -= 10;
				issues.push("Too many roles with administrative privileges");
			}

			// Check tenant isolation
			const tenants = await prisma.tenant.findMany();
			if (tenants.length > 1) {
				// Check for cross-tenant data access vulnerabilities
				const crossTenantUsers = await prisma.user.findMany({
					include: {
						tenantUsers: {
							include: { tenant: true }
						}
					}
				});

				const usersWithMultipleTenants = crossTenantUsers.filter(
					user => user.tenantUsers.length > 1
				);

				if (usersWithMultipleTenants.length > 0) {
					score -= 5;
					issues.push("Users with multiple tenant access detected - verify isolation");
				}
			}

		} catch (_error) {
			score -= 20;
			issues.push("Database connection failed during authorization audit");
			this.results.criticalIssues.push("Cannot verify authorization configuration");
		}

		this.results.categories.authorization = { score: Math.max(0, score), issues };
		console.log(`   Authorization Score: ${this.results.categories.authorization.score}/100`);
	}

	private async auditDataProtection(): Promise<void> {
		console.log("\n🛡️  Auditing Data Protection...");
		let score = 100;
		const issues: string[] = [];

		// Check database SSL
		if (!process.env.DATABASE_SSL || process.env.DATABASE_SSL !== "true") {
			score -= 20;
			issues.push("Database SSL not enforced");
			this.results.criticalIssues.push("Unencrypted database connection");
		}

		// Check file upload security
		if (!process.env.MAX_FILE_SIZE || Number.parseInt(process.env.MAX_FILE_SIZE, 10) > 100 * 1024 * 1024) {
			score -= 10;
			issues.push("File upload size limit too high (>100MB)");
		}

		if (!process.env.ALLOWED_FILE_TYPES) {
			score -= 15;
			issues.push("File type restrictions not configured");
		}

		// Check encryption in transit
		if (process.env.NODE_ENV === "production") {
			if (!process.env.WEB_URL?.startsWith("https://")) {
				score -= 25;
				issues.push("HTTPS not enforced for web application");
				this.results.criticalIssues.push("Unencrypted web traffic in production");
			}

			if (!process.env.API_URL?.startsWith("https://")) {
				score -= 25;
				issues.push("HTTPS not enforced for API endpoints");
				this.results.criticalIssues.push("Unencrypted API traffic in production");
			}
		}

		// Check Redis security
		if (process.env.REDIS_URL && !process.env.REDIS_URL.includes("rediss://") && process.env.NODE_ENV === "production") {
			score -= 10;
			issues.push("Redis connection not using SSL in production");
		}

		// Check backup encryption
		if (!process.env.BACKUP_ENCRYPTION_ENABLED) {
			score -= 10;
			issues.push("Backup encryption not configured");
		}

		this.results.categories.dataProtection = { score: Math.max(0, score), issues };
		console.log(`   Data Protection Score: ${this.results.categories.dataProtection.score}/100`);
	}

	private auditInfrastructure(): void {
		console.log("\n🏗️  Auditing Infrastructure Security...");
		let score = 100;
		const issues: string[] = [];

		// Check environment configuration
		const configValidation = validateProductionConfig();
		if (!configValidation.valid) {
			score -= 30;
			issues.push(...configValidation.errors);
		}

		// Check security checklist
		const securityCheck = runSecurityChecklist();

		if (securityCheck.failed.length > 0) {
			score -= securityCheck.failed.length * 10;
			issues.push(...securityCheck.failed);
		}

		if (securityCheck.warnings.length > 0) {
			score -= securityCheck.warnings.length * 5;
			issues.push(...securityCheck.warnings);
		}

		// Check CORS configuration
		if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN.includes("*")) {
			score -= 15;
			issues.push("CORS not properly configured or too permissive");
		}

		// Check logging configuration
		if (!process.env.LOG_LEVEL || !["error", "warn", "info"].includes(process.env.LOG_LEVEL)) {
			score -= 5;
			issues.push("Logging level not properly configured");
		}

		// Check monitoring
		if (!process.env.ENABLE_METRICS) {
			score -= 10;
			issues.push("Application metrics not enabled");
		}

		this.results.categories.infrastructure = { score: Math.max(0, score), issues };
		console.log(`   Infrastructure Score: ${this.results.categories.infrastructure.score}/100`);
	}

	private auditCompliance(): void {
		console.log("\n📋 Auditing Compliance & Governance...");
		let score = 100;
		const issues: string[] = [];

		// Check audit logging
		if (!process.env.AUDIT_LOG_ENABLED) {
			score -= 20;
			issues.push("Audit logging not enabled");
		}

		// Check data retention policies
		if (!process.env.USER_DATA_RETENTION_DAYS || Number.parseInt(process.env.USER_DATA_RETENTION_DAYS, 10) < 2555) {
			score -= 10;
			issues.push("Data retention policy may not meet 7-year compliance requirement");
		}

		// Check GDPR compliance features
		if (process.env.NODE_ENV === "production") {
			if (!process.env.GDPR_ENABLED) {
				score -= 15;
				issues.push("GDPR compliance features not enabled");
			}

			if (!process.env.DATA_EXPORT_ENABLED) {
				score -= 10;
				issues.push("Data portability (GDPR Article 20) not implemented");
			}

			if (!process.env.RIGHT_TO_BE_FORGOTTEN_ENABLED) {
				score -= 10;
				issues.push("Right to erasure (GDPR Article 17) not implemented");
			}
		}

		// Check backup and disaster recovery
		if (!process.env.BACKUP_ENABLED) {
			score -= 15;
			issues.push("Automated backups not configured");
		}

		if (!process.env.BACKUP_RETENTION_DAYS || Number.parseInt(process.env.BACKUP_RETENTION_DAYS, 10) < 30) {
			score -= 10;
			issues.push("Backup retention period insufficient");
		}

		// Check security headers
		if (!process.env.SECURITY_HEADERS_ENABLED) {
			score -= 10;
			issues.push("Security headers not properly configured");
		}

		this.results.categories.compliance = { score: Math.max(0, score), issues };
		console.log(`   Compliance Score: ${this.results.categories.compliance.score}/100`);
	}

	private calculateOverallScore(): void {
		const categories = this.results.categories;
		const weights = {
			authentication: 0.25,
			authorization: 0.25,
			dataProtection: 0.25,
			infrastructure: 0.15,
			compliance: 0.10,
		};

		this.results.overallScore = Math.round(
			categories.authentication.score * weights.authentication +
			categories.authorization.score * weights.authorization +
			categories.dataProtection.score * weights.dataProtection +
			categories.infrastructure.score * weights.infrastructure +
			categories.compliance.score * weights.compliance
		);
	}

	private generateRecommendations(): void {
		const recommendations: string[] = [];

		if (this.results.overallScore < 70) {
			recommendations.push("URGENT: Overall security score is below acceptable threshold (70%)");
		}

		if (this.results.criticalIssues.length > 0) {
			recommendations.push("Address all critical security issues before production deployment");
		}

		if (this.results.categories.authentication.score < 80) {
			recommendations.push("Strengthen authentication mechanisms and session security");
		}

		if (this.results.categories.authorization.score < 80) {
			recommendations.push("Review and improve role-based access control implementation");
		}

		if (this.results.categories.dataProtection.score < 80) {
			recommendations.push("Implement comprehensive data protection measures");
		}

		recommendations.push("Conduct regular security audits (monthly recommended)");
		recommendations.push("Implement automated security scanning in CI/CD pipeline");
		recommendations.push("Set up real-time security monitoring and alerting");
		recommendations.push("Conduct penetration testing before production deployment");

		this.results.recommendations = recommendations;
	}

	generateReport(): string {
		const report = [
			"# KAJ-GCMC Platform Security Audit Report",
			"",
			`**Audit Date:** ${this.results.timestamp}`,
			`**Environment:** ${this.results.environment}`,
			`**Overall Security Score:** ${this.results.overallScore}/100`,
			"",
			"## Summary",
			"",
		];

		if (this.results.overallScore >= 90) {
			report.push("✅ **Excellent** - Platform meets enterprise security standards");
		} else if (this.results.overallScore >= 80) {
			report.push("⚠️  **Good** - Platform has strong security with minor improvements needed");
		} else if (this.results.overallScore >= 70) {
			report.push("⚠️  **Acceptable** - Platform has adequate security but requires attention");
		} else {
			report.push("❌ **Poor** - Platform requires significant security improvements");
		}

		report.push("", "## Category Scores", "");

		Object.entries(this.results.categories).forEach(([category, data]) => {
			const status = data.score >= 90 ? "✅" : data.score >= 80 ? "⚠️" : "❌";
			report.push(`- **${category.charAt(0).toUpperCase() + category.slice(1)}:** ${data.score}/100 ${status}`);
		});

		if (this.results.criticalIssues.length > 0) {
			report.push("", "## 🚨 Critical Issues", "");
			this.results.criticalIssues.forEach(issue => {
				report.push(`- ${issue}`);
			});
		}

		report.push("", "## 📋 Detailed Findings", "");

		Object.entries(this.results.categories).forEach(([category, data]) => {
			if (data.issues.length > 0) {
				report.push(`", "### ${category.charAt(0).toUpperCase() + category.slice(1)}", "");
				data.issues.forEach(issue => {
					report.push(`- ${issue}`);
				});
			}
		});

		report.push("", "## 💡 Recommendations", "");
		this.results.recommendations.forEach((rec, index) => {
			report.push(`${index + 1}. ${rec}`);
		});

		report.push("", "---", "");
		report.push("*Generated by KAJ-GCMC Security Audit Tool*");

		return report.join("\n");
	}
}

// Run security audit
async function main() {
	try {
		const auditor = new SecurityAuditor();
		const results = await auditor.runCompleteAudit();

		console.log("\n📊 Security Audit Results:");
		console.log("=" .repeat(50));
		console.log(`Overall Score: ${results.overallScore}/100`);

		if (results.criticalIssues.length > 0) {
			console.log("\n🚨 Critical Issues Found:");
			results.criticalIssues.forEach((issue, index) => {
				console.log(`   ${index + 1}. ${issue}`);
			});
		}

		// Generate and save report
		const report = auditor.generateReport();
		await Bun.write("./security-audit-report.md", report);
		console.log("\n📄 Detailed report saved to: security-audit-report.md");

		// Export results as JSON for programmatic use
		await Bun.write(
			"./security-audit-results.json",
			JSON.stringify(results, null, 2)
		);

		// Exit with appropriate code
		const success = results.overallScore >= 70 && results.criticalIssues.length === 0;
		console.log(`\n${success ? "✅ Security audit passed" : "❌ Security audit failed"}`);

		process.exit(success ? 0 : 1);

	} catch (error) 
		console.error("❌ Security audit failed:", error);
		process.exit(1);finally 
		await prisma.$disconnect();
}

main().catch(console.error);