import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {AppDB} from './app.db';
import {ClassLogger} from '@holokai/sdk';

@injectable()
export class AccessDB extends ClassLogger {
    constructor(private db: AppDB) {
        super();
    }

    async hasAccess(userId: string, applicationId: string): Promise<boolean> {
        return await this.db.queryScalar<boolean>(ACCESS_CHECK_QUERY, [userId, applicationId]) ?? false;
    }

    async getAccessibleApplicationIds(userId: string, orgId: string): Promise<string[]> {
        const rows = await this.db.query<{ id: string }>(ACCESSIBLE_APPS_QUERY, [userId, orgId]);
        return rows.map(r => r.id);
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
