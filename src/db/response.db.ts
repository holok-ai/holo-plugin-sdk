import {injectable} from "tsyringe";
import {AppDB} from "./app.db";
import {LlmResponse} from "./types";

@injectable()
export class ResponseDB {
    constructor(private db: AppDB) {

    }

    async insert(response: Omit<LlmResponse, 'id'>) {
        const {
            request_id,
            response_type,
            token,
            model,
            worker_id,
            timestamp,
            is_final,
            total_tokens,
            processing_time,
            tokens_per_second,
            metadata
        } = response;

        const query = `
            INSERT INTO llm_responses
            (request_id, response_type, token, model, worker_id, timestamp, is_final,
             total_tokens, processing_time, tokens_per_second, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

        return this.db.query<LlmResponse>(query, [
            request_id,
            response_type,
            token,
            model,
            worker_id,
            timestamp,
            is_final,
            total_tokens,
            processing_time,
            tokens_per_second,
            JSON.stringify(metadata)
        ]);
    }
}
