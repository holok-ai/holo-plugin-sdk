export interface AnalysisResult {
    id: string;  // uuid
    created_at: Date;
    analysis_name: string | null;
    reference: Record<string, any>;  // jsonb
    results: Record<string, any>;    // jsonb
}