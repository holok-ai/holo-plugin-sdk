import 'reflect-metadata';
import {OrganizationService} from "./organization.service";
import {injectable} from 'tsyringe';
import {ClaudeResponseMessage, ClaudeTextBlock} from '../../providers/claude';
import {GuardResult, GuardResultSchema, JWTPayload} from "../types";
import {LLMPayloadTypes, LLMWorkerRequest, WorkerRequest} from "../../types";
import {HoloContentText, HoloRequest, HoloRequestValidator} from "../../providers/holo";
import {
    OllamaGenerateRequest,
    ProviderChatRequest,
    ProviderMessage,
    ProviderType,
    RequestType
} from "../../providers/types";
import {env} from "../../env";
import {ResponseService} from "../../services";
import logger from "../../utils/logger";
import {HoloTranslater} from "../../providers/translators";
import {ArkErrors} from "arktype";


@injectable()
export class GuardService {
    private serverId: string = env.api.apiServerId;

    constructor(
        private organizationService: OrganizationService,
        private responseService: ResponseService,
        private holoTranslator: HoloTranslater
    ) {

    }

    async guard(providerType: ProviderType, type: RequestType, workerRequest: LLMWorkerRequest, auth: JWTPayload | undefined) {
        // if no slug or auth
        if (!auth?.appSlug) {
            return {passed: true};
        }

        let lastMessage = '';
        if (type === RequestType.GENERATE && providerType === ProviderType.OLLAMA) {

            lastMessage = (workerRequest.payload as OllamaGenerateRequest).prompt;
        } else {
            const lastHoloMessage = (await this.holoTranslator.toHoloMessages((workerRequest.payload as ProviderChatRequest).messages as ProviderMessage[], providerType)).pop();
            if (!lastHoloMessage || !lastHoloMessage.content || !lastHoloMessage.content.length) {
                logger.warn(`No message to guard`);
                return {passed: true};
            }
            const content = lastHoloMessage.content
            if (Array.isArray(content)) {
                for (let i = 0; i < content.length; i++) {
                    if (content[i].type === 'text') {
                        lastMessage += '\n\n' + (content[i] as HoloContentText).text;
                    }
                }
            } else {
                lastMessage = content;
            }
        }

        if (!lastMessage.length) {
            logger.warn(`No message to guard`);
            return {passed: true};
        }

        const guards = this.organizationService.getGuards(auth.organizationId, auth.appSlug);

        if (guards) {
            try {
                const results = await Promise.all(
                    guards.map(async (guard) => {
                        try {
                            const provider = this.organizationService.getProvider(auth.organizationId, guard.providerName);
                            if (!provider) {
                                logger.warn(`Guard Provider ${guard.providerName} not found`);
                                //TODO: More robust error handling
                                return {passed: true}
                            }
                            const holoRequest: HoloRequest = HoloRequestValidator.assert({
                                model: guard.modelName,
                                messages: [
                                    {role: 'user', content: guard.userPrompt + '\n\n' + lastMessage},
                                ],
                                response_format: {
                                    type: 'json_schema',
                                    schema: GuardResultSchema,
                                    strict: true
                                },
                                stream: false,
                                ...(guard.systemPrompt && {system: guard.systemPrompt})
                            });

                            const payload = await this.holoTranslator.fromHoloRequest(holoRequest, provider.type);
                            if (payload instanceof ArkErrors) {
                                logger.warn(`Guard translation failed: ${JSON.stringify(payload.summary, null, 2)}`);
                                return {passed: true}
                            }

                            const guardRequest = await WorkerRequest.create(providerType, type, payload as LLMPayloadTypes, this.serverId, auth);

                            const response = await this.responseService.submitRequest(guardRequest);
                            const resultMessage = JSON.parse(response as string) as ClaudeResponseMessage
                            return JSON.parse((resultMessage.content[0] as ClaudeTextBlock).text);
                        } catch (e) {
                            logger.error(`Failed to process guard: ${(e as Error).message}`);
                            return {passed: true, errors: [e as Error]};
                        }
                    })
                );

                return results.reduce<GuardResult>(
                    (acc, r: GuardResult) => {
                        acc.passed = acc.passed && r.passed;
                        if (!acc.passed && !r.passed && r.errors.length) {
                            if (!acc.errors) acc.errors = [];
                            acc.errors.push(...r.errors);
                        }
                        return acc;
                    },
                    {passed: true}
                );
            } catch (e) {
                logger.error(`Failed to process guard: ${(e as Error).message}`);
                return {passed: false, errors: [e as Error]};
            }
        }
        return {passed: true};
    }
}
