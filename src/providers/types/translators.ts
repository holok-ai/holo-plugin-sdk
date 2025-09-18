import {ArkErrors, type} from "arktype";
import logger from "../../utils/logger";
import {ClaudeChatRequest} from "../claude";
import {OllamaChatRequest} from "../ollama";
import {OpenAIChatRequest} from "../openai";
import {HoloRequest} from "../holo";

export interface IProviderTranslator {
    toHoloChatRequest(request: ClaudeChatRequest | OllamaChatRequest | OpenAIChatRequest): Promise<Partial<HoloRequest> | type.errors>;

    fromHoloChatRequest(request: HoloRequest): Promise<Partial<ClaudeChatRequest> | Partial<OllamaChatRequest> | Partial<OpenAIChatRequest> | type.errors>;
}

export interface IFieldTranslator<THolo, TProvider> {
    fromHolo(source: THolo): Promise<Partial<TProvider>>;

    fromHoloArray(items: THolo[] | undefined): Promise<TProvider[]>;

    toHolo(target: TProvider): Promise<Partial<THolo>>;

    toHoloArray(items: TProvider[] | undefined): Promise<THolo[]>;
}

export class FieldTranslator<THolo, TProvider> implements IFieldTranslator<THolo, TProvider> {
    protected fromHoloPipeline: TranslatorPipeline<THolo, TProvider>;
    protected toHoloPipeline: TranslatorPipeline<TProvider, THolo>;

    constructor(
        protected readonly holoValidator: type<THolo>,
        protected readonly providerValidator: type<TProvider>,
        protected readonly fromHoloFuncs: TranslateFunc<THolo, TProvider>[],
        protected readonly toHoloFuncs: TranslateFunc<TProvider, THolo>[],
        protected readonly fromHoloGuards = [] as Guard<THolo>[],
        protected readonly toHoloGuards = [] as Guard<TProvider>[],
    ) {
        this.fromHoloPipeline = new TranslatorPipeline(holoValidator, providerValidator, fromHoloFuncs, fromHoloGuards);
        this.toHoloPipeline = new TranslatorPipeline(providerValidator, holoValidator, toHoloFuncs, toHoloGuards);
    }

    fromHolo(source: THolo): Promise<Partial<TProvider>> {
        return this.fromHoloPipeline.translate(source);
    }

    fromHoloArray(items: THolo[] | undefined): Promise<TProvider[]> {
        return this.fromHoloPipeline.translateArray(items);
    }

    toHolo(target: TProvider): Promise<Partial<THolo>> {
        return this.toHoloPipeline.translate(target);
    }

    toHoloArray(items: TProvider[] | undefined): Promise<THolo[]> {
        return this.toHoloPipeline.translateArray(items);
    }
}

export function createTranslateFunc<TSource extends {}, TTarget, TSourceField, TTargetField>(
    translate: (value: TSourceField) => Promise<TTargetField>, sourceKey: keyof TSource | null, targetKey: keyof TTarget | null = (sourceKey as unknown) as keyof TTarget
): TranslateFunc<TSource, TTarget> {
    return async (source: TSource): Promise<Partial<TTarget>> => {
        if (sourceKey !== null && (!(sourceKey in source) || !source[sourceKey])) {
            return {};
        }

        // Run the transformation function
        const transformedValue = await translate(sourceKey === null ? source as unknown as TSourceField : source[sourceKey] as TSourceField);

        if (typeof transformedValue === 'object' && transformedValue !== null) {
            if (Object.keys(transformedValue).length === 0) {
                return {};
            }
        }

        // Return target field with transformed value
        if (targetKey === null) {
            if (typeof transformedValue !== 'object' || transformedValue === null) {
                return {}; // or log + return {}
            }
            return transformedValue as Partial<TTarget>;
        }

        return {[targetKey]: transformedValue} as Partial<TTarget>;
    };
}

export type TranslateFunc<TSource, TTarget> =
    (source: TSource) => Promise<Partial<TTarget>>;

export class Guard<TSource> {
    constructor(
        protected readonly name: string,
        protected readonly filter: (source: TSource) => boolean,
        protected readonly failQuietly = true
    ) {
    }

    async guard(source: TSource): Promise<boolean> {
        if (this.filter(source)) return true;
        if (this.failQuietly) return false;

        throw new Error(`Guard ${this.name} failed`);
    }
}

export class TranslatorPipeline<TSource, TTarget> {
    constructor(
        protected readonly sourceValidator: type<TSource>,
        protected readonly targetValidator: type<TTarget>,
        protected readonly translators: TranslateFunc<TSource, TTarget>[],
        protected readonly guards = [] as Guard<TSource>[],
    ) {
    }

    async filter(source: TSource): Promise<boolean> {
        const results = await Promise.all(this.guards.map(g => g.guard(source)));
        return (results.every(r => r === true));
    }

    async translate(source: TSource | undefined | null, failQuietly = true): Promise<Partial<TTarget>> {
        if (!source || !await this.filter(source)) return {};

        const translate = this.sourceValidator.pipe(async (validatedSource: TSource): Promise<TTarget> => {

            const results = await Promise.all(
                this.translators.map(t => t(validatedSource))
            );

            return Object.assign({}, validatedSource as any, ...results) as TTarget;
        }).to(this.targetValidator.onUndeclaredKey('delete'));

        const result = await translate(source);

        if (result instanceof ArkErrors) {
            //TODO: Send off to logging
            logger.error('Error running translation pipeline', result.summary);
            if (!failQuietly) {
                throw new Error(`Invalid translation pipeline: ${result.summary}`);
            }
            return {};
        }

        return result as TTarget;
    }

    async translateArray(items: TSource[] | undefined, failQuietly = true): Promise<TTarget[]> {
        if (!items?.length) return [];

        const results = await Promise.all(items.map(item =>
            this.translate.bind(this)(item, failQuietly)));

        return results.filter(item => Object.keys(item).length > 0) as TTarget[];
    }
}
