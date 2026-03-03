import 'reflect-metadata';
import {AppDB} from "./app.db";
import {injectable} from "tsyringe";
import {Provider} from "@holokai/types/entities";

export interface ProviderWithCredential extends Provider {
    encrypted_value?: string;
    initialization_vector?: string;
}

@injectable()
export class ProviderDB {
    constructor(private db: AppDB) {

    }

    async list(): Promise<ProviderWithCredential[]> {
        const query = `
            SELECT p.*,
                   ac.encrypted_value,
                   ac.initialization_vector
            FROM providers p
                     LEFT JOIN api_credentials ac ON p.api_credential_id = ac.id
            WHERE p.enabled = true
              AND p.available = true
            ORDER BY p.name
        `;
        return this.db.query<ProviderWithCredential>(query);
    }

    async get(name: string): Promise<ProviderWithCredential | null> {
        const query = `
            SELECT p.*,
                   ac.encrypted_value,
                   ac.initialization_vector
            FROM providers p
                     LEFT JOIN api_credentials ac ON p.api_credential_id = ac.id
            WHERE p.name = $1
              AND p.enabled = true
              AND p.available = true
        `;
        return this.db.queryOne<ProviderWithCredential>(query, [name]);
    }
}
