import type {TranslateOptions} from "@holokai/types/provider";

export abstract class StreamTranslator<THolo, TProvider> {
    /** Validators for single streaming chunks (not full messages) */
    protected abstract providerDefaults: Partial<TProvider>;
    protected abstract holoDefaults: Partial<THolo>;

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
            fromHolo = true
        } = options;

        const defaults = (fromHolo ? this.providerDefaults : this.holoDefaults) ?? {};

        // 2) Impl: single → many
        const emitted: Partial<TTarget>[] = fromHolo
            ? await this.fromHoloManyImpl(source as unknown as THolo) as unknown as Partial<TTarget>[]
            : await this.toHoloManyImpl(source as unknown as TProvider) as unknown as Partial<TTarget>[];

        if (!Array.isArray(emitted) || emitted.length === 0) return [];

        // 3) Apply defaults per item
        const withDefaults = emitted.map(item => ({...defaults, ...(item ?? {})}));

        const cleaned: Partial<TTarget>[] = [];
        for (const item of withDefaults) {
            const obj = item as Partial<TTarget>;
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

    // Abstract impls must emit arrays (0..N) for streaming semantics.
    protected abstract fromHoloManyImpl(source: THolo): Promise<Partial<TProvider>[]>;

    protected abstract toHoloManyImpl(source: TProvider): Promise<Partial<THolo>[]>;
}
