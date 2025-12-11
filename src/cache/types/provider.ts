export interface Provider {
    id: string;
    name: string;
    type: string;
    config: Record<string, any>;
}
