import {injectable} from "tsyringe";
import {AppDB} from "./app.db";
import {Prompt} from "@holokai/sdk";
import {
    AnalysisResult,
    Application,
    Evaluator,
    EvaluatorData,
    LlmResponse,
    Provider
} from "@holokai/sdk/dist/core/entities";

@injectable()
export class EvaluatorDB {
    constructor(private db: AppDB) {
    }

    async get(id: string): Promise<Evaluator | null> {
        const query = `
            SELECT *
            FROM evaluators
            WHERE id = $1
        `;
        return await this.db.queryOne<Evaluator>(query, [id]);
    }

    async getEvents(eventName: string): Promise<Evaluator[]> {
        const query = `
            SELECT e.*
            FROM evaluators e
            WHERE e.parameters ->> 'event' = $1
        `;
        return await this.db.query<Evaluator>(query, [eventName]);
    }

    async getAnalysisData(id: string): Promise<any | null> {
        const query = `
            SELECT *
            FROM analysis_events
            WHERE id = $1
        `;
        return await this.db.queryOne<any>(query, [id]);
    }

    async getByName(name: string): Promise<Evaluator | null> {
        const query = `SELECT *
                       FROM evaluators
                       WHERE name = $1
        `;
        return this.db.queryOne<Evaluator>(query, [name]);
    }

    async list(): Promise<Evaluator[]> {
        const query = `
            SELECT *
            FROM evaluators e
            WHERE e.enabled
        `;
        return await this.db.query<Evaluator>(query, []);
    }

    async listByApplication(applicationId: string): Promise<Evaluator[]> {
        const query = `
            SELECT e.*
            FROM evaluators e
                     JOIN evaluator_applications ea ON e.id = ea.evaluator_id
            WHERE ea.application_id = $1
        `;
        return await this.db.query<Evaluator>(query, [applicationId]);
    }

    async insert(evaluatorId: string | null, llmResponseId: string | null, results: string): Promise<string | undefined> {
        const query = `
            INSERT INTO holokai.evaluators_data(evaluator_id, llmresponse_id, results)
            VALUES ($1, $2, $3)
            RETURNING id;
        `;
        const newRecord = await this.db.queryOne<{ id: string }>(query, [
            evaluatorId || null,
            llmResponseId || null,
            results || null
        ]);
        return newRecord?.id;
    }

    async getPrompt(id: string): Promise<Prompt | null> {
        const query = `
            SELECT *
            FROM prompts
            WHERE id = $1
        `;
        return await this.db.queryOne<Prompt>(query, [id]);
    }

    async getData(id: string): Promise<EvaluatorData | null> {
        const query = `
            SELECT *
            FROM evaluators_data
            WHERE id = $1
        `;
        return await this.db.queryOne<EvaluatorData>(query, [id]);
    }

    async getDataByDateRange(startDate: Date, endDate: Date, userId: string, eventName: string): Promise<EvaluatorData[] | null> {
        const query = `
            SELECT *
            FROM evaluators_data
            WHERE created_at >= $1
              AND created_at <= $2
              AND results -> 'reference' ->> 'user_id' = $3
              AND results -> 'reference' ->> 'event_name' = $4
            ORDER BY created_at
        `;
        return await this.db.query<EvaluatorData>(query, [startDate, endDate, userId, eventName]);
    }

    async getUngradedEvaluatorData(): Promise<EvaluatorData[]> {
        const query = `
            SELECT *
            FROM evaluators_data
            WHERE raw_score IS NULL
        `;
        return await this.db.query<EvaluatorData>(query, []);
    }

    async updateEvaluatorDataScore(id: string, rawScore: number, scaledScore: number): Promise<void> {
        const query = `
            UPDATE evaluators_data
            SET raw_score    = $1,
                scaled_score = $2
            WHERE id = $3
        `;
        await this.db.query(query, [rawScore, scaledScore, id]);
    }

    async getApplicationByName(name: string): Promise<Application | null> {
        const query = `SELECT *
                       FROM applications
                       WHERE name = $1
        `;
        return this.db.queryOne<Application>(query, [name]);
    }

    async getProvider(name: string): Promise<Provider | null> {
        const query = `SELECT *
                       FROM providers
                       WHERE name = $1
                         AND enabled = true
                         AND available = true`;
        return await this.db.queryOne<Provider>(query, [name]);
    }

    async getResponse(id: string): Promise<LlmResponse | null> {
        const query = `
            SELECT *
            FROM llm_responses
            WHERE id = $1`;
        return await this.db.queryOne<LlmResponse>(query, [id]);
    }

    async getUserIdByEmail(email: string): Promise<string | null> {
        const query = `SELECT id
                       FROM app_users
                       WHERE email = $1`;
        return await this.db.queryOne<string | null>(query, [email]);
    }

    async getAnalysisResultByName(name: string): Promise<AnalysisResult | null> {
        const query = `SELECT *
                       FROM analysis_results
                       WHERE analysis_name = $1`;
        return await this.db.queryOne<AnalysisResult | null>(query, [name]);
    }

    async insertAnalysisResult(analysisName: string, metrics: string): Promise<string | null> {
        const query = `
            INSERT INTO analysis_results (analysis_name, results)
            VALUES ($1, $2)
            RETURNING id
        `;
        const newrec = await this.db.queryOne<{ id: string }>(query, [analysisName, metrics]);
        return newrec?.id || '';
    }

    async updateAnalysisResult(results: string, id: string): Promise<void> {
        const query = `
            UPDATE analysis_results
            SET results = $1
            WHERE id = $2
        `;
        await this.db.query(query, [results, id]);
    }
}