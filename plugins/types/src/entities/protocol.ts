export interface Protocol {
    id: string;
    plugin_id: string;
    key: string;
    name: string;
    capability: string;
    path?: string;
    active: boolean;
    created_at: Date;
}
