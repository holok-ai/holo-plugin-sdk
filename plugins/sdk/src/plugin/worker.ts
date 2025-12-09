import {IPlugin} from './index.js';

/**
 * Worker task definition
 * @template TPayload The type of payload for this task
 */
export interface WorkerTask<TPayload = unknown> {
    id: string;
    type: string;
    payload: TPayload;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    retries?: number;
    timeout?: number;
    createdAt?: number;
    metadata?: Record<string, unknown>;
}

/**
 * Worker task result
 * @template TResult The type of result data
 */
export interface WorkerResult<TResult = unknown> {
    taskId: string;
    status: 'completed' | 'failed' | 'cancelled';
    result?: TResult;
    error?: {
        message: string;
        code?: string;
        details?: unknown;
    };
    executionTime?: number;
    timestamp: number;
}

/**
 * Queue status information
 */
export interface QueueStatus {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    averageProcessingTime?: number;
    oldestTask?: {
        id: string;
        age: number;
    };
}

/**
 * Configuration for worker plugins
 */
export interface WorkerConfig {
    concurrency: number;
    timeout?: number;
    retryPolicy?: {
        maxRetries: number;
        backoffMultiplier?: number;
    };
    priorityQueues?: boolean;
    custom?: Record<string, unknown>;
}

/**
 * Worker plugin interface for background processing.
 * @template TPayload The type of task payload this worker processes.
 * @template TResult The type of result this worker produces.
 *
 * @example
 * ```typescript
 * interface ImagePayload {
 *   url: string;
 *   format: 'png' | 'jpg';
 * }
 *
 * interface ImageResult {
 *   processedUrl: string;
 *   metadata: { width: number; height: number };
 * }
 *
 * class ImageProcessorPlugin
 *   extends BasePlugin
 *   implements IWorkerPlugin<ImagePayload, ImageResult>
 * {
 *   async process(task: WorkerTask<ImagePayload>): Promise<WorkerResult<ImageResult>> {
 *     try {
 *       const result = await this.processImage(task.payload);
 *       return {
 *         taskId: task.id,
 *         status: 'completed',
 *         result,
 *         executionTime: Date.now() - task.createdAt,
 *         timestamp: Date.now()
 *       };
 *     } catch (error) {
 *       return {
 *         taskId: task.id,
 *         status: 'failed',
 *         error: { message: error.message },
 *         timestamp: Date.now()
 *       };
 *     }
 *   }
 *
 *   getQueueStatus(): QueueStatus {
 *     return this.queue.getStatus();
 *   }
 *
 *   async cancelTask(taskId: string): Promise<boolean> {
 *     return this.queue.cancel(taskId);
 *   }
 * }
 * ```
 */
export interface IWorkerPlugin<TPayload = unknown, TResult = unknown> extends IPlugin {
    /**
     * Process a task.
     * @param task The task to process with typed payload.
     * @returns Task result with typed result data.
     */
    process(task: WorkerTask<TPayload>): Promise<WorkerResult<TResult>>;

    /**
     * Get queue status.
     * @returns Current queue status with metrics.
     */
    getQueueStatus(): QueueStatus;

    /**
     * Cancel a task.
     * @param taskId ID of the task to cancel.
     * @returns True if cancelled successfully, false if not found or already completed.
     */
    cancelTask(taskId: string): Promise<boolean>;

    /**
     * Configure the worker. Implementations may merge with existing config.
     * @param config Worker configuration (partial updates allowed).
     */
    configure(config: Partial<WorkerConfig>): Promise<void>;

    /**
     * Pause processing. New tasks will be queued but not processed.
     */
    pause?(): Promise<void>;

    /**
     * Resume processing. Queued tasks will begin processing.
     */
    resume?(): Promise<void>;
}