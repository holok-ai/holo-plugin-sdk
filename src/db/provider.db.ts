import 'reflect-metadata';
import {AppDB} from "./app.db";
import {injectable} from "tsyringe";
import {Provider} from "@holokai/sdk/dist/core/entities";

@injectable()
export class ProviderDB {
    constructor(private db: AppDB) {

    }

    async list(): Promise<Provider[]> {
        const query = `
            SELECT *
            FROM providers
            WHERE enabled = true
              AND available = true
            ORDER BY name
        `;
        return this.db.query<Provider>(query);
    }

    async get(name: string): Promise<Provider | null> {
        const query = `SELECT *
                       FROM providers
                       WHERE name = $1
                         AND enabled = true
                         AND available = true`;
        return this.db.queryOne<Provider>(query, [name]);
    }
}
