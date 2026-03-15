import 'reflect-metadata';
import {injectable} from 'tsyringe';
import {GuardResult, GuardResultSchema} from "../types";
import {env} from "../env";
import {ClassLogger, pickDefined} from "@holokai/sdk";
import {filterJoin, findLast} from "../utils";
import {HoloContent, HoloContentText, HoloRequest} from "@holokai/types/holo";
import type {HoloWorkerRequest} from "@holokai/types/worker";
import type {Auth} from "@holokai/types/api";
import type {Prompt} from "@holokai/types/entities";
import {PluginService, ProviderPluginService} from "./plugin";
import {ResponseService} from "./response.service";
import {WorkerRequestFactory} from "./worker.request.factory";
import {ProviderService} from "./entities";
import {IProviderPlugin} from "@holokai/types/plugin";
import {IProvider} from "@holokai/types";


@injectable()
export class GuardService extends ClassLogger {
    private serverId: string = env.api.apiServerId;

    constructor(
        private responseService: ResponseService,
        private providerService: ProviderService,
        private pluginService: PluginService,
        private providerPluginService: ProviderPluginService
    ) {
        super();
    }

    async guard(provider: IProvider, workerRequest: HoloWorkerRequest, guards: Prompt[], auth: Auth) {
        const logger = this.mlog(this.guard);

        logger.debug(`Guard service invoked: guards.length=${guards?.length || 0}, requestId=${workerRequest.requestId}, requestType=${workerRequest}`);

        if (!guards || !guards.length) {
            logger.debug(`No guards to execute - returning early`);
            return;
        }

        const requestPlugin = provider.plugin;
        if (!requestPlugin) {
            throw new Error(`No plugin found for provider: ${workerRequest.provider.name}`);
        }

        const request = await requestPlugin.translator.toHoloRequest(workerRequest.payload);

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
            workerRequest.guards = guards;
            logger.debug(`Executing ${guards.length} guard check(s) in parallel`);
            const results = await Promise.all(
                guards.map(async (guard, index) => {
                    logger.debug(`Starting guard check ${index + 1}/${guards.length}: id=${guard.id}, model=${guard.model}, provider=${guard.provider}`);
                    const startTime = Date.now();
                    try {
                        if (!guard.provider_id) {
                            logger.warn(`Guard ${guard.id} has no provider_id`);
                            return {passed: true};
                        }
                        const guardProvider = await this.providerService.getById(guard.provider_id);
                        if (!guardProvider) {
                            logger.warn(`Guard provider not found: ${guard.provider_id}`);
                            return {passed: true};
                        }
                        const guardPlugin = await this.pluginService.getImplById(guardProvider.plugin_id) as IProviderPlugin;
                        if (!guardPlugin) {
                            logger.warn(`No plugin for guard provider: ${guardProvider.name}`);
                            return {passed: true};
                        }

                        const guardProtocol = await this.providerPluginService.getProtocol(guardProvider.plugin_id, guardPlugin.defaultProtocol);

                        const holoRequest: HoloRequest = pickDefined({
                            model: guard.model,
                            messages: [{
                                role: "user",
                                content: guard.user_prompt + "\n\n" + lastContent
                            }],
                            response_format: {type: "json_schema", schema: GuardResultSchema, strict: true},
                            stream: false,
                            ...(guard.system_prompt && {system: guard.system_prompt}),
                        }) as HoloRequest;

                        const payload = await guardPlugin.translator.fromHoloRequest(holoRequest);
                        const guardRequest = WorkerRequestFactory.create(
                            guardProvider,
                            guardProtocol,
                            payload,
                            this.serverId,
                            auth,
                            undefined,
                            workerRequest.thread_id,
                            workerRequest.branch_id
                        );
                        logger.info(JSON.stringify(guardRequest));
                        const response = await this.responseService.requestOnce<string>(guardRequest);

                        const raw = JSON.parse(response as string);
                        logger.debug(`Guard raw response: ${JSON.stringify(raw)}`, {requestId: workerRequest.requestId});
                        // TODO: Handle error responses before translating - check if raw.error exists and return early
                        //       to avoid passing error objects to translator which expects proper response structure
                        const holoResponse = await guardPlugin.translator.toHoloResponse(raw);
                        if (!holoResponse.output) return {
                            passed: false,
                            errors: ["Guard response is missing output"]
                        };

                        const guardResponse = holoResponse.output[0].content as string;
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
