import type {TranslateOptions} from "@holokai/holo-types/provider";
import {ClassLogger} from "../../core";


export abstract class BaseTranslator<THolo, TProvider> extends ClassLogger {

    protected abstract holoDefaults: any;
    protected abstract providerDefaults: any;

    async translate<TSource, TTarget>(source: TSource, options: TranslateOptions): Promise<Partial<TTarget>> {
        const {fromHolo = true} = options;
        const defaults = fromHolo ? this.providerDefaults : this.holoDefaults;

        const partial: Partial<TTarget> = fromHolo
            ? (await this.fromHoloImpl(source as unknown as THolo)) as unknown as Partial<TTarget>
            : (await this.toHoloImpl(source as unknown as TProvider)) as unknown as Partial<TTarget>;

        return {
            ...(defaults ?? {}),
            ...(partial ?? {}),
        };
    }


    async translateArray<TSource, TTarget>(items: TSource[] | undefined, options: TranslateOptions): Promise<TTarget[]> {
        if (!items?.length) return [];

        const results = await Promise.all(items.map(item =>
            this.translate(item, options))); // Remove .bind(this)

        return results.filter(item => Object.keys(item).length > 0) as TTarget[];
    }

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

    protected abstract fromHoloImpl(source: THolo): Promise<Partial<TProvider>>;

    protected abstract toHoloImpl(source: TProvider): Promise<Partial<THolo>>;
}
