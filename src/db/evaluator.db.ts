import { injectable } from "tsyringe";
import { AppDB } from "./app.db";
import { Application, Evaluator, EvaluatorData, LlmResponse, Prompt, Provider } from "./types";

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
    async list(applicationId: string): Promise<Evaluator[]> {
        const query = `
            SELECT e.*
            FROM evaluators e
            JOIN evaluator_applications ea ON e.id = ea.evaluator_id
            WHERE ea.application_id = $1
        `;
        return await this.db.query<Evaluator>(query, [applicationId]);
    }
    async insert(evaluatorId: string, llmResponseId: string, results: string): Promise<string | undefined> {
        const query = `
        INSERT INTO holokai.evaluators_data(
	    evaluator_id, llmresponse_id, results)
	    VALUES ($1, $2, $3)
        RETURNING id;
    `;
       const newRecord = await this.db.queryOne<{id: string}>(query, [
            evaluatorId || null,
            llmResponseId || null, 
            results || null            
        ]);
        return newRecord?.id;
    }
    async getData(id: string): Promise<EvaluatorData | null> {
        const query = `
            SELECT *
            FROM evaluators_data
            WHERE id = $1  
                `;
        return await this.db.queryOne<EvaluatorData>(query, [id]);
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
            SET raw_score = $1, scaled_score = $2
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
    async getPrompt(id: string): Promise<Prompt | null> {
        const query = `
            SELECT *
            FROM prompts 
            WHERE id = $1        `;
        return await this.db.queryOne<Prompt>(query, [id]);
    }
    async getPromptByName(name: string): Promise<Prompt | null> {
        const query = `SELECT *
                       FROM prompts
                       WHERE name = $1
                            `;
        return this.db.queryOne<Prompt>(query, [name]);
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
  

}