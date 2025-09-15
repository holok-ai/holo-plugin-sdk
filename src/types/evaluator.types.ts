import { Prompt, Provider, LlmResponse, EvaluatorData } from '../db/types';

interface BaseEvent {
    timestamp: number;
    eventName: string; 
    context?: { key: string; value: any; }[];
 }

export interface AuditServiceEvent extends BaseEvent {
  source: "audit";
  evaluatorId?: string;
  llmResponseDataId: string;
}

export interface MokuEvent extends BaseEvent {
  source: "moku";
  analysisEventId: string; 
}

export interface EvaluatorServiceEvent extends BaseEvent {
  source: "evaluator";
  evaluatorDataId?: string | undefined;
  llmResponseDataId?: string | undefined; 
}


export type EvaluatorEvent = AuditServiceEvent | MokuEvent | EvaluatorServiceEvent;


export interface EvaluatorResult {
  status: string, 
  message: string, 
  resultsFileName?: string,
  next_events: EvaluatorServiceEvent[];
  result?: {key: string, value: Record<string, any>};
  organizationId?: string;
  userId?: string;
  applicationId?: string;
}

export interface EvaluatorsDataResults {
  status: {
    status: string;
    message: string;
    next_events: EvaluatorServiceEvent[];
  };
  reference: {
    organization_id: string;
    user_id: string;
    application_id: string;
    event_name: string;
    event_source: string;
    evaluator_type: string;
    evaluator_id: string;
    evaluator_name: string;
    saved_data_id: string, 
  };
  data: any;
}

export interface IEvaluator {
  evaluatorId: string;
  handlesEventName: string;
  allowUserOverride: boolean;
  runType: string;
  evaluatorName: string;
  evaluate(data: any): Promise<EvaluatorResult>;
}

export interface IPromptEvaluator extends IEvaluator {
  promptId: string;
  prompt: Prompt;
  provider: Provider;
  llmResponse: LlmResponse;
  evaluatorData: EvaluatorData;
}

export interface IApplicationEvaluator extends IEvaluator {
  command: string;
  args: string[];
  env: Record<string, string>;
  cwd: string;
} 

// DTOs that can be serialized and passed to an evaluator
export class AnalysisEventDTO {
    id: string = '';
    created_at!: Date;
    user_id?: string;
    event_source: string = '';
    event_data?: Record<string, any>;
    parameters?: Record<string, any>;
}

export class AnalysisEventMapper {
    static fromRow(row: any): AnalysisEventDTO {
      const event = new AnalysisEventDTO();
      event.id = row.id;
      event.created_at = row.created_at;
      event.user_id = row.user_id;
      event.event_source = row.event_source;
      event.event_data = row.event_data;
      event.parameters = row.parameters;
      return event;
    }
}

export class LlmResponseDTO {
    id: string = '';
    created_at!: Date;
    user_id?: string;
    application_id: string = 'default';
    worker_id: string = '';
    request_id: string = '';
    provider_slug: string = '';
    model_slug: string = '';
    status: string = '';
    error_message?: string;
    response?: string;
    response_raw?: Record<string, any>;
    input_tokens?: number;
    output_tokens?: number;
    time_to_first_token?: number;
    total_processing_time?: number;
    cost: number = 0.0;
    score?: number;
    organization_id?: string;
}

export class LlmResponseMapper {
    static fromRow(row: any): LlmResponseDTO {
      const response = new LlmResponseDTO();
      response.id = row.id;
      response.created_at = row.created_at;
      response.user_id = row.user_id;
      response.application_id = row.application_id;
      response.worker_id = row.worker_id;
      response.request_id = row.request_id;
      response.provider_slug = row.provider_slug;
      response.model_slug = row.model_slug;
      response.status = row.status;
      response.error_message = row.error_message;
      response.response = row.response;
      response.response_raw = row.response_raw;
      response.input_tokens = row.input_tokens;
      response.output_tokens = row.output_tokens;
      response.time_to_first_token = row.time_to_first_token;
      response.total_processing_time = row.total_processing_time;
      response.cost = row.cost;
      response.score = row.score;
      response.organization_id = row.organization_id;
      return response;
    }
}

