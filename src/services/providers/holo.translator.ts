import 'reflect-metadata';
import {injectable} from "tsyringe";
import type {IProviderTranslator} from "@holokai/types/provider";
import type {HoloMessage, HoloRequest, HoloResponse, HoloStreamChunk} from "@holokai/types/holo";

@injectable()
export class HoloTranslator {
    private translators = new Map<string, IProviderTranslator>();

    constructor() {

    }

    getTranslator(string: string): IProviderTranslator {
        const provider = this.translators.get(string);
        if (!provider) {
            throw new Error(`No translator found for provider type: ${string}`);
        }
        return provider;
    }

    async fromHoloResponse(response: HoloResponse, to: string): Promise<unknown> {
        return this.getTranslator(to).fromHoloResponse(response);
    }

    async toHoloResponse(response: unknown, from: string): Promise<Partial<HoloResponse>> {
        return this.getTranslator(from).toHoloResponse(response as any);
    }

    async fromHoloRequest(request: HoloRequest, to: string): Promise<Partial<any>> {
        return this.getTranslator(to).fromHoloRequest(request);
    }

    async toHoloRequest(request: any, from: string): Promise<Partial<HoloRequest>> {
        return this.getTranslator(from).toHoloRequest(request);
    }

    async fromHoloMessages(messages: HoloMessage[], from: string) {
        return this.getTranslator(from).fromHoloMessages(messages);
    }

    async toHoloMessages(messages: any[], to: string) {
        return this.getTranslator(to).toHoloMessages(messages);
    }

    async fromHoloStreamChunks(chunks: HoloStreamChunk[], to: string): Promise<unknown> {
        return this.getTranslator(to).fromHoloStreamChunks(chunks);
    }
}
