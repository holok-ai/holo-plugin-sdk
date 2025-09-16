/**
 * Lightweight test utilities for provider translation tests
 * Designed for Jest 29+ with minimal overhead
 */

import { type } from 'arktype';

// Simple type guards
export const isValidTranslation = <T>(result: T | type.errors): result is T => !Array.isArray(result);
export const hasErrors = <T>(result: T | type.errors): result is type.errors => Array.isArray(result);

// Simple assertion helper
export const expectValid = <T>(result: T | type.errors): T => {
    if (hasErrors(result)) {
        throw new Error(`Translation failed: ${result.map(e => e.message).join(', ')}`);
    }
    return result;
};

// Lightweight data comparison - flexible typing for test data
export const compareData = (original: any, result: any, ignoreFields: string[] = []): void => {
    const clean = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(clean);
        
        const cleaned = { ...obj };
        ignoreFields.forEach(field => delete cleaned[field]);
        Object.keys(cleaned).forEach(key => cleaned[key] = clean(cleaned[key]));
        return cleaned;
    };
    
    expect(clean(result)).toEqual(clean(original));
};

// Normalize dynamic values for comparison - flexible typing
export const normalize = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(normalize);
    
    const result = { ...obj } as any;
    
    // Normalize timestamps
    if (result.created) result.created = 1703123456;
    if (result.created_at) result.created_at = new Date('2023-12-01T10:30:45Z');
    
    // Normalize generated IDs
    if (result.id && typeof result.id === 'string' && result.id.includes('_')) {
        result.id = 'normalized_id';
    }
    
    // Recursively normalize nested objects
    Object.keys(result).forEach(key => {
        if (result[key] && typeof result[key] === 'object') {
            result[key] = normalize(result[key]);
        }
    });
    
    return result;
};