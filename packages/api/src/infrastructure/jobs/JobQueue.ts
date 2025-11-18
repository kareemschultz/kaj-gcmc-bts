/**
 * Enhanced Job Queue System
 *
 * Robust background job processing with priority, retry, and monitoring
 */

import {
	type Job,
	Queue,
	type QueueOptions,
	Worker,
	type WorkerOptions,
} from "bullmq";
import type Redis from "ioredis";
import { logger } from "../logging/Logger";
import { metrics } from "../monitoring/MetricsCollector";

export enum JobPriority {
	LOW = 1,
	NORMAL = 5,
	HIGH = 10,
	CRITICAL = 20,
}

export interface JobData {
	[key: string]: any;
}

export interface JobOptions {
	priority?: JobPriority;
	delay?: number;
	attempts?: number;
	backoff?: {
		type: "fixed" | "exponential";
		delay: number;
	};
	removeOnComplete?: number;
	removeOnFail?: number;
	repeat?: {
		pattern: string; // Cron pattern
		tz?: string;
	};
}

export interface JobProcessor<T extends JobData = JobData> {
	process(job: Job<T>): Promise<any>;
	onCompleted?(job: Job<T>, result: any): Promise<void>;
	onFailed?(job: Job<T>, error: Error): Promise<void>;
	onProgress?(job: Job<T>, progress: number): Promise<void>;
}

export interface JobQueueStats {
	waiting: number;
	active: number;
	completed: number;
	failed: number;
	delayed: number;
	paused: boolean;
}

export class JobQueue<T extends JobData = JobData> {
	private queue: Queue<T>;
	private worker: Worker<T> | null = null;
	private queueName: string;
	private redisConnection: Redis;

	// Metrics
	private jobCounter = metrics.createCounter(
		"jobs_total",
		"Total jobs processed",
	);
	private jobDurationHistogram = metrics.createHistogram(
		"job_duration_seconds",
		"Job processing duration",
	);
	private jobFailureCounter = metrics.createCounter(
		"job_failures_total",
		"Total job failures",
	);
	private activeJobsGauge = metrics.createGauge(
		"jobs_active",
		"Currently active jobs",
	);

	constructor(
		name: string,
		redisConnection: Redis,
		queueOptions: QueueOptions = {},
	) {
		this.queueName = name;
		this.redisConnection = redisConnection;

		this.queue = new Queue<T>(name, {
			connection: redisConnection,
			defaultJobOptions: {
				removeOnComplete: 100, // Keep last 100 completed jobs
				removeOnFail: 50, // Keep last 50 failed jobs
				attempts: 3,
				backoff: {
					type: "exponential",
					delay: 2000,
				},
			},
			...queueOptions,
		});

		this.setupQueueEventListeners();
	}

	async addJob(
		jobType: string,
		data: T,
		options: JobOptions = {},
	): Promise<Job<T>> {
		const jobOptions = {
			priority: options.priority || JobPriority.NORMAL,
			delay: options.delay,
			attempts: options.attempts || 3,
			backoff: options.backoff || {
				type: "exponential" as const,
				delay: 2000,
			},
			removeOnComplete: options.removeOnComplete || 100,
			removeOnFail: options.removeOnFail || 50,
			repeat: options.repeat,
		};

		const job = await this.queue.add(jobType, data, jobOptions);

		logger.info("Job added to queue", {
			queueName: this.queueName,
			jobType,
			jobId: job.id,
			priority: jobOptions.priority,
			delay: jobOptions.delay,
		});

		this.jobCounter.increment({
			queue: this.queueName,
			type: jobType,
			status: "added",
		});

		return job;
	}

	async addBulkJobs(
		jobs: Array<{
			name: string;
			data: T;
			options?: JobOptions;
		}>,
	): Promise<Job<T>[]> {
		const bulkJobs = jobs.map((job) => ({
			name: job.name,
			data: job.data,
			opts: {
				priority: job.options?.priority || JobPriority.NORMAL,
				delay: job.options?.delay,
				attempts: job.options?.attempts || 3,
				backoff: job.options?.backoff || {
					type: "exponential" as const,
					delay: 2000,
				},
			},
		}));

		const addedJobs = await this.queue.addBulk(bulkJobs);

		logger.info("Bulk jobs added to queue", {
			queueName: this.queueName,
			count: jobs.length,
		});

		this.jobCounter.add(jobs.length, {
			queue: this.queueName,
			status: "bulk_added",
		});

		return addedJobs;
	}

	createWorker(
		processor: JobProcessor<T>,
		workerOptions: WorkerOptions = {},
	): Worker<T> {
		if (this.worker) {
			throw new Error(`Worker for queue ${this.queueName} already exists`);
		}

		this.worker = new Worker<T>(
			this.queueName,
			async (job: Job<T>) => {
				const start = Date.now();

				try {
					logger.info("Processing job", {
						queueName: this.queueName,
						jobType: job.name,
						jobId: job.id,
						attempt: job.attemptsMade + 1,
					});

					const result = await processor.process(job);

					const duration = Date.now() - start;
					this.jobDurationHistogram.observe(duration / 1000, {
						queue: this.queueName,
						type: job.name,
					});

					logger.info("Job completed successfully", {
						queueName: this.queueName,
						jobType: job.name,
						jobId: job.id,
						duration,
					});

					this.jobCounter.increment({
						queue: this.queueName,
						type: job.name,
						status: "completed",
					});

					return result;
				} catch (error) {
					const duration = Date.now() - start;

					logger.error("Job failed", error as Error, {
						queueName: this.queueName,
						jobType: job.name,
						jobId: job.id,
						attempt: job.attemptsMade + 1,
						duration,
					});

					this.jobFailureCounter.increment({
						queue: this.queueName,
						type: job.name,
						error: (error as Error).name,
					});

					throw error;
				}
			},
			{
				connection: this.redisConnection,
				concurrency: 1,
				...workerOptions,
			},
		);

		this.setupWorkerEventListeners(processor);

		return this.worker;
	}

