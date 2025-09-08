 interface BaseQMessage {
    timestamp: number;
    evaluatorId: string;
    responseId: string;
 }

export interface AnalyzerQMessage extends BaseQMessage {
  taskType: "analyzer";
  applicationId: string; 
}

export interface GraderQMessage extends BaseQMessage {
  taskType: "grader";
  dataId: string;             // evaluator_data id
}

export type EvaluatorMessage = AnalyzerQMessage | GraderQMessage;