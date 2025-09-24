import 'reflect-metadata';
import {OrganizationService} from "./organization.service";
import {injectable} from 'tsyringe';
import {
    ClaudeChatRequest,
    ClaudeMessageTranslator,
    ClaudeRequestTranslator,
    ClaudeResponseMessage,
    ClaudeTextBlock
} from '../../providers/claude';
import {GuardResult, GuardResultSchema, JWTPayload} from "../types";
import {LLMWorkerRequest, WorkerRequest} from "../../types";
import {HoloRequest, HoloRequestValidator} from "../../providers/holo";
import {ProviderType, RequestType} from "../../providers/types";
import {env} from "../../env";
import {ResponseService} from "../../services";
import logger from "../../utils/logger";


@injectable()
export class GuardService {
    private serverId: string = env.api.apiServerId;

    constructor(
        private organizationService: OrganizationService,
        private responseService: ResponseService
    ) {

    }

    async guard(providerType: ProviderType, type: RequestType, workerRequest: LLMWorkerRequest, auth: JWTPayload) {

        if (!auth || !auth.appSlug) {
            return {passed: true};
        }

        const holoMessages = await ClaudeMessageTranslator.toHoloArray((workerRequest.payload as ClaudeChatRequest).messages);
        const guards = this.organizationService.getGuards(auth.organizationId, auth.appSlug);

        if (guards) {
            try {
                const results = await Promise.all(
                    guards.map(async (guard) => {
                        const holoRequest: HoloRequest = HoloRequestValidator.assert({
                            model: guard.modelName,
                            messages: [
                                {role: 'user', content: guard.userPrompt},
                                ...holoMessages
                            ],
                            response_format: {
                                type: 'json_schema',
                                schema: GuardResultSchema,
                                strict: true
                            },
                            stream: false,
                            ...(guard.systemPrompt && {system: guard.systemPrompt})
                        });

                        const payload = await ClaudeRequestTranslator.fromHolo(holoRequest) as ClaudeChatRequest;
                        const guardRequest = await WorkerRequest.create(providerType, type, payload, this.serverId, auth);

                        const response = await this.responseService.submitRequest(guardRequest);
                        const resultMessage = JSON.parse(response as string) as ClaudeResponseMessage
                        return JSON.parse((resultMessage.content[0] as ClaudeTextBlock).text);
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