	async getJobStats(): Promise<JobQueueStats> {
		const [waiting, active, completed, failed, delayed] = await Promise.all([
			this.queue.getWaiting(),
			this.queue.getActive(),
			this.queue.getCompleted(),
			this.queue.getFailed(),
			this.queue.getDelayed(),
		]);

		return {
			waiting: waiting.length,
			active: active.length,
			completed: completed.length,
			failed: failed.length,
			delayed: delayed.length,
			paused: await this.queue.isPaused(),
		};
	}

	async getJob(jobId: string): Promise<Job<T> | undefined> {
		return this.queue.getJob(jobId);
	}

	async removeJob(jobId: string): Promise<void> {
		const job = await this.getJob(jobId);
		if (job) {
			await job.remove();
			logger.info("Job removed", {
				queueName: this.queueName,
				jobId,
			});
		}
	}

	async retryFailedJobs(): Promise<void> {
		const failedJobs = await this.queue.getFailed();

		for (const job of failedJobs) {
			await job.retry();
		}

		logger.info("Retrying failed jobs", {
			queueName: this.queueName,
			count: failedJobs.length,
		});
	}

	async pauseQueue(): Promise<void> {
		await this.queue.pause();
		logger.info("Queue paused", { queueName: this.queueName });
	}

	async resumeQueue(): Promise<void> {
		await this.queue.resume();
		logger.info("Queue resumed", { queueName: this.queueName });
	}

	async cleanQueue(grace = 0): Promise<void> {
		await this.queue.clean(grace, 10000, "completed");
		await this.queue.clean(grace, 10000, "failed");
		logger.info("Queue cleaned", { queueName: this.queueName, grace });
	}

	async close(): Promise<void> {
		if (this.worker) {
			await this.worker.close();
			this.worker = null;
		}
		await this.queue.close();
		logger.info("Queue closed", { queueName: this.queueName });
	}

	private setupQueueEventListeners(): void {
		this.queue.on("error", (error) => {
			logger.error("Queue error", error, { queueName: this.queueName });
		});

		this.queue.on("waiting", (job) => {
			logger.debug("Job waiting", {
				queueName: this.queueName,
				jobId: job.id,
			});
		});

		this.queue.on("stalled", (jobId) => {
			logger.warn("Job stalled", {
				queueName: this.queueName,
				jobId,
			});
		});
	}

	private setupWorkerEventListeners(processor: JobProcessor<T>): void {
		if (!this.worker) return;

		this.worker.on("active", (job) => {
			this.activeJobsGauge.increment({ queue: this.queueName });
			logger.debug("Job started", {
				queueName: this.queueName,
				jobId: job.id,
				jobType: job.name,
			});
		});

		this.worker.on("completed", async (job, result) => {
			this.activeJobsGauge.decrement({ queue: this.queueName });

			if (processor.onCompleted) {
				try {
					await processor.onCompleted(job, result);
				} catch (error) {
					logger.error("Error in onCompleted handler", error as Error, {
						queueName: this.queueName,
						jobId: job.id,
					});
				}
			}
		});

		this.worker.on("failed", async (job, error) => {
			this.activeJobsGauge.decrement({ queue: this.queueName });

			if (processor.onFailed) {
				try {
					await processor.onFailed(job!, error);
				} catch (handlerError) {
					logger.error("Error in onFailed handler", handlerError as Error, {
						queueName: this.queueName,
						jobId: job?.id,
					});
				}
			}
		});

		this.worker.on("progress", async (job, progress) => {
			if (processor.onProgress) {
				try {
					await processor.onProgress(job, progress);
				} catch (error) {
					logger.error("Error in onProgress handler", error as Error, {
						queueName: this.queueName,
						jobId: job.id,
					});
				}
			}
		});

		this.worker.on("error", (error) => {
			logger.error("Worker error", error, { queueName: this.queueName });
		});
	}
}

// Job Queue Manager for multiple queues
export class JobQueueManager {
	private queues: Map<string, JobQueue> = new Map();
	private redisConnection: Redis;

	constructor(redisConnection: Redis) {
		this.redisConnection = redisConnection;
	}

	createQueue<T extends JobData = JobData>(
		name: string,
		options: QueueOptions = {},
	): JobQueue<T> {
		if (this.queues.has(name)) {
			throw new Error(`Queue ${name} already exists`);
		}

		const queue = new JobQueue<T>(name, this.redisConnection, options);
		this.queues.set(name, queue as any);

		logger.info("Queue created", { queueName: name });
		return queue;
	}

	getQueue<T extends JobData = JobData>(name: string): JobQueue<T> | undefined {
		return this.queues.get(name) as JobQueue<T>;
	}

	async getAllStats(): Promise<Record<string, JobQueueStats>> {
		const stats: Record<string, JobQueueStats> = {};

		for (const [name, queue] of this.queues) {
			stats[name] = await queue.getJobStats();
		}

		return stats;
	}

	async closeAll(): Promise<void> {
		const promises = Array.from(this.queues.values()).map((queue) =>
			queue.close(),
		);
		await Promise.all(promises);
		this.queues.clear();
		logger.info("All queues closed");
	}
}
