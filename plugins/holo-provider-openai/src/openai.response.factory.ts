import {IResponseFactory} from "@holokai/sdk";
import {ResponseErrorEvent} from "openai/resources/responses/responses";

export type OpenAIResponseCode = | 'server_error'
    | 'rate_limit_exceeded'
    | 'invalid_prompt'
    | 'vector_store_timeout'
    | 'invalid_image'
    | 'invalid_image_format'
    | 'invalid_base64_image'
    | 'invalid_image_url'
    | 'image_too_large'
    | 'image_too_small'
    | 'image_parse_error'
    | 'image_content_policy_violation'
    | 'invalid_image_mode'
    | 'image_file_too_large'
    | 'unsupported_image_media_type'
    | 'empty_image_file'
    | 'failed_to_download_image'
    | 'image_file_not_found';

export class OpenAIResponseFactory implements IResponseFactory {
    createError(message: string, code: OpenAIResponseCode = 'invalid_prompt'): ResponseErrorEvent {
        return {
            type: 'error',
            message,
            param: null,
            code,
            sequence_number: 0
        };
    }

    static instance(): OpenAIResponseFactory {
        return new OpenAIResponseFactory();
    }
}