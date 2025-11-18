/**
 * Metrics Collection Infrastructure
 *
 * Application performance monitoring and business metrics
 */

export interface MetricValue {
	value: number;
	timestamp: Date;
	labels: Record<string, string>;
}

export interface Counter {
	increment(labels?: Record<string, string>): void;
	add(value: number, labels?: Record<string, string>): void;
}

export interface Gauge {
	set(value: number, labels?: Record<string, string>): void;
	increment(labels?: Record<string, string>): void;
	decrement(labels?: Record<string, string>): void;
}

export interface Histogram {
	observe(value: number, labels?: Record<string, string>): void;
}

export interface Timer {
	startTimer(labels?: Record<string, string>): () => void;
	time<T>(fn: () => T, labels?: Record<string, string>): T;
	timeAsync<T>(
		fn: () => Promise<T>,
		labels?: Record<string, string>,
	): Promise<T>;
}

export class MetricsCollector {
	private counters: Map<string, Counter> = new Map();
	private gauges: Map<string, Gauge> = new Map();
	private histograms: Map<string, Histogram> = new Map();
	private timers: Map<string, Timer> = new Map();

	createCounter(name: string, help: string): Counter {
		const counter = new SimpleCounter(name, help);
		this.counters.set(name, counter);
		return counter;
	}

	createGauge(name: string, help: string): Gauge {
		const gauge = new SimpleGauge(name, help);
		this.gauges.set(name, gauge);
		return gauge;
	}

	createHistogram(name: string, help: string, buckets?: number[]): Histogram {
		const histogram = new SimpleHistogram(name, help, buckets);
		this.histograms.set(name, histogram);
		return histogram;
	}

	createTimer(name: string, help: string): Timer {
		const timer = new SimpleTimer(name, help);
		this.timers.set(name, timer);
		return timer;
	}

	getMetrics(): string {
		// Return Prometheus-formatted metrics
		let output = "";

		// Add counters
		for (const counter of this.counters.values()) {
			output += `${(counter as any).getMetrics()}\n`;
		}

		// Add gauges
		for (const gauge of this.gauges.values()) {
			output += `${(gauge as any).getMetrics()}\n`;
		}

		// Add histograms
		for (const histogram of this.histograms.values()) {
			output += `${(histogram as any).getMetrics()}\n`;
		}

		return output;
	}
}

class SimpleCounter implements Counter {
	private value = 0;
	private values: Map<string, number> = new Map();

	constructor(
		private name: string,
		private help: string,
	) {}

	increment(labels: Record<string, string> = {}): void {
		this.add(1, labels);
	}

	add(value: number, labels: Record<string, string> = {}): void {
		const key = JSON.stringify(labels);
		this.values.set(key, (this.values.get(key) || 0) + value);
		this.value += value;
	}

	getMetrics(): string {
		let output = `# HELP ${this.name} ${this.help}\n`;
		output += `# TYPE ${this.name} counter\n`;

		if (this.values.size === 0) {
			output += `${this.name} ${this.value}\n`;
		} else {
			for (const [labelsStr, value] of this.values) {
				const labels = JSON.parse(labelsStr);
				const labelStr = Object.entries(labels)
					.map(([k, v]) => `${k}="${v}"`)
					.join(",");
				output += `${this.name}{${labelStr}} ${value}\n`;
			}
		}

		return output;
	}
}

class SimpleGauge implements Gauge {
	private value = 0;
	private values: Map<string, number> = new Map();

	constructor(
		private name: string,
		private help: string,
	) {}

	set(value: number, labels: Record<string, string> = {}): void {
		const key = JSON.stringify(labels);
		const oldValue = this.values.get(key) || 0;
		this.values.set(key, value);
		this.value = this.value - oldValue + value;
	}

	increment(labels: Record<string, string> = {}): void {
		const key = JSON.stringify(labels);
		this.values.set(key, (this.values.get(key) || 0) + 1);
		this.value += 1;
	}

