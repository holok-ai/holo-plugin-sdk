import 'reflect-metadata';
import {Pool, QueryResult, QueryResultRow} from 'pg';
import {DatabaseConfig} from '../admin/types';
import logger from '../utils/logger';
import {env} from "../env";

/**
 * Database connection and management service
 */
export class AppDB {
    private readonly pool: Pool;

    constructor(private readonly config: DatabaseConfig = env.appDb.config) {
        this.pool = new Pool(this.config);
    }

    async connect(): Promise<void> {
        try {
            // Test connection
            const now = await this.pool.query('SELECT NOW()');
            logger.info(`Successfully connected to PostgreSQL: ${now.rows[0].now}`);
        } catch (error) {
            logger.error(`Failed to connect to PostgreSQL: ${(error as Error).message}`);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            logger.info('Disconnected from PostgreSQL');
        }
    }

    getPool(): Pool {
        if (!this.pool) {
            throw new Error('Database not connected');
        }
        return this.pool;
    }

    /**
     * Execute a generic query with type safety
     * @param text - SQL query string
     * @param params - Query parameters
     * @returns Promise<T[]> - Array of results typed as T
     */
    async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T[]> {
        const pool = this.getPool();
        return pool.query(text, params).then((result) => result.rows);
    }

    /**
     * Execute a query and return the full QueryResult object
     * @param text - SQL query string
     * @param params - Query parameters
     * @returns Promise<QueryResult<T>> - Full query result with metadata
     */
    async queryResult<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        const pool = this.getPool();
        return pool.query(text, params);
    }

    /**
     * Execute a query and return only the first row
     * @param text - SQL query string
     * @param params - Query parameters
     * @returns Promise<T | null> - First row or null if no results
     */
    async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
        return this.query(text, params).then((rows) => rows[0] || null);
    }

    /**
     * Execute a query and return a single scalar value
     * @param text - SQL query string
     * @param params - Query parameters
     * @returns Promise<U | null> - Single value or null
     */
    async queryScalar<U = any>(text: string, params?: any[]): Promise<U | null> {
        const result = await this.queryResult(text, params);
        if (result.rows.length === 0) return null;
        const firstRow = result.rows[0] as any;
        return Object.values(firstRow)[0] as U;
    }

    /**
     * Execute multiple queries in a transaction
     * @param queries - Array of query objects with text and params
     * @returns Promise<any[]> - Array of results
     */
    async queryBatch(queries: Array<{ text: string; params?: any[] }>): Promise<any[]> {
        return this.transaction(async (client) => {
            const results = [];
            for (const query of queries) {
                const result = await client.query(query.text, query.params);
                results.push(result.rows);
            }
            return results;
        });
    }

    async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
        const pool = this.getPool();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    isConnected(): boolean {
        return this.pool !== null;
    }
}
