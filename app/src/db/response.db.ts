import {injectable} from "tsyringe";
import {AppDB} from "./app.db";
import {ProviderResponse} from "@holokai/types/entities";

@injectable()
export class ResponseDB {
    constructor(private db: AppDB) {

    }

    async insert(response: Omit<ProviderResponse, 'id'>): Promise<{ id: string } | null> {
        const {
            organization_id,
            request_id,
            application_id,
            provider_id,
            protocol_id,
            capability,
            user_id,
            client_identifier,
            access_model,
            status,
            response: responseText,
            input_tokens,
            output_tokens,
            time_to_first_token,
            total_processing_time,
            cost,
            score,
            created_at,
            metadata
        } = response;

        const query = `
            INSERT INTO provider_responses
            (organization_id, request_id, application_id, provider_id, protocol_id, capability, user_id, client_identifier, access_model,
             status, response, input_tokens, output_tokens, time_to_first_token, total_processing_time,
             cost, score, created_at, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING id
        `;

        return this.db.queryOne<{ id: string }>(query, [
            organization_id,
            request_id,
            application_id,
            provider_id,
            protocol_id,
            capability,
            user_id,
            client_identifier,
            access_model,
            status,
            responseText,
            input_tokens,
            output_tokens,
            time_to_first_token,
            total_processing_time,
            cost,
            score,
            created_at,
            JSON.stringify(metadata)
        ]);
    }
}
