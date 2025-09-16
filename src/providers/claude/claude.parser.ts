import {Request} from 'express';
import {MessageCreateParamsBase} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import {ClaudeChatRequestWithDefaults} from "./claude.request.validators";
import {validateRequest} from "../types/validator.types";
import {RequestType} from '../../types';
import {ProviderType} from '../types';


export class ClaudeParser {
    static readonly providerType = ProviderType.CLAUDE;

    static parseRequest(req: Request, requestType: RequestType): MessageCreateParamsBase {
        return validateRequest(
            req,
            requestType,
            this.providerType,
            (requestBody, _requestType) => ClaudeChatRequestWithDefaults(requestBody)
        );
    }
}
