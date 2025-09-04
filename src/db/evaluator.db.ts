import { injectable } from "tsyringe";
import { AppDB } from "./app.db";
import { Evaluator, LlmResponse, Prompt, Provider } from "./types";

@injectable()
export class EvaluatorDB {
    constructor(private db: AppDB) {
    }
    async getEvaluator(id: string): Promise<Evaluator | null> {
        const query = `
            SELECT *
            FROM evaluators
            WHERE id = $1  
                `;
        return await this.db.queryOne<Evaluator>(query, [id]);
    }
    async getPrompt(id: string): Promise<Prompt | null> {
        const query = `
            SELECT *
            FROM prompts 
            WHERE id = $1        `;
        return await this.db.queryOne<Prompt>(query, [id]);
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

    async insert(results: String, evaluatorId: String, llmResponseId: String, applicationId: String, userId: String, organizationId: String): Promise<void> {
        const query = `
        INSERT INTO holokai.evaluators_data(
	    evaluator_id, llmresponse_id, application_id, user_id, organization_id, results)
	    VALUES ($1, $2, $3, $4, $5, $6);
    `;
       await this.db.query(query, [
            evaluatorId || null,
            llmResponseId || null, 
            applicationId || null, 
            userId || null, 
            organizationId || null, 
            results ? JSON.stringify({ result: results }) : null
        ]);
    }

}