import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { MessageHandler } from '../../admin/services/proxy.admin.service';
import logger from '../../utils/logger';
import cacheService from '../../admin/services/organization.cache.service';


import {HoloConfig} from "../../admin/types/config.types";


interface JWTTokenData {
    token?: string;
    userId?: string;
    organizationId?: string;
    [key: string]: any;
}

@injectable()
export class JwtInvalidationHandler implements MessageHandler {
    // In-memory store of invalidated tokens
    private invalidatedTokens: Set<string> = new Set();

    async handle(message: HoloConfig): Promise<void> {
        logger.info(`Processing JWT invalidation message: ${message.configType} action: ${message.action}`);

        try {
            // Validate the message
            this.validateJWTMessage(message);

            // Handle different actions
            switch (message.action) {
                case 'DELETE':
                    await this.handleTokenInvalidation(message);
                    break;
                case 'NEW':
                case 'UPDATE':
                    logger.warn(`JWT invalidation handler received non-deletion action: ${message.action}`);
                    break;
                default:
                    logger.warn(`Unknown JWT action: ${message.action}`);
                    return;
            }

            logger.info(`Successfully processed JWT ${message.action} with ${message.data.length} tokens`);

        } catch (error) {
            logger.error(`Failed to process JWT invalidation: ${(error as Error).message}`, {
                entityType: message.configType,
                action: message.action,
                error: (error as Error).stack
            });
            throw error;
        }
    }

    /**
     * Handle token invalidation (DELETE action)
     */
    private async handleTokenInvalidation(message: HoloConfig): Promise<void> {
        logger.debug(`Invalidating ${message.data.length} JWT tokens`);

        let invalidatedCount = 0;
        let cacheRemovedCount = 0;

        for (const tokenData of message.data as JWTTokenData[]) {
            // If token is provided directly, invalidate it
            if (tokenData.token) {
                this.invalidatedTokens.add(tokenData.token);
                invalidatedCount++;

                // Remove from cache if it exists
                if (cacheService.hasToken(tokenData.token)) {
                    cacheService.del('tokens', `token:${tokenData.token}`);
                    cacheRemovedCount++;
                    logger.debug(`Removed token from cache: ${tokenData.token.substring(0, 20)}...`);
                } else {
                    logger.debug(`Token not found in cache: ${tokenData.token.substring(0, 20)}...`);
                }
            }

            // If user/organization info is provided, find and invalidate related tokens
            if (tokenData.userId || tokenData.organizationId) {
                const removedTokens = this.invalidateTokensByUserOrOrg(tokenData);
                invalidatedCount += removedTokens.invalidated;
                cacheRemovedCount += removedTokens.cacheRemoved;
            }
        }

        logger.info(`JWT invalidation completed: ${invalidatedCount} tokens invalidated, ${cacheRemovedCount} removed from cache`);
    }

    /**
     * Invalidate tokens by user ID or organization ID
     */
    private invalidateTokensByUserOrOrg(tokenData: JWTTokenData): { invalidated: number, cacheRemoved: number } {
        const tokenKeys = cacheService.getKeys('tokens');
        let invalidated = 0;
        let cacheRemoved = 0;

        tokenKeys.forEach(key => {
            const cachedTokenData = cacheService.get('tokens', key);
            if (cachedTokenData && cachedTokenData.urlSlugs) {
                // Extract token from key (remove 'token:' prefix)
                const token = key.replace('token:', '');

                // Check if this token should be invalidated
                const shouldInvalidate =
                    (tokenData.userId && this.tokenBelongsToUser(cachedTokenData, tokenData.userId)) ||
                    (tokenData.organizationId && this.tokenBelongsToOrganization(cachedTokenData, tokenData.organizationId));

                if (shouldInvalidate) {
                    this.invalidatedTokens.add(token);
                    cacheService.del('tokens', key);
                    invalidated++;
                    cacheRemoved++;
                    logger.debug(`Invalidated and removed token for user/org: ${key.substring(0, 20)}...`);
                }
            }
        });

        return { invalidated, cacheRemoved };
    }

    /**
     * Check if token belongs to a specific user
     */
    private tokenBelongsToUser(cachedTokenData: any, userId: string): boolean {
        // This would need to be implemented based on how user info is stored in cached token data
        // For now, assume the cached data structure includes user info
        return cachedTokenData.userId === userId;
    }

    /**
     * Check if token belongs to a specific organization
     */
    private tokenBelongsToOrganization(cachedTokenData: any, organizationId: string): boolean {
        // This would need to be implemented based on how org info is stored in cached token data
        // For now, assume the cached data structure includes org info
        return cachedTokenData.organizationId === organizationId;
    }

    /**
     * Validate JWT invalidation message
     */
    private validateJWTMessage(message: HoloConfig): void {
        if (!message.configType || message.configType !== 'JWT_TOKEN') {
            throw new Error(`Invalid entity_type for JWT handler: ${message.configType}`);
        }

        if (!message.action) {
            throw new Error('Missing action in JWT message');
        }

        if (!Array.isArray(message.data)) {
            throw new Error('JWT message data must be an array');
        }

        // Validate each token entry
        message.data.forEach((tokenData: any, index) => {
            if (!tokenData.token && !tokenData.userId && !tokenData.organizationId) {
                throw new Error(`JWT token at index ${index} must have token, userId, or organizationId`);
            }
        });
    }


    /**
     * Check if a token has been invalidated
     */
    isTokenInvalidated(token: string): boolean {
        return this.invalidatedTokens.has(token);
    }

    /**
     * Get count of invalidated tokens
     */
    getInvalidatedTokenCount(): number {
        return this.invalidatedTokens.size;
    }

    /**
     * Clear all invalidated tokens (useful for testing or cleanup)
     */
    clearInvalidatedTokens(): void {
        this.invalidatedTokens.clear();
        logger.info('Cleared all invalidated tokens');
    }
}
