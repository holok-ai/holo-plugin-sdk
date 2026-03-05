export interface BaseEntity {
    id: string;
    created_at: Date;
    updated_at: Date;
    created_by?: string;
    last_modified_by?: string;
}
