/**
 * Performance Monitoring Hook for React Components
 *
 * Tracks component render times, API call performance,
 * and provides optimization insights
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface PerformanceMetric {
	componentName: string;
	renderTime: number;
	mountTime: number;
	apiCalls: Array<{
		endpoint: string;
		duration: number;
		timestamp: Date;
	}>;
}

interface UsePerformanceOptions {
	componentName: string;
	trackRenders?: boolean;
	trackApiCalls?: boolean;
	reportThreshold?: number; // ms
}

export function usePerformance({
	componentName,
	trackRenders = true,
	trackApiCalls = true,
	reportThreshold = 100,
}: UsePerformanceOptions) {
	const [metrics, setMetrics] = useState<PerformanceMetric>({
		componentName,
		renderTime: 0,
		mountTime: 0,
		apiCalls: [],
	});

	const mountTimeRef = useRef<number>(0);
	const renderStartRef = useRef<number>(0);
	const apiCallsRef = useRef<Map<string, number>>(new Map());

	// Track component mount time
	useEffect(() => {
		const mountEnd = performance.now();
		mountTimeRef.current = mountEnd;

		setMetrics((prev) => ({
			...prev,
			mountTime: mountEnd,
		}));

		// Report if mount time exceeds threshold
		if (mountEnd > reportThreshold) {
			console.warn(
				`Slow component mount: ${componentName} took ${mountEnd.toFixed(2)}ms`,
			);
		}
	}, [componentName, reportThreshold]);

	// Track render performance
	useEffect(() => {
		if (!trackRenders) return;

		const renderEnd = performance.now();
		const renderTime = renderEnd - renderStartRef.current;

		setMetrics((prev) => ({
			...prev,
			renderTime,
		}));

		if (renderTime > reportThreshold) {
			console.warn(
				`Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`,
			);
		}
	});

	// Start render timing
	if (trackRenders) {
		renderStartRef.current = performance.now();
	}

	// API call tracking wrapper
	const trackApiCall = useCallback(
		(endpoint: string, promise: Promise<any>) => {
			if (!trackApiCalls) return promise;

			const startTime = performance.now();
			apiCallsRef.current.set(endpoint, startTime);

			return promise.finally(() => {
				const endTime = performance.now();
				const duration = endTime - startTime;

				setMetrics((prev) => ({
					...prev,
					apiCalls: [
						...prev.apiCalls,
						{
							endpoint,
							duration,
							timestamp: new Date(),
						},
					].slice(-10), // Keep only last 10 API calls
				}));

				if (duration > reportThreshold * 10) {
					// 10x threshold for API calls
					console.warn(
						`Slow API call: ${endpoint} took ${duration.toFixed(2)}ms`,
					);
				}

				apiCallsRef.current.delete(endpoint);
			});
		},
		[trackApiCalls, reportThreshold],
	);

	// Performance report
	const getPerformanceReport = useCallback(() => {
		const totalApiTime = metrics.apiCalls.reduce(
			(sum, call) => sum + call.duration,
			0,
		);
		const averageApiTime =
			metrics.apiCalls.length > 0 ? totalApiTime / metrics.apiCalls.length : 0;

		return {
			componentName,
			mountTime: metrics.mountTime,
			renderTime: metrics.renderTime,
			apiCalls: {
				total: metrics.apiCalls.length,
				totalTime: totalApiTime,
				averageTime: averageApiTime,
				slowest: metrics.apiCalls.reduce(
					(slowest, call) =>
						call.duration > slowest.duration ? call : slowest,
					{ endpoint: "", duration: 0, timestamp: new Date() },
				),
			},
			recommendations: generateRecommendations({
				mountTime: metrics.mountTime,
				renderTime: metrics.renderTime,
				averageApiTime,
			}),
		};
	}, [componentName, metrics]);

	return {
		metrics,
		trackApiCall,
		getPerformanceReport,
	};
}

/**
 * Generate performance recommendations
 */
