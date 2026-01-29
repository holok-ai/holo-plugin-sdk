import {injectable} from "tsyringe";
import {AppDB} from "./app.db";
import {LlmRequest} from "@holokai/sdk/dist/core/entities";

@injectable()
export class RequestDB {
    constructor(private db: AppDB) {

    }

    async insert(request: Omit<LlmRequest, 'id'>) {
        const {
            organization_id,
            request_id,
            request_type,
            model_slug,
            user_prompt,
            options,
            source_id,
            user_id,
            thread_id,
            branch_id,
            timestamp,
            raw_request,
            application_id,
            provider_slug,
            system_prompt
        } = request;

        const query = `
            INSERT INTO llm_requests
            (organization_id, request_id, request_type, model_slug, user_prompt, options, source_id, user_id, thread_id, branch_id, timestamp, raw_request, application_id, provider_slug, system_prompt)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `;

        await this.db.query(query, [
            organization_id,
            request_id,
            request_type,
            model_slug,
            user_prompt,
            JSON.stringify(options),
            source_id,
            user_id,
            thread_id,
            branch_id,
            timestamp,
            JSON.stringify(raw_request),
            application_id,
            provider_slug,
            system_prompt
        ]);
    }
}
