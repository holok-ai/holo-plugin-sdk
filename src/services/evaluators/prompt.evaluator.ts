import {EvaluatorEvent, EvaluatorResult, IEvaluator} from '../../types';
import {PromptConfigProps} from '@holokai/sdk';
import {EvaluatorDB} from '../../db';
import {Evaluator, EvaluatorData, LlmResponse, Provider} from "@holokai/sdk/dist/core/entities";

export class PromptEvaluator implements IEvaluator {
    evaluatorId: string;
    handlesEventName: string;
    allowUserOverride: boolean;
    runType: string = "prompt";
    evaluatorName: string = "";
    private promptId: string;
    private prompt: PromptConfigProps | null = null;
    private provider: Provider | null = null;
    private evaluatorDb: EvaluatorDB;

    constructor(evaluator: Evaluator, evaluatorDb: EvaluatorDB) {
        if (!evaluator.prompt_id) {
            throw new Error('No prompt_id found for prompt evaluator');
        }

        this.evaluatorId = evaluator.id || '';
        this.handlesEventName = evaluator.evaluator_type || '';
        this.allowUserOverride = false;
        this.promptId = evaluator.prompt_id;
        this.evaluatorDb = evaluatorDb;
    }

    async init(): Promise<void> {
        // Load prompt and provider
        this.prompt = await this.evaluatorDb.getPrompt(this.promptId);
        if (!this.prompt) {
            throw new Error(`Prompt was not found by id: ${this.promptId}`);
        }

        // Set evaluator name from prompt name
        this.evaluatorName = this.prompt.id || "";

        if (this.prompt.providerName) {
            this.provider = await this.evaluatorDb.getProvider(this.prompt.providerName);
            if (!this.provider || !(this.provider.name.toLowerCase() === 'ollama')) {
                throw new Error(`Provider ${(!this.provider ? "was not found" : "must be OLLAMA.")}`);
            }
        }
    }

    async evaluate(_event: EvaluatorEvent): Promise<EvaluatorResult> {
        // try {
        //     if (!this.prompt || !this.provider) {
        throw new Error('Prompt and Provider are not configured for this evaluator');
        // }

        // // Extract LlmResponse and EvaluatorData from context if available
        // let llmResponse: LlmResponse | null = null;
        // let evaluatorData: EvaluatorData | null = null;
        //
        // if (event.context) {
        //     const llmResponseData = event.context.find(c => c.key === "llm_responses")?.value as any;
        //     if (llmResponseData) {
        //         llmResponse = llmResponseData;
        //     }
        //
        //     const evalDataContext = event.context.find(c => c.key === "evaluators_data")?.value as any;
        //     if (evalDataContext) {
        //         evaluatorData = evalDataContext;
        //     }
        // }
        //
        // // const modelName = this.prompt.model || '';
        // const structuredOutput = this.prompt.parameters?.output_format;
        // const systemPrompt = this.substituteTags(this.prompt.system_prompt || '', this.prompt, llmResponse, evaluatorData);
        // const userPrompt = this.substituteTags(this.prompt.user_prompt, this.prompt, llmResponse, evaluatorData);
        //
        // logger.debug(`Running prompt evaluation with model ${modelName}`);
        //
        // const aiProvider: OllamaProvider = new OllamaProvider(this.provider, null as any, 'evaluator-worker');
        // await aiProvider.init();
        //
        // const chatRequest: OllamaChatRequest = {
        //     model: modelName,
        //     messages: [
        //         {role: 'system', content: systemPrompt || 'You are a helpful assistant.'},
        //         {role: 'user', content: userPrompt}
        //     ],
        //     format: structuredOutput,
        //     stream: false
        // };
        //
        // // @ts-ignore
        // const response = await aiProvider.client.chat(chatRequest);
        // const content = response.message.content;
        //
        // // Check if content is valid JSON
        // let value;
        // try {
        //     value = JSON.parse(content);
        // } catch {
        //     // If not JSON, wrap in an object
        //     value = {data: content};
        // }

        // return {
        //     status: "ok",
        //     message: "Prompt evaluated successfully",
        //     next_events: [],
        //     result: {key: "output", value: value},
        //     userId: llmResponse?.user_id || '',
        //     organizationId: llmResponse?.organization_id || '',
        //     applicationId: llmResponse?.application_id || ''
        // };
        //
        // } catch (error) {
        //     logger.error('Failed to evaluate prompt:', error);
        //     return {
        //         status: "error",
        //         message: error instanceof Error ? error.message : String(error),
        //         next_events: []
        //     };
        // }
    }

    /**
     * Substitutes handlebar-style tags in a template string with values from db table objects.
     */
    protected substituteTags(
        template: string,
        prompt: PromptConfigProps,
        llmResponse: LlmResponse | null,
        evalData: EvaluatorData | null
    ): string {
        const dataContext = {
            prompts: prompt,
            llm_responses: llmResponse,
            evaluators_data: evalData
        };

        return template.replace(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g, (match, tagName) => {
            const parts = tagName.split('.');

            if (parts.length !== 2) {
                return match;
            }

            const [tableName, fieldName] = parts;
            if (dataContext.hasOwnProperty(tableName)) {
                const tableObject = dataContext[tableName as keyof typeof dataContext];

                if (tableObject && typeof tableObject === 'object' && fieldName in tableObject) {
                    let value = (tableObject as any)[fieldName];
                    if (llmResponse && llmResponse.provider_slug?.toLowerCase() === 'anthropic' &&
                        tableName === 'llm_responses' && fieldName === 'response') {
                        value = (tableObject as any)['response_raw'];
                    }

                    if (typeof value === 'object' && value !== null) {
                        return JSON.stringify(value);
                    }
                    return value?.toString() ?? '';
                }
            }
            return match;
        });
    }
}
