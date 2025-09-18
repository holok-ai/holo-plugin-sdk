// import {IProviderTranslator} from '../base.translator.interface';
// import {OllamaChatRequest, HoloRequest, OllamaResponse, HoloResponse} from "../types";
// import logger from "../../utils/logger";
// import {type} from "arktype";
// import {OllamaRequestTranslator} from "./translators/ollama.request.translators";
// import {OllamaResponseTranslator} from "./translators/ollama.response.translators";
//
// export class OllamaTranslator implements IProviderTranslator {
//     async fromHoloChatRequest(request: HoloRequest): Promise<Partial<OllamaChatRequest> | type.errors> {
//         logger.debug('translating holo request to ollama request', request);
//         try {
//             const result = await OllamaRequestTranslator.fromHolo(request);
//             return result;
//         } catch (error) {
//             logger.error('Error translating holo to ollama request', error);
//             return type.errors.parse(error);
//         }
//     }
//
//     async toHoloChatRequest(request: OllamaChatRequest): Promise<Partial<HoloRequest> | type.errors> {
//         logger.debug('translating ollama request to holo request', request);
//         try {
//             const result = await OllamaRequestTranslator.toHolo(request);
//             return result;
//         } catch (error) {
//             logger.error('Error translating ollama to holo request', error);
//             return type.errors.parse(error);
//         }
//     }
//
//     async fromOllamaResponse(response: OllamaResponse): Promise<HoloResponse | type.errors> {
//         logger.debug('translating ollama response to holo response', response);
//         try {
//             const result = await OllamaResponseTranslator.toHolo(response as any);
//             return result as HoloResponse;
//         } catch (error) {
//             logger.error('Error translating ollama to holo response', error);
//             return type.errors.parse(error);
//         }
//     }
//
//     async toOllamaResponse(response: HoloResponse): Promise<OllamaResponse | type.errors> {
//         logger.debug('translating holo response to ollama response', response);
//         try {
//             const result = await OllamaResponseTranslator.fromHolo(response);
//             return result as OllamaResponse;
//         } catch (error) {
//             logger.error('Error translating holo to ollama response', error);
//             return type.errors.parse(error);
//         }
//     }
// }
