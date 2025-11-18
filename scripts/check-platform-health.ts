#!/usr/bin/env bun
/**
 * Platform Health Check & Functionality Verification
 * Checks all platform components and generates health report
 */

import { exec } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const execAsync = promisify(exec);

interface HealthCheck {
	name: string;
	status: "HEALTHY" | "DEGRADED" | "DOWN" | "UNKNOWN";
	message: string;
	details?: any;
}

interface PlatformHealth {
	timestamp: string;
	overall: "HEALTHY" | "DEGRADED" | "DOWN";
	checks: HealthCheck[];
	summary: {
		total: number;
		healthy: number;
		degraded: number;
		down: number;
	};
}

class HealthChecker {
	private checks: HealthCheck[] = [];

	async checkNodeModules(): Promise<HealthCheck> {
		try {
			const { stdout } = await execAsync("ls node_modules | wc -l");
			const count = Number.parseInt(stdout.trim(), 10);

			if (count > 1000) {
				return {
					name: "Dependencies",
					status: "HEALTHY",
					message: `${count} packages installed`,
					details: { count },
				};
			}
			return {
				name: "Dependencies",
				status: "DEGRADED",
				message: "Fewer dependencies than expected, run: bun install",
				details: { count },
			};
		} catch (_error: any) {
			return {
				name: "Dependencies",
				status: "DOWN",
				message: "node_modules not found - run: bun install",
			};
		}
	}

	async checkPrismaClient(): Promise<HealthCheck> {
		try {
			const { stdout } = await execAsync(
				'ls node_modules/.prisma/client 2>/dev/null || echo "not found"',
			);

			if (!stdout.includes("not found")) {
				return {
					name: "Prisma Client",
					status: "HEALTHY",
					message: "Prisma client generated",
				};
			}
			return {
				name: "Prisma Client",
				status: "DOWN",
				message: "Prisma client not generated - run: bun db:generate",
			};
		} catch (_error) {
			return {
				name: "Prisma Client",
				status: "UNKNOWN",
				message: "Could not check Prisma client status",
			};
		}
	}

	async checkBuildArtifacts(): Promise<HealthCheck> {
		try {
			const { stdout } = await execAsync(
				'find packages -name "dist" -type d 2>/dev/null | wc -l',
			);
			const count = Number.parseInt(stdout.trim(), 10);

			if (count >= 5) {
				return {
					name: "Build Artifacts",
					status: "HEALTHY",
					message: `${count} packages built`,
					details: { count },
				};
			}
			return {
				name: "Build Artifacts",
				status: "DEGRADED",
				message: `Only ${count} packages built - run: bun build`,
				details: { count },
			};
		} catch (_error) {
			return {
				name: "Build Artifacts",
				status: "UNKNOWN",
				message: "Could not check build status",
			};
		}
	}

	async checkTypeScript(): Promise<HealthCheck> {
		try {
			const { stdout, stderr } = await execAsync("bun run check-types 2>&1", {
				timeout: 60000,
			});

			if (stdout.includes("error") || stderr.includes("error")) {
				const errorCount = (stdout + stderr).split("error").length - 1;
				return {
					name: "TypeScript",
					status: "DEGRADED",
					message: `${errorCount} type errors found`,
					details: { errors: errorCount },
				};
			}
			return {
				name: "TypeScript",
				status: "HEALTHY",
				message: "No type errors",
			};
		} catch (error: any) {
			// Check if error is due to actual type errors or command not found
			if (error.stderr?.includes("error TS")) {
				const errorCount =
					(error.stdout + error.stderr).split("error TS").length - 1;
				return {
					name: "TypeScript",
					status: "DEGRADED",
					message: `${errorCount} type errors found`,
				};
			}

			return {
				name: "TypeScript",
				status: "UNKNOWN",
				message: "Could not run type check",
			};
		}
	}

	async checkDocumentation(): Promise<HealthCheck> {
		try {
			const { stdout } = await execAsync(
				'find . -name "*.md" -not -path "./node_modules/*" | wc -l',
			);
			const count = Number.parseInt(stdout.trim(), 10);

			if (count >= 70) {
				return {
					name: "Documentation",
					status: "HEALTHY",
					message: `${count} documentation files found`,
					details: { count },
				};
			}
			return {
				name: "Documentation",
				status: "DEGRADED",
				message: `Only ${count} documentation files`,
				details: { count },
			};
		} catch (_error) {
			return {
				name: "Documentation",
				status: "UNKNOWN",
				message: "Could not check documentation",
			};
		}
	}

	async checkUIComponents(): Promise<HealthCheck> {
		try {
			const { stdout } = await execAsync(
				'find apps/web/src/components -name "*.tsx" 2>/dev/null | wc -l',
			);
			const count = Number.parseInt(stdout.trim(), 10);

			if (count >= 50) {
				return {
					name: "UI Components",
					status: "HEALTHY",
					message: `${count} React components found`,
					details: { count },
				};
			}
			return {
				name: "UI Components",
				status: "DEGRADED",
				message: `Only ${count} components found`,
				details: { count },
			};
		} catch (_error) {
			return {
				name: "UI Components",
				status: "UNKNOWN",
				message: "Could not check UI components",
			};
		}
	}

