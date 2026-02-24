import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {GuardResult, GuardResultSchema} from "../types";
import {WorkerRequestFactory} from "../../types";
import {env} from "../../env";
import {ResponseService} from "../../services";
import {
    Auth,
    ClassLogger,
    filterJoin,
    findLast,
    HoloContent,
    HoloContentText,
    HoloRequest,
    HoloWorkerRequest,
    pickDefined,
    PromptConfigProps,
    RequestType
} from "@holokai/sdk";
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

    async guard(workerRequest: HoloWorkerRequest, guards: PromptConfigProps[], auth: Auth) {
        const logger = this.mlog(this.guard);

        logger.debug(`Guard service invoked: guards.length=${guards?.length || 0}, requestId=${workerRequest.requestId}, requestType=${workerRequest.type}`);

        if (!guards || !guards.length) {
            logger.debug(`No guards to execute - returning early`);
            return;
        }

        let provider = this.providerRegistry.getByFamily(workerRequest.providerType)
        if (!provider) {
            throw new Error(`No provider found: ${workerRequest.providerName}`);
        }

        const request = await provider.translator.toHoloRequest(workerRequest.payload);

        const holoMessages = request.messages;
        if (!holoMessages || !holoMessages.length) return;

        const lastMessage = findLast(holoMessages, m => {
            if (m === undefined || m === null) {
                logger.warn(`Encountered ${m === null ? 'null' : 'undefined'} message in holoMessages`, {requestId: workerRequest.requestId});
                return false;
            }
            return m.role === 'user';
        });

        if (!lastMessage) {
            logger.warn(`No user message to guard`, {methodName: 'guard', requestId: workerRequest.requestId});
            return;
        }

        const lastContent = Array.isArray(lastMessage.content) ?
            filterJoin<HoloContent>(lastMessage.content, x => x.type === 'text', x => (x as HoloContentText).text, '\n\n') :
            lastMessage.content;

        if (!lastContent.length) return;

        try {
            //set guards onto request for auditing
            workerRequest.guards = guards;
            logger.debug(`Executing ${guards.length} guard check(s) in parallel`);
            const results = await Promise.all(
                guards.map(async (guard, index) => {
                    logger.debug(`Starting guard check ${index + 1}/${guards.length}: id=${guard.id}, model=${guard.modelName}, provider=${guard.providerName}`);
                    const startTime = Date.now();
                    try {
                        const p = this.organizationService.getProvider(workerRequest.organizationId!, guard.providerName);
                        provider = this.providerRegistry.getByFamily(p!.type);
                        if (!provider) return {passed: true};

                        const holoRequest: HoloRequest = pickDefined({
                            request_type: "generate",
                            model: guard.modelName,
                            messages: [{
                                role: "user",
                                content: guard.userPrompt + "\n\n" + lastContent
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
                            auth,
                            undefined,
                            workerRequest.thread_id,
                            workerRequest.branch_id
                        );
                        const response = await this.responseService.requestOnce<string>(guardRequest);

                        const raw = JSON.parse(response as string);
                        logger.debug(`Guard raw response: ${JSON.stringify(raw)}`, {requestId: workerRequest.requestId});
                        // TODO: Handle error responses before translating - check if raw.error exists and return early
                        //       to avoid passing error objects to translator which expects proper response structure
                        const holoResponse = await provider.translator.toHoloResponse(raw);
                        if (!holoResponse.messages) return {
                            passed: false,
                            errors: ["Guard response is missing messages"]
                        };

                        const guardResponse = holoResponse.messages[0].content as string;
                        const result = JSON.parse(guardResponse);
                        const duration = Date.now() - startTime;
                        logger.debug(`Guard check ${index + 1}/${guards.length} completed: id=${guard.id}, passed=${result.passed}, duration=${duration}ms`);
                        return result;
                    } catch (e: any) {
                        const duration = Date.now() - startTime;
                        logger.error(`Guard check ${index + 1}/${guards.length} failed: id=${guard.id}, error=${e?.message ?? String(e)}, duration=${duration}ms`, {requestId: workerRequest.requestId});
                        return {passed: true, errors: [e?.message ?? String(e)]};
                    }
                })
            );

            logger.debug(`All ${guards.length} guard checks completed - aggregating results`);

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
            if (reduced.passed) {
                logger.debug(`Guard result summary: passed=true`);
            } else {
                const errorCount = reduced.errors?.length || 0;
                logger.debug(`Guard result summary: passed=false, errorCount=${errorCount}`);
                if (reduced.errors?.length) {
                    logger.warn(`Guards BLOCKED request: ${reduced.errors.join('; ')}`);
                }
            }
            return reduced;
        } catch (e) {
            logger.error(`Failed to process guards: ${(e as Error).message}`, {
                methodName: 'guard',
                requestId: workerRequest.requestId,
                stack: (e as Error).stack
            });
            return {passed: false, errors: [(e as Error).message]};
        }
    }
}
