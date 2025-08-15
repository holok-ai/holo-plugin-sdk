import {injectable} from "tsyringe";
import {AppDB} from "./app.db";
import type {AnalysisEvent} from "../types";

@injectable()
export class AnalysisDB {
    constructor(private db: AppDB) {

    }

    async findById(id: string): Promise<AnalysisEvent | null> {
        const query = `
            SELECT id, created_at, user_id, event_source, event_data, parameters
            FROM analysis_events
            WHERE id = $1
        `;

        return await this.db.queryOne<AnalysisEvent>(query, [id]);
    }

    async findByUserId(userId: string): Promise<AnalysisEvent[]> {
        const query = `
            SELECT id, created_at, user_id, event_source, event_data, parameters
            FROM analysis_events
            WHERE user_id = $1
            ORDER BY created_at DESC
        `;

        return await this.db.query<AnalysisEvent>(query, [userId]);
    }

    async findByEventSource(eventSource: 'claude' | 'azurepr' | 'github'): Promise<AnalysisEvent[]> {
        const query = `
            SELECT id, created_at, user_id, event_source, event_data, parameters
            FROM analysis_events
            WHERE event_source = $1
            ORDER BY created_at DESC
        `;

        return await this.db.query<AnalysisEvent>(query, [eventSource]);
    }

    async findRecent(limit: number = 10): Promise<AnalysisEvent[]> {
        const query = `
            SELECT id, created_at, user_id, event_source, event_data, parameters
            FROM analysis_events
            ORDER BY created_at DESC
            LIMIT $1
        `;

        return await this.db.query<AnalysisEvent>(query, [limit]);
    }

    async findByUserIdBeforeDate(userId: string, beforeDate: Date): Promise<AnalysisEvent[]> {
        const query = `
            SELECT id, created_at, user_id, event_source, event_data, parameters
            FROM analysis_events
            WHERE user_id = $1 AND created_at < $2
            ORDER BY created_at DESC
        `;

        return await this.db.query<AnalysisEvent>(query, [userId, beforeDate]);
    }
}