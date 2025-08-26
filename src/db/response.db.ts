import {injectable} from "tsyringe";
import {AppDB} from "./app.db";
import {LlmResponse} from "./types";

@injectable()
export class ResponseDB {
    constructor(private db: AppDB) {

    }

    async insert(response: Omit<LlmResponse, 'id'>) {
        const {
            organization_id,
            created_at,
            user_id,
            application_id,
            request_id,
            provider_slug,
            model_slug,
            status,
            error_message,
            response: responseText,
            response_raw,
            input_tokens,
            output_tokens,
            time_to_first_token,
            total_processing_time,
            cost,
            score,
            worker_id
        } = response;

        const query = `
            INSERT INTO llm_responses
            (organization_id, created_at, user_id, application_id, request_id, provider_slug, model_slug, status,
             error_message, response, response_raw, input_tokens, output_tokens, time_to_first_token,
             total_processing_time, cost, score, worker_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        `;

        return this.db.query<LlmResponse>(query, [
            organization_id,
            created_at,
            user_id,
            application_id,
            request_id,
            provider_slug,
            model_slug,
            status,
            error_message,
            responseText,
            JSON.stringify(response_raw),
            input_tokens,
            output_tokens,
            time_to_first_token,
            total_processing_time,
            cost,
            score,
            worker_id
        ]);
    }
}
