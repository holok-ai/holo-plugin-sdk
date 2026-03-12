import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {AppDB} from './app.db';
import {ClassLogger} from '@holokai/sdk';

@injectable()
export class AccessDB extends ClassLogger {
    constructor(private db: AppDB) {
        super();
    }

    async hasAccess(orgId: string, userId: string, applicationId: string): Promise<boolean> {
        return this.db.asUser(orgId, async (client) => {
            const result = await client.query(ACCESS_CHECK_QUERY, [userId, applicationId]);
            return result.rows[0]?.exists ?? false;
        });
    }

    async getAccessibleApplicationIds(userId: string, orgId: string): Promise<string[]> {
        return this.db.asUser(orgId, async (client) => {
            const result = await client.query(ACCESSIBLE_APPS_QUERY, [userId, orgId]);
            return result.rows.map((r: { id: string }) => r.id);
        });
    }

    async getUserEmailById(orgId: string, userId: string): Promise<string | null> {
        return this.db.asUser(orgId, async (client) => {
            const result = await client.query(
                `SELECT email FROM app_users WHERE id = $1`, [userId]
            );
            return result.rows[0]?.email ?? null;
        });
    }

    async getUserIdByEmail(orgId: string, email: string): Promise<string | null> {
        return this.db.asUser(orgId, async (client) => {
            const result = await client.query(
                `SELECT id FROM app_users WHERE upper(email) = upper($1)`, [email]
            );
            return result.rows[0]?.id ?? null;
        });
    }

    async hasModelAccess(orgId: string, userId: string, applicationId: string, accessModel: string): Promise<boolean> {
        return this.db.asUser(orgId, async (client) => {
            const result = await client.query(MODEL_ACCESS_QUERY, [userId, applicationId, accessModel]);
            return result.rows[0]?.exists ?? false;
        });
    }
}

const ACCESS_CHECK_QUERY = `
    SELECT EXISTS (
        SELECT 1 FROM user_applications WHERE user_id = $1 AND application_id = $2
        UNION ALL
        SELECT 1 FROM user_teams ut
            JOIN teams user_team ON ut.team_id = user_team.id
            JOIN team_applications ta ON ta.application_id = $2
            JOIN teams app_team ON ta.team_id = app_team.id
        WHERE ut.user_id = $1 AND app_team.path <@ user_team.path
        UNION ALL
        SELECT 1 FROM applications a
            JOIN app_users u ON u.organization_id = a.organization_id
        WHERE a.id = $2 AND u.id = $1 AND a.access_level = 'organization'
        UNION ALL
        SELECT 1 FROM applications WHERE id = $2 AND access_level = 'anonymous'
    )
`;

const ACCESSIBLE_APPS_QUERY = `
    SELECT DISTINCT a.id
    FROM applications a
    WHERE a.active = true AND a.organization_id = $2 AND (
        EXISTS (SELECT 1 FROM user_applications ua WHERE ua.user_id = $1 AND ua.application_id = a.id)
        OR EXISTS (
            SELECT 1 FROM user_teams ut
                JOIN teams user_team ON ut.team_id = user_team.id
                JOIN team_applications ta ON ta.application_id = a.id
                JOIN teams app_team ON ta.team_id = app_team.id
            WHERE ut.user_id = $1 AND app_team.path <@ user_team.path
        )
        OR (a.access_level = 'organization' AND EXISTS (
            SELECT 1 FROM app_users u WHERE u.id = $1 AND u.organization_id = a.organization_id
        ))
        OR a.access_level = 'anonymous'
    )
`;

const MODEL_ACCESS_QUERY = `
    SELECT EXISTS (
        SELECT 1
        FROM applications a
            JOIN application_models am ON am.application_id = a.id
            JOIN models m ON m.id = am.model_id
        WHERE a.id = $2
          AND m.access_model = $3
          AND m.active = true
          AND (
              EXISTS (SELECT 1 FROM user_applications WHERE user_id = $1 AND application_id = a.id)
              OR EXISTS (
                  SELECT 1 FROM user_teams ut
                      JOIN teams user_team ON ut.team_id = user_team.id
                      JOIN team_applications ta ON ta.application_id = a.id
                      JOIN teams app_team ON ta.team_id = app_team.id
                  WHERE ut.user_id = $1 AND app_team.path <@ user_team.path
              )
              OR (a.access_level = 'organization' AND EXISTS (
                  SELECT 1 FROM app_users u WHERE u.id = $1 AND u.organization_id = a.organization_id
              ))
              OR a.access_level = 'anonymous'
          )
    )
`;
