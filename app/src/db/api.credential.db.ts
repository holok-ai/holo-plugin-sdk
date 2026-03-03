import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {AppDB} from './app.db';
import {ClassLogger} from '@holokai/sdk';

export interface ApiCredential {
    id: string;
    organization_id: string;
    encrypted_value: string;
    initialization_vector: string;
    created_at: Date;
    updated_at: Date;
}

@injectable()
export class ApiCredentialDB extends ClassLogger {
    constructor(private db: AppDB) {
        super();
    }

    async get(id: string): Promise<ApiCredential | null> {
        const query = `
            SELECT id, organization_id, encrypted_value, initialization_vector, created_at, updated_at
            FROM api_credentials
            WHERE id = $1
        `;
        return this.db.queryOne<ApiCredential>(query, [id]);
    }

    async getByOrganization(organizationId: string): Promise<ApiCredential[]> {
        const query = `
            SELECT id, organization_id, encrypted_value, initialization_vector, created_at, updated_at
            FROM api_credentials
            WHERE organization_id = $1
            ORDER BY created_at DESC
        `;
        return this.db.query<ApiCredential>(query, [organizationId]);
    }
}
