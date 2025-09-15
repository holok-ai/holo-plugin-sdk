import { IEvaluator, EvaluatorResult } from '../../types/evaluator.types';
import { EvaluatorDB } from '../../db';

export abstract class InternalEvaluatorBase implements IEvaluator {
    readonly runType = "internal";
    readonly allowUserOverride = false;
    
    abstract readonly evaluatorId: string;
    abstract readonly handlesEventName: string;
    abstract readonly evaluatorName: string;
    
    constructor(protected evaluatorDb: EvaluatorDB) {}
    
    abstract evaluate(data: any): Promise<EvaluatorResult>;
}