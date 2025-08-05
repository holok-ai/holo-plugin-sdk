import 'reflect-metadata';
import {AppDB} from "./app.db";
import {Model} from "./types";
import {injectable} from "tsyringe";

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
}
