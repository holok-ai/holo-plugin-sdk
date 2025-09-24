import {ArkErrors, Type, type} from "arktype";
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

export interface FieldTranslatorOptions<THolo, TProvider> {
    defaultFromHoloValues?: Partial<TProvider>,
    defaultToHoloValues?: Partial<THolo>,
    skipValidation?: boolean,
    fromHoloGuards?: TranslatorGuard<THolo>[],
    toHoloGuards?: TranslatorGuard<TProvider>[],
    name?: string
}

export class FieldTranslator<THolo, TProvider> implements IFieldTranslator<THolo, TProvider> {
    protected fromHoloPipeline: TranslatorPipeline<THolo, TProvider>;
    protected toHoloPipeline: TranslatorPipeline<TProvider, THolo>;
    protected readonly name: string;

    constructor(
        protected readonly holoValidator: Type<THolo>,
        protected readonly providerValidator: Type<TProvider>,
        protected readonly fromHoloFuncs: TranslateFunc<THolo, TProvider>[],
        protected readonly toHoloFuncs: TranslateFunc<TProvider, THolo>[],
        options: FieldTranslatorOptions<THolo, TProvider> = {}
    ) {
        const {
            fromHoloGuards = [], toHoloGuards = [], name = 'FieldTranslator', skipValidation = true,
            defaultFromHoloValues = {}, defaultToHoloValues = {}
        } = options;
        this.name = name;

        this.fromHoloPipeline = new TranslatorPipeline(holoValidator, providerValidator, fromHoloFuncs, {
            guards: fromHoloGuards,
            name: `${this.name}.fromHolo`,
            defaultValues: defaultFromHoloValues,
            skipValidation
        });
        this.toHoloPipeline = new TranslatorPipeline(providerValidator, holoValidator, toHoloFuncs, {
            guards: toHoloGuards,
            name: `${this.name}.toHolo`,
            defaultValues: defaultToHoloValues,
            skipValidation
        });
    }

    async fromHolo(source: THolo): Promise<Partial<TProvider>> {
        return await this.fromHoloPipeline.translate(source);
    }

    async fromHoloArray(items: THolo[] | undefined): Promise<TProvider[]> {
        return await this.fromHoloPipeline.translateArray(items);
    }

    async toHolo(target: TProvider): Promise<Partial<THolo>> {
        return await this.toHoloPipeline.translate(target);
    }

    async toHoloArray(items: TProvider[] | undefined): Promise<THolo[]> {
        return await this.toHoloPipeline.translateArray(items);
    }
}

export function createTranslateFunc<TSource extends {}, TTarget, TSourceField, TTargetField>(
    translate: (value: TSourceField) => Promise<TTargetField>,
    sourceKey: keyof TSource | null,
    targetKey: keyof TTarget | null = (sourceKey as unknown) as keyof TTarget,
    name = 'createdTranslateFunc'
): TranslateFunc<TSource, TTarget> {
    return async (source: TSource): Promise<Partial<TTarget>> => {

        try {
            logger.debug(`[${name}] Running...`);
            if (sourceKey !== null && (!(sourceKey in source) || source[sourceKey] == null)) {
                return {};
            }

            // Run the transformation function
            const transformedValue = await translate(sourceKey === null ? source as unknown as TSourceField : source[sourceKey] as TSourceField);
            logger.debug(`Transformed value: ${JSON.stringify(transformedValue, null, 2)}`);
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
        } catch (e) {
            logger.error(`[${name}] Error running: ${(e as Error).message}`);
            return {};
        }

    };
}

export type TranslateFunc<TSource, TTarget> =
    (source: TSource) => Promise<Partial<TTarget>>;

export class TranslatorGuard<TSource> {
    constructor(
        protected readonly name: string,
        protected readonly filter: (source: TSource) => Promise<boolean>,
        protected readonly failQuietly = true
    ) {
    }

    async guard(source: TSource): Promise<boolean> {
        if (await this.filter(source)) return true;
        if (this.failQuietly) return false;

        throw new Error(`Guard ${this.name} failed`);
    }
}

export interface TranslatorPipelineOptions<TSource, TTarget> {
    name: string;
    guards?: TranslatorGuard<TSource>[];
    defaultValues?: Partial<TTarget>;
    skipValidation?: boolean;
}

export class TranslatorPipeline<TSource, TTarget> {
    // private optionalTargetValidator;
    protected readonly guards = [] as TranslatorGuard<TSource>[];
    protected readonly name;
    protected readonly defaultValues: Partial<TTarget>;
    protected readonly skipValidation: boolean;

    constructor(
        protected readonly sourceValidator: Type<TSource>,
        protected readonly targetValidator: Type<TTarget>,
        protected readonly translators: TranslateFunc<TSource, TTarget>[],
        options: TranslatorPipelineOptions<TSource, TTarget>,
    ) {
        const {name, guards = [], defaultValues = {}, skipValidation = true} = options;
        this.name = name;
        this.guards = guards;
        this.defaultValues = defaultValues;
        this.skipValidation = skipValidation;
    }

    async filter(source: TSource): Promise<boolean> {
        const results = await Promise.all(this.guards.map(async g => g.guard(source)));
        return (results.every(r => r));
    }

    async translate(source: TSource | undefined | null, failQuietly = true): Promise<Partial<TTarget>> {
        if (!source) return {};
        if (!await this.filter(source)) {
            logger.error(`[${this.name}] Filter failed`);
        }

        let translate = this.sourceValidator.pipe(async (validatedSource: TSource): Promise<TTarget> => {
            const results = await Promise.all(
                this.translators.map(async t => {
                    try {
                        return await t(validatedSource);
                    } catch {
                        return {}
                    }
                })
            );
            const target = Object.assign({}, this.defaultValues, validatedSource as any, ...results);
            return target as TTarget;
        });

        let result: any = await translate(source);

        if (!this.skipValidation) {
            result = this.targetValidator.onUndeclaredKey('delete')(result);
        }

        if (result instanceof ArkErrors) {
            //TODO: Send off to logging
            logger.error(`Error running ${this.name}: ${result.summary}`);
            if (!failQuietly) {
                throw new Error(`Invalid ${this.name}: ${result.summary}`);
            }
            return {};
        }

        return result as TTarget;
    }

    async translateArray(items: TSource[] | undefined, failQuietly = true): Promise<TTarget[]> {
        if (!items?.length) return [];

        const results = await Promise.all(items.map(item =>
            this.translate(item, failQuietly))); // Remove .bind(this)

        return results.filter(item => Object.keys(item).length > 0) as TTarget[];
    }
}
