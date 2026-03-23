import type {HoloStreamEvent} from '@holokai/holo-types/holo';

export function makeEvents(events: HoloStreamEvent[]) {
    let i = 0;
    return {
        async next() {
            if (i >= events.length) return {done: true as const, value: undefined};
            return {done: false as const, value: events[i++]!};
        },
        async return() {
            return {done: true as const, value: undefined};
        },
        async throw(e: unknown) {
            throw e;
        },
        [Symbol.asyncIterator]() {
            return this;
        },
        [Symbol.asyncDispose]() {
            return Promise.resolve();
        },
    } as AsyncGenerator<HoloStreamEvent>;
}

export function makeBlockingEvents(): {
    generator: AsyncGenerator<HoloStreamEvent>;
    resolve: () => void;
} {
    let resolveRef: (() => void) | undefined;
    const generator = {
        async next(): Promise<IteratorResult<HoloStreamEvent>> {
            await new Promise<void>((r) => {
                resolveRef = r;
            });
            return {done: true as const, value: undefined};
        },
        async return() {
            return {done: true as const, value: undefined};
        },
        async throw(e: unknown) {
            throw e;
        },
        [Symbol.asyncIterator]() {
            return this;
        },
        [Symbol.asyncDispose]() {
            return Promise.resolve();
        },
    } as AsyncGenerator<HoloStreamEvent>;

    return {
        generator, resolve() {
            resolveRef?.();
        }
    };
}