function generateRecommendations({
	mountTime,
	renderTime,
	averageApiTime,
}: {
	mountTime: number;
	renderTime: number;
	averageApiTime: number;
}) {
	const recommendations: string[] = [];

	if (mountTime > 500) {
		recommendations.push(
			"Consider code splitting or lazy loading for this component",
		);
	}

	if (renderTime > 16) {
		// 60fps = 16.67ms per frame
		recommendations.push(
			"Optimize render performance with React.memo or useMemo",
		);
	}

	if (averageApiTime > 1000) {
		recommendations.push(
			"Consider caching API responses or optimizing backend queries",
		);
	}

	return recommendations;
}

/**
 * Hook for tracking specific user interactions
 */
export function useInteractionTracking() {
	const recordInteraction = useCallback(
		(action: string, target: string, metadata?: Record<string, any>) => {
			const timestamp = performance.now();

			// Could send to analytics service
			console.log("User interaction:", {
				action,
				target,
				timestamp,
				metadata,
			});
		},
		[],
	);

	return { recordInteraction };
}

/**
 * Hook for monitoring Core Web Vitals
 */
export function useWebVitals() {
	const [vitals, setVitals] = useState({
		lcp: 0, // Largest Contentful Paint
		fid: 0, // First Input Delay
		cls: 0, // Cumulative Layout Shift
	});

	useEffect(() => {
		// Import web-vitals library dynamically
		import("web-vitals")
			.then(({ getLCP, getFID, getCLS }) => {
				getLCP((metric) => {
					setVitals((prev) => ({ ...prev, lcp: metric.value }));
				});

				getFID((metric) => {
					setVitals((prev) => ({ ...prev, fid: metric.value }));
				});

				getCLS((metric) => {
					setVitals((prev) => ({ ...prev, cls: metric.value }));
				});
			})
			.catch(() => {
				// web-vitals not available, skip
			});
	}, []);

	const getVitalsScore = useCallback(() => {
		const scores = {
			lcp:
				vitals.lcp <= 2500
					? "good"
					: vitals.lcp <= 4000
						? "needs-improvement"
						: "poor",
			fid:
				vitals.fid <= 100
					? "good"
					: vitals.fid <= 300
						? "needs-improvement"
						: "poor",
			cls:
				vitals.cls <= 0.1
					? "good"
					: vitals.cls <= 0.25
						? "needs-improvement"
						: "poor",
		};

		const goodCount = Object.values(scores).filter(
			(score) => score === "good",
		).length;
		const overallScore =
			goodCount === 3 ? "good" : goodCount >= 2 ? "needs-improvement" : "poor";

		return {
			individual: scores,
			overall: overallScore,
			vitals,
		};
	}, [vitals]);

	return {
		vitals,
		getVitalsScore,
	};
}

/**
 * Performance monitoring provider for global performance tracking
 */
export class PerformanceTracker {
	private static metrics: Map<string, PerformanceMetric> = new Map();

	static recordComponentMetric(
		componentName: string,
		metric: PerformanceMetric,
	) {
		PerformanceTracker.metrics.set(componentName, metric);
	}

	static getGlobalReport() {
		const components = Array.from(PerformanceTracker.metrics.entries());

		return {
			totalComponents: components.length,
			averageMountTime:
				components.reduce((sum, [, metric]) => sum + metric.mountTime, 0) /
				components.length,
			averageRenderTime:
				components.reduce((sum, [, metric]) => sum + metric.renderTime, 0) /
				components.length,
			slowestComponents: components
				.sort(([, a], [, b]) => b.mountTime - a.mountTime)
				.slice(0, 5)
				.map(([name, metric]) => ({ name, mountTime: metric.mountTime })),
			totalApiCalls: components.reduce(
				(sum, [, metric]) => sum + metric.apiCalls.length,
				0,
			),
		};
	}

	static clearMetrics() {
		PerformanceTracker.metrics.clear();
	}
}
