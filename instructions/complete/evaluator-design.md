# Evaluator System Design

## Overview

The Evaluator System is a comprehensive event-driven architecture designed to process, analyze, and respond to various types of events within the Holokai platform. The system provides a flexible framework for implementing different types of evaluators that can process webhooks, analyze LLM responses, and chain together complex evaluation workflows.

The evaluator system serves as a critical component for:
- Processing events from Moku received from external services (GitHub, Azure DevOps)
- Analyzing LLM responses for quality and compliance
- Running prompts for specific events or against data in the holokai database
- Creating evaluation chains for multi-step analysis workflows
- Providing audit trails and data collection for analytics

## Architecture

### High-Level Components

```
┌──────────────────┐     ┌──────────────────┐    ┌─────────────────┐
│ Event Sources    │───▶│  Evaluator       │───▶│   Data Storage  │
│ - Moku           │     │  Service         │    │   - PostgreSQL  │
│ - Audit Svc      │     │                  │    │                 │
│ - Evaluator Svc  │     └──────────────────┘    └─────────────────┘
└──────────────────┘           │                         
                               ▼                         
                    ┌──────────────────┐                 
                    │   Evaluator      │                 
                    │   Registry       │                 
                    │   - Internal     │                 
                    │   - Application  │                 
                    │   - Prompt       │                 
                    └──────────────────┘                 
```

### Core Architecture Principles

1. **Event-Driven Processing**: All evaluator operations are triggered by events flowing through RabbitMQ queues
2. **Pluggable Evaluator System**: Support for multiple evaluator types with a common interface
3. **Chain-able Evaluations**: Evaluators can trigger follow-on evaluations via next_events
4. **Context Passing**: Rich context data flows between chained evaluators
5. **Flexible Data Storage**: Support for both inline data and file-based storage for large datasets
6. **Audit Trail**: Complete traceability of evaluation workflows and results

## Evaluator Design

The evaluator service uses "events" from the evaluator Q as the trigger for evaluators. Event names are contained in the Q message. 
For example, the event "response-complete" will cause the Evaluator to look for an evaluator that handles that event,
and then run it. Internal evaluators have static events, while the event name that Prompt and Application evaluators
handle is configured in the associated evaluator database record. A Python application of "git-pullrequest.closed.py"
is configured to handle the "pullrequest" event. 

### Core Interface

All evaluators implement the `IEvaluator` interface:

```typescript
export interface IEvaluator {
  evaluatorId: string;           // Unique identifier
  handlesEventName: string;      // Event type this evaluator processes
  allowUserOverride: boolean;    // Whether users can override this evaluator
  runType: string;              // "internal", "application", or "prompt"
  evaluatorName: string;        // Human-readable name for identification
  evaluate(data: any): Promise<EvaluatorResult>;  // Main evaluation method
}
```

The internal evaluators define a class implementing IEvaluator. Prompt and application evaluators are instantiated with their evaluator data. 
The prompt-evaluator.ts and application-evaluator.ts are found in the src\services\evaluators folder. 

### Evaluator Result Structure

```typescript
export interface EvaluatorResult {
  status: string;                    // "ok" or "error"
  message: string;                   // Human-readable message
  resultsFileName?: string;          // Path to file containing large results
  next_events: EvaluatorServiceEvent[];  // Chain to next evaluators
  result?: {key: string, value: Record<string, any>};  // Evaluation output
  organizationId?: string;           // Organization context
  userId?: string;                   // User context
  applicationId?: string;           // Application context
}
```

### Data Results Storage

The evaluator returns data in the format of EvaluatorResult. The Evaluator Service adds context and metadata by wrapping EvaluatorResults in  EvaluatorDataResults, which is saved in the results field of evaluators_data. 

All evaluation results are stored using the `EvaluatorsDataResults` structure with three main sections: status information, reference metadata, and actual evaluation data.

## Evaluator Implementation

### Internal Evaluators

Internal evaluators are built-in evaluators written in TypeScript that handle platform-specific logic. They extend a common base class that provides database access and common functionality. 

**WebhookClassifier Example**: This internal evaluator processes incoming webhook events, identifies their source (GitHub, Azure DevOps, etc.), extracts relevant information like organization and repository details, and creates appropriate follow-on events. It also performs user ID lookups from email addresses when user context is not directly available.

**Key Features:**
- Built-in TypeScript implementations
- Direct database access for lookups
- Platform-specific business logic
- Event classification and routing

### Application Evaluators

Application evaluators execute external scripts and applications to perform evaluations. They spawn child processes, pass event data via stdin as JSON, and collect results from stdout.

**Configuration**: Each application evaluator is configured with a command (like "python"), arguments (script path), environment variables, and working directory. The system automatically extracts the script filename to use as the evaluator name.

**File Handling**: For large result sets, applications can write data to temporary files and return just the filename. The evaluator service automatically loads file contents when processing results.

