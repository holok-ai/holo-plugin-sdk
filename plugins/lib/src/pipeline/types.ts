import type {ProviderEvent, WireChunk} from '@holokai/types/provider';
import type {ProviderResponse} from '@holokai/types/entities';

export interface PipelineResult {
    wireChunks: WireChunk[];
    auditRecord: ProviderResponse | null;
    events: ProviderEvent[];
    text: string;
}
