export interface EvaluatorData {
    id: string;
    created_at: Date;
    evaluator_id: string;
    llmresponse_id: string;
    results: Record<string, any>;
    scoring: Record<string, any>;
}