**GitHub Pull Request Analyzer Example**: A Python script that receives pull request information, uses GitHub APIs to fetch detailed file changes and diffs, structures the data with metadata (source, organization, repository, PR ID), and returns either inline data for small responses or file references for large datasets.

**Key Features:**
- Support for multiple script languages (Python, Node.js, Go, shell scripts, executables)
- Automatic filename extraction for naming
- File-based output for large datasets (>16KB threshold)
- Environment variable and path substitution

### Prompt Evaluators

Prompt evaluators use LLM providers (primarily Ollama) to perform AI-based analysis and evaluation. They load prompt templates from the database, substitute variables with context data, and execute AI evaluations.

**Template System**: Prompts support handlebar-style variable substitution ({{table.field}}) that can reference data from prompts, LLM responses, and previous evaluator results. The system handles both string values and complex JSON objects.

**AI Integration**: These evaluators create chat requests with system and user prompts, support structured output formats, and parse responses as either JSON or plain text depending on the content.

**Key Features:**
- Database-stored prompt templates
- Variable substitution with context data
- Integration with Ollama for AI processing
- Support for structured output formats
- Context-aware evaluation using previous results

## Event Design

### Event Sources

The evaluator system processes events from three primary sources:

**Moku Events**: Originate from external webhook sources. These events reference entries in the analysis_events table and are typically the starting point for webhook processing workflows.

**Audit Events**: Triggered by LLM request/response auditing. These events reference entries in the llm_responses table and are used for quality assessment and compliance monitoring of AI interactions.

**Evaluator Events**: Created by other evaluators for chaining. These events can reference both evaluators_data and llm_responses tables, enabling complex multi-step evaluation workflows.

### Event Lookup

The system automatically loads relevant context data based on the event source. For Moku events, it loads analysis event data containing webhook payloads. For Audit events, it loads LLM response data. For Evaluator events, it can load both previous evaluator results and related LLM response data, enabling rich context passing between evaluation steps.

## Information Architecture

### Types and Mechanisms

The system uses a type-safe event hierarchy with a base event structure containing timestamp, event name, and context array. All evaluator inputs are union types that enable compile-time type checking while maintaining flexibility.

**Data Flow**: Events flow through RabbitMQ queues to the evaluator service, which enriches them with database context, routes them to appropriate evaluators, persists results, and queues any follow-on events.

### Context Data (from loadContext)

The context system provides evaluators with access to relevant platform data through a structured key-value system:

**analysis_events**: Contains webhook payloads and metadata from external services
**llm_responses**: Contains LLM request/response data for quality evaluation
**evaluators_data**: Contains results from previous evaluators in a chain
**previous**: Contains complete evaluation data from the immediate parent evaluator

Context access follows a consistent pattern where evaluators search the context array for specific keys and extract the associated values.

### Results

#### Storage Architecture

All evaluation results follow a three-tier storage model:

1. **Status Information**: Success/failure state and human-readable messages
2. **Reference Data**: Organizational context, user information, and evaluation metadata  
3. **Actual Data**: The evaluation output, either inline or file-referenced

This structure enables both operational monitoring (through status), analytics and auditing (through reference data), and result utilization (through actual data).

#### File Handling for Large Results

When evaluation results exceed storage thresholds, the system automatically handles file-based storage. Applications return a resultsFileName instead of inline data, and the evaluator service transparently loads file content when processing results.

#### Chain Data Propagation

When evaluators create follow-on events, the complete evaluation results are passed to the next evaluator in the context. This enables rich evaluation chains where each evaluator can build upon previous work, accessing both raw output data and complete metadata about the evaluation context.

The system maintains complete audit trails by preserving all evaluation data and metadata, supporting both operational monitoring and analytical insights into evaluation workflows.

## To Be Implemented

- Have internal evaluators listed in evaluators table so users can see events; also internal evaluators would have an id
- Include chained event definition in evaluator table so routing events does not require code changes - allow multiple chained events
- Expand context to pass different types of data (presently Audit passes an id for llmresponse, moku an id for analysis_event)
- Allow evaluator to add new data to an existing evaluators_data record, e.g. a grader adds a score section 
- Allow evaluator to specify that saveResults should update not insert when run on same data set - at present always inserts a new record
- Provide helpers in Python, Javascript and Go for accessing context and saving results data
- Replace static list of internal evaluators with code to scan the folder and look for classes that implement IEvaluator
- Evaluate options for storing large JSONB other than using a string in a SQL insert statement
- Investigate if response_raw ever contains a create event -- i found no instance of it but it could be either a bash cat or other method
- Apply organization filtering if an organization can be associated with external repository ids (ie this team is using this github repo)

---

**Last Updated**: 2025-09-14  
**Status**: Production Ready  (according to Claude)
**Related Documents**: 
- `llm-request-parsing-design.md`
- `llm-request-schema-refactor.md`
- `model-management-design.md`
- `CLAUDE.md`