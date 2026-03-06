import {injectable} from "tsyringe";
import {AppDB} from "./app.db";
import {ProviderRequest} from "@holokai/types/entities";

@injectable()
export class RequestDB {
    constructor(private db: AppDB) {

    }

    async insert(request: Omit<ProviderRequest, 'id'>) {
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
            thread_id,
            timestamp,
            metadata
        } = request;

        const query = `
            INSERT INTO provider_requests
            (organization_id, request_id, application_id, provider_id, protocol_id, capability, user_id, client_identifier, access_model, thread_id, timestamp, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;

        await this.db.query(query, [
            organization_id,
            request_id,
            application_id,
            provider_id,
            protocol_id,
            capability,
            user_id,
            client_identifier,
            access_model,
            thread_id,
            timestamp,
            JSON.stringify(metadata)
        ]);
    }
}
