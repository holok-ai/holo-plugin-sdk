import 'reflect-metadata';
import {AppDB} from "./app.db";
import {injectable} from "tsyringe";
import {Model} from "@holokai/types/entities";

@injectable()
export class ModelDB {
    constructor(private db: AppDB) {

    }

    async list(): Promise<Model[]> {
        const query = `
            SELECT *
            FROM models
            WHERE enabled = true
              AND available = true
            ORDER BY name
        `;
        return this.db.query<Model>(query);
    }

    async get(name: string): Promise<Model | null> {
        const query = `SELECT *
                       FROM models
                       WHERE name = $1
                         AND available = true
                         AND enabled = true`;
        return this.db.queryOne<Model>(query, [name]);
    }

    async getById(id: string): Promise<Model | null> {
        const query = `
            SELECT *
            FROM models
            WHERE id = $1 AND active = true
        `;
        return this.db.queryOne<Model>(query, [id]);
    }

    async listByProvider(providerId: string): Promise<Model[]> {
        const query = `
            SELECT *
            FROM models
            WHERE provider_id = $1 AND active = true
            ORDER BY name
        `;
        return this.db.query<Model>(query, [providerId]);
    }

    async listByOrganization(orgId: string): Promise<Model[]> {
        const query = `
            SELECT *
            FROM models
            WHERE organization_id = $1 AND active = true
            ORDER BY name
        `;
        return this.db.query<Model>(query, [orgId]);
    }
}
