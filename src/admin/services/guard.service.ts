import 'reflect-metadata';
import {OrganizationService} from "./organization.service";
import {injectable} from 'tsyringe';
import {GuardResult, GuardResultSchema, JWTPayload} from "../types";
import {WorkerRequestFactory} from "../../types";
import {env} from "../../env";
import {ResponseService} from "../../services";
import {HoloTranslator} from "../../services/providers/holo.translator";
import {ClassLogger, HoloContentText, HoloRequest, HoloWorkerRequest, pickDefined, RequestType} from "@holokai/sdk";


@injectable()
export class GuardService extends ClassLogger {
    private serverId: string = env.api.apiServerId;

    constructor(
        private organizationService: OrganizationService,
        private responseService: ResponseService,
        private holoTranslator: HoloTranslator
    ) {
        super();
    }

    async guard(providerType: string, type: RequestType, workerRequest: HoloWorkerRequest, auth: JWTPayload | undefined) {
        const logger = this.mlog(this.guard);

        if (!auth?.appSlug) {
            logger.warn(`No app slug found for guard`, {requestId: workerRequest.requestId});
            return;
        }

        let lastMessage = "";
        if (type === RequestType.GENERATE && providerType === "ollama") {
            lastMessage = workerRequest.payload.prompt;
        } else {
            const payload = workerRequest.payload;
            const messages = "messages" in payload ? payload.messages : undefined;
            if (!messages) {
                logger.warn(`No messages to guard`, {requestId: workerRequest.requestId});
                return;
            }

            const lastHoloMessage = (await this.holoTranslator.toHoloMessages(messages, providerType)).pop();
            if (!lastHoloMessage?.content?.length) {
                logger.warn(`No message to guard`, {requestId: workerRequest.requestId});
                return;
            }

            const content = lastHoloMessage.content;
            if (Array.isArray(content)) {
                for (const c of content) {
                    if (c.type === "text") lastMessage += "\n\n" + (c as HoloContentText).text;
                }
            } else {
                lastMessage = content;
            }
        }

        if (!lastMessage.length) {
            logger.warn(`No message to guard`, {requestId: workerRequest.requestId});
            return;
        }

        const guards = this.organizationService.getGuards(auth.organizationId, auth.appSlug);
        if (!guards) {
            logger.info(`Finished running guards for: ${providerType} ${type}`);
            return {passed: true};
        }

        try {
            workerRequest.guards = guards;

            const results = await Promise.all(
                guards.map(async (guard) => {
                    try {
                        const provider = this.organizationService.getProvider(auth.organizationId, guard.providerName);
                        if (!provider) return {passed: true};

                        const holoRequest: HoloRequest = pickDefined({
                            request_type: "generate",
                            model: guard.modelName,
                            messages: [{role: "user", content: guard.userPrompt + "\n\n" + lastMessage}],
                            response_format: {type: "json_schema", schema: GuardResultSchema, strict: true},
                            stream: false,
                            ...(guard.systemPrompt && {system: guard.systemPrompt}),
                        }) as HoloRequest;

                        const payload = await this.holoTranslator.fromHoloRequest(holoRequest, provider.type);
                        const guardRequest = WorkerRequestFactory.create(
                            provider.type,
                            provider.name,
                            RequestType.GENERATE,
                            payload,
                            this.serverId,
                            auth
                        );

                        const response = await this.responseService.requestOnce<string>(guardRequest);

                        const raw = JSON.parse(response as string);
                        const holoResponse = await this.holoTranslator.toHoloResponse(raw, provider.type);
                        if (!holoResponse.messages) return {
                            passed: false,
                            errors: ["Guard response is missing messages"]
                        };

                        const guardResponse = holoResponse.messages[0].content as string;
                        return JSON.parse(guardResponse);
                    } catch (e: any) {
                        logger.error(`Failed to process guard: ${e?.message ?? String(e)}`, {requestId: workerRequest.requestId});
                        return {passed: true, errors: [e?.message ?? String(e)]};
                    }
                })
            );

            const reduced = results.reduce<GuardResult>(
                (acc, r: any) => {
                    acc.passed = acc.passed && !!r.passed;
                    if (!acc.passed && r?.passed === false && r.errors?.length) {
                        if (!acc.errors) acc.errors = [];
                        acc.errors.push(...r.errors);
                    }
                    return acc;
                },
                {passed: true} as any
            );

            workerRequest.guardResult = reduced;
            return reduced;
        } catch (e: any) {
            logger.error(`Failed to process guard: ${e?.message ?? String(e)}`, {requestId: workerRequest.requestId});
            workerRequest.guardResult = {passed: false, errors: [e?.message ?? String(e)]} as any;
            return workerRequest.guardResult;
        } finally {
            logger.info(`Finished running guards for: ${providerType} ${type}`);
        }
    }

    async processGuardResult(request: HoloWorkerRequest, workerId: string): Promise<boolean> {
        const logger = this.mlog(this.processGuardResult);

        if (!request.guardResult || request.guardResult.passed) return true;

        logger.warn(`Guard validation failed for request ${request.requestId}`, {
            providerType: request.providerType,
            errors: request.guardResult.errors,
        });

        try {
            const errors =
                request.guardResult?.passed === false ? request.guardResult.errors ?? [] : ["Guard validation failed"];

            await this.responseService.sendError(request, {
                errorType: "guard",
                errors,
                workerId,
                auditEnabled: true,
            });

            return false;
        } catch (error: any) {
            logger.error(`Failed to send guard failure response: ${error?.message ?? String(error)}`, {
                requestId: request.requestId,
                error,
            });
            return false;
        }
    }
}