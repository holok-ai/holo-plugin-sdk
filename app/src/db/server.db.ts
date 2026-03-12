import 'reflect-metadata';
import os from 'os';
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

    async ping(serverId: string): Promise<void> {
        await this.db.query(`UPDATE servers SET last_online = now() WHERE id = $1`, [serverId]);
    }

    async getByName(name: string): Promise<Server | null> {
        return this.db.queryOne<Server>(
            `SELECT *
             FROM servers
             WHERE name = $1`,
            [name]);
    }

    async registerPlugin(serverName: string, pluginId: string): Promise<boolean> {
        const query = `
            INSERT INTO server_plugins (server_id, plugin_id)
            SELECT s.id, $2
            FROM servers s
            WHERE s.name = $1
            ON CONFLICT (server_id, plugin_id) DO NOTHING
            RETURNING *
        `;
        const result = await this.db.queryOne<{ server_id: string, plugin_id: string }>(query, [serverName, pluginId]);
        return result != null;
    }

    async recordHeartbeat(serverId: string): Promise<void> {
        const nets = os.networkInterfaces();
        const ip = Object.values(nets).flat().find(n => n && !n.internal && n.family === 'IPv4')?.address;

        const query = `
            INSERT INTO server_heartbeats
                (server_id, hostname, ip_address, platform, arch, node_version,
                 memory_total, memory_free, cpu_count, uptime, pid)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;
        await this.db.query(query, [
            serverId,
            os.hostname(),
            ip || null,
            os.platform(),
            os.arch(),
            process.version,
            os.totalmem(),
            os.freemem(),
            os.cpus().length,
            Math.floor(process.uptime()),
            process.pid,
        ]);
    }

    async syncPlugins(serverName: string, activePluginIds: string[]): Promise<number> {
        if (!activePluginIds.length) {
            const result = await this.db.query(
                `DELETE FROM server_plugins
                 WHERE server_id = (SELECT id FROM servers WHERE name = $1)`,
                [serverName]
            );
            return (result as any).rowCount ?? 0;
        }

        const placeholders = activePluginIds.map((_, i) => `$${i + 2}`).join(', ');
        const result = await this.db.query(
            `DELETE FROM server_plugins
             WHERE server_id = (SELECT id FROM servers WHERE name = $1)
               AND plugin_id NOT IN (${placeholders})`,
            [serverName, ...activePluginIds]
        );
        return (result as any).rowCount ?? 0;
    }
}
