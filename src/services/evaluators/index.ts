import {IEvaluator} from '../../types/evaluator.types';
import {WebhookClassifier} from './internal.webhook-classifier';
import {ApplicationEvaluator} from './application.evaluator';
import {PromptEvaluator} from './prompt.evaluator';
import {ResponseCompleteEvaluator} from './internal.response-complete';
import {CalculatePrMetrics} from './internal.calculate-prmetrics';
import {EvaluatorDB} from '../../db';

export function createInternalEvaluators(evaluatorDb: EvaluatorDB): IEvaluator[] {
    return [
        new WebhookClassifier(evaluatorDb),
        new ResponseCompleteEvaluator(evaluatorDb),
        new CalculatePrMetrics(evaluatorDb)
    ];
}

export {ApplicationEvaluator, PromptEvaluator};