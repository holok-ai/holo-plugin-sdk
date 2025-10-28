import 'reflect-metadata';
import {OrganizationService} from "./organization.service";
import {injectable} from 'tsyringe';
import {GuardResult, GuardResultSchema, JWTPayload} from "../types";
import {LLMWorkerRequest, WorkerRequestFactory} from "../../types";
import {HoloContentText, HoloRequest, HoloRequestValidator} from "../../providers/holo";
import {ProviderChatRequest, ProviderMessage, ProviderRequest, ProviderType, RequestType} from "../../providers/types";
import {env} from "../../env";
import {ResponseService} from "../../services";
import {HoloTranslater} from "../../providers/holo/holo.translator";
import {ArkErrors} from "arktype";
import {ClassLogger} from "../../types/class.logger";
import {OllamaGenerateRequest} from "../../providers/ollama/types";


@injectable()
export class GuardService extends ClassLogger {
    private serverId: string = env.api.apiServerId;

    constructor(
        private organizationService: OrganizationService,
        private responseService: ResponseService,
        private holoTranslator: HoloTranslater
    ) {
        super();
    }

    async guard(providerType: ProviderType, type: RequestType, workerRequest: LLMWorkerRequest, auth: JWTPayload | undefined) {
        const logger = this.mlog(this.guard);
        // if no slug or auth
        if (!auth?.appSlug) {
            return;
        }

        let lastMessage = '';
        if (type === RequestType.GENERATE && providerType === ProviderType.OLLAMA) {
            lastMessage = (workerRequest.payload as OllamaGenerateRequest).prompt;
        } else {
            const lastHoloMessage = (await this.holoTranslator.toHoloMessages((workerRequest.payload as ProviderChatRequest).messages as ProviderMessage[], providerType)).pop();
            if (!lastHoloMessage || !lastHoloMessage.content || !lastHoloMessage.content.length) {
                logger.warn(`No message to guard`, {methodName: 'guard', requestId: workerRequest.requestId});
                return;
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
            logger.warn(`No message to guard`, {methodName: 'guard', requestId: workerRequest.requestId});
            return;
        }

        const guards = this.organizationService.getGuards(auth.organizationId, auth.appSlug);

        if (guards) {
            try {
                //set guards onto request for auditing
                workerRequest.guards = guards;
                const results = await Promise.all(
                    guards.map(async (guard) => {
                        try {
                            const provider = this.organizationService.getProvider(auth.organizationId, guard.providerName);
                            logger.info(`Guard Provider: ${guard.providerName}: ${provider?.type}`, {
                                methodName: 'guard',
                                requestId: workerRequest.requestId
                            });
                            if (!provider) {
                                logger.warn(`Guard Provider ${guard.providerName} not found`, {
                                    methodName: 'guard',
                                    requestId: workerRequest.requestId
                                });
                                //TODO: More robust error handling
                                return {passed: true}
                            }
                            const holoRequest: HoloRequest = HoloRequestValidator.assert({
                                request_type: 'generate',
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
                                logger.warn(`Guard translation failed: ${JSON.stringify(payload.summary, null, 2)}`, {
                                    methodName: 'guard',
                                    requestId: workerRequest.requestId
                                });
                                return {passed: true}
                            }

                            const guardRequest = WorkerRequestFactory.create(provider.type, provider.name, RequestType.GENERATE, payload as ProviderRequest, this.serverId, auth);

                            const response = await this.responseService.streamRequestOnce(guardRequest);

                            const resultMessage = JSON.parse(response as string);
                            const holoResponse = await this.holoTranslator.toHoloResponse(resultMessage, provider.type);

                            // logger.info(`Guard response: ${JSON.stringify(holoResponse, null, 2)}`);
                            if (!holoResponse.messages) {
                                return {passed: false, errors: ['Guard response is missing messages']};
                            }
                            const guardResponse = holoResponse.messages[0].content as string;

                            return JSON.parse(guardResponse);
                        } catch (e) {
                            logger.error(`Failed to process guard: ${(e as Error).message}`, {
                                methodName: 'guard',
                                requestId: workerRequest.requestId
                            });
                            return {passed: true, errors: [e as Error]};
                        }
                    })
                );

                return workerRequest.guardResult = results.reduce<GuardResult>(
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
                logger.error(`Failed to process guard: ${(e as Error).message}`, {
                    methodName: 'guard',
                    requestId: workerRequest.requestId
                });
                return {passed: false, errors: [(e as Error).message]};
            }
        }
        return {passed: true};
    }

    /**
     * Checks guard results on a worker request and sends error response if guards failed.
     * Returns true if request should proceed to provider, false if guards failed.
     */
    async processGuardResult(request: LLMWorkerRequest, workerId: string): Promise<boolean> {
        const logger = this.mlog(this.processGuardResult);

        // If no guard results or guards passed, proceed
        if (!request.guardResult || request.guardResult.passed) {
            return true;
        }

        // Guards failed - generate error response
        logger.warn(`Guard validation failed for request ${request.requestId}`, {
            providerType: request.providerType,
            errors: request.guardResult.errors
        });

        try {
            // Extract errors - only GuardResultFail has errors property
            const errors = request.guardResult?.passed === false
                ? request.guardResult.errors
                : ['Guard validation failed'];

            // Send guard error response using unified method
            await this.responseService.sendError(request, {
                errorType: 'guard',
                errors,
                workerId,
                auditEnabled: true
            });

            return false; // Do not proceed to provider
        } catch (error) {
            logger.error(`Failed to send guard failure response: ${(error as Error).message}`, {
                requestId: request.requestId,
                error
            });
            // Still block the request even if we fail to send error response
            return false;
        }
    }
}
