import OpenAI from 'openai';
import {OpenAIChatRequest} from '../types';
import {LLMWorkerResponse} from "@holokai/sdk";

export class OpenAIChatCompletionsService {
    constructor(
        private readonly client: OpenAI,
        private readonly createWorkerResponse: (
            sourceId: string,
            requestId: string,
            providerType: any,
            payload: any,
            fullResponse?: string
        ) => LLMWorkerResponse,
        private readonly onResponseChunk: (responseChunk: LLMWorkerResponse, auditEnabled?: boolean) => Promise<void>,
        private readonly validateModel: (model: string) => void
    ) {
    }

    async execute(
        sourceId: string,
        requestId: string,
        chatRequest: OpenAIChatRequest
    ): Promise<void> {
        this.validateModel(chatRequest.model);

        let fullResponse = '';

        if (chatRequest.stream) {
            chatRequest.stream_options = {include_usage: true};
        }

        const response = await this.client.chat.completions.create(chatRequest);
        const startTime = Date.now();
        let timeToFirst: number = 0;

        if (chatRequest.stream) {
            try {
                // @ts-ignore
                for await (const chunk of response) {

                    if (chunk?.usage) {
                        chunk.usage.timeToFirstToken = timeToFirst;
                        chunk.usage.totalProcessingTime = Date.now() - startTime;
                        const responseChunk = this.createWorkerResponse(sourceId, requestId, 'openai', chunk, fullResponse);
                        await this.onResponseChunk(responseChunk, true);
                        break;
                    }

                    const choice = chunk.choices?.[0];
                    if (choice?.delta) {
                        if (choice.delta.content) {
                            if (timeToFirst == 0) timeToFirst = Date.now() - startTime;
                            const token = choice.delta.content;
                            fullResponse += token;
                        }

                        const responseChunk = this.createWorkerResponse(sourceId, requestId, 'openai', chunk);
                        await this.onResponseChunk(responseChunk);
                    }
                }
            } catch (error) {
                const errorResponse = this.createWorkerResponse(sourceId, requestId, 'openai', error);
                await this.onResponseChunk(errorResponse, false);
            }
        } else {
            try {
                const message = response as any;
                if (message.choices && message.choices.length > 0) {
                    fullResponse = message.choices[0].message?.content || '';
                }

                const responseChunk = this.createWorkerResponse(sourceId, requestId, 'openai', response, fullResponse);
                await this.onResponseChunk(responseChunk, true);
            } catch (error) {
                const errorResponse = this.createWorkerResponse(sourceId, requestId, 'openai', error);
                await this.onResponseChunk(errorResponse, false);
            }
        }
    }
}
