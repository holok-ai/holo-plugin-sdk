import {type} from "arktype";
import logger from "../utils/logger";

export * from './claude/claude.auditor';
export * from './ollama/ollama.auditor';
export * from './openai/openai.auditor';

export type Translator<TSource, TTarget> =
    (source: TSource) => Promise<Partial<TTarget>> | Partial<TTarget> | Promise<type.errors[]> | type.errors[];

export function translate<TSource, TTarget>(
    sourceValidator: type<TSource>,
    targetValidator: type<TTarget>,
    translators: Translator<TSource, TTarget>[]
) {
    const result = sourceValidator.pipe(async (source: TSource): Promise<TTarget> => {
        const results = await Promise.all(
            translators.map(translator => translator(source))
        );

        return Object.assign({}, source as any, ...results) as TTarget;
    }).to(targetValidator.onUndeclaredKey('delete'));

    if (result instanceof type.errors) {
        logger.error('Error running translation pipeline', result.summary);
        throw new Error(`Invalid translation pipeline: ${result.summary}`);
    }

    return result;
}
