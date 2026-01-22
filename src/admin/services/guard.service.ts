import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {Auth, GuardResult, GuardResultSchema} from "../types";
import {WorkerRequestFactory} from "../../types";
import {env} from "../../env";
import {ResponseService} from "../../services";
import {ClassLogger, HoloRequest, HoloWorkerRequest, pickDefined, RequestType} from "@holokai/sdk";
import {Prompt} from "../../cache";
import {ProviderPluginRegistry} from "../../services/plugin/provider-registry.service";
import {OrganizationService} from "./organization.service";


@injectable()
export class GuardService extends ClassLogger {
    private serverId: string = env.api.apiServerId;

    constructor(
        private responseService: ResponseService,
        private organizationService: OrganizationService,
        private providerRegistry: ProviderPluginRegistry
    ) {
        super();
    }

    async guard(workerRequest: HoloWorkerRequest, guards: Prompt[], auth: Auth) {
        const logger = this.mlog(this.guard);

        if (!guards.length) {
            logger.warn('No guards found for request.');
            return;
        }

        let provider = this.providerRegistry.getByFamily(workerRequest.providerType)
        if (!provider) {
            throw new Error(`No provider found: ${workerRequest.providerName}`);
        }

        const request = await provider.translator.toHoloRequest(workerRequest.payload);
        const holoMessages = request.messages;
        const lastMessage = holoMessages?.pop();

        if (!lastMessage) {
            logger.warn(`No message to guard`, {methodName: 'guard', requestId: workerRequest.requestId});
            return;
        }

        if (guards) {
            try {
                //set guards onto request for auditing
                workerRequest.guards = guards;
                const results = await Promise.all(
                    guards.map(async (guard) => {
                        try {
                            const p = this.organizationService.getProvider(workerRequest.organizationId!, guard.providerName);
                            provider = this.providerRegistry.getByFamily(p!.type);
                            if (!provider) return {passed: true};

                            const holoRequest: HoloRequest = pickDefined({
                                request_type: "generate",
                                model: guard.modelName,
                                messages: [{
                                    role: "user",
                                    content: guard.userPrompt + "\n\n" + JSON.stringify(lastMessage)
                                }],
                                response_format: {type: "json_schema", schema: GuardResultSchema, strict: true},
                                stream: false,
                                ...(guard.systemPrompt && {system: guard.systemPrompt}),
                            }) as HoloRequest;

                            const payload = await provider.translator.fromHoloRequest(holoRequest);
                            const guardRequest = WorkerRequestFactory.create(
                                provider.family,
                                guard.providerName,
                                RequestType.GENERATE,
                                payload,
                                this.serverId,
                                auth
                            );

                            const response = await this.responseService.requestOnce<string>(guardRequest);

                            const raw = JSON.parse(response as string);
                            logger.info(JSON.stringify(raw, null, 2));
                            const holoResponse = await provider.translator.toHoloResponse(raw);
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
