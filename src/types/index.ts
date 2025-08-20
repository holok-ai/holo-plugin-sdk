export * from './config.types';
export * from './mixin.types';
export * from './worker.request.types';
export {ProviderType} from './provider.types';

export interface AnalysisEvent {
    id: string;
    created_at: Date;
    user_id: string | null;
    event_source: 'claude' | 'azurepr' | 'github' | null;
    event_data: any;
    parameters: any;
}
