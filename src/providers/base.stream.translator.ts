// BaseStreamTranslator.ts
import {ArkErrors, Type} from "arktype";
import {ClassLogger} from "../types/class.logger";
import {TranslateOptions} from "./base.translator";

export abstract class BaseStreamTranslator<THolo, TProvider> extends ClassLogger {
    /** Validators for single streaming chunks (not full messages) */
    protected abstract holoValidator: Type<THolo>;
    protected abstract providerValidator: Type<TProvider>;
    protected abstract providerDefaults: Partial<TProvider>;
    protected abstract holoDefaults: Partial<THolo>;

    protected constructor() {
        super();
    }

    /**
     * Translate a single streaming chunk to 0..N target chunks.
     * - Validates the source (as a complete chunk of its type).
     * - Does NOT merge defaults (deltas are partial by design).
     * - Optionally validates each emitted target chunk and strips undeclared keys.
     */
    async translateMany<TSource, TTarget>(
        source: TSource,
        options: TranslateOptions
    ): Promise<Partial<TTarget>[]> {
        const {
            fromHolo = true,
            validateTarget = false,
            failQuietly = true,
        } = options;

        const methodName = `${fromHolo ? "fromHoloMany" : "toHoloMany"}`;
        const sValidator = fromHolo ? this.holoValidator : this.providerValidator;
        const tValidator = fromHolo ? this.providerValidator : this.holoValidator;
        const defaults = (fromHolo ? this.providerDefaults : this.holoDefaults) ?? {};

        // 1) Validate source best-effort
        let validatedSource: ArkErrors | TSource = sValidator(source) as ArkErrors | TSource;
        if (validatedSource instanceof ArkErrors) {
            this.log.error(`Source validation failed: ${validatedSource.summary}`, {methodName});
            if (!failQuietly) {
                throw new Error(`[${methodName}] Source validation failed: ${validatedSource.summary}`);
            }
            validatedSource = source as TSource;
        }

        // 2) Impl: single → many
        const emitted: Partial<TTarget>[] = fromHolo
            ? await this.fromHoloManyImpl(validatedSource as unknown as THolo) as unknown as Partial<TTarget>[]
            : await this.toHoloManyImpl(validatedSource as unknown as TProvider) as unknown as Partial<TTarget>[];

        if (!Array.isArray(emitted) || emitted.length === 0) return [];

        // 3) Apply defaults per item
        const withDefaults = emitted.map(item => ({...defaults, ...(item ?? {})}));

        // 4) Optional per-item validation & undeclared-key stripping
        if (!validateTarget) {
            // Drop empties
            return withDefaults.filter(o => o && Object.keys(o).length > 0);
        }

        const cleaned: Partial<TTarget>[] = [];
        for (const item of withDefaults) {
            const result = tValidator.onUndeclaredKey("delete")(item as object);
            if (result instanceof ArkErrors) {
                this.log.error(`Target validation failed: ${result.summary}`, {methodName});
                if (!failQuietly) {
                    throw new Error(`Error while running ${methodName}: ${result.summary}`);
                }
                // failQuietly → drop this emission
                continue;
            }
            const obj = result as Partial<TTarget>;
            if (obj && Object.keys(obj).length > 0) cleaned.push(obj);
        }

        return cleaned;
    }

    /**
     * Batch helper: many sources → flattened output stream.
     */
    async translateManyArray<TSource, TTarget>(
        items: TSource[] | undefined,
        options: TranslateOptions
    ): Promise<Partial<TTarget>[]> {
        if (!items?.length) return [];
        const batches = await Promise.all(items.map(item => this.translateMany<TSource, TTarget>(item, options)));
        return batches.flat().filter(o => o && Object.keys(o).length > 0);
    }

    // Abstract impls must emit arrays (0..N) for streaming semantics.
    protected abstract fromHoloManyImpl(source: THolo): Promise<Partial<TProvider>[]>;

    protected abstract toHoloManyImpl(source: TProvider): Promise<Partial<THolo>[]>;

    // Convenience wrappers
    async fromHoloMany(source: THolo, validateTarget = false): Promise<Partial<TProvider>[]> {
        return this.translateMany<THolo, TProvider>(source, {fromHolo: true, validateTarget});
    }

    async fromHoloManyArray(items: THolo[] | undefined, validateTarget = false): Promise<Partial<TProvider>[]> {
        return this.translateManyArray<THolo, TProvider>(items, {fromHolo: true, validateTarget});
    }

    async toHoloMany(target: TProvider, validateTarget = false): Promise<Partial<THolo>[]> {
        return this.translateMany<TProvider, THolo>(target, {fromHolo: false, validateTarget});
    }

    async toHoloManyArray(items: TProvider[] | undefined, validateTarget = false): Promise<Partial<THolo>[]> {
        return this.translateManyArray<TProvider, THolo>(items, {fromHolo: false, validateTarget});
    }
}
