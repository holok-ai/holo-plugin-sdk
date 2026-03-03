export interface AnalysisResult {
    id: string;
    created_at: Date;
    analysis_name: string | null;
    reference: Record<string, any>;
    results: Record<string, any>;
}