	decrement(labels: Record<string, string> = {}): void {
		const key = JSON.stringify(labels);
		this.values.set(key, (this.values.get(key) || 0) - 1);
		this.value -= 1;
	}

	getMetrics(): string {
		let output = `# HELP ${this.name} ${this.help}\n`;
		output += `# TYPE ${this.name} gauge\n`;

		if (this.values.size === 0) {
			output += `${this.name} ${this.value}\n`;
		} else {
			for (const [labelsStr, value] of this.values) {
				const labels = JSON.parse(labelsStr);
				const labelStr = Object.entries(labels)
					.map(([k, v]) => `${k}="${v}"`)
					.join(",");
				output += `${this.name}{${labelStr}} ${value}\n`;
			}
		}

		return output;
	}
}

class SimpleHistogram implements Histogram {
	private buckets: number[];
	private counts: Map<string, number[]> = new Map();
	private sums: Map<string, number> = new Map();

	constructor(
		private name: string,
		private help: string,
		buckets: number[] = [
			0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
		],
	) {
		this.buckets = [...buckets, Number.POSITIVE_INFINITY];
	}

	observe(value: number, labels: Record<string, string> = {}): void {
		const key = JSON.stringify(labels);

		if (!this.counts.has(key)) {
			this.counts.set(key, new Array(this.buckets.length).fill(0));
			this.sums.set(key, 0);
		}

		const counts = this.counts.get(key)!;
		const sum = this.sums.get(key)! + value;
		this.sums.set(key, sum);

		for (let i = 0; i < this.buckets.length; i++) {
			if (value <= this.buckets[i]) {
				counts[i]++;
			}
		}
	}

	getMetrics(): string {
		let output = `# HELP ${this.name} ${this.help}\n`;
		output += `# TYPE ${this.name} histogram\n`;

		for (const [labelsStr, counts] of this.counts) {
			const labels = JSON.parse(labelsStr);
			const sum = this.sums.get(labelsStr) || 0;

			for (let i = 0; i < this.buckets.length - 1; i++) {
				const labelStr = Object.entries({
					...labels,
					le: this.buckets[i].toString(),
				})
					.map(([k, v]) => `${k}="${v}"`)
					.join(",");
				output += `${this.name}_bucket{${labelStr}} ${counts[i]}\n`;
			}

			const infLabelStr = Object.entries({ ...labels, le: "+Inf" })
				.map(([k, v]) => `${k}="${v}"`)
				.join(",");
			output += `${this.name}_bucket{${infLabelStr}} ${counts[counts.length - 1]}\n`;

			const sumLabelStr = Object.entries(labels)
				.map(([k, v]) => `${k}="${v}"`)
				.join(",");
			output += `${this.name}_sum{${sumLabelStr}} ${sum}\n`;
			output += `${this.name}_count{${sumLabelStr}} ${counts[counts.length - 1]}\n`;
		}

		return output;
	}
}

class SimpleTimer implements Timer {
	private histogram: SimpleHistogram;

	constructor(name: string, help: string) {
		this.histogram = new SimpleHistogram(`${name}_duration_seconds`, help);
	}

	startTimer(labels: Record<string, string> = {}): () => void {
		const start = Date.now();
		return () => {
			const duration = (Date.now() - start) / 1000;
			this.histogram.observe(duration, labels);
		};
	}

	time<T>(fn: () => T, labels: Record<string, string> = {}): T {
		const end = this.startTimer(labels);
		try {
			const result = fn();
			end();
			return result;
		} catch (error) {
			end();
			throw error;
		}
	}

	async timeAsync<T>(
		fn: () => Promise<T>,
		labels: Record<string, string> = {},
	): Promise<T> {
		const end = this.startTimer(labels);
		try {
			const result = await fn();
			end();
			return result;
		} catch (error) {
			end();
			throw error;
		}
	}

	getMetrics(): string {
		return (this.histogram as any).getMetrics();
	}
}

// Global metrics collector
export const metrics = new MetricsCollector();
