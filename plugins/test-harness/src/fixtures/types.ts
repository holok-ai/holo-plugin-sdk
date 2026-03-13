import type {LlmStatus} from '@holokai/types/entities';

export interface FixtureScenario {
    name: string;
    plugin: string;
    protocol: string;
    streaming: boolean;

    providerChunks: any[];
    expectedText: string;

    expectedWire: string[];
    expectedStatus: number;
    expectedHeaders: Record<string, string>;

    expectedAudit?: {
        access_model: string;
        input_tokens?: number;
        output_tokens?: number;
        status: LlmStatus;
        metadata?: Record<string, any>;
    };

    expectedSdkResult?: any;
    sdkRequest?: any;

    tags?: string[];
}

export interface SdkAdapter {
    family: string;
    call(fixture: FixtureScenario, port: number): Promise<any>;
    routes(fixture: FixtureScenario): { method: string; path: string } | undefined;
}
