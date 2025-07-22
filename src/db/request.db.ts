import {injectable} from "tsyringe";
import {AppDB} from "./app.db";
import {LlmRequest} from "./types";

@injectable()
export class RequestDB {
    constructor(private db: AppDB) {

    }

    async insert(request: Omit<LlmRequest, 'id'>) {
        const {
            request_id,
            request_type,
            model,
            prompt,
            options,
            source_id,
            user_id,
            timestamp,
            metadata
        } = request;

        const query = `
            INSERT INTO llm_requests
            (request_id, request_type, model, prompt, options, source_id, user_id, timestamp, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;

        await this.db.query(query, [
            request_id,
            request_type,
            model,
            prompt,
            JSON.stringify(options),
            source_id,
            user_id,
            timestamp,
            JSON.stringify(metadata)
        ]);
    }
}