	async checkAPIRouters(): Promise<HealthCheck> {
		try {
			const { stdout } = await execAsync(
				'find packages/api/src/routers -name "*.ts" 2>/dev/null | wc -l',
			);
			const count = Number.parseInt(stdout.trim(), 10);

			if (count >= 20) {
				return {
					name: "API Routers",
					status: "HEALTHY",
					message: `${count} tRPC routers found`,
					details: { count },
				};
			}
			return {
				name: "API Routers",
				status: "DEGRADED",
				message: `Only ${count} routers found`,
				details: { count },
			};
		} catch (_error) {
			return {
				name: "API Routers",
				status: "UNKNOWN",
				message: "Could not check API routers",
			};
		}
	}

	async checkTests(): Promise<HealthCheck> {
		try {
			const { stdout } = await execAsync(
				'find . -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null | grep -v node_modules | wc -l',
			);
			const count = Number.parseInt(stdout.trim(), 10);

			if (count >= 10) {
				return {
					name: "Test Files",
					status: "HEALTHY",
					message: `${count} test files found`,
					details: { count },
				};
			}
			return {
				name: "Test Files",
				status: "DEGRADED",
				message: `Only ${count} test files`,
				details: { count },
			};
		} catch (_error) {
			return {
				name: "Test Files",
				status: "UNKNOWN",
				message: "Could not check test files",
			};
		}
	}

	async checkGitStatus(): Promise<HealthCheck> {
		try {
			const { stdout } = await execAsync(
				"git status --porcelain 2>/dev/null | wc -l",
			);
			const changes = Number.parseInt(stdout.trim(), 10);

			if (changes === 0) {
				return {
					name: "Git Status",
					status: "HEALTHY",
					message: "Working tree clean",
					details: { uncommittedChanges: 0 },
				};
			}
			return {
				name: "Git Status",
				status: "DEGRADED",
				message: `${changes} uncommitted changes`,
				details: { uncommittedChanges: changes },
			};
		} catch (_error) {
			return {
				name: "Git Status",
				status: "UNKNOWN",
				message: "Could not check git status",
			};
		}
	}

	async runAllChecks(): Promise<PlatformHealth> {
		console.log("🏥 Running platform health checks...\n");

		const checks = await Promise.all([
			this.checkNodeModules(),
			this.checkPrismaClient(),
			this.checkBuildArtifacts(),
			this.checkTypeScript(),
			this.checkDocumentation(),
			this.checkUIComponents(),
			this.checkAPIRouters(),
			this.checkTests(),
			this.checkGitStatus(),
		]);

		this.checks = checks;

		// Calculate summary
		const healthy = checks.filter((c) => c.status === "HEALTHY").length;
		const degraded = checks.filter((c) => c.status === "DEGRADED").length;
		const down = checks.filter((c) => c.status === "DOWN").length;

		// Determine overall status
		let overall: "HEALTHY" | "DEGRADED" | "DOWN";
		if (down > 0) {
			overall = "DOWN";
		} else if (degraded > 0) {
			overall = "DEGRADED";
		} else {
			overall = "HEALTHY";
		}

		const report: PlatformHealth = {
			timestamp: new Date().toISOString(),
			overall,
			checks,
			summary: {
				total: checks.length,
				healthy,
				degraded,
				down,
			},
		};

		return report;
	}

	printReport(report: PlatformHealth) {
		console.log(
			"╔════════════════════════════════════════════════════════════╗",
		);
		console.log(
			"║           PLATFORM HEALTH REPORT                           ║",
		);
		console.log(
			"╚════════════════════════════════════════════════════════════╝\n",
		);

		// Print overall status
		const statusIcon =
			report.overall === "HEALTHY"
				? "✅"
				: report.overall === "DEGRADED"
					? "⚠️"
					: "❌";
		console.log(`Overall Status: ${statusIcon} ${report.overall}\n`);

		// Print individual checks
		console.log("Component Health:");
		for (const check of report.checks) {
			const icon =
				check.status === "HEALTHY"
					? "✅"
					: check.status === "DEGRADED"
						? "⚠️"
						: check.status === "DOWN"
							? "❌"
							: "❓";

			console.log(`  ${icon} ${check.name.padEnd(20)} ${check.message}`);
		}

		console.log(`\n${"─".repeat(64)}`);
		console.log(
			`Summary: ${report.summary.healthy}/${report.summary.total} checks passed`,
		);
		console.log(`Timestamp: ${report.timestamp}\n`);

		// Print recommendations
		const failedChecks = report.checks.filter(
			(c) => c.status === "DOWN" || c.status === "DEGRADED",
		);
		if (failedChecks.length > 0) {
			console.log("Recommendations:");
			for (const check of failedChecks) {
				if (check.message.includes("run:")) {
					console.log(`  • ${check.message}`);
				}
			}
			console.log();
		}
	}
}

async function main() {
	const checker = new HealthChecker();

	try {
		const report = await checker.runAllChecks();
		checker.printReport(report);

		// Save report
		const reportPath = "./test-results/platform-health.json";
		await writeFile(reportPath, JSON.stringify(report, null, 2));
		console.log(`📄 Report saved to: ${reportPath}\n`);

		// Exit with appropriate code
		process.exit(report.overall === "DOWN" ? 1 : 0);
	} catch (error: any) {
		console.error("❌ Health check failed:", error.message);
		process.exit(1);
	}
}

if (import.meta.main) {
	main();
}

export { HealthChecker, type PlatformHealth };
