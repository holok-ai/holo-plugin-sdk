import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { AdminMessage, MessageHandler } from '../proxy.admin.service';
import logger from '../../utils/logger';

export interface JwtInvalidationMessage extends AdminMessage {
    type: 'jwt_invalidation';
    tokens: string[];
    reason?: string;
}

@injectable()
export class JwtInvalidationHandler implements MessageHandler {
    // In-memory store of invalidated tokens
    private invalidatedTokens: Set<string> = new Set();
    
    async handle(message: AdminMessage): Promise<void> {
        const jwtMessage = message as JwtInvalidationMessage;
        
        logger.info(`Processing JWT invalidation message: ${jwtMessage.messageId}`);
        
        try {
            // Validate the message
            this.validateJwtInvalidationMessage(jwtMessage);
            
            // Add tokens to invalidated set
            jwtMessage.tokens.forEach(token => {
                this.invalidatedTokens.add(token);
            });
            
            logger.info(`Invalidated ${jwtMessage.tokens.length} JWT tokens. Reason: ${jwtMessage.reason || 'Not specified'}`);
            
            // TODO: Integration with auth middleware to check invalidated tokens
            // This would require updating the auth.middleware.ts to check this handler
            
        } catch (error) {
            logger.error(`Failed to process JWT invalidation: ${(error as Error).message}`);
            throw error;
        }
    }

    private validateJwtInvalidationMessage(message: JwtInvalidationMessage): void {
        if (!Array.isArray(message.tokens)) {
            throw new Error('JWT invalidation message must contain tokens array');
        }

        if (message.tokens.length === 0) {
            throw new Error('JWT invalidation message must contain at least one token');
        }
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