import 'reflect-metadata';
import {injectable} from "tsyringe";
import {ClassLogger} from "@holokai/sdk";
import {AppDB} from "./app.db";
import {Server, ServerType} from "@holokai/types/entities";

@injectable()
export class ServerDB extends ClassLogger {
    constructor(private db: AppDB) {
        super();
    }

    async upsert(name: string, type: ServerType): Promise<Server | null> {

        const query = `
            INSERT INTO servers (name, type)
            VALUES ($1, $2)
            ON CONFLICT (name) DO UPDATE SET last_online = now()
            RETURNING *
        `;

        return this.db.queryOne<Server>(query, [name, type]);
    }

    async getByName(name: string): Promise<Server | null> {
        return this.db.queryOne<Server>(
            `SELECT *
             FROM servers
             WHERE name = $1`,
            [name]);
    }

    async registerPlugin(serverName: string, pluginId: string): Promise<boolean> {
        const query = `INSERT INTO server_plugins (server_id, plugin_id)
                       SELECT s.id, $2
                       FROM servers s
                       WHERE name = $1
                       RETURNING *`;

        const result = await this.db.queryOne<{ server_id: string, plugin_id: string }>(query, [serverName, pluginId]);

        return result != null;
    }

    // async cleanupPlugins(serverId: string, pluginIds: string[]) Promise
}