import {OpenAIChatRequest} from "./request.types";

export * from './request.types';
export * from './response.types';

export const OpenAIChatRequestDefaults: Partial<OpenAIChatRequest> = {
    stream: false,
    messages: []
};
