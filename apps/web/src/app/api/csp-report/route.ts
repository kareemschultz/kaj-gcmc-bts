import { NextRequest, NextResponse } from "next/server";

/**
 * CSP Violation Reporting Endpoint
 *
 * This endpoint receives CSP violation reports from browsers and logs them
 * for security monitoring and policy refinement.
 *
 * Security Features:
 * - Rate limiting to prevent abuse
 * - Structured logging for security analysis
 * - Environment-specific handling
 * - OWASP compliance
 */

interface CSPViolationReport {
	'csp-report': {
		'blocked-uri': string;
		'document-uri': string;
		'effective-directive': string;
		'original-policy': string;
		'referrer': string;
		'script-sample': string;
		'status-code': number;
		'violated-directive': string;
	};
}

// Simple in-memory rate limiting (in production, use Redis or similar)
const reportCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // reports per minute per IP
const RATE_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
	const now = Date.now();
	const record = reportCounts.get(ip);

	if (!record || now > record.resetTime) {
		reportCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
		return false;
	}

	if (record.count >= RATE_LIMIT) {
		return true;
	}

	record.count++;
	return false;
}

export async function POST(request: NextRequest) {
	try {
		// Get client IP for rate limiting
		const ip = request.ip ??
			request.headers.get('x-forwarded-for')?.split(',')[0] ??
			request.headers.get('x-real-ip') ??
			'unknown';

		// Apply rate limiting
		if (isRateLimited(ip)) {
			console.warn(`CSP Report: Rate limit exceeded for IP ${ip}`);
			return NextResponse.json(
				{ error: 'Rate limit exceeded' },
				{ status: 429 }
			);
		}

		// Parse the violation report
		const report: CSPViolationReport = await request.json();
		const violation = report['csp-report'];

		if (!violation) {
			return NextResponse.json(
				{ error: 'Invalid report format' },
				{ status: 400 }
			);
		}

		// Log the violation with structured data
		const logData = {
			timestamp: new Date().toISOString(),
			ip,
			violation: {
				blockedUri: violation['blocked-uri'],
				documentUri: violation['document-uri'],
				effectiveDirective: violation['effective-directive'],
				violatedDirective: violation['violated-directive'],
				scriptSample: violation['script-sample'],
				statusCode: violation['status-code'],
			},
			userAgent: request.headers.get('user-agent'),
			referer: request.headers.get('referer'),
		};

		// In production, send to monitoring service
		if (process.env.NODE_ENV === 'production') {
			console.error('CSP Violation:', JSON.stringify(logData, null, 2));

			// TODO: Implement alerting for high-severity violations
			// - External script injections
			// - Inline script violations in production
			// - Suspicious blocked URIs
		} else {
			console.warn('CSP Violation (dev):', logData.violation);
		}

		// Check for high-severity violations that might indicate attacks
		const highSeverityPatterns = [
			/data:.*javascript/i,
			/javascript:/i,
			/eval/i,
			/Function/i,
			/onload/i,
			/onerror/i,
		];

		const isSuspicious = highSeverityPatterns.some(pattern =>
			pattern.test(violation['blocked-uri'] || '') ||
			pattern.test(violation['script-sample'] || '')
		);

		if (isSuspicious) {
			console.error('🚨 SUSPICIOUS CSP Violation detected:', {
				...logData,
				severity: 'HIGH',
				possibleAttack: true,
			});

			// In production, trigger security alerts
			if (process.env.NODE_ENV === 'production') {
				// TODO: Implement immediate security alerting
				// - Send to security team
				// - Log to security information and event management (SIEM)
				// - Consider temporary IP blocking for repeated violations
			}
		}

		return NextResponse.json({ status: 'received' }, { status: 204 });

	} catch (error) {
		console.error('Error processing CSP report:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// Only allow POST requests
export async function GET() {
	return NextResponse.json(
		{ error: 'Method not allowed' },
		{ status: 405 }
	);
}