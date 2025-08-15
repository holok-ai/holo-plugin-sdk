export interface AnalysisProcessor {
    processTask(analysisEventId: string, eventType: string, data: any, parameterData: string): Promise<void>;
}

export interface AnalysisRequest {
    eventId: string;
    eventType: string;
}