import {ServiceStats} from '../types';
import logger from '../utils/logger';

/**
 * Metrics and monitoring service
 */
export class MetricsService {
    private stats: ServiceStats;
    private serviceName: string;
    private serviceId: string;
    private metricsInterval?: NodeJS.Timeout | undefined;

    constructor(serviceName: string, serviceId: string, initialStats: Record<string, any> = {}) {
        this.serviceName = serviceName;
        this.serviceId = serviceId;
        this.stats = {
            startTime: Date.now(),
            messagesProcessed: 0,
            errors: 0,
            ...initialStats
        };
    }

    startMetricsLogging(intervalMs: number = 60000): void {
        this.metricsInterval = setInterval(() => {
            this.logMetrics();
        }, intervalMs);
    }

    stopMetricsLogging(): void {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = undefined;
        }
    }

    private logMetrics(): void {
        const stats = this.getStats();
        logger.info(`${this.serviceName} metrics:`, {
            uptime: Math.round(stats.uptime! / 1000),
            ...stats
        });
    }

    incrementMessages(): void {
        this.stats.messagesProcessed++;
    }

    incrementErrors(): void {
        this.stats.errors++;
    }

    updateStat(key: string, value: any): void {
        this.stats[key] = value;
    }

    incrementStat(key: string, increment: number = 1): void {
        if (typeof this.stats[key] === 'number') {
            this.stats[key] += increment;
        } else {
            this.stats[key] = increment;
        }
    }

    getStats(): ServiceStats {
        return {
            ...this.stats,
            uptime: Date.now() - this.stats.startTime,
            serviceId: this.serviceId,
            serviceName: this.serviceName
        };
    }

    reset(): void {
        this.stats = {
            startTime: Date.now(),
            messagesProcessed: 0,
            errors: 0
        };
    }

    // Health check functionality
    isHealthy(): boolean {
        // Basic health check - can be extended with more sophisticated checks
        const uptime = Date.now() - this.stats.startTime;
        return uptime > 1000; // Service has been running for at least 1 second
    }

    getHealthStatus(): { status: string; uptime: number; stats: ServiceStats } {
        const stats = this.getStats();
        return {
            status: this.isHealthy() ? 'healthy' : 'unhealthy',
            uptime: stats.uptime!,
            stats
        };
    }
}
