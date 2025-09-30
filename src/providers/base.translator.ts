import {ArkErrors, Type} from "arktype";
import {ClassLogger} from "../types/class.logger";


export type TranslateOptions = {
    /** true: THolo -> TProvider; false: TProvider -> THolo */
    fromHolo?: boolean;
    /** validate & strip undeclared keys on the target */
    validateTarget?: boolean;
    /** when validation fails, return {} instead of throwing */
    failQuietly?: boolean;
};

export abstract class BaseTranslator<THolo, TProvider> extends ClassLogger {

    protected abstract holoValidator: Type<THolo>;
    protected abstract providerValidator: Type<TProvider>;
    protected abstract holoDefaults: any;
    protected abstract providerDefaults: any;

    protected constructor() {
        super();
    }

    async translate<TSource, TTarget>(source: TSource, options: TranslateOptions): Promise<Partial<TTarget>> {
        const {fromHolo = true, validateTarget = false, failQuietly = true} = options;
        const methodName = `${this.__className}.${fromHolo ? 'fromHolo' : 'toHolo'}`;
        const sValidator = fromHolo ? this.holoValidator : this.providerValidator;
        const tValidator = fromHolo ? this.providerValidator : this.holoValidator;
        const defaults = fromHolo ? this.providerDefaults : this.holoDefaults;

        let validatedSource: ArkErrors | TSource = sValidator(source) as ArkErrors | TSource;
        if (validatedSource instanceof ArkErrors) {
            this.log.error(`Source validation failed: ${validatedSource.summary}`, {methodName})
            if (!failQuietly) {
                throw new Error(`[${methodName}] Source validation failed: ${validatedSource.summary}`);
            }
            validatedSource = source as TSource;
        }

        // 2) Run the direction-specific implementation
        const partial: Partial<TTarget> = fromHolo
            ? (await this.fromHoloImpl(validatedSource as unknown as THolo)) as unknown as Partial<TTarget>
            : (await this.toHoloImpl(validatedSource as unknown as TProvider)) as unknown as Partial<TTarget>;

        // 3) Merge defaults → impl result (do NOT merge the source)
        const merged: Partial<TTarget> = {
            ...(defaults ?? {}),
            ...(partial ?? {}),
        };

        if (validateTarget) {
            const cleanedOrErrors = tValidator.onUndeclaredKey('delete')(merged);
            if (cleanedOrErrors instanceof ArkErrors) {
                //TODO: Send off to logging
                this.log.error(`Target validation failed: ${cleanedOrErrors.summary}`, {methodName})
                if (!failQuietly) {
                    throw new Error(`Error while running ${methodName}: ${cleanedOrErrors.summary}`);
                }
                return {};
            }
            return cleanedOrErrors as Partial<TTarget>;
        }

        return merged;
    }


    async translateArray<TSource, TTarget>(items: TSource[] | undefined, options: TranslateOptions): Promise<TTarget[]> {
        if (!items?.length) return [];

        const results = await Promise.all(items.map(item =>
            this.translate(item, options))); // Remove .bind(this)

        return results.filter(item => Object.keys(item).length > 0) as TTarget[];
    }

    protected abstract fromHoloImpl(source: THolo): Promise<Partial<TProvider>>;

    protected abstract toHoloImpl(source: TProvider): Promise<Partial<THolo>>;

    async fromHolo(source: THolo, validateTarget = false): Promise<Partial<TProvider>> {
        return await this.translate<THolo, TProvider>(source, {fromHolo: true, validateTarget});
    }

    async fromHoloArray(items: THolo[] | undefined, validateTarget = false): Promise<TProvider[]> {
        return await this.translateArray<THolo, TProvider>(items, {fromHolo: true, validateTarget});
    }

    async toHolo(target: TProvider, validateTarget = false): Promise<Partial<THolo>> {
        return await this.translate<TProvider, THolo>(target, {fromHolo: false, validateTarget});
    }

    async toHoloArray(items: TProvider[] | undefined, validateTarget = false): Promise<THolo[]> {
        return await this.translateArray(items, {fromHolo: false, validateTarget});
    }
}
